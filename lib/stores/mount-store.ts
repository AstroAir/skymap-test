import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getZustandStorage } from '@/lib/storage';
import type {
  MountInfo,
  ProfileInfo,
  MountConnectionConfig,
  MountCapabilities,
} from '@/lib/core/types';
import {
  type MountSafetyConfig,
  DEFAULT_MOUNT_SAFETY_CONFIG,
} from '@/lib/astronomy/mount-safety';

export const DEFAULT_CONNECTION_CONFIG: MountConnectionConfig = {
  protocol: 'simulator',
  host: 'localhost',
  port: 11111,
  deviceId: 0,
};

const DEFAULT_CAPABILITIES: MountCapabilities = {
  canSlew: false,
  canSlewAsync: false,
  canSync: false,
  canPark: false,
  canUnpark: false,
  canSetTracking: false,
  canMoveAxis: false,
  canPulseGuide: false,
  alignmentMode: '',
  equatorialSystem: '',
};

interface MountStoreState {
  mountInfo: MountInfo;
  profileInfo: ProfileInfo;
  sequenceRunning: boolean;
  currentTab: string;
  safetyConfig: MountSafetyConfig;

  // Connection & capabilities
  connectionConfig: MountConnectionConfig;
  capabilities: MountCapabilities;

  // Actions
  setMountInfo: (info: Partial<MountInfo>) => void;
  setMountCoordinates: (ra: number, dec: number) => void;
  setMountConnected: (connected: boolean) => void;
  setProfileInfo: (info: Partial<ProfileInfo>) => void;
  setSequenceRunning: (running: boolean) => void;
  setCurrentTab: (tab: string) => void;
  setSafetyConfig: (config: Partial<MountSafetyConfig>) => void;
  resetSafetyConfig: () => void;

  // New actions
  setConnectionConfig: (config: Partial<MountConnectionConfig>) => void;
  setCapabilities: (caps: MountCapabilities) => void;

  /** Batch-update mount info from a polling state snapshot */
  applyMountState: (state: {
    connected: boolean;
    ra: number;
    dec: number;
    tracking: boolean;
    trackingRate: 'sidereal' | 'lunar' | 'solar' | 'stopped';
    slewing: boolean;
    parked: boolean;
    atHome: boolean;
    pierSide: 'east' | 'west' | 'unknown';
    slewRateIndex: number;
  }) => void;

  /** Reset mount info to disconnected defaults */
  resetMountInfo: () => void;
}

export const useMountStore = create<MountStoreState>()(
  persist(
    (set) => ({
      mountInfo: {
        Connected: false,
        Coordinates: {
          RADegrees: 0,
          Dec: 0,
        },
      },
      profileInfo: {
        AstrometrySettings: {
          Latitude: 0,
          Longitude: 0,
          Elevation: 0,
        },
      },
      sequenceRunning: false,
      currentTab: 'showSlew',
      safetyConfig: { ...DEFAULT_MOUNT_SAFETY_CONFIG },
      connectionConfig: { ...DEFAULT_CONNECTION_CONFIG },
      capabilities: { ...DEFAULT_CAPABILITIES },
      
      setMountInfo: (info) => set((state) => ({
        mountInfo: { ...state.mountInfo, ...info }
      })),
      
      setMountCoordinates: (ra, dec) => set((state) => ({
        mountInfo: {
          ...state.mountInfo,
          Coordinates: { RADegrees: ra, Dec: dec }
        }
      })),
      
      setMountConnected: (Connected) => set((state) => ({
        mountInfo: { ...state.mountInfo, Connected }
      })),
      
      setProfileInfo: (info) => set((state) => ({
        profileInfo: { ...state.profileInfo, ...info }
      })),
      
      setSequenceRunning: (sequenceRunning) => set({ sequenceRunning }),
      setCurrentTab: (currentTab) => set({ currentTab }),
      
      setSafetyConfig: (config) => set((state) => ({
        safetyConfig: {
          ...state.safetyConfig,
          ...config,
          meridianFlip: {
            ...state.safetyConfig.meridianFlip,
            ...(config.meridianFlip ?? {}),
          },
        },
      })),
      
      resetSafetyConfig: () => set({
        safetyConfig: { ...DEFAULT_MOUNT_SAFETY_CONFIG },
      }),

      setConnectionConfig: (config) => set((state) => ({
        connectionConfig: { ...state.connectionConfig, ...config },
      })),

      setCapabilities: (caps) => set({ capabilities: caps }),

      applyMountState: (s) => set({
        mountInfo: {
          Connected: s.connected,
          Coordinates: { RADegrees: s.ra, Dec: s.dec },
          Tracking: s.tracking,
          TrackMode: s.trackingRate,
          Slewing: s.slewing,
          Parked: s.parked,
          AtHome: s.atHome,
          PierSide: s.pierSide,
          SlewRateIndex: s.slewRateIndex,
        },
      }),

      resetMountInfo: () => set({
        mountInfo: {
          Connected: false,
          Coordinates: { RADegrees: 0, Dec: 0 },
        },
        capabilities: { ...DEFAULT_CAPABILITIES },
      }),
    }),
    {
      name: 'starmap-mount',
      storage: getZustandStorage(),
      partialize: (state) => ({
        safetyConfig: state.safetyConfig,
        connectionConfig: state.connectionConfig,
      }),
    }
  )
);
