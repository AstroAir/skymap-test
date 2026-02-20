/**
 * Sidereal Time calculations
 * Aligned with standard UT1-driven Earth rotation conventions.
 */

import { getJulianDate } from './julian';
import { buildTimeScaleContext } from '../time-scales';

const DJ00 = 2451545.0;
const DAYS_PER_CENTURY = 36525;

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
  const context = buildTimeScaleContext(date);
  return getGMST06(context.jdUt1, context.jdTt);
}

/**
 * Greenwich Mean Sidereal Time (explicit naming for UT1-driven workflows)
 */
export function getGMST(jdUt1?: number): number {
  if (jdUt1 === undefined) return getGST();
  return getGST(jdUt1);
}

export function getGMSTForDate(date: Date): number {
  const context = buildTimeScaleContext(date);
  return getGMST06(context.jdUt1, context.jdTt);
}

function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360;
}

function earthRotationAngle(jdUt1: number): number {
  const t = jdUt1 - DJ00;
  const f = ((jdUt1 % 1) + 1) % 1;
  return normalizeDegrees((f + 0.7790572732640 + 0.00273781191135448 * t) * 360);
}

function getGMST06(jdUt1: number, jdTt: number): number {
  const centuries = (jdTt - DJ00) / DAYS_PER_CENTURY;
  const era = earthRotationAngle(jdUt1);
  const precessionArcsec =
    0.014506
    + (4612.156534
    + (1.3915817
    + (-0.00000044
    + (-0.000029956
    + (-0.0000000368) * centuries) * centuries) * centuries) * centuries) * centuries;
  return normalizeDegrees(era + precessionArcsec / 3600);
}

/**
 * Approximate equation of the equinoxes in degrees.
 * Uses a compact nutation model suitable for UI-level high-frequency updates.
 */
export function getEquationOfEquinoxes(jdTt: number): number {
  const T = (jdTt - 2451545.0) / 36525.0;
  const omega = normalizeDegrees(125.04452 - 1934.136261 * T);
  const meanLongitudeSun = normalizeDegrees(280.4665 + 36000.7698 * T);
  const meanLongitudeMoon = normalizeDegrees(218.3165 + 481267.8813 * T);
  const epsilon = 23.439291 - 0.0130042 * T;

  const toRad = Math.PI / 180;
  const deltaPsiArcsec =
    -17.20 * Math.sin(omega * toRad)
    - 1.32 * Math.sin(2 * meanLongitudeSun * toRad)
    - 0.23 * Math.sin(2 * meanLongitudeMoon * toRad)
    + 0.21 * Math.sin(2 * omega * toRad);

  return (deltaPsiArcsec * Math.cos(epsilon * toRad)) / 3600;
}

/**
 * Greenwich Apparent Sidereal Time (GAST), degrees.
 */
export function getGAST(jdUt1: number, jdTt: number): number {
  const gmst = getGMST06(jdUt1, jdTt);
  const equation = getEquationOfEquinoxes(jdTt);
  return normalizeDegrees(gmst + equation);
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
  const context = buildTimeScaleContext(date);
  return getLST(longitude, context.jdUt1);
}

export function getApparentLSTForDate(longitude: number, date: Date): number {
  const context = buildTimeScaleContext(date);
  const gast = getGAST(context.jdUt1, context.jdTt);
  return normalizeDegrees(gast + longitude);
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
