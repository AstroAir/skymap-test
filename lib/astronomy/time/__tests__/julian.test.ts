/**
 * @jest-environment node
 */
import {
  getJulianDate,
  dateToJulianDate,
  julianDateToDate,
  utcToMJD,
  mjdToUTC,
  getJulianCenturies,
  getDaysSinceJ2000,
  getDayOfYear,
} from '../julian';

describe('Julian Date Calculations', () => {
  // ============================================================================
  // dateToJulianDate
  // ============================================================================
  describe('dateToJulianDate', () => {
    it('converts J2000.0 epoch correctly', () => {
      // J2000.0 = January 1, 2000, 12:00 TT ≈ 2451545.0
      const j2000 = new Date(Date.UTC(2000, 0, 1, 12, 0, 0));
      expect(dateToJulianDate(j2000)).toBeCloseTo(2451545.0, 1);
    });

    it('converts known date correctly', () => {
      // January 1, 2024, 00:00 UTC
      const date = new Date(Date.UTC(2024, 0, 1, 0, 0, 0));
      // JD should be approximately 2460310.5
      expect(dateToJulianDate(date)).toBeCloseTo(2460310.5, 1);
    });

    it('handles dates before March correctly', () => {
      // February 29, 2024 (leap year)
      const date = new Date(Date.UTC(2024, 1, 29, 0, 0, 0));
      expect(dateToJulianDate(date)).toBeGreaterThan(2460310);
    });

    it('handles time of day', () => {
      const midnight = new Date(Date.UTC(2024, 0, 1, 0, 0, 0));
      const noon = new Date(Date.UTC(2024, 0, 1, 12, 0, 0));
      
      const jdMidnight = dateToJulianDate(midnight);
      const jdNoon = dateToJulianDate(noon);
      
      expect(jdNoon - jdMidnight).toBeCloseTo(0.5, 5);
    });

    it('handles seconds correctly', () => {
      const date1 = new Date(Date.UTC(2024, 0, 1, 0, 0, 0));
      const date2 = new Date(Date.UTC(2024, 0, 1, 0, 0, 30));
      
      const diff = dateToJulianDate(date2) - dateToJulianDate(date1);
      // 30 seconds = 30/86400 days
      expect(diff).toBeCloseTo(30 / 86400, 6);
    });

    it('consecutive days differ by 1', () => {
      const day1 = new Date(Date.UTC(2024, 5, 15, 12, 0, 0));
      const day2 = new Date(Date.UTC(2024, 5, 16, 12, 0, 0));
      
      expect(dateToJulianDate(day2) - dateToJulianDate(day1)).toBeCloseTo(1, 5);
    });
  });

  // ============================================================================
  // getJulianDate
  // ============================================================================
  describe('getJulianDate', () => {
    it('returns a number', () => {
      expect(typeof getJulianDate()).toBe('number');
    });

    it('returns value greater than J2000', () => {
      expect(getJulianDate()).toBeGreaterThan(2451545);
    });

    it('increases over time', () => {
      const jd1 = getJulianDate();
      // Wait a tiny bit (this is more of a sanity check)
      const jd2 = getJulianDate();
      expect(jd2).toBeGreaterThanOrEqual(jd1);
    });
  });

  // ============================================================================
  // julianDateToDate
  // ============================================================================
  describe('julianDateToDate', () => {
    it('converts J2000.0 correctly', () => {
      const date = julianDateToDate(2451545.0);
      expect(date.getUTCFullYear()).toBe(2000);
      expect(date.getUTCMonth()).toBe(0); // January
      expect(date.getUTCDate()).toBe(1);
      expect(date.getUTCHours()).toBe(12);
    });

    it('is inverse of dateToJulianDate', () => {
      const original = new Date(Date.UTC(2024, 5, 15, 10, 30, 0));
      const jd = dateToJulianDate(original);
      const recovered = julianDateToDate(jd);
      
      expect(recovered.getUTCFullYear()).toBe(original.getUTCFullYear());
      expect(recovered.getUTCMonth()).toBe(original.getUTCMonth());
      expect(recovered.getUTCDate()).toBe(original.getUTCDate());
      expect(recovered.getUTCHours()).toBe(original.getUTCHours());
      expect(recovered.getUTCMinutes()).toBe(original.getUTCMinutes());
    });

    it('handles pre-Gregorian dates', () => {
      // October 15, 1582 - start of Gregorian calendar
      // JD 2299161 is October 15, 1582
      const date = julianDateToDate(2299161);
      expect(date).toBeInstanceOf(Date);
      expect(date.getUTCFullYear()).toBe(1582);
    });

    it('handles fractional days', () => {
      const jdNoon = 2460310.0; // Noon
      const jdMidnight = 2460310.5; // Midnight
      
      const dateNoon = julianDateToDate(jdNoon);
      const dateMidnight = julianDateToDate(jdMidnight);
      
      expect(dateNoon.getUTCHours()).toBe(12);
      expect(dateMidnight.getUTCHours()).toBe(0);
    });
  });

  // ============================================================================
  // utcToMJD / mjdToUTC
  // ============================================================================
  describe('utcToMJD', () => {
    it('converts to Modified Julian Date', () => {
      const date = new Date(Date.UTC(2000, 0, 1, 0, 0, 0));
      const mjd = utcToMJD(date);
      // MJD = JD - 2400000.5
      // J2000 noon = 2451545.0, so J2000 midnight = 2451544.5
      // MJD = 2451544.5 - 2400000.5 = 51044
      expect(mjd).toBeCloseTo(51544, 0);
    });

    it('handles milliseconds', () => {
      const date = new Date(Date.UTC(2024, 0, 1, 0, 0, 0));
      expect(utcToMJD(date)).toBeGreaterThan(50000);
    });
  });

  describe('mjdToUTC', () => {
    it('converts from Modified Julian Date', () => {
      const mjd = 51544; // Approximately J2000 midnight
      const date = mjdToUTC(mjd);
      expect(date.getUTCFullYear()).toBe(2000);
    });

    it('is inverse of utcToMJD', () => {
      const original = new Date(Date.UTC(2024, 5, 15, 10, 30, 0));
      const mjd = utcToMJD(original);
      const recovered = mjdToUTC(mjd);
      
      expect(recovered.getTime()).toBeCloseTo(original.getTime(), -3);
    });
  });

  // ============================================================================
  // getJulianCenturies
  // ============================================================================
  describe('getJulianCenturies', () => {
    it('returns 0 at J2000.0', () => {
      const jd2000 = 2451545.0;
      expect(getJulianCenturies(jd2000)).toBeCloseTo(0, 10);
    });

    it('returns positive value after J2000', () => {
      const jd = 2451545.0 + 36525; // One century after J2000
      expect(getJulianCenturies(jd)).toBeCloseTo(1, 5);
    });

    it('returns negative value before J2000', () => {
      const jd = 2451545.0 - 36525; // One century before J2000
      expect(getJulianCenturies(jd)).toBeCloseTo(-1, 5);
    });

    it('uses current time when no argument provided', () => {
      const result = getJulianCenturies();
      // Should be positive (we're after J2000)
      expect(result).toBeGreaterThan(0);
      // And reasonable (less than 1 century since J2000)
      expect(result).toBeLessThan(1);
    });
  });

  // ============================================================================
  // getDaysSinceJ2000
  // ============================================================================
  describe('getDaysSinceJ2000', () => {
    it('returns 0 at J2000.0', () => {
      expect(getDaysSinceJ2000(2451545.0)).toBeCloseTo(0, 10);
    });

    it('returns positive value after J2000', () => {
      expect(getDaysSinceJ2000(2451546.0)).toBeCloseTo(1, 10);
    });

    it('returns negative value before J2000', () => {
      expect(getDaysSinceJ2000(2451544.0)).toBeCloseTo(-1, 10);
    });

    it('uses current time when no argument provided', () => {
      const result = getDaysSinceJ2000();
      // We're more than 20 years after J2000
      expect(result).toBeGreaterThan(7000); // 20+ years in days
    });
  });

  // ============================================================================
  // getDayOfYear
  // ============================================================================
  describe('getDayOfYear', () => {
    it('returns 1 for January 1', () => {
      const date = new Date(2024, 0, 1);
      expect(getDayOfYear(date)).toBe(1);
    });

    it('returns 32 for February 1', () => {
      const date = new Date(2024, 1, 1);
      expect(getDayOfYear(date)).toBe(32);
    });

    it('returns 366 for December 31 in leap year', () => {
      const date = new Date(2024, 11, 31); // 2024 is a leap year
      expect(getDayOfYear(date)).toBe(366);
    });

    it('returns 365 for December 31 in non-leap year', () => {
      const date = new Date(2023, 11, 31);
      expect(getDayOfYear(date)).toBe(365);
    });

    it('handles March 1 correctly in leap year', () => {
      // In 2024 (leap year), March 1 is day 61
      const date = new Date(2024, 2, 1);
      expect(getDayOfYear(date)).toBe(61);
    });

    it('handles March 1 correctly in non-leap year', () => {
      // In 2023 (non-leap year), March 1 is day 60
      const date = new Date(2023, 2, 1);
      expect(getDayOfYear(date)).toBe(60);
    });
  });
});
