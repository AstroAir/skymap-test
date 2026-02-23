/**
 * Moon position and phase calculations
 */

import {
  Body,
  Equator,
  EquatorFromVector,
  GeoVector,
  Horizon,
  MoonPhase as AstronomyMoonPhase,
  Observer,
  RotateVector,
  Rotation_EQJ_EQD,
  SearchMoonPhase,
} from 'astronomy-engine';
import { dateToJulianDate, julianDateToDate } from '../time/julian';
import type { MoonPhase } from '@/lib/core/types/astronomy';

// ============================================================================
// Moon Phase Constants
// ============================================================================

export const SYNODIC_MONTH = 29.53058867; // days

export const MOON_PHASE_NAMES: Record<MoonPhase, string> = {
  new: 'New Moon',
  waxingCrescent: 'Waxing Crescent',
  firstQuarter: 'First Quarter',
  waxingGibbous: 'Waxing Gibbous',
  full: 'Full Moon',
  waningGibbous: 'Waning Gibbous',
  lastQuarter: 'Last Quarter',
  waningCrescent: 'Waning Crescent',
};

// ============================================================================
// Moon Phase Calculations
// ============================================================================

/**
 * Calculate moon phase (0 = new moon, 0.5 = full moon, 1 = new moon)
 * @param jd - Julian Date (optional, defaults to now)
 * @returns Phase value from 0 to 1
 */
export function getMoonPhase(jd?: number): number {
  const date = jd === undefined ? new Date() : julianDateToDate(jd);
  const phaseDegrees = AstronomyMoonPhase(date);
  const normalized = ((phaseDegrees % 360) + 360) % 360;
  return normalized / 360;
}

/**
 * Get moon phase name from phase value
 * @param phase - Phase value from 0 to 1
 * @returns Phase name
 */
export function getMoonPhaseName(phase: number): MoonPhase {
  if (phase < 0.03 || phase > 0.97) return 'new';
  if (phase < 0.22) return 'waxingCrescent';
  if (phase < 0.28) return 'firstQuarter';
  if (phase < 0.47) return 'waxingGibbous';
  if (phase < 0.53) return 'full';
  if (phase < 0.72) return 'waningGibbous';
  if (phase < 0.78) return 'lastQuarter';
  return 'waningCrescent';
}

/**
 * Get moon illumination percentage
 * @param phase - Phase value from 0 to 1
 * @returns Illumination percentage (0-100)
 */
export function getMoonIllumination(phase: number): number {
  // Illumination follows a cosine curve
  return Math.round((1 - Math.cos(phase * 2 * Math.PI)) / 2 * 100);
}

/**
 * Get complete moon info
 * @param jd - Julian Date (optional)
 */
export function getMoonInfo(jd?: number): {
  phase: number;
  phaseName: MoonPhase;
  illumination: number;
} {
  const phase = getMoonPhase(jd);
  return {
    phase,
    phaseName: getMoonPhaseName(phase),
    illumination: getMoonIllumination(phase),
  };
}

// ============================================================================
// Moon Position
// ============================================================================

/**
 * Calculate approximate moon position (RA/Dec in degrees)
 * This is a simplified calculation - accurate to ~2 degrees
 * @param jd - Julian Date (optional, defaults to now)
 * @returns Moon position in equatorial coordinates
 */
export function getMoonPosition(jd?: number): { ra: number; dec: number } {
  const date = jd === undefined ? new Date() : julianDateToDate(jd);
  const eqj = GeoVector(Body.Moon, date, true);
  const rotation = Rotation_EQJ_EQD(date);
  const eqd = RotateVector(rotation, eqj);
  const equator = EquatorFromVector(eqd);

  const raDeg = ((equator.ra * 15) % 360 + 360) % 360;
  return { ra: raDeg, dec: equator.dec };
}

/**
 * Calculate moon altitude for an observer
 * @param latitude - Observer latitude in degrees
 * @param longitude - Observer longitude in degrees
 * @param date - Date for calculation
 * @returns Moon altitude in degrees
 */
export function getMoonAltitude(
  latitude: number,
  longitude: number,
  date: Date = new Date()
): number {
  const observer = new Observer(latitude, longitude, 0);
  const eq = Equator(Body.Moon, date, observer, true, true);
  const hor = Horizon(date, observer, eq.ra, eq.dec);
  return hor.altitude;
}

/**
 * Check if moon is above horizon
 * @param latitude - Observer latitude
 * @param longitude - Observer longitude
 * @param date - Date for calculation
 */
export function isMoonUp(
  latitude: number,
  longitude: number,
  date: Date = new Date()
): boolean {
  return getMoonAltitude(latitude, longitude, date) > 0;
}

/**
 * Get next moon phase date
 * @param targetPhase - Target phase (0 = new, 0.5 = full)
 * @param from - Start date (defaults to now)
 * @returns Date of next occurrence of target phase
 */
export function getNextMoonPhase(
  targetPhase: number, 
  from: Date = new Date()
): Date {
  const normalizedTarget = ((targetPhase % 1) + 1) % 1;

  try {
    const time = SearchMoonPhase(normalizedTarget * 360, from, 40);
    if (time) return time.date;
  } catch {
    // Fall back to legacy approximation below.
  }

  const startJD = dateToJulianDate(from);
  const currentPhase = getMoonPhase(startJD);

  let daysUntil = (normalizedTarget - currentPhase) * SYNODIC_MONTH;
  if (daysUntil <= 0) daysUntil += SYNODIC_MONTH;

  return new Date(from.getTime() + daysUntil * 86400000);
}
