/**
 * Planning-related constants
 * Extracted from components/starmap/planning/exposure-calculator.tsx
 */

// ============================================================================
// Exposure Calculator Constants
// ============================================================================

export const COMMON_FILTERS = [
  { id: 'L', nameKey: 'exposure.filterLuminance', type: 'broadband', bandwidthNm: 300 },
  { id: 'R', nameKey: 'exposure.filterRed', type: 'broadband', bandwidthNm: 100 },
  { id: 'G', nameKey: 'exposure.filterGreen', type: 'broadband', bandwidthNm: 100 },
  { id: 'B', nameKey: 'exposure.filterBlue', type: 'broadband', bandwidthNm: 100 },
  { id: 'Ha', nameKey: 'exposure.filterHAlpha', type: 'narrowband', bandwidthNm: 7 },
  { id: 'OIII', nameKey: 'exposure.filterOiii', type: 'narrowband', bandwidthNm: 7 },
  { id: 'SII', nameKey: 'exposure.filterSii', type: 'narrowband', bandwidthNm: 7 },
  { id: 'NoFilter', nameKey: 'exposure.filterNoFilter', type: 'broadband', bandwidthNm: 300 },
] as const;

export const BINNING_OPTIONS = ['1x1', '2x2', '3x3', '4x4'] as const;

export const IMAGE_TYPES = [
  { id: 'LIGHT', nameKey: 'exposure.imageTypeLight' },
  { id: 'DARK', nameKey: 'exposure.imageTypeDark' },
  { id: 'FLAT', nameKey: 'exposure.imageTypeFlat' },
  { id: 'BIAS', nameKey: 'exposure.imageTypeBias' },
] as const;

// ============================================================================
// Multi-Filter Sequence Presets
// ============================================================================

export interface FilterSequenceEntry {
  filterId: string;
  ratio: number;
}

export interface FilterSequencePreset {
  id: string;
  nameKey: string;
  filters: FilterSequenceEntry[];
}

export const FILTER_SEQUENCE_PRESETS: FilterSequencePreset[] = [
  {
    id: 'lrgb',
    nameKey: 'exposure.sequenceLrgb',
    filters: [
      { filterId: 'L', ratio: 4 },
      { filterId: 'R', ratio: 1 },
      { filterId: 'G', ratio: 1 },
      { filterId: 'B', ratio: 1 },
    ],
  },
  {
    id: 'rgb',
    nameKey: 'exposure.sequenceRgb',
    filters: [
      { filterId: 'R', ratio: 1 },
      { filterId: 'G', ratio: 1 },
      { filterId: 'B', ratio: 1 },
    ],
  },
  {
    id: 'sho',
    nameKey: 'exposure.sequenceSho',
    filters: [
      { filterId: 'SII', ratio: 1 },
      { filterId: 'Ha', ratio: 1 },
      { filterId: 'OIII', ratio: 1 },
    ],
  },
  {
    id: 'hoo',
    nameKey: 'exposure.sequenceHoo',
    filters: [
      { filterId: 'Ha', ratio: 2 },
      { filterId: 'OIII', ratio: 2 },
    ],
  },
  {
    id: 'ha-lrgb',
    nameKey: 'exposure.sequenceHaLrgb',
    filters: [
      { filterId: 'Ha', ratio: 3 },
      { filterId: 'L', ratio: 2 },
      { filterId: 'R', ratio: 1 },
      { filterId: 'G', ratio: 1 },
      { filterId: 'B', ratio: 1 },
    ],
  },
];
