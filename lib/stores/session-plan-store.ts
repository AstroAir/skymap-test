import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getZustandStorage } from '@/lib/storage';
import { createLogger } from '@/lib/logger';
import type { OptimizationStrategy } from '@/types/starmap/planning';

const logger = createLogger('session-plan-store');

// ============================================================================
// Types
// ============================================================================

export interface SavedScheduledTarget {
  targetId: string;
  targetName: string;
  ra: number;
  dec: number;
  startTime: string; // ISO string for serialization
  endTime: string;
  duration: number;
  maxAltitude: number;
  moonDistance: number;
  feasibilityScore: number;
  order: number;
}

export interface SavedSessionPlan {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  // Planning parameters
  planDate: string;
  latitude: number;
  longitude: number;
  strategy: OptimizationStrategy;
  minAltitude: number;
  minImagingTime: number;
  // Results snapshot
  targets: SavedScheduledTarget[];
  excludedTargetIds: string[];
  totalImagingTime: number;
  nightCoverage: number;
  efficiency: number;
}

export interface SessionPlanState {
  savedPlans: SavedSessionPlan[];
  activePlanId: string | null;
  
  // Actions
  savePlan: (plan: Omit<SavedSessionPlan, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updatePlan: (id: string, updates: Partial<Omit<SavedSessionPlan, 'id' | 'createdAt'>>) => void;
  deletePlan: (id: string) => void;
  setActivePlan: (id: string | null) => void;
  getActivePlan: () => SavedSessionPlan | null;
  getPlanById: (id: string) => SavedSessionPlan | undefined;
  renamePlan: (id: string, name: string) => void;
  duplicatePlan: (id: string) => string | null;
}

// ============================================================================
// Store
// ============================================================================

/** Maximum number of saved session plans to retain */
const MAX_SAVED_PLANS = 50;

function generatePlanId(): string {
  return `plan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const useSessionPlanStore = create<SessionPlanState>()(
  persist(
    (set, get) => ({
      savedPlans: [],
      activePlanId: null,

      savePlan: (plan) => {
        const id = generatePlanId();
        const now = new Date().toISOString();
        const newPlan: SavedSessionPlan = {
          ...plan,
          id,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          savedPlans: [newPlan, ...state.savedPlans].slice(0, MAX_SAVED_PLANS),
          activePlanId: id,
        }));
        logger.info('Session plan saved', { id, name: plan.name });
        return id;
      },

      updatePlan: (id, updates) => {
        set((state) => ({
          savedPlans: state.savedPlans.map((p) =>
            p.id === id
              ? { ...p, ...updates, updatedAt: new Date().toISOString() }
              : p
          ),
        }));
      },

      deletePlan: (id) => {
        set((state) => ({
          savedPlans: state.savedPlans.filter((p) => p.id !== id),
          activePlanId: state.activePlanId === id ? null : state.activePlanId,
        }));
        logger.info('Session plan deleted', { id });
      },

      setActivePlan: (id) => {
        set({ activePlanId: id });
      },

      getActivePlan: () => {
        const state = get();
        if (!state.activePlanId) return null;
        return state.savedPlans.find((p) => p.id === state.activePlanId) ?? null;
      },

      getPlanById: (id) => {
        return get().savedPlans.find((p) => p.id === id);
      },

      renamePlan: (id, name) => {
        set((state) => ({
          savedPlans: state.savedPlans.map((p) =>
            p.id === id
              ? { ...p, name, updatedAt: new Date().toISOString() }
              : p
          ),
        }));
      },

      duplicatePlan: (id) => {
        const source = get().savedPlans.find((p) => p.id === id);
        if (!source) return null;
        const newId = generatePlanId();
        const now = new Date().toISOString();
        const copy: SavedSessionPlan = {
          ...source,
          id: newId,
          name: `${source.name} (copy)`,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          savedPlans: [copy, ...state.savedPlans].slice(0, MAX_SAVED_PLANS),
          activePlanId: newId,
        }));
        return newId;
      },
    }),
    {
      name: 'skymap-session-plans',
      version: 1,
      storage: getZustandStorage<SessionPlanState>(),
      partialize: (state) => ({
        savedPlans: state.savedPlans,
        activePlanId: state.activePlanId,
      }) as SessionPlanState,
    }
  )
);
