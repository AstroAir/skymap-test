/**
 * @jest-environment node
 */
import {
  planMultipleTargets,
  optimizeTargetOrder,
  estimateSlewTime,
} from '../planning';

// Mock dependencies for deterministic tests
jest.mock('../feasibility', () => ({
  calculateImagingFeasibility: jest.fn().mockReturnValue({
    score: 75,
    moonScore: 80,
    altitudeScore: 70,
    durationScore: 80,
    twilightScore: 70,
    recommendation: 'good',
    warnings: [],
    tips: [],
  }),
}));

jest.mock('../../visibility/target', () => ({
  calculateTargetVisibility: jest.fn().mockImplementation(() => ({
    riseTime: new Date('2024-06-21T20:00:00Z'),
    setTime: new Date('2024-06-22T06:00:00Z'),
    transitTime: new Date('2024-06-22T01:00:00Z'),
    transitAltitude: 70,
    isCurrentlyVisible: true,
    isCircumpolar: false,
    neverRises: false,
    imagingWindowStart: new Date('2024-06-21T21:00:00Z'),
    imagingWindowEnd: new Date('2024-06-22T05:00:00Z'),
    imagingHours: 8,
    darkImagingStart: new Date('2024-06-21T22:00:00Z'),
    darkImagingEnd: new Date('2024-06-22T04:00:00Z'),
    darkImagingHours: 6,
  })),
}));

