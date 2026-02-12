/**
 * Equipment normalization utilities
 * Converts Tauri (snake_case) and Web (camelCase) equipment data
 * into unified normalized types for UI rendering.
 */

import type { NormalizedTelescope, NormalizedCamera } from '@/types/starmap/management';
import type { Telescope as TauriTelescope, Camera as TauriCamera } from '@/lib/tauri/types';
import type { TelescopePreset, CameraPreset } from '@/lib/stores/equipment-store';

type TelescopeInput = TauriTelescope | TelescopePreset;
type CameraInput = TauriCamera | CameraPreset;

function isTauriTelescope(item: TelescopeInput): item is TauriTelescope {
  return 'focal_length' in item;
}

function isTauriCamera(item: CameraInput): item is TauriCamera {
  return 'sensor_width' in item;
}

/**
 * Normalize telescope data from either Tauri or Web environment
 * into a unified format for rendering.
 */
export function normalizeTelescopes(items: TelescopeInput[], _isTauri: boolean): NormalizedTelescope[] {
  return items.map((item) => {
    if (isTauriTelescope(item)) {
      return {
        id: item.id,
        name: item.name,
        aperture: item.aperture,
        focalLength: item.focal_length,
        focalRatio: item.focal_ratio,
        isDefault: item.is_default,
      };
    }
    const focalRatio = item.aperture > 0 ? item.focalLength / item.aperture : 0;
    return {
      id: item.id,
      name: item.name,
      aperture: item.aperture,
      focalLength: item.focalLength,
      focalRatio,
      isDefault: false,
    };
  });
}

/**
 * Normalize camera data from either Tauri or Web environment
 * into a unified format for rendering.
 */
export function normalizeCameras(items: CameraInput[], _isTauri: boolean): NormalizedCamera[] {
  return items.map((item) => {
    if (isTauriCamera(item)) {
      return {
        id: item.id,
        name: item.name,
        sensorWidth: item.sensor_width,
        sensorHeight: item.sensor_height,
        isDefault: item.is_default,
      };
    }
    return {
      id: item.id,
      name: item.name,
      sensorWidth: item.sensorWidth,
      sensorHeight: item.sensorHeight,
      isDefault: false,
    };
  });
}
