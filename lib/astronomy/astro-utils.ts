/**
 * Advanced astronomical utility functions for astrophotography planning
 */

import { 
  deg2rad, 
  rad2deg,
  getJulianDate,
  getLST,
  raDecToAltAz,
} from './starmap-utils';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface TwilightTimes {
  // Evening times (Date objects in local time)
  sunset: Date | null;
  civilDusk: Date | null;      // Sun at -6°
  nauticalDusk: Date | null;   // Sun at -12°
  astronomicalDusk: Date | null; // Sun at -18°
  
  // Morning times
  astronomicalDawn: Date | null; // Sun at -18°
  nauticalDawn: Date | null;   // Sun at -12°
  civilDawn: Date | null;      // Sun at -6°
  sunrise: Date | null;
  
  // Derived info
  nightDuration: number;       // Hours of astronomical darkness
  darknessDuration: number;    // Hours when sun below -18°
  isCurrentlyNight: boolean;
  currentTwilightPhase: 'day' | 'civil' | 'nautical' | 'astronomical' | 'night';
}

export interface TargetVisibility {
  riseTime: Date | null;
  setTime: Date | null;
  transitTime: Date | null;
  transitAltitude: number;
  
  // Visibility windows
  isCurrentlyVisible: boolean;
  isCircumpolar: boolean;
  neverRises: boolean;
  
  // Imaging windows (above minimum altitude, typically 30°)
  imagingWindowStart: Date | null;
  imagingWindowEnd: Date | null;
  imagingHours: number;
  
  // Combined with darkness
  darkImagingStart: Date | null;
  darkImagingEnd: Date | null;
  darkImagingHours: number;
}

export interface ImagingFeasibility {
  score: number;              // 0-100 overall score
  moonScore: number;          // Moon interference (100 = no interference)
  altitudeScore: number;      // Target altitude quality
  durationScore: number;      // Available imaging time
  twilightScore: number;      // Darkness quality
  
  recommendation: 'excellent' | 'good' | 'fair' | 'poor' | 'not_recommended';
  warnings: string[];
  tips: string[];
}

export interface MultiTargetPlan {
  targets: Array<{
    id: string;
    name: string;
    ra: number;
    dec: number;
    windowStart: Date | null;
    windowEnd: Date | null;
    duration: number;
    feasibility: ImagingFeasibility;
    conflicts: string[];       // IDs of conflicting targets
  }>;
  
  totalImagingTime: number;
  nightCoverage: number;       // Percentage of night utilized
  recommendations: string[];
}

// ============================================================================
// Core Astronomical Calculations
// ============================================================================

/**
 * Calculate Julian Date from a specific Date object
 */
export function getJulianDateFromDate(date: Date): number {
  let year = date.getUTCFullYear();
  let month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const hour = date.getUTCHours();
  const minute = date.getUTCMinutes();
  const second = date.getUTCSeconds();

  if (month <= 2) {
    year -= 1;
    month += 12;
  }

  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  const JD =
    Math.floor(365.25 * (year + 4716)) +
    Math.floor(30.6001 * (month + 1)) +
    day +
    B -
    1524.5 +
    (hour + minute / 60 + second / 3600) / 24;

  return JD;
}

/**
 * Convert Julian Date to Date object
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

/**
 * Calculate moon phase (0 = new moon, 0.5 = full moon, 1 = new moon)
 */
export function getMoonPhase(jd?: number): number {
  const JD = jd ?? getJulianDate();
  // Synodic month in days
  const synodicMonth = 29.53058867;
  // Known new moon reference (Jan 6, 2000)
  const knownNewMoon = 2451550.1;
  const daysSinceNew = JD - knownNewMoon;
  const phase = (daysSinceNew % synodicMonth) / synodicMonth;
  return phase < 0 ? phase + 1 : phase;
}

/**
 * Get moon phase name
 */
