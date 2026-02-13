/**
 * Tests for astro-utils.ts (re-export shim)
 *
 * Validates that the backward-compatible re-export shim correctly
 * exposes all functions from the modular subdirectories.
 */

import {
  // Time
  getJulianDateFromDate,
  julianDateToDate,
  getJulianDate,
  // Coordinates
  deg2rad,
  rad2deg,
  getLST,
  raDecToAltAz,
  // Celestial
  getSunPosition,
  getMoonPhase,
  getMoonPhaseName,
  getMoonIllumination,
  getMoonPosition,
  angularSeparation,
  // Twilight
  calculateTwilightTimes,
  // Visibility
  calculateTargetVisibility,
  getAltitudeOverTime,
  getTransitTime,
  getMaxAltitude,
  isCircumpolar,
  neverRises,
  calculateImagingHours,
  // Imaging
  calculateImagingFeasibility,
  calculateExposure,
  calculateTotalIntegration,
  BORTLE_SCALE,
  planMultipleTargets,
  // Formatting
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

// ============================================================================
// Re-export shim validation: ensure all re-exported symbols are accessible
// ============================================================================

describe('re-export shim: time', () => {
  it('getJulianDate returns current JD', () => {
    const jd = getJulianDate();
    expect(jd).toBeGreaterThan(2451545);
  });

  it('deg2rad / rad2deg roundtrip', () => {
    expect(rad2deg(deg2rad(45))).toBeCloseTo(45, 10);
  });

  it('getLST returns a number', () => {
    expect(typeof getLST(0)).toBe('number');
  });

  it('raDecToAltAz returns altitude and azimuth', () => {
    const result = raDecToAltAz(180, 45, 45, 0);
    expect(result).toHaveProperty('altitude');
    expect(result).toHaveProperty('azimuth');
  });
});

describe('re-export shim: twilight', () => {
  it('calculateTwilightTimes returns all required fields', () => {
    const tw = calculateTwilightTimes(45, -75);
    expect(tw).toHaveProperty('sunset');
    expect(tw).toHaveProperty('sunrise');
    expect(tw).toHaveProperty('astronomicalDusk');
    expect(tw).toHaveProperty('astronomicalDawn');
    expect(tw).toHaveProperty('nightDuration');
    expect(tw).toHaveProperty('currentTwilightPhase');
  });
});

describe('re-export shim: visibility', () => {
  it('calculateTargetVisibility returns visibility info', () => {
    const vis = calculateTargetVisibility(180, 45, 45, -75);
    expect(vis).toHaveProperty('transitTime');
    expect(vis).toHaveProperty('transitAltitude');
    expect(vis).toHaveProperty('isCircumpolar');
    expect(vis).toHaveProperty('neverRises');
    expect(vis).toHaveProperty('imagingHours');
  });

  it('getAltitudeOverTime returns array of points', () => {
    const data = getAltitudeOverTime(180, 45, 45, -75, 4, 60);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty('altitude');
    expect(data[0]).toHaveProperty('azimuth');
  });

  it('getTransitTime returns transit info', () => {
    const t = getTransitTime(180, -75);
    expect(t).toHaveProperty('transitLST');
    expect(t).toHaveProperty('hoursUntilTransit');
  });

  it('calculateImagingHours returns 0 for null dark window', () => {
    const points = [{ altitude: 60, time: new Date() }];
    expect(calculateImagingHours({ points }, 30, null, null)).toBe(0);
  });

  it('calculateImagingHours counts points in window', () => {
    const base = new Date('2024-06-15T22:00:00Z');
    const points = [
      { altitude: 60, time: new Date(base.getTime() + 0) },
      { altitude: 55, time: new Date(base.getTime() + 360000) },
      { altitude: 10, time: new Date(base.getTime() + 720000) }, // below minAlt
    ];
    const darkStart = new Date(base.getTime() - 60000);
    const darkEnd = new Date(base.getTime() + 800000);
    const hours = calculateImagingHours({ points }, 30, darkStart, darkEnd);
    expect(hours).toBeCloseTo(0.2, 1); // 2 points × 0.1h
  });
});

describe('re-export shim: imaging', () => {
  it('calculateImagingFeasibility returns score and recommendation', () => {
    const f = calculateImagingFeasibility(180, 45, 45, -75);
    expect(f.score).toBeGreaterThanOrEqual(0);
    expect(f.score).toBeLessThanOrEqual(100);
    expect(['excellent', 'good', 'fair', 'poor', 'not_recommended']).toContain(f.recommendation);
  });

  it('calculateExposure returns exposure recommendations', () => {
    const result = calculateExposure({
      bortle: 5,
      focalLength: 400,
      aperture: 80,
      tracking: 'guided',
    });
    expect(result).toHaveProperty('maxUntracked');
    expect(result).toHaveProperty('recommendedSingle');
    expect(result).toHaveProperty('minForSignal');
  });

  it('calculateTotalIntegration returns time recommendations', () => {
    const result = calculateTotalIntegration({
      bortle: 5,
      targetType: 'nebula',
    });
    expect(result.minimum).toBeGreaterThan(0);
    expect(result.recommended).toBeGreaterThan(result.minimum);
    expect(result.ideal).toBeGreaterThan(result.recommended);
  });

  it('BORTLE_SCALE has 9 entries', () => {
    expect(BORTLE_SCALE).toHaveLength(9);
    expect(BORTLE_SCALE[0].value).toBe(1);
    expect(BORTLE_SCALE[8].value).toBe(9);
  });

  it('planMultipleTargets returns plan structure', () => {
    const targets = [
      { id: '1', name: 'M31', ra: 10.68, dec: 41.27 },
      { id: '2', name: 'M42', ra: 83.82, dec: -5.39 },
    ];
    const plan = planMultipleTargets(targets, 45, -75);
    expect(plan).toHaveProperty('targets');
    expect(plan).toHaveProperty('totalImagingTime');
    expect(plan).toHaveProperty('nightCoverage');
    expect(plan).toHaveProperty('recommendations');
    expect(plan.targets).toHaveLength(2);
  });
});
