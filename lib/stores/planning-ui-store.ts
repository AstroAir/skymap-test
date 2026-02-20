import { create } from 'zustand';

interface PlanningUiState {
  sessionPlannerOpen: boolean;
  shotListOpen: boolean;
  tonightRecommendationsOpen: boolean;
  openSessionPlanner: () => void;
  closeSessionPlanner: () => void;
  setSessionPlannerOpen: (open: boolean) => void;
  openShotList: () => void;
  closeShotList: () => void;
  setShotListOpen: (open: boolean) => void;
  openTonightRecommendations: () => void;
  closeTonightRecommendations: () => void;
  setTonightRecommendationsOpen: (open: boolean) => void;
}

export const usePlanningUiStore = create<PlanningUiState>((set) => ({
  sessionPlannerOpen: false,
  shotListOpen: false,
  tonightRecommendationsOpen: false,
  openSessionPlanner: () => set({ sessionPlannerOpen: true }),
  closeSessionPlanner: () => set({ sessionPlannerOpen: false }),
  setSessionPlannerOpen: (open) => set({ sessionPlannerOpen: open }),
  openShotList: () => set({ shotListOpen: true }),
  closeShotList: () => set({ shotListOpen: false }),
  setShotListOpen: (open) => set({ shotListOpen: open }),
  openTonightRecommendations: () => set({ tonightRecommendationsOpen: true }),
  closeTonightRecommendations: () => set({ tonightRecommendationsOpen: false }),
  setTonightRecommendationsOpen: (open) => set({ tonightRecommendationsOpen: open }),
}));