export function getMoonPhaseName(phase: number): string {
  if (phase < 0.03 || phase > 0.97) return 'New Moon';
  if (phase < 0.22) return 'Waxing Crescent';
  if (phase < 0.28) return 'First Quarter';
  if (phase < 0.47) return 'Waxing Gibbous';
  if (phase < 0.53) return 'Full Moon';
  if (phase < 0.72) return 'Waning Gibbous';
  if (phase < 0.78) return 'Last Quarter';
  return 'Waning Crescent';
}

/**
 * Get moon illumination percentage
 */
export function getMoonIllumination(phase: number): number {
  // Illumination follows a cosine curve
  return Math.round((1 - Math.cos(phase * 2 * Math.PI)) / 2 * 100);
}

/**
 * Calculate approximate moon position (RA/Dec in degrees)
 * This is a simplified calculation - accurate to ~2 degrees
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
 * Calculate angular separation between two celestial objects (degrees)
 */
export function angularSeparation(
  ra1: number, dec1: number,
  ra2: number, dec2: number
): number {
  const ra1Rad = deg2rad(ra1);
  const dec1Rad = deg2rad(dec1);
  const ra2Rad = deg2rad(ra2);
  const dec2Rad = deg2rad(dec2);
  
  const cosD = Math.sin(dec1Rad) * Math.sin(dec2Rad) +
               Math.cos(dec1Rad) * Math.cos(dec2Rad) * Math.cos(ra1Rad - ra2Rad);
  
  return rad2deg(Math.acos(Math.min(1, Math.max(-1, cosD))));
}

/**
 * Calculate sun position (RA/Dec in degrees)
 */
export function getSunPosition(jd?: number): { ra: number; dec: number } {
  const JD = jd ?? getJulianDate();
  const T = (JD - 2451545.0) / 36525;
  
  // Mean longitude of the Sun
  const L0 = 280.46646 + 36000.76983 * T;
  // Mean anomaly of the Sun
  const M = 357.52911 + 35999.05029 * T;
  
  // Equation of center
  const C = (1.914602 - 0.004817 * T) * Math.sin(deg2rad(M))
          + 0.019993 * Math.sin(deg2rad(2 * M));
  
  // True longitude
  const lon = L0 + C;
  
  // Obliquity of ecliptic
  const obliquity = 23.439 - 0.00000036 * (JD - 2451545.0);
  
  const lonRad = deg2rad(lon);
  const oblRad = deg2rad(obliquity);
  
  const ra = rad2deg(Math.atan2(Math.cos(oblRad) * Math.sin(lonRad), Math.cos(lonRad)));
  const dec = rad2deg(Math.asin(Math.sin(oblRad) * Math.sin(lonRad)));
  
  return { ra: ((ra % 360) + 360) % 360, dec };
}

/**
 * Calculate astronomical twilight times
 * Returns times in hours from midnight UTC
 */
export function getTwilightTimes(
  latitude: number,
  longitude: number,
  jd?: number
): {
  sunriseAstro: number;
  sunsetAstro: number;
  sunriseNautical: number;
  sunsetNautical: number;
  sunriseCivil: number;
  sunsetCivil: number;
  isNight: boolean;
  isDarkEnough: boolean; // Astronomical twilight
} {
  const JD = jd ?? getJulianDate();
  const sun = getSunPosition(JD);
  const { altitude } = raDecToAltAz(sun.ra, sun.dec, latitude, longitude);
  
  // Simplified calculation - returns current state
  const isNight = altitude < -18;
  const isDarkEnough = altitude < -12;
  
  // For actual times, we'd need to iterate through the day
  // This is a simplified version that returns approximate times
  const dayOfYear = Math.floor((JD - 2451545.0) % 365.25);
  const declination = 23.44 * Math.sin(deg2rad((360 / 365) * (dayOfYear + 284)));
  
  const latRad = deg2rad(latitude);
  const decRad = deg2rad(declination);
  
  // Hour angle at sunset (civil twilight = -6°)
  const cosH = (Math.sin(deg2rad(-6)) - Math.sin(latRad) * Math.sin(decRad)) /
               (Math.cos(latRad) * Math.cos(decRad));
  
  let sunsetCivil = 12;
  let sunriseCivil = 12;
  
  if (Math.abs(cosH) <= 1) {
    const H = rad2deg(Math.acos(cosH)) / 15;
    sunsetCivil = 12 + H - longitude / 15;
    sunriseCivil = 12 - H - longitude / 15;
  }
  
  return {
    sunriseAstro: sunriseCivil - 1.5,
    sunsetAstro: sunsetCivil + 1.5,
    sunriseNautical: sunriseCivil - 1,
    sunsetNautical: sunsetCivil + 1,
    sunriseCivil,
    sunsetCivil,
    isNight,
    isDarkEnough,
  };
}

