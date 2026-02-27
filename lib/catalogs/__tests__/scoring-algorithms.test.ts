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
  calculateSeasonalScore,
  calculateComprehensiveImagingScore,
  EXTENDED_SEASONAL_DATA,
  levenshteinDistance,
  calculateSimilarity,
  matchCatalogPrefix,
  calculateSearchMatch,
  ScoringUtils,
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

describe('calculateSeasonalScore', () => {
  it('should return 1.0 for objects in their best month', () => {
    expect(calculateSeasonalScore('M31', 10)).toBe(1.0); // M31 best months include Oct
    expect(calculateSeasonalScore('M42', 1)).toBe(1.0);  // M42 best months include Jan
  });

  it('should return 0.5 for unknown objects', () => {
    expect(calculateSeasonalScore('UNKNOWN_OBJECT', 6)).toBe(0.5);
  });

  it('should return lower score for months far from best', () => {
    // M31 best: [9,10,11,12,1], so July (7) is far
    const score = calculateSeasonalScore('M31', 7);
    expect(score).toBeLessThan(1.0);
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it('should handle year wrap (e.g., Dec to Jan)', () => {
    // M42 best months: [11,12,1,2,3]
    const dec = calculateSeasonalScore('M42', 12);
    const jan = calculateSeasonalScore('M42', 1);
    expect(dec).toBe(1.0);
    expect(jan).toBe(1.0);
  });

  it('should return score between 0 and 1', () => {
    for (let month = 1; month <= 12; month++) {
      const score = calculateSeasonalScore('M13', month);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    }
  });
});

describe('EXTENDED_SEASONAL_DATA', () => {
  it('should have data for well-known objects', () => {
    expect(EXTENDED_SEASONAL_DATA['M31']).toBeDefined();
    expect(EXTENDED_SEASONAL_DATA['M42']).toBeDefined();
    expect(EXTENDED_SEASONAL_DATA['M13']).toBeDefined();
  });

  it('should have valid difficulty levels', () => {
    const validDifficulties = ['beginner', 'intermediate', 'advanced', 'expert'];
    for (const data of Object.values(EXTENDED_SEASONAL_DATA)) {
      expect(validDifficulties).toContain(data.difficulty);
    }
  });

  it('should have valid best months (1-12)', () => {
    for (const data of Object.values(EXTENDED_SEASONAL_DATA)) {
      for (const month of data.bestMonths) {
        expect(month).toBeGreaterThanOrEqual(1);
        expect(month).toBeLessThanOrEqual(12);
      }
    }
  });
});

describe('calculateComprehensiveImagingScore', () => {
  it('should return excellent for ideal conditions', () => {
    const result = calculateComprehensiveImagingScore({
      altitude: 80,
      airmass: 1.05,
      moonDistance: 120,
      moonIllumination: 5,
      magnitude: 5,
      seasonalScore: 1.0,
      transitProximity: 0.9,
    });
    expect(result.totalScore).toBeGreaterThanOrEqual(70);
    expect(['excellent', 'good']).toContain(result.quality);
  });

  it('should return poor for bad conditions', () => {
    const result = calculateComprehensiveImagingScore({
      altitude: 15,
      airmass: 4.0,
      moonDistance: 10,
      moonIllumination: 95,
      magnitude: 15,
      seasonalScore: 0.1,
      transitProximity: 0.1,
    });
    expect(result.totalScore).toBeLessThan(50);
    expect(['poor', 'bad']).toContain(result.quality);
  });

  it('should include score breakdown', () => {
    const result = calculateComprehensiveImagingScore({
      altitude: 60,
      airmass: 1.15,
      moonDistance: 90,
      moonIllumination: 30,
    });
    expect(typeof result.breakdown.altitudeScore).toBe('number');
    expect(typeof result.breakdown.airmassScore).toBe('number');
    expect(typeof result.breakdown.moonScore).toBe('number');
    expect(typeof result.breakdown.brightnessScore).toBe('number');
    expect(typeof result.breakdown.seasonalScore).toBe('number');
    expect(typeof result.breakdown.transitScore).toBe('number');
  });

  it('should provide recommendations', () => {
    const result = calculateComprehensiveImagingScore({
      altitude: 20,
      airmass: 3.0,
      moonDistance: 15,
      moonIllumination: 90,
      magnitude: 14,
    });
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it('should handle different altitude ranges', () => {
    const altitudes = [10, 25, 35, 45, 55, 65, 75];
    let prevScore = 0;
    for (const alt of altitudes) {
      const result = calculateComprehensiveImagingScore({
        altitude: alt,
        airmass: 1.0 / Math.sin((alt * Math.PI) / 180),
        moonDistance: 90,
        moonIllumination: 0,
      });
      expect(result.breakdown.altitudeScore).toBeGreaterThanOrEqual(prevScore);
      prevScore = result.breakdown.altitudeScore;
    }
  });

  it('should handle different magnitude ranges', () => {
    const mags = [4, 7, 9, 11, 13, 15];
    const scores = mags.map(mag => {
      const result = calculateComprehensiveImagingScore({
        altitude: 60,
        airmass: 1.15,
        moonDistance: 90,
        moonIllumination: 0,
        magnitude: mag,
      });
      return result.breakdown.brightnessScore;
    });
    // Brighter objects should score higher
    expect(scores[0]).toBeGreaterThan(scores[scores.length - 1]);
  });

  it('should handle undefined magnitude', () => {
    const result = calculateComprehensiveImagingScore({
      altitude: 60,
      airmass: 1.15,
      moonDistance: 90,
      moonIllumination: 0,
    });
    expect(result.breakdown.brightnessScore).toBe(8); // default neutral
  });

  it('should penalize dark sky requirement in light-polluted areas', () => {
    const result = calculateComprehensiveImagingScore({
      altitude: 60,
      airmass: 1.15,
      moonDistance: 90,
      moonIllumination: 0,
      magnitude: 8,
      darkSkyRequired: true,
      bortleClass: 7,
    });
    expect(result.recommendations.some(r => r.includes('darker skies'))).toBe(true);
  });

  it('should note near-transit objects', () => {
    const result = calculateComprehensiveImagingScore({
      altitude: 60,
      airmass: 1.15,
      moonDistance: 90,
      moonIllumination: 0,
      transitProximity: 0.9,
    });
    expect(result.recommendations.some(r => r.includes('transit'))).toBe(true);
  });
});

describe('levenshteinDistance (scoring)', () => {
  it('should return 0 for identical strings', () => {
    expect(levenshteinDistance('hello', 'hello')).toBe(0);
  });

  it('should return correct distance for single edits', () => {
    expect(levenshteinDistance('cat', 'bat')).toBe(1);
    expect(levenshteinDistance('cat', 'cats')).toBe(1);
  });

  it('should handle empty strings', () => {
    expect(levenshteinDistance('', 'abc')).toBe(3);
    expect(levenshteinDistance('abc', '')).toBe(3);
  });
});

describe('calculateSimilarity (scoring)', () => {
  it('should return 1 for identical strings', () => {
    expect(calculateSimilarity('hello', 'hello')).toBe(1);
  });

  it('should return 1 for empty strings', () => {
    expect(calculateSimilarity('', '')).toBe(1);
  });

  it('should be case insensitive', () => {
    expect(calculateSimilarity('M31', 'm31')).toBeGreaterThan(0.9);
  });

  it('should return high score for similar strings', () => {
    expect(calculateSimilarity('andromeda', 'andromida')).toBeGreaterThan(0.7);
  });
});

describe('matchCatalogPrefix', () => {
  it('should match exact catalog ID', () => {
    const result = matchCatalogPrefix('M31', 'M31');
    expect(result).not.toBeNull();
    expect(result?.score).toBe(1.0);
    expect(result?.matchType).toBe('catalog');
  });

  it('should match case-insensitive', () => {
    const result = matchCatalogPrefix('m31', 'M31');
    expect(result).not.toBeNull();
  });

  it('should return null for non-catalog strings', () => {
    expect(matchCatalogPrefix('hello', 'M31')).toBeNull();
    expect(matchCatalogPrefix('M31', 'hello')).toBeNull();
  });

  it('should return null for different catalog numbers', () => {
    expect(matchCatalogPrefix('M31', 'M42')).toBeNull();
  });

  it('should match NGC objects', () => {
    const result = matchCatalogPrefix('NGC7000', 'NGC7000');
    expect(result).not.toBeNull();
    expect(result?.score).toBe(1.0);
  });
});

describe('calculateSearchMatch', () => {
  it('should return exact match for identical name', () => {
    const result = calculateSearchMatch('M31', 'M31');
    expect(result.matchType).toBe('catalog');
    expect(result.score).toBe(1.0);
  });

  it('should return exact match (case insensitive)', () => {
    const result = calculateSearchMatch('m31', 'M31');
    expect(result.score).toBeGreaterThan(0.9);
  });

  it('should match common name', () => {
    const result = calculateSearchMatch('Andromeda Galaxy', 'M31', undefined, 'Andromeda Galaxy');
    expect(result.score).toBeGreaterThan(0.9);
    expect(result.matchedField).toBe('commonName');
  });

  it('should match prefix', () => {
    const result = calculateSearchMatch('NGC700', 'NGC7000');
    expect(result.matchType).toBe('prefix');
    expect(result.score).toBeGreaterThan(0.5);
  });

  it('should match contains', () => {
    const result = calculateSearchMatch('7000', 'NGC7000');
    expect(result.matchType).toBe('contains');
    expect(result.score).toBeGreaterThan(0);
  });

  it('should match alternate names', () => {
    const result = calculateSearchMatch('NGC224', 'M31', ['NGC224', 'Andromeda Galaxy']);
    expect(result.score).toBeGreaterThan(0.8);
  });

  it('should return fuzzy match for similar strings', () => {
    const result = calculateSearchMatch('Andromida', 'Andromeda');
    expect(result.score).toBeGreaterThan(0);
  });

  it('should return zero for completely different strings', () => {
    const result = calculateSearchMatch('xyz123', 'M31');
    expect(result.score).toBe(0);
    expect(result.matchType).toBe('none');
  });

  it('should match common name prefix', () => {
    const result = calculateSearchMatch('Andro', 'M31', undefined, 'Andromeda Galaxy');
    expect(result.score).toBeGreaterThan(0.5);
  });

  it('should match common name contains', () => {
    const result = calculateSearchMatch('Galaxy', 'M31', undefined, 'Andromeda Galaxy');
    expect(result.score).toBeGreaterThan(0);
  });

  it('should match alternate name prefix', () => {
    const result = calculateSearchMatch('NGC2', 'M31', ['NGC224']);
    expect(result.matchType).toBe('prefix');
    expect(result.matchedField).toBe('alternateName');
  });

  it('should match alternate name contains', () => {
    const result = calculateSearchMatch('224', 'M31', ['NGC224']);
    expect(result.matchType).toBe('contains');
  });

  it('should fuzzy match common name', () => {
    const result = calculateSearchMatch('Andromida Galxy', 'M31', undefined, 'Andromeda Galaxy');
    expect(result.score).toBeGreaterThan(0);
  });
});

describe('ScoringUtils', () => {
  it('should export all scoring functions', () => {
    expect(typeof ScoringUtils.calculateAirmass).toBe('function');
    expect(typeof ScoringUtils.calculateExtinction).toBe('function');
    expect(typeof ScoringUtils.getAirmassQuality).toBe('function');
    expect(typeof ScoringUtils.calculateSurfaceBrightness).toBe('function');
    expect(typeof ScoringUtils.calculateContrastRatio).toBe('function');
    expect(typeof ScoringUtils.isObjectVisible).toBe('function');
    expect(typeof ScoringUtils.calculateMeridianProximity).toBe('function');
    expect(typeof ScoringUtils.transitDuringDarkHours).toBe('function');
    expect(typeof ScoringUtils.calculateMoonImpact).toBe('function');
    expect(typeof ScoringUtils.getMoonSkyBrighteningMag).toBe('function');
    expect(typeof ScoringUtils.calculateSeasonalScore).toBe('function');
    expect(typeof ScoringUtils.calculateComprehensiveImagingScore).toBe('function');
    expect(typeof ScoringUtils.calculateSearchMatch).toBe('function');
    expect(typeof ScoringUtils.levenshteinDistance).toBe('function');
    expect(typeof ScoringUtils.calculateSimilarity).toBe('function');
  });
});
