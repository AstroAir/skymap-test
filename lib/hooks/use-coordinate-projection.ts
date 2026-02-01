/**
 * Unified coordinate projection hook for overlay components
 * Converts RA/Dec celestial coordinates to screen coordinates using gnomonic projection
 * 
 * This hook consolidates the coordinate transformation logic previously duplicated in:
 * - SkyMarkers
 * - SatelliteOverlay
 */

import { useCallback, useRef, useEffect, useState, useMemo } from 'react';
import { useStellariumStore } from '@/lib/stores';
import { useGlobalAnimationLoop } from './use-animation-frame';
import { createLogger } from '@/lib/logger';

const logger = createLogger('use-coordinate-projection');

// ============================================================================
// Types
// ============================================================================

export interface ScreenPosition {
  x: number;
  y: number;
  visible: boolean;
}

export interface CelestialCoordinate {
  ra: number;  // Right Ascension in degrees
  dec: number; // Declination in degrees
}

export interface ProjectedItem<T> {
  item: T;
  x: number;
  y: number;
  visible: boolean;
}

export interface UseCoordinateProjectionOptions {
  /** Container width in pixels */
  containerWidth: number;
  /** Container height in pixels */
  containerHeight: number;
  /** Visibility margin factor (default: 1.1, meaning 10% beyond viewport) */
  visibilityMargin?: number;
}

export interface UseCoordinateProjectionReturn {
  /** Convert a single RA/Dec coordinate to screen position */
  convertToScreen: (ra: number, dec: number) => ScreenPosition | null;
  /** Project multiple items with coordinates to screen positions */
  projectItems: <T extends CelestialCoordinate>(items: T[]) => ProjectedItem<T>[];
  /** Whether the Stellarium engine is ready */
  isReady: boolean;
}

export interface UseBatchProjectionOptions<T> {
  /** Container width in pixels */
  containerWidth: number;
  /** Container height in pixels */
  containerHeight: number;
  /** Items to project */
  items: T[];
  /** Function to extract RA from item */
  getRa: (item: T) => number | undefined;
  /** Function to extract Dec from item */
  getDec: (item: T) => number | undefined;
  /** Whether projection is enabled */
  enabled?: boolean;
  /** Update interval in milliseconds (default: 33ms for ~30fps) */
  intervalMs?: number;
  /** Visibility margin factor (default: 1.1) */
  visibilityMargin?: number;
  /** Animation loop ID for global loop subscription */
  loopId?: string;
}

// ============================================================================
// Core Projection Function
// ============================================================================

/**
 * Creates a coordinate projection function bound to a specific Stellarium instance
 * Uses gnomonic (rectilinear) projection - inverse of getClickCoordinates in StellariumCanvas
 */