/**
 * Calculate target altitude over time (for altitude chart)
 * Returns array of { hour, altitude } for next 24 hours
 */
export function getAltitudeOverTime(
  ra: number,
  dec: number,
  latitude: number,
  longitude: number,
  hoursAhead: number = 24,
  intervalMinutes: number = 30
): Array<{ hour: number; altitude: number; azimuth: number }> {
  const result: Array<{ hour: number; altitude: number; azimuth: number }> = [];
  const now = new Date();
  const stepsPerHour = 60 / intervalMinutes;
  const totalSteps = hoursAhead * stepsPerHour;
  
  for (let i = 0; i <= totalSteps; i++) {
    const futureTime = new Date(now.getTime() + i * intervalMinutes * 60 * 1000);
    const hour = i / stepsPerHour;
    
    // Calculate LST at future time
    const futureJD = futureTime.getTime() / 86400000 + 2440587.5;
    const S = futureJD - 2451545.0;
    const T = S / 36525.0;
    const GST = 280.46061837 + 360.98564736629 * S + T ** 2 * (0.000387933 - T / 38710000);
    const LST = (GST + longitude) % 360;
    
    // Calculate hour angle
    const HA = LST - ra;
    const HARad = deg2rad(HA);
    const decRad = deg2rad(dec);
    const latRad = deg2rad(latitude);
    
    // Calculate altitude
    const sinAlt = Math.sin(decRad) * Math.sin(latRad) +
                   Math.cos(decRad) * Math.cos(latRad) * Math.cos(HARad);
    const altitude = rad2deg(Math.asin(sinAlt));
    
    // Calculate azimuth
    const y = -Math.cos(decRad) * Math.sin(HARad);
    const x = Math.sin(decRad) * Math.cos(latRad) - Math.cos(decRad) * Math.sin(latRad) * Math.cos(HARad);
    let azimuth = rad2deg(Math.atan2(y, x));
    if (azimuth < 0) azimuth += 360;
    
    result.push({ hour, altitude, azimuth });
  }
  
  return result;
}

/**
 * Find transit time (when object is highest in sky)
 */
export function getTransitTime(
  ra: number,
  longitude: number
): { transitLST: number; hoursUntilTransit: number } {
  const LST = getLST(longitude);
  const transitLST = ra; // Object transits when LST = RA
  
  let hoursUntilTransit = (transitLST - LST) / 15;
  if (hoursUntilTransit < 0) hoursUntilTransit += 24;
  if (hoursUntilTransit > 24) hoursUntilTransit -= 24;
  
  return { transitLST, hoursUntilTransit };
}

/**
 * Calculate maximum altitude for an object
 */
export function getMaxAltitude(dec: number, latitude: number): number {
  // Maximum altitude occurs at transit
  // Alt_max = 90 - |latitude - declination|
  return 90 - Math.abs(latitude - dec);
}

/**
 * Check if object is circumpolar (never sets)
 */
export function isCircumpolar(dec: number, latitude: number): boolean {
  return Math.abs(dec) > (90 - Math.abs(latitude));
}

/**
 * Check if object never rises
 */
export function neverRises(dec: number, latitude: number): boolean {
  // Object never rises if its declination is too far from observer's latitude
  if (latitude >= 0) {
    return dec < -(90 - latitude);
  } else {
    return dec > (90 + latitude);
  }
}

