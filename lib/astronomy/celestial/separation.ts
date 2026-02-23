/**
 * Angular separation calculations
 */

import {
  Body,
  Equator,
  EquatorFromVector,
  Horizon,
  Illumination,
  Observer,
  RotateVector,
  Rotation_EQJ_EQD,
  SearchRiseSet,
  Spherical,
  VectorFromSphere,
} from 'astronomy-engine';
import { deg2rad, rad2deg } from '../coordinates/conversions';
import { dateToJulianDate } from '../time/julian';
import { getLSTForDate } from '../time/sidereal';
import { calculateTwilightTimes } from '../twilight/calculator';
import { getMoonPosition } from './moon';

// ============================================================================
// Angular Separation
// ============================================================================

/**
 * Calculate angular separation between two celestial objects
 * @param ra1 - RA of first object in degrees
 * @param dec1 - Dec of first object in degrees
 * @param ra2 - RA of second object in degrees
 * @param dec2 - Dec of second object in degrees
 * @returns Angular separation in degrees
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
 * Calculate distance from target to moon
 * @param ra - Target RA in degrees
 * @param dec - Target Dec in degrees
 * @param jd - Julian Date (optional)
 * @returns Distance to moon in degrees
 */
export function getMoonDistance(ra: number, dec: number, jd?: number): number {
  const moonPos = getMoonPosition(jd);
  return angularSeparation(ra, dec, moonPos.ra, moonPos.dec);
}

/**
 * Check if target is too close to moon for imaging
 * @param ra - Target RA in degrees
 * @param dec - Target Dec in degrees
 * @param minDistance - Minimum acceptable distance in degrees (default 30°)
 * @param moonIllumination - Moon illumination percentage (0-100)
 * @returns Whether target is too close to moon
 */
export function isTooCloseToMoon(
  ra: number, 
  dec: number, 
  minDistance: number = 30,
  moonIllumination?: number
): boolean {
  const distance = getMoonDistance(ra, dec);
  
  // If moon illumination provided, adjust threshold
  if (moonIllumination !== undefined) {
    // Brighter moon = need more distance
    const adjustedMin = minDistance * (1 + moonIllumination / 200);
    return distance < adjustedMin;
  }
  
  return distance < minDistance;
}

/**
 * Get moon interference level for imaging
 * @param ra - Target RA in degrees
 * @param dec - Target Dec in degrees
 * @param moonIllumination - Moon illumination percentage
 * @returns Interference level: 'none' | 'low' | 'medium' | 'high' | 'severe'
 */
export function getMoonInterference(
  ra: number,
  dec: number,
  moonIllumination: number
): 'none' | 'low' | 'medium' | 'high' | 'severe' {
  const distance = getMoonDistance(ra, dec);
  
  // No moon (new moon) = no interference
  if (moonIllumination < 5) return 'none';
  
  // Calculate combined effect of distance and brightness
  const distanceScore = Math.min(1, distance / 90); // 0-1, higher = better
  const brightnessScore = 1 - moonIllumination / 100; // 0-1, higher = better
  const combinedScore = (distanceScore + brightnessScore) / 2;
  
  if (combinedScore > 0.8) return 'none';
  if (combinedScore > 0.6) return 'low';
  if (combinedScore > 0.4) return 'medium';
  if (combinedScore > 0.2) return 'high';
  return 'severe';
}

export interface OptimalMoonWindowOptions {
  minAltitudeDeg?: number;
  baseMinMoonDistanceDeg?: number;
  minWindowMinutes?: number;
  sampleMinutes?: number;
  refineToSeconds?: number;
}

export interface OptimalMoonWindowResult {
  hasWindow: boolean;
  moonRise: Date | null;
  moonSet: Date | null;
  bestWindow: { start: Date; end: Date } | null;
  diagnostics?: {
    illuminationPercent: number;
    minMoonDistanceDeg: number;
    darkStart: Date | null;
    darkEnd: Date | null;
    reasonIfNone?: 'no_darkness' | 'target_never_above_min_alt' | 'moon_always_bad' | 'invalid_input';
  };
}

function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360;
}

function clampDec(value: number): number {
  return Math.max(-90, Math.min(90, value));
}

