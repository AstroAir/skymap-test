import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getZustandStorage } from '@/lib/storage';

// Tour step definitions
export interface TourStep {
  id: string;
  targetSelector: string;
  titleKey: string;
  descriptionKey: string;
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center';
  highlightPadding?: number;
  action?: 'click' | 'hover' | 'none';
  nextOnAction?: boolean;
  showSkip?: boolean;
  spotlightRadius?: number;
}

// Predefined tour steps for the main application
export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    targetSelector: '[data-tour-id="canvas"]',
    titleKey: 'onboarding.steps.welcome.title',
    descriptionKey: 'onboarding.steps.welcome.description',
    placement: 'center',
    showSkip: true,
  },
  {
    id: 'search',
    targetSelector: '[data-tour-id="search-button"]',
    titleKey: 'onboarding.steps.search.title',
    descriptionKey: 'onboarding.steps.search.description',
    placement: 'bottom',
    highlightPadding: 8,
    action: 'click',
  },
  {
    id: 'navigation',
    targetSelector: '[data-tour-id="canvas"]',
    titleKey: 'onboarding.steps.navigation.title',
    descriptionKey: 'onboarding.steps.navigation.description',
    placement: 'center',
  },
  {
    id: 'zoom',
    targetSelector: '[data-tour-id="zoom-controls"]',
    titleKey: 'onboarding.steps.zoom.title',
    descriptionKey: 'onboarding.steps.zoom.description',
    placement: 'left',
    highlightPadding: 8,
  },
  {
    id: 'settings',
    targetSelector: '[data-tour-id="settings-button"]',
    titleKey: 'onboarding.steps.settings.title',
    descriptionKey: 'onboarding.steps.settings.description',
    placement: 'bottom',
    highlightPadding: 8,
  },
  {
    id: 'fov',
    targetSelector: '[data-tour-id="fov-button"]',
    titleKey: 'onboarding.steps.fov.title',
    descriptionKey: 'onboarding.steps.fov.description',
    placement: 'left',
    highlightPadding: 8,
  },
  {
    id: 'shotlist',
    targetSelector: '[data-tour-id="shotlist-button"]',
    titleKey: 'onboarding.steps.shotlist.title',
    descriptionKey: 'onboarding.steps.shotlist.description',
    placement: 'left',
    highlightPadding: 8,
  },
  {
    id: 'tonight',
    targetSelector: '[data-tour-id="tonight-button"]',
    titleKey: 'onboarding.steps.tonight.title',
    descriptionKey: 'onboarding.steps.tonight.description',
    placement: 'bottom',
    highlightPadding: 8,
  },
  {
    id: 'contextmenu',
    targetSelector: '[data-tour-id="canvas"]',
    titleKey: 'onboarding.steps.contextmenu.title',
    descriptionKey: 'onboarding.steps.contextmenu.description',
    placement: 'center',
  },
  {
    id: 'complete',
    targetSelector: '[data-tour-id="canvas"]',
    titleKey: 'onboarding.steps.complete.title',
    descriptionKey: 'onboarding.steps.complete.description',
    placement: 'center',
  },
];

interface OnboardingState {
  // Whether the user has completed the onboarding
  hasCompletedOnboarding: boolean;
  // Whether the user has seen the welcome dialog
  hasSeenWelcome: boolean;
  // Current tour step index (-1 = not in tour)
  currentStepIndex: number;
  // Whether the tour is active
  isTourActive: boolean;
  // Completed step IDs
  completedSteps: string[];
  // Whether to show onboarding on next visit
  showOnNextVisit: boolean;
  
  // Actions
  startTour: () => void;
  endTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (index: number) => void;
  skipTour: () => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  setHasSeenWelcome: (seen: boolean) => void;
  markStepCompleted: (stepId: string) => void;
  setShowOnNextVisit: (show: boolean) => void;
  
  // Getters
  getCurrentStep: () => TourStep | null;
  getTotalSteps: () => number;
  isLastStep: () => boolean;
  isFirstStep: () => boolean;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      hasCompletedOnboarding: false,
      hasSeenWelcome: false,
      currentStepIndex: -1,
      isTourActive: false,
      completedSteps: [],
      showOnNextVisit: true,
      
      startTour: () => set({
        isTourActive: true,
        currentStepIndex: 0,
      }),
      
      endTour: () => set({
        isTourActive: false,
        currentStepIndex: -1,
      }),
      
      nextStep: () => {
        const { currentStepIndex } = get();
        const totalSteps = TOUR_STEPS.length;
        
        if (currentStepIndex < totalSteps - 1) {
          const currentStep = TOUR_STEPS[currentStepIndex];
          set((state) => {
            const stepId = currentStep?.id;
            const completedSteps = stepId && !state.completedSteps.includes(stepId)
              ? [...state.completedSteps, stepId]
              : state.completedSteps;

            return {
              currentStepIndex: currentStepIndex + 1,
              completedSteps,
            };
          });
        } else {
          // Complete the tour
          get().completeOnboarding();
        }
      },
      
      prevStep: () => {
        const { currentStepIndex } = get();
        if (currentStepIndex > 0) {
          set({ currentStepIndex: currentStepIndex - 1 });
        }
      },
      
      goToStep: (index: number) => {
        if (index >= 0 && index < TOUR_STEPS.length) {
          set({ currentStepIndex: index });
        }
      },
      
      skipTour: () => set({
        isTourActive: false,
        currentStepIndex: -1,
        hasCompletedOnboarding: true,
        hasSeenWelcome: true,
        showOnNextVisit: false,
      }),
      
      completeOnboarding: () => set({
        isTourActive: false,
        currentStepIndex: -1,
        hasCompletedOnboarding: true,
        hasSeenWelcome: true,
        showOnNextVisit: false,
      }),
      
      resetOnboarding: () => set({
        hasCompletedOnboarding: false,
        hasSeenWelcome: false,
        currentStepIndex: -1,
        isTourActive: false,
        completedSteps: [],
        showOnNextVisit: true,
      }),
      
      setHasSeenWelcome: (seen: boolean) => set({ hasSeenWelcome: seen }),
      
      markStepCompleted: (stepId: string) => set((state) => ({
        completedSteps: state.completedSteps.includes(stepId)
          ? state.completedSteps
          : [...state.completedSteps, stepId],
      })),
      
      setShowOnNextVisit: (show: boolean) => set({ showOnNextVisit: show }),
      
      getCurrentStep: () => {
        const { currentStepIndex, isTourActive } = get();
        if (!isTourActive || currentStepIndex < 0 || currentStepIndex >= TOUR_STEPS.length) {
          return null;
        }
        return TOUR_STEPS[currentStepIndex];
      },
      
      getTotalSteps: () => TOUR_STEPS.length,
      
      isLastStep: () => {
        const { currentStepIndex } = get();
        return currentStepIndex === TOUR_STEPS.length - 1;
      },
      
      isFirstStep: () => {
        const { currentStepIndex } = get();
        return currentStepIndex === 0;
      },
    }),
    {
      name: 'starmap-onboarding',
      storage: getZustandStorage(),
      version: 2,
      migrate: (persistedState, version) => {
        if (version < 2 && persistedState && typeof persistedState === 'object') {
          const state = persistedState as Record<string, unknown>;
          if ('hasSeenWelcome' in state) {
            delete state.hasSeenWelcome;
          }
          return state;
        }
        return persistedState;
      },
      partialize: (state) => ({
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        completedSteps: state.completedSteps,
        showOnNextVisit: state.showOnNextVisit,
      }),
    }
  )
);
