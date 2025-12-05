/**
 * @jest-environment node
 */
import {
  angularSeparation,
  getMoonDistance,
  isTooCloseToMoon,
  getMoonInterference,
  getOptimalMoonWindow,
} from '../separation';

// Mock moon position for deterministic tests
jest.mock('../moon', () => ({
  getMoonPosition: jest.fn().mockReturnValue({ ra: 180, dec: 0 }),
}));

describe('Angular Separation Calculations', () => {
  // ============================================================================
  // angularSeparation
  // ============================================================================
  describe('angularSeparation', () => {
    it('returns 0 for same position', () => {
      expect(angularSeparation(0, 0, 0, 0)).toBeCloseTo(0, 10);
      expect(angularSeparation(180, 45, 180, 45)).toBeCloseTo(0, 10);
    });

    it('returns 180 for opposite positions', () => {
      expect(angularSeparation(0, 0, 180, 0)).toBeCloseTo(180, 5);
      expect(angularSeparation(0, 90, 0, -90)).toBeCloseTo(180, 5);
    });

    it('returns 90 for perpendicular positions', () => {
      expect(angularSeparation(0, 0, 90, 0)).toBeCloseTo(90, 5);
      expect(angularSeparation(0, 0, 0, 90)).toBeCloseTo(90, 5);
    });

    it('handles pole to equator', () => {
      // North pole to point on equator
      expect(angularSeparation(0, 90, 0, 0)).toBeCloseTo(90, 5);
      expect(angularSeparation(90, 90, 180, 0)).toBeCloseTo(90, 5);
    });

    it('is symmetric', () => {
      const sep1 = angularSeparation(10, 20, 30, 40);
      const sep2 = angularSeparation(30, 40, 10, 20);
      expect(sep1).toBeCloseTo(sep2, 10);
    });

    it('calculates M31 to M33 separation (~15°)', () => {
      // M31: RA 10.68°, Dec 41.27°
      // M33: RA 23.46°, Dec 30.66°
      const sep = angularSeparation(10.68, 41.27, 23.46, 30.66);
      expect(sep).toBeCloseTo(15, 0);
    });

    it('handles negative declinations', () => {
      const sep = angularSeparation(0, -30, 90, -30);
      expect(sep).toBeGreaterThan(0);
      expect(sep).toBeLessThan(180);
    });

    it('handles RA wrapping', () => {
      // Points on either side of RA=0
      const sep = angularSeparation(359, 0, 1, 0);
      expect(sep).toBeCloseTo(2, 1);
    });
  });

  // ============================================================================
  // getMoonDistance
  // ============================================================================
  describe('getMoonDistance', () => {
    it('returns a number', () => {
      const dist = getMoonDistance(0, 0);
      expect(typeof dist).toBe('number');
    });

    it('returns 0 for moon position (mocked at 180, 0)', () => {
      const dist = getMoonDistance(180, 0);
      expect(dist).toBeCloseTo(0, 5);
    });

    it('returns 180 for opposite position', () => {
      const dist = getMoonDistance(0, 0);
      expect(dist).toBeCloseTo(180, 5);
    });

    it('returns 90 for perpendicular position', () => {
      const dist = getMoonDistance(90, 0);
      expect(dist).toBeCloseTo(90, 5);
    });

    it('distance is always positive', () => {
      const positions = [
        { ra: 0, dec: 0 },
        { ra: 45, dec: 30 },
        { ra: 270, dec: -45 },
      ];
      
      for (const pos of positions) {
        const dist = getMoonDistance(pos.ra, pos.dec);
        expect(dist).toBeGreaterThanOrEqual(0);
      }
    });
  });

  // ============================================================================
  // isTooCloseToMoon
  // ============================================================================
  describe('isTooCloseToMoon', () => {
    it('returns true for position close to moon', () => {
      // Moon mocked at 180, 0
      const result = isTooCloseToMoon(175, 0);
      expect(result).toBe(true);
    });

    it('returns false for position far from moon', () => {
      const result = isTooCloseToMoon(0, 0);
      expect(result).toBe(false);
    });

    it('uses default minDistance of 30', () => {
      // 25 degrees from moon (180, 0)
      const close = isTooCloseToMoon(155, 0);
      expect(close).toBe(true);
      
      // 35 degrees from moon
      const far = isTooCloseToMoon(145, 0);
      expect(far).toBe(false);
    });

    it('respects custom minDistance', () => {
      // 50 degrees from moon
      const result50 = isTooCloseToMoon(130, 0, 60);
      expect(result50).toBe(true);
      
      const result40 = isTooCloseToMoon(130, 0, 40);
      expect(result40).toBe(false);
    });

    it('adjusts threshold based on moon illumination', () => {
      // With high illumination, threshold increases
      const highIllum = isTooCloseToMoon(145, 0, 30, 100);
      // Adjusted min = 30 * (1 + 100/200) = 45
      // Distance ~35 degrees, so should be true
      expect(highIllum).toBe(true);
      
      // With low illumination, threshold stays low
      const lowIllum = isTooCloseToMoon(145, 0, 30, 0);
      // Distance ~35 degrees > 30, so should be false
      expect(lowIllum).toBe(false);
    });
  });

  // ============================================================================
  // getMoonInterference
  // ============================================================================
  describe('getMoonInterference', () => {
    it('returns "none" for new moon', () => {
      const result = getMoonInterference(0, 0, 0);
      expect(result).toBe('none');
    });

    it('returns "none" for very low illumination', () => {
      const result = getMoonInterference(0, 0, 4);
      expect(result).toBe('none');
    });

    it('returns valid interference level', () => {
      const validLevels = ['none', 'low', 'medium', 'high', 'severe'];
      const result = getMoonInterference(160, 0, 80);
      expect(validLevels).toContain(result);
    });

    it('increases with illumination', () => {
      // At same distance, higher illumination = worse interference
      const levelOrder = ['none', 'low', 'medium', 'high', 'severe'];
      
      const low = getMoonInterference(140, 0, 20);
      const high = getMoonInterference(140, 0, 90);
      
      const lowIndex = levelOrder.indexOf(low);
      const highIndex = levelOrder.indexOf(high);
      
      expect(highIndex).toBeGreaterThanOrEqual(lowIndex);
    });

    it('increases with proximity', () => {
      // At same illumination, closer = worse interference
      const levelOrder = ['none', 'low', 'medium', 'high', 'severe'];
      
      const far = getMoonInterference(90, 0, 50);
      const close = getMoonInterference(175, 0, 50);
      
      const farIndex = levelOrder.indexOf(far);
      const closeIndex = levelOrder.indexOf(close);
      
      expect(closeIndex).toBeGreaterThanOrEqual(farIndex);
    });

    it('returns severe for full moon close by', () => {
      // Very close to full moon
      const result = getMoonInterference(178, 0, 99);
      expect(result).toBe('severe');
    });
  });

  // ============================================================================
  // getOptimalMoonWindow
  // ============================================================================
  describe('getOptimalMoonWindow', () => {
    it('returns hasWindow property', () => {
      const result = getOptimalMoonWindow(0, 0, new Date());
      expect(result).toHaveProperty('hasWindow');
    });

    it('returns true for far targets', () => {
      // Target far from moon (180 degrees away)
      const result = getOptimalMoonWindow(0, 0, new Date());
      expect(result.hasWindow).toBe(true);
    });

    it('returns false for very close targets', () => {
      // Target close to moon (within 45 degrees)
      const result = getOptimalMoonWindow(170, 0, new Date());
      expect(result.hasWindow).toBe(false);
    });
  });
});
