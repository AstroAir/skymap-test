/**
 * Nighttime Calculator - Ported from N.I.N.A.
 * Calculates twilight times, moon phases, and darkness windows
 */

import type { NighttimeData, RiseAndSet, MoonPhase } from './types';

// ============================================================================
// Constants
// ============================================================================

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
const SYNODIC_MONTH = 29.53058867;
const KNOWN_NEW_MOON_JD = 2451550.1; // Jan 6, 2000

// Sun altitude thresholds
const SUN_HORIZON_ALTITUDE = -0.833; // Refraction corrected
const CIVIL_TWILIGHT_ALTITUDE = -6;
const NAUTICAL_TWILIGHT_ALTITUDE = -12;
const ASTRONOMICAL_TWILIGHT_ALTITUDE = -18;

// ============================================================================
// Core Julian Date Functions
// ============================================================================

/**
 * Convert Date to Julian Date
 */
export function dateToJulianDate(date: Date): number {
  let year = date.getUTCFullYear();
  let month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const hour = date.getUTCHours();
  const minute = date.getUTCMinutes();
  const second = date.getUTCSeconds();
  const millisecond = date.getUTCMilliseconds();

  if (month <= 2) {
    year -= 1;
    month += 12;
  }

  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  
  return Math.floor(365.25 * (year + 4716)) +
         Math.floor(30.6001 * (month + 1)) +
         day + B - 1524.5 +
         (hour + minute / 60 + second / 3600 + millisecond / 3600000) / 24;
}

/**
 * Convert Julian Date to Date
 */
export function julianDateToDate(jd: number): Date {
  const Z = Math.floor(jd + 0.5);
  const F = jd + 0.5 - Z;
  
  let A: number;
  if (Z < 2299161) {
    A = Z;
  } else {
    const alpha = Math.floor((Z - 1867216.25) / 36524.25);
    A = Z + 1 + alpha - Math.floor(alpha / 4);
  }
  
  const B = A + 1524;
  const C = Math.floor((B - 122.1) / 365.25);
  const D = Math.floor(365.25 * C);
  const E = Math.floor((B - D) / 30.6001);
  
  const day = B - D - Math.floor(30.6001 * E) + F;
  const month = E < 14 ? E - 1 : E - 13;
  const year = month > 2 ? C - 4716 : C - 4715;
  
  const dayInt = Math.floor(day);
  const dayFrac = day - dayInt;
  const hours = dayFrac * 24;
  const hoursInt = Math.floor(hours);
  const minutes = (hours - hoursInt) * 60;
  const minutesInt = Math.floor(minutes);
  const seconds = (minutes - minutesInt) * 60;
  
  return new Date(Date.UTC(year, month - 1, dayInt, hoursInt, minutesInt, Math.floor(seconds)));
}

// ============================================================================
// Sun Position Calculations
// ============================================================================

/**
 * Calculate sun's ecliptic longitude
 */
function getSunEclipticLongitude(jd: number): number {
  const T = (jd - 2451545.0) / 36525;
  
  // Mean longitude of the Sun
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  
  // Mean anomaly of the Sun
  const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  const MRad = M * DEG_TO_RAD;
  
  // Equation of center
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(MRad) +
            (0.019993 - 0.000101 * T) * Math.sin(2 * MRad) +
            0.000289 * Math.sin(3 * MRad);
  
  // True longitude
  return (L0 + C) % 360;
}

/**
 * Calculate sun's RA and Dec
 */
export function getSunPosition(jd: number): { ra: number; dec: number } {
  const T = (jd - 2451545.0) / 36525;
  
  // Obliquity of ecliptic
  const epsilon = 23.439291 - 0.0130042 * T;
  const epsilonRad = epsilon * DEG_TO_RAD;
  
  // Sun's ecliptic longitude
  const lambda = getSunEclipticLongitude(jd);
  const lambdaRad = lambda * DEG_TO_RAD;
  
  // Convert to equatorial coordinates
  const ra = Math.atan2(Math.cos(epsilonRad) * Math.sin(lambdaRad), Math.cos(lambdaRad)) * RAD_TO_DEG;
  const dec = Math.asin(Math.sin(epsilonRad) * Math.sin(lambdaRad)) * RAD_TO_DEG;
  
  return { ra: ((ra % 360) + 360) % 360, dec };
}

// ============================================================================
// Moon Position Calculations
// ============================================================================

/**
 * Calculate moon position (RA/Dec)
 */
