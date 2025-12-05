/**
 * Moon position and phase calculations
 */

import { deg2rad, rad2deg } from '../coordinates/conversions';
import { getJulianDate } from '../time/julian';
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
  const JD = jd ?? getJulianDate();
  // Known new moon reference (Jan 6, 2000)
  const knownNewMoon = 2451550.1;
  const daysSinceNew = JD - knownNewMoon;
  const phase = (daysSinceNew % SYNODIC_MONTH) / SYNODIC_MONTH;
  return phase < 0 ? phase + 1 : phase;
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
  const JD = jd ?? getJulianDate();
  const T = (JD - 2451545.0) / 36525;
  
  // Mean longitude of the Moon
  const L0 = 218.3164477 + 481267.88123421 * T;
  // Mean anomaly of the Moon
  const M = 134.9633964 + 477198.8675055 * T;
  // Mean anomaly of the Sun
  const Ms = 357.5291092 + 35999.0502909 * T;
  // Moon's argument of latitude
  const F = 93.2720950 + 483202.0175233 * T;
  // Mean elongation of the Moon
  const D = 297.8501921 + 445267.1114034 * T;
  
  // Simplified longitude correction
  const lon = L0 + 6.289 * Math.sin(deg2rad(M))
            + 1.274 * Math.sin(deg2rad(2 * D - M))
            + 0.658 * Math.sin(deg2rad(2 * D))
            - 0.186 * Math.sin(deg2rad(Ms));
  
  // Simplified latitude
  const lat = 5.128 * Math.sin(deg2rad(F));
  
  // Convert ecliptic to equatorial (simplified, assumes obliquity ~23.44°)
  const obliquity = 23.44;
  const lonRad = deg2rad(lon);
  const latRad = deg2rad(lat);
  const oblRad = deg2rad(obliquity);
  
  const ra = rad2deg(Math.atan2(
    Math.sin(lonRad) * Math.cos(oblRad) - Math.tan(latRad) * Math.sin(oblRad),
    Math.cos(lonRad)
  ));
  
  const dec = rad2deg(Math.asin(
    Math.sin(latRad) * Math.cos(oblRad) + Math.cos(latRad) * Math.sin(oblRad) * Math.sin(lonRad)
  ));
  
  return { ra: ((ra % 360) + 360) % 360, dec };
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
  const jd = date.getTime() / 86400000 + 2440587.5;
  const moonPos = getMoonPosition(jd);
  
  // Calculate hour angle
  const S = jd - 2451545.0;
  const T = S / 36525.0;
  const GST = 280.46061837 + 360.98564736629 * S + T ** 2 * (0.000387933 - T / 38710000);
  const LST = ((GST + longitude) % 360 + 360) % 360;
  const HA = deg2rad(LST - moonPos.ra);
  
  const latRad = deg2rad(latitude);
  const decRad = deg2rad(moonPos.dec);
  
  const sinAlt = Math.sin(decRad) * Math.sin(latRad) +
                 Math.cos(decRad) * Math.cos(latRad) * Math.cos(HA);
  
  return rad2deg(Math.asin(sinAlt));
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
  const startJD = from.getTime() / 86400000 + 2440587.5;
  const currentPhase = getMoonPhase(startJD);
  
  let daysUntil = (targetPhase - currentPhase) * SYNODIC_MONTH;
  if (daysUntil <= 0) daysUntil += SYNODIC_MONTH;
  
  return new Date(from.getTime() + daysUntil * 86400000);
}
