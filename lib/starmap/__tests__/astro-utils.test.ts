/**
 * @jest-environment jsdom
 */
import {
  getJulianDateFromDate,
  julianDateToDate,
  getMoonPhase,
  getMoonPhaseName,
  getMoonIllumination,
  getMoonPosition,
  angularSeparation,
} from '../astro-utils';

describe('Julian Date Functions', () => {
  describe('getJulianDateFromDate', () => {
    it('calculates correct JD for J2000 epoch', () => {
      const j2000 = new Date('2000-01-01T12:00:00Z');
      const jd = getJulianDateFromDate(j2000);
      expect(jd).toBeCloseTo(2451545.0, 1);
    });

    it('calculates correct JD for known date', () => {
      const date = new Date('2024-01-15T00:00:00Z');
      const jd = getJulianDateFromDate(date);
      expect(jd).toBeGreaterThan(2460000);
    });

    it('handles dates before March correctly', () => {
      const feb = new Date('2024-02-15T12:00:00Z');
      const jd = getJulianDateFromDate(feb);
      expect(jd).toBeGreaterThan(2460000);
    });
  });

  describe('julianDateToDate', () => {
    it('converts J2000 epoch correctly', () => {
      const date = julianDateToDate(2451545.0);
      expect(date.getUTCFullYear()).toBe(2000);
      expect(date.getUTCMonth()).toBe(0); // January
      expect(date.getUTCDate()).toBe(1);
    });

    it('round-trips with getJulianDateFromDate', () => {
      const original = new Date('2024-06-15T12:30:00Z');
      const jd = getJulianDateFromDate(original);
      const converted = julianDateToDate(jd);
      
      expect(converted.getUTCFullYear()).toBe(original.getUTCFullYear());
      expect(converted.getUTCMonth()).toBe(original.getUTCMonth());
      expect(converted.getUTCDate()).toBe(original.getUTCDate());
      expect(converted.getUTCHours()).toBe(original.getUTCHours());
    });
  });
});

describe('Moon Phase Functions', () => {
  describe('getMoonPhase', () => {
    it('returns value between 0 and 1', () => {
      const phase = getMoonPhase();
      expect(phase).toBeGreaterThanOrEqual(0);
      expect(phase).toBeLessThanOrEqual(1);
    });

    it('accepts custom Julian Date', () => {
      const phase = getMoonPhase(2451550.1); // Known new moon
      expect(phase).toBeCloseTo(0, 1);
    });
  });

  describe('getMoonPhaseName', () => {
    it('returns New Moon for phase near 0', () => {
      expect(getMoonPhaseName(0)).toBe('New Moon');
      expect(getMoonPhaseName(0.01)).toBe('New Moon');
      expect(getMoonPhaseName(0.99)).toBe('New Moon');
    });

    it('returns Waxing Crescent for phase 0.1', () => {
      expect(getMoonPhaseName(0.1)).toBe('Waxing Crescent');
    });

    it('returns First Quarter for phase 0.25', () => {
      expect(getMoonPhaseName(0.25)).toBe('First Quarter');
    });

    it('returns Waxing Gibbous for phase 0.35', () => {
      expect(getMoonPhaseName(0.35)).toBe('Waxing Gibbous');
    });

    it('returns Full Moon for phase 0.5', () => {
      expect(getMoonPhaseName(0.5)).toBe('Full Moon');
    });

    it('returns Waning Gibbous for phase 0.65', () => {
      expect(getMoonPhaseName(0.65)).toBe('Waning Gibbous');
    });

    it('returns Last Quarter for phase 0.75', () => {
      expect(getMoonPhaseName(0.75)).toBe('Last Quarter');
    });

    it('returns Waning Crescent for phase 0.85', () => {
      expect(getMoonPhaseName(0.85)).toBe('Waning Crescent');
    });
  });

  describe('getMoonIllumination', () => {
    it('returns 0% for new moon', () => {
      expect(getMoonIllumination(0)).toBe(0);
    });

    it('returns 100% for full moon', () => {
      expect(getMoonIllumination(0.5)).toBe(100);
    });

    it('returns ~50% for quarter moon', () => {
      expect(getMoonIllumination(0.25)).toBeCloseTo(50, 0);
      expect(getMoonIllumination(0.75)).toBeCloseTo(50, 0);
    });

    it('returns value between 0 and 100', () => {
      for (let phase = 0; phase <= 1; phase += 0.1) {
        const illumination = getMoonIllumination(phase);
        expect(illumination).toBeGreaterThanOrEqual(0);
        expect(illumination).toBeLessThanOrEqual(100);
      }
    });
  });
});

describe('getMoonPosition', () => {
  it('returns RA and Dec', () => {
    const position = getMoonPosition();
    expect(position).toHaveProperty('ra');
    expect(position).toHaveProperty('dec');
  });

  it('RA is between 0 and 360', () => {
    const position = getMoonPosition();
    expect(position.ra).toBeGreaterThanOrEqual(0);
    expect(position.ra).toBeLessThan(360);
  });

  it('Dec is between -90 and 90', () => {
    const position = getMoonPosition();
    expect(position.dec).toBeGreaterThanOrEqual(-30); // Moon's max declination is ~28.5°
    expect(position.dec).toBeLessThanOrEqual(30);
  });

  it('accepts custom Julian Date', () => {
    const position = getMoonPosition(2451545.0);
    expect(position).toHaveProperty('ra');
    expect(position).toHaveProperty('dec');
  });
});

describe('angularSeparation', () => {
  it('returns 0 for same position', () => {
    const sep = angularSeparation(180, 45, 180, 45);
    expect(sep).toBeCloseTo(0, 10);
  });

  it('returns 90 for perpendicular positions', () => {
    const sep = angularSeparation(0, 0, 90, 0);
    expect(sep).toBeCloseTo(90, 1);
  });

  it('returns 180 for opposite positions', () => {
    const sep = angularSeparation(0, 0, 180, 0);
    expect(sep).toBeCloseTo(180, 1);
  });

  it('handles pole positions correctly', () => {
    const sep = angularSeparation(0, 90, 180, 90);
    expect(sep).toBeCloseTo(0, 1);
  });

  it('is symmetric', () => {
    const sep1 = angularSeparation(10, 20, 30, 40);
    const sep2 = angularSeparation(30, 40, 10, 20);
    expect(sep1).toBeCloseTo(sep2, 10);
  });

  it('returns value between 0 and 180', () => {
    const sep = angularSeparation(0, 0, 270, 45);
    expect(sep).toBeGreaterThanOrEqual(0);
    expect(sep).toBeLessThanOrEqual(180);
  });
});
