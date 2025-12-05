/**
 * @jest-environment node
 */
import {
  rad2deg,
  deg2rad,
  hoursToDegrees,
  degreesToHours,
  degreesToHMS,
  hmsToDegrees,
  degreesToDMS,
  dmsToDegrees,
  parseCoordinateString,
} from '../conversions';

describe('Coordinate Conversions', () => {
  // ============================================================================
  // rad2deg / deg2rad
  // ============================================================================
  describe('rad2deg', () => {
    it('converts 0 radians to 0 degrees', () => {
      expect(rad2deg(0)).toBe(0);
    });

    it('converts PI radians to 180 degrees', () => {
      expect(rad2deg(Math.PI)).toBeCloseTo(180, 10);
    });

    it('converts PI/2 radians to 90 degrees', () => {
      expect(rad2deg(Math.PI / 2)).toBeCloseTo(90, 10);
    });

    it('converts 2*PI radians to 360 degrees', () => {
      expect(rad2deg(2 * Math.PI)).toBeCloseTo(360, 10);
    });

    it('handles negative values', () => {
      expect(rad2deg(-Math.PI)).toBeCloseTo(-180, 10);
    });

    it('converts small angles correctly', () => {
      expect(rad2deg(0.01)).toBeCloseTo(0.5729577951308232, 10);
    });
  });

  describe('deg2rad', () => {
    it('converts 0 degrees to 0 radians', () => {
      expect(deg2rad(0)).toBe(0);
    });

    it('converts 180 degrees to PI radians', () => {
      expect(deg2rad(180)).toBeCloseTo(Math.PI, 10);
    });

    it('converts 90 degrees to PI/2 radians', () => {
      expect(deg2rad(90)).toBeCloseTo(Math.PI / 2, 10);
    });

    it('converts 360 degrees to 2*PI radians', () => {
      expect(deg2rad(360)).toBeCloseTo(2 * Math.PI, 10);
    });

    it('handles negative values', () => {
      expect(deg2rad(-180)).toBeCloseTo(-Math.PI, 10);
    });

    it('is inverse of rad2deg', () => {
      const original = 123.456;
      expect(rad2deg(deg2rad(original))).toBeCloseTo(original, 10);
    });
  });

  // ============================================================================
  // hoursToDegrees / degreesToHours
  // ============================================================================
  describe('hoursToDegrees', () => {
    it('converts 0 hours to 0 degrees', () => {
      expect(hoursToDegrees(0)).toBe(0);
    });

    it('converts 1 hour to 15 degrees', () => {
      expect(hoursToDegrees(1)).toBe(15);
    });

    it('converts 12 hours to 180 degrees', () => {
      expect(hoursToDegrees(12)).toBe(180);
    });

    it('converts 24 hours to 360 degrees', () => {
      expect(hoursToDegrees(24)).toBe(360);
    });

    it('handles fractional hours', () => {
      expect(hoursToDegrees(6.5)).toBe(97.5);
    });
  });

  describe('degreesToHours', () => {
    it('converts 0 degrees to 0 hours', () => {
      expect(degreesToHours(0)).toBe(0);
    });

    it('converts 15 degrees to 1 hour', () => {
      expect(degreesToHours(15)).toBe(1);
    });

    it('converts 180 degrees to 12 hours', () => {
      expect(degreesToHours(180)).toBe(12);
    });

    it('converts 360 degrees to 24 hours', () => {
      expect(degreesToHours(360)).toBe(24);
    });

    it('is inverse of hoursToDegrees', () => {
      const original = 7.25;
      expect(degreesToHours(hoursToDegrees(original))).toBeCloseTo(original, 10);
    });
  });

  // ============================================================================
  // degreesToHMS / hmsToDegrees
  // ============================================================================
  describe('degreesToHMS', () => {
    it('converts 0 degrees to 0:00:00.0', () => {
      expect(degreesToHMS(0)).toBe('0:00:00.0');
    });

    it('converts 15 degrees to 1:00:00.0', () => {
      expect(degreesToHMS(15)).toBe('1:00:00.0');
    });

    it('converts 180 degrees to 12:00:00.0', () => {
      expect(degreesToHMS(180)).toBe('12:00:00.0');
    });

    it('converts 45 degrees correctly (3h)', () => {
      expect(degreesToHMS(45)).toBe('3:00:00.0');
    });

    it('handles fractional degrees', () => {
      // 45 degrees = 3h 0m 0s (exact conversion)
      const result = degreesToHMS(45);
      expect(result).toBe('3:00:00.0');
    });

    it('converts complex angles', () => {
      // M31 RA: ~10.6847 degrees = 0h 42m 44.3s
      const result = degreesToHMS(10.6847);
      expect(result).toMatch(/^0:42:/);
    });
  });

  describe('hmsToDegrees', () => {
    it('converts 0:00:00 to 0 degrees', () => {
      expect(hmsToDegrees('0:00:00')).toBe(0);
    });

    it('converts 1:00:00 to 15 degrees', () => {
      expect(hmsToDegrees('1:00:00')).toBe(15);
    });

    it('converts 12:00:00 to 180 degrees', () => {
      expect(hmsToDegrees('12:00:00')).toBe(180);
    });

    it('converts with minutes', () => {
      // 1h 30m = 22.5 degrees
      expect(hmsToDegrees('1:30:00')).toBeCloseTo(22.5, 6);
    });

    it('converts with seconds', () => {
      // 1h 0m 30s = 15 + 0.125 = 15.125
      expect(hmsToDegrees('1:00:30')).toBeCloseTo(15.125, 6);
    });

    it('is approximate inverse of degreesToHMS', () => {
      const original = 123.456;
      const hms = degreesToHMS(original);
      expect(hmsToDegrees(hms)).toBeCloseTo(original, 1);
    });
  });

  // ============================================================================
  // degreesToDMS / dmsToDegrees
  // ============================================================================
  describe('degreesToDMS', () => {
    it('converts 0 degrees to +00:00:00.0', () => {
      expect(degreesToDMS(0)).toBe('+00:00:00.0');
    });

    it('converts positive degrees correctly', () => {
      expect(degreesToDMS(45)).toBe('+45:00:00.0');
    });

    it('converts negative degrees correctly', () => {
      expect(degreesToDMS(-45)).toBe('-45:00:00.0');
    });

    it('handles fractional degrees', () => {
      // 45.5 = 45° 30' 0"
      expect(degreesToDMS(45.5)).toBe('+45:30:00.0');
    });

    it('handles small negative angles', () => {
      expect(degreesToDMS(-0.5)).toBe('-00:30:00.0');
    });

    it('converts complex angles', () => {
      // M31 Dec: ~41.2689 degrees
      const result = degreesToDMS(41.2689);
      expect(result).toMatch(/^\+41:16:/);
    });
  });

  describe('dmsToDegrees', () => {
    it('converts +00:00:00 to 0', () => {
      expect(dmsToDegrees('+00:00:00')).toBe(0);
    });

    it('converts positive DMS to degrees', () => {
      expect(dmsToDegrees('+45:00:00')).toBe(45);
    });

    it('converts negative DMS to degrees', () => {
      expect(dmsToDegrees('-45:00:00')).toBe(-45);
    });

    it('handles arcminutes', () => {
      expect(dmsToDegrees('+45:30:00')).toBeCloseTo(45.5, 6);
    });

    it('handles arcseconds', () => {
      expect(dmsToDegrees('+45:00:30')).toBeCloseTo(45.00833333, 4);
    });

    it('handles input without sign', () => {
      expect(dmsToDegrees('45:30:00')).toBeCloseTo(45.5, 6);
    });

    it('is approximate inverse of degreesToDMS', () => {
      const original = -23.456;
      const dms = degreesToDMS(original);
      expect(dmsToDegrees(dms)).toBeCloseTo(original, 1);
    });
  });

  // ============================================================================
  // parseCoordinateString
  // ============================================================================
  describe('parseCoordinateString', () => {
    it('parses HMS format with letters', () => {
      expect(parseCoordinateString('12h 30m 45s')).toBeCloseTo(187.6875, 4);
    });

    it('parses HMS format case-insensitive', () => {
      expect(parseCoordinateString('12H 30M 45S')).toBeCloseTo(187.6875, 4);
    });

    it('parses DMS format with degree symbol', () => {
      expect(parseCoordinateString('45° 30\' 0"')).toBeCloseTo(45.5, 6);
    });

    it('parses DMS format with d letter', () => {
      expect(parseCoordinateString('45d 30m 0s')).toBeCloseTo(45.5, 6);
    });

    it('parses colon-separated format', () => {
      expect(parseCoordinateString('45:30:00')).toBeCloseTo(45.5, 6);
    });

    it('parses negative colon-separated format', () => {
      expect(parseCoordinateString('-45:30:00')).toBeCloseTo(-45.5, 6);
    });

    it('parses simple decimal format', () => {
      expect(parseCoordinateString('123.456')).toBe(123.456);
    });

    it('parses negative decimal format', () => {
      expect(parseCoordinateString('-45.5')).toBe(-45.5);
    });

    it('returns null for invalid input', () => {
      expect(parseCoordinateString('invalid')).toBeNull();
    });

    it('handles whitespace', () => {
      expect(parseCoordinateString('  45.5  ')).toBe(45.5);
    });
  });
});