/**
 * Calculate imaging hours within a dark window above minimum altitude
 */
export function calculateImagingHours(
  altitudeData: { points: Array<{ altitude: number; time: Date }> },
  minAltitude: number,
  darkStart: Date | null,
  darkEnd: Date | null
): number {
  if (!darkStart || !darkEnd) return 0;

  const darkStartMs = darkStart.getTime();
  const darkEndMs = darkEnd.getTime();

  let totalHours = 0;
  const intervalHours = 0.1; // 6 minutes

  for (const point of altitudeData.points) {
    const timeMs = point.time.getTime();
    if (timeMs >= darkStartMs && timeMs <= darkEndMs && point.altitude >= minAltitude) {
      totalHours += intervalHours;
    }
  }

  return totalHours;
}

/**
 * Bortle scale descriptions
 */
export const BORTLE_SCALE = [
  { value: 1, name: 'Excellent dark-sky site', sqm: 21.99, description: 'Zodiacal light, gegenschein visible' },
  { value: 2, name: 'Typical dark-sky site', sqm: 21.89, description: 'Airglow visible, M33 direct vision' },
  { value: 3, name: 'Rural sky', sqm: 21.69, description: 'Some light pollution on horizon' },
  { value: 4, name: 'Rural/suburban transition', sqm: 21.25, description: 'Light domes visible' },
  { value: 5, name: 'Suburban sky', sqm: 20.49, description: 'Milky Way washed out at zenith' },
  { value: 6, name: 'Bright suburban sky', sqm: 19.50, description: 'Milky Way invisible' },
  { value: 7, name: 'Suburban/urban transition', sqm: 18.94, description: 'M31 barely visible' },
  { value: 8, name: 'City sky', sqm: 18.38, description: 'Only bright stars visible' },
  { value: 9, name: 'Inner-city sky', sqm: 17.80, description: 'Only planets and brightest stars' },
];

/**
 * Calculate recommended single exposure time based on conditions
 */
export function calculateExposure(params: {
  bortle: number;
  focalLength: number;
  aperture: number;
  pixelSize?: number; // microns
  tracking: 'none' | 'basic' | 'guided';
}): {
  maxUntracked: number;
  recommendedSingle: number;
  minForSignal: number;
} {
  const { bortle, focalLength, aperture, tracking } = params;
  
  // 500 rule for untracked (or NPF rule approximation)
  const maxUntracked = 500 / focalLength;
  
  // Base exposure for good signal in given conditions
  // Darker skies allow longer exposures before sky glow dominates
  const bortleMultiplier = [8, 6, 5, 4, 3, 2.5, 2, 1.5, 1][bortle - 1] || 2;
  
  // f-ratio affects exposure
  const fRatio = focalLength / aperture;
  const fRatioFactor = (fRatio / 4) ** 2;
  
  let recommendedSingle: number;
  switch (tracking) {
    case 'none':
      recommendedSingle = Math.min(maxUntracked * 0.8, 30);
      break;
    case 'basic':
      recommendedSingle = Math.min(60 * bortleMultiplier * fRatioFactor, 180);
      break;
    case 'guided':
      recommendedSingle = Math.min(120 * bortleMultiplier * fRatioFactor, 600);
      break;
  }
  
  // Minimum exposure to get decent signal
  const minForSignal = 10 * fRatioFactor;
  
  return {
    maxUntracked: Math.round(maxUntracked * 10) / 10,
    recommendedSingle: Math.round(recommendedSingle),
    minForSignal: Math.round(minForSignal),
  };
}

/**
 * Calculate total integration time recommendation
 */
