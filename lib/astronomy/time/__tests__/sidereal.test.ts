/**
 * @jest-environment node
 */
import {
  getGST,
  getGSTForDate,
  getLST,
  getLSTForDate,
  lstToHours,
  lstToDegrees,
  SIDEREAL_DAY_SECONDS,
  SIDEREAL_RATIO,
  solarToSidereal,
  siderealToSolar,
} from '../sidereal';

describe('Sidereal Time Calculations', () => {
  // ============================================================================
  // Constants
  // ============================================================================
  describe('Constants', () => {
    it('SIDEREAL_DAY_SECONDS is approximately 86164', () => {
      expect(SIDEREAL_DAY_SECONDS).toBeCloseTo(86164.0905, 2);
    });

    it('SIDEREAL_RATIO is approximately 1.0027', () => {
      expect(SIDEREAL_RATIO).toBeCloseTo(1.00273790935, 8);
    });
  });

  // ============================================================================
  // getGST
  // ============================================================================
  describe('getGST', () => {
    it('returns a number', () => {
      expect(typeof getGST()).toBe('number');
    });

    it('returns value between 0 and 360', () => {
      const gst = getGST();
      expect(gst).toBeGreaterThanOrEqual(0);
      expect(gst).toBeLessThan(360);
    });

    it('accepts Julian Date parameter', () => {
      const gst = getGST(2451545.0);
      expect(typeof gst).toBe('number');
      expect(gst).toBeGreaterThanOrEqual(0);
      expect(gst).toBeLessThan(360);
    });

    it('increases with time', () => {
      const gst1 = getGST(2451545.0);
      const gst2 = getGST(2451545.5);
      // 0.5 days = about 180 degrees of rotation
      const diff = (gst2 - gst1 + 360) % 360;
      expect(diff).toBeGreaterThan(170);
      expect(diff).toBeLessThan(190);
    });

    it('returns known value at J2000.0', () => {
      // At J2000.0 (Jan 1, 2000, 12:00 TT), GST should be ~280.46°
      const gst = getGST(2451545.0);
      expect(gst).toBeCloseTo(280.46, 0);
    });
  });

  // ============================================================================
  // getGSTForDate
  // ============================================================================
  describe('getGSTForDate', () => {
    it('returns a number', () => {
      const date = new Date('2024-06-21T00:00:00Z');
      expect(typeof getGSTForDate(date)).toBe('number');
    });

    it('returns value between 0 and 360', () => {
      const date = new Date('2024-06-21T12:00:00Z');
      const gst = getGSTForDate(date);
      expect(gst).toBeGreaterThanOrEqual(0);
      expect(gst).toBeLessThan(360);
    });

    it('different times give different results', () => {
      const date1 = new Date('2024-06-21T00:00:00Z');
      const date2 = new Date('2024-06-21T06:00:00Z');
      
      const gst1 = getGSTForDate(date1);
      const gst2 = getGSTForDate(date2);
      
      expect(gst1).not.toEqual(gst2);
    });
  });

  // ============================================================================
  // getLST
  // ============================================================================
  describe('getLST', () => {
    it('returns a number', () => {
      expect(typeof getLST(0)).toBe('number');
    });

    it('returns value between 0 and 360', () => {
      const lst = getLST(116.4);
      expect(lst).toBeGreaterThanOrEqual(0);
      expect(lst).toBeLessThan(360);
    });

    it('differs from GST by longitude', () => {
      const longitude = 90;
      const gst = getGST();
      const lst = getLST(longitude);
      
      const expectedLST = (gst + longitude) % 360;
      expect(lst).toBeCloseTo(expectedLST, 5);
    });

    it('handles negative longitude (west)', () => {
      const lst = getLST(-90);
      expect(lst).toBeGreaterThanOrEqual(0);
      expect(lst).toBeLessThan(360);
    });

    it('accepts Julian Date parameter', () => {
      const lst = getLST(116.4, 2451545.0);
      expect(typeof lst).toBe('number');
    });

    it('prime meridian LST equals GST', () => {
      const jd = 2451545.0;
      const gst = getGST(jd);
      const lst = getLST(0, jd);
      expect(lst).toBeCloseTo(gst, 5);
    });
  });

  // ============================================================================
  // getLSTForDate
  // ============================================================================
  describe('getLSTForDate', () => {
    it('returns a number', () => {
      const date = new Date('2024-06-21T00:00:00Z');
      expect(typeof getLSTForDate(116.4, date)).toBe('number');
    });

    it('returns value between 0 and 360', () => {
      const date = new Date('2024-06-21T12:00:00Z');
      const lst = getLSTForDate(116.4, date);
      expect(lst).toBeGreaterThanOrEqual(0);
      expect(lst).toBeLessThan(360);
    });

    it('different longitudes give different LST', () => {
      const date = new Date('2024-06-21T12:00:00Z');
      const lst1 = getLSTForDate(0, date);
      const lst2 = getLSTForDate(90, date);
      
      const diff = (lst2 - lst1 + 360) % 360;
      expect(diff).toBeCloseTo(90, 1);
    });
  });

  // ============================================================================
  // lstToHours / lstToDegrees
  // ============================================================================
  describe('lstToHours', () => {
    it('converts 0 degrees to 0 hours', () => {
      expect(lstToHours(0)).toBe(0);
    });

    it('converts 15 degrees to 1 hour', () => {
      expect(lstToHours(15)).toBe(1);
    });

    it('converts 180 degrees to 12 hours', () => {
      expect(lstToHours(180)).toBe(12);
    });

    it('converts 360 degrees to 24 hours', () => {
      expect(lstToHours(360)).toBe(24);
    });
  });

  describe('lstToDegrees', () => {
    it('converts 0 hours to 0 degrees', () => {
      expect(lstToDegrees(0)).toBe(0);
    });

    it('converts 1 hour to 15 degrees', () => {
      expect(lstToDegrees(1)).toBe(15);
    });

    it('converts 12 hours to 180 degrees', () => {
      expect(lstToDegrees(12)).toBe(180);
    });

    it('converts 24 hours to 360 degrees', () => {
      expect(lstToDegrees(24)).toBe(360);
    });

    it('is inverse of lstToHours', () => {
      const original = 150;
      expect(lstToDegrees(lstToHours(original))).toBe(original);
    });
  });

  // ============================================================================
  // solarToSidereal / siderealToSolar
  // ============================================================================
  describe('solarToSidereal', () => {
    it('returns larger value than input', () => {
      const solar = 3600; // 1 hour in seconds
      const sidereal = solarToSidereal(solar);
      expect(sidereal).toBeGreaterThan(solar);
    });

    it('multiplies by SIDEREAL_RATIO', () => {
      const solar = 1000;
      expect(solarToSidereal(solar)).toBeCloseTo(solar * SIDEREAL_RATIO, 5);
    });

    it('handles 0', () => {
      expect(solarToSidereal(0)).toBe(0);
    });

    it('handles 24 hours correctly', () => {
      const solarDay = 86400;
      const siderealDay = solarToSidereal(solarDay);
      // A solar day is about 86400 / 86164 = 1.00274 sidereal days
      expect(siderealDay).toBeCloseTo(86636.6, 0);
    });
  });

  describe('siderealToSolar', () => {
    it('returns smaller value than input', () => {
      const sidereal = 3600; // 1 hour in seconds
      const solar = siderealToSolar(sidereal);
      expect(solar).toBeLessThan(sidereal);
    });

    it('divides by SIDEREAL_RATIO', () => {
      const sidereal = 1000;
      expect(siderealToSolar(sidereal)).toBeCloseTo(sidereal / SIDEREAL_RATIO, 5);
    });

    it('handles 0', () => {
      expect(siderealToSolar(0)).toBe(0);
    });

    it('is inverse of solarToSidereal', () => {
      const original = 3600;
      expect(siderealToSolar(solarToSidereal(original))).toBeCloseTo(original, 5);
    });

    it('handles sidereal day correctly', () => {
      const siderealDay = SIDEREAL_DAY_SECONDS;
      const solarEquivalent = siderealToSolar(siderealDay);
      // Should be approximately 1 sidereal day in solar seconds
      expect(solarEquivalent).toBeCloseTo(86164.0905 / SIDEREAL_RATIO, 0);
    });
  });
});
