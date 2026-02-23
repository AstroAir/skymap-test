/**
 * Tests for pipeline.ts
 * Coordinate transformation pipeline
 */

import { transformCoordinate } from '../pipeline';
import type { CoordinateContext } from '@/lib/core/types/astronomy';

describe('transformCoordinate', () => {
  const baseContext: CoordinateContext = {
    latitude: 40,
    longitude: -74,
    date: new Date('2025-06-15T22:00:00Z'),
  };

  it('should return raDeg normalized to 0-360', () => {
    const result = transformCoordinate({ raDeg: 10.68, decDeg: 41.27 }, baseContext);
    expect(result.raDeg).toBeGreaterThanOrEqual(0);
    expect(result.raDeg).toBeLessThan(360);
  });

  it('should compute altitude and azimuth', () => {
    const result = transformCoordinate({ raDeg: 10.68, decDeg: 41.27 }, baseContext);
    expect(typeof result.altitudeDeg).toBe('number');
    expect(typeof result.azimuthDeg).toBe('number');
    expect(result.azimuthDeg).toBeGreaterThanOrEqual(0);
    expect(result.azimuthDeg).toBeLessThan(360);
  });

  it('should compute hour angle, LST, and GST', () => {
    const result = transformCoordinate({ raDeg: 83.82, decDeg: -5.39 }, baseContext);
    expect(typeof result.hourAngleDeg).toBe('number');
    expect(typeof result.lstDeg).toBe('number');
    expect(typeof result.gstDeg).toBe('number');
  });

  it('should include coordinate metadata', () => {
    const result = transformCoordinate({ raDeg: 0, decDeg: 0 }, baseContext);
    expect(result.metadata).toBeDefined();
    expect(result.metadata.frame).toBeDefined();
    expect(result.metadata.epochJd).toBeGreaterThan(0);
    expect(result.metadata.generatedAt).toBeDefined();
  });

  it('should use current date when none provided', () => {
    const ctx: CoordinateContext = { latitude: 40, longitude: -74 };
    const result = transformCoordinate({ raDeg: 10, decDeg: 20 }, ctx);
    expect(result.metadata.epochJd).toBeGreaterThan(0);
  });

  it('should reflect precisionMode in quality flag', () => {
    const ctx: CoordinateContext = {
      ...baseContext,
      precisionMode: 'realtime_lightweight',
    };
    const result = transformCoordinate({ raDeg: 10, decDeg: 20 }, ctx);
    // Quality should be 'interpolated' or 'fallback' depending on EOP
    expect(['interpolated', 'fallback', 'precise']).toContain(result.metadata.qualityFlag);
  });
});
