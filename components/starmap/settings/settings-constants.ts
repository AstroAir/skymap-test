import type { GridType, BinningType } from '@/lib/stores';

// ============================================================================
// Display Settings Configuration
// ============================================================================

export const DISPLAY_SETTINGS = [
  { key: 'constellationsLinesVisible' as const, labelKey: 'settings.constellationLines' },
  { key: 'constellationArtVisible' as const, labelKey: 'settings.constellationArt' },
  { key: 'constellationLabelsVisible' as const, labelKey: 'settings.constellationLabels' },
  { key: 'starLabelsVisible' as const, labelKey: 'settings.starLabels' },
  { key: 'planetLabelsVisible' as const, labelKey: 'settings.planetLabels' },
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
  { id: 'L', nameKey: 'exposure.filterLuminance' },
  { id: 'R', nameKey: 'exposure.filterRed' },
  { id: 'G', nameKey: 'exposure.filterGreen' },
  { id: 'B', nameKey: 'exposure.filterBlue' },
  { id: 'Ha', nameKey: 'exposure.filterHAlpha' },
  { id: 'OIII', nameKey: 'exposure.filterOiii' },
  { id: 'SII', nameKey: 'exposure.filterSii' },
  { id: 'NoFilter', nameKey: 'exposure.filterNoFilter' },
];

// ============================================================================
// FOV Settings Configuration
// ============================================================================

export const GRID_TYPE_OPTIONS: { value: GridType; labelKey: string; icon: string }[] = [
  { value: 'none', labelKey: 'fov.gridNone', icon: '○' },
  { value: 'crosshair', labelKey: 'fov.gridCrosshair', icon: '┼' },
  { value: 'thirds', labelKey: 'fov.gridThirds', icon: '▦' },
  { value: 'golden', labelKey: 'fov.gridGolden', icon: '◫' },
  { value: 'diagonal', labelKey: 'fov.gridDiagonal', icon: '╳' },
];

// Mosaic configuration limits
export const MAX_MOSAIC_ROWS = 10;
export const MAX_MOSAIC_COLS = 10;

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
  constellationLabelsVisible: true,
  starLabelsVisible: true,
  planetLabelsVisible: true,
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
  crosshairVisible: true,
  crosshairColor: 'rgba(255, 255, 255, 0.3)',
};
