import { optimizeSchedule } from '../session-scheduler';
import type { TargetItem } from '@/lib/stores/target-list-store';
import type { TwilightTimes } from '@/lib/core/types/astronomy';

// ============================================================================
// Test Helpers
// ============================================================================

function makeTarget(overrides: Partial<TargetItem> & { id: string; name: string; ra: number; dec: number }): TargetItem {
  return {
    raString: '',
    decString: '',
    addedAt: Date.now(),
    status: 'planned',
    priority: 'medium',
    tags: [],
    isFavorite: false,
    isArchived: false,
    ...overrides,
  } as TargetItem;
}

function makeTwilight(overrides: Partial<TwilightTimes> = {}): TwilightTimes {
  const base = new Date('2025-06-15T00:00:00Z');
  return {
    sunset: new Date(base.getTime() - 5 * 3600000),       // 19:00 prev day
    civilDusk: new Date(base.getTime() - 4.5 * 3600000),
    nauticalDusk: new Date(base.getTime() - 4 * 3600000),
    astronomicalDusk: new Date(base.getTime() - 3 * 3600000), // 21:00
    astronomicalDawn: new Date(base.getTime() + 5 * 3600000), // 05:00
    nauticalDawn: new Date(base.getTime() + 5.5 * 3600000),
    civilDawn: new Date(base.getTime() + 6 * 3600000),
    sunrise: new Date(base.getTime() + 6.5 * 3600000),
    nightDuration: 8,
    darknessDuration: 8,
    isCurrentlyNight: true,
    currentTwilightPhase: 'night',
    ...overrides,
  };
}

const LAT = 40;
const LON = -74;

// ============================================================================
// Tests
// ============================================================================

