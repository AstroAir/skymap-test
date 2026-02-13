/**
 * Type definitions for unified onboarding system
 * Combines setup wizard + feature tour into a single flow
 */

import type { StellariumSettings } from '@/lib/core/types';

// ============================================================================
// Onboarding Phase
// ============================================================================

export type OnboardingPhase = 'idle' | 'setup' | 'tour';

// ============================================================================
// Setup Wizard Step (used in setup phase)
// ============================================================================

export type SetupWizardStep =
  | 'welcome'
  | 'location'
  | 'equipment'
  | 'preferences'
  | 'complete';

export interface SetupWizardSetupData {
  locationConfigured: boolean;
  equipmentConfigured: boolean;
  preferencesConfigured: boolean;
}

// ============================================================================
// TourStep (used in tour phase)
// ============================================================================

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

// ============================================================================
// OnboardingTour
// ============================================================================

export interface OnboardingTourProps {
  onTourStart?: () => void;
  onTourEnd?: () => void;
  onStepChange?: (stepIndex: number) => void;
}

// ============================================================================
// TourSpotlight
// ============================================================================

export interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface TourSpotlightProps {
  targetSelector: string;
  padding?: number;
  isActive: boolean;
  spotlightRadius?: number;
  className?: string;
}

// ============================================================================
// TourTooltip
// ============================================================================

export interface TooltipPosition {
  top: number;
  left: number;
  arrowPosition: 'top' | 'bottom' | 'left' | 'right' | 'none';
  arrowOffset: number;
}

export interface TourTooltipProps {
  step: TourStep;
  currentIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onClose: () => void;
  isFirst: boolean;
  isLast: boolean;
}

// ============================================================================
// WelcomeDialog
// ============================================================================

export interface WelcomeDialogProps {
  onStartTour?: () => void;
  onSkip?: () => void;
}

// ============================================================================
// WelcomeFeature
// ============================================================================

export interface WelcomeFeature {
  icon: React.ElementType;
  key: string;
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

// ============================================================================
// Unified Onboarding Props
// ============================================================================

export interface UnifiedOnboardingProps {
  onComplete?: () => void;
}

export interface OnboardingRestartButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}
