/**
 * Tests for mount-simulator.ts
 * Mount sequence simulation including slew events, meridian flips, and cable wrap
 */

import { simulateSequence, type SimulationTarget } from '../mount-simulator';
import type { MountSafetyConfig } from '../mount-safety';

const defaultConfig: MountSafetyConfig = {
  mountType: 'gem',
  hourAngleLimitEast: -90,
  hourAngleLimitWest: 90,
  declinationLimitMin: -85,
  declinationLimitMax: 85,
  minAltitude: 15,
  meridianFlip: {
    enabled: true,
    minutesAfterMeridian: 5,
    maxMinutesAfterMeridian: 15,
    pauseBeforeMeridian: 0,
  },
  telescopeLength: 500,
  counterweightBarLength: 300,
};

const latitude = 40;
const longitude = -74;

function makeTarget(
  id: string,
  name: string,
  ra: number,
  dec: number,
  startHoursFromNow: number,
  durationHours: number
): SimulationTarget {
  const now = new Date('2025-06-15T22:00:00Z');
  const start = new Date(now.getTime() + startHoursFromNow * 3600000);
  const end = new Date(start.getTime() + durationHours * 3600000);
  return { id, name, ra, dec, startTime: start, endTime: end };
}

describe('simulateSequence', () => {
  it('should return empty result for no targets', () => {
    const result = simulateSequence([], defaultConfig, latitude, longitude);
    expect(result.targets).toHaveLength(0);
    expect(result.slews).toHaveLength(0);
    expect(result.overallSafe).toBe(true);
    expect(result.totalMeridianFlips).toBe(0);
    expect(result.totalSlewTime).toBe(0);
    expect(result.cumulativeRotation).toBe(0);
    expect(result.cableWrapRisk).toBe(false);
    expect(result.summary).toEqual({ safe: 0, warnings: 0, dangers: 0 });
  });

  it('should check single target safety', () => {
    const targets = [makeTarget('t1', 'M31', 10.68, 41.27, 0, 2)];
    const result = simulateSequence(targets, defaultConfig, latitude, longitude);
    expect(result.targets).toHaveLength(1);
    expect(result.slews).toHaveLength(0);
  });

  it('should generate slew events between consecutive targets', () => {
    const targets = [
      makeTarget('t1', 'M31', 10.68, 41.27, 0, 1),
      makeTarget('t2', 'M42', 83.82, -5.39, 1.5, 1),
    ];
    const result = simulateSequence(targets, defaultConfig, latitude, longitude);
    expect(result.targets).toHaveLength(2);
    expect(result.slews).toHaveLength(1);
    expect(result.slews[0].fromTargetName).toBe('M31');
    expect(result.slews[0].toTargetName).toBe('M42');
    expect(result.slews[0].totalAngle).toBeGreaterThan(0);
    expect(result.slews[0].estimatedDuration).toBeGreaterThan(0);
  });

  it('should sort targets by start time', () => {
    const targets = [
      makeTarget('t2', 'M42', 83.82, -5.39, 2, 1),
      makeTarget('t1', 'M31', 10.68, 41.27, 0, 1),
    ];
    const result = simulateSequence(targets, defaultConfig, latitude, longitude);
    // First checked target should be the earlier one
    expect(result.targets[0].targetName).toBe('M31');
  });

  it('should calculate total slew time', () => {
    const targets = [
      makeTarget('t1', 'M31', 10.68, 41.27, 0, 1),
      makeTarget('t2', 'M42', 83.82, -5.39, 1.5, 1),
      makeTarget('t3', 'M45', 56.75, 24.12, 3, 1),
    ];
    const result = simulateSequence(targets, defaultConfig, latitude, longitude);
    expect(result.totalSlewTime).toBeGreaterThan(0);
    expect(result.slews).toHaveLength(2);
  });

  it('should compute summary counts', () => {
    const targets = [makeTarget('t1', 'M31', 10.68, 41.27, 0, 2)];
    const result = simulateSequence(targets, defaultConfig, latitude, longitude);
    expect(result.summary).toBeDefined();
    expect(typeof result.summary.safe).toBe('number');
    expect(typeof result.summary.warnings).toBe('number');
    expect(typeof result.summary.dangers).toBe('number');
  });

  it('should handle altaz mount type (no meridian flips)', () => {
    const altazConfig: MountSafetyConfig = { ...defaultConfig, mountType: 'altaz' };
    const targets = [
      makeTarget('t1', 'East', 0, 45, 0, 1),
      makeTarget('t2', 'West', 180, 45, 1.5, 1),
    ];
    const result = simulateSequence(targets, altazConfig, latitude, longitude);
    // Altaz mounts don't do meridian flips in slews
    const slewFlips = result.slews.filter(s => s.hasMeridianFlip);
    expect(slewFlips).toHaveLength(0);
  });
});
