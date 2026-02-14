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
  
  // True field of view — use field stop when available for precision
  const tfov = eyepiece.fieldStop && eyepiece.fieldStop > 0
    ? (eyepiece.fieldStop / effectiveFocalLength) * (180 / Math.PI)
    : eyepiece.afov / magnification;
  
  // Exit pupil
  const exitPupil = telescope.aperture / magnification;
  
  // Dawes limit (arcseconds) - theoretical resolution
  const dawesLimit = 116 / telescope.aperture;
  
  // Rayleigh limit (arcseconds) - diffraction limit
  const rayleighLimit = 138 / telescope.aperture;
  
  // Maximum useful magnification (2x aperture in mm)
  const maxUsefulMag = telescope.aperture * 2;
  
  // Minimum useful magnification (aperture/7 for 7mm exit pupil)
  const minUsefulMag = telescope.aperture / 7;
  
  // Best planetary magnification (~1.5x aperture in mm)
  const bestPlanetaryMag = telescope.aperture * 1.5;
  
  // Focal ratio
  const focalRatio = telescope.focalLength / telescope.aperture;
  
  // Light gathering power compared to naked eye (7mm pupil)
  const lightGathering = Math.pow(telescope.aperture / 7, 2);
  
  // Limiting magnitude (approximate)
  const limitingMag = 2 + 5 * Math.log10(telescope.aperture);
  
  // Surface brightness factor (relative to naked eye, 7mm pupil)
  // Values >1 mean brighter extended objects; <1 means dimmer
  const surfaceBrightness = Math.pow(exitPupil / 7, 2);
  
  // Observing suggestion based on magnification range
  const isOverMagnified = magnification > maxUsefulMag;
  const isUnderMagnified = magnification < minUsefulMag;
  let observingSuggestion: OcularViewResult['observingSuggestion'];
  if (isOverMagnified) {
    observingSuggestion = 'overlimit';
  } else if (magnification <= telescope.aperture * 0.7) {
    observingSuggestion = 'deepsky';
  } else if (magnification >= telescope.aperture * 1.2) {
    observingSuggestion = 'planetary';
  } else {
    observingSuggestion = 'allround';
  }
  
  return {
    magnification,
    tfov,
    exitPupil,
    dawesLimit,
    rayleighLimit,
    maxUsefulMag,
    minUsefulMag,
    bestPlanetaryMag,
    focalRatio,
    lightGathering,
    limitingMag,
    surfaceBrightness,
    isOverMagnified,
    isUnderMagnified,
    effectiveFocalLength,
    observingSuggestion,
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
