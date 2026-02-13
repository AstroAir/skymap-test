/**
 * @deprecated Setup wizard types are now part of the unified onboarding system.
 * Import from '@/types/starmap/onboarding' instead.
 * This file re-exports for backward compatibility.
 */

export type {
  SetupWizardStep,
  SetupWizardSetupData,
  ObserverLocation,
  PreferenceOption,
  UnifiedOnboardingProps as SetupWizardProps,
  OnboardingRestartButtonProps as SetupWizardButtonProps,
} from './onboarding';
