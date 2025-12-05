/**
 * Angular separation calculations
 */

import { deg2rad, rad2deg } from '../coordinates/conversions';
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

/**
 * Find optimal imaging window considering moon
 * Returns the best time window when moon interference is minimal
 * @param ra - Target RA in degrees
 * @param dec - Target Dec in degrees
 * @param date - Date for calculation (reserved for future use)
 * @param minAltitude - Minimum altitude threshold (reserved for future use)
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
  // This is a simplified version - full implementation would calculate
  // actual moon rise/set times and find the optimal window
  // Use parameters to avoid lint warnings (will be used in full implementation)
  void date;
  void minAltitude;
  
  const moonPos = getMoonPosition();
  const distance = angularSeparation(ra, dec, moonPos.ra, moonPos.dec);
  
  return {
    hasWindow: distance > 45,
    // Full implementation would include actual times
  };
}
