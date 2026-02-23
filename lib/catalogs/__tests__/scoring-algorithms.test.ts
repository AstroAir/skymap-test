/**
 * Tests for scoring-algorithms.ts
 * Airmass, surface brightness, contrast, meridian transit, moon impact scoring
 */

import {
  calculateAirmass,
  calculateExtinction,
  getAirmassQuality,
  calculateSurfaceBrightness,
  calculateContrastRatio,
  isObjectVisible,
  calculateMeridianProximity,
  transitDuringDarkHours,
  calculateMoonImpact,
  getMoonSkyBrighteningMag,
  BORTLE_SKY_BRIGHTNESS,
} from '../scoring-algorithms';

describe('calculateAirmass', () => {
  it('should return Infinity for altitude <= 0', () => {
    expect(calculateAirmass(0)).toBe(Infinity);
    expect(calculateAirmass(-10)).toBe(Infinity);
  });

  it('should return 1.0 for zenith (90°)', () => {
    expect(calculateAirmass(90)).toBe(1.0);
  });

  it('should return ~2.0 for ~30° altitude', () => {
    const am = calculateAirmass(30);
    expect(am).toBeCloseTo(2.0, 0);
  });

  it('should increase as altitude decreases', () => {
    expect(calculateAirmass(60)).toBeLessThan(calculateAirmass(30));
    expect(calculateAirmass(30)).toBeLessThan(calculateAirmass(15));
  });

  it('should always be >= 1.0 for positive altitudes', () => {
    for (let alt = 1; alt <= 90; alt++) {
      expect(calculateAirmass(alt)).toBeGreaterThanOrEqual(1.0);
    }
  });
});

describe('calculateExtinction', () => {
  it('should return Infinity for altitude <= 0', () => {
    expect(calculateExtinction(0)).toBe(Infinity);
  });

  it('should return 0.2 at zenith with default coefficient', () => {
    expect(calculateExtinction(90)).toBeCloseTo(0.2);
  });

  it('should increase with lower altitude', () => {
    expect(calculateExtinction(30)).toBeGreaterThan(calculateExtinction(60));
  });
});

describe('getAirmassQuality', () => {
  it('should return excellent for airmass <= 1.2', () => {
    expect(getAirmassQuality(1.0)).toBe('excellent');
    expect(getAirmassQuality(1.2)).toBe('excellent');
  });

  it('should return good for 1.2 < airmass <= 1.5', () => {
    expect(getAirmassQuality(1.3)).toBe('good');
  });

  it('should return fair for 1.5 < airmass <= 2.0', () => {
    expect(getAirmassQuality(1.8)).toBe('fair');
  });

  it('should return poor for 2.0 < airmass <= 3.0', () => {
    expect(getAirmassQuality(2.5)).toBe('poor');
  });

  it('should return bad for airmass > 3.0', () => {
    expect(getAirmassQuality(5)).toBe('bad');
  });
});

describe('calculateSurfaceBrightness', () => {
  it('should return magnitude for point source (zero size)', () => {
    expect(calculateSurfaceBrightness(8.0, 0)).toBe(8.0);
  });

  it('should be higher (dimmer) than magnitude for extended objects', () => {
    const sb = calculateSurfaceBrightness(8.0, 10, 5);
    expect(sb).toBeGreaterThan(8.0);
  });
});

describe('calculateContrastRatio', () => {
  it('should return 1 when object and sky are equal brightness', () => {
    expect(calculateContrastRatio(21.0, 21.0)).toBeCloseTo(1.0);
  });

  it('should be > 1 when object is brighter than sky', () => {
    // Lower mag/arcsec² = brighter
    expect(calculateContrastRatio(19.0, 21.0)).toBeGreaterThan(1.0);
  });

  it('should be < 1 when object is dimmer than sky', () => {
    expect(calculateContrastRatio(23.0, 21.0)).toBeLessThan(1.0);
  });
});

