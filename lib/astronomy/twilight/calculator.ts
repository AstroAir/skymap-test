/**
 * Twilight time calculations
 */

import { deg2rad, rad2deg } from '../coordinates/conversions';
import { dateToJulianDate } from '../time/julian';
import { getLSTForDate } from '../time/sidereal';
import { getSunPosition } from '../celestial/sun';
import type { TwilightTimes, TwilightPhase } from '@/lib/core/types/astronomy';

// ============================================================================
// Twilight Thresholds
// ============================================================================

export const TWILIGHT_THRESHOLDS = {
  sunrise: -0.833,      // Sun at horizon (refraction corrected)
  civil: -6,            // Civil twilight
  nautical: -12,        // Nautical twilight
  astronomical: -18,    // Astronomical twilight
} as const;

// ============================================================================
// Hour Angle Calculation
// ============================================================================

/**
 * Calculate hour angle for a given altitude threshold
 * @param dec - Declination in degrees
 * @param lat - Observer latitude in degrees
 * @param altThreshold - Altitude threshold in degrees
 * @returns Hour angle in degrees, or NaN if object never reaches threshold
 */
export function calculateHourAngle(
  dec: number, 
  lat: number, 
  altThreshold: number
): number {
  const latRad = deg2rad(lat);
  const decRad = deg2rad(dec);
  const altRad = deg2rad(altThreshold);
  
  const cosH = (Math.sin(altRad) - Math.sin(latRad) * Math.sin(decRad)) /
               (Math.cos(latRad) * Math.cos(decRad));
  
  if (cosH > 1) return NaN;  // Never rises above threshold
  if (cosH < -1) return 180; // Always above threshold (circumpolar sun)
  
  return rad2deg(Math.acos(cosH));
}

// ============================================================================
// Twilight Time Calculations
// ============================================================================

/**
 * Calculate precise twilight times for a given date and location
 * @param latitude - Observer latitude in degrees
 * @param longitude - Observer longitude in degrees
 * @param date - Date for calculation (defaults to today)
 * @returns Complete twilight times
 */
export function calculateTwilightTimes(
  latitude: number,
  longitude: number,
  date: Date = new Date()
): TwilightTimes {
  // Get sun position at local noon
  const localNoon = new Date(date);
  localNoon.setHours(12, 0, 0, 0);
  
  const jdNoon = dateToJulianDate(localNoon);
  const sunPos = getSunPosition(jdNoon);
  const sunDec = sunPos.dec;
  const sunRa = sunPos.ra;
  
  // Calculate hour angles for different twilight thresholds
  const haSet = calculateHourAngle(sunDec, latitude, TWILIGHT_THRESHOLDS.sunrise);
  const haCivil = calculateHourAngle(sunDec, latitude, TWILIGHT_THRESHOLDS.civil);
  const haNautical = calculateHourAngle(sunDec, latitude, TWILIGHT_THRESHOLDS.nautical);
  const haAstro = calculateHourAngle(sunDec, latitude, TWILIGHT_THRESHOLDS.astronomical);
  
  // Convert hour angles to times
  const lst12 = getLSTForDate(longitude, localNoon);
  
  const toLocalTime = (ha: number, isRise: boolean): Date | null => {
    if (isNaN(ha)) return null;
    const lstEvent = isRise ? (sunRa - ha + 360) % 360 : (sunRa + ha) % 360;
    let hourDiff = (lstEvent - lst12) / 15;
    if (hourDiff > 12) hourDiff -= 24;
    if (hourDiff < -12) hourDiff += 24;
    const eventTime = new Date(localNoon.getTime() + hourDiff * 3600000);
    return eventTime;
  };
  
  const sunset = toLocalTime(haSet, false);
  const sunrise = toLocalTime(haSet, true);
  const civilDusk = toLocalTime(haCivil, false);
  const civilDawn = toLocalTime(haCivil, true);
  const nauticalDusk = toLocalTime(haNautical, false);
  const nauticalDawn = toLocalTime(haNautical, true);
  const astronomicalDusk = toLocalTime(haAstro, false);
  const astronomicalDawn = toLocalTime(haAstro, true);
  
  // If dawn is before dusk, add a day
  const adjustedAstroDawn = astronomicalDawn && astronomicalDusk && astronomicalDawn < astronomicalDusk
    ? new Date(astronomicalDawn.getTime() + 86400000)
    : astronomicalDawn;
  
  // Calculate night duration
  let nightDuration = 0;
  let darknessDuration = 0;
  
  if (sunset && sunrise) {
    const nextSunrise = sunrise < sunset ? new Date(sunrise.getTime() + 86400000) : sunrise;
    nightDuration = (nextSunrise.getTime() - sunset.getTime()) / 3600000;
  }
  
  if (astronomicalDusk && adjustedAstroDawn) {
    darknessDuration = (adjustedAstroDawn.getTime() - astronomicalDusk.getTime()) / 3600000;
  }
  
  // Determine current twilight phase based on the provided date
  const currentPhase = getCurrentTwilightPhase(latitude, longitude, date);
  
  return {
    sunset,
    civilDusk,
    nauticalDusk,
    astronomicalDusk,
    astronomicalDawn: adjustedAstroDawn,
    nauticalDawn,
    civilDawn,
    sunrise,
    nightDuration,
    darknessDuration,
    isCurrentlyNight: currentPhase === 'night',
    currentTwilightPhase: currentPhase,
  };
}

/**
 * Get current twilight phase
 */
export function getCurrentTwilightPhase(
  latitude: number,
  longitude: number,
  date: Date = new Date()
): TwilightPhase {
  const jd = dateToJulianDate(date);
  const sunPos = getSunPosition(jd);
  
  // Calculate sun altitude
  const LST = getLSTForDate(longitude, date);
  const HA = deg2rad(LST - sunPos.ra);
  
  const latRad = deg2rad(latitude);
  const decRad = deg2rad(sunPos.dec);
  
  const sinAlt = Math.sin(decRad) * Math.sin(latRad) +
                 Math.cos(decRad) * Math.cos(latRad) * Math.cos(HA);
  const sunAlt = rad2deg(Math.asin(sinAlt));
  
  if (sunAlt > 0) return 'day';
  if (sunAlt > TWILIGHT_THRESHOLDS.civil) return 'civil';
  if (sunAlt > TWILIGHT_THRESHOLDS.nautical) return 'nautical';
  if (sunAlt > TWILIGHT_THRESHOLDS.astronomical) return 'astronomical';
  return 'night';
}

/**
 * Check if it's currently dark enough for deep sky imaging
 * @param latitude - Observer latitude
 * @param longitude - Observer longitude
 * @param date - Date to check
 * @returns Whether conditions are dark enough
 */
export function isDarkEnough(
  latitude: number,
  longitude: number,
  date: Date = new Date()
): boolean {
  const phase = getCurrentTwilightPhase(latitude, longitude, date);
  return phase === 'night' || phase === 'astronomical';
}

/**
 * Get time until darkness
 * @param latitude - Observer latitude
 * @param longitude - Observer longitude
 * @param date - Start date
 * @returns Minutes until astronomical darkness, or 0 if already dark
 */
export function getTimeUntilDarkness(
  latitude: number,
  longitude: number,
  date: Date = new Date()
): number {
  const twilight = calculateTwilightTimes(latitude, longitude, date);
  
  if (twilight.currentTwilightPhase === 'night') return 0;
  if (!twilight.astronomicalDusk) return -1; // No darkness tonight
  
  const now = date.getTime();
  const dusk = twilight.astronomicalDusk.getTime();
  
  if (dusk <= now) return 0;
  return Math.round((dusk - now) / 60000);
}
