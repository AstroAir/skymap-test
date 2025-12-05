/**
 * @jest-environment node
 */
import {
  raDecToAltAz,
  raDecToAltAzAtTime,
  altAzToRaDec,
  getHourAngle,
  getHourAngleAtTime,
} from '../transforms';

// Mock the sidereal time functions to have deterministic tests
jest.mock('../../time/sidereal', () => ({
  getLST: jest.fn().mockReturnValue(90), // Mock LST at 90 degrees (6h)
}));

describe('Coordinate Transforms', () => {
  // Test location: Beijing (39.9°N, 116.4°E)
  const latitude = 39.9;
  const longitude = 116.4;

  // ============================================================================
  // raDecToAltAz
  // ============================================================================
  describe('raDecToAltAz', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('calculates altitude and azimuth', () => {
      const result = raDecToAltAz(90, 45, latitude, longitude);
      
      expect(result).toHaveProperty('altitude');
      expect(result).toHaveProperty('azimuth');
      expect(typeof result.altitude).toBe('number');
      expect(typeof result.azimuth).toBe('number');
    });

    it('altitude is between -90 and 90', () => {
      const result = raDecToAltAz(180, 45, latitude, longitude);
      expect(result.altitude).toBeGreaterThanOrEqual(-90);
      expect(result.altitude).toBeLessThanOrEqual(90);
    });

    it('azimuth is between 0 and 360', () => {
      const result = raDecToAltAz(180, 45, latitude, longitude);
      expect(result.azimuth).toBeGreaterThanOrEqual(0);
      expect(result.azimuth).toBeLessThanOrEqual(360);
    });

    it('pole star at high northern latitude has high altitude', () => {
      // Polaris: RA ~37.95°, Dec ~89.26°
      // At northern latitudes, should be near observer's latitude
      const result = raDecToAltAz(37.95, 89.26, latitude, longitude);
      expect(result.altitude).toBeGreaterThan(30);
    });

    it('southern object from northern hemisphere has lower altitude', () => {
      // Southern Cross center: Dec ~ -60°
      const result = raDecToAltAz(180, -60, latitude, longitude);
      expect(result.altitude).toBeLessThan(0); // Should be below horizon
    });

    it('object on meridian has max altitude', () => {
      // Object at RA = LST (90°) should be at transit
      const result = raDecToAltAz(90, 45, latitude, longitude);
      // Max altitude = 90 - |lat - dec| = 90 - |39.9 - 45| = 84.9
      expect(result.altitude).toBeCloseTo(84.9, 0);
    });

    it('handles equator correctly', () => {
      const result = raDecToAltAz(90, 0, 0, longitude);
      expect(result.altitude).toBeCloseTo(90, 0); // Should be overhead at equator at transit
    });
  });

  // ============================================================================
  // raDecToAltAzAtTime
  // ============================================================================
  describe('raDecToAltAzAtTime', () => {
    it('calculates altitude at specific time', () => {
      const date = new Date('2024-06-21T12:00:00Z');
      const result = raDecToAltAzAtTime(180, 45, latitude, longitude, date);
      
      expect(result).toHaveProperty('altitude');
      expect(result).toHaveProperty('azimuth');
    });

    it('returns valid altitude range', () => {
      const date = new Date('2024-06-21T00:00:00Z');
      const result = raDecToAltAzAtTime(180, 45, latitude, longitude, date);
      
      expect(result.altitude).toBeGreaterThanOrEqual(-90);
      expect(result.altitude).toBeLessThanOrEqual(90);
    });

    it('returns valid azimuth range', () => {
      const date = new Date('2024-06-21T06:00:00Z');
      const result = raDecToAltAzAtTime(180, 45, latitude, longitude, date);
      
      expect(result.azimuth).toBeGreaterThanOrEqual(0);
      expect(result.azimuth).toBeLessThan(360);
    });

    it('different times give different results', () => {
      const date1 = new Date('2024-06-21T00:00:00Z');
      const date2 = new Date('2024-06-21T12:00:00Z');
      
      const result1 = raDecToAltAzAtTime(180, 45, latitude, longitude, date1);
      const result2 = raDecToAltAzAtTime(180, 45, latitude, longitude, date2);
      
      expect(result1.altitude).not.toEqual(result2.altitude);
    });
  });

  // ============================================================================
  // altAzToRaDec
  // ============================================================================
  describe('altAzToRaDec', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('converts altitude/azimuth to RA/Dec', () => {
      const result = altAzToRaDec(45, 180, latitude, longitude);
      
      expect(result).toHaveProperty('ra');
      expect(result).toHaveProperty('dec');
    });

    it('RA is between 0 and 360', () => {
      const result = altAzToRaDec(45, 180, latitude, longitude);
      expect(result.ra).toBeGreaterThanOrEqual(0);
      expect(result.ra).toBeLessThan(360);
    });

    it('Dec is between -90 and 90', () => {
      const result = altAzToRaDec(45, 180, latitude, longitude);
      expect(result.dec).toBeGreaterThanOrEqual(-90);
      expect(result.dec).toBeLessThanOrEqual(90);
    });

    it('zenith points to declination equal to latitude', () => {
      // Looking straight up (altitude 90) should point to dec = latitude
      const result = altAzToRaDec(90, 0, latitude, longitude);
      expect(result.dec).toBeCloseTo(latitude, 1);
    });

    it('south direction at equator gives negative declination', () => {
      const result = altAzToRaDec(45, 180, 0, longitude);
      expect(result.dec).toBeLessThan(0);
    });

    it('north direction at equator gives positive declination', () => {
      const result = altAzToRaDec(45, 0, 0, longitude);
      expect(result.dec).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // getHourAngle
  // ============================================================================
  describe('getHourAngle', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('calculates hour angle', () => {
      const result = getHourAngle(180, longitude);
      expect(typeof result).toBe('number');
    });

    it('hour angle is between -180 and 180', () => {
      const result = getHourAngle(45, longitude);
      expect(result).toBeGreaterThanOrEqual(-180);
      expect(result).toBeLessThanOrEqual(180);
    });

    it('object at LST has hour angle 0', () => {
      // LST is mocked to 90 degrees
      const result = getHourAngle(90, longitude);
      expect(result).toBeCloseTo(0, 5);
    });

    it('object 90 degrees east of LST has negative hour angle', () => {
      // RA = LST + 90 = 180
      const result = getHourAngle(180, longitude);
      expect(result).toBeLessThan(0);
    });

    it('object 90 degrees west of LST has positive hour angle', () => {
      // RA = LST - 90 = 0
      const result = getHourAngle(0, longitude);
      expect(result).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // getHourAngleAtTime
  // ============================================================================
  describe('getHourAngleAtTime', () => {
    it('calculates hour angle at specific time', () => {
      const date = new Date('2024-06-21T12:00:00Z');
      const result = getHourAngleAtTime(180, longitude, date);
      expect(typeof result).toBe('number');
    });

    it('hour angle is within valid range', () => {
      const date = new Date('2024-06-21T00:00:00Z');
      const result = getHourAngleAtTime(180, longitude, date);
      expect(result).toBeGreaterThanOrEqual(-180);
      expect(result).toBeLessThanOrEqual(180);
    });

    it('hour angle changes with time', () => {
      const date1 = new Date('2024-06-21T00:00:00Z');
      const date2 = new Date('2024-06-21T06:00:00Z');
      
      const result1 = getHourAngleAtTime(180, longitude, date1);
      const result2 = getHourAngleAtTime(180, longitude, date2);
      
      expect(result1).not.toEqual(result2);
    });

    it('hour angle increases by ~90° in 6 hours', () => {
      const date1 = new Date('2024-06-21T00:00:00Z');
      const date2 = new Date('2024-06-21T06:00:00Z');
      
      const result1 = getHourAngleAtTime(180, longitude, date1);
      const result2 = getHourAngleAtTime(180, longitude, date2);
      
      // 6 hours ≈ 90 degrees of rotation (accounting for sidereal rate)
      const diff = Math.abs(result2 - result1);
      expect(diff).toBeGreaterThan(80);
      expect(diff).toBeLessThan(100);
    });
  });

  // ============================================================================
  // Round-trip conversion tests
  // ============================================================================
  describe('Round-trip conversions', () => {
    it('raDecToAltAz and altAzToRaDec are inverses', () => {
      const originalRa = 120;
      const originalDec = 30;
      
      const altAz = raDecToAltAz(originalRa, originalDec, latitude, longitude);
      const recovered = altAzToRaDec(altAz.altitude, altAz.azimuth, latitude, longitude);
      
      expect(recovered.ra).toBeCloseTo(originalRa, 1);
      expect(recovered.dec).toBeCloseTo(originalDec, 1);
    });

    it('round-trip works for various coordinates', () => {
      const testCases = [
        { ra: 0, dec: 45 },
        { ra: 180, dec: -30 },
        { ra: 270, dec: 0 },
        { ra: 90, dec: 60 },
      ];

      for (const { ra, dec } of testCases) {
        const altAz = raDecToAltAz(ra, dec, latitude, longitude);
        const recovered = altAzToRaDec(altAz.altitude, altAz.azimuth, latitude, longitude);
        
        // Allow some tolerance due to floating point
        expect(recovered.ra).toBeCloseTo(ra, 0);
        expect(recovered.dec).toBeCloseTo(dec, 0);
      }
    });
  });
});
