/**
 * @jest-environment node
 */
import {
  isCircumpolar,
  neverRises,
  isAlwaysAbove,
  canReachAltitude,
  isVisible,
  getVisibilityClass,
  getHoursAboveHorizon,
  getHoursAboveAltitude,
} from '../circumpolar';

describe('Circumpolar and Visibility Checks', () => {
  // ============================================================================
  // isCircumpolar
  // ============================================================================
  describe('isCircumpolar', () => {
    it('returns true for north pole from arctic', () => {
      // Polaris (dec 89.26°) from latitude 60°N
      expect(isCircumpolar(89.26, 60)).toBe(true);
    });

    it('returns false for equatorial object from mid-latitude', () => {
      // Object at dec 0° from latitude 40°N
      expect(isCircumpolar(0, 40)).toBe(false);
    });

    it('returns true when |dec| > 90 - |lat|', () => {
      // At latitude 50°, objects with dec > 40° should be circumpolar
      expect(isCircumpolar(50, 50)).toBe(true);
      expect(isCircumpolar(45, 50)).toBe(true);
      expect(isCircumpolar(35, 50)).toBe(false);
    });

    it('works for southern hemisphere', () => {
      // From -50° latitude, -50° dec object is circumpolar
      expect(isCircumpolar(-50, -50)).toBe(true);
      expect(isCircumpolar(-45, -50)).toBe(true);
    });

    it('handles equator', () => {
      // At equator, only objects at poles would be circumpolar
      expect(isCircumpolar(0, 0)).toBe(false);
      expect(isCircumpolar(89.9, 0)).toBe(false);
    });

    it('handles poles', () => {
      expect(isCircumpolar(10, 90)).toBe(true);
      expect(isCircumpolar(-10, 90)).toBe(false);
    });
  });

  // ============================================================================
  // neverRises
  // ============================================================================
  describe('neverRises', () => {
    it('returns true for southern object from far north', () => {
      // Object at -80° dec from 60°N never rises
      expect(neverRises(-80, 60)).toBe(true);
    });

    it('returns false for equatorial objects', () => {
      // Equatorial objects can be seen from anywhere
      expect(neverRises(0, 60)).toBe(false);
      expect(neverRises(0, -60)).toBe(false);
    });

    it('returns true when dec < -(90 - lat) for northern hemisphere', () => {
      // At 40°N, objects with dec < -50° never rise
      expect(neverRises(-55, 40)).toBe(true);
      expect(neverRises(-45, 40)).toBe(false);
    });

    it('returns true for northern object from far south', () => {
      // Object at +80° dec from -60°S never rises
      expect(neverRises(80, -60)).toBe(true);
    });

    it('works for southern hemisphere', () => {
      // At -40°S, objects with dec > 50° never rise
      expect(neverRises(55, -40)).toBe(true);
      expect(neverRises(45, -40)).toBe(false);
    });

    it('handles equator', () => {
      // At equator, all objects rise
      expect(neverRises(89, 0)).toBe(false);
      expect(neverRises(-89, 0)).toBe(false);
    });
  });

  // ============================================================================
  // isAlwaysAbove
  // ============================================================================
  describe('isAlwaysAbove', () => {
    it('returns true for circumpolar object above threshold', () => {
      // Polaris from 60°N is always above 0°
      expect(isAlwaysAbove(89, 60, 0)).toBe(true);
    });

    it('returns false for non-circumpolar object', () => {
      expect(isAlwaysAbove(30, 40, 0)).toBe(false);
    });

    it('works with altitude thresholds', () => {
      // Object at 85° dec from 60°N
      // Min altitude = -90 + |60 + 85| = 55°
      expect(isAlwaysAbove(85, 60, 30)).toBe(true);
      expect(isAlwaysAbove(85, 60, 60)).toBe(false);
    });
  });

  // ============================================================================
  // canReachAltitude
  // ============================================================================
  describe('canReachAltitude', () => {
    it('returns true for achievable altitude', () => {
      // Object at 45° dec from 40°N can reach max alt of 85°
      expect(canReachAltitude(45, 40, 60)).toBe(true);
    });

    it('returns false for unachievable altitude', () => {
      // Object at 0° dec from 40°N has max alt of 50°
      expect(canReachAltitude(0, 40, 60)).toBe(false);
    });

    it('returns true when maxAlt >= targetAlt', () => {
      // Max alt = 90 - |lat - dec|
      const lat = 40;
      const dec = 40; // Max alt = 90°
      expect(canReachAltitude(dec, lat, 89)).toBe(true);
      expect(canReachAltitude(dec, lat, 90)).toBe(true);
    });

    it('handles negative declinations', () => {
      // Object at -30° dec from 40°N has max alt of 20°
      expect(canReachAltitude(-30, 40, 15)).toBe(true);
      expect(canReachAltitude(-30, 40, 25)).toBe(false);
    });
  });

  // ============================================================================
  // isVisible
  // ============================================================================
  describe('isVisible', () => {
    it('returns true for visible objects', () => {
      expect(isVisible(0, 40)).toBe(true);
      expect(isVisible(45, 40)).toBe(true);
    });

    it('returns false for objects that never rise', () => {
      expect(isVisible(-70, 40)).toBe(false);
    });

    it('returns opposite of neverRises', () => {
      const testCases = [
        { dec: 0, lat: 40 },
        { dec: -70, lat: 40 },
        { dec: 89, lat: 0 },
      ];
      
      for (const { dec, lat } of testCases) {
        expect(isVisible(dec, lat)).toBe(!neverRises(dec, lat));
      }
    });
  });

  // ============================================================================
  // getVisibilityClass
  // ============================================================================
  describe('getVisibilityClass', () => {
    it('returns "circumpolar" for circumpolar objects', () => {
      expect(getVisibilityClass(85, 60)).toBe('circumpolar');
    });

    it('returns "never_rises" for far southern objects from northern hemisphere', () => {
      expect(getVisibilityClass(-70, 40)).toBe('never_rises');
    });

    it('returns "visible" for normal objects', () => {
      expect(getVisibilityClass(0, 40)).toBe('visible');
      expect(getVisibilityClass(30, 40)).toBe('visible');
    });

    it('returns valid classification', () => {
      const validClasses = ['circumpolar', 'visible', 'never_rises'];
      const result = getVisibilityClass(45, 40);
      expect(validClasses).toContain(result);
    });
  });

  // ============================================================================
  // getHoursAboveHorizon
  // ============================================================================
  describe('getHoursAboveHorizon', () => {
    it('returns 0 for objects that never rise', () => {
      expect(getHoursAboveHorizon(-70, 40)).toBe(0);
    });

    it('returns 24 for circumpolar objects', () => {
      expect(getHoursAboveHorizon(85, 60)).toBe(24);
    });

    it('returns ~12 for equatorial objects at equator', () => {
      // At equator, 0° dec object is up exactly half the time
      expect(getHoursAboveHorizon(0, 0)).toBeCloseTo(12, 0);
    });

    it('returns value between 0 and 24', () => {
      const hours = getHoursAboveHorizon(30, 40);
      expect(hours).toBeGreaterThanOrEqual(0);
      expect(hours).toBeLessThanOrEqual(24);
    });

    it('increases with declination in northern hemisphere', () => {
      const hours0 = getHoursAboveHorizon(0, 40);
      const hours30 = getHoursAboveHorizon(30, 40);
      const hours50 = getHoursAboveHorizon(50, 40);
      
      expect(hours30).toBeGreaterThan(hours0);
      expect(hours50).toBeGreaterThanOrEqual(hours30);
    });
  });

  // ============================================================================
  // getHoursAboveAltitude
  // ============================================================================
  describe('getHoursAboveAltitude', () => {
    it('returns 0 for unachievable altitude', () => {
      expect(getHoursAboveAltitude(0, 40, 60)).toBe(0);
    });

    it('returns 24 for always-above case', () => {
      // Object at 85° dec from 60°N, min alt ~55°
      expect(getHoursAboveAltitude(85, 60, 30)).toBe(24);
    });

    it('returns value between 0 and 24', () => {
      const hours = getHoursAboveAltitude(45, 40, 30);
      expect(hours).toBeGreaterThanOrEqual(0);
      expect(hours).toBeLessThanOrEqual(24);
    });

    it('decreases with higher altitude threshold', () => {
      const hours20 = getHoursAboveAltitude(45, 40, 20);
      const hours40 = getHoursAboveAltitude(45, 40, 40);
      const hours60 = getHoursAboveAltitude(45, 40, 60);
      
      expect(hours40).toBeLessThanOrEqual(hours20);
      expect(hours60).toBeLessThanOrEqual(hours40);
    });

    it('returns less than horizon hours when threshold > 0', () => {
      const horizonHours = getHoursAboveHorizon(45, 40);
      const aboveThreshold = getHoursAboveAltitude(45, 40, 30);
      
      expect(aboveThreshold).toBeLessThanOrEqual(horizonHours);
    });
  });
});
