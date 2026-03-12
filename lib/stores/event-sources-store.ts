import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getZustandStorage } from '@/lib/storage';
import { isTauri } from '@/lib/storage/platform';
import { secretVaultApi } from '@/lib/tauri/secret-vault-api';
import { createLogger } from '@/lib/logger';

const logger = createLogger('event-sources-store');

// ============================================================================
// Types
// ============================================================================

export interface EventSourceConfig {
  id: string;
  name: string;
  apiUrl: string;
  apiKey: string;
  hasStoredSecret?: boolean;
  enabled: boolean;
  priority: number;
  cacheMinutes: number;
}

interface EventSourcesState {
  sources: EventSourceConfig[];

  updateSource: (id: string, updates: Partial<Omit<EventSourceConfig, 'id'>>) => void;
  toggleSource: (id: string) => void;
  addSource: (source: EventSourceConfig) => void;
  removeSource: (id: string) => void;
  reorderSources: (sourceIds: string[]) => void;
  resetToDefaults: () => void;
  initializeSecrets: () => Promise<void>;
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
    hasStoredSecret: false,
    enabled: true,
    priority: 1,
    cacheMinutes: 60,
  },
  {
    id: 'imo',
    name: 'International Meteor Organization',
    apiUrl: 'https://www.imo.net/api',
    apiKey: '',
    hasStoredSecret: false,
    enabled: true,
    priority: 2,
    cacheMinutes: 1440,
  },
  {
    id: 'nasa',
    name: 'NASA Eclipse',
    apiUrl: 'https://eclipse.gsfc.nasa.gov',
    apiKey: '',
    hasStoredSecret: false,
    enabled: true,
    priority: 3,
    cacheMinutes: 1440,
  },
  {
    id: 'mpc',
    name: 'Minor Planet Center',
    apiUrl: 'https://www.minorplanetcenter.net/iau/Ephemerides/Comets/Soft03Cmt.txt',
    apiKey: '',
    hasStoredSecret: false,
    enabled: true,
    priority: 4,
    cacheMinutes: 720,
  },
  {
    id: 'astronomyapi',
    name: 'Astronomy API',
    apiUrl: 'https://api.astronomyapi.com/api/v2',
    apiKey: '',
    hasStoredSecret: false,
    enabled: false,
    priority: 5,
    cacheMinutes: 60,
  },
  {
    id: 'local',
    name: 'Local Calculations',
    apiUrl: '',
    apiKey: '',
    hasStoredSecret: false,
    enabled: true,
    priority: 99,
    cacheMinutes: 0,
  },
];

function sanitizeSourcesForPersistence(sources: EventSourceConfig[]): EventSourceConfig[] {
  return sources.map((source) => ({
    ...source,
    apiKey: '',
    hasStoredSecret: isTauri() ? (source.hasStoredSecret ?? !!source.apiKey) : false,
  }));
}

async function persistEventSourceSecret(source: EventSourceConfig): Promise<void> {
  const value = source.apiKey.trim();
  if (!value) {
    await secretVaultApi.deleteEventSourceApiKey(source.id);
    return;
  }

  await secretVaultApi.setEventSourceApiKey(source.id, value);
}

function syncSecretAsync(source: EventSourceConfig): void {
  if (!isTauri()) {
    return;
  }

  void persistEventSourceSecret(source).catch((error) => {
    logger.warn(`Failed to sync event-source secret for ${source.id}`, error);
  });
}

// ============================================================================
// Store
// ============================================================================

export const useEventSourcesStore = create<EventSourcesState>()(
  persist(
    (set, get) => ({
      sources: DEFAULT_SOURCES,

      updateSource: (id, updates) =>
        set((state) => {
          const nextSources = state.sources.map((source) => {
            if (source.id !== id) {
              return source;
            }

            const nextSource: EventSourceConfig = {
              ...source,
              ...updates,
              hasStoredSecret: updates.apiKey !== undefined
                ? !!updates.apiKey.trim()
                : (updates.hasStoredSecret ?? source.hasStoredSecret),
            };
            syncSecretAsync(nextSource);
            return nextSource;
          });

          return { sources: nextSources };
        }),

      toggleSource: (id) =>
        set((state) => ({
          sources: state.sources.map((source) =>
            source.id === id ? { ...source, enabled: !source.enabled } : source
          ),
        })),

      addSource: (source) =>
        set((state) => {
          const nextSource = {
            ...source,
            hasStoredSecret: !!source.apiKey.trim(),
          };
          syncSecretAsync(nextSource);
          return {
            sources: [...state.sources, nextSource],
          };
        }),

      removeSource: (id) =>
        set((state) => {
          const existing = state.sources.find((source) => source.id === id);
          if (existing && isTauri()) {
            void secretVaultApi.deleteEventSourceApiKey(id).catch((error) => {
              logger.warn(`Failed to delete event-source secret for ${id}`, error);
            });
          }

          return {
            sources: state.sources.filter((source) => source.id !== id),
          };
        }),

      reorderSources: (sourceIds) =>
        set((state) => {
          const sourceMap = new Map(state.sources.map((source) => [source.id, source]));
          const reordered = sourceIds
            .map((id, index) => {
              const source = sourceMap.get(id);
              return source ? { ...source, priority: index + 1 } : null;
            })
            .filter(Boolean) as EventSourceConfig[];
          const remaining = state.sources.filter((source) => !sourceIds.includes(source.id));
          return { sources: [...reordered, ...remaining] };
        }),

      resetToDefaults: () => {
        if (isTauri()) {
          for (const source of get().sources) {
            void secretVaultApi.deleteEventSourceApiKey(source.id).catch((error) => {
              logger.warn(`Failed to reset event-source secret for ${source.id}`, error);
            });
          }
        }

        set({ sources: DEFAULT_SOURCES.map((source) => ({ ...source })) });
      },

      initializeSecrets: async () => {
        if (!isTauri()) {
          if (get().sources.some((source) => !!source.apiKey)) {
            set((state) => ({ sources: [...state.sources] }));
          }
          return;
        }

        try {
          const nextSources = await Promise.all(get().sources.map(async (source) => {
            const legacySecret = source.apiKey.trim();
            let secret = await secretVaultApi.getEventSourceApiKey(source.id);

            if (!secret && legacySecret) {
              await secretVaultApi.setEventSourceApiKey(source.id, legacySecret);
              secret = legacySecret;
            }

            return {
              ...source,
              apiKey: secret ?? legacySecret,
              hasStoredSecret: !!(secret ?? legacySecret),
            };
          }));

          set({ sources: nextSources });
        } catch (error) {
          logger.warn('Failed to initialize event-source secrets', error);
        }
      },
    }),
    {
      name: 'starmap-event-sources',
      storage: getZustandStorage(),
      version: 1,
      partialize: (state) => ({
        sources: sanitizeSourcesForPersistence(state.sources),
      }),
    }
  )
);

if (typeof window !== 'undefined') {
  void useEventSourcesStore.getState().initializeSecrets();
}
