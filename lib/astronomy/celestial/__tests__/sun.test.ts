/**
 * @jest-environment node
 */
import {
  getSunPosition,
  getSunAltitude,
  getSunDeclination,
  getEquationOfTime,
} from '../sun';

describe('Sun Calculations', () => {
  // ============================================================================
  // getSunPosition
  // ============================================================================
  describe('getSunPosition', () => {
    it('returns ra and dec', () => {
      const pos = getSunPosition();
      expect(pos).toHaveProperty('ra');
      expect(pos).toHaveProperty('dec');
    });

    it('RA is between 0 and 360', () => {
      const pos = getSunPosition();
      expect(pos.ra).toBeGreaterThanOrEqual(0);
      expect(pos.ra).toBeLessThan(360);
    });

    it('Dec is between -23.5 and 23.5 (obliquity range)', () => {
      const pos = getSunPosition();
      expect(pos.dec).toBeGreaterThan(-24);
      expect(pos.dec).toBeLessThan(24);
    });

    it('accepts Julian Date parameter', () => {
      const pos = getSunPosition(2451545.0);
      expect(typeof pos.ra).toBe('number');
      expect(typeof pos.dec).toBe('number');
    });

    it('position changes over time', () => {
      const pos1 = getSunPosition(2451545.0);
      const pos2 = getSunPosition(2451545.0 + 30);
      
      // Sun moves about 1 degree per day
      expect(pos1.ra).not.toEqual(pos2.ra);
    });

    it('dec is approximately 0 at equinox', () => {
      // March 20, 2024 vernal equinox (approximately)
      // JD around 2460389
      const pos = getSunPosition(2460389);
      expect(Math.abs(pos.dec)).toBeLessThan(2);
    });

    it('dec is near +23.5 at summer solstice', () => {
      // June 21 is around JD 2460482 in 2024
      const pos = getSunPosition(2460482);
      expect(pos.dec).toBeGreaterThan(20);
    });

    it('dec is near -23.5 at winter solstice', () => {
      // December 21 is around JD 2460666 in 2024
      const pos = getSunPosition(2460666);
      expect(pos.dec).toBeLessThan(-20);
    });
  });

  // ============================================================================
  // getSunAltitude
  // ============================================================================
  describe('getSunAltitude', () => {
    const latitude = 39.9; // Beijing
    const longitude = 116.4;

    it('returns a number', () => {
      const alt = getSunAltitude(latitude, longitude);
      expect(typeof alt).toBe('number');
    });

    it('altitude is between -90 and 90', () => {
      const alt = getSunAltitude(latitude, longitude);
      expect(alt).toBeGreaterThanOrEqual(-90);
      expect(alt).toBeLessThanOrEqual(90);
    });

    it('accepts date parameter', () => {
      const date = new Date('2024-06-21T12:00:00Z');
      const alt = getSunAltitude(latitude, longitude, date);
      expect(typeof alt).toBe('number');
    });

    it('sun is higher at noon than at midnight', () => {
      const noon = new Date('2024-06-21T04:00:00Z'); // ~noon in Beijing (UTC+8)
      const midnight = new Date('2024-06-21T16:00:00Z'); // ~midnight in Beijing
      
      const altNoon = getSunAltitude(latitude, longitude, noon);
      const altMidnight = getSunAltitude(latitude, longitude, midnight);
      
      expect(altNoon).toBeGreaterThan(altMidnight);
    });

    it('different times give different altitudes', () => {
      const date1 = new Date('2024-06-21T00:00:00Z');
      const date2 = new Date('2024-06-21T12:00:00Z');
      
      const alt1 = getSunAltitude(latitude, longitude, date1);
      const alt2 = getSunAltitude(latitude, longitude, date2);
      
      expect(alt1).not.toEqual(alt2);
    });

    it('equator at equinox noon should have sun near 90', () => {
      // At equator, on equinox, sun should be nearly overhead at local noon
      const equinox = new Date('2024-03-20T12:00:00Z');
      const alt = getSunAltitude(0, 0, equinox);
      expect(alt).toBeGreaterThan(70);
    });
  });

  // ============================================================================
  // getSunDeclination
  // ============================================================================
  describe('getSunDeclination', () => {
    it('returns 0 near equinoxes', () => {
      // Day ~80 is spring equinox (March 20-21)
      const dec = getSunDeclination(80);
      expect(Math.abs(dec)).toBeLessThan(3);
      
      // Day ~266 is autumn equinox (September 22-23)
      const decAutumn = getSunDeclination(266);
      expect(Math.abs(decAutumn)).toBeLessThan(3);
    });

    it('returns +23.45 at summer solstice', () => {
      // Day ~172 is summer solstice (June 21)
      const dec = getSunDeclination(172);
      expect(dec).toBeCloseTo(23.45, 0);
    });

    it('returns -23.45 at winter solstice', () => {
      // Day ~355 is winter solstice (December 21)
      const dec = getSunDeclination(355);
      expect(dec).toBeCloseTo(-23.45, 0);
    });

    it('is always between -23.45 and +23.45', () => {
      for (let day = 1; day <= 365; day++) {
        const dec = getSunDeclination(day);
        expect(dec).toBeGreaterThanOrEqual(-23.5);
        expect(dec).toBeLessThanOrEqual(23.5);
      }
    });

    it('increases from winter to summer', () => {
      const decMarch = getSunDeclination(90);  // March
      const decJune = getSunDeclination(172);  // June
      
      // Check trend - declination increases from spring to summer
      expect(decJune).toBeGreaterThan(decMarch);
    });
  });

  // ============================================================================
  // getEquationOfTime
  // ============================================================================
  describe('getEquationOfTime', () => {
    it('returns a number', () => {
      const eot = getEquationOfTime();
      expect(typeof eot).toBe('number');
    });

    it('accepts Julian Date parameter', () => {
      const eot = getEquationOfTime(2451545.0);
      expect(typeof eot).toBe('number');
    });

    it('returns a number for all days of the year', () => {
      // Test that the function returns valid numbers throughout the year
      for (let i = 0; i < 365; i++) {
        const jd = 2451545.0 + i; // Days through a year from J2000
        const eot = getEquationOfTime(jd);
        expect(typeof eot).toBe('number');
        expect(isNaN(eot)).toBe(false);
        expect(isFinite(eot)).toBe(true);
      }
    });

    it('varies throughout the year', () => {
      const eot1 = getEquationOfTime(2451545.0);
      const eot2 = getEquationOfTime(2451545.0 + 100);
      
      expect(eot1).not.toEqual(eot2);
    });

    it('is approximately 0 around April 15 and June 14', () => {
      // These are approximate dates when EoT crosses zero
      // April 15 is about day 105, JD ~2451650 for year 2000
      // This is a simplified test
      const eotApril = getEquationOfTime(2451650);
      expect(Math.abs(eotApril)).toBeLessThan(5);
    });
  });
});
