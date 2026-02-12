import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getZustandStorage } from '@/lib/storage';
import type { SetupWizardStep, SetupWizardState } from '@/types/starmap/setup-wizard';
import { SETUP_WIZARD_STEPS } from '@/lib/constants/setup-wizard';

// Re-export for backward compatibility
export type { SetupWizardStep } from '@/types/starmap/setup-wizard';
export { SETUP_WIZARD_STEPS } from '@/lib/constants/setup-wizard';

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
