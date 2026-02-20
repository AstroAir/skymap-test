import { optimizeScheduleV2 } from '../session-scheduler-v2';
import type { TargetItem } from '@/lib/stores/target-list-store';
import type { TwilightTimes } from '@/lib/core/types/astronomy';
import type { SessionConstraintSet } from '@/types/starmap/session-planner-v2';

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
    sunset: new Date(base.getTime() - 5 * 3600000),
    civilDusk: new Date(base.getTime() - 4.5 * 3600000),
    nauticalDusk: new Date(base.getTime() - 4 * 3600000),
    astronomicalDusk: new Date(base.getTime() - 3 * 3600000),
    astronomicalDawn: new Date(base.getTime() + 5 * 3600000),
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
const PLAN_DATE = new Date('2025-06-15T00:00:00Z');

const constraints: SessionConstraintSet = {
  minAltitude: 20,
  minImagingTime: 30,
  minMoonDistance: 20,
  weatherLimits: {
    maxCloudCover: 70,
    maxHumidity: 90,
    maxWindSpeed: 25,
  },
};

describe('optimizeScheduleV2', () => {
  it('applies manual schedule edits and lock-friendly timing', () => {
    const targets = [
      makeTarget({ id: 't1', name: 'M31', ra: 10.68, dec: 41.27 }),
    ];

    const plan = optimizeScheduleV2(
      targets,
      LAT,
      LON,
      makeTwilight(),
      'balanced',
      constraints,
      PLAN_DATE,
      new Set(),
      [{ targetId: 't1', startTime: '22:00', durationMinutes: 90, locked: true }],
    );

    expect(plan.targets).toHaveLength(1);
    expect(plan.targets[0].target.id).toBe('t1');
    expect(plan.targets[0].startTime.getHours()).toBe(22);
    expect(Math.round(plan.targets[0].duration * 60)).toBe(90);
  });

  it('emits overlap conflicts for manual overlaps', () => {
    const targets = [
      makeTarget({ id: 't1', name: 'M31', ra: 10.68, dec: 41.27 }),
      makeTarget({ id: 't2', name: 'M42', ra: 83.82, dec: -5.39 }),
    ];

    const plan = optimizeScheduleV2(
      targets,
      LAT,
      LON,
      makeTwilight(),
      'balanced',
      constraints,
      PLAN_DATE,
      new Set(),
      [
        { targetId: 't1', startTime: '21:00', durationMinutes: 120, locked: true },
        { targetId: 't2', startTime: '22:00', durationMinutes: 120, locked: true },
      ],
    );

    expect(plan.conflicts.some((conflict) => conflict.type === 'overlap')).toBe(true);
  });

  it('adds weather conflicts and weather warning when exceeding limits', () => {
    const targets = [
      makeTarget({ id: 't1', name: 'M31', ra: 10.68, dec: 41.27 }),
    ];

    const plan = optimizeScheduleV2(
      targets,
      LAT,
      LON,
      makeTwilight(),
      'balanced',
      constraints,
      PLAN_DATE,
      new Set(),
      [{ targetId: 't1', startTime: '22:00', durationMinutes: 90, locked: true }],
      {
        cloudCover: 95,
        humidity: 85,
        windSpeed: 10,
        source: 'manual',
        capturedAt: PLAN_DATE.toISOString(),
      },
    );

    expect(plan.conflicts.some((conflict) => conflict.type === 'weather')).toBe(true);
    expect(plan.warnings.some((warning) => warning.key === 'planRec.weatherNotIdeal')).toBe(true);
  });
});
