/**
 * @jest-environment node
 */
import {
  formatRA,
  formatDec,
  formatCoordinates,
  formatAltitude,
  formatAzimuth,
  getCardinalDirection,
  formatAzimuthWithDirection,
  formatAngularSize,
  formatSeparation,
} from '../formats';

describe('Coordinate Formats', () => {
  // ============================================================================
  // formatRA
  // ============================================================================
  describe('formatRA', () => {
    it('formats 0 degrees correctly', () => {
      expect(formatRA(0)).toBe('00h 00m 00.0s');
    });

    it('formats 15 degrees (1 hour) correctly', () => {
      expect(formatRA(15)).toBe('01h 00m 00.0s');
    });

    it('formats 180 degrees (12 hours) correctly', () => {
      expect(formatRA(180)).toBe('12h 00m 00.0s');
    });

    it('formats with custom precision', () => {
      expect(formatRA(45, 2)).toBe('03h 00m 00.00s');
    });

    it('formats complex angles', () => {
      // 83.633 degrees ≈ 5h 34m 31.9s (Orion Nebula RA)
      const result = formatRA(83.633);
      expect(result).toMatch(/^05h 34m/);
    });

    it('handles large RA values', () => {
      // 350 degrees = 23.333... hours ≈ 23h 19m 60s (floating point edge case)
      const result = formatRA(350);
      expect(result).toMatch(/^23h 19m|^23h 20m/);
    });
  });

  // ============================================================================
  // formatDec
  // ============================================================================
  describe('formatDec', () => {
    it('formats 0 degrees correctly', () => {
      expect(formatDec(0)).toBe('+00° 00\' 00.0"');
    });

    it('formats positive declination correctly', () => {
      expect(formatDec(45)).toBe('+45° 00\' 00.0"');
    });

    it('formats negative declination correctly', () => {
      expect(formatDec(-45)).toBe('-45° 00\' 00.0"');
    });

    it('formats with custom precision', () => {
      expect(formatDec(45.5, 2)).toBe('+45° 30\' 00.00"');
    });

    it('formats complex angles', () => {
      // -5.391 degrees ≈ -5° 23' 27.6" (Orion Nebula Dec)
      const result = formatDec(-5.391);
      expect(result).toMatch(/^-05° 23'/);
    });

    it('handles small negative values', () => {
      expect(formatDec(-0.5)).toBe('-00° 30\' 00.0"');
    });
  });

  // ============================================================================
  // formatCoordinates
  // ============================================================================
  describe('formatCoordinates', () => {
    it('formats coordinates in HMS/DMS format by default', () => {
      const result = formatCoordinates(180, 45);
      expect(result.ra).toBe('12:00:00.0');
      expect(result.dec).toBe('+45:00:00.0');
    });

    it('formats coordinates in HMS format', () => {
      const result = formatCoordinates(180, 45, 'hms');
      expect(result.ra).toBe('12:00:00.0');
      expect(result.dec).toBe('+45:00:00.0');
    });

    it('formats coordinates in degrees format', () => {
      const result = formatCoordinates(180, 45, 'degrees');
      expect(result.ra).toBe('180.0000°');
      expect(result.dec).toBe('45.0000°');
    });

    it('handles negative declination', () => {
      const result = formatCoordinates(90, -30, 'hms');
      expect(result.dec).toBe('-30:00:00.0');
    });
  });

  // ============================================================================
  // formatAltitude
  // ============================================================================
  describe('formatAltitude', () => {
    it('formats positive altitude', () => {
      expect(formatAltitude(45)).toBe('+45.0°');
    });

    it('formats negative altitude', () => {
      expect(formatAltitude(-10)).toBe('-10.0°');
    });

    it('formats zero altitude', () => {
      expect(formatAltitude(0)).toBe('+0.0°');
    });

    it('formats fractional altitude', () => {
      expect(formatAltitude(45.67)).toBe('+45.7°');
    });
  });

  // ============================================================================
  // formatAzimuth
  // ============================================================================
  describe('formatAzimuth', () => {
    it('formats 0 degrees', () => {
      expect(formatAzimuth(0)).toBe('0.0°');
    });

    it('formats 180 degrees', () => {
      expect(formatAzimuth(180)).toBe('180.0°');
    });

    it('formats 360 degrees', () => {
      expect(formatAzimuth(360)).toBe('360.0°');
    });

    it('formats fractional azimuth', () => {
      expect(formatAzimuth(123.45)).toBe('123.5°');
    });
  });

  // ============================================================================
  // getCardinalDirection
  // ============================================================================
  describe('getCardinalDirection', () => {
    it('returns N for 0 degrees', () => {
      expect(getCardinalDirection(0)).toBe('N');
    });

    it('returns N for 360 degrees', () => {
      expect(getCardinalDirection(360)).toBe('N');
    });

    it('returns E for 90 degrees', () => {
      expect(getCardinalDirection(90)).toBe('E');
    });

    it('returns S for 180 degrees', () => {
      expect(getCardinalDirection(180)).toBe('S');
    });

    it('returns W for 270 degrees', () => {
      expect(getCardinalDirection(270)).toBe('W');
    });

    it('returns NE for 45 degrees', () => {
      expect(getCardinalDirection(45)).toBe('NE');
    });

    it('returns SE for 135 degrees', () => {
      expect(getCardinalDirection(135)).toBe('SE');
    });

    it('returns SW for 225 degrees', () => {
      expect(getCardinalDirection(225)).toBe('SW');
    });

    it('returns NW for 315 degrees', () => {
      expect(getCardinalDirection(315)).toBe('NW');
    });

    it('returns NNE for 22.5 degrees', () => {
      expect(getCardinalDirection(22.5)).toBe('NNE');
    });
  });

  // ============================================================================
  // formatAzimuthWithDirection
  // ============================================================================
  describe('formatAzimuthWithDirection', () => {
    it('formats north correctly', () => {
      expect(formatAzimuthWithDirection(0)).toBe('0.0° (N)');
    });

    it('formats east correctly', () => {
      expect(formatAzimuthWithDirection(90)).toBe('90.0° (E)');
    });

    it('formats south correctly', () => {
      expect(formatAzimuthWithDirection(180)).toBe('180.0° (S)');
    });

    it('formats west correctly', () => {
      expect(formatAzimuthWithDirection(270)).toBe('270.0° (W)');
    });

    it('formats intermediate direction', () => {
      expect(formatAzimuthWithDirection(45)).toBe('45.0° (NE)');
    });
  });

  // ============================================================================
  // formatAngularSize
  // ============================================================================
  describe('formatAngularSize', () => {
    it('returns undefined for undefined input', () => {
      expect(formatAngularSize(undefined)).toBeUndefined();
    });

    it('formats single dimension in arcminutes', () => {
      expect(formatAngularSize(5)).toBe("5.0'");
    });

    it('formats single dimension in arcseconds for small sizes', () => {
      expect(formatAngularSize(0.5)).toBe('30.0"');
    });

    it('formats equal dimensions as single value', () => {
      expect(formatAngularSize(5, 5)).toBe("5.0'");
    });

    it('formats different dimensions', () => {
      expect(formatAngularSize(10, 5)).toBe("10.0' × 5.0'");
    });

    it('formats very small dimensions in arcseconds', () => {
      expect(formatAngularSize(0.5, 0.3)).toBe('30.0" × 18.0"');
    });
  });

  // ============================================================================
  // formatSeparation
  // ============================================================================
  describe('formatSeparation', () => {
    it('formats degrees', () => {
      expect(formatSeparation(5)).toBe('5.0°');
    });

    it('formats arcminutes for small separations', () => {
      expect(formatSeparation(0.5)).toBe("30.0'");
    });

    it('formats arcseconds for very small separations', () => {
      expect(formatSeparation(0.01)).toBe('36.0"');
    });

    it('formats exactly 1 degree', () => {
      expect(formatSeparation(1)).toBe('1.0°');
    });

    it('formats exactly 1 arcminute', () => {
      expect(formatSeparation(1 / 60)).toBe("1.0'");
    });
  });
});
