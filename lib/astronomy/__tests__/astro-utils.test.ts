/**
 * Tests for astro-utils.ts
 */

import {
  getJulianDateFromDate,
  julianDateToDate,
  getSunPosition,
  getMoonPhase,
  getMoonPhaseName,
  getMoonIllumination,
  getMoonPosition,
  angularSeparation,
  getMaxAltitude,
  isCircumpolar,
  neverRises,
  formatTimeShort,
  formatDuration,
} from '../astro-utils';

describe('getJulianDateFromDate', () => {
  it('should return J2000.0 epoch correctly', () => {
    const j2000 = new Date(Date.UTC(2000, 0, 1, 12, 0, 0));
    const jd = getJulianDateFromDate(j2000);
    expect(jd).toBeCloseTo(2451545.0, 1);
  });

  it('should handle dates in January/February', () => {
    const jan = new Date(Date.UTC(2024, 0, 15, 12, 0, 0));
    const jd = getJulianDateFromDate(jan);
    expect(jd).toBeGreaterThan(2460000);
  });

  it('should increase by 1 for each day', () => {
    const day1 = new Date(Date.UTC(2024, 5, 15, 12, 0, 0));
    const day2 = new Date(Date.UTC(2024, 5, 16, 12, 0, 0));
    expect(getJulianDateFromDate(day2) - getJulianDateFromDate(day1)).toBeCloseTo(1, 5);
  });
});

describe('julianDateToDate', () => {
  it('should convert J2000.0 correctly', () => {
    const date = julianDateToDate(2451545.0);
    expect(date.getUTCFullYear()).toBe(2000);
    expect(date.getUTCMonth()).toBe(0);
    expect(date.getUTCDate()).toBe(1);
  });

  it('should be inverse of getJulianDateFromDate', () => {
    const original = new Date(Date.UTC(2024, 5, 15, 14, 30, 0));
    const jd = getJulianDateFromDate(original);
    const restored = julianDateToDate(jd);
    expect(restored.getUTCFullYear()).toBe(original.getUTCFullYear());
    expect(restored.getUTCMonth()).toBe(original.getUTCMonth());
  });
});

describe('getSunPosition', () => {
  it('should return ra and dec', () => {
    const pos = getSunPosition();
    expect(pos).toHaveProperty('ra');
    expect(pos).toHaveProperty('dec');
  });

  it('should return ra between 0 and 360', () => {
    const pos = getSunPosition();
    expect(pos.ra).toBeGreaterThanOrEqual(0);
    expect(pos.ra).toBeLessThan(360);
  });

  it('should return dec between -24 and 24', () => {
    const pos = getSunPosition();
    expect(pos.dec).toBeGreaterThanOrEqual(-24);
    expect(pos.dec).toBeLessThanOrEqual(24);
  });

  it('should accept optional jd parameter', () => {
    const pos = getSunPosition(2451545.0);
    expect(pos).toHaveProperty('ra');
    expect(pos).toHaveProperty('dec');
  });
});

describe('getMoonPhase', () => {
  it('should return value between 0 and 1', () => {
    const phase = getMoonPhase();
    expect(phase).toBeGreaterThanOrEqual(0);
    expect(phase).toBeLessThanOrEqual(1);
  });

  it('should accept optional jd parameter', () => {
    const phase = getMoonPhase(2451545.0);
    expect(phase).toBeGreaterThanOrEqual(0);
    expect(phase).toBeLessThanOrEqual(1);
  });
});

describe('getMoonPhaseName', () => {
  it('should return New Moon for phase ~0', () => {
    expect(getMoonPhaseName(0)).toBe('New Moon');
    expect(getMoonPhaseName(0.99)).toBe('New Moon');
  });

  it('should return First Quarter for phase ~0.25', () => {
    expect(getMoonPhaseName(0.25)).toBe('First Quarter');
  });

  it('should return Full Moon for phase ~0.5', () => {
    expect(getMoonPhaseName(0.5)).toBe('Full Moon');
  });

  it('should return Last Quarter for phase ~0.75', () => {
    expect(getMoonPhaseName(0.75)).toBe('Last Quarter');
  });
});

describe('getMoonIllumination', () => {
  it('should return 0% for new moon', () => {
    expect(getMoonIllumination(0)).toBe(0);
  });

  it('should return 100% for full moon', () => {
    expect(getMoonIllumination(0.5)).toBe(100);
  });

  it('should return ~50% for quarter moon', () => {
    const illum = getMoonIllumination(0.25);
    expect(illum).toBeGreaterThan(40);
    expect(illum).toBeLessThan(60);
  });
});

describe('getMoonPosition', () => {
  it('should return ra, dec', () => {
    const pos = getMoonPosition();
    expect(pos).toHaveProperty('ra');
    expect(pos).toHaveProperty('dec');
  });

  it('should return ra between 0 and 360', () => {
    const pos = getMoonPosition();
    expect(pos.ra).toBeGreaterThanOrEqual(0);
    expect(pos.ra).toBeLessThan(360);
  });
});

describe('angularSeparation', () => {
  it('should return 0 for same position', () => {
    const sep = angularSeparation(180, 45, 180, 45);
    expect(sep).toBeCloseTo(0, 5);
  });

  it('should return 90 for perpendicular positions', () => {
    const sep = angularSeparation(0, 0, 90, 0);
    expect(sep).toBeCloseTo(90, 1);
  });

  it('should return 180 for opposite positions', () => {
    const sep = angularSeparation(0, 0, 180, 0);
    expect(sep).toBeCloseTo(180, 1);
  });
});

describe('getMaxAltitude', () => {
  it('should return 90 for object at same dec as latitude', () => {
    expect(getMaxAltitude(45, 45)).toBe(90);
  });

  it('should decrease with dec difference', () => {
    const alt1 = getMaxAltitude(45, 45);
    const alt2 = getMaxAltitude(30, 45);
    expect(alt1).toBeGreaterThan(alt2);
  });
});

describe('isCircumpolar', () => {
  it('should return true for Polaris at mid-latitudes', () => {
    expect(isCircumpolar(89, 45)).toBe(true);
  });

  it('should return false for equatorial objects at mid-latitudes', () => {
    expect(isCircumpolar(0, 45)).toBe(false);
  });
});

describe('neverRises', () => {
  it('should return true for southern objects at northern latitudes', () => {
    expect(neverRises(-80, 45)).toBe(true);
  });

  it('should return false for equatorial objects', () => {
    expect(neverRises(0, 45)).toBe(false);
  });
});

describe('formatTimeShort', () => {
  it('should format date as HH:MM', () => {
    const date = new Date('2024-06-15T14:30:00');
    const result = formatTimeShort(date);
    expect(result).toMatch(/14:30/);
  });

  it('should return --:-- for null', () => {
    expect(formatTimeShort(null)).toBe('--:--');
  });
});

describe('formatDuration', () => {
  it('should format hours and minutes', () => {
    expect(formatDuration(2.5)).toMatch(/2.*30/);
  });

  it('should return 0m for 0 hours', () => {
    expect(formatDuration(0)).toBe('0m');
  });

  it('should handle negative values', () => {
    expect(formatDuration(-1)).toBe('0m');
  });
});
