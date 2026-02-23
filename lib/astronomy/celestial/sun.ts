/**
 * Sun position calculations
 */

import {
  Body,
  Equator,
  EquatorFromVector,
  GeoVector,
  Horizon,
  Observer,
  RotateVector,
  Rotation_EQJ_EQD,
} from 'astronomy-engine';
import { deg2rad, rad2deg } from '../coordinates/conversions';
import { getJulianDate, julianDateToDate } from '../time/julian';

// ============================================================================
// Sun Position
// ============================================================================

/**
 * Calculate sun position (RA/Dec in degrees)
 * @param jd - Julian Date (optional, defaults to now)
 * @returns Sun position in equatorial coordinates
 */
export function getSunPosition(jd?: number): { ra: number; dec: number } {
  const date = jd === undefined ? new Date() : julianDateToDate(jd);
  const eqj = GeoVector(Body.Sun, date, true);
  const rotation = Rotation_EQJ_EQD(date);
  const eqd = RotateVector(rotation, eqj);
  const equator = EquatorFromVector(eqd);

  const raDeg = ((equator.ra * 15) % 360 + 360) % 360;
  return { ra: raDeg, dec: equator.dec };
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
  const observer = new Observer(latitude, longitude, 0);
  const eq = Equator(Body.Sun, date, observer, true, true);
  const hor = Horizon(date, observer, eq.ra, eq.dec);
  return hor.altitude;
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
