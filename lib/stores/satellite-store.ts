import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

export interface TrackedSatellite {
  id: string;
  name: string;
  noradId: number;
  type: 'iss' | 'starlink' | 'weather' | 'gps' | 'communication' | 'scientific' | 'amateur' | 'other';
  altitude: number;
  velocity: number;
  inclination: number;
  period: number;
  ra: number;
  dec: number;
  azimuth?: number;
  elevation?: number;
  magnitude?: number;
  isVisible: boolean;
  source?: string;
}

interface SatelliteState {
  // Display settings
  showSatellites: boolean;
  showLabels: boolean;
  showOrbits: boolean;
  
  // Tracked satellites (for rendering)
  trackedSatellites: TrackedSatellite[];
  
  // Selected satellite for tracking
  selectedSatelliteId: string | null;
  
  // Actions
  setShowSatellites: (show: boolean) => void;
  setShowLabels: (show: boolean) => void;
  setShowOrbits: (show: boolean) => void;
  addTrackedSatellite: (satellite: TrackedSatellite) => void;
  removeTrackedSatellite: (id: string) => void;
  updateTrackedSatellite: (id: string, updates: Partial<TrackedSatellite>) => void;
  setTrackedSatellites: (satellites: TrackedSatellite[]) => void;
  clearTrackedSatellites: () => void;
  setSelectedSatellite: (id: string | null) => void;
}

// ============================================================================
// Store
// ============================================================================

export const useSatelliteStore = create<SatelliteState>()(
  persist(
    (set) => ({
      // Default settings
      showSatellites: false,
      showLabels: true,
      showOrbits: false,
      trackedSatellites: [],
      selectedSatelliteId: null,
      
      // Actions
      setShowSatellites: (show) => set({ showSatellites: show }),
      setShowLabels: (show) => set({ showLabels: show }),
      setShowOrbits: (show) => set({ showOrbits: show }),
      
      addTrackedSatellite: (satellite) => set((state) => ({
        trackedSatellites: state.trackedSatellites.some(s => s.id === satellite.id)
          ? state.trackedSatellites.map(s => s.id === satellite.id ? satellite : s)
          : [...state.trackedSatellites, satellite],
      })),
      
      removeTrackedSatellite: (id) => set((state) => ({
        trackedSatellites: state.trackedSatellites.filter(s => s.id !== id),
        selectedSatelliteId: state.selectedSatelliteId === id ? null : state.selectedSatelliteId,
      })),
      
      updateTrackedSatellite: (id, updates) => set((state) => ({
        trackedSatellites: state.trackedSatellites.map(s => 
          s.id === id ? { ...s, ...updates } : s
        ),
      })),
      
      setTrackedSatellites: (satellites) => set({ trackedSatellites: satellites }),
      
      clearTrackedSatellites: () => set({ 
        trackedSatellites: [],
        selectedSatelliteId: null,
      }),
      
      setSelectedSatellite: (id) => set({ selectedSatelliteId: id }),
    }),
    {
      name: 'satellite-settings',
      partialize: (state) => ({
        showSatellites: state.showSatellites,
        showLabels: state.showLabels,
        showOrbits: state.showOrbits,
      }),
    }
  )
);
