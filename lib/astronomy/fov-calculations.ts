/**
 * FOV (Field of View) calculation utilities
 * Pure functions for camera FOV, mosaic coverage, and overlay dimension calculations
 */

import type { MosaicSettings } from '@/lib/stores';

// ============================================================================
// Camera FOV Calculations
// ============================================================================

/**
 * Calculate camera field of view in degrees from sensor dimensions and focal length
 */
export function calculateCameraFov(
  sensorWidth: number,
  sensorHeight: number,
  focalLength: number
): { width: number; height: number } {
  return {
    width: (2 * Math.atan(sensorWidth / (2 * focalLength)) * 180) / Math.PI,
    height: (2 * Math.atan(sensorHeight / (2 * focalLength)) * 180) / Math.PI,
  };
}

/**
 * Calculate image scale in arcseconds per pixel
 */
export function calculateImageScale(pixelSize: number, focalLength: number): number {
  return (206.265 * pixelSize) / focalLength;
}

/**
 * Calculate sensor resolution in pixels from physical dimensions and pixel size
 */
export function calculateSensorResolution(
  sensorWidth: number,
  sensorHeight: number,
  pixelSize: number
): { width: number; height: number } {
  return {
    width: Math.round((sensorWidth * 1000) / pixelSize),
    height: Math.round((sensorHeight * 1000) / pixelSize),
  };
}

// ============================================================================
// Mosaic Calculations
// ============================================================================

/** Mosaic coverage result */
export interface MosaicCoverage {
  width: number;
  height: number;
  totalPanels: number;
}

/**
 * Calculate total mosaic coverage in degrees
 */
export function calculateMosaicCoverage(
  fovWidth: number,
  fovHeight: number,
  mosaic: MosaicSettings,
  resolution: { width: number; height: number }
): MosaicCoverage | null {
  if (!mosaic.enabled) return null;
  const overlapFactor = mosaic.overlapUnit === 'percent'
    ? (1 - mosaic.overlap / 100)
    : (1 - mosaic.overlap / (resolution.width / mosaic.cols));
  return {
    width: fovWidth * mosaic.cols * overlapFactor + fovWidth * (1 - overlapFactor),
    height: fovHeight * mosaic.rows * overlapFactor + fovHeight * (1 - overlapFactor),
    totalPanels: mosaic.rows * mosaic.cols,
  };
}

// ============================================================================
// Overlay Dimension Calculations
// ============================================================================

/** Overlay dimension result for rendering */
export interface OverlayDimensions {
  /** Single panel width in pixels */
  panelWidthPx: number;
  /** Single panel height in pixels */
  panelHeightPx: number;
  /** Total mosaic width in pixels */
  totalMosaicWidthPx: number;
  /** Total mosaic height in pixels */
  totalMosaicHeightPx: number;
  /** Whether the FOV is too large to display */
  isTooLarge: boolean;
  /** Scale factor applied for clamping */
  scale: number;
  /** Scaled panel width */
  scaledPanelWidth: number;
  /** Scaled panel height */
  scaledPanelHeight: number;
  /** Scaled horizontal step between panels */
  scaledStepX: number;
  /** Scaled vertical step between panels */
  scaledStepY: number;
  /** Scaled total width */
  scaledTotalWidth: number;
  /** Scaled total height */
  scaledTotalHeight: number;
  /** Camera FOV width in degrees */
  cameraFovWidth: number;
  /** Camera FOV height in degrees */
  cameraFovHeight: number;
}

/**
 * Calculate all overlay pixel dimensions for rendering the FOV rectangle
 */
