/**
 * Equipment normalization utilities
 * Converts Tauri (snake_case) and Web (camelCase) equipment data
 * into unified normalized types for UI rendering.
 */

import type { NormalizedTelescope, NormalizedCamera } from '@/types/starmap/management';

/**
 * Normalize telescope data from either Tauri or Web environment
 * into a unified format for rendering.
 */
export function normalizeTelescopes(items: unknown[], isTauri: boolean): NormalizedTelescope[] {
  return items.map((item) => {
    const t = item as Record<string, unknown>;
    const aperture = t.aperture as number;
    const focalLength = isTauri ? (t.focal_length as number) : (t.focalLength as number);
    return {
      id: t.id as string,
      name: t.name as string,
      aperture,
      focalLength,
      focalRatio: isTauri ? (t.focal_ratio as number) : focalLength / aperture,
      isDefault: isTauri ? (t.is_default as boolean) : false,
    };
  });
}

/**
 * Normalize camera data from either Tauri or Web environment
 * into a unified format for rendering.
 */
export function normalizeCameras(items: unknown[], isTauri: boolean): NormalizedCamera[] {
  return items.map((item) => {
    const c = item as Record<string, unknown>;
    return {
      id: c.id as string,
      name: c.name as string,
      sensorWidth: isTauri ? (c.sensor_width as number) : (c.sensorWidth as number),
      sensorHeight: isTauri ? (c.sensor_height as number) : (c.sensorHeight as number),
      isDefault: isTauri ? (c.is_default as boolean) : false,
    };
  });
}