describe('isObjectVisible', () => {
  it('should return true for bright object on dark sky', () => {
    expect(isObjectVisible(18.0, 22.0, 10)).toBe(true);
  });

  it('should return false for dim object on bright sky', () => {
    expect(isObjectVisible(23.0, 19.0, 1)).toBe(false);
  });
});

describe('calculateMeridianProximity', () => {
  it('should return 0.5 when no transit time', () => {
    expect(calculateMeridianProximity(null, new Date())).toBe(0.5);
  });

  it('should return ~1 when at transit', () => {
    const now = new Date();
    expect(calculateMeridianProximity(now, now)).toBeCloseTo(1.0);
  });

  it('should decrease as time from transit increases', () => {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 3600000);
    const threeHoursLater = new Date(now.getTime() + 3 * 3600000);
    const p1 = calculateMeridianProximity(now, oneHourLater);
    const p3 = calculateMeridianProximity(now, threeHoursLater);
    expect(p1).toBeGreaterThan(p3);
  });
});

describe('transitDuringDarkHours', () => {
  it('should return false with null inputs', () => {
    expect(transitDuringDarkHours(null, new Date(), new Date())).toBe(false);
    expect(transitDuringDarkHours(new Date(), null, new Date())).toBe(false);
    expect(transitDuringDarkHours(new Date(), new Date(), null)).toBe(false);
  });

  it('should return true when transit is during dark hours', () => {
    const darkStart = new Date('2025-06-15T21:00:00Z');
    const darkEnd = new Date('2025-06-16T04:00:00Z');
    const transit = new Date('2025-06-16T00:00:00Z');
    expect(transitDuringDarkHours(transit, darkStart, darkEnd)).toBe(true);
  });

  it('should return false when transit is outside dark hours', () => {
    const darkStart = new Date('2025-06-15T21:00:00Z');
    const darkEnd = new Date('2025-06-16T04:00:00Z');
    const transit = new Date('2025-06-15T12:00:00Z');
    expect(transitDuringDarkHours(transit, darkStart, darkEnd)).toBe(false);
  });
});

describe('calculateMoonImpact', () => {
  it('should return 1.0 when moon illumination < 5%', () => {
    expect(calculateMoonImpact(10, 3)).toBe(1.0);
  });

  it('should return 1.0 when far enough from moon', () => {
    expect(calculateMoonImpact(100, 50)).toBe(1.0);
  });

  it('should return < 1 when close to bright moon', () => {
    expect(calculateMoonImpact(10, 90)).toBeLessThan(1.0);
  });

  it('should be between 0 and 1', () => {
    const impact = calculateMoonImpact(5, 100);
    expect(impact).toBeGreaterThanOrEqual(0);
    expect(impact).toBeLessThanOrEqual(1);
  });
});

describe('getMoonSkyBrighteningMag', () => {
  it('should return 0 when moon is below horizon', () => {
    expect(getMoonSkyBrighteningMag(30, 80, -5)).toBe(0);
  });

  it('should return > 0 when moon is above horizon', () => {
    expect(getMoonSkyBrighteningMag(30, 80, 45)).toBeGreaterThan(0);
  });

  it('should increase with moon illumination', () => {
    const low = getMoonSkyBrighteningMag(30, 20, 45);
    const high = getMoonSkyBrighteningMag(30, 90, 45);
    expect(high).toBeGreaterThan(low);
  });
});

describe('BORTLE_SKY_BRIGHTNESS', () => {
  it('should have entries for Bortle 1-9', () => {
    for (let i = 1; i <= 9; i++) {
      expect(BORTLE_SKY_BRIGHTNESS[i]).toBeDefined();
      expect(typeof BORTLE_SKY_BRIGHTNESS[i]).toBe('number');
    }
  });

  it('should decrease (brighter) as Bortle increases', () => {
    expect(BORTLE_SKY_BRIGHTNESS[1]).toBeGreaterThan(BORTLE_SKY_BRIGHTNESS[9]);
  });
});
