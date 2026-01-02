/**
 * Geolocation API wrapper for Tauri mobile platforms
 * Provides device location services for Android and iOS
 */

import { isTauri, isMobile } from '@/lib/storage/platform';

export interface Position {
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude: number | null;
    altitudeAccuracy: number | null;
    heading: number | null;
    speed: number | null;
  };
  timestamp: number;
}

export interface PositionOptions {
  enableHighAccuracy: boolean;
  timeout: number;
  maximumAge: number;
}

export type PermissionState = 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale';

export interface PermissionStatus {
  location: PermissionState;
  coarseLocation: PermissionState;
}

export type WatchId = number;

async function getGeolocationPlugin() {
  if (!isTauri() || !isMobile()) {
    throw new Error('Geolocation API is only available on Tauri mobile platforms');
  }
  return import('@tauri-apps/plugin-geolocation');
}

export const geolocationApi = {
  /**
   * Check if geolocation is available (Tauri mobile only)
   */
  isAvailable(): boolean {
    return isTauri() && isMobile();
  },

  /**
   * Check current location permissions
   */
  async checkPermissions(): Promise<PermissionStatus> {
    const plugin = await getGeolocationPlugin();
    return plugin.checkPermissions();
  },

  /**
   * Request location permissions from the user
   */
  async requestPermissions(permissions: ('location' | 'coarseLocation')[] = ['location']): Promise<PermissionStatus> {
    const plugin = await getGeolocationPlugin();
    return plugin.requestPermissions(permissions);
  },

  /**
   * Get current device position
   */
  async getCurrentPosition(options?: PositionOptions): Promise<Position> {
    const plugin = await getGeolocationPlugin();
    return plugin.getCurrentPosition(options);
  },

  /**
   * Watch device position changes
   * Returns a watch ID that can be used to clear the watch
   */
  async watchPosition(
    options: Partial<PositionOptions> | undefined,
    callback: (position: Position | null, error?: string) => void
  ): Promise<WatchId> {
    const plugin = await getGeolocationPlugin();
    const fullOptions: PositionOptions = {
      enableHighAccuracy: options?.enableHighAccuracy ?? true,
      timeout: options?.timeout ?? 10000,
      maximumAge: options?.maximumAge ?? 0,
    };
    return plugin.watchPosition(fullOptions, callback);
  },

  /**
   * Stop watching position changes
   */
  async clearWatch(watchId: WatchId): Promise<void> {
    const plugin = await getGeolocationPlugin();
    return plugin.clearWatch(watchId);
  },

  /**
   * Request permissions and get current position in one call
   * Handles the full permission flow automatically
   */
  async getPositionWithPermission(options?: PositionOptions): Promise<Position | null> {
    if (!this.isAvailable()) {
      console.warn('Geolocation not available on this platform');
      return null;
    }

    try {
      let permissions = await this.checkPermissions();

      if (permissions.location === 'prompt' || permissions.location === 'prompt-with-rationale') {
        permissions = await this.requestPermissions(['location']);
      }

      if (permissions.location === 'granted') {
        return await this.getCurrentPosition(options);
      }

      console.warn('Location permission denied');
      return null;
    } catch (error) {
      console.error('Geolocation error:', error);
      return null;
    }
  },
};

export default geolocationApi;
