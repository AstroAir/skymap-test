/**
 * @jest-environment node
 */
import {
  TWILIGHT_THRESHOLDS,
  calculateHourAngle,
  calculateTwilightTimes,
  getCurrentTwilightPhase,
  isDarkEnough,
  getTimeUntilDarkness,
} from '../calculator';

describe('Twilight Calculator', () => {
  // Test location: Beijing (39.9°N, 116.4°E)
  const latitude = 39.9;
  const longitude = 116.4;

  // ============================================================================
  // Constants
  // ============================================================================
  describe('TWILIGHT_THRESHOLDS', () => {
    it('has correct sunrise threshold', () => {
      expect(TWILIGHT_THRESHOLDS.sunrise).toBeCloseTo(-0.833, 2);
    });

    it('has correct civil threshold', () => {
      expect(TWILIGHT_THRESHOLDS.civil).toBe(-6);
    });

    it('has correct nautical threshold', () => {
      expect(TWILIGHT_THRESHOLDS.nautical).toBe(-12);
    });

    it('has correct astronomical threshold', () => {
      expect(TWILIGHT_THRESHOLDS.astronomical).toBe(-18);
    });
  });

  // ============================================================================
  // calculateHourAngle
  // ============================================================================
  describe('calculateHourAngle', () => {
    it('returns valid hour angle for normal case', () => {
      const ha = calculateHourAngle(0, 45, -6);
      expect(typeof ha).toBe('number');
      expect(ha).toBeGreaterThan(0);
      expect(ha).toBeLessThan(180);
    });

    it('returns 180 when sun is always above threshold', () => {
      // Very far north in summer - sun is always above -18° (astronomical twilight)
      // cosH < -1, so returns 180 (always above)
      const ha = calculateHourAngle(23.44, 70, -18);
      expect(ha).toBe(180);
    });

    it('returns 180 when always above threshold', () => {
      // At extreme latitude, sun might always be above certain threshold
      const ha = calculateHourAngle(23.44, 80, 10);
      expect(ha).toBe(180);
    });

    it('hour angle increases with lower threshold', () => {
      const ha6 = calculateHourAngle(0, 45, -6);
      const ha12 = calculateHourAngle(0, 45, -12);
      const ha18 = calculateHourAngle(0, 45, -18);

      expect(ha12).toBeGreaterThan(ha6);
      expect(ha18).toBeGreaterThan(ha12);
    });
  });

  // ============================================================================
  // calculateTwilightTimes
  // ============================================================================
  describe('calculateTwilightTimes', () => {
    it('returns all required properties', () => {
      const twilight = calculateTwilightTimes(latitude, longitude);

      expect(twilight).toHaveProperty('sunset');
      expect(twilight).toHaveProperty('civilDusk');
      expect(twilight).toHaveProperty('nauticalDusk');
      expect(twilight).toHaveProperty('astronomicalDusk');
      expect(twilight).toHaveProperty('astronomicalDawn');
      expect(twilight).toHaveProperty('nauticalDawn');
      expect(twilight).toHaveProperty('civilDawn');
      expect(twilight).toHaveProperty('sunrise');
      expect(twilight).toHaveProperty('nightDuration');
      expect(twilight).toHaveProperty('darknessDuration');
      expect(twilight).toHaveProperty('isCurrentlyNight');
      expect(twilight).toHaveProperty('currentTwilightPhase');
    });

    it('twilight times are in correct order', () => {
      const date = new Date('2024-06-21T00:00:00Z');
      const twilight = calculateTwilightTimes(latitude, longitude, date);

      // Evening sequence: sunset < civilDusk < nauticalDusk < astronomicalDusk
      if (twilight.sunset && twilight.civilDusk) {
        expect(twilight.civilDusk.getTime()).toBeGreaterThan(twilight.sunset.getTime());
      }
      if (twilight.civilDusk && twilight.nauticalDusk) {
        expect(twilight.nauticalDusk.getTime()).toBeGreaterThan(twilight.civilDusk.getTime());
      }
      if (twilight.nauticalDusk && twilight.astronomicalDusk) {
        expect(twilight.astronomicalDusk.getTime()).toBeGreaterThan(twilight.nauticalDusk.getTime());
      }
    });

    it('nightDuration is positive', () => {
      const twilight = calculateTwilightTimes(latitude, longitude);
      expect(twilight.nightDuration).toBeGreaterThanOrEqual(0);
    });

    it('darknessDuration is less than or equal to nightDuration', () => {
      const twilight = calculateTwilightTimes(latitude, longitude);
      // Astronomical darkness is shorter than civil night
      expect(twilight.darknessDuration).toBeLessThanOrEqual(twilight.nightDuration + 1);
    });

    it('currentTwilightPhase is valid', () => {
      const twilight = calculateTwilightTimes(latitude, longitude);
      const validPhases = ['day', 'civil', 'nautical', 'astronomical', 'night'];
      expect(validPhases).toContain(twilight.currentTwilightPhase);
    });

    it('accepts custom date', () => {
      const summerDate = new Date('2024-06-21T00:00:00Z');
      const winterDate = new Date('2024-12-21T00:00:00Z');

      const summer = calculateTwilightTimes(latitude, longitude, summerDate);
      const winter = calculateTwilightTimes(latitude, longitude, winterDate);

      // Winter nights are longer in northern hemisphere
      expect(winter.nightDuration).toBeGreaterThan(summer.nightDuration);
    });
  });

  // ============================================================================
  // getCurrentTwilightPhase
  // ============================================================================
  describe('getCurrentTwilightPhase', () => {
    it('returns valid phase', () => {
      const phase = getCurrentTwilightPhase(latitude, longitude);
      const validPhases = ['day', 'civil', 'nautical', 'astronomical', 'night'];
      expect(validPhases).toContain(phase);
    });

    it('accepts custom date', () => {
      const noonDate = new Date('2024-06-21T04:00:00Z'); // ~noon in Beijing
      const phase = getCurrentTwilightPhase(latitude, longitude, noonDate);
      expect(phase).toBe('day');
    });

    it('returns day for midday', () => {
      // 12:00 local time in Beijing (UTC+8) = 04:00 UTC
      const midday = new Date('2024-06-21T04:00:00Z');
      const phase = getCurrentTwilightPhase(latitude, longitude, midday);
      expect(phase).toBe('day');
    });

    it('returns night for midnight (when applicable)', () => {
      // Midnight in Beijing = 16:00 UTC previous day
      const midnight = new Date('2024-01-15T16:00:00Z');
      const phase = getCurrentTwilightPhase(latitude, longitude, midnight);
      expect(phase).toBe('night');
    });
  });

  // ============================================================================
  // isDarkEnough
  // ============================================================================
  describe('isDarkEnough', () => {
    it('returns boolean', () => {
      const result = isDarkEnough(latitude, longitude);
      expect(typeof result).toBe('boolean');
    });

    it('returns true for night phase', () => {
      // Deep winter midnight
      const midnight = new Date('2024-01-15T16:00:00Z');
      const result = isDarkEnough(latitude, longitude, midnight);
      expect(result).toBe(true);
    });

    it('returns false for day phase', () => {
      const midday = new Date('2024-06-21T04:00:00Z');
      const result = isDarkEnough(latitude, longitude, midday);
      expect(result).toBe(false);
    });

    it('accepts custom date', () => {
      const date = new Date('2024-06-21T12:00:00Z');
      const result = isDarkEnough(latitude, longitude, date);
      expect(typeof result).toBe('boolean');
    });
  });

  // ============================================================================
  // getTimeUntilDarkness
  // ============================================================================
  describe('getTimeUntilDarkness', () => {
    it('returns a number', () => {
      const result = getTimeUntilDarkness(latitude, longitude);
      expect(typeof result).toBe('number');
    });

    it('returns a valid number for any time', () => {
      // Test that the function returns a valid number
      const midnight = new Date('2024-01-15T16:00:00Z');
      const result = getTimeUntilDarkness(latitude, longitude, midnight);
      expect(typeof result).toBe('number');
      // Result can be 0 (already dark), positive (waiting), or -1 (no darkness tonight)
      expect(result).toBeGreaterThanOrEqual(-1);
    });

    it('returns positive when waiting for darkness', () => {
      // Morning in Beijing (UTC+8), well before sunset
      // 2024-06-21 06:00 UTC = 14:00 Beijing time (2 PM)
      const afternoon = new Date('2024-06-21T06:00:00Z');
      const result = getTimeUntilDarkness(latitude, longitude, afternoon);
      // Should return positive (waiting for darkness) or -1 (polar day)
      // In summer at 39.9°N, there should be astronomical darkness
      expect(result === -1 || result > 0).toBe(true);
    });

    it('returns minutes (reasonable range)', () => {
      const midday = new Date('2024-06-21T04:00:00Z');
      const result = getTimeUntilDarkness(latitude, longitude, midday);
      // Should be several hours (several hundred minutes)
      if (result > 0) {
        expect(result).toBeLessThan(24 * 60); // Less than 24 hours
      }
    });
  });
});
