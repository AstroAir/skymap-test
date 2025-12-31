/**
 * Tests for starmap-utils coordinate conversion and astronomical utilities
 */

import {
  degreesToHMS,
  degreesToDMS,
  hmsToDegrees,
  dmsToDegrees,
  rad2deg,
  deg2rad,
  utcToMJD,
  mjdToUTC,
  formatTime,
  getJulianDate,
  getGST,
  getLST,
  raDecToAltAz,
  altAzToRaDec,
  formatDateForInput,
  formatTimeForInput,
  wait,
} from '../starmap-utils';

describe('degreesToHMS', () => {
  it('should convert 0 degrees to 0:00:00.0', () => {
    expect(degreesToHMS(0)).toBe('0:00:00.0');
  });

  it('should convert 90 degrees to 6:00:00.0', () => {
    expect(degreesToHMS(90)).toBe('6:00:00.0');
  });

  it('should convert 180 degrees to 12:00:00.0', () => {
    expect(degreesToHMS(180)).toBe('12:00:00.0');
  });

  it('should convert 270 degrees to 18:00:00.0', () => {
    expect(degreesToHMS(270)).toBe('18:00:00.0');
  });

  it('should convert 15 degrees to 1:00:00.0', () => {
    expect(degreesToHMS(15)).toBe('1:00:00.0');
  });

  it('should handle fractional degrees', () => {
    const result = degreesToHMS(15.5);
    expect(result).toMatch(/^1:02:/);
  });
});

describe('degreesToDMS', () => {
  it('should convert 0 degrees to +00:00:00.0', () => {
    expect(degreesToDMS(0)).toBe('+00:00:00.0');
  });

  it('should convert positive degrees correctly', () => {
    expect(degreesToDMS(45)).toBe('+45:00:00.0');
  });

  it('should convert negative degrees correctly', () => {
    expect(degreesToDMS(-45)).toBe('-45:00:00.0');
  });

  it('should handle fractional degrees', () => {
    const result = degreesToDMS(45.5);
    expect(result).toMatch(/^\+45:30:/);
  });

  it('should handle small negative values', () => {
    const result = degreesToDMS(-0.5);
    expect(result).toMatch(/^-00:30:/);
  });
});

describe('hmsToDegrees', () => {
  it('should convert 0:00:00 to 0 degrees', () => {
    expect(hmsToDegrees('0:00:00')).toBe(0);
  });

  it('should convert 6:00:00 to 90 degrees', () => {
    expect(hmsToDegrees('6:00:00')).toBe(90);
  });

  it('should convert 12:00:00 to 180 degrees', () => {
    expect(hmsToDegrees('12:00:00')).toBe(180);
  });

  it('should convert 1:00:00 to 15 degrees', () => {
    expect(hmsToDegrees('1:00:00')).toBe(15);
  });

  it('should handle seconds', () => {
    const result = hmsToDegrees('0:00:60');
    expect(result).toBeCloseTo(0.25, 2);
  });
});

describe('dmsToDegrees', () => {
  it('should convert +00:00:00 to 0 degrees', () => {
    expect(dmsToDegrees('+00:00:00')).toBe(0);
  });

  it('should convert +45:00:00 to 45 degrees', () => {
    expect(dmsToDegrees('+45:00:00')).toBe(45);
  });

  it('should convert -45:00:00 to -45 degrees', () => {
    expect(dmsToDegrees('-45:00:00')).toBe(-45);
  });

  it('should handle minutes', () => {
    const result = dmsToDegrees('+00:30:00');
    expect(result).toBeCloseTo(0.5, 5);
  });

  it('should handle seconds', () => {
    const result = dmsToDegrees('+00:00:36');
    expect(result).toBeCloseTo(0.01, 5);
  });
});

describe('rad2deg', () => {
  it('should convert 0 radians to 0 degrees', () => {
    expect(rad2deg(0)).toBe(0);
  });

  it('should convert PI radians to 180 degrees', () => {
    expect(rad2deg(Math.PI)).toBeCloseTo(180, 5);
  });

  it('should convert PI/2 radians to 90 degrees', () => {
    expect(rad2deg(Math.PI / 2)).toBeCloseTo(90, 5);
  });

  it('should convert 2*PI radians to 360 degrees', () => {
    expect(rad2deg(2 * Math.PI)).toBeCloseTo(360, 5);
  });
});

describe('deg2rad', () => {
  it('should convert 0 degrees to 0 radians', () => {
    expect(deg2rad(0)).toBe(0);
  });

  it('should convert 180 degrees to PI radians', () => {
    expect(deg2rad(180)).toBeCloseTo(Math.PI, 5);
  });

  it('should convert 90 degrees to PI/2 radians', () => {
    expect(deg2rad(90)).toBeCloseTo(Math.PI / 2, 5);
  });

  it('should convert 360 degrees to 2*PI radians', () => {
    expect(deg2rad(360)).toBeCloseTo(2 * Math.PI, 5);
  });
});