export function calculateTotalIntegration(params: {
  bortle: number;
  targetType: 'galaxy' | 'nebula' | 'cluster' | 'planetary';
  isNarrowband?: boolean;
}): {
  minimum: number; // minutes
  recommended: number;
  ideal: number;
} {
  const { bortle, targetType, isNarrowband = false } = params;
  
  // Base times in minutes
  const baseByType = {
    galaxy: { min: 60, rec: 180, ideal: 480 },
    nebula: { min: 30, rec: 120, ideal: 360 },
    cluster: { min: 15, rec: 45, ideal: 120 },
    planetary: { min: 5, rec: 15, ideal: 45 },
  };
  
  const base = baseByType[targetType];
  
  // Adjust for light pollution (darker = less time needed)
  const bortleFactor = 1 + (bortle - 4) * 0.15;
  
  // Narrowband can cut through light pollution
  const narrowbandFactor = isNarrowband ? 0.7 : 1;
  
  return {
    minimum: Math.round(base.min * bortleFactor * narrowbandFactor),
    recommended: Math.round(base.rec * bortleFactor * narrowbandFactor),
    ideal: Math.round(base.ideal * bortleFactor * narrowbandFactor),
  };
}

// ============================================================================
// Precise Twilight and Sun/Moon Rise/Set Calculations
// ============================================================================

/**
 * Calculate hour angle for a given altitude threshold
 * Returns NaN if object never reaches that altitude (circumpolar/never rises)
 */
function calculateHourAngle(dec: number, lat: number, altThreshold: number): number {
  const latRad = deg2rad(lat);
  const decRad = deg2rad(dec);
  const altRad = deg2rad(altThreshold);
  
  const cosH = (Math.sin(altRad) - Math.sin(latRad) * Math.sin(decRad)) /
               (Math.cos(latRad) * Math.cos(decRad));
  
  if (cosH > 1) return NaN;  // Never rises above threshold
  if (cosH < -1) return 180; // Always above threshold (circumpolar)
  
  return rad2deg(Math.acos(cosH));
}

/**
 * Get Local Sidereal Time for a specific date
 */
function getLSTForDate(date: Date, longitude: number): number {
  const jd = getJulianDateFromDate(date);
  const S = jd - 2451545.0;
  const T = S / 36525.0;
  const GST = 280.46061837 + 360.98564736629 * S + T ** 2 * (0.000387933 - T / 38710000);
  return ((GST + longitude) % 360 + 360) % 360;
}

/**
 * Calculate precise twilight times for a given date and location
 */
export function calculateTwilightTimes(
  latitude: number,
  longitude: number,
  date: Date = new Date()
): TwilightTimes {
  // Get sun position at local noon
  const localNoon = new Date(date);
  localNoon.setHours(12, 0, 0, 0);
  
  const jdNoon = getJulianDateFromDate(localNoon);
  const sunPos = getSunPosition(jdNoon);
  const sunDec = sunPos.dec;
  
  // Calculate hour angles for different twilight thresholds
  const haSet = calculateHourAngle(sunDec, latitude, -0.833);  // Sunset (refraction corrected)
  const haCivil = calculateHourAngle(sunDec, latitude, -6);
  const haNautical = calculateHourAngle(sunDec, latitude, -12);
  const haAstro = calculateHourAngle(sunDec, latitude, -18);
  
  // Convert hour angles to times
  const sunRa = sunPos.ra;
  const lst12 = getLSTForDate(localNoon, longitude);
  
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
  
  // Determine current twilight phase
  const sunAltAz = raDecToAltAz(sunPos.ra, sunPos.dec, latitude, longitude);
  const sunAlt = sunAltAz.altitude;
  
  let currentTwilightPhase: TwilightTimes['currentTwilightPhase'];
  if (sunAlt > 0) {
    currentTwilightPhase = 'day';
  } else if (sunAlt > -6) {
    currentTwilightPhase = 'civil';
  } else if (sunAlt > -12) {
    currentTwilightPhase = 'nautical';
  } else if (sunAlt > -18) {
    currentTwilightPhase = 'astronomical';
  } else {
    currentTwilightPhase = 'night';
  }
  
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
    isCurrentlyNight: currentTwilightPhase === 'night',
    currentTwilightPhase,
  };
}

