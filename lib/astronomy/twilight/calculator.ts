/**
 * Twilight time calculations.
 *
 * Definition notes (cross-checked against authoritative sources):
 * - Sunrise/Sunset: `astronomy-engine` `SearchRiseSet` uses the apparent upper limb of the Sun/Moon
 *   and corrects for standard atmospheric refraction (34 arcminutes) plus the body's angular radius.
 *   For the Sun this matches the common NOAA-style ~0.833° sunrise/sunset convention.
 * - Civil/Nautical/Astronomical twilight: `SearchAltitude` searches for the Sun's center crossing
 *   -6/-12/-18 degrees and, by convention, is NOT corrected for atmospheric refraction.
 */

import { Body, Equator, Horizon, Observer, SearchAltitude, SearchRiseSet } from 'astronomy-engine';
import { deg2rad, rad2deg } from '../coordinates/conversions';
import type { TwilightPhase, TwilightTimes } from '@/lib/core/types/astronomy';

// ============================================================================
// Twilight Thresholds
// ============================================================================

export const TWILIGHT_THRESHOLDS = {
  sunrise: -0.833, // Common sunrise/sunset definition (~upper limb + refraction)
  civil: -6,
  nautical: -12,
  astronomical: -18,
} as const;

// ============================================================================
// Hour Angle Calculation (legacy utility; still exported)
// ============================================================================

/**
 * Calculate hour angle for a given altitude threshold.
 *
 * @param dec - Declination in degrees
 * @param lat - Observer latitude in degrees
 * @param altThreshold - Altitude threshold in degrees
 * @returns Hour angle in degrees, or NaN if object never reaches threshold
 */
export function calculateHourAngle(dec: number, lat: number, altThreshold: number): number {
  const latRad = deg2rad(lat);
  const decRad = deg2rad(dec);
  const altRad = deg2rad(altThreshold);

  const cosH =
    (Math.sin(altRad) - Math.sin(latRad) * Math.sin(decRad)) / (Math.cos(latRad) * Math.cos(decRad));

  if (cosH > 1) return NaN; // Never rises above threshold
  if (cosH < -1) return 180; // Always above threshold (circumpolar)

  return rad2deg(Math.acos(cosH));
}

function toDateOrNull(time: { date: Date } | null): Date | null {
  return time ? time.date : null;
}

// ============================================================================
// Twilight Time Calculations
// ============================================================================

/**
 * Calculate precise twilight times for a given date and location.
 *
 * Sunrise/Sunset use `SearchRiseSet` (upper limb + refraction).
 * Twilight levels use `SearchAltitude` (Sun center, no refraction).
 */
export function calculateTwilightTimes(
  latitude: number,
  longitude: number,
  date: Date = new Date()
): TwilightTimes {
  const observer = new Observer(latitude, longitude, 0);

  const noon = new Date(date);
  noon.setHours(12, 0, 0, 0);

  const sunset = toDateOrNull(SearchRiseSet(Body.Sun, observer, -1, noon, 2));
  const sunrise = toDateOrNull(SearchRiseSet(Body.Sun, observer, +1, noon, 3));

  const civilDusk = toDateOrNull(SearchAltitude(Body.Sun, observer, -1, noon, 3, TWILIGHT_THRESHOLDS.civil));
  let civilDawn = toDateOrNull(SearchAltitude(Body.Sun, observer, +1, noon, 3, TWILIGHT_THRESHOLDS.civil));

  const nauticalDusk = toDateOrNull(
    SearchAltitude(Body.Sun, observer, -1, noon, 3, TWILIGHT_THRESHOLDS.nautical)
  );
  let nauticalDawn = toDateOrNull(
    SearchAltitude(Body.Sun, observer, +1, noon, 3, TWILIGHT_THRESHOLDS.nautical)
  );

  const astronomicalDusk = toDateOrNull(
    SearchAltitude(Body.Sun, observer, -1, noon, 3, TWILIGHT_THRESHOLDS.astronomical)
  );
  let astronomicalDawn = toDateOrNull(
    SearchAltitude(Body.Sun, observer, +1, noon, 3, TWILIGHT_THRESHOLDS.astronomical)
  );

  const ensureDawnAfterDusk = (dusk: Date | null, dawn: Date | null, altitude: number): Date | null => {
    if (!dusk || !dawn) return dawn;
    if (dawn.getTime() > dusk.getTime()) return dawn;
    return toDateOrNull(SearchAltitude(Body.Sun, observer, +1, dusk, 3, altitude));
  };

  civilDawn = ensureDawnAfterDusk(civilDusk, civilDawn, TWILIGHT_THRESHOLDS.civil);
  nauticalDawn = ensureDawnAfterDusk(nauticalDusk, nauticalDawn, TWILIGHT_THRESHOLDS.nautical);
  astronomicalDawn = ensureDawnAfterDusk(astronomicalDusk, astronomicalDawn, TWILIGHT_THRESHOLDS.astronomical);

  // Durations (hours)
  let nightDuration = 0;
  let darknessDuration = 0;

  if (sunset && sunrise) {
    const sunriseAfterSunset =
      sunrise.getTime() <= sunset.getTime() ? new Date(sunrise.getTime() + 86400000) : sunrise;
    nightDuration = Math.max(0, (sunriseAfterSunset.getTime() - sunset.getTime()) / 3600000);
  }

  if (astronomicalDusk && astronomicalDawn) {
    const astroDawnAfterDusk =
      astronomicalDawn.getTime() <= astronomicalDusk.getTime()
        ? new Date(astronomicalDawn.getTime() + 86400000)
        : astronomicalDawn;
    darknessDuration = Math.max(0, (astroDawnAfterDusk.getTime() - astronomicalDusk.getTime()) / 3600000);
  }

  const currentPhase = getCurrentTwilightPhase(latitude, longitude, date);

  return {
    sunset,
    civilDusk,
    nauticalDusk,
    astronomicalDusk,
    astronomicalDawn,
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
 * Get current twilight phase using topocentric Sun altitude (geometric, no refraction).
 */
export function getCurrentTwilightPhase(
  latitude: number,
  longitude: number,
  date: Date = new Date()
): TwilightPhase {
  const observer = new Observer(latitude, longitude, 0);
  const eq = Equator(Body.Sun, date, observer, true, true);
  const hor = Horizon(date, observer, eq.ra, eq.dec);
  const sunAlt = hor.altitude;

  if (sunAlt > 0) return 'day';
  if (sunAlt > TWILIGHT_THRESHOLDS.civil) return 'civil';
  if (sunAlt > TWILIGHT_THRESHOLDS.nautical) return 'nautical';
  if (sunAlt > TWILIGHT_THRESHOLDS.astronomical) return 'astronomical';
  return 'night';
}

/**
 * Check if it's currently dark enough for deep sky imaging.
 */
export function isDarkEnough(latitude: number, longitude: number, date: Date = new Date()): boolean {
  const phase = getCurrentTwilightPhase(latitude, longitude, date);
  return phase === 'night' || phase === 'astronomical';
}

/**
 * Get time until astronomical darkness.
 *
 * @returns Minutes until astronomical dusk, 0 if already dark, -1 if no darkness tonight.
 */
export function getTimeUntilDarkness(latitude: number, longitude: number, date: Date = new Date()): number {
  const twilight = calculateTwilightTimes(latitude, longitude, date);

  if (twilight.currentTwilightPhase === 'night') return 0;
  if (!twilight.astronomicalDusk) return -1;

  const now = date.getTime();
  const dusk = twilight.astronomicalDusk.getTime();
  if (dusk <= now) return 0;
  return Math.round((dusk - now) / 60000);
}

