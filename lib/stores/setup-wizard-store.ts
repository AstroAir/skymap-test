/**
 * @deprecated Setup wizard store is now part of the unified onboarding store.
 * Import from '@/lib/stores/onboarding-store' instead.
 * This file provides a backward-compatible adapter.
 */

import { useOnboardingStore } from './onboarding-store';
import type { SetupWizardStep } from '@/types/starmap/onboarding';

// Re-export for backward compatibility
export type { SetupWizardStep } from '@/types/starmap/onboarding';
export { SETUP_WIZARD_STEPS } from '@/lib/constants/onboarding';

/**
 * @deprecated Use useOnboardingStore instead.
 * This adapter maps old setup-wizard-store API to the unified onboarding store.
 */
export const useSetupWizardStore = Object.assign(
  <T>(selector: (state: ReturnType<typeof adaptState>) => T): T => {
    return useOnboardingStore((s) => selector(adaptState(s)));
  },
  {
    getState: () => adaptState(useOnboardingStore.getState()),
  }
);

// Old openWizard started at 'welcome'; unified openSetup starts at 'location'.
// Preserve old behavior for backward compatibility.
function openWizardCompat() {
  useOnboardingStore.setState({ isSetupOpen: true, setupStep: 'welcome', phase: 'setup' });
}

function adaptState(s: ReturnType<typeof useOnboardingStore.getState>) {
  return {
    hasCompletedSetup: s.hasCompletedSetup,
    showOnNextVisit: s.showOnNextVisit,
    currentStep: s.setupStep,
    isOpen: s.isSetupOpen,
    completedSteps: s.setupCompletedSteps,
    setupData: s.setupData,
    openWizard: openWizardCompat,
    closeWizard: s.closeSetup,
    nextStep: s.setupNextStep,
    prevStep: s.setupPrevStep,
    goToStep: s.goToSetupStep as (step: SetupWizardStep) => void,
    markStepCompleted: s.markSetupStepCompleted as (step: SetupWizardStep) => void,
    completeSetup: s.completeSetup,
    resetSetup: s.resetSetup,
    setShowOnNextVisit: s.setShowOnNextVisit,
    updateSetupData: s.updateSetupData,
    getCurrentStepIndex: s.getSetupStepIndex,
    getTotalSteps: s.getSetupTotalSteps,
    isFirstStep: s.isSetupFirstStep,
    isLastStep: s.isSetupLastStep,
    canProceed: s.canSetupProceed,
  };
}
