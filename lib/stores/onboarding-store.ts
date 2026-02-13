import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getZustandStorage } from '@/lib/storage';
import { TOUR_STEPS, SETUP_WIZARD_STEPS } from '@/lib/constants/onboarding';
import type {
  TourStep,
  OnboardingPhase,
  SetupWizardStep,
  SetupWizardSetupData,
} from '@/types/starmap/onboarding';

// Re-export for backward compatibility
export type { TourStep, SetupWizardStep };
export { TOUR_STEPS, SETUP_WIZARD_STEPS };

// ============================================================================
// Unified Onboarding State
// ============================================================================

interface OnboardingState {
  // --- Shared state ---
  hasCompletedOnboarding: boolean;
  hasSeenWelcome: boolean;
  showOnNextVisit: boolean;
  phase: OnboardingPhase;

  // --- Setup wizard state ---
  hasCompletedSetup: boolean;
  setupStep: SetupWizardStep;
  setupCompletedSteps: SetupWizardStep[];
  isSetupOpen: boolean;
  setupData: SetupWizardSetupData;

  // --- Tour state ---
  currentStepIndex: number;
  isTourActive: boolean;
  completedSteps: string[];

  // --- Shared actions ---
  setHasSeenWelcome: (seen: boolean) => void;
  setShowOnNextVisit: (show: boolean) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  resetAll: () => void;

  // --- Setup wizard actions ---
  openSetup: () => void;
  closeSetup: () => void;
  setupNextStep: () => void;
  setupPrevStep: () => void;
  goToSetupStep: (step: SetupWizardStep) => void;
  markSetupStepCompleted: (step: SetupWizardStep) => void;
  completeSetup: () => void;
  resetSetup: () => void;
  updateSetupData: (data: Partial<SetupWizardSetupData>) => void;
  finishSetupAndStartTour: () => void;
  skipSetupStartTour: () => void;

  // --- Setup wizard getters ---
  getSetupStepIndex: () => number;
  getSetupTotalSteps: () => number;
  isSetupFirstStep: () => boolean;
  isSetupLastStep: () => boolean;
  canSetupProceed: () => boolean;

  // --- Tour actions ---
  startTour: () => void;
  endTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (index: number) => void;
  skipTour: () => void;
  markStepCompleted: (stepId: string) => void;

  // --- Tour getters ---
  getCurrentStep: () => TourStep | null;
  getTotalSteps: () => number;
  isLastStep: () => boolean;
  isFirstStep: () => boolean;
}

