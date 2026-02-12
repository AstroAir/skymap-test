/**
 * Type definitions for starmap setup wizard components
 * Extracted from components/starmap/setup-wizard/ for architectural separation
 */

import type { StellariumSettings } from '@/lib/core/types';

// ============================================================================
// SetupWizardStep (core type, used by store + components)
// ============================================================================

export type SetupWizardStep =
  | 'welcome'
  | 'location'
  | 'equipment'
  | 'preferences'
  | 'complete';

// ============================================================================
// SetupWizardState (store interface)
// ============================================================================

export interface SetupWizardSetupData {
  locationConfigured: boolean;
  equipmentConfigured: boolean;
  preferencesConfigured: boolean;
}

export interface SetupWizardState {
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
  setupData: SetupWizardSetupData;

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
  updateSetupData: (data: Partial<SetupWizardSetupData>) => void;

  // Getters
  getCurrentStepIndex: () => number;
  getTotalSteps: () => number;
  isFirstStep: () => boolean;
  isLastStep: () => boolean;
  canProceed: () => boolean;
}

// ============================================================================
// SetupWizard
// ============================================================================

export interface SetupWizardProps {
  onComplete?: () => void;
}

// ============================================================================
// SetupWizardButton
// ============================================================================

export interface SetupWizardButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

// ============================================================================
// ObserverLocation (used by location-step)
// ============================================================================

export interface ObserverLocation {
  latitude: number;
  longitude: number;
  altitude: number;
}

// ============================================================================
// PreferenceOption (used by preferences-step)
// ============================================================================

export interface PreferenceOption {
  id: string;
  icon: React.ElementType;
  titleKey: string;
  descKey: string;
  settingKey: keyof StellariumSettings;
}
