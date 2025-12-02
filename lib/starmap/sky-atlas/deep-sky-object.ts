/**
 * Deep Sky Object calculations - Ported from N.I.N.A.
 * Handles DSO altitude, transit, and visibility calculations
 */

import type { DeepSkyObject, AltitudePoint, ObjectAltitudeData } from './types';
import {
  dateToJulianDate,
  getLocalSiderealTime,
  getReferenceDate,
  calculateAltitude,
  calculateAzimuth,
  getMoonPosition,
  calculateAngularSeparation,
} from './nighttime-calculator';

// ============================================================================
// Constants
// ============================================================================

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
const ALTITUDE_SAMPLE_INTERVAL_HOURS = 0.1; // 6 minutes
const ALTITUDE_SAMPLE_COUNT = 240; // 24 hours

// ============================================================================
// Altitude Calculation
// ============================================================================

/**
 * Calculate altitude points for an object over 24 hours
 * Ported from NINA DeepSkyObject.UpdateHorizonAndTransit
 */
export function calculateAltitudeData(
  ra: number,
  dec: number,
  latitude: number,
  longitude: number,
  referenceDate: Date = new Date()
): ObjectAltitudeData {
  const refDate = getReferenceDate(referenceDate);
  const points: AltitudePoint[] = [];
  
  let maxAltitude = -90;
  let maxAltitudeTime = refDate;
  let riseTime: Date | null = null;
  let setTime: Date | null = null;
  let lastAltitude = -999;
  let currentDate = new Date(refDate);
  
  // Calculate altitude at each time point
  for (let i = 0; i < ALTITUDE_SAMPLE_COUNT; i++) {
    const altitude = calculateAltitude(ra, dec, latitude, longitude, currentDate);
    const azimuth = calculateAzimuth(ra, dec, latitude, longitude, currentDate);
    
    points.push({
      time: new Date(currentDate),
      altitude,
      azimuth,
      isAboveHorizon: altitude > 0,
    });
    
    // Track max altitude
    if (altitude > maxAltitude) {
      maxAltitude = altitude;
      maxAltitudeTime = new Date(currentDate);
    }
    
    // Track rise time (crossing horizon upward)
    if (lastAltitude !== -999 && lastAltitude <= 0 && altitude > 0) {
      riseTime = new Date(currentDate);
    }
    
    // Track set time (crossing horizon downward)
    if (lastAltitude !== -999 && lastAltitude > 0 && altitude <= 0) {
      setTime = new Date(currentDate);
    }
    
    lastAltitude = altitude;
    currentDate = new Date(currentDate.getTime() + ALTITUDE_SAMPLE_INTERVAL_HOURS * 3600000);
  }
  
  // Calculate transit time (when object is highest)
  // Transit occurs when LST = RA
  const transitTime = calculateTransitTime(ra, longitude, refDate);
  
  return {
    objectId: '',
    points,
    maxAltitude,
    maxAltitudeTime,
    transitTime,
    riseTime,
    setTime,
  };
}

/**
 * Calculate transit time for an object
 */
export function calculateTransitTime(
  ra: number,
  longitude: number,
  referenceDate: Date
): Date {
  const refDate = getReferenceDate(referenceDate);
  const lstAtRef = getLocalSiderealTime(refDate, longitude);
  
  // Time until transit in sidereal hours
  let hoursToTransit = (ra - lstAtRef) / 15;
  
  // Normalize to 0-24 range
  while (hoursToTransit < 0) hoursToTransit += 24;
  while (hoursToTransit > 24) hoursToTransit -= 24;
  
  // Convert sidereal time to solar time (sidereal day is ~23.9344 hours)
  const solarHours = hoursToTransit * (23.9344696 / 24);
  
  return new Date(refDate.getTime() + solarHours * 3600000);
}

/**
 * Check if object transits south (below zenith for northern hemisphere)
 */
export function doesTransitSouth(dec: number, latitude: number): boolean {
  const alt0 = getAltitudeAtHourAngle(0, latitude, dec);
  const alt180 = getAltitudeAtHourAngle(180, latitude, dec);
  
  if (alt0 > alt180) {
    const azimuth = getAzimuthAtHourAngle(0, alt0, latitude, dec);
    return Math.round(azimuth) === 180;
  } else {
    const azimuth = getAzimuthAtHourAngle(180, alt180, latitude, dec);
    return Math.round(azimuth) === 180;
  }
}

/**
 * Calculate altitude at a specific hour angle
 */
function getAltitudeAtHourAngle(hourAngle: number, latitude: number, dec: number): number {
  const haRad = hourAngle * DEG_TO_RAD;
  const latRad = latitude * DEG_TO_RAD;
  const decRad = dec * DEG_TO_RAD;
  
  const sinAlt = Math.sin(decRad) * Math.sin(latRad) +
                 Math.cos(decRad) * Math.cos(latRad) * Math.cos(haRad);
  
  return Math.asin(Math.max(-1, Math.min(1, sinAlt))) * RAD_TO_DEG;
}

/**
 * Calculate azimuth at a specific hour angle
 */
function getAzimuthAtHourAngle(hourAngle: number, altitude: number, latitude: number, dec: number): number {
  const haRad = hourAngle * DEG_TO_RAD;
  const latRad = latitude * DEG_TO_RAD;
  const decRad = dec * DEG_TO_RAD;
  const altRad = altitude * DEG_TO_RAD;
  
  const cosAz = (Math.sin(decRad) - Math.sin(altRad) * Math.sin(latRad)) /
                (Math.cos(altRad) * Math.cos(latRad));
  
  // Fix precision issues
  const clampedCosAz = Math.max(-1, Math.min(1, cosAz));
  
  if (Math.sin(haRad) < 0) {
    return Math.acos(clampedCosAz) * RAD_TO_DEG;
  } else {
    return 360 - Math.acos(clampedCosAz) * RAD_TO_DEG;
  }
}

