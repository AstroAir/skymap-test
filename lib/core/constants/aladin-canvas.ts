// ============================================================================
// Aladin Lite Canvas Constants
// ============================================================================

import type { StellariumProjection } from '@/lib/core/types';

// Default Aladin initialization options
export const ALADIN_DEFAULT_FOV = 60;
export const ALADIN_DEFAULT_SURVEY = 'P/DSS2/color';
export const ALADIN_DEFAULT_PROJECTION = 'SIN';
export const ALADIN_DEFAULT_COO_FRAME = 'ICRSd';

// Aladin WASM loading timeout
export const ALADIN_INIT_TIMEOUT = 30000; // 30s

// Smooth navigation animation duration (seconds)
export const ALADIN_NAVIGATE_DURATION = 1.5;

// Zoom factors (matching Stellarium behavior)
export const ALADIN_ZOOM_IN_FACTOR = 0.7;
export const ALADIN_ZOOM_OUT_FACTOR = 1.4;

// Stellarium projection type → Aladin projection code mapping
export const STELLARIUM_TO_ALADIN_PROJECTION: Record<StellariumProjection, string> = {
  'stereographic': 'STG',
  'equal-area': 'ZEA',
  'perspective': 'TAN',
  'fisheye': 'FEYE',
  'hammer': 'AIT',
  'cylinder': 'CAR',
  'mercator': 'MER',
  'orthographic': 'SIN',
  'sinusoidal': 'SFL',
  'miller': 'MER', // No direct equivalent, approximate with Mercator
};
