'use client';

import { useEffect, useRef, useCallback, type RefObject } from 'react';
import type A from 'aladin-lite';
import { useMarkerStore, type SkyMarker } from '@/lib/stores/marker-store';
import { useTargetListStore } from '@/lib/stores/target-list-store';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { createLogger } from '@/lib/logger';

type AladinInstance = ReturnType<typeof A.aladin>;
type AladinGraphicOverlay = ReturnType<typeof A.graphicOverlay>;

const logger = createLogger('aladin-overlays');

// ============================================================================
// Hook
// ============================================================================

interface UseAladinOverlaysOptions {
  aladinRef: RefObject<AladinInstance | null>;
  engineReady: boolean;
}

export function useAladinOverlays({
  aladinRef,
  engineReady,
}: UseAladinOverlaysOptions): void {
  const skyEngine = useSettingsStore((state) => state.skyEngine);

  const addMarkerShapes = useCallback((
    overlay: AladinGraphicOverlay,
    marker: SkyMarker,
    AStatic: typeof A
  ) => {
    // The typings in different aladin-lite versions are incomplete.
    const api = AStatic as unknown as {
      circle: (ra: number, dec: number, radiusDeg: number, options?: Record<string, unknown>) => unknown;
      marker?: (ra: number, dec: number, options?: Record<string, unknown>, data?: Record<string, unknown>) => unknown;
      polyline?: (radecArray: number[][], options?: Record<string, unknown>) => unknown;
      polygon?: (radecArray: number[][], options?: Record<string, unknown>) => unknown;
    };

    const radiusDeg = Math.max(0.02, marker.size ? marker.size / 60 : 0.05);
    const delta = Math.max(0.02, radiusDeg * 0.7);
    const style = { color: marker.color, lineWidth: 2 };

    const safeAdd = (shape: unknown) => {
      if (shape) {
        overlay.add(shape as Parameters<AladinGraphicOverlay['add']>[0]);
      }
    };

    switch (marker.icon) {
      case 'pin': {
        if (api.marker) {
          safeAdd(api.marker(marker.ra, marker.dec, { color: marker.color }, { name: marker.name }));
        } else {
          safeAdd(api.circle(marker.ra, marker.dec, radiusDeg, style));
        }
        return;
      }
      case 'circle': {
        safeAdd(api.circle(marker.ra, marker.dec, radiusDeg, style));
        return;
      }
      case 'square': {
        if (api.polygon) {
          safeAdd(api.polygon([
            [marker.ra - delta, marker.dec - delta],
            [marker.ra + delta, marker.dec - delta],
            [marker.ra + delta, marker.dec + delta],
            [marker.ra - delta, marker.dec + delta],
          ], style));
        } else {
          safeAdd(api.circle(marker.ra, marker.dec, radiusDeg, style));
        }
        return;
      }
      case 'diamond': {
        if (api.polygon) {
          safeAdd(api.polygon([
            [marker.ra, marker.dec + delta],
            [marker.ra + delta, marker.dec],
            [marker.ra, marker.dec - delta],
            [marker.ra - delta, marker.dec],
          ], style));
        } else {
          safeAdd(api.circle(marker.ra, marker.dec, radiusDeg, style));
        }
        return;
      }
      case 'triangle': {
        if (api.polygon) {
          safeAdd(api.polygon([
            [marker.ra, marker.dec + delta],
            [marker.ra + delta, marker.dec - delta],
            [marker.ra - delta, marker.dec - delta],
          ], style));
        } else {
          safeAdd(api.circle(marker.ra, marker.dec, radiusDeg, style));
        }
        return;
      }
      case 'crosshair': {
        if (api.polyline) {
          safeAdd(api.polyline([
            [marker.ra - delta, marker.dec],
            [marker.ra + delta, marker.dec],
          ], style));
          safeAdd(api.polyline([
            [marker.ra, marker.dec - delta],
            [marker.ra, marker.dec + delta],
          ], style));
        } else {
          safeAdd(api.circle(marker.ra, marker.dec, radiusDeg, style));
        }
        return;
      }
      case 'flag': {
        if (api.polyline) {
          safeAdd(api.polyline([
            [marker.ra, marker.dec - delta],
            [marker.ra, marker.dec + delta],
          ], style));
          safeAdd(api.polyline([
            [marker.ra, marker.dec + delta],
            [marker.ra + delta, marker.dec + (delta * 0.6)],
            [marker.ra, marker.dec + (delta * 0.2)],
          ], style));
        } else {
          safeAdd(api.circle(marker.ra, marker.dec, radiusDeg, style));
        }
        return;
      }
      case 'star':
      default: {
        if (api.polyline) {
          safeAdd(api.polyline([
            [marker.ra - delta, marker.dec],
            [marker.ra + delta, marker.dec],
          ], style));
          safeAdd(api.polyline([
            [marker.ra, marker.dec - delta],
            [marker.ra, marker.dec + delta],
          ], style));
          safeAdd(api.polyline([
            [marker.ra - delta * 0.7, marker.dec - delta * 0.7],
            [marker.ra + delta * 0.7, marker.dec + delta * 0.7],
          ], style));
          safeAdd(api.polyline([
            [marker.ra + delta * 0.7, marker.dec - delta * 0.7],
            [marker.ra - delta * 0.7, marker.dec + delta * 0.7],
          ], style));
        } else {
          safeAdd(api.circle(marker.ra, marker.dec, radiusDeg, style));
        }
      }
    }
  }, []);

  // Overlay refs — one for markers, one for targets
  const markerOverlayRef = useRef<AladinGraphicOverlay | null>(null);
  const targetOverlayRef = useRef<AladinGraphicOverlay | null>(null);
  const renderMarkersRef = useRef<() => void>(() => {});
  const renderTargetsRef = useRef<() => void>(() => {});

  // Aladin static API ref for shape factories
  const aladinStaticRef = useRef<typeof A | null>(null);

  const clearOverlays = useCallback(() => {
    const aladin = aladinRef.current as (AladinInstance & { removeOverlay?: (overlay: unknown) => void }) | null;

    if (markerOverlayRef.current) {
      try {
        markerOverlayRef.current.removeAll();
      } catch {
        // ignore cleanup failures
      }
      try {
        aladin?.removeOverlay?.(markerOverlayRef.current);
      } catch {
        // ignore optional API failures
      }
      markerOverlayRef.current = null;
    }

    if (targetOverlayRef.current) {
      try {
        targetOverlayRef.current.removeAll();
      } catch {
        // ignore cleanup failures
      }
      try {
        aladin?.removeOverlay?.(targetOverlayRef.current);
      } catch {
        // ignore optional API failures
      }
      targetOverlayRef.current = null;
    }
  }, [aladinRef]);

  // Load static API once
  useEffect(() => {
    if (!engineReady || skyEngine !== 'aladin') return;

    let cancelled = false;
    import('aladin-lite')
      .then((m) => {
        if (cancelled) return;
        aladinStaticRef.current = m.default;
        renderMarkersRef.current();
        renderTargetsRef.current();
      })
      .catch((err) => {
        logger.warn('Failed to load aladin-lite static API for overlays', err);
      });

    return () => {
      cancelled = true;
    };
  }, [engineReady, skyEngine]);

  // Subscribe to marker store changes and render native overlays
  useEffect(() => {
    if (!engineReady || skyEngine !== 'aladin') return;

    const renderMarkers = () => {
      const aladin = aladinRef.current;
      const AStatic = aladinStaticRef.current;
      if (!aladin || !AStatic) return;

      // Create overlay on first use
      if (!markerOverlayRef.current) {
        markerOverlayRef.current = AStatic.graphicOverlay({
          name: 'sky-markers',
          color: '#ef4444',
          lineWidth: 2,
        });
        aladin.addOverlay(markerOverlayRef.current);
      }

      const overlay = markerOverlayRef.current;
      overlay.removeAll();

      const { markers, showMarkers } = useMarkerStore.getState();
      if (!showMarkers) {
        logger.debug('Markers disabled globally, skipped Aladin marker overlay render');
        return;
      }

      for (const marker of markers) {
        if (!marker.visible) continue;
        addMarkerShapes(overlay, marker, AStatic);
      }

      logger.debug(`Rendered ${markers.filter((m: SkyMarker) => m.visible).length} marker overlays`);
    };

    renderMarkersRef.current = renderMarkers;

    // Initial render
    const timer = setTimeout(renderMarkers, 500);

    // Subscribe to marker changes
    const unsub = useMarkerStore.subscribe(renderMarkers);

    return () => {
      clearTimeout(timer);
      unsub();
      if (renderMarkersRef.current === renderMarkers) {
        renderMarkersRef.current = () => {};
      }
    };
  }, [addMarkerShapes, aladinRef, engineReady, skyEngine]);

  // Subscribe to target list and render target position overlays
  useEffect(() => {
    if (!engineReady || skyEngine !== 'aladin') return;

    const renderTargets = () => {
      const aladin = aladinRef.current;
      const AStatic = aladinStaticRef.current;
      if (!aladin || !AStatic) return;

      // Create overlay on first use
      if (!targetOverlayRef.current) {
        targetOverlayRef.current = AStatic.graphicOverlay({
          name: 'target-list',
          color: '#22c55e',
          lineWidth: 1,
        });
        aladin.addOverlay(targetOverlayRef.current);
      }

      const overlay = targetOverlayRef.current;
      overlay.removeAll();

      const { targets, activeTargetId } = useTargetListStore.getState();
      for (const target of targets) {
        const isActive = target.id === activeTargetId;
        const shape = AStatic.circle(
          target.ra,
          target.dec,
          0.08, // small circle for target positions
          {
            color: isActive ? '#f59e0b' : '#22c55e',
            lineWidth: isActive ? 3 : 1,
          }
        );
        overlay.add(shape);
      }

      logger.debug(`Rendered ${targets.length} target overlays`);
    };

    renderTargetsRef.current = renderTargets;

    // Initial render
    const timer = setTimeout(renderTargets, 600);

    // Subscribe to target list changes
    const unsub = useTargetListStore.subscribe(renderTargets);

    return () => {
      clearTimeout(timer);
      unsub();
      if (renderTargetsRef.current === renderTargets) {
        renderTargetsRef.current = () => {};
      }
    };
  }, [aladinRef, engineReady, skyEngine]);

  // Cleanup overlays on engine switch/unmount.
  useEffect(() => {
    if (!engineReady || skyEngine !== 'aladin') {
      clearOverlays();
    }

    return clearOverlays;
  }, [clearOverlays, engineReady, skyEngine]);
}
