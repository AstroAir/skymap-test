/**
 * FOV (Field of View) constants shared across the application
 * Extracted from components/starmap/canvas/constants.ts for reuse
 */

// FOV limits (degrees)
export const MIN_FOV = 0.5;
export const MAX_FOV = 180;
export const DEFAULT_FOV = 60;

// Common zoom presets (FOV in degrees)
export const ZOOM_PRESETS = [
  { fov: 90, labelKey: 'wideField' },
  { fov: 60, labelKey: 'normal' },
  { fov: 30, labelKey: 'medium' },
  { fov: 15, labelKey: 'closeUp' },
  { fov: 5, labelKey: 'detail' },
  { fov: 1, labelKey: 'maxZoom' },
] as const;