// ============================================================================
// Moon Distance Calculation
// ============================================================================

/**
 * Calculate distance from object to moon
 */
export function calculateMoonDistance(
  ra: number,
  dec: number,
  date: Date = new Date()
): number {
  const jd = dateToJulianDate(date);
  const moonPos = getMoonPosition(jd);
  return calculateAngularSeparation(ra, dec, moonPos.ra, moonPos.dec);
}

// ============================================================================
// Visibility Filters
// ============================================================================

/**
 * Check if object is above minimum altitude for a given duration
 * Ported from NINA SkyAtlasVM filter logic
 */
export function isAboveAltitudeForDuration(
  altitudeData: ObjectAltitudeData,
  minimumAltitude: number,
  minimumDurationHours: number,
  startTime: Date,
  endTime: Date
): boolean {
  const startMs = startTime.getTime();
  const endMs = endTime.getTime();
  
  // Filter points within the time window
  const relevantPoints = altitudeData.points.filter(
    p => p.time.getTime() >= startMs && p.time.getTime() <= endMs
  );
  
  if (relevantPoints.length < 2) return false;
  
  // Check for contiguous duration above altitude
  let durationMs = 0;
  let aboveStart: Date | null = null;
  
  for (const point of relevantPoints) {
    if (point.altitude >= minimumAltitude) {
      if (aboveStart === null) {
        aboveStart = point.time;
      }
      durationMs = point.time.getTime() - aboveStart.getTime();
      
      if (durationMs >= minimumDurationHours * 3600000) {
        return true;
      }
    } else {
      aboveStart = null;
      durationMs = 0;
    }
  }
  
  return false;
}

/**
 * Calculate imaging score for an object
 * Higher scores indicate better imaging conditions
 */
export function calculateImagingScore(
  dso: DeepSkyObject,
  latitude: number,
  longitude: number,
  date: Date = new Date()
): number {
  let score = 0;
  
  // Get altitude data
  const altitudeData = calculateAltitudeData(dso.ra, dso.dec, latitude, longitude, date);
  
  // Max altitude contribution (0-30 points)
  if (altitudeData.maxAltitude >= 60) {
    score += 30;
  } else if (altitudeData.maxAltitude >= 45) {
    score += 25;
  } else if (altitudeData.maxAltitude >= 30) {
    score += 20;
  } else if (altitudeData.maxAltitude >= 15) {
    score += 10;
  }
  
  // Moon distance contribution (0-25 points)
  const moonDistance = calculateMoonDistance(dso.ra, dso.dec, date);
  if (moonDistance >= 90) {
    score += 25;
  } else if (moonDistance >= 60) {
    score += 20;
  } else if (moonDistance >= 30) {
    score += 15;
  } else if (moonDistance >= 15) {
    score += 5;
  }
  
  // Size contribution (0-15 points) - larger objects are easier to image
  if (dso.sizeMax) {
    const sizeArcmin = dso.sizeMax;
    if (sizeArcmin >= 30) {
      score += 15;
    } else if (sizeArcmin >= 10) {
      score += 12;
    } else if (sizeArcmin >= 5) {
      score += 8;
    } else if (sizeArcmin >= 2) {
      score += 4;
    }
  }
  
  // Magnitude contribution (0-15 points) - brighter is better
  if (dso.magnitude !== undefined) {
    if (dso.magnitude <= 6) {
      score += 15;
    } else if (dso.magnitude <= 8) {
      score += 12;
    } else if (dso.magnitude <= 10) {
      score += 8;
    } else if (dso.magnitude <= 12) {
      score += 4;
    }
  }
  
  // Surface brightness contribution (0-15 points)
  if (dso.surfaceBrightness !== undefined) {
    if (dso.surfaceBrightness <= 12) {
      score += 15;
    } else if (dso.surfaceBrightness <= 14) {
      score += 10;
    } else if (dso.surfaceBrightness <= 16) {
      score += 5;
    }
  }
  
  return Math.min(100, score);
}

// ============================================================================
// Object Enrichment
// ============================================================================

/**
 * Enrich a DSO with calculated runtime data
 */
export function enrichDeepSkyObject(
  dso: DeepSkyObject,
  latitude: number,
  longitude: number,
  date: Date = new Date()
): DeepSkyObject {
  const altitudeData = calculateAltitudeData(dso.ra, dso.dec, latitude, longitude, date);
  const currentAltitude = calculateAltitude(dso.ra, dso.dec, latitude, longitude, date);
  const currentAzimuth = calculateAzimuth(dso.ra, dso.dec, latitude, longitude, date);
  const moonDistance = calculateMoonDistance(dso.ra, dso.dec, date);
  const imagingScore = calculateImagingScore(dso, latitude, longitude, date);
  
  return {
    ...dso,
    altitude: currentAltitude,
    azimuth: currentAzimuth,
    transitTime: altitudeData.transitTime ?? undefined,
    riseTime: altitudeData.riseTime ?? undefined,
    setTime: altitudeData.setTime ?? undefined,
    moonDistance,
    imagingScore,
  };
}

/**
 * Batch enrich multiple DSOs
 */
export function enrichDeepSkyObjects(
  objects: DeepSkyObject[],
  latitude: number,
  longitude: number,
  date: Date = new Date()
): DeepSkyObject[] {
  return objects.map(dso => enrichDeepSkyObject(dso, latitude, longitude, date));
}
