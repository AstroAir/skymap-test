import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getZustandStorage } from '@/lib/storage';
import { createLogger } from '@/lib/logger';
import type { OptimizationStrategy } from '@/types/starmap/planning';
import type { SessionDraftV2, SessionTemplate, SessionWeatherSnapshot } from '@/types/starmap/session-planner-v2';

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
  notes?: string;
  weatherSnapshot?: SessionWeatherSnapshot;
  manualEdits?: SessionDraftV2['manualEdits'];
}

export interface SavedSessionTemplate {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  draft: SessionDraftV2;
}

export interface SessionPlanState {
  savedPlans: SavedSessionPlan[];
  templates: SavedSessionTemplate[];
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
  importPlanV2: (draft: SessionDraftV2, name?: string) => string;
  saveTemplate: (template: Omit<SessionTemplate, 'id' | 'createdAt' | 'updatedAt'>) => string;
  loadTemplate: (id: string) => SavedSessionTemplate | undefined;
  deleteTemplate: (id: string) => void;
  listTemplates: () => SavedSessionTemplate[];
}

// ============================================================================
// Store
// ============================================================================

/** Maximum number of saved session plans to retain */
const MAX_SAVED_PLANS = 50;
const MAX_SAVED_TEMPLATES = 50;

function generatePlanId(): string {
  return `plan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function generateTemplateId(): string {
  return `template_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const useSessionPlanStore = create<SessionPlanState>()(
  persist(
    (set, get) => ({
      savedPlans: [],
      templates: [],
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

      importPlanV2: (draft, name) => {
        const fallbackName = name ?? `Session ${new Date(draft.planDate).toLocaleDateString()}`;
        return get().savePlan({
          name: fallbackName,
          planDate: draft.planDate,
          latitude: 0,
          longitude: 0,
          strategy: draft.strategy,
          minAltitude: draft.constraints.minAltitude,
          minImagingTime: draft.constraints.minImagingTime,
          targets: [],
          excludedTargetIds: draft.excludedTargetIds,
          totalImagingTime: 0,
          nightCoverage: 0,
          efficiency: 0,
          notes: draft.notes,
          weatherSnapshot: draft.weatherSnapshot,
          manualEdits: draft.manualEdits,
        });
      },

      saveTemplate: (template) => {
        const id = generateTemplateId();
        const now = new Date().toISOString();
        const nextTemplate: SavedSessionTemplate = {
          id,
          name: template.name,
          draft: template.draft,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          templates: [nextTemplate, ...state.templates].slice(0, MAX_SAVED_TEMPLATES),
        }));
        logger.info('Session template saved', { id, name: template.name });
        return id;
      },

      loadTemplate: (id) => {
        return get().templates.find((template) => template.id === id);
      },

      deleteTemplate: (id) => {
        set((state) => ({
          templates: state.templates.filter((template) => template.id !== id),
        }));
      },

      listTemplates: () => get().templates,
    }),
    {
      name: 'skymap-session-plans',
      version: 2,
      storage: getZustandStorage<Partial<SessionPlanState>>(),
      migrate: (persistedState: unknown, version: number) => {
        const state = (persistedState ?? {}) as Partial<SessionPlanState>;
        if (version < 2) {
          return {
            savedPlans: state.savedPlans ?? [],
            activePlanId: state.activePlanId ?? null,
            templates: [],
          } as Partial<SessionPlanState>;
        }
        return {
          savedPlans: state.savedPlans ?? [],
          activePlanId: state.activePlanId ?? null,
          templates: state.templates ?? [],
        } as Partial<SessionPlanState>;
      },
      partialize: (state) => ({
        savedPlans: state.savedPlans,
        activePlanId: state.activePlanId,
        templates: state.templates,
      }),
    }
  )
);
