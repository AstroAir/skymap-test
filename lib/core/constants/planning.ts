/**
 * Planning-related constants
 * Extracted from components/starmap/planning/exposure-calculator.tsx
 */

// ============================================================================
// Exposure Calculator Constants
// ============================================================================

export const COMMON_FILTERS = [
  { id: 'L', name: 'Luminance', type: 'broadband' },
  { id: 'R', name: 'Red', type: 'broadband' },
  { id: 'G', name: 'Green', type: 'broadband' },
  { id: 'B', name: 'Blue', type: 'broadband' },
  { id: 'Ha', name: 'H-Alpha', type: 'narrowband' },
  { id: 'OIII', name: 'OIII', type: 'narrowband' },
  { id: 'SII', name: 'SII', type: 'narrowband' },
  { id: 'NoFilter', name: 'No Filter', type: 'broadband' },
] as const;

export const BINNING_OPTIONS = ['1x1', '2x2', '3x3', '4x4'] as const;

export const IMAGE_TYPES = [
  { id: 'LIGHT', name: 'Light', description: 'Science frames' },
  { id: 'DARK', name: 'Dark', description: 'Calibration' },
  { id: 'FLAT', name: 'Flat', description: 'Calibration' },
  { id: 'BIAS', name: 'Bias', description: 'Calibration' },
] as const;
