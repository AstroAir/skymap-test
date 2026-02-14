/**
 * Exposure calculation utilities
 */

import { BORTLE_SCALE, getBortleExposureMultiplier, getBortleQualityMultiplier, getBortleMinimumMultiplier } from '@/lib/core/constants/bortle-scale';

// ============================================================================
// Types
// ============================================================================

type TrackingType = 'none' | 'basic' | 'guided';
type TargetType = 'galaxy' | 'nebula' | 'cluster' | 'planetary';

interface ExposureCalculationParams {
  bortle: number;
  focalLength: number;
  aperture: number;
  pixelSize?: number;
  tracking: TrackingType;
}

interface ExposureCalculationResult {
  maxUntracked: number;
  recommendedSingle: number;
  minForSignal: number;
}

interface IntegrationCalculationParams {
  bortle: number;
  targetType: TargetType;
  isNarrowband?: boolean;
}

interface IntegrationCalculationResult {
  minimum: number;
  recommended: number;
  ideal: number;
}

// ============================================================================
// Exposure Calculation
// ============================================================================

/**
 * Calculate recommended exposure times
 * @param params - Calculation parameters
 * @returns Recommended exposure times in seconds
 */
export function calculateExposure(params: ExposureCalculationParams): ExposureCalculationResult {
  const { bortle, focalLength, tracking } = params;
  
  // Maximum untracked exposure (500 rule, adjusted for declination)
  const maxUntracked = 500 / focalLength;
  
  // Recommended single exposure based on tracking and light pollution
  let recommendedSingle: number;
  
  switch (tracking) {
    case 'none':
      recommendedSingle = Math.min(maxUntracked * 0.8, 30);
      break;
    case 'basic':
      recommendedSingle = Math.min(120, 60 * getBortleExposureMultiplier(bortle) / 4);
      break;
    case 'guided':
      recommendedSingle = Math.min(300, 120 * getBortleExposureMultiplier(bortle) / 4);
      break;
    default:
      recommendedSingle = 60;
  }
  
  // Minimum exposure for signal (based on read noise vs. sky noise)
  // Brighter skies need shorter subs to avoid saturation
  const minForSignal = Math.max(10, 60 / Math.sqrt(10 - bortle));
  
  return {
    maxUntracked: Math.round(maxUntracked * 10) / 10,
    recommendedSingle: Math.round(recommendedSingle),
    minForSignal: Math.round(minForSignal),
  };
}

// ============================================================================
// Total Integration Time
// ============================================================================

/**
 * Calculate recommended total integration time
 * @param params - Calculation parameters
 * @returns Recommended integration times in minutes
 */
export function calculateTotalIntegration(
  params: IntegrationCalculationParams
): IntegrationCalculationResult {
  const { bortle, targetType, isNarrowband = false } = params;
  
  // Base integration times in minutes
  const baseMinutes: Record<TargetType, { min: number; rec: number; ideal: number }> = {
    galaxy: { min: 60, rec: 180, ideal: 480 },
    nebula: { min: 30, rec: 120, ideal: 360 },
    cluster: { min: 15, rec: 60, ideal: 180 },
    planetary: { min: 30, rec: 90, ideal: 240 },
  };
  
  const base = baseMinutes[targetType] || baseMinutes.nebula;
  
  // Minimum multiplier: light-polluted skies need MORE minimum time
  const minMultiplier = getBortleMinimumMultiplier(bortle);
  
  // Quality multiplier: darker skies reward more total integration
  const qualityMultiplier = getBortleQualityMultiplier(bortle);
  
  // Narrowband can cut through light pollution
  const narrowbandFactor = isNarrowband ? 0.5 : 1;
  
  return {
    minimum: Math.round(base.min * minMultiplier * narrowbandFactor),
    recommended: Math.round(base.rec * qualityMultiplier * narrowbandFactor * 0.5),
    ideal: Math.round(base.ideal * qualityMultiplier * narrowbandFactor * 0.5),
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate number of subframes needed
 * @param totalMinutes - Total integration time in minutes
 * @param subSeconds - Single sub exposure in seconds
 * @returns Number of subframes
 */
export function calculateSubframeCount(totalMinutes: number, subSeconds: number): number {
  return Math.ceil((totalMinutes * 60) / subSeconds);
}

/**
 * Get image scale in arcsec/pixel
 * @param focalLength - Focal length in mm
 * @param pixelSize - Pixel size in microns
 * @returns Image scale in arcsec/pixel
 */
export function getImageScale(focalLength: number, pixelSize: number): number {
  return (206.265 * pixelSize) / focalLength;
}

/**
 * Check if image scale is appropriate for seeing conditions
 * @param imageScale - Current image scale in arcsec/pixel
 * @param seeingArcsec - Seeing in arcseconds
 * @returns Assessment of sampling
 */
export function checkSampling(
  imageScale: number, 
  seeingArcsec: number
): 'undersampled' | 'optimal' | 'oversampled' {
  const optimalScale = seeingArcsec / 2; // Nyquist sampling
  
  if (imageScale > optimalScale * 1.5) return 'undersampled';
  if (imageScale < optimalScale * 0.5) return 'oversampled';
  return 'optimal';
}

/**
 * Calculate field of view
 * @param sensorSize - Sensor dimension in mm
 * @param focalLength - Focal length in mm
 * @returns FOV in degrees
 */
export function calculateFOV(sensorSize: number, focalLength: number): number {
  return (2 * Math.atan(sensorSize / (2 * focalLength)) * 180) / Math.PI;
}

/**
 * Format exposure time for display
 * @param seconds - Exposure time in seconds
 * @returns Formatted string
 */
export function formatExposureTime(seconds: number): string {
  if (seconds < 1) return `${Math.round(seconds * 1000)}ms`;
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

// Re-export Bortle scale for convenience
export { BORTLE_SCALE, getBortleExposureMultiplier, getBortleQualityMultiplier, getBortleMinimumMultiplier };
