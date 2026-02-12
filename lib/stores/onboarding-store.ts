import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getZustandStorage } from '@/lib/storage';
import { TOUR_STEPS } from '@/lib/constants/onboarding';
import type { TourStep } from '@/types/starmap/onboarding';

// Re-export for backward compatibility
export type { TourStep };
export { TOUR_STEPS };

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
