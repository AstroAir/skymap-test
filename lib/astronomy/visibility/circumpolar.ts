/**
 * Circumpolar and visibility checks
 */

// ============================================================================
// Circumpolar Checks
// ============================================================================

/**
 * Check if object is circumpolar (never sets)
 * @param dec - Declination in degrees
 * @param latitude - Observer latitude in degrees
 * @returns True if object is circumpolar
 */
export function isCircumpolar(dec: number, latitude: number): boolean {
  return Math.abs(dec) > (90 - Math.abs(latitude));
}

/**
 * Check if object never rises at given latitude
 * @param dec - Declination in degrees
 * @param latitude - Observer latitude in degrees
 * @returns True if object never rises
 */
export function neverRises(dec: number, latitude: number): boolean {
  if (latitude >= 0) {
    // Northern hemisphere
    return dec < -(90 - latitude);
  } else {
    // Southern hemisphere
    return dec > (90 + latitude);
  }
}

/**
 * Check if object is always above a given altitude
 * @param dec - Declination in degrees
 * @param latitude - Observer latitude in degrees
 * @param minAltitude - Minimum altitude in degrees
 * @returns True if object is always above minAltitude
 */
export function isAlwaysAbove(
  dec: number, 
  latitude: number, 
  minAltitude: number
): boolean {
  // Minimum altitude occurs when object is at lower culmination
  const minAlt = -90 + Math.abs(latitude + dec);
  return minAlt >= minAltitude;
}

/**
 * Check if object ever reaches a given altitude
 * @param dec - Declination in degrees
 * @param latitude - Observer latitude in degrees
 * @param targetAltitude - Target altitude in degrees
 * @returns True if object can reach the target altitude
 */
export function canReachAltitude(
  dec: number, 
  latitude: number, 
  targetAltitude: number
): boolean {
  // Maximum altitude occurs at transit
  const maxAlt = 90 - Math.abs(latitude - dec);
  return maxAlt >= targetAltitude;
}

// ============================================================================
// Visibility Checks
// ============================================================================

/**
 * Check if object is visible from a location
 * @param dec - Declination in degrees
 * @param latitude - Observer latitude in degrees
 * @returns True if object can ever be seen
 */
export function isVisible(dec: number, latitude: number): boolean {
  return !neverRises(dec, latitude);
}

/**
 * Get visibility classification for an object
 * @param dec - Declination in degrees
 * @param latitude - Observer latitude in degrees
 * @returns Classification: 'circumpolar' | 'visible' | 'never_rises'
 */
export function getVisibilityClass(
  dec: number, 
  latitude: number
): 'circumpolar' | 'visible' | 'never_rises' {
  if (isCircumpolar(dec, latitude)) return 'circumpolar';
  if (neverRises(dec, latitude)) return 'never_rises';
  return 'visible';
}

/**
 * Get duration above horizon in hours
 * @param dec - Declination in degrees
 * @param latitude - Observer latitude in degrees
 * @returns Hours above horizon per day (0-24)
 */
export function getHoursAboveHorizon(dec: number, latitude: number): number {
  if (neverRises(dec, latitude)) return 0;
  if (isCircumpolar(dec, latitude)) return 24;
  
  const latRad = (latitude * Math.PI) / 180;
  const decRad = (dec * Math.PI) / 180;
  
  const cosH = -Math.tan(latRad) * Math.tan(decRad);
  
  if (cosH >= 1) return 0;
  if (cosH <= -1) return 24;
  
  const H = Math.acos(cosH);
  return (H / Math.PI) * 24;
}

/**
 * Get duration above a minimum altitude in hours
 * @param dec - Declination in degrees
 * @param latitude - Observer latitude in degrees
 * @param minAltitude - Minimum altitude in degrees
 * @returns Hours above minimum altitude per day
 */
export function getHoursAboveAltitude(
  dec: number, 
  latitude: number, 
  minAltitude: number
): number {
  if (!canReachAltitude(dec, latitude, minAltitude)) return 0;
  if (isAlwaysAbove(dec, latitude, minAltitude)) return 24;
  
  const latRad = (latitude * Math.PI) / 180;
  const decRad = (dec * Math.PI) / 180;
  const altRad = (minAltitude * Math.PI) / 180;
  
  const cosH = (Math.sin(altRad) - Math.sin(latRad) * Math.sin(decRad)) /
               (Math.cos(latRad) * Math.cos(decRad));
  
  if (cosH >= 1) return 0;
  if (cosH <= -1) return 24;
  
  const H = Math.acos(cosH);
  return (H / Math.PI) * 24;
}