export function createCoordinateProjector(
  stel: ReturnType<typeof useStellariumStore.getState>['stel'],
  containerWidth: number,
  containerHeight: number,
  visibilityMargin: number = 1.1
): (ra: number, dec: number) => ScreenPosition | null {
  if (!stel) {
    return () => null;
  }

  return (ra: number, dec: number): ScreenPosition | null => {
    try {
      // Convert degrees to radians
      const raRad = ra * stel.D2R;
      const decRad = dec * stel.D2R;

      // Convert spherical to cartesian (ICRF frame)
      const icrfVec = stel.s2c(raRad, decRad);

      // Convert ICRF to VIEW frame
      const viewVec = stel.convertFrame(stel.observer, 'ICRF', 'VIEW', icrfVec);

      // Check if the point is behind the viewer (z > 0 in VIEW frame means behind)
      if (viewVec[2] > 0) {
        return { x: 0, y: 0, visible: false };
      }

      // Get current FOV and aspect ratio
      const fov = stel.core.fov; // FOV in radians
      const aspect = containerWidth / containerHeight;

      // Gnomonic projection:
      // projX = viewX / (-viewZ), projY = viewY / (-viewZ)
      // Then scale by 1/tan(fov/2) and account for aspect ratio
      const scale = 1 / Math.tan(fov / 2);

      // Project onto the viewing plane
      const projX = viewVec[0] / (-viewVec[2]);
      const projY = viewVec[1] / (-viewVec[2]);

      // Convert to normalized device coordinates
      // ndcX = projX * scale / aspect (to match inverse in getClickCoordinates)
      // ndcY = projY * scale
      const ndcX = (projX * scale) / aspect;
      const ndcY = projY * scale;

      // Check if within visible area (with configurable margin)
      if (Math.abs(ndcX) > visibilityMargin || Math.abs(ndcY) > visibilityMargin) {
        return { x: 0, y: 0, visible: false };
      }

      // Convert to screen coordinates
      // screenX = (ndcX + 1) * 0.5 * width
      // screenY = (1 - ndcY) * 0.5 * height (Y is inverted)
      const screenX = (ndcX + 1) * 0.5 * containerWidth;
      const screenY = (1 - ndcY) * 0.5 * containerHeight;

      return { x: screenX, y: screenY, visible: true };
    } catch (error) {
      logger.error('Error converting coordinates', error);
      return null;
    }
  };
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook for basic coordinate projection
 * Returns a memoized convertToScreen function that updates with container size
 */
export function useCoordinateProjection({
  containerWidth,
  containerHeight,
  visibilityMargin = 1.1,
}: UseCoordinateProjectionOptions): UseCoordinateProjectionReturn {
  const stel = useStellariumStore((state) => state.stel);

  const convertToScreen = useCallback(
    (ra: number, dec: number): ScreenPosition | null => {
      const projector = createCoordinateProjector(
        stel,
        containerWidth,
        containerHeight,
        visibilityMargin
      );
      return projector(ra, dec);
    },
    [stel, containerWidth, containerHeight, visibilityMargin]
  );

  const projectItems = useCallback(
    <T extends CelestialCoordinate>(items: T[]): ProjectedItem<T>[] => {
      const projector = createCoordinateProjector(
        stel,
        containerWidth,
        containerHeight,
        visibilityMargin
      );

      const results: ProjectedItem<T>[] = [];
      for (const item of items) {
        const pos = projector(item.ra, item.dec);
        if (pos) {
          results.push({
            item,
            x: pos.x,
            y: pos.y,
            visible: pos.visible,
          });
        }
      }
      return results;
    },
    [stel, containerWidth, containerHeight, visibilityMargin]
  );

  return {
    convertToScreen,
    projectItems,
    isReady: !!stel,
  };
}

/**
 * Hook for batch projection with automatic updates via global animation loop
 * Optimized for rendering multiple items (markers, satellites, etc.)
 */
export function useBatchProjection<T>({
  containerWidth,
  containerHeight,
  items,
  getRa,
  getDec,
  enabled = true,
  intervalMs = 33, // ~30fps
  visibilityMargin = 1.1,
  loopId = 'batch-projection',
}: UseBatchProjectionOptions<T>): ProjectedItem<T>[] {
  const stel = useStellariumStore((state) => state.stel);
  const [positions, setPositions] = useState<ProjectedItem<T>[]>([]);
  
  // Store items in ref to avoid stale closures
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Throttle timestamp tracking
  const lastUpdateRef = useRef<number>(0);

  // Memoize the update callback
  const updatePositions = useCallback(() => {
    if (!stel || !enabled) {
      setPositions([]);
      return;
    }

    const projector = createCoordinateProjector(
      stel,
      containerWidth,
      containerHeight,
      visibilityMargin
    );

    const currentItems = itemsRef.current;
    const newPositions: ProjectedItem<T>[] = [];

    for (const item of currentItems) {
      const ra = getRa(item);
      const dec = getDec(item);
      
      if (ra !== undefined && dec !== undefined) {
        const screenPos = projector(ra, dec);
        if (screenPos) {
          newPositions.push({
            item,
            x: screenPos.x,
            y: screenPos.y,
            visible: screenPos.visible,
          });
        }
      }
    }

    setPositions(newPositions);
  }, [stel, enabled, containerWidth, containerHeight, visibilityMargin, getRa, getDec]);

  // Subscribe to global animation loop with throttling
  useGlobalAnimationLoop(
    loopId,
    useCallback(
      (_deltaTime: number, timestamp: number) => {
        if (timestamp - lastUpdateRef.current >= intervalMs) {
          lastUpdateRef.current = timestamp;
          updatePositions();
        }
      },
      [updatePositions, intervalMs]
    ),
    enabled && !!stel
  );

  // Return only visible items
  return useMemo(
    () => positions.filter((p) => p.visible),
    [positions]
  );
}
