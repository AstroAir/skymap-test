import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getZustandStorage } from '@/lib/storage';
import type { MountInfo, ProfileInfo } from '@/lib/core/types';
import {
  type MountSafetyConfig,
  DEFAULT_MOUNT_SAFETY_CONFIG,
} from '@/lib/astronomy/mount-safety';

interface MountStoreState {
  mountInfo: MountInfo;
  profileInfo: ProfileInfo;
  sequenceRunning: boolean;
  currentTab: string;
  safetyConfig: MountSafetyConfig;
  
  // Actions
  setMountInfo: (info: Partial<MountInfo>) => void;
  setMountCoordinates: (ra: number, dec: number) => void;
  setMountConnected: (connected: boolean) => void;
  setProfileInfo: (info: Partial<ProfileInfo>) => void;
  setSequenceRunning: (running: boolean) => void;
  setCurrentTab: (tab: string) => void;
  setSafetyConfig: (config: Partial<MountSafetyConfig>) => void;
  resetSafetyConfig: () => void;
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
    }),
    {
      name: 'starmap-mount',
      storage: getZustandStorage(),
      partialize: (state) => ({
        safetyConfig: state.safetyConfig,
      }),
    }
  )
);