export function getMoonPosition(jd: number): { ra: number; dec: number; distance: number } {
  const T = (jd - 2451545.0) / 36525;
  
  // Mean longitude of the Moon
  const L0 = 218.3164477 + 481267.88123421 * T - 0.0015786 * T * T;
  
  // Mean anomaly of the Moon
  const M = 134.9633964 + 477198.8675055 * T + 0.0087414 * T * T;
  const MRad = M * DEG_TO_RAD;
  
  // Mean anomaly of the Sun
  const Ms = 357.5291092 + 35999.0502909 * T - 0.0001536 * T * T;
  const MsRad = Ms * DEG_TO_RAD;
  
  // Moon's argument of latitude
  const F = 93.2720950 + 483202.0175233 * T - 0.0036539 * T * T;
  const FRad = F * DEG_TO_RAD;
  
  // Mean elongation of the Moon
  const D = 297.8501921 + 445267.1114034 * T - 0.0018819 * T * T;
  const DRad = D * DEG_TO_RAD;
  
  // Longitude correction (simplified, main terms)
  const lonCorr = 6.289 * Math.sin(MRad)
                + 1.274 * Math.sin(2 * DRad - MRad)
                + 0.658 * Math.sin(2 * DRad)
                + 0.214 * Math.sin(2 * MRad)
                - 0.186 * Math.sin(MsRad)
                - 0.114 * Math.sin(2 * FRad);
  
  // Latitude
  const lat = 5.128 * Math.sin(FRad)
            + 0.281 * Math.sin(MRad + FRad)
            + 0.278 * Math.sin(MRad - FRad);
  
  // Longitude
  const lon = (L0 + lonCorr) % 360;
  
  // Distance (Earth radii, approximate)
  const distance = 385001 - 20905 * Math.cos(MRad) - 3699 * Math.cos(2 * DRad - MRad);
  
  // Obliquity
  const epsilon = 23.439291 - 0.0130042 * T;
  const epsilonRad = epsilon * DEG_TO_RAD;
  const lonRad = lon * DEG_TO_RAD;
  const latRad = lat * DEG_TO_RAD;
  
  // Convert to equatorial
  const ra = Math.atan2(
    Math.sin(lonRad) * Math.cos(epsilonRad) - Math.tan(latRad) * Math.sin(epsilonRad),
    Math.cos(lonRad)
  ) * RAD_TO_DEG;
  
  const dec = Math.asin(
    Math.sin(latRad) * Math.cos(epsilonRad) + Math.cos(latRad) * Math.sin(epsilonRad) * Math.sin(lonRad)
  ) * RAD_TO_DEG;
  
  return { ra: ((ra % 360) + 360) % 360, dec, distance };
}

/**
 * Calculate moon phase (0 = new, 0.5 = full)
 */
export function getMoonPhase(jd: number): number {
  const daysSinceNew = jd - KNOWN_NEW_MOON_JD;
  const phase = (daysSinceNew % SYNODIC_MONTH) / SYNODIC_MONTH;
  return phase < 0 ? phase + 1 : phase;
}

/**
 * Get moon phase name
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
 * Calculate moon illumination percentage
 */
export function getMoonIllumination(phase: number): number {
  return (1 - Math.cos(phase * 2 * Math.PI)) / 2 * 100;
}

// ============================================================================
// Local Sidereal Time
// ============================================================================

/**
 * Calculate Local Sidereal Time for a given date and longitude
 */
export function getLocalSiderealTime(date: Date, longitude: number): number {
  const jd = dateToJulianDate(date);
  const S = jd - 2451545.0;
  const T = S / 36525.0;
  
  // Greenwich Sidereal Time
  let GST = 280.46061837 + 360.98564736629 * S + T * T * (0.000387933 - T / 38710000);
  GST = ((GST % 360) + 360) % 360;
  
  // Local Sidereal Time
  const LST = (GST + longitude + 360) % 360;
  
  return LST; // in degrees
}

/**
 * Convert LST in degrees to hours
 */
export function lstToHours(lstDegrees: number): number {
  return lstDegrees / 15;
}

// ============================================================================
// Rise/Set Calculations
// ============================================================================

/**
 * Calculate hour angle for a given altitude threshold
 */
function calculateHourAngle(dec: number, lat: number, altThreshold: number): number | null {
  const latRad = lat * DEG_TO_RAD;
  const decRad = dec * DEG_TO_RAD;
  const altRad = altThreshold * DEG_TO_RAD;
  
  const cosH = (Math.sin(altRad) - Math.sin(latRad) * Math.sin(decRad)) /
               (Math.cos(latRad) * Math.cos(decRad));
  
  if (cosH > 1) return null;  // Never rises above threshold
  if (cosH < -1) return 180;  // Always above threshold (circumpolar)
  
  return Math.acos(cosH) * RAD_TO_DEG;
}

