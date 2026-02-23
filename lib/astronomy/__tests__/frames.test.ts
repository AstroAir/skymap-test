/**
 * Tests for frames.ts
 * Degree normalization, hour angle normalization, declination clamping,
 * and coordinate metadata creation
 */

import {
  normalizeDegrees,
  normalizeHourAngle,
  clampDeclination,
  createCoordinateMetadata,
} from '../frames';

describe('normalizeDegrees', () => {
  it('should return 0 for 0', () => {
    expect(normalizeDegrees(0)).toBe(0);
  });

  it('should return value as-is for 0 < v < 360', () => {
    expect(normalizeDegrees(180)).toBe(180);
    expect(normalizeDegrees(359.9)).toBeCloseTo(359.9);
  });

  it('should wrap values >= 360', () => {
    expect(normalizeDegrees(360)).toBe(0);
    expect(normalizeDegrees(370)).toBeCloseTo(10);
    expect(normalizeDegrees(720)).toBe(0);
  });

  it('should wrap negative values', () => {
    expect(normalizeDegrees(-10)).toBeCloseTo(350);
    expect(normalizeDegrees(-360)).toBe(0);
    expect(normalizeDegrees(-370)).toBeCloseTo(350);
  });
});

describe('normalizeHourAngle', () => {
  it('should keep values in -180..180 range', () => {
    expect(normalizeHourAngle(0)).toBe(0);
    expect(normalizeHourAngle(90)).toBe(90);
    expect(normalizeHourAngle(180)).toBe(180);
  });

  it('should wrap values > 180 to negative', () => {
    expect(normalizeHourAngle(270)).toBeCloseTo(-90);
    expect(normalizeHourAngle(181)).toBeCloseTo(-179);
  });

  it('should handle negative values', () => {
    expect(normalizeHourAngle(-90)).toBeCloseTo(-90);
    expect(normalizeHourAngle(-270)).toBeCloseTo(90);
  });
});

describe('clampDeclination', () => {
  it('should return value as-is for -90 <= v <= 90', () => {
    expect(clampDeclination(0)).toBe(0);
    expect(clampDeclination(45)).toBe(45);
    expect(clampDeclination(-45)).toBe(-45);
    expect(clampDeclination(90)).toBe(90);
    expect(clampDeclination(-90)).toBe(-90);
  });

  it('should clamp values above 90', () => {
    expect(clampDeclination(95)).toBe(90);
    expect(clampDeclination(180)).toBe(90);
  });

  it('should clamp values below -90', () => {
    expect(clampDeclination(-95)).toBe(-90);
    expect(clampDeclination(-180)).toBe(-90);
  });
});

describe('createCoordinateMetadata', () => {
  it('should create metadata with all provided fields', () => {
    const params = {
      frame: 'ICRF' as const,
      epochJd: 2460000,
      timeScale: 'UTC' as const,
      qualityFlag: 'precise' as const,
      dataFreshness: 'fresh' as const,
      source: 'calculation' as const,
    };
    const result = createCoordinateMetadata(params);
    expect(result.frame).toBe('ICRF');
    expect(result.epochJd).toBe(2460000);
    expect(result.timeScale).toBe('UTC');
    expect(result.qualityFlag).toBe('precise');
    expect(result.dataFreshness).toBe('fresh');
    expect(result.source).toBe('calculation');
    expect(result.generatedAt).toBeDefined();
    // generatedAt should be a valid ISO string
    expect(() => new Date(result.generatedAt)).not.toThrow();
  });
});
