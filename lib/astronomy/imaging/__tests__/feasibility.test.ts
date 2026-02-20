/**
 * @jest-environment node
 */
import {
  calculateImagingFeasibility,
  shouldImage,
  rankTargets,
} from '../feasibility';
import { dateToJulianDate } from '../../time/julian';
import { getMoonPhase } from '../../celestial/moon';
import { getMoonDistance } from '../../celestial/separation';

// Mock dependencies
jest.mock('../../celestial/moon', () => ({
  getMoonPhase: jest.fn().mockReturnValue(0.1), // Waxing crescent
  getMoonIllumination: jest.fn().mockReturnValue(20),
}));

jest.mock('../../celestial/separation', () => ({
  getMoonDistance: jest.fn().mockReturnValue(90),
  getMoonInterference: jest.fn().mockReturnValue('low'),
}));

describe('Imaging Feasibility', () => {
  const latitude = 39.9;
  const longitude = 116.4;
  const mockedGetMoonPhase = getMoonPhase as jest.MockedFunction<typeof getMoonPhase>;
  const mockedGetMoonDistance = getMoonDistance as jest.MockedFunction<typeof getMoonDistance>;

  // ============================================================================
  // calculateImagingFeasibility
  // ============================================================================
  describe('calculateImagingFeasibility', () => {
    it('returns all required properties', () => {
      const result = calculateImagingFeasibility(180, 45, latitude, longitude);

      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('moonScore');
      expect(result).toHaveProperty('altitudeScore');
      expect(result).toHaveProperty('durationScore');
      expect(result).toHaveProperty('twilightScore');
      expect(result).toHaveProperty('recommendation');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('tips');
    });

    it('score is between 0 and 100', () => {
      const result = calculateImagingFeasibility(180, 45, latitude, longitude);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('individual scores are between 0 and 100', () => {
      const result = calculateImagingFeasibility(180, 45, latitude, longitude);
      expect(result.moonScore).toBeGreaterThanOrEqual(0);
      expect(result.moonScore).toBeLessThanOrEqual(100);
      expect(result.altitudeScore).toBeGreaterThanOrEqual(0);
      expect(result.altitudeScore).toBeLessThanOrEqual(100);
      expect(result.durationScore).toBeGreaterThanOrEqual(0);
      expect(result.durationScore).toBeLessThanOrEqual(100);
      expect(result.twilightScore).toBeGreaterThanOrEqual(0);
      expect(result.twilightScore).toBeLessThanOrEqual(100);
    });

    it('recommendation is valid', () => {
      const validRecommendations = ['excellent', 'good', 'fair', 'poor', 'not_recommended'];
      const result = calculateImagingFeasibility(180, 45, latitude, longitude);
      expect(validRecommendations).toContain(result.recommendation);
    });

    it('warnings is an array', () => {
      const result = calculateImagingFeasibility(180, 45, latitude, longitude);
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it('tips is an array', () => {
      const result = calculateImagingFeasibility(180, 45, latitude, longitude);
      expect(Array.isArray(result.tips)).toBe(true);
    });

    it('accepts custom date', () => {
      const date = new Date('2024-06-21T00:00:00Z');
      mockedGetMoonPhase.mockClear();
      mockedGetMoonDistance.mockClear();
      const result = calculateImagingFeasibility(180, 45, latitude, longitude, 30, date);
      expect(result.score).toBeDefined();
      expect(mockedGetMoonPhase).toHaveBeenCalled();
      expect(mockedGetMoonPhase.mock.calls[0][0]).toBeCloseTo(dateToJulianDate(date), 8);
      expect(mockedGetMoonDistance).toHaveBeenCalled();
      expect(mockedGetMoonDistance.mock.calls[0][2]).toBeCloseTo(dateToJulianDate(date), 8);
    });

    it('accepts custom minAltitude', () => {
      const result30 = calculateImagingFeasibility(180, 45, latitude, longitude, 30);
      const result60 = calculateImagingFeasibility(180, 45, latitude, longitude, 60);
      // Both should return valid results
      expect(result30.score).toBeDefined();
      expect(result60.score).toBeDefined();
    });

    it('high altitude targets get better altitude scores', () => {
      // Object that passes through zenith
      const high = calculateImagingFeasibility(180, latitude, latitude, longitude);
      // Object that barely rises
      const low = calculateImagingFeasibility(180, -40, latitude, longitude);
      
      expect(high.altitudeScore).toBeGreaterThan(low.altitudeScore);
    });
  });

  // ============================================================================
  // shouldImage
  // ============================================================================
  describe('shouldImage', () => {
    it('returns boolean', () => {
      const result = shouldImage(180, 45, latitude, longitude);
      expect(typeof result).toBe('boolean');
    });

    it('uses default minScore of 40', () => {
      const result = shouldImage(180, 45, latitude, longitude);
      expect(typeof result).toBe('boolean');
    });

    it('respects custom minScore', () => {
      const lowBar = shouldImage(180, 45, latitude, longitude, 10);
      
      // Low bar should be easier to pass
      expect(lowBar).toBe(true);
      
      // High bar may or may not pass depending on conditions
      const highBar = shouldImage(180, 45, latitude, longitude, 95);
      expect(typeof highBar).toBe('boolean');
    });

    it('returns true for good targets', () => {
      const result = shouldImage(180, 45, latitude, longitude, 20);
      expect(result).toBe(true);
    });
  });

  // ============================================================================
  // rankTargets
  // ============================================================================
  describe('rankTargets', () => {
    const targets = [
      { id: 'M31', ra: 10.68, dec: 41.27 },
      { id: 'M42', ra: 83.82, dec: -5.39 },
      { id: 'M45', ra: 56.87, dec: 24.11 },
    ];

    it('returns array of ranked targets', () => {
      const result = rankTargets(targets, latitude, longitude);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(targets.length);
    });

    it('each result has id, score, feasibility', () => {
      const result = rankTargets(targets, latitude, longitude);
      
      for (const item of result) {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('score');
        expect(item).toHaveProperty('feasibility');
      }
    });

    it('results are sorted by score descending', () => {
      const result = rankTargets(targets, latitude, longitude);
      
      for (let i = 1; i < result.length; i++) {
        expect(result[i].score).toBeLessThanOrEqual(result[i - 1].score);
      }
    });

    it('score matches feasibility.score', () => {
      const result = rankTargets(targets, latitude, longitude);
      
      for (const item of result) {
        expect(item.score).toBe(item.feasibility.score);
      }
    });

    it('accepts custom date', () => {
      const date = new Date('2024-06-21T00:00:00Z');
      const result = rankTargets(targets, latitude, longitude, date);
      expect(result).toHaveLength(targets.length);
    });

    it('handles empty array', () => {
      const result = rankTargets([], latitude, longitude);
      expect(result).toHaveLength(0);
    });

    it('handles single target', () => {
      const result = rankTargets([targets[0]], latitude, longitude);
      expect(result).toHaveLength(1);
    });
  });
});
