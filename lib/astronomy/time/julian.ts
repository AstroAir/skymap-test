/**
 * Julian Date calculations
 */

// ============================================================================
// Julian Date Conversions
// ============================================================================

/**
 * Calculate Julian Date for current time
 */
export function getJulianDate(): number {
  return dateToJulianDate(new Date());
}

/**
 * Calculate Julian Date from a Date object
 * @param date - JavaScript Date object
 * @returns Julian Date
 */
export function dateToJulianDate(date: Date): number {
  let year = date.getUTCFullYear();
  let month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const hour = date.getUTCHours();
  const minute = date.getUTCMinutes();
  const second = date.getUTCSeconds() + date.getUTCMilliseconds() / 1000;

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
 * @param jd - Julian Date
 * @returns JavaScript Date object
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

// ============================================================================
// Modified Julian Date
// ============================================================================

/**
 * Convert UTC Date to Modified Julian Date
 * @param utcDate - JavaScript Date object
 * @returns Modified Julian Date
 */
export function utcToMJD(utcDate: Date): number {
  return utcDate.getTime() / 86400000 + 40587;
}

/**
 * Convert Modified Julian Date to UTC Date
 * @param mjd - Modified Julian Date
 * @returns JavaScript Date object
 */
export function mjdToUTC(mjd: number): Date {
  return new Date((mjd - 40587) * 86400000);
}

// ============================================================================
// Time Utilities
// ============================================================================

/**
 * Get Julian centuries since J2000.0
 * @param jd - Julian Date (optional, defaults to now)
 * @returns Julian centuries
 */
export function getJulianCenturies(jd?: number): number {
  const JD = jd ?? getJulianDate();
  return (JD - 2451545.0) / 36525;
}

/**
 * Get days since J2000.0
 * @param jd - Julian Date (optional, defaults to now)
 * @returns Days since J2000.0
 */
export function getDaysSinceJ2000(jd?: number): number {
  const JD = jd ?? getJulianDate();
  return JD - 2451545.0;
}

/**
 * Get day of year
 * @param date - JavaScript Date object
 * @returns Day of year (1-366)
 */
export function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
