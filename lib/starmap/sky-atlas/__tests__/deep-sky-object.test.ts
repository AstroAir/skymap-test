/**
 * @jest-environment jsdom
 */
import {
  calculateAltitudeData,
  calculateTransitTime,
  calculateMoonDistance,
  calculateImagingScore,
  doesTransitSouth,
  isAboveAltitudeForDuration,
} from '../deep-sky-object';

describe('calculateAltitudeData', () => {
  it('returns altitude data for given coordinates', () => {
    const result = calculateAltitudeData(
      83.82, // M42 RA
      -5.39, // M42 Dec
      40.7128, // New York latitude
      -74.006, // New York longitude
      new Date('2024-01-15T00:00:00Z')
    );

    expect(result).toHaveProperty('points');
    expect(result).toHaveProperty('maxAltitude');
    expect(result).toHaveProperty('maxAltitudeTime');
    expect(result).toHaveProperty('riseTime');
    expect(result).toHaveProperty('setTime');
    expect(result).toHaveProperty('transitTime');
  });

  it('returns array of altitude points', () => {
    const result = calculateAltitudeData(
      83.82,
      -5.39,
      40.7128,
      -74.006,
      new Date('2024-01-15T00:00:00Z')
    );

    expect(Array.isArray(result.points)).toBe(true);
    expect(result.points.length).toBeGreaterThan(0);
  });

  it('each point has required properties', () => {
    const result = calculateAltitudeData(
      83.82,
      -5.39,
      40.7128,
      -74.006,
      new Date('2024-01-15T00:00:00Z')
    );

    result.points.forEach((point) => {
      expect(point).toHaveProperty('time');
      expect(point).toHaveProperty('altitude');
      expect(point).toHaveProperty('azimuth');
      expect(point).toHaveProperty('isAboveHorizon');
    });
  });

  it('max altitude is within valid range', () => {
    const result = calculateAltitudeData(
      83.82,
      -5.39,
      40.7128,
      -74.006,
      new Date('2024-01-15T00:00:00Z')
    );

    expect(result.maxAltitude).toBeGreaterThanOrEqual(-90);
    expect(result.maxAltitude).toBeLessThanOrEqual(90);
  });
});

describe('calculateTransitTime', () => {
  it('returns a Date object', () => {
    const result = calculateTransitTime(
      83.82,
      -74.006,
      new Date('2024-01-15T00:00:00Z')
    );

    expect(result instanceof Date).toBe(true);
  });

  it('returns transit time within 24 hours of reference', () => {
    const refDate = new Date('2024-01-15T00:00:00Z');
    const result = calculateTransitTime(83.82, -74.006, refDate);

    const diffHours = (result.getTime() - refDate.getTime()) / 3600000;
    expect(diffHours).toBeGreaterThanOrEqual(0);
    expect(diffHours).toBeLessThanOrEqual(24);
  });
});

describe('doesTransitSouth', () => {
  it('returns boolean', () => {
    const result = doesTransitSouth(-5.39, 40.7128);
    expect(typeof result).toBe('boolean');
  });

  it('returns true for southern objects from northern hemisphere', () => {
    // Object with negative declination from northern latitude
    const result = doesTransitSouth(-30, 40);
    expect(result).toBe(true);
  });
});

describe('calculateMoonDistance', () => {
  it('returns distance from moon', () => {
    const distance = calculateMoonDistance(
      83.82,
      -5.39,
      new Date('2024-01-15T00:00:00Z')
    );

    expect(typeof distance).toBe('number');
    expect(distance).toBeGreaterThanOrEqual(0);
    expect(distance).toBeLessThanOrEqual(180);
  });
});

describe('calculateImagingScore', () => {
  it('returns imaging score', () => {
    const dso = {
      id: 'M42',
      name: 'Orion Nebula',
      type: 'EmissionNebula' as const,
      constellation: 'Orion',
      ra: 83.82,
      dec: -5.39,
    };

    const score = calculateImagingScore(
      dso,
      40.7128,
      -74.006,
      new Date('2024-01-15T00:00:00Z')
    );

    expect(typeof score).toBe('number');
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe('isAboveAltitudeForDuration', () => {
  it('returns boolean', () => {
    const altitudeData = calculateAltitudeData(
      83.82,
      -5.39,
      40.7128,
      -74.006,
      new Date('2024-01-15T00:00:00Z')
    );

    const result = isAboveAltitudeForDuration(
      altitudeData,
      30, // minimum altitude
      2, // minimum duration hours
      new Date('2024-01-15T00:00:00Z'),
      new Date('2024-01-16T00:00:00Z')
    );

    expect(typeof result).toBe('boolean');
  });

  it('returns false for very high minimum altitude', () => {
    const altitudeData = calculateAltitudeData(
      83.82,
      -5.39,
      40.7128,
      -74.006,
      new Date('2024-01-15T00:00:00Z')
    );

    const result = isAboveAltitudeForDuration(
      altitudeData,
      89, // very high minimum altitude
      2,
      new Date('2024-01-15T00:00:00Z'),
      new Date('2024-01-16T00:00:00Z')
    );

    expect(result).toBe(false);
  });
});