export function calculateOverlayDimensions(
  sensorWidth: number,
  sensorHeight: number,
  focalLength: number,
  currentFov: number,
  containerWidth: number,
  containerHeight: number,
  mosaic: MosaicSettings,
  pixelSize?: number
): OverlayDimensions {
  // Calculate camera FOV in degrees
  const { width: cameraFovWidth, height: cameraFovHeight } =
    calculateCameraFov(sensorWidth, sensorHeight, focalLength);

  // Calculate the view's vertical FOV using proper perspective math
  const safeHeight = Math.max(containerHeight, 1);
  const viewAspect = containerWidth / safeHeight;
  const deg2rad = Math.PI / 180;
  const horizontalFovRad = currentFov * deg2rad;
  const verticalFovRad = viewAspect > 0
    ? 2 * Math.atan(Math.tan(horizontalFovRad / 2) / viewAspect)
    : horizontalFovRad;
  const viewFovVerticalDeg = (verticalFovRad * 180) / Math.PI;

  // Scale camera frame by degree ratios to match background imagery
  const overlayWidthPx = containerWidth * (cameraFovWidth / currentFov);
  const overlayHeightPx = safeHeight * (cameraFovHeight / viewFovVerticalDeg);

  // Calculate mosaic dimensions
  const mosaicCols = mosaic.enabled ? mosaic.cols : 1;
  const mosaicRows = mosaic.enabled ? mosaic.rows : 1;
  let overlapFactor: number;
  if (mosaic.overlapUnit === 'pixels' && pixelSize && pixelSize > 0) {
    const resolutionWidth = Math.round((sensorWidth * 1000) / pixelSize);
    overlapFactor = 1 - mosaic.overlap / (resolutionWidth / mosaicCols);
  } else {
    overlapFactor = 1 - mosaic.overlap / 100;
  }

  const panelWidthPx = overlayWidthPx;
  const panelHeightPx = overlayHeightPx;

  const totalMosaicWidthPx = panelWidthPx * (1 + (mosaicCols - 1) * overlapFactor);
  const totalMosaicHeightPx = panelHeightPx * (1 + (mosaicRows - 1) * overlapFactor);

  // Check if FOV is too large to display
  const isTooLarge = totalMosaicWidthPx > containerWidth || totalMosaicHeightPx > containerHeight;

  // Clamp overlay size to reasonable bounds
  const clampedWidth = Math.min(containerWidth * 0.95, Math.max(20, totalMosaicWidthPx));
  const clampedHeight = Math.min(containerHeight * 0.95, Math.max(20, totalMosaicHeightPx));

  // Calculate scale factor for clamped display
  const scaleX = clampedWidth / totalMosaicWidthPx;
  const scaleY = clampedHeight / totalMosaicHeightPx;
  const scale = Math.min(scaleX, scaleY, 1);

  // Scaled panel dimensions
  const scaledPanelWidth = panelWidthPx * scale;
  const scaledPanelHeight = panelHeightPx * scale;
  const scaledStepX = scaledPanelWidth * overlapFactor;
  const scaledStepY = scaledPanelHeight * overlapFactor;
  const scaledTotalWidth = scaledPanelWidth + scaledStepX * (mosaicCols - 1);
  const scaledTotalHeight = scaledPanelHeight + scaledStepY * (mosaicRows - 1);

  return {
    panelWidthPx,
    panelHeightPx,
    totalMosaicWidthPx,
    totalMosaicHeightPx,
    isTooLarge,
    scale,
    scaledPanelWidth,
    scaledPanelHeight,
    scaledStepX,
    scaledStepY,
    scaledTotalWidth,
    scaledTotalHeight,
    cameraFovWidth,
    cameraFovHeight,
  };
}

/** Panel position in the mosaic grid */
export interface MosaicPanel {
  x: number;
  y: number;
  isCenter: boolean;
}

/**
 * Generate mosaic panel positions for rendering
 */
export function calculateMosaicLayout(
  scaledPanelWidth: number,
  scaledPanelHeight: number,
  scaledStepX: number,
  scaledStepY: number,
  mosaicCols: number,
  mosaicRows: number
): MosaicPanel[] {
  const panels: MosaicPanel[] = [];
  for (let row = 0; row < mosaicRows; row++) {
    for (let col = 0; col < mosaicCols; col++) {
      const x = col * scaledStepX;
      const y = row * scaledStepY;
      const isCenter = mosaicCols > 1 || mosaicRows > 1
        ? (col === Math.floor((mosaicCols - 1) / 2) && row === Math.floor((mosaicRows - 1) / 2))
        : true;
      panels.push({ x, y, isCenter });
    }
  }
  return panels;
}
