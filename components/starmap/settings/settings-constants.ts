import type { GridType, BinningType } from '@/lib/stores';

// ============================================================================
// Display Settings Configuration
// ============================================================================

export const DISPLAY_SETTINGS = [
  { key: 'constellationsLinesVisible' as const, labelKey: 'settings.constellationLines' },
  { key: 'constellationArtVisible' as const, labelKey: 'settings.constellationArt' },
  { key: 'dsosVisible' as const, labelKey: 'settings.deepSkyObjects' },
  { key: 'atmosphereVisible' as const, labelKey: 'settings.atmosphere' },
  { key: 'landscapesVisible' as const, labelKey: 'settings.landscape' },
] as const;

export const GRID_SETTINGS = [
  { key: 'azimuthalLinesVisible' as const, labelKey: 'settings.azimuthalGrid' },
  { key: 'equatorialLinesVisible' as const, labelKey: 'settings.equatorialGrid' },
  { key: 'meridianLinesVisible' as const, labelKey: 'settings.meridianLine' },
  { key: 'eclipticLinesVisible' as const, labelKey: 'settings.eclipticLine' },
] as const;

// ============================================================================
// Exposure Settings Configuration
// ============================================================================

export const TRACKING_OPTIONS = [
  { value: 'none' as const, labelKey: 'exposure.trackingNone' },
  { value: 'basic' as const, labelKey: 'exposure.trackingBasic' },
  { value: 'guided' as const, labelKey: 'exposure.trackingGuided' },
] as const;

export const TARGET_TYPE_OPTIONS = [
  { value: 'galaxy' as const, labelKey: 'exposure.galaxy' },
  { value: 'nebula' as const, labelKey: 'exposure.nebula' },
  { value: 'cluster' as const, labelKey: 'exposure.cluster' },
  { value: 'planetary' as const, labelKey: 'exposure.planetary' },
] as const;

export const BINNING_OPTIONS: BinningType[] = ['1x1', '2x2', '3x3', '4x4'];

export const FILTER_OPTIONS = [
  { id: 'L', name: 'Luminance' },
  { id: 'R', name: 'Red' },
  { id: 'G', name: 'Green' },
  { id: 'B', name: 'Blue' },
  { id: 'Ha', name: 'H-Alpha' },
  { id: 'OIII', name: 'OIII' },
  { id: 'SII', name: 'SII' },
  { id: 'NoFilter', name: 'No Filter' },
];

// ============================================================================
// FOV Settings Configuration
// ============================================================================

export const GRID_TYPE_OPTIONS: { value: GridType; label: string; icon: string }[] = [
  { value: 'none', label: 'None', icon: '○' },
  { value: 'crosshair', label: 'Crosshair', icon: '┼' },
  { value: 'thirds', label: 'Thirds', icon: '▦' },
  { value: 'golden', label: 'Golden', icon: '◫' },
  { value: 'diagonal', label: 'Diagonal', icon: '╳' },
];

export const FRAME_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', 
  '#3b82f6', '#8b5cf6', '#ec4899', '#ffffff',
];

// ============================================================================
// Default Settings Values
// ============================================================================

export const DEFAULT_STELLARIUM_SETTINGS = {
  constellationsLinesVisible: true,
  constellationArtVisible: false,
  azimuthalLinesVisible: false,
  equatorialLinesVisible: false,
  meridianLinesVisible: false,
  eclipticLinesVisible: false,
  atmosphereVisible: false,
  landscapesVisible: false,
  dsosVisible: true,
  surveyEnabled: true,
  surveyId: 'dss',
  surveyUrl: undefined,
  skyCultureLanguage: 'native' as const,
  nightMode: false,
  sensorControl: false,
};
