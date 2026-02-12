/**
 * Type definitions for starmap onboarding components
 * Extracted from components/starmap/onboarding/ for architectural separation
 */

// ============================================================================
// TourStep (core type, used by store + components)
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
