/**
 * Tests for format-coords.ts
 * RA/Dec formatting and ClickCoords building
 */

import { formatRaString, formatDecString, buildClickCoords } from '../format-coords';

describe('formatRaString', () => {
  it('should format 0° as 0h 0m 0.0s', () => {
    expect(formatRaString(0)).toBe('0h 0m 0.0s');
  });

  it('should format 90° as 6h 0m 0.0s', () => {
    expect(formatRaString(90)).toBe('6h 0m 0.0s');
  });

  it('should format fractional RA correctly', () => {
    const result = formatRaString(10.68);
    expect(result).toMatch(/^0h 42m/);
  });
});

describe('formatDecString', () => {
  it('should format 0° as +0° 0\' 0.0"', () => {
    expect(formatDecString(0)).toBe('+0° 0\' 0.0"');
  });

  it('should format positive declination with + sign', () => {
    const result = formatDecString(41.27);
    expect(result).toMatch(/^\+41°/);
  });

  it('should format negative declination with - sign', () => {
    const result = formatDecString(-5.39);
    expect(result).toMatch(/^-5°/);
  });
});

describe('buildClickCoords', () => {
  it('should build a ClickCoords object with ra, dec, raStr, decStr', () => {
    const result = buildClickCoords(10.68, 41.27);
    expect(result.ra).toBe(10.68);
    expect(result.dec).toBe(41.27);
    expect(typeof result.raStr).toBe('string');
    expect(typeof result.decStr).toBe('string');
    expect(result.raStr.length).toBeGreaterThan(0);
    expect(result.decStr.length).toBeGreaterThan(0);
  });
});