function toDateOrNull(time: { date: Date } | null): Date | null {
  return time ? time.date : null;
}

function binaryRefineBoundary(
  predicate: (date: Date) => boolean,
  left: Date,
  right: Date,
  refineMs: number,
  mode: 'firstTrue' | 'lastTrue'
): Date {
  let lo = left.getTime();
  let hi = right.getTime();

  // Guard against degenerate ranges.
  if (!Number.isFinite(lo) || !Number.isFinite(hi) || hi <= lo) return mode === 'firstTrue' ? right : left;

  while (hi - lo > refineMs) {
    const mid = Math.floor((lo + hi) / 2);
    const ok = predicate(new Date(mid));

    if (mode === 'firstTrue') {
      if (ok) hi = mid;
      else lo = mid;
    } else {
      if (ok) lo = mid;
      else hi = mid;
    }
  }

  return new Date(mode === 'firstTrue' ? hi : lo);
}

/**
 * Calculate an observer-aware "best imaging window" that minimizes moon interference.
 *
 * Unlike the legacy `getOptimalMoonWindow`, this function:
 * - uses astronomical dusk/dawn for the dark window,
 * - enforces a minimum target altitude,
 * - accounts for the Moon being above/below the horizon,
 * - scales the minimum acceptable Moon distance by Moon illumination.
 */
