/**
 * Sun position calculations
 */

import { deg2rad, rad2deg } from '../coordinates/conversions';
import { getJulianDate } from '../time/julian';

// ============================================================================
// Sun Position
// ============================================================================

/**
 * Calculate sun position (RA/Dec in degrees)
 * @param jd - Julian Date (optional, defaults to now)
 * @returns Sun position in equatorial coordinates
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
 * Calculate sun altitude for an observer
 * @param latitude - Observer latitude in degrees
 * @param longitude - Observer longitude in degrees
 * @param date - Date for calculation
 * @returns Sun altitude in degrees
 */
export function getSunAltitude(
  latitude: number, 
  longitude: number, 
  date: Date = new Date()
): number {
  const jd = date.getTime() / 86400000 + 2440587.5;
  const sunPos = getSunPosition(jd);
  
  // Calculate hour angle
  const S = jd - 2451545.0;
  const T = S / 36525.0;
  const GST = 280.46061837 + 360.98564736629 * S + T ** 2 * (0.000387933 - T / 38710000);
  const LST = ((GST + longitude) % 360 + 360) % 360;
  const HA = deg2rad(LST - sunPos.ra);
  
  const latRad = deg2rad(latitude);
  const decRad = deg2rad(sunPos.dec);
  
  const sinAlt = Math.sin(decRad) * Math.sin(latRad) +
                 Math.cos(decRad) * Math.cos(latRad) * Math.cos(HA);
  
  return rad2deg(Math.asin(sinAlt));
}

/**
 * Get sun's declination for a given day of year
 * Simplified calculation for quick estimates
 * @param dayOfYear - Day of year (1-365)
 * @returns Declination in degrees
 */
export function getSunDeclination(dayOfYear: number): number {
  return -23.45 * Math.cos(2 * Math.PI * (dayOfYear + 10) / 365);
}

/**
 * Get equation of time in minutes
 * @param jd - Julian Date
 * @returns Equation of time in minutes
 */
export function getEquationOfTime(jd?: number): number {
  const JD = jd ?? getJulianDate();
  const D = JD - 2451545.0;
  const g = deg2rad(357.529 + 0.98560028 * D);
  const q = 280.459 + 0.98564736 * D;
  const L = deg2rad(q + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g));
  const e = deg2rad(23.439 - 0.00000036 * D);
  
  let RA = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L));
  if (RA < 0) RA += 2 * Math.PI;
  
  const EoT = (q / 15 - rad2deg(RA) / 15) * 60;
  
  // Normalize to -20 to +20 minutes
  let result = EoT % 1440;
  if (result > 20) result -= 1440 / 60;
  if (result < -20) result += 1440 / 60;
  
  return result;
}