/**
 * Calculate rise and set times for a celestial body
 */
function calculateRiseAndSet(
  ra: number,
  dec: number,
  latitude: number,
  longitude: number,
  referenceDate: Date,
  altitudeThreshold: number
): RiseAndSet {
  const hourAngle = calculateHourAngle(dec, latitude, altitudeThreshold);
  
  if (hourAngle === null) {
    // Never rises
    return { rise: null, set: null };
  }
  
  if (hourAngle === 180) {
    // Always above (circumpolar at this altitude)
    return { rise: null, set: null };
  }
  
  // Calculate local noon
  const noon = new Date(referenceDate);
  noon.setHours(12, 0, 0, 0);
  
  // Get LST at noon
  const lstNoon = getLocalSiderealTime(noon, longitude);
  
  // Transit occurs when LST = RA
  let hoursToTransit = (ra - lstNoon) / 15;
  if (hoursToTransit < -12) hoursToTransit += 24;
  if (hoursToTransit > 12) hoursToTransit -= 24;
  
  const transitTime = new Date(noon.getTime() + hoursToTransit * 3600000);
  
  // Rise and set times relative to transit
  const haHours = hourAngle / 15;
  const riseTime = new Date(transitTime.getTime() - haHours * 3600000);
  const setTime = new Date(transitTime.getTime() + haHours * 3600000);
  
  return { rise: riseTime, set: setTime };
}

/**
 * Calculate sun rise and set
 */
export function calculateSunRiseAndSet(
  latitude: number,
  longitude: number,
  referenceDate: Date
): RiseAndSet {
  const jd = dateToJulianDate(referenceDate);
  const sun = getSunPosition(jd);
  return calculateRiseAndSet(sun.ra, sun.dec, latitude, longitude, referenceDate, SUN_HORIZON_ALTITUDE);
}

/**
 * Calculate civil twilight
 */
export function calculateCivilTwilight(
  latitude: number,
  longitude: number,
  referenceDate: Date
): RiseAndSet {
  const jd = dateToJulianDate(referenceDate);
  const sun = getSunPosition(jd);
  return calculateRiseAndSet(sun.ra, sun.dec, latitude, longitude, referenceDate, CIVIL_TWILIGHT_ALTITUDE);
}

/**
 * Calculate nautical twilight
 */
export function calculateNauticalTwilight(
  latitude: number,
  longitude: number,
  referenceDate: Date
): RiseAndSet {
  const jd = dateToJulianDate(referenceDate);
  const sun = getSunPosition(jd);
  return calculateRiseAndSet(sun.ra, sun.dec, latitude, longitude, referenceDate, NAUTICAL_TWILIGHT_ALTITUDE);
}

/**
 * Calculate astronomical twilight
 */
export function calculateAstronomicalTwilight(
  latitude: number,
  longitude: number,
  referenceDate: Date
): RiseAndSet {
  const jd = dateToJulianDate(referenceDate);
  const sun = getSunPosition(jd);
  return calculateRiseAndSet(sun.ra, sun.dec, latitude, longitude, referenceDate, ASTRONOMICAL_TWILIGHT_ALTITUDE);
}

/**
 * Calculate moon rise and set
 */
export function calculateMoonRiseAndSet(
  latitude: number,
  longitude: number,
  referenceDate: Date
): RiseAndSet {
  const jd = dateToJulianDate(referenceDate);
  const moon = getMoonPosition(jd);
  // Moon apparent radius is about 0.26°, use -0.583 for upper limb
  return calculateRiseAndSet(moon.ra, moon.dec, latitude, longitude, referenceDate, -0.583);
}

// ============================================================================
// Reference Date Calculation (NINA style)
// ============================================================================

/**
 * Get the reference date for nighttime calculations
 * In NINA, this is noon on the current day (or previous day if before noon)
 */
export function getReferenceDate(date: Date = new Date()): Date {
  const d = new Date(date);
  
  if (d.getHours() >= 12) {
    // After noon - use today at noon
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0);
  } else {
    // Before noon - use yesterday at noon
    const yesterday = new Date(d);
    yesterday.setDate(yesterday.getDate() - 1);
    return new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 12, 0, 0);
  }
}

// ============================================================================
// Main Nighttime Calculator
// ============================================================================

