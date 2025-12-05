/**
 * Coordinate system transforms
 * Conversions between different celestial coordinate systems
 */

import { deg2rad, rad2deg } from './conversions';
import { getLST } from '../time/sidereal';

// ============================================================================
// Equatorial to Horizontal Transform
// ============================================================================

/**
 * Convert RA/Dec to Alt/Az
 * @param ra - Right Ascension in degrees
 * @param dec - Declination in degrees
 * @param latitude - Observer latitude in degrees
 * @param longitude - Observer longitude in degrees
 * @returns Altitude and Azimuth in degrees
 */
export function raDecToAltAz(
  ra: number,
  dec: number,
  latitude: number,
  longitude: number
): { altitude: number; azimuth: number } {
  const LST = getLST(longitude);
  const delta = deg2rad(dec);
  const phi = deg2rad(latitude);
  const HA = deg2rad(LST - ra);

  const sinAlt = Math.sin(delta) * Math.sin(phi) + 
                 Math.cos(delta) * Math.cos(phi) * Math.cos(HA);
  const altitude = rad2deg(Math.asin(sinAlt));

  const y = -Math.cos(delta) * Math.sin(HA);
  const x = Math.sin(delta) * Math.cos(phi) - 
            Math.cos(delta) * Math.sin(phi) * Math.cos(HA);
  let azimuth = rad2deg(Math.atan2(y, x));
  if (azimuth < 0) azimuth += 360;

  return { altitude, azimuth };
}

/**
 * Convert RA/Dec to Alt/Az at a specific time
 */
export function raDecToAltAzAtTime(
  ra: number,
  dec: number,
  latitude: number,
  longitude: number,
  date: Date
): { altitude: number; azimuth: number } {
  const LST = getLSTForDate(date, longitude);
  const delta = deg2rad(dec);
  const phi = deg2rad(latitude);
  const HA = deg2rad(LST - ra);

  const sinAlt = Math.sin(delta) * Math.sin(phi) + 
                 Math.cos(delta) * Math.cos(phi) * Math.cos(HA);
  const altitude = rad2deg(Math.asin(sinAlt));

  const y = -Math.cos(delta) * Math.sin(HA);
  const x = Math.sin(delta) * Math.cos(phi) - 
            Math.cos(delta) * Math.sin(phi) * Math.cos(HA);
  let azimuth = rad2deg(Math.atan2(y, x));
  if (azimuth < 0) azimuth += 360;

  return { altitude, azimuth };
}

// ============================================================================
// Horizontal to Equatorial Transform
// ============================================================================

/**
 * Convert Alt/Az to RA/Dec
 * @param altitude - Altitude in degrees
 * @param azimuth - Azimuth in degrees
 * @param latitude - Observer latitude in degrees
 * @param longitude - Observer longitude in degrees
 * @returns RA and Dec in degrees
 */
export function altAzToRaDec(
  altitude: number,
  azimuth: number,
  latitude: number,
  longitude: number
): { ra: number; dec: number } {
  const LST = getLST(longitude);
  const h = deg2rad(altitude);
  const A = deg2rad(azimuth);
  const phi = deg2rad(latitude);

  const sinDec = Math.sin(h) * Math.sin(phi) + 
                 Math.cos(h) * Math.cos(phi) * Math.cos(A);
  const dec = rad2deg(Math.asin(sinDec));

  const y = -Math.sin(A) * Math.cos(h);
  const x = Math.cos(phi) * Math.sin(h) - 
            Math.sin(phi) * Math.cos(h) * Math.cos(A);
  const HA = rad2deg(Math.atan2(y, x));

  let ra = (LST - HA) % 360;
  if (ra < 0) ra += 360;

  return { ra, dec };
}

// ============================================================================
// Hour Angle
// ============================================================================

/**
 * Calculate hour angle for an object
 * @param ra - Right Ascension in degrees
 * @param longitude - Observer longitude in degrees
 * @returns Hour angle in degrees
 */
export function getHourAngle(ra: number, longitude: number): number {
  const LST = getLST(longitude);
  let HA = LST - ra;
  if (HA < -180) HA += 360;
  if (HA > 180) HA -= 360;
  return HA;
}

/**
 * Calculate hour angle at a specific time
 */
export function getHourAngleAtTime(
  ra: number, 
  longitude: number, 
  date: Date
): number {
  const LST = getLSTForDate(date, longitude);
  let HA = LST - ra;
  if (HA < -180) HA += 360;
  if (HA > 180) HA -= 360;
  return HA;
}

// ============================================================================
// Helper: LST for specific date
// ============================================================================

/**
 * Get Local Sidereal Time for a specific date
 * @param date - Date object
 * @param longitude - Observer longitude in degrees
 * @returns LST in degrees
 */
function getLSTForDate(date: Date, longitude: number): number {
  const jd = date.getTime() / 86400000 + 2440587.5;
  const S = jd - 2451545.0;
  const T = S / 36525.0;
  const GST = 280.46061837 + 360.98564736629 * S + T ** 2 * (0.000387933 - T / 38710000);
  return ((GST + longitude) % 360 + 360) % 360;
}
