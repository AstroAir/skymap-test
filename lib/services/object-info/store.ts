/**
 * Object info configuration store
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DataSource, DataSourceId } from './types';
import { DEFAULT_DATA_SOURCES, checkAllSourcesHealth } from './config';

// ============================================================================
// Store Types
// ============================================================================

interface ObjectInfoConfigState {
  sources: DataSource[];
  lastHealthCheck: Date | null;
  isCheckingHealth: boolean;
  
  // Actions
  setSourceEnabled: (id: DataSourceId, enabled: boolean) => void;
  setSourcePriority: (id: DataSourceId, priority: number) => void;
  updateSourceHealth: (id: DataSourceId, healthy: boolean) => void;
  runHealthCheck: () => Promise<void>;
  resetToDefaults: () => void;
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useObjectInfoConfigStore = create<ObjectInfoConfigState>()(
  persist(
    (set, get) => ({
      sources: [...DEFAULT_DATA_SOURCES],
      lastHealthCheck: null,
      isCheckingHealth: false,
      
      setSourceEnabled: (id, enabled) => {
        set(state => ({
          sources: state.sources.map(s =>
            s.id === id ? { ...s, enabled } : s
          ),
        }));
      },
      
      setSourcePriority: (id, priority) => {
        set(state => ({
          sources: state.sources.map(s =>
            s.id === id ? { ...s, priority } : s
          ),
        }));
      },
      
      updateSourceHealth: (id, healthy) => {
        set(state => ({
          sources: state.sources.map(s =>
            s.id === id ? { ...s, healthy, lastCheck: new Date() } : s
          ),
        }));
      },
      
      runHealthCheck: async () => {
        set({ isCheckingHealth: true });
        
        try {
          const { sources } = get();
          const healthResults = await checkAllSourcesHealth(sources);
          
          set(state => ({
            sources: state.sources.map(s => ({
              ...s,
              healthy: healthResults.get(s.id) ?? s.healthy,
              lastCheck: new Date(),
            })),
            lastHealthCheck: new Date(),
            isCheckingHealth: false,
          }));
        } catch {
          set({ isCheckingHealth: false });
        }
      },
      
      resetToDefaults: () => {
        set({
          sources: [...DEFAULT_DATA_SOURCES],
          lastHealthCheck: null,
        });
      },
    }),
    {
      name: 'object-info-config',
      partialize: (state) => ({
        // Exclude lastCheck from persisted state (it's runtime-only)
        sources: state.sources.map(({ lastCheck, ...rest }) => {
          void lastCheck;
          return rest;
        }),
      }),
    }
  )
);

// ============================================================================
// Selectors
// ============================================================================

/**
 * Get active sources sorted by priority
 */
export function useActiveSources(): DataSource[] {
  return useObjectInfoConfigStore(state => 
    state.sources
      .filter(s => s.enabled && s.healthy)
      .sort((a, b) => a.priority - b.priority)
  );
}

/**
 * Get source by ID
 */
export function useSource(id: DataSourceId): DataSource | undefined {
  return useObjectInfoConfigStore(state => 
    state.sources.find(s => s.id === id)
  );
}

/**
 * Get health check status
 */
export function useHealthCheckStatus(): {
  lastCheck: Date | null;
  isChecking: boolean;
} {
  return useObjectInfoConfigStore(state => ({
    lastCheck: state.lastHealthCheck,
    isChecking: state.isCheckingHealth,
  }));
}
