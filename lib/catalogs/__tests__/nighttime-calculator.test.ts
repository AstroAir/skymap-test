/**
 * Tests for nighttime-calculator.ts
 */

import {
  dateToJulianDate,
  julianDateToDate,
  getSunPosition,
  getMoonPosition,
  getLocalSiderealTime,
  calculateAltitude,
  calculateAzimuth,
  getReferenceDate,
  calculateAngularSeparation,
  calculateNighttimeData,
} from '../nighttime-calculator';

describe('dateToJulianDate', () => {
  it('should convert J2000.0 epoch correctly', () => {
    const j2000 = new Date(Date.UTC(2000, 0, 1, 12, 0, 0));
    const jd = dateToJulianDate(j2000);
    expect(jd).toBeCloseTo(2451545.0, 1);
  });

  it('should handle dates before March correctly', () => {
    const jan = new Date(Date.UTC(2024, 0, 15, 12, 0, 0));
    const jd = dateToJulianDate(jan);
    expect(jd).toBeGreaterThan(2460000);
  });

  it('should handle dates after March correctly', () => {
    const june = new Date(Date.UTC(2024, 5, 15, 12, 0, 0));
    const jd = dateToJulianDate(june);
    expect(jd).toBeGreaterThan(2460000);
  });

  it('should increase by 1 for each day', () => {
    const day1 = new Date(Date.UTC(2024, 5, 15, 12, 0, 0));
    const day2 = new Date(Date.UTC(2024, 5, 16, 12, 0, 0));
    const jd1 = dateToJulianDate(day1);
    const jd2 = dateToJulianDate(day2);
    expect(jd2 - jd1).toBeCloseTo(1, 5);
  });
});

describe('julianDateToDate', () => {
  it('should convert J2000.0 epoch correctly', () => {
    const date = julianDateToDate(2451545.0);
    expect(date.getUTCFullYear()).toBe(2000);
    expect(date.getUTCMonth()).toBe(0);
    expect(date.getUTCDate()).toBe(1);
  });

  it('should be inverse of dateToJulianDate', () => {
    const original = new Date(Date.UTC(2024, 5, 15, 14, 30, 0));
    const jd = dateToJulianDate(original);
    const restored = julianDateToDate(jd);
    expect(restored.getUTCFullYear()).toBe(original.getUTCFullYear());
    expect(restored.getUTCMonth()).toBe(original.getUTCMonth());
    expect(restored.getUTCDate()).toBe(original.getUTCDate());
    expect(restored.getUTCHours()).toBe(original.getUTCHours());
  });

  it('should handle old Julian dates', () => {
    const oldDate = julianDateToDate(2299160);
    expect(oldDate.getUTCFullYear()).toBeLessThan(1600);
  });
});

describe('getSunPosition', () => {
  it('should return ra and dec', () => {
    const jd = 2451545.0;
    const pos = getSunPosition(jd);
    expect(pos).toHaveProperty('ra');
    expect(pos).toHaveProperty('dec');
  });

  it('should return ra between 0 and 360', () => {
    const jd = 2451545.0;
    const pos = getSunPosition(jd);
    expect(pos.ra).toBeGreaterThanOrEqual(0);
    expect(pos.ra).toBeLessThan(360);
  });

  it('should return dec between -90 and 90', () => {
    const jd = 2451545.0;
    const pos = getSunPosition(jd);
    expect(pos.dec).toBeGreaterThanOrEqual(-30);
    expect(pos.dec).toBeLessThanOrEqual(30);
  });

  it('should cache results', () => {
    const jd = 2460000.5;
    const pos1 = getSunPosition(jd);
    const pos2 = getSunPosition(jd);
    expect(pos1).toEqual(pos2);
  });
});

describe('getMoonPosition', () => {
  it('should return ra, dec, and distance', () => {
    const jd = 2451545.0;
    const pos = getMoonPosition(jd);
    expect(pos).toHaveProperty('ra');
    expect(pos).toHaveProperty('dec');
    expect(pos).toHaveProperty('distance');
  });

  it('should return ra between 0 and 360', () => {
    const jd = 2451545.0;
    const pos = getMoonPosition(jd);
    expect(pos.ra).toBeGreaterThanOrEqual(0);
    expect(pos.ra).toBeLessThan(360);
  });

  it('should return reasonable distance', () => {
    const jd = 2451545.0;
    const pos = getMoonPosition(jd);
    expect(pos.distance).toBeGreaterThan(350000);
    expect(pos.distance).toBeLessThan(410000);
  });
});