const INITIAL_SETUP_DATA: SetupWizardSetupData = {
  locationConfigured: false,
  equipmentConfigured: false,
  preferencesConfigured: false,
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      // --- Shared state ---
      hasCompletedOnboarding: false,
      hasSeenWelcome: false,
      showOnNextVisit: true,
      phase: 'idle' as OnboardingPhase,

      // --- Setup wizard state ---
      hasCompletedSetup: false,
      setupStep: 'welcome' as SetupWizardStep,
      setupCompletedSteps: [] as SetupWizardStep[],
      isSetupOpen: false,
      setupData: { ...INITIAL_SETUP_DATA },

      // --- Tour state ---
      currentStepIndex: -1,
      isTourActive: false,
      completedSteps: [] as string[],

      // ================================================================
      // Shared actions
      // ================================================================

      setHasSeenWelcome: (seen: boolean) => set({ hasSeenWelcome: seen }),

      setShowOnNextVisit: (show: boolean) => set({ showOnNextVisit: show }),

      completeOnboarding: () => set({
        isTourActive: false,
        currentStepIndex: -1,
        hasCompletedOnboarding: true,
        hasSeenWelcome: true,
        showOnNextVisit: false,
        phase: 'idle',
      }),

      resetOnboarding: () => set({
        hasCompletedOnboarding: false,
        hasSeenWelcome: false,
        currentStepIndex: -1,
        isTourActive: false,
        completedSteps: [],
        showOnNextVisit: true,
        phase: 'idle',
      }),

      resetAll: () => set({
        hasCompletedOnboarding: false,
        hasSeenWelcome: false,
        showOnNextVisit: true,
        phase: 'idle',
        hasCompletedSetup: false,
        setupStep: 'welcome',
        setupCompletedSteps: [],
        isSetupOpen: false,
        setupData: { ...INITIAL_SETUP_DATA },
        currentStepIndex: -1,
        isTourActive: false,
        completedSteps: [],
      }),

      // ================================================================
      // Setup wizard actions
      // ================================================================

      openSetup: () => set({
        isSetupOpen: true,
        phase: 'setup',
        setupStep: get().hasCompletedSetup ? 'location' : (get().setupStep === 'welcome' ? 'location' : get().setupStep),
      }),

      closeSetup: () => set({ isSetupOpen: false }),

      setupNextStep: () => {
        const { setupStep, setupCompletedSteps } = get();
        const currentIndex = SETUP_WIZARD_STEPS.indexOf(setupStep);

        if (currentIndex < SETUP_WIZARD_STEPS.length - 1) {
          const nextStepValue = SETUP_WIZARD_STEPS[currentIndex + 1];
          set({
            setupStep: nextStepValue,
            setupCompletedSteps: setupCompletedSteps.includes(setupStep)
              ? setupCompletedSteps
              : [...setupCompletedSteps, setupStep],
          });
        } else {
          get().completeSetup();
        }
      },

      setupPrevStep: () => {
        const { setupStep } = get();
        const currentIndex = SETUP_WIZARD_STEPS.indexOf(setupStep);
        if (currentIndex > 0) {
          set({ setupStep: SETUP_WIZARD_STEPS[currentIndex - 1] });
        }
      },

      goToSetupStep: (step: SetupWizardStep) => {
        if (SETUP_WIZARD_STEPS.includes(step)) {
          set({ setupStep: step });
        }
      },

      markSetupStepCompleted: (step: SetupWizardStep) => {
        const { setupCompletedSteps } = get();
        if (!setupCompletedSteps.includes(step)) {
          set({ setupCompletedSteps: [...setupCompletedSteps, step] });
        }
      },

      completeSetup: () => set({
        hasCompletedSetup: true,
        isSetupOpen: false,
        setupStep: 'welcome',
        setupCompletedSteps: [...SETUP_WIZARD_STEPS],
      }),

      resetSetup: () => set({
        hasCompletedSetup: false,
        setupStep: 'welcome',
        isSetupOpen: false,
        setupCompletedSteps: [],
        setupData: { ...INITIAL_SETUP_DATA },
      }),

      updateSetupData: (data) => set((state) => ({
        setupData: { ...state.setupData, ...data },
      })),

      finishSetupAndStartTour: () => {
        set({
          hasCompletedSetup: true,
          isSetupOpen: false,
          setupStep: 'welcome',
          setupCompletedSteps: [...SETUP_WIZARD_STEPS],
          phase: 'tour',
          isTourActive: true,
          currentStepIndex: 0,
          hasSeenWelcome: true,
        });
      },

      skipSetupStartTour: () => {
        set({
          isSetupOpen: false,
          phase: 'tour',
          isTourActive: true,
          currentStepIndex: 0,
          hasSeenWelcome: true,
        });
      },

      // --- Setup wizard getters ---

      getSetupStepIndex: () => SETUP_WIZARD_STEPS.indexOf(get().setupStep),

      getSetupTotalSteps: () => SETUP_WIZARD_STEPS.length,

      isSetupFirstStep: () => get().setupStep === SETUP_WIZARD_STEPS[0],

      isSetupLastStep: () => get().setupStep === SETUP_WIZARD_STEPS[SETUP_WIZARD_STEPS.length - 1],

      canSetupProceed: () => true,

      // ================================================================
      // Tour actions
      // ================================================================

      startTour: () => set({
        isTourActive: true,
        currentStepIndex: 0,
        phase: 'tour',
      }),

      endTour: () => set({
        isTourActive: false,
        currentStepIndex: -1,
        phase: 'idle',
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
        phase: 'idle',
      }),

      markStepCompleted: (stepId: string) => set((state) => ({
        completedSteps: state.completedSteps.includes(stepId)
          ? state.completedSteps
          : [...state.completedSteps, stepId],
      })),

      // --- Tour getters ---

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
      version: 3,
      migrate: (persistedState, version) => {
        const state = (persistedState && typeof persistedState === 'object')
          ? persistedState as Record<string, unknown>
          : {};

        if (version < 2) {
          if ('hasSeenWelcome' in state) {
            delete state.hasSeenWelcome;
          }
        }

        if (version < 3) {
          // Merge old setup-wizard persisted state if present
          try {
            const storageKey = 'starmap-setup-wizard';
            const zustandStorage = getZustandStorage();
            const stored = zustandStorage.getItem(storageKey);
            if (stored) {
              const wizardState = (stored as { state?: Record<string, unknown> }).state;
              if (wizardState) {
                state.hasCompletedSetup = (wizardState.hasCompletedSetup as boolean) ?? false;
                state.setupCompletedSteps = (wizardState.completedSteps as string[]) ?? [];
              }
              // Clean up old key
              zustandStorage.removeItem(storageKey);
            }
          } catch {
            // Ignore parse errors
          }

          // Ensure new fields have defaults
          if (!('hasCompletedSetup' in state)) state.hasCompletedSetup = false;
          if (!('setupCompletedSteps' in state)) state.setupCompletedSteps = [];
        }

        return state;
      },
      partialize: (state) => ({
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        hasCompletedSetup: state.hasCompletedSetup,
        completedSteps: state.completedSteps,
        setupCompletedSteps: state.setupCompletedSteps,
        showOnNextVisit: state.showOnNextVisit,
      }),
    }
  )
);
