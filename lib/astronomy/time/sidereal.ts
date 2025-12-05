/**
 * Sidereal Time calculations
 */

import { getJulianDate, dateToJulianDate } from './julian';

// ============================================================================
// Greenwich Sidereal Time
// ============================================================================

/**
 * Calculate Greenwich Sidereal Time (GST) in degrees
 * @param jd - Julian Date (optional, defaults to now)
 * @returns GST in degrees (0-360)
 */
export function getGST(jd?: number): number {
  const JD = jd ?? getJulianDate();
  const S = JD - 2451545.0;
  const T = S / 36525.0;
  const GST = 280.46061837 + 360.98564736629 * S + T ** 2 * (0.000387933 - T / 38710000);
  return ((GST % 360) + 360) % 360;
}

/**
 * Calculate Greenwich Sidereal Time for a specific date
 * @param date - JavaScript Date object
 * @returns GST in degrees
 */
export function getGSTForDate(date: Date): number {
  return getGST(dateToJulianDate(date));
}

// ============================================================================
// Local Sidereal Time
// ============================================================================

/**
 * Calculate Local Sidereal Time (LST) in degrees
 * @param longitude - Observer longitude in degrees (East positive)
 * @param jd - Julian Date (optional, defaults to now)
 * @returns LST in degrees (0-360)
 */
export function getLST(longitude: number, jd?: number): number {
  const GST = getGST(jd);
  return ((GST + longitude) % 360 + 360) % 360;
}

/**
 * Calculate Local Sidereal Time for a specific date
 * @param longitude - Observer longitude in degrees
 * @param date - JavaScript Date object
 * @returns LST in degrees
 */
export function getLSTForDate(longitude: number, date: Date): number {
  return getLST(longitude, dateToJulianDate(date));
}

// ============================================================================
// Hour Conversions
// ============================================================================

/**
 * Convert LST from degrees to hours
 * @param lstDeg - LST in degrees
 * @returns LST in hours (0-24)
 */
export function lstToHours(lstDeg: number): number {
  return lstDeg / 15;
}

/**
 * Convert LST from hours to degrees
 * @param lstHours - LST in hours
 * @returns LST in degrees
 */
export function lstToDegrees(lstHours: number): number {
  return lstHours * 15;
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Get the sidereal day length in solar seconds
 */
export const SIDEREAL_DAY_SECONDS = 86164.0905;

/**
 * Get the ratio of sidereal to solar day
 */
export const SIDEREAL_RATIO = 1.00273790935;

/**
 * Convert solar time to sidereal time
 * @param solarSeconds - Time in solar seconds
 * @returns Time in sidereal seconds
 */
export function solarToSidereal(solarSeconds: number): number {
  return solarSeconds * SIDEREAL_RATIO;
}

/**
 * Convert sidereal time to solar time
 * @param siderealSeconds - Time in sidereal seconds
 * @returns Time in solar seconds
 */
export function siderealToSolar(siderealSeconds: number): number {
  return siderealSeconds / SIDEREAL_RATIO;
}