describe('Multi-Target Planning', () => {
  const latitude = 39.9;
  const longitude = 116.4;

  const targets = [
    { id: 'M31', name: 'Andromeda Galaxy', ra: 10.68, dec: 41.27 },
    { id: 'M42', name: 'Orion Nebula', ra: 83.82, dec: -5.39 },
    { id: 'M45', name: 'Pleiades', ra: 56.87, dec: 24.11 },
  ];

  // ============================================================================
  // planMultipleTargets
  // ============================================================================
  describe('planMultipleTargets', () => {
    it('returns a plan with required properties', () => {
      const plan = planMultipleTargets(targets, latitude, longitude);

      expect(plan).toHaveProperty('targets');
      expect(plan).toHaveProperty('totalImagingTime');
      expect(plan).toHaveProperty('nightCoverage');
      expect(plan).toHaveProperty('recommendations');
    });

    it('returns planned targets for each input', () => {
      const plan = planMultipleTargets(targets, latitude, longitude);
      expect(plan.targets).toHaveLength(targets.length);
    });

    it('each planned target has required properties', () => {
      const plan = planMultipleTargets(targets, latitude, longitude);

      for (const target of plan.targets) {
        expect(target).toHaveProperty('id');
        expect(target).toHaveProperty('name');
        expect(target).toHaveProperty('ra');
        expect(target).toHaveProperty('dec');
        expect(target).toHaveProperty('windowStart');
        expect(target).toHaveProperty('windowEnd');
        expect(target).toHaveProperty('duration');
        expect(target).toHaveProperty('feasibility');
        expect(target).toHaveProperty('conflicts');
      }
    });

    it('totalImagingTime is non-negative', () => {
      const plan = planMultipleTargets(targets, latitude, longitude);
      expect(plan.totalImagingTime).toBeGreaterThanOrEqual(0);
    });

    it('nightCoverage is between 0 and 100', () => {
      const plan = planMultipleTargets(targets, latitude, longitude);
      expect(plan.nightCoverage).toBeGreaterThanOrEqual(0);
      expect(plan.nightCoverage).toBeLessThanOrEqual(100);
    });

    it('recommendations is an array', () => {
      const plan = planMultipleTargets(targets, latitude, longitude);
      expect(Array.isArray(plan.recommendations)).toBe(true);
    });

    it('accepts custom date', () => {
      const date = new Date('2024-06-21T00:00:00Z');
      const plan = planMultipleTargets(targets, latitude, longitude, 30, date);
      expect(plan.targets).toHaveLength(targets.length);
    });

    it('accepts custom minAltitude', () => {
      const plan = planMultipleTargets(targets, latitude, longitude, 45);
      expect(plan.targets).toHaveLength(targets.length);
    });

    it('handles empty array', () => {
      const plan = planMultipleTargets([], latitude, longitude);
      expect(plan.targets).toHaveLength(0);
      expect(plan.totalImagingTime).toBe(0);
    });

    it('handles single target', () => {
      const plan = planMultipleTargets([targets[0]], latitude, longitude);
      expect(plan.targets).toHaveLength(1);
    });
  });

  // ============================================================================
  // optimizeTargetOrder
  // ============================================================================
  describe('optimizeTargetOrder', () => {
    const simpleTargets = [
      { id: 'A', ra: 0, dec: 0 },
      { id: 'B', ra: 90, dec: 0 },
      { id: 'C', ra: 180, dec: 0 },
      { id: 'D', ra: 270, dec: 0 },
    ];

    it('returns same number of targets', () => {
      const result = optimizeTargetOrder(simpleTargets);
      expect(result).toHaveLength(simpleTargets.length);
    });

    it('preserves target IDs', () => {
      const result = optimizeTargetOrder(simpleTargets);
      const resultIds = result.map(t => t.id).sort();
      const originalIds = simpleTargets.map(t => t.id).sort();
      expect(resultIds).toEqual(originalIds);
    });

    it('handles empty array', () => {
      const result = optimizeTargetOrder([]);
      expect(result).toHaveLength(0);
    });

    it('handles single target', () => {
      const result = optimizeTargetOrder([simpleTargets[0]]);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('A');
    });

    it('handles two targets', () => {
      const result = optimizeTargetOrder([simpleTargets[0], simpleTargets[1]]);
      expect(result).toHaveLength(2);
    });

    it('uses start position when provided', () => {
      // Start at RA=180, so C should be first
      const result = optimizeTargetOrder(simpleTargets, 180, 0);
      expect(result[0].id).toBe('C');
    });

    it('finds nearest neighbor path', () => {
      const result = optimizeTargetOrder(simpleTargets, 0, 0);
      // Starting at 0,0, nearest is A, then B (90), then C (180), then D (270)
      expect(result[0].id).toBe('A');
    });
  });

  // ============================================================================
  // estimateSlewTime
  // ============================================================================
  describe('estimateSlewTime', () => {
    const orderedTargets = [
      { ra: 0, dec: 0 },
      { ra: 90, dec: 0 },
      { ra: 180, dec: 0 },
    ];

    it('returns 0 for empty array', () => {
      expect(estimateSlewTime([])).toBe(0);
    });

    it('returns 0 for single target', () => {
      expect(estimateSlewTime([orderedTargets[0]])).toBe(0);
    });

    it('calculates slew time for multiple targets', () => {
      const time = estimateSlewTime(orderedTargets);
      expect(time).toBeGreaterThan(0);
    });

    it('includes settling time', () => {
      const time = estimateSlewTime(orderedTargets);
      // 2 slews, each 90° at 5°/s = 18s each = 36s
      // Plus settling: 2 * 10s = 20s
      // Total ~56s
      expect(time).toBeGreaterThan(50);
    });

    it('uses default slew speed of 5 deg/sec', () => {
      const time = estimateSlewTime(orderedTargets);
      // Two 90° slews + settling
      expect(time).toBeGreaterThan(30);
    });

    it('respects custom slew speed', () => {
      const fast = estimateSlewTime(orderedTargets, 10);
      const slow = estimateSlewTime(orderedTargets, 2);
      
      expect(slow).toBeGreaterThan(fast);
    });

    it('more targets = more slew time', () => {
      const few = estimateSlewTime(orderedTargets.slice(0, 2));
      const many = estimateSlewTime(orderedTargets);
      
      expect(many).toBeGreaterThan(few);
    });
  });
});