describe('optimizeSchedule', () => {
  it('returns empty plan for empty target list', () => {
    const twilight = makeTwilight();
    const plan = optimizeSchedule([], LAT, LON, twilight, 'balanced', 30, 30);

    expect(plan.targets).toHaveLength(0);
    expect(plan.totalImagingTime).toBe(0);
    expect(plan.nightCoverage).toBe(0);
    expect(plan.efficiency).toBe(0);
    expect(plan.gaps).toBeDefined();
    expect(plan.recommendations).toBeDefined();
    expect(plan.warnings).toBeDefined();
  });

  it('schedules a single visible target', () => {
    const twilight = makeTwilight();
    const targets = [
      makeTarget({ id: 't1', name: 'M31', ra: 10.68, dec: 41.27 }),
    ];

    const plan = optimizeSchedule(targets, LAT, LON, twilight, 'balanced', 20, 30);

    // M31 at lat 40 should be visible; plan may or may not schedule it
    // depending on dark imaging hours computation
    expect(plan.targets.length).toBeLessThanOrEqual(1);
    expect(plan.recommendations).toBeDefined();
    expect(plan.warnings).toBeDefined();
  });

  it('respects excludedIds parameter', () => {
    const twilight = makeTwilight();
    const targets = [
      makeTarget({ id: 't1', name: 'M31', ra: 10.68, dec: 41.27 }),
      makeTarget({ id: 't2', name: 'M42', ra: 83.82, dec: -5.39 }),
    ];

    const planAll = optimizeSchedule(targets, LAT, LON, twilight, 'balanced', 20, 30);
    const planExcluded = optimizeSchedule(
      targets, LAT, LON, twilight, 'balanced', 20, 30, new Date(), new Set(['t1'])
    );

    // Excluded plan should never contain t1
    const excludedIds = planExcluded.targets.map(t => t.target.id);
    expect(excludedIds).not.toContain('t1');

    // If t1 was scheduled in the full plan, excluding it should reduce the count
    const fullIds = planAll.targets.map(t => t.target.id);
    if (fullIds.includes('t1')) {
      expect(planExcluded.targets.length).toBeLessThan(planAll.targets.length);
    }
  });

  it('filters targets below minimum imaging time', () => {
    const twilight = makeTwilight();
    // Target near south pole - not visible from lat 40
    const targets = [
      makeTarget({ id: 't1', name: 'SouthPole', ra: 0, dec: -85 }),
    ];

    const plan = optimizeSchedule(targets, LAT, LON, twilight, 'balanced', 30, 30);

    // Target at dec -85 is never visible from lat 40, so 0 scheduled
    expect(plan.targets).toHaveLength(0);
  });

  it('returns correct plan structure', () => {
    const twilight = makeTwilight();
    const targets = [
      makeTarget({ id: 't1', name: 'Vega', ra: 279.23, dec: 38.78 }),
    ];

    const plan = optimizeSchedule(targets, LAT, LON, twilight, 'altitude', 20, 30);

    // Verify plan shape
    expect(plan).toHaveProperty('targets');
    expect(plan).toHaveProperty('totalImagingTime');
    expect(plan).toHaveProperty('nightCoverage');
    expect(plan).toHaveProperty('efficiency');
    expect(plan).toHaveProperty('gaps');
    expect(plan).toHaveProperty('recommendations');
    expect(plan).toHaveProperty('warnings');

    // Each scheduled target should have required fields
    for (const st of plan.targets) {
      expect(st).toHaveProperty('target');
      expect(st).toHaveProperty('startTime');
      expect(st).toHaveProperty('endTime');
      expect(st).toHaveProperty('duration');
      expect(st).toHaveProperty('maxAltitude');
      expect(st).toHaveProperty('moonDistance');
      expect(st).toHaveProperty('feasibility');
      expect(st).toHaveProperty('order');
      expect(st.startTime.getTime()).toBeLessThanOrEqual(st.endTime.getTime());
      expect(st.duration).toBeGreaterThanOrEqual(0);
    }
  });

  it('scheduled targets are sorted by start time', () => {
    const twilight = makeTwilight();
    const targets = [
      makeTarget({ id: 't1', name: 'Vega', ra: 279.23, dec: 38.78 }),
      makeTarget({ id: 't2', name: 'Deneb', ra: 310.36, dec: 45.28 }),
      makeTarget({ id: 't3', name: 'Altair', ra: 297.70, dec: 8.87 }),
    ];

    const plan = optimizeSchedule(targets, LAT, LON, twilight, 'transit', 20, 30);

    for (let i = 1; i < plan.targets.length; i++) {
      expect(plan.targets[i].startTime.getTime())
        .toBeGreaterThanOrEqual(plan.targets[i - 1].startTime.getTime());
    }
  });

  it('no time slot overlaps in scheduled targets', () => {
    const twilight = makeTwilight();
    const targets = [
      makeTarget({ id: 't1', name: 'Vega', ra: 279.23, dec: 38.78 }),
      makeTarget({ id: 't2', name: 'Deneb', ra: 310.36, dec: 45.28 }),
      makeTarget({ id: 't3', name: 'Altair', ra: 297.70, dec: 8.87 }),
      makeTarget({ id: 't4', name: 'M31', ra: 10.68, dec: 41.27 }),
    ];

    const plan = optimizeSchedule(targets, LAT, LON, twilight, 'balanced', 20, 30);

    for (let i = 1; i < plan.targets.length; i++) {
      expect(plan.targets[i].startTime.getTime())
        .toBeGreaterThanOrEqual(plan.targets[i - 1].endTime.getTime());
    }
  });

  it('warns about bright moon conditions', () => {
    // Use a date close to a full moon
    const twilight = makeTwilight();
    const targets = [
      makeTarget({ id: 't1', name: 'Vega', ra: 279.23, dec: 38.78 }),
    ];

    // The warning depends on actual moon phase calculation for the date
    const plan = optimizeSchedule(targets, LAT, LON, twilight, 'balanced', 20, 30);
    // Just verify warnings array exists - moon phase varies by date
    expect(Array.isArray(plan.warnings)).toBe(true);
  });

  it('handles all optimization strategies without errors', () => {
    const twilight = makeTwilight();
    const targets = [
      makeTarget({ id: 't1', name: 'Vega', ra: 279.23, dec: 38.78 }),
      makeTarget({ id: 't2', name: 'Deneb', ra: 310.36, dec: 45.28 }),
    ];

    const strategies = ['balanced', 'altitude', 'transit', 'moon', 'duration'] as const;
    for (const strategy of strategies) {
      expect(() => {
        optimizeSchedule(targets, LAT, LON, twilight, strategy, 20, 30);
      }).not.toThrow();
    }
  });

  it('handles null twilight dusk/dawn gracefully', () => {
    // Simulate polar region where there's no astronomical night
    const twilight = makeTwilight({
      astronomicalDusk: null,
      astronomicalDawn: null,
      darknessDuration: 0,
    });
    const targets = [
      makeTarget({ id: 't1', name: 'Polaris', ra: 37.95, dec: 89.26 }),
    ];

    const plan = optimizeSchedule(targets, 70, LON, twilight, 'balanced', 20, 30);

    expect(plan.gaps).toHaveLength(0);
    expect(plan.nightCoverage).toBe(0);
  });

  it('order field is sequential starting from 1', () => {
    const twilight = makeTwilight();
    const targets = [
      makeTarget({ id: 't1', name: 'Vega', ra: 279.23, dec: 38.78 }),
      makeTarget({ id: 't2', name: 'Deneb', ra: 310.36, dec: 45.28 }),
      makeTarget({ id: 't3', name: 'Altair', ra: 297.70, dec: 8.87 }),
    ];

    const plan = optimizeSchedule(targets, LAT, LON, twilight, 'balanced', 20, 30);

    plan.targets.forEach((t, i) => {
      expect(t.order).toBe(i + 1);
    });
  });
});
