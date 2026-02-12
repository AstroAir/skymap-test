/**
 * Setup Wizard Constants
 *
 * Contains step definitions, icon mappings, display options,
 * and storage keys for the setup wizard feature.
 */

import {
  MapPin,
  Telescope,
  Settings2,
  Rocket,
  Sparkles,
  Layers,
  Moon,
  Grid3X3,
  Compass,
} from 'lucide-react';
import type { SetupWizardStep, PreferenceOption } from '@/types/starmap/setup-wizard';

// ============================================================================
// Step Definitions
// ============================================================================

export const SETUP_WIZARD_STEPS: SetupWizardStep[] = [
  'welcome',
  'location',
  'equipment',
  'preferences',
  'complete',
];

// ============================================================================
// Step Icons
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