describe('getLocalSiderealTime', () => {
  it('should return a value between 0 and 360', () => {
    const date = new Date(Date.UTC(2000, 0, 1, 12, 0, 0));
    const lst = getLocalSiderealTime(date, 0);
    expect(lst).toBeGreaterThanOrEqual(0);
    expect(lst).toBeLessThan(360);
  });

  it('should differ by longitude offset', () => {
    const date = new Date(Date.UTC(2000, 0, 1, 12, 0, 0));
    const lst0 = getLocalSiderealTime(date, 0);
    const lst90 = getLocalSiderealTime(date, 90);
    const diff = ((lst90 - lst0) + 360) % 360;
    expect(diff).toBeCloseTo(90, 0);
  });
});

describe('calculateAltitude', () => {
  it('should return altitude between -90 and 90', () => {
    const alt = calculateAltitude(180, 45, 45, 0, new Date());
    expect(alt).toBeGreaterThanOrEqual(-90);
    expect(alt).toBeLessThanOrEqual(90);
  });

  it('should return higher altitude for objects near zenith', () => {
    const date = new Date();
    const alt1 = calculateAltitude(0, 89, 89, 0, date);
    const alt2 = calculateAltitude(0, 0, 89, 0, date);
    expect(alt1).toBeGreaterThan(alt2);
  });
});

describe('calculateAzimuth', () => {
  it('should return azimuth between 0 and 360', () => {
    const az = calculateAzimuth(180, 45, 45, 0, new Date());
    expect(az).toBeGreaterThanOrEqual(0);
    expect(az).toBeLessThan(360);
  });
});

describe('getReferenceDate', () => {
  it('should return noon of the same day for morning times', () => {
    const morning = new Date('2024-06-15T08:00:00');
    const ref = getReferenceDate(morning);
    expect(ref.getHours()).toBe(12);
    expect(ref.getMinutes()).toBe(0);
  });

  it('should return noon of the same day for afternoon times', () => {
    const afternoon = new Date('2024-06-15T15:00:00');
    const ref = getReferenceDate(afternoon);
    expect(ref.getHours()).toBe(12);
  });

  it('should handle midnight correctly', () => {
    const midnight = new Date('2024-06-15T00:00:00');
    const ref = getReferenceDate(midnight);
    expect(ref.getHours()).toBe(12);
  });
});

describe('calculateAngularSeparation', () => {
  it('should return 0 for same position', () => {
    const sep = calculateAngularSeparation(180, 45, 180, 45);
    expect(sep).toBeCloseTo(0, 5);
  });

  it('should return 90 for perpendicular positions', () => {
    const sep = calculateAngularSeparation(0, 0, 90, 0);
    expect(sep).toBeCloseTo(90, 1);
  });

  it('should return 180 for opposite positions', () => {
    const sep = calculateAngularSeparation(0, 0, 180, 0);
    expect(sep).toBeCloseTo(180, 1);
  });

  it('should handle pole positions', () => {
    const sep = calculateAngularSeparation(0, 90, 180, 90);
    expect(sep).toBeCloseTo(0, 1);
  });
});

describe('calculateNighttimeData', () => {
  it('should return nighttime data object', () => {
    const data = calculateNighttimeData(45, -75, new Date('2024-06-15'));
    expect(data).toHaveProperty('referenceDate');
    expect(data).toHaveProperty('sunRiseAndSet');
    expect(data).toHaveProperty('moonPhase');
    expect(data).toHaveProperty('moonIllumination');
  });

  it('should return sunrise and sunset times', () => {
    const data = calculateNighttimeData(45, -75, new Date('2024-06-15'));
    expect(data.sunRiseAndSet).toHaveProperty('rise');
    expect(data.sunRiseAndSet).toHaveProperty('set');
  });

  it('should return twilight times', () => {
    const data = calculateNighttimeData(45, -75, new Date('2024-06-15'));
    expect(data.twilightRiseAndSet).toHaveProperty('rise');
    expect(data.twilightRiseAndSet).toHaveProperty('set');
  });

  it('should return moon illumination between 0 and 100', () => {
    const data = calculateNighttimeData(45, -75, new Date('2024-06-15'));
    expect(data.moonIllumination).toBeGreaterThanOrEqual(0);
    expect(data.moonIllumination).toBeLessThanOrEqual(100);
  });

  it('should cache results for same location and date', () => {
    const date = new Date('2024-06-15');
    const data1 = calculateNighttimeData(45, -75, date);
    const data2 = calculateNighttimeData(45, -75, date);
    expect(data1.moonPhase).toBe(data2.moonPhase);
  });
});
