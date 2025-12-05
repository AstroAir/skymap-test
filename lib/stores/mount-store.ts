import { create } from 'zustand';
import type { MountInfo, ProfileInfo } from '@/lib/core/types';

interface MountStoreState {
  mountInfo: MountInfo;
  profileInfo: ProfileInfo;
  sequenceRunning: boolean;
  currentTab: string;
  
  // Actions
  setMountInfo: (info: Partial<MountInfo>) => void;
  setMountCoordinates: (ra: number, dec: number) => void;
  setMountConnected: (connected: boolean) => void;
  setProfileInfo: (info: Partial<ProfileInfo>) => void;
  setSequenceRunning: (running: boolean) => void;
  setCurrentTab: (tab: string) => void;
}

export const useMountStore = create<MountStoreState>((set) => ({
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
}));