/**
 * Calculate target rise, set, and transit times
 */
export function calculateTargetVisibility(
  ra: number,
  dec: number,
  latitude: number,
  longitude: number,
  minAltitude: number = 30,
  date: Date = new Date()
): TargetVisibility {
  const now = date;
  
  // Check if circumpolar or never rises
  const maxAlt = 90 - Math.abs(latitude - dec);
  const minAlt = -90 + Math.abs(latitude + dec);
  const circumpolar = minAlt > 0;
  const neverRisesFlag = maxAlt < 0;
  
  // Current position
  const currentAltAz = raDecToAltAz(ra, dec, latitude, longitude);
  const isCurrentlyVisible = currentAltAz.altitude > 0;
  
  // Calculate hour angle for horizon crossing
  const haHorizon = calculateHourAngle(dec, latitude, 0);
  const haMinAlt = calculateHourAngle(dec, latitude, minAltitude);
  
  // Calculate transit time
  const lstNow = getLSTForDate(now, longitude);
  let hoursToTransit = (ra - lstNow) / 15;
  if (hoursToTransit < 0) hoursToTransit += 24;
  if (hoursToTransit > 24) hoursToTransit -= 24;
  const transitTime = new Date(now.getTime() + hoursToTransit * 3600000);
  
  // Calculate rise and set times
  let riseTime: Date | null = null;
  let setTime: Date | null = null;
  let imagingWindowStart: Date | null = null;
  let imagingWindowEnd: Date | null = null;
  
  if (!neverRisesFlag && !circumpolar && !isNaN(haHorizon)) {
    // Rise time (before transit)
    riseTime = new Date(transitTime.getTime() - (haHorizon / 15) * 3600000);
    // Set time (after transit)
    setTime = new Date(transitTime.getTime() + (haHorizon / 15) * 3600000);
  }
  
  // Imaging window (above minAltitude)
  if (!isNaN(haMinAlt) && haMinAlt !== 180) {
    imagingWindowStart = new Date(transitTime.getTime() - (haMinAlt / 15) * 3600000);
    imagingWindowEnd = new Date(transitTime.getTime() + (haMinAlt / 15) * 3600000);
  } else if (haMinAlt === 180 || circumpolar) {
    // Always above minAltitude (for very high objects)
    imagingWindowStart = riseTime;
    imagingWindowEnd = setTime;
  }
  
  const imagingHours = imagingWindowStart && imagingWindowEnd
    ? (imagingWindowEnd.getTime() - imagingWindowStart.getTime()) / 3600000
    : circumpolar ? 24 : 0;
  
  // Calculate dark imaging window (intersection with astronomical night)
  const twilight = calculateTwilightTimes(latitude, longitude, date);
  let darkImagingStart: Date | null = null;
  let darkImagingEnd: Date | null = null;
  let darkImagingHours = 0;
  
  if (twilight.astronomicalDusk && twilight.astronomicalDawn && imagingWindowStart && imagingWindowEnd) {
    const nightStart = twilight.astronomicalDusk.getTime();
    const nightEnd = twilight.astronomicalDawn.getTime();
    const imgStart = imagingWindowStart.getTime();
    const imgEnd = imagingWindowEnd.getTime();
    
    const overlapStart = Math.max(nightStart, imgStart);
    const overlapEnd = Math.min(nightEnd, imgEnd);
    
    if (overlapEnd > overlapStart) {
      darkImagingStart = new Date(overlapStart);
      darkImagingEnd = new Date(overlapEnd);
      darkImagingHours = (overlapEnd - overlapStart) / 3600000;
    }
  }
  
  return {
    riseTime,
    setTime,
    transitTime,
    transitAltitude: maxAlt,
    isCurrentlyVisible,
    isCircumpolar: circumpolar,
    neverRises: neverRisesFlag,
    imagingWindowStart,
    imagingWindowEnd,
    imagingHours,
    darkImagingStart,
    darkImagingEnd,
    darkImagingHours,
  };
}

