/**
 * Equipment-related type definitions
 */

// ============================================================================
// Camera Types
// ============================================================================

export interface CameraPreset {
  id: string;
  name: string;
  sensorWidth: number;
  sensorHeight: number;
  pixelSize: number;
  resolutionX?: number;
  resolutionY?: number;
  isCustom: boolean;
}

// ============================================================================
// Telescope Types
// ============================================================================

export interface TelescopePreset {
  id: string;
  name: string;
  focalLength: number;
  aperture: number;
  type: string;
  isCustom: boolean;
}

// ============================================================================
// Mosaic Types
// ============================================================================

export interface MosaicSettings {
  enabled: boolean;
  rows: number;
  cols: number;
  overlap: number;
  overlapUnit: 'percent' | 'pixels';
}

// ============================================================================
// FOV Display Types
// ============================================================================

export type GridType = 'none' | 'crosshair' | 'thirds' | 'golden' | 'diagonal';

export interface FOVDisplaySettings {
  enabled: boolean;
  gridType: GridType;
  showCoordinateGrid: boolean;
  showConstellations: boolean;
  showConstellationBoundaries: boolean;
  showDSOLabels: boolean;
  overlayOpacity: number;
  frameColor: string;
}

// ============================================================================
// Exposure Types
// ============================================================================

export type BinningType = '1x1' | '2x2' | '3x3' | '4x4';
export type TrackingType = 'none' | 'basic' | 'guided';
export type TargetType = 'galaxy' | 'nebula' | 'cluster' | 'planetary';
export type GainStrategy = 'unity' | 'max_dynamic_range' | 'manual';

export interface ExposureDefaults {
  exposureTime: number;
  gain: number;
  offset: number;
  binning: BinningType;
  filter: string;
  frameCount: number;
  ditherEnabled: boolean;
  ditherEvery: number;
  tracking: TrackingType;
  targetType: TargetType;
  bortle: number;
  sqmOverride?: number;
  filterBandwidthNm: number;
  readNoiseLimitPercent: number;
  gainStrategy: GainStrategy;
  manualGain: number;
  manualReadNoiseEnabled: boolean;
  manualReadNoise: number;
  manualDarkCurrent: number;
  manualFullWell: number;
  manualQE: number;
  manualEPeraDu: number;
  targetSurfaceBrightness: number;
  targetSignalRate: number;
}