describe('utcToMJD and mjdToUTC', () => {
  it('should convert UTC to MJD correctly', () => {
    const date = new Date('2000-01-01T12:00:00Z');
    const mjd = utcToMJD(date);
    // J2000.0 epoch is MJD 51544.5, so noon on Jan 1, 2000 should be around 51545
    expect(mjd).toBeGreaterThan(51544);
    expect(mjd).toBeLessThan(51546);
  });

  it('should be reversible', () => {
    const original = new Date('2024-06-15T12:00:00Z');
    const mjd = utcToMJD(original);
    const restored = mjdToUTC(mjd);
    expect(restored.getTime()).toBeCloseTo(original.getTime(), -3);
  });

  it('should handle different dates', () => {
    const date1 = new Date('2020-01-01T00:00:00Z');
    const date2 = new Date('2020-01-02T00:00:00Z');
    const mjd1 = utcToMJD(date1);
    const mjd2 = utcToMJD(date2);
    expect(mjd2 - mjd1).toBeCloseTo(1, 5);
  });
});

describe('formatTime', () => {
  it('should format timestamp to HH:MM:SS', () => {
    const date = new Date('2024-06-15T14:30:45');
    const result = formatTime(date.getTime());
    expect(result).toBe('14:30:45');
  });

  it('should pad single digits', () => {
    const date = new Date('2024-06-15T09:05:03');
    const result = formatTime(date.getTime());
    expect(result).toBe('09:05:03');
  });

  it('should handle midnight', () => {
    const date = new Date('2024-06-15T00:00:00');
    const result = formatTime(date.getTime());
    expect(result).toBe('00:00:00');
  });
});

describe('getJulianDate', () => {
  it('should return a Julian Date greater than 2451545', () => {
    const jd = getJulianDate();
    expect(jd).toBeGreaterThan(2451545);
  });

  it('should return a number', () => {
    const jd = getJulianDate();
    expect(typeof jd).toBe('number');
  });
});

describe('getGST', () => {
  it('should return a value between 0 and 360', () => {
    const gst = getGST();
    expect(gst).toBeGreaterThanOrEqual(0);
    expect(gst).toBeLessThan(360);
  });

  it('should return a number', () => {
    const gst = getGST();
    expect(typeof gst).toBe('number');
  });
});

describe('getLST', () => {
  it('should return a value for given longitude', () => {
    const lst = getLST(0);
    expect(typeof lst).toBe('number');
  });

  it('should differ by longitude offset', () => {
    const lst0 = getLST(0);
    const lst90 = getLST(90);
    const diff = Math.abs((lst90 - lst0 + 360) % 360 - 90);
    expect(diff).toBeLessThan(1);
  });
});

describe('raDecToAltAz', () => {
  it('should return altitude and azimuth', () => {
    const result = raDecToAltAz(0, 0, 45, 0);
    expect(result).toHaveProperty('altitude');
    expect(result).toHaveProperty('azimuth');
  });

  it('should return altitude between -90 and 90', () => {
    const result = raDecToAltAz(180, 45, 45, -75);
    expect(result.altitude).toBeGreaterThanOrEqual(-90);
    expect(result.altitude).toBeLessThanOrEqual(90);
  });

  it('should return azimuth between 0 and 360', () => {
    const result = raDecToAltAz(180, 45, 45, -75);
    expect(result.azimuth).toBeGreaterThanOrEqual(0);
    expect(result.azimuth).toBeLessThan(360);
  });
});

describe('altAzToRaDec', () => {
  it('should return ra and dec', () => {
    const result = altAzToRaDec(45, 180, 45, 0);
    expect(result).toHaveProperty('ra');
    expect(result).toHaveProperty('dec');
  });

  it('should return ra between 0 and 360', () => {
    const result = altAzToRaDec(45, 180, 45, -75);
    expect(result.ra).toBeGreaterThanOrEqual(0);
    expect(result.ra).toBeLessThan(360);
  });

  it('should return dec between -90 and 90', () => {
    const result = altAzToRaDec(45, 180, 45, -75);
    expect(result.dec).toBeGreaterThanOrEqual(-90);
    expect(result.dec).toBeLessThanOrEqual(90);
  });
});

describe('formatDateForInput', () => {
  it('should format date as YYYY-MM-DD', () => {
    const date = new Date('2024-06-15');
    const result = formatDateForInput(date);
    expect(result).toBe('2024-06-15');
  });

  it('should pad single digit month', () => {
    const date = new Date('2024-01-05');
    const result = formatDateForInput(date);
    expect(result).toMatch(/^2024-01-0[45]$/);
  });

  it('should pad single digit day', () => {
    const date = new Date('2024-12-01');
    const result = formatDateForInput(date);
    expect(result).toMatch(/^2024-12-0[12]$/);
  });
});

describe('formatTimeForInput', () => {
  it('should format time as HH:MM', () => {
    const date = new Date('2024-06-15T14:30:00');
    const result = formatTimeForInput(date);
    expect(result).toBe('14:30');
  });

  it('should pad single digit hour', () => {
    const date = new Date('2024-06-15T09:05:00');
    const result = formatTimeForInput(date);
    expect(result).toBe('09:05');
  });

  it('should handle midnight', () => {
    const date = new Date('2024-06-15T00:00:00');
    const result = formatTimeForInput(date);
    expect(result).toBe('00:00');
  });
});

describe('wait', () => {
  it('should return a promise', () => {
    const result = wait(0);
    expect(result).toBeInstanceOf(Promise);
  });

  it('should resolve after specified time', async () => {
    const start = Date.now();
    await wait(50);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(45);
  });
});
