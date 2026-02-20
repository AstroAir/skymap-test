/**
 * Unified onboarding constants and pure utility functions
 * Combines setup wizard + feature tour constants
 */

import type {
  TourStep,
  TooltipPosition,
  WelcomeFeature,
  SetupWizardStep,
  PreferenceOption,
} from '@/types/starmap/onboarding';
import { resolveTourSteps } from '@/lib/constants/onboarding-capabilities';
import {
  Telescope,
  Star,
  Map,
  Rocket,
  MapPin,
  Settings2,
  Sparkles,
  Layers,
  Moon,
  Grid3X3,
  Compass,
} from 'lucide-react';

// ============================================================================
// Tour Steps
// ============================================================================

/** Backward-compatible static core tour definition */
export const TOUR_STEPS: TourStep[] = resolveTourSteps(
  {
    isMobile: false,
    isTauri: false,
    skyEngine: 'stellarium',
    stelAvailable: true,
    featureVisibility: {},
  },
  'first-run-core',
).steps;

// ============================================================================
// Tooltip Layout Constants
// ============================================================================

/** Minimum margin from viewport edges */
export const TOOLTIP_MARGIN = 16;

/** Arrow triangle size in pixels */
export const ARROW_SIZE = 8;

// ============================================================================
// Setup Wizard Steps
// ============================================================================

export const SETUP_WIZARD_STEPS: SetupWizardStep[] = [
  'welcome',
  'location',
  'equipment',
  'preferences',
  'complete',
];

// ============================================================================
// Setup Wizard Step Icons
// ============================================================================

export const STEP_ICONS: Record<SetupWizardStep, typeof MapPin> = {
  welcome: Sparkles,
  location: MapPin,
  equipment: Telescope,
  preferences: Settings2,
  complete: Rocket,
};

// ============================================================================
// Display Options (used by preferences-step)
// ============================================================================

export const DISPLAY_OPTIONS: PreferenceOption[] = [
  {
    id: 'constellations',
    icon: Grid3X3,
    titleKey: 'setupWizard.steps.preferences.constellationLines',
    descKey: 'setupWizard.steps.preferences.constellationLinesDesc',
    settingKey: 'constellationsLinesVisible',
  },
  {
    id: 'dsos',
    icon: Layers,
    titleKey: 'setupWizard.steps.preferences.deepSkyObjects',
    descKey: 'setupWizard.steps.preferences.deepSkyObjectsDesc',
    settingKey: 'dsosVisible',
  },
  {
    id: 'equatorialGrid',
    icon: Compass,
    titleKey: 'setupWizard.steps.preferences.equatorialGrid',
    descKey: 'setupWizard.steps.preferences.equatorialGridDesc',
    settingKey: 'equatorialLinesVisible',
  },
  {
    id: 'nightMode',
    icon: Moon,
    titleKey: 'setupWizard.steps.preferences.nightMode',
    descKey: 'setupWizard.steps.preferences.nightModeDesc',
    settingKey: 'nightMode',
  },
];

// ============================================================================
// Storage Keys
// ============================================================================

export const LOCATION_STORAGE_KEY = 'skymap-observer-location';

// ============================================================================
// Welcome Dialog Features
// ============================================================================

export const WELCOME_FEATURES: readonly WelcomeFeature[] = [
  { icon: Telescope, key: 'explore' },
  { icon: Star, key: 'objects' },
  { icon: Map, key: 'plan' },
  { icon: Rocket, key: 'track' },
] as const;

// ============================================================================
// Arrow Style Utility
// ============================================================================

/** Compute CSS properties for the tooltip arrow based on position */
export function getArrowStyles(
  arrowPosition: TooltipPosition['arrowPosition'],
  arrowOffset: number,
  arrowSize: number = ARROW_SIZE,
): React.CSSProperties | null {
  if (arrowPosition === 'none') return null;

  const styles: React.CSSProperties = {
    position: 'absolute',
    width: 0,
    height: 0,
  };

  const borderSize = `${arrowSize}px`;
  // Use CSS variable for theme consistency
  const borderColor = 'hsl(var(--card))';

  switch (arrowPosition) {
    case 'top':
      styles.top = -arrowSize;
      styles.left = arrowOffset - arrowSize;
      styles.borderLeft = `${borderSize} solid transparent`;
      styles.borderRight = `${borderSize} solid transparent`;
      styles.borderBottom = `${borderSize} solid ${borderColor}`;
      break;
    case 'bottom':
      styles.bottom = -arrowSize;
      styles.left = arrowOffset - arrowSize;
      styles.borderLeft = `${borderSize} solid transparent`;
      styles.borderRight = `${borderSize} solid transparent`;
      styles.borderTop = `${borderSize} solid ${borderColor}`;
      break;
    case 'left':
      styles.left = -arrowSize;
      styles.top = arrowOffset - arrowSize;
      styles.borderTop = `${borderSize} solid transparent`;
      styles.borderBottom = `${borderSize} solid transparent`;
      styles.borderRight = `${borderSize} solid ${borderColor}`;
      break;
    case 'right':
      styles.right = -arrowSize;
      styles.top = arrowOffset - arrowSize;
      styles.borderTop = `${borderSize} solid transparent`;
      styles.borderBottom = `${borderSize} solid transparent`;
      styles.borderLeft = `${borderSize} solid ${borderColor}`;
      break;
  }

  return styles;
}