/**
 * Calculate imaging feasibility score for a target
 */
export function calculateImagingFeasibility(
  ra: number,
  dec: number,
  latitude: number,
  longitude: number,
  date: Date = new Date()
): ImagingFeasibility {
  const warnings: string[] = [];
  const tips: string[] = [];
  
  // Get target visibility
  const visibility = calculateTargetVisibility(ra, dec, latitude, longitude, 30, date);
  
  // Get twilight info
  const twilight = calculateTwilightTimes(latitude, longitude, date);
  
  // Get moon info
  const moonPos = getMoonPosition();
  const moonPhase = getMoonPhase();
  const moonIllum = getMoonIllumination(moonPhase);
  const moonDist = angularSeparation(ra, dec, moonPos.ra, moonPos.dec);
  const moonAltAz = raDecToAltAz(moonPos.ra, moonPos.dec, latitude, longitude);
  
  // Moon score (0-100)
  let moonScore = 100;
  if (moonAltAz.altitude > 0) {
    // Moon is up
    if (moonIllum > 80) {
      moonScore -= 40;
      if (moonDist < 30) {
        moonScore -= 30;
        warnings.push('Full moon very close to target');
      } else if (moonDist < 60) {
        moonScore -= 15;
        warnings.push('Bright moon affects imaging');
      }
    } else if (moonIllum > 50) {
      moonScore -= 20;
      if (moonDist < 30) {
        moonScore -= 20;
        warnings.push('Moon close to target');
      }
    } else if (moonIllum > 20) {
      moonScore -= 10;
    }
    tips.push(`Moon at ${moonDist.toFixed(0)}° from target`);
  } else {
    tips.push('Moon is below horizon');
  }
  moonScore = Math.max(0, moonScore);
  
  // Altitude score
  const currentAltAz = raDecToAltAz(ra, dec, latitude, longitude);
  let altitudeScore = 0;
  if (visibility.neverRises) {
    warnings.push('Target never rises at this location');
    altitudeScore = 0;
  } else if (currentAltAz.altitude >= 60) {
    altitudeScore = 100;
    tips.push('Excellent altitude for imaging');
  } else if (currentAltAz.altitude >= 45) {
    altitudeScore = 85;
  } else if (currentAltAz.altitude >= 30) {
    altitudeScore = 70;
    tips.push('Consider waiting for higher altitude');
  } else if (currentAltAz.altitude >= 15) {
    altitudeScore = 40;
    warnings.push('Low altitude increases atmospheric effects');
  } else if (currentAltAz.altitude > 0) {
    altitudeScore = 20;
    warnings.push('Very low altitude - poor seeing expected');
  } else {
    altitudeScore = 0;
    warnings.push('Target is below horizon');
  }
  
  // Duration score (based on dark imaging hours available tonight)
  let durationScore = 0;
  if (visibility.darkImagingHours >= 6) {
    durationScore = 100;
  } else if (visibility.darkImagingHours >= 4) {
    durationScore = 80;
  } else if (visibility.darkImagingHours >= 2) {
    durationScore = 60;
    warnings.push('Limited imaging time tonight');
  } else if (visibility.darkImagingHours >= 1) {
    durationScore = 40;
    warnings.push('Very limited imaging time');
  } else if (visibility.darkImagingHours > 0) {
    durationScore = 20;
    warnings.push('Minimal imaging window');
  } else {
    durationScore = 0;
    warnings.push('No dark imaging time available');
  }
  
  // Twilight score
  let twilightScore = 0;
  switch (twilight.currentTwilightPhase) {
    case 'night':
      twilightScore = 100;
      break;
    case 'astronomical':
      twilightScore = 80;
      tips.push('Astronomical twilight - good for imaging');
      break;
    case 'nautical':
      twilightScore = 40;
      warnings.push('Nautical twilight - only bright objects');
      break;
    case 'civil':
      twilightScore = 10;
      warnings.push('Civil twilight - too bright for DSO');
      break;
    case 'day':
      twilightScore = 0;
      warnings.push('Daylight - no DSO imaging possible');
      break;
  }
  
  // Overall score (weighted average)
  const score = Math.round(
    moonScore * 0.25 +
    altitudeScore * 0.30 +
    durationScore * 0.25 +
    twilightScore * 0.20
  );
  
  // Recommendation
  let recommendation: ImagingFeasibility['recommendation'];
  if (score >= 80) {
    recommendation = 'excellent';
  } else if (score >= 65) {
    recommendation = 'good';
  } else if (score >= 45) {
    recommendation = 'fair';
  } else if (score >= 25) {
    recommendation = 'poor';
  } else {
    recommendation = 'not_recommended';
  }
  
  return {
    score,
    moonScore,
    altitudeScore,
    durationScore,
    twilightScore,
    recommendation,
    warnings,
    tips,
  };
}

