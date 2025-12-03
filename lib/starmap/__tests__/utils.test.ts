/**
 * @jest-environment jsdom
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
} from '../utils';

describe('Coordinate Conversion Functions', () => {
  describe('degreesToHMS', () => {
    it('converts 0 degrees to 0:00:00.0', () => {
      expect(degreesToHMS(0)).toBe('0:00:00.0');
    });

    it('converts 180 degrees to 12:00:00.0', () => {
      expect(degreesToHMS(180)).toBe('12:00:00.0');
    });

    it('converts 90 degrees to 6:00:00.0', () => {
      expect(degreesToHMS(90)).toBe('6:00:00.0');
    });

    it('converts 45 degrees to 3:00:00.0', () => {
      expect(degreesToHMS(45)).toBe('3:00:00.0');
    });

    it('handles fractional degrees', () => {
      const result = degreesToHMS(15.5);
      expect(result).toMatch(/^1:02:/);
    });
  });

  describe('degreesToDMS', () => {
    it('converts 0 degrees to +00:00:00.0', () => {
      expect(degreesToDMS(0)).toBe('+00:00:00.0');
    });

    it('converts positive degrees correctly', () => {
      expect(degreesToDMS(45)).toBe('+45:00:00.0');
    });

    it('converts negative degrees correctly', () => {
      expect(degreesToDMS(-45)).toBe('-45:00:00.0');
    });

    it('handles fractional degrees', () => {
      const result = degreesToDMS(45.5);
      expect(result).toMatch(/^\+45:30:/);
    });
  });

  describe('hmsToDegrees', () => {
    it('converts 0:00:00 to 0 degrees', () => {
      expect(hmsToDegrees('0:00:00')).toBe(0);
    });

    it('converts 12:00:00 to 180 degrees', () => {
      expect(hmsToDegrees('12:00:00')).toBe(180);
    });

    it('converts 6:00:00 to 90 degrees', () => {
      expect(hmsToDegrees('6:00:00')).toBe(90);
    });

    it('handles fractional seconds', () => {
      const result = hmsToDegrees('1:02:00');
      expect(result).toBeCloseTo(15.5, 1);
    });
  });

  describe('dmsToDegrees', () => {
    it('converts +00:00:00 to 0 degrees', () => {
      expect(dmsToDegrees('+00:00:00')).toBe(0);
    });

    it('converts +45:00:00 to 45 degrees', () => {
      expect(dmsToDegrees('+45:00:00')).toBe(45);
    });

    it('converts -45:00:00 to -45 degrees', () => {
      expect(dmsToDegrees('-45:00:00')).toBe(-45);
    });

    it('handles fractional minutes', () => {
      const result = dmsToDegrees('+45:30:00');
      expect(result).toBeCloseTo(45.5, 1);
    });
  });

  describe('rad2deg', () => {
    it('converts 0 radians to 0 degrees', () => {
      expect(rad2deg(0)).toBe(0);
    });

    it('converts PI radians to 180 degrees', () => {
      expect(rad2deg(Math.PI)).toBeCloseTo(180, 10);
    });

    it('converts PI/2 radians to 90 degrees', () => {
      expect(rad2deg(Math.PI / 2)).toBeCloseTo(90, 10);
    });
  });

  describe('deg2rad', () => {
    it('converts 0 degrees to 0 radians', () => {
      expect(deg2rad(0)).toBe(0);
    });

    it('converts 180 degrees to PI radians', () => {
      expect(deg2rad(180)).toBeCloseTo(Math.PI, 10);
    });

    it('converts 90 degrees to PI/2 radians', () => {
      expect(deg2rad(90)).toBeCloseTo(Math.PI / 2, 10);
    });
  });
});

describe('Julian Date Functions', () => {
  describe('utcToMJD', () => {
    it('converts UTC date to Modified Julian Date', () => {
      const date = new Date('2000-01-01T12:00:00Z');
      const mjd = utcToMJD(date);
      // MJD for J2000 epoch is 51544.5
      expect(mjd).toBeCloseTo(51544.5, 1);
    });
  });

  describe('mjdToUTC', () => {
    it('converts Modified Julian Date to UTC date', () => {
      const mjd = 51544.5; // J2000 epoch
      const date = mjdToUTC(mjd);
      expect(date.getUTCFullYear()).toBe(2000);
      expect(date.getUTCMonth()).toBe(0);
      expect(date.getUTCDate()).toBe(1);
    });
  });

  describe('getJulianDate', () => {
    it('returns a valid Julian Date', () => {
      const jd = getJulianDate();
      // JD should be around 2460000+ for current dates
      expect(jd).toBeGreaterThan(2450000);
      expect(jd).toBeLessThan(2500000);
    });
  });
});

describe('Sidereal Time Functions', () => {
  describe('getGST', () => {
    it('returns a value between 0 and 360', () => {
      const gst = getGST();
      expect(gst).toBeGreaterThanOrEqual(0);
      expect(gst).toBeLessThan(360);
    });
  });

  describe('getLST', () => {
    it('returns a value between 0 and 360', () => {
      const lst = getLST(0);
      expect(lst).toBeGreaterThanOrEqual(0);
      expect(lst).toBeLessThan(360);
    });

    it('adjusts for longitude', () => {
      const lst0 = getLST(0);
      const lst90 = getLST(90);
      // LST at 90° longitude should be 90° ahead (or wrapped)
      const diff = (lst90 - lst0 + 360) % 360;
      expect(diff).toBeCloseTo(90, 0);
    });
  });
});

describe('Coordinate Transformation Functions', () => {
  describe('raDecToAltAz', () => {
    it('returns altitude and azimuth', () => {
      const result = raDecToAltAz(0, 0, 40, -74);
      expect(result).toHaveProperty('altitude');
      expect(result).toHaveProperty('azimuth');
    });

    it('altitude is between -90 and 90', () => {
      const result = raDecToAltAz(180, 45, 40, -74);
      expect(result.altitude).toBeGreaterThanOrEqual(-90);
      expect(result.altitude).toBeLessThanOrEqual(90);
    });

    it('azimuth is between 0 and 360', () => {
      const result = raDecToAltAz(180, 45, 40, -74);
      expect(result.azimuth).toBeGreaterThanOrEqual(0);
      expect(result.azimuth).toBeLessThan(360);
    });
  });

  describe('altAzToRaDec', () => {
    it('returns RA and Dec', () => {
      const result = altAzToRaDec(45, 180, 40, -74);
      expect(result).toHaveProperty('ra');
      expect(result).toHaveProperty('dec');
    });

    it('RA is between 0 and 360', () => {
      const result = altAzToRaDec(45, 180, 40, -74);
      expect(result.ra).toBeGreaterThanOrEqual(0);
      expect(result.ra).toBeLessThan(360);
    });

    it('Dec is between -90 and 90', () => {
      const result = altAzToRaDec(45, 180, 40, -74);
      expect(result.dec).toBeGreaterThanOrEqual(-90);
      expect(result.dec).toBeLessThanOrEqual(90);
    });
  });
});

describe('Formatting Functions', () => {
  describe('formatTime', () => {
    it('formats timestamp to HH:MM:SS', () => {
      const date = new Date('2024-01-15T14:30:45');
      const result = formatTime(date.getTime());
      expect(result).toBe('14:30:45');
    });

    it('pads single digit values', () => {
      const date = new Date('2024-01-15T01:02:03');
      const result = formatTime(date.getTime());
      expect(result).toBe('01:02:03');
    });
  });

  describe('formatDateForInput', () => {
    it('formats date to YYYY-MM-DD', () => {
      const date = new Date('2024-01-15');
      const result = formatDateForInput(date);
      expect(result).toBe('2024-01-15');
    });

    it('pads single digit month and day', () => {
      const date = new Date('2024-01-05');
      const result = formatDateForInput(date);
      expect(result).toBe('2024-01-05');
    });
  });

  describe('formatTimeForInput', () => {
    it('formats time to HH:MM', () => {
      const date = new Date('2024-01-15T14:30:00');
      const result = formatTimeForInput(date);
      expect(result).toBe('14:30');
    });

    it('pads single digit hours and minutes', () => {
      const date = new Date('2024-01-15T01:05:00');
      const result = formatTimeForInput(date);
      expect(result).toBe('01:05');
    });
  });
});

describe('Utility Functions', () => {
  describe('wait', () => {
    it('returns a promise', () => {
      const result = wait(0);
      expect(result).toBeInstanceOf(Promise);
    });

    it('resolves after specified time', async () => {
      const start = Date.now();
      await wait(50);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(45);
    });
  });
});
