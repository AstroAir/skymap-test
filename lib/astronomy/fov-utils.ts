/**
 * FOV (Field of View) utility functions
 * Pure functions for converting between FOV degrees and slider values
 */

/**
 * Convert FOV (degrees) to a slider value (0-100) using logarithmic scale
 * Logarithmic mapping provides better UX for astronomical zoom ranges
 */
export function fovToSlider(fov: number, minFov: number, maxFov: number): number {
  const minLog = Math.log(minFov);
  const maxLog = Math.log(maxFov);
  const clampedFov = Math.max(minFov, Math.min(maxFov, fov));
  return ((Math.log(clampedFov) - minLog) / (maxLog - minLog)) * 100;
}

/**
 * Convert a slider value (0-100) back to FOV (degrees) using logarithmic scale
 */
export function sliderToFov(value: number, minFov: number, maxFov: number): number {
  const minLog = Math.log(minFov);
  const maxLog = Math.log(maxFov);
  return Math.exp(minLog + (value / 100) * (maxLog - minLog));
}

/**
 * Format FOV for display: 2 decimals if < 1°, 1 decimal otherwise
 */
export function formatFov(fov: number): string {
  return fov < 1 ? fov.toFixed(2) : fov.toFixed(1);
}
