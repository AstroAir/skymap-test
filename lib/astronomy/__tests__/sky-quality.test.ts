/**
 * Tests for sky-quality.ts
 * Sky quality estimation and sky quality color mapping
 */

import { estimateSkyQuality, getSkyQualityColor } from '../sky-quality';

describe('estimateSkyQuality', () => {
  it('should return poor when sun is above -6°', () => {
    expect(estimateSkyQuality(-3, -10, 0)).toBe('poor');
    expect(estimateSkyQuality(0, -10, 0)).toBe('poor');
    expect(estimateSkyQuality(10, -10, 0)).toBe('poor');
  });

  it('should return fair during civil twilight (-6 to -12)', () => {
    expect(estimateSkyQuality(-8, -10, 0)).toBe('fair');
  });

  it('should return good during nautical twilight (-12 to -18)', () => {
    expect(estimateSkyQuality(-15, -10, 0)).toBe('good');
  });

  it('should return excellent in full astronomical darkness with no moon', () => {
    expect(estimateSkyQuality(-20, -10, 0)).toBe('excellent');
  });

  it('should return fair when bright moon is high', () => {
    // Sun well below, but moon is high and bright
    expect(estimateSkyQuality(-20, 40, 80)).toBe('fair');
  });

  it('should return good when moderately bright moon is above horizon', () => {
    expect(estimateSkyQuality(-20, 10, 75)).toBe('good');
  });
});

describe('getSkyQualityColor', () => {
  it('should return correct CSS classes', () => {
    expect(getSkyQualityColor('excellent')).toBe('text-green-400');
    expect(getSkyQualityColor('good')).toBe('text-emerald-400');
    expect(getSkyQualityColor('fair')).toBe('text-yellow-400');
    expect(getSkyQualityColor('poor')).toBe('text-red-400');
  });
});
