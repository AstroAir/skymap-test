/**
 * Ocular view calculation utilities
 * Pure functions for eyepiece/telescope/barlow optical calculations
 */

import type { EyepiecePreset, BarlowPreset, OcularTelescopePreset } from '@/lib/constants/equipment-presets';
import type { OcularViewResult, OcularStar } from '@/types/starmap/overlays';

// ============================================================================
// Calculation Functions
// ============================================================================

/**
 * Calculate ocular view parameters given telescope, eyepiece, and barlow combination
 */
export function calculateOcularView(
  telescope: OcularTelescopePreset,
  eyepiece: EyepiecePreset,
  barlow: BarlowPreset
): OcularViewResult {
  const effectiveFocalLength = telescope.focalLength * barlow.magnification;
  const magnification = effectiveFocalLength / eyepiece.focalLength;
  
  // True field of view
  const tfov = eyepiece.afov / magnification;
  
  // Exit pupil
  const exitPupil = telescope.aperture / magnification;
  
  // Dawes limit (arcseconds) - theoretical resolution
  const dawesLimit = 116 / telescope.aperture;
  
  // Maximum useful magnification (2x aperture in mm)
  const maxUsefulMag = telescope.aperture * 2;
  
  // Minimum useful magnification (aperture/7 for 7mm exit pupil)
  const minUsefulMag = telescope.aperture / 7;
  
  // Focal ratio
  const focalRatio = telescope.focalLength / telescope.aperture;
  
  // Light gathering power compared to naked eye (7mm pupil)
  const lightGathering = Math.pow(telescope.aperture / 7, 2);
  
  // Limiting magnitude (approximate)
  const limitingMag = 2 + 5 * Math.log10(telescope.aperture);
  
  return {
    magnification,
    tfov,
    exitPupil,
    dawesLimit,
    maxUsefulMag,
    minUsefulMag,
    focalRatio,
    lightGathering,
    limitingMag,
    isOverMagnified: magnification > maxUsefulMag,
    isUnderMagnified: magnification < minUsefulMag,
    effectiveFocalLength,
  };
}

// ============================================================================
// Star Field Generation
// ============================================================================

/**
 * Generate deterministic star data for ocular view simulation
 */
export function generateStars(count: number): OcularStar[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    size: (i % 3) + 1,
    left: (i * 7.3 + 13) % 100,
    top: (i * 11.7 + 23) % 100,
    opacity: 0.2 + ((i * 3.7) % 8) / 10,
  }));
}

/** Pre-generated star field for ocular view preview */
export const OCULAR_STARS = generateStars(50);