/**
 * Plan multiple targets for a night session
 */
export function planMultipleTargets(
  targets: Array<{ id: string; name: string; ra: number; dec: number }>,
  latitude: number,
  longitude: number,
  date: Date = new Date()
): MultiTargetPlan {
  const twilight = calculateTwilightTimes(latitude, longitude, date);
  
  const plannedTargets = targets.map(target => {
    const visibility = calculateTargetVisibility(
      target.ra, target.dec, latitude, longitude, 30, date
    );
    const feasibility = calculateImagingFeasibility(
      target.ra, target.dec, latitude, longitude, date
    );
    
    return {
      id: target.id,
      name: target.name,
      ra: target.ra,
      dec: target.dec,
      windowStart: visibility.darkImagingStart,
      windowEnd: visibility.darkImagingEnd,
      duration: visibility.darkImagingHours,
      feasibility,
      conflicts: [] as string[],
    };
  });
  
  // Find conflicts (overlapping windows where one should be prioritized)
  for (let i = 0; i < plannedTargets.length; i++) {
    for (let j = i + 1; j < plannedTargets.length; j++) {
      const a = plannedTargets[i];
      const b = plannedTargets[j];
      
      if (a.windowStart && a.windowEnd && b.windowStart && b.windowEnd) {
        const overlap = Math.max(0,
          Math.min(a.windowEnd.getTime(), b.windowEnd.getTime()) -
          Math.max(a.windowStart.getTime(), b.windowStart.getTime())
        ) / 3600000;
        
        if (overlap > 0.5) { // More than 30 minutes overlap
          a.conflicts.push(b.id);
          b.conflicts.push(a.id);
        }
      }
    }
  }
  
  // Calculate totals
  const totalImagingTime = plannedTargets.reduce((sum, t) => sum + t.duration, 0);
  const nightCoverage = twilight.darknessDuration > 0
    ? Math.min(100, (totalImagingTime / twilight.darknessDuration) * 100)
    : 0;
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  if (nightCoverage > 150) {
    recommendations.push('Too many targets - consider spreading across multiple nights');
  }
  
  const excellentTargets = plannedTargets.filter(t => t.feasibility.recommendation === 'excellent');
  if (excellentTargets.length > 0) {
    recommendations.push(`Prioritize: ${excellentTargets.map(t => t.name).join(', ')}`);
  }
  
  const sortedByStart = [...plannedTargets]
    .filter(t => t.windowStart)
    .sort((a, b) => (a.windowStart?.getTime() ?? 0) - (b.windowStart?.getTime() ?? 0));
  
  if (sortedByStart.length > 1) {
    recommendations.push(`Suggested order: ${sortedByStart.map(t => t.name).join(' → ')}`);
  }
  
  return {
    targets: plannedTargets,
    totalImagingTime,
    nightCoverage,
    recommendations,
  };
}

/**
 * Format time for display (HH:MM)
 */
export function formatTimeShort(date: Date | null): string {
  if (!date) return '--:--';
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

/**
 * Format duration in hours and minutes
 */
export function formatDuration(hours: number): string {
  if (hours <= 0) return '0m';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
