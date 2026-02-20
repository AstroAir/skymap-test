/**
 * @jest-environment node
 */

import { buildTimeScaleContext, getEopSnapshot, utcJdToTtJd, utcJdToUt1Jd } from '../time-scales';
import { transformCoordinate } from '../pipeline';

describe('time-scales', () => {
  it('builds UTC/UT1/TT context with stable ordering', () => {
    const context = buildTimeScaleContext(new Date('2026-01-01T00:00:00Z'));
    expect(context.jdUt1).toBeCloseTo(utcJdToUt1Jd(context.jdUtc, context.eop.dut1), 10);
    expect(context.jdTt).toBeCloseTo(utcJdToTtJd(context.jdUtc), 10);
    expect(context.jdTt).toBeGreaterThan(context.jdUtc);
  });

  it('returns eop freshness marker', () => {
    const status = getEopSnapshot(new Date('2026-01-15T00:00:00Z'));
    expect(['fresh', 'stale', 'fallback']).toContain(status.freshness);
    expect(typeof status.dut1).toBe('number');
  });
});

describe('coordinate pipeline', () => {
  it('transforms equatorial coordinates with metadata', () => {
    const result = transformCoordinate(
      { raDeg: 10.684, decDeg: 41.269 },
      { latitude: 31.2, longitude: 121.5, fromFrame: 'ICRF', toFrame: 'OBSERVED' }
    );

    expect(result.raDeg).toBeGreaterThanOrEqual(0);
    expect(result.raDeg).toBeLessThan(360);
    expect(result.decDeg).toBeGreaterThanOrEqual(-90);
    expect(result.decDeg).toBeLessThanOrEqual(90);
    expect(result.metadata.frame).toBe('OBSERVED');
    expect(result.metadata.timeScale).toBe('UTC');
  });
});
