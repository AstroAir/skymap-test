import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getZustandStorage } from '@/lib/storage';

// ============================================================================
// Types
// ============================================================================

export interface EventSourceConfig {
  id: string;
  name: string;
  apiUrl: string;
  apiKey: string;
  enabled: boolean;
  priority: number;
  cacheMinutes: number;
}

interface EventSourcesState {
  sources: EventSourceConfig[];

  // Actions
  updateSource: (id: string, updates: Partial<Omit<EventSourceConfig, 'id'>>) => void;
  toggleSource: (id: string) => void;
  addSource: (source: EventSourceConfig) => void;
  removeSource: (id: string) => void;
  reorderSources: (sourceIds: string[]) => void;
  resetToDefaults: () => void;
}

// ============================================================================
// Default Sources
// ============================================================================

const DEFAULT_SOURCES: EventSourceConfig[] = [
  {
    id: 'usno',
    name: 'US Naval Observatory',
    apiUrl: 'https://aa.usno.navy.mil/api',
    apiKey: '',
    enabled: true,
    priority: 1,
    cacheMinutes: 60,
  },
  {
    id: 'imo',
    name: 'International Meteor Organization',
    apiUrl: 'https://www.imo.net/api',
    apiKey: '',
    enabled: true,
    priority: 2,
    cacheMinutes: 1440,
  },
  {
    id: 'nasa',
    name: 'NASA Eclipse',
    apiUrl: 'https://eclipse.gsfc.nasa.gov/eclipse/api',
    apiKey: '',
    enabled: true,
    priority: 3,
    cacheMinutes: 1440,
  },
  {
    id: 'mpc',
    name: 'Minor Planet Center',
    apiUrl: 'https://www.minorplanetcenter.net/iau/Ephemerides/Comets/Soft03Cmt.txt',
    apiKey: '',
    enabled: true,
    priority: 4,
    cacheMinutes: 720,
  },
  {
    id: 'astronomyapi',
    name: 'Astronomy API',
    apiUrl: 'https://api.astronomyapi.com/api/v2',
    apiKey: '',
    enabled: false,
    priority: 5,
    cacheMinutes: 60,
  },
  {
    id: 'local',
    name: 'Local Calculations',
    apiUrl: '',
    apiKey: '',
    enabled: true,
    priority: 99,
    cacheMinutes: 0,
  },
];

// ============================================================================
// Store
// ============================================================================

export const useEventSourcesStore = create<EventSourcesState>()(
  persist(
    (set) => ({
      sources: DEFAULT_SOURCES,

      updateSource: (id, updates) =>
        set((state) => ({
          sources: state.sources.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        })),

      toggleSource: (id) =>
        set((state) => ({
          sources: state.sources.map((s) =>
            s.id === id ? { ...s, enabled: !s.enabled } : s
          ),
        })),

      addSource: (source) =>
        set((state) => ({
          sources: [...state.sources, source],
        })),

      removeSource: (id) =>
        set((state) => ({
          sources: state.sources.filter((s) => s.id !== id),
        })),

      reorderSources: (sourceIds) =>
        set((state) => {
          const sourceMap = new Map(state.sources.map((s) => [s.id, s]));
          const reordered = sourceIds
            .map((id, i) => {
              const source = sourceMap.get(id);
              return source ? { ...source, priority: i + 1 } : null;
            })
            .filter(Boolean) as EventSourceConfig[];
          // Keep any sources not in the reorder list
          const remaining = state.sources.filter(
            (s) => !sourceIds.includes(s.id)
          );
          return { sources: [...reordered, ...remaining] };
        }),

      resetToDefaults: () => set({ sources: DEFAULT_SOURCES }),
    }),
    {
      name: 'starmap-event-sources',
      storage: getZustandStorage(),
      version: 1,
      partialize: (state) => ({
        sources: state.sources,
      }),
    }
  )
);