export function getOptimalMoonWindowForObserver(
  raDeg: number,
  decDeg: number,
  latitude: number,
  longitude: number,
  date: Date,
  options: OptimalMoonWindowOptions = {}
): OptimalMoonWindowResult {
  if (
    !Number.isFinite(raDeg) ||
    !Number.isFinite(decDeg) ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    !(date instanceof Date) ||
    Number.isNaN(date.getTime())
  ) {
    return {
      hasWindow: false,
      moonRise: null,
      moonSet: null,
      bestWindow: null,
      diagnostics: {
        illuminationPercent: 0,
        minMoonDistanceDeg: 0,
        darkStart: null,
        darkEnd: null,
        reasonIfNone: 'invalid_input',
      },
    };
  }

  const minAltitudeDeg = options.minAltitudeDeg ?? 30;
  const baseMinMoonDistanceDeg = options.baseMinMoonDistanceDeg ?? 30;
  const minWindowMinutes = options.minWindowMinutes ?? 30;
  const sampleMinutes = options.sampleMinutes ?? 10;
  const refineToSeconds = options.refineToSeconds ?? 60;

  if (sampleMinutes <= 0 || refineToSeconds <= 0 || minWindowMinutes <= 0 || baseMinMoonDistanceDeg <= 0) {
    return {
      hasWindow: false,
      moonRise: null,
      moonSet: null,
      bestWindow: null,
      diagnostics: {
        illuminationPercent: 0,
        minMoonDistanceDeg: 0,
        darkStart: null,
        darkEnd: null,
        reasonIfNone: 'invalid_input',
      },
    };
  }

  const twilight = calculateTwilightTimes(latitude, longitude, date);
  const darkStart = twilight.astronomicalDusk;
  const darkEnd = twilight.astronomicalDawn;

  if (!darkStart || !darkEnd || darkEnd.getTime() <= darkStart.getTime()) {
    return {
      hasWindow: false,
      moonRise: null,
      moonSet: null,
      bestWindow: null,
      diagnostics: {
        illuminationPercent: 0,
        minMoonDistanceDeg: baseMinMoonDistanceDeg,
        darkStart,
        darkEnd,
        reasonIfNone: 'no_darkness',
      },
    };
  }

  const observer = new Observer(latitude, longitude, 0);
  const midnight = new Date(date);
  midnight.setHours(0, 0, 0, 0);
  const moonRise = toDateOrNull(SearchRiseSet(Body.Moon, observer, +1, midnight, 3));
  const moonSet = toDateOrNull(SearchRiseSet(Body.Moon, observer, -1, midnight, 3));

  const darkMid = new Date(Math.floor((darkStart.getTime() + darkEnd.getTime()) / 2));
  const illuminationPercent = Illumination(Body.Moon, darkMid).phase_fraction * 100;
  const minMoonDistanceDeg = baseMinMoonDistanceDeg * (1 + illuminationPercent / 200);

  // Convert target EQJ (J2000) -> EQD (of-date) once for the night.
  const vEqj = VectorFromSphere(new Spherical(clampDec(decDeg), normalizeDegrees(raDeg), 1), darkMid);
  const rotation = Rotation_EQJ_EQD(darkMid);
  const vEqd = RotateVector(rotation, vEqj);
  const targetEqd = EquatorFromVector(vEqd);
  const targetRaDeg = normalizeDegrees(targetEqd.ra * 15);
  const targetDecDeg = clampDec(targetEqd.dec);

  const latRad = deg2rad(latitude);
  const targetDecRad = deg2rad(targetDecDeg);

  const isImagingOk = (at: Date): boolean => {
    const lst = getLSTForDate(longitude, at);
    const haRad = deg2rad(lst - targetRaDeg);
    const sinAlt =
      Math.sin(targetDecRad) * Math.sin(latRad) + Math.cos(targetDecRad) * Math.cos(latRad) * Math.cos(haRad);
    const targetAlt = rad2deg(Math.asin(Math.max(-1, Math.min(1, sinAlt))));
    if (targetAlt < minAltitudeDeg) return false;

    const moonEq = Equator(Body.Moon, at, observer, true, true);
    const moonHor = Horizon(at, observer, moonEq.ra, moonEq.dec);
    const moonAlt = moonHor.altitude;

    if (moonAlt <= 0) return true;

    const moonRaDeg = normalizeDegrees(moonEq.ra * 15);
    const moonDecDeg = clampDec(moonEq.dec);
    const moonDistance = angularSeparation(targetRaDeg, targetDecDeg, moonRaDeg, moonDecDeg);
    return moonDistance >= minMoonDistanceDeg;
  };

  const sampleStepMs = Math.round(sampleMinutes * 60000);
  const refineMs = Math.round(refineToSeconds * 1000);

  const samples: Array<{ t: Date; ok: boolean; targetAltOk: boolean }> = [];
  let anyTargetAboveMin = false;

  for (let t = darkStart.getTime(); t <= darkEnd.getTime(); t += sampleStepMs) {
    const at = new Date(t);

    // Check target altitude only (to choose better diagnostics if no window exists).
    const lst = getLSTForDate(longitude, at);
    const haRad = deg2rad(lst - targetRaDeg);
    const sinAlt =
      Math.sin(targetDecRad) * Math.sin(latRad) + Math.cos(targetDecRad) * Math.cos(latRad) * Math.cos(haRad);
    const targetAlt = rad2deg(Math.asin(Math.max(-1, Math.min(1, sinAlt))));
    const targetAltOk = targetAlt >= minAltitudeDeg;
    if (targetAltOk) anyTargetAboveMin = true;

    let ok = false;
    if (targetAltOk) {
      ok = isImagingOk(at);
    }

    samples.push({ t: at, ok, targetAltOk });
  }

  // Ensure the end of the window is sampled.
  if (samples.length === 0 || samples[samples.length - 1].t.getTime() !== darkEnd.getTime()) {
    const at = new Date(darkEnd);
    const ok = isImagingOk(at);

    const lst = getLSTForDate(longitude, at);
    const haRad = deg2rad(lst - targetRaDeg);
    const sinAlt =
      Math.sin(targetDecRad) * Math.sin(latRad) + Math.cos(targetDecRad) * Math.cos(latRad) * Math.cos(haRad);
    const targetAlt = rad2deg(Math.asin(Math.max(-1, Math.min(1, sinAlt))));
    const targetAltOk = targetAlt >= minAltitudeDeg;
    if (targetAltOk) anyTargetAboveMin = true;

    samples.push({ t: at, ok: targetAltOk ? ok : false, targetAltOk });
  }

  let bestStartIndex = -1;
  let bestEndIndex = -1;
  let currentStartIndex = -1;

  for (let i = 0; i < samples.length; i++) {
    const { ok } = samples[i];
    if (ok) {
      if (currentStartIndex === -1) currentStartIndex = i;
    } else if (currentStartIndex !== -1) {
      const runStart = currentStartIndex;
      const runEnd = i - 1;
      const runLength = samples[runEnd].t.getTime() - samples[runStart].t.getTime();
      const bestLength =
        bestStartIndex === -1 ? -1 : samples[bestEndIndex].t.getTime() - samples[bestStartIndex].t.getTime();
      if (runLength > bestLength) {
        bestStartIndex = runStart;
        bestEndIndex = runEnd;
      }
      currentStartIndex = -1;
    }
  }

  if (currentStartIndex !== -1) {
    const runStart = currentStartIndex;
    const runEnd = samples.length - 1;
    const runLength = samples[runEnd].t.getTime() - samples[runStart].t.getTime();
    const bestLength =
      bestStartIndex === -1 ? -1 : samples[bestEndIndex].t.getTime() - samples[bestStartIndex].t.getTime();
    if (runLength > bestLength) {
      bestStartIndex = runStart;
      bestEndIndex = runEnd;
    }
  }

  if (bestStartIndex === -1 || bestEndIndex === -1) {
    return {
      hasWindow: false,
      moonRise,
      moonSet,
      bestWindow: null,
      diagnostics: {
        illuminationPercent,
        minMoonDistanceDeg,
        darkStart,
        darkEnd,
        reasonIfNone: anyTargetAboveMin ? 'moon_always_bad' : 'target_never_above_min_alt',
      },
    };
  }

  const coarseStart = samples[bestStartIndex].t;
  const coarseEnd = samples[bestEndIndex].t;

  let refinedStart = coarseStart;
  let refinedEnd = coarseEnd;

  // Refine start between previous sample (likely false) and first true sample.
  if (bestStartIndex > 0) {
    refinedStart = binaryRefineBoundary(isImagingOk, samples[bestStartIndex - 1].t, coarseStart, refineMs, 'firstTrue');
  } else {
    refinedStart = darkStart;
  }

  // Refine end between last true and next sample (likely false), or the darkEnd boundary.
  if (bestEndIndex < samples.length - 1) {
    refinedEnd = binaryRefineBoundary(isImagingOk, coarseEnd, samples[bestEndIndex + 1].t, refineMs, 'lastTrue');
  } else {
    refinedEnd = darkEnd;
  }

  const durationMinutes = (refinedEnd.getTime() - refinedStart.getTime()) / 60000;
  if (durationMinutes < minWindowMinutes) {
    return {
      hasWindow: false,
      moonRise,
      moonSet,
      bestWindow: null,
      diagnostics: {
        illuminationPercent,
        minMoonDistanceDeg,
        darkStart,
        darkEnd,
        reasonIfNone: anyTargetAboveMin ? 'moon_always_bad' : 'target_never_above_min_alt',
      },
    };
  }

  return {
    hasWindow: true,
    moonRise,
    moonSet,
    bestWindow: {
      start: refinedStart,
      end: refinedEnd,
    },
    diagnostics: {
      illuminationPercent,
      minMoonDistanceDeg,
      darkStart,
      darkEnd,
    },
  };
}

/**
 * Find optimal imaging window considering moon
 * Returns the best time window when moon interference is minimal
 * @param ra - Target RA in degrees
 * @param dec - Target Dec in degrees
 * @param date - Date/time for a coarse moon-distance check
 * @param minAltitude - Legacy parameter (not used in this simplified heuristic)
 *
 * @remarks
 * Legacy helper: does NOT account for observer location, moonrise/moonset, twilight, or true
 * target altitude constraints. Prefer `getOptimalMoonWindowForObserver` for planning/scheduling.
 */
export function getOptimalMoonWindow(
  ra: number,
  dec: number,
  date: Date,
  minAltitude = 30
): {
  hasWindow: boolean;
  moonRise?: Date;
  moonSet?: Date;
  bestWindow?: { start: Date; end: Date };
} {
  // Legacy: keep signature stable, but use the provided date for the moon position.
  void minAltitude;

  const jd = dateToJulianDate(date);
  const moonPos = getMoonPosition(jd);
  const distance = angularSeparation(ra, dec, moonPos.ra, moonPos.dec);
  
  return {
    hasWindow: distance > 45,
    // Full implementation would include actual times
  };
}
