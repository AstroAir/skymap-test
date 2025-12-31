import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getZustandStorage } from '@/lib/storage';

// Setup wizard step types
export type SetupWizardStep = 
  | 'welcome'
  | 'location'
  | 'equipment'
  | 'preferences'
  | 'complete';

export const SETUP_WIZARD_STEPS: SetupWizardStep[] = [
  'welcome',
  'location',
  'equipment',
  'preferences',
  'complete',
];

interface SetupWizardState {
  // Whether the setup wizard has been completed
  hasCompletedSetup: boolean;
  // Whether to show setup wizard on next visit (if not completed)
  showOnNextVisit: boolean;
  // Current step in the wizard
  currentStep: SetupWizardStep;
  // Whether the wizard is currently open
  isOpen: boolean;
  // Track which steps have been completed
  completedSteps: SetupWizardStep[];
  // Temporary data during setup (not persisted)
  setupData: {
    locationConfigured: boolean;
    equipmentConfigured: boolean;
    preferencesConfigured: boolean;
  };
  
  // Actions
  openWizard: () => void;
  closeWizard: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: SetupWizardStep) => void;
  markStepCompleted: (step: SetupWizardStep) => void;
  completeSetup: () => void;
  resetSetup: () => void;
  setShowOnNextVisit: (show: boolean) => void;
  updateSetupData: (data: Partial<SetupWizardState['setupData']>) => void;
  
  // Getters
  getCurrentStepIndex: () => number;
  getTotalSteps: () => number;
  isFirstStep: () => boolean;
  isLastStep: () => boolean;
  canProceed: () => boolean;
}

export const useSetupWizardStore = create<SetupWizardState>()(
  persist(
    (set, get) => ({
      hasCompletedSetup: false,
      showOnNextVisit: true,
      currentStep: 'welcome',
      isOpen: false,
      completedSteps: [],
      setupData: {
        locationConfigured: false,
        equipmentConfigured: false,
        preferencesConfigured: false,
      },
      
      openWizard: () => set({
        isOpen: true,
        currentStep: get().hasCompletedSetup ? 'welcome' : get().currentStep,
      }),
      
      closeWizard: () => set({ isOpen: false }),
      
      nextStep: () => {
        const { currentStep, completedSteps } = get();
        const currentIndex = SETUP_WIZARD_STEPS.indexOf(currentStep);
        
        if (currentIndex < SETUP_WIZARD_STEPS.length - 1) {
          const nextStepValue = SETUP_WIZARD_STEPS[currentIndex + 1];
          set({
            currentStep: nextStepValue,
            completedSteps: completedSteps.includes(currentStep)
              ? completedSteps
              : [...completedSteps, currentStep],
          });
        } else {
          // On last step, complete the setup
          get().completeSetup();
        }
      },
      
      prevStep: () => {
        const { currentStep } = get();
        const currentIndex = SETUP_WIZARD_STEPS.indexOf(currentStep);
        
        if (currentIndex > 0) {
          set({ currentStep: SETUP_WIZARD_STEPS[currentIndex - 1] });
        }
      },
      
      goToStep: (step: SetupWizardStep) => {
        if (SETUP_WIZARD_STEPS.includes(step)) {
          set({ currentStep: step });
        }
      },
      
      markStepCompleted: (step: SetupWizardStep) => {
        const { completedSteps } = get();
        if (!completedSteps.includes(step)) {
          set({ completedSteps: [...completedSteps, step] });
        }
      },
      
      completeSetup: () => set({
        hasCompletedSetup: true,
        isOpen: false,
        currentStep: 'welcome',
        completedSteps: [...SETUP_WIZARD_STEPS],
      }),
      
      resetSetup: () => set({
        hasCompletedSetup: false,
        showOnNextVisit: true,
        currentStep: 'welcome',
        isOpen: false,
        completedSteps: [],
        setupData: {
          locationConfigured: false,
          equipmentConfigured: false,
          preferencesConfigured: false,
        },
      }),
      
      setShowOnNextVisit: (show: boolean) => set({ showOnNextVisit: show }),
      
      updateSetupData: (data) => set((state) => ({
        setupData: { ...state.setupData, ...data },
      })),
      
      getCurrentStepIndex: () => {
        return SETUP_WIZARD_STEPS.indexOf(get().currentStep);
      },
      
      getTotalSteps: () => SETUP_WIZARD_STEPS.length,
      
      isFirstStep: () => {
        return get().currentStep === SETUP_WIZARD_STEPS[0];
      },
      
      isLastStep: () => {
        return get().currentStep === SETUP_WIZARD_STEPS[SETUP_WIZARD_STEPS.length - 1];
      },
      
      canProceed: () => {
        const { currentStep } = get();
        // All steps are optional in the setup wizard
        switch (currentStep) {
          case 'welcome':
          case 'location':
          case 'equipment':
          case 'preferences':
          case 'complete':
          default:
            return true;
        }
      },
    }),
    {
      name: 'starmap-setup-wizard',
      storage: getZustandStorage(),
      version: 1,
      partialize: (state) => ({
        hasCompletedSetup: state.hasCompletedSetup,
        showOnNextVisit: state.showOnNextVisit,
        completedSteps: state.completedSteps,
      }),
    }
  )
);