/**
 * Calculate complete nighttime data for a given date and location
 * Ported from NINA NighttimeCalculator
 */
export function calculateNighttimeData(
  latitude: number,
  longitude: number,
  date: Date = new Date()
): NighttimeData {
  const referenceDate = getReferenceDate(date);
  const jd = dateToJulianDate(referenceDate);
  
  // Calculate twilight times
  const sunRiseAndSet = calculateSunRiseAndSet(latitude, longitude, referenceDate);
  const civilTwilightRiseAndSet = calculateCivilTwilight(latitude, longitude, referenceDate);
  const nauticalTwilightRiseAndSet = calculateNauticalTwilight(latitude, longitude, referenceDate);
  const twilightRiseAndSet = calculateAstronomicalTwilight(latitude, longitude, referenceDate);
  const moonRiseAndSet = calculateMoonRiseAndSet(latitude, longitude, referenceDate);
  
  // Calculate moon phase
  const moonPhaseValue = getMoonPhase(jd);
  const moonPhase = getMoonPhaseName(moonPhaseValue);
  const moonIllumination = getMoonIllumination(moonPhaseValue);
  
  // Adjust dawn times if they're before dusk (add a day)
  const adjustDawn = (riseAndSet: RiseAndSet): RiseAndSet => {
    if (riseAndSet.rise && riseAndSet.set && riseAndSet.rise < riseAndSet.set) {
      return {
        rise: new Date(riseAndSet.rise.getTime() + 86400000),
        set: riseAndSet.set
      };
    }
    return riseAndSet;
  };
  
  return {
    date,
    referenceDate,
    sunRiseAndSet: adjustDawn(sunRiseAndSet),
    civilTwilightRiseAndSet: adjustDawn(civilTwilightRiseAndSet),
    nauticalTwilightRiseAndSet: adjustDawn(nauticalTwilightRiseAndSet),
    twilightRiseAndSet: adjustDawn(twilightRiseAndSet),
    moonRiseAndSet: adjustDawn(moonRiseAndSet),
    moonPhase,
    moonPhaseValue,
    moonIllumination,
  };
}

/**
 * Calculate altitude of an object at a specific time
 */
export function calculateAltitude(
  ra: number,
  dec: number,
  latitude: number,
  longitude: number,
  date: Date
): number {
  const lst = getLocalSiderealTime(date, longitude);
  const hourAngle = lst - ra; // in degrees
  
  const latRad = latitude * DEG_TO_RAD;
  const decRad = dec * DEG_TO_RAD;
  const haRad = hourAngle * DEG_TO_RAD;
  
  const sinAlt = Math.sin(decRad) * Math.sin(latRad) +
                 Math.cos(decRad) * Math.cos(latRad) * Math.cos(haRad);
  
  return Math.asin(Math.max(-1, Math.min(1, sinAlt))) * RAD_TO_DEG;
}

/**
 * Calculate azimuth of an object at a specific time
 */
export function calculateAzimuth(
  ra: number,
  dec: number,
  latitude: number,
  longitude: number,
  date: Date
): number {
  const lst = getLocalSiderealTime(date, longitude);
  const hourAngle = lst - ra;
  
  const latRad = latitude * DEG_TO_RAD;
  const decRad = dec * DEG_TO_RAD;
  const haRad = hourAngle * DEG_TO_RAD;
  
  const y = -Math.cos(decRad) * Math.sin(haRad);
  const x = Math.sin(decRad) * Math.cos(latRad) - Math.cos(decRad) * Math.sin(latRad) * Math.cos(haRad);
  
  let azimuth = Math.atan2(y, x) * RAD_TO_DEG;
  if (azimuth < 0) azimuth += 360;
  
  return azimuth;
}

/**
 * Calculate angular separation between two objects (in degrees)
 */
export function calculateAngularSeparation(
  ra1: number, dec1: number,
  ra2: number, dec2: number
): number {
  const ra1Rad = ra1 * DEG_TO_RAD;
  const dec1Rad = dec1 * DEG_TO_RAD;
  const ra2Rad = ra2 * DEG_TO_RAD;
  const dec2Rad = dec2 * DEG_TO_RAD;
  
  const cosD = Math.sin(dec1Rad) * Math.sin(dec2Rad) +
               Math.cos(dec1Rad) * Math.cos(dec2Rad) * Math.cos(ra1Rad - ra2Rad);
  
  return Math.acos(Math.max(-1, Math.min(1, cosD))) * RAD_TO_DEG;
}
