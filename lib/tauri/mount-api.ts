/**
 * TypeScript API wrapper for Rust mount control commands
 * Provides typed access to mount operations via Tauri IPC
 */

import { isTauri } from '@/lib/storage/platform';

// ============================================================================
// Types (mirror Rust types)
// ============================================================================

export type MountProtocol = 'alpaca' | 'simulator';

export interface ConnectionConfig {
  protocol: MountProtocol;
  host: string;
  port: number;
  deviceId: number;
}

export type TrackingRate = 'sidereal' | 'lunar' | 'solar' | 'stopped';

export type PierSide = 'east' | 'west' | 'unknown';

export type MountAxis = 'primary' | 'secondary';

export interface MountState {
  connected: boolean;
  ra: number;
  dec: number;
  tracking: boolean;
  trackingRate: TrackingRate;
  slewing: boolean;
  parked: boolean;
  atHome: boolean;
  pierSide: PierSide;
  slewRateIndex: number;
}

export interface MountCapabilities {
  canSlew: boolean;
  canSlewAsync: boolean;
  canSync: boolean;
  canPark: boolean;
  canUnpark: boolean;
  canSetTracking: boolean;
  canMoveAxis: boolean;
  canPulseGuide: boolean;
  alignmentMode: string;
  equatorialSystem: string;
}

export interface DiscoveredDevice {
  host: string;
  port: number;
  deviceId: number;
  deviceName: string;
  deviceType: string;
}

export interface SlewRatePreset {
  label: string;
  value: number;
}

export interface ObservingConditions {
  cloudCover?: number;
  humidity?: number;
  windSpeed?: number;
  dewPoint?: number;
}

export interface SafetyState {
  isSafe: boolean;
  source: string;
}

export const SLEW_RATE_PRESETS: SlewRatePreset[] = [
  { label: '1x', value: 1.0 },
  { label: '2x', value: 2.0 },
  { label: '8x', value: 8.0 },
  { label: '16x', value: 16.0 },
  { label: '64x', value: 64.0 },
  { label: 'Max', value: 800.0 },
];

export const DEFAULT_CONNECTION_CONFIG: ConnectionConfig = {
  protocol: 'simulator',
  host: 'localhost',
  port: 11111,
  deviceId: 0,
};

// ============================================================================
// Lazy invoke helper
// ============================================================================

async function getInvoke() {
  if (!isTauri()) {
    throw new Error('Mount API is only available in Tauri desktop environment');
  }
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke;
}

// ============================================================================
// Mount API
// ============================================================================

export const mountApi = {
  /**
   * Connect to a mount device
   * Returns the device capabilities on success
   */
  async connect(config: ConnectionConfig): Promise<MountCapabilities> {
    const invoke = await getInvoke();
    return invoke('mount_connect', {
      protocol: config.protocol,
      host: config.host,
      port: config.port,
      deviceId: config.deviceId,
    });
  },

  /** Disconnect from the current mount */
  async disconnect(): Promise<void> {
    const invoke = await getInvoke();
    return invoke('mount_disconnect');
  },

  /** Get the current mount state snapshot */
  async getState(): Promise<MountState> {
    const invoke = await getInvoke();
    return invoke('mount_get_state');
  },

  /** Get device capabilities */
  async getCapabilities(): Promise<MountCapabilities> {
    const invoke = await getInvoke();
    return invoke('mount_get_capabilities');
  },

  /** Slew to coordinates (RA/Dec in degrees) */
  async slewTo(ra: number, dec: number): Promise<void> {
    const invoke = await getInvoke();
    return invoke('mount_slew_to', { ra, dec });
  },

  /** Sync mount to coordinates (RA/Dec in degrees) */
  async syncTo(ra: number, dec: number): Promise<void> {
    const invoke = await getInvoke();
    return invoke('mount_sync_to', { ra, dec });
  },

  /** Abort any in-progress slew */
  async abortSlew(): Promise<void> {
    const invoke = await getInvoke();
    return invoke('mount_abort_slew');
  },

  /** Park the mount */
  async park(): Promise<void> {
    const invoke = await getInvoke();
    return invoke('mount_park');
  },

  /** Unpark the mount */
  async unpark(): Promise<void> {
    const invoke = await getInvoke();
    return invoke('mount_unpark');
  },

  /** Enable or disable tracking */
  async setTracking(enabled: boolean): Promise<void> {
    const invoke = await getInvoke();
    return invoke('mount_set_tracking', { enabled });
  },

  /** Set the tracking rate */
  async setTrackingRate(rate: TrackingRate): Promise<void> {
    const invoke = await getInvoke();
    return invoke('mount_set_tracking_rate', { rate });
  },

  /** Move an axis at a given rate multiplier (e.g., 16 = 16x sidereal) */
  async moveAxis(axis: MountAxis, rate: number): Promise<void> {
    const invoke = await getInvoke();
    return invoke('mount_move_axis', { axis, rate });
  },

  /** Stop an axis */
  async stopAxis(axis: MountAxis): Promise<void> {
    const invoke = await getInvoke();
    return invoke('mount_stop_axis', { axis });
  },

  /** Set slew rate index */
  async setSlewRate(index: number): Promise<void> {
    const invoke = await getInvoke();
    return invoke('mount_set_slew_rate', { index });
  },

  /** Discover Alpaca devices on the network */
  async discover(): Promise<DiscoveredDevice[]> {
    const invoke = await getInvoke();
    return invoke('mount_discover');
  },

  /** Read observing conditions from simulator or Alpaca ObservingConditions */
  async getObservingConditions(): Promise<ObservingConditions> {
    const invoke = await getInvoke();
    return invoke('mount_get_observing_conditions');
  },

  /** Read safety monitor status from simulator or Alpaca SafetyMonitor */
  async getSafetyState(): Promise<SafetyState> {
    const invoke = await getInvoke();
    return invoke('mount_get_safety_state');
  },
};
