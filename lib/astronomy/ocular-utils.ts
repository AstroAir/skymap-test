/**
 * Ocular view calculation utilities
 * Pure functions for eyepiece/telescope/barlow optical calculations
 */

import type { EyepiecePreset, BarlowPreset, OcularTelescopePreset } from '@/lib/constants/equipment-presets';
import type { OcularViewResult, OcularStar } from '@/types/starmap/overlays';

const RAD_TO_DEG = 180 / Math.PI;

function toFinitePositive(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function clampFinite(value: number, min: number, max: number, fallback = min): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  if (value < min) {
    return min;
  }

  if (value > max) {
    return max;
  }

  return value;
}

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
  const telescopeFocalLength = toFinitePositive(telescope.focalLength, 1);
  const telescopeAperture = toFinitePositive(telescope.aperture, 1);
  const eyepieceFocalLength = toFinitePositive(eyepiece.focalLength, 1);
  const eyepieceAfov = toFinitePositive(eyepiece.afov, 1);
  const barlowMagnification = toFinitePositive(barlow.magnification, 1);
  const fieldStop = Number.isFinite(eyepiece.fieldStop) ? eyepiece.fieldStop ?? 0 : 0;

  // Stellarium-aligned core optics
  const effectiveFocalLength = telescopeFocalLength * barlowMagnification;
  const magnification = effectiveFocalLength / eyepieceFocalLength;
  
  // True field of view — use field stop when available for precision
  const tfov = fieldStop > 0
    ? (fieldStop / effectiveFocalLength) * RAD_TO_DEG
    : eyepieceAfov / magnification;
  
  // Exit pupil
  const exitPupil = telescopeAperture / magnification;
  
  // Dawes limit (arcseconds) - theoretical resolution
  const dawesLimit = 116 / telescopeAperture;
  
  // Rayleigh limit (arcseconds) - diffraction limit
  const rayleighLimit = 138 / telescopeAperture;
  
  // Maximum useful magnification (2x aperture in mm)
  const maxUsefulMag = telescopeAperture * 2;
  
  // Minimum useful magnification (aperture/7 for 7mm exit pupil)
  const minUsefulMag = telescopeAperture / 7;
  
  // Best planetary magnification (~1.5x aperture in mm)
  const bestPlanetaryMag = telescopeAperture * 1.5;
  
  // Focal ratio
  const focalRatio = telescopeFocalLength / telescopeAperture;
  
  // Light gathering power compared to naked eye (7mm pupil)
  const lightGathering = Math.pow(telescopeAperture / 7, 2);
  
  // Limiting magnitude (approximate)
  const limitingMag = 2 + 5 * Math.log10(telescopeAperture);
  
  // Surface brightness factor (relative to naked eye, 7mm pupil)
  // Values >1 mean brighter extended objects; <1 means dimmer
  const surfaceBrightness = Math.pow(exitPupil / 7, 2);
  
  // Observing suggestion based on magnification range
  const safeMagnification = clampFinite(magnification, 0, 10000, 1);
  const safeTfov = clampFinite(tfov, 0, 180, 0);
  const safeExitPupil = clampFinite(exitPupil, 0, 100, 0);
  const safeDawesLimit = clampFinite(dawesLimit, 0.01, 100, 1);
  const safeRayleighLimit = clampFinite(rayleighLimit, 0.01, 120, 1.2);
  const safeMaxUsefulMag = clampFinite(maxUsefulMag, 1, 10000, 1);
  const safeMinUsefulMag = clampFinite(minUsefulMag, 0, 10000, 0);
  const safeBestPlanetaryMag = clampFinite(bestPlanetaryMag, 0, 10000, 0);
  const safeFocalRatio = clampFinite(focalRatio, 0.1, 100, 1);
  const safeLightGathering = clampFinite(lightGathering, 0, 100000, 1);
  const safeLimitingMag = clampFinite(limitingMag, -5, 40, 0);
  const safeSurfaceBrightness = clampFinite(surfaceBrightness, 0, 100, 0);
  const safeEffectiveFocalLength = clampFinite(effectiveFocalLength, 1, 50000, telescopeFocalLength);

  const isOverMagnified = safeMagnification > safeMaxUsefulMag;
  const isUnderMagnified = safeMagnification < safeMinUsefulMag;
  let observingSuggestion: OcularViewResult['observingSuggestion'];
  if (isOverMagnified) {
    observingSuggestion = 'overlimit';
  } else if (safeMagnification <= telescopeAperture * 0.7) {
    observingSuggestion = 'deepsky';
  } else if (safeMagnification >= telescopeAperture * 1.2) {
    observingSuggestion = 'planetary';
  } else {
    observingSuggestion = 'allround';
  }
  
  return {
    magnification: safeMagnification,
    tfov: safeTfov,
    exitPupil: safeExitPupil,
    dawesLimit: safeDawesLimit,
    rayleighLimit: safeRayleighLimit,
    maxUsefulMag: safeMaxUsefulMag,
    minUsefulMag: safeMinUsefulMag,
    bestPlanetaryMag: safeBestPlanetaryMag,
    focalRatio: safeFocalRatio,
    lightGathering: safeLightGathering,
    limitingMag: safeLimitingMag,
    surfaceBrightness: safeSurfaceBrightness,
    isOverMagnified,
    isUnderMagnified,
    effectiveFocalLength: safeEffectiveFocalLength,
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
