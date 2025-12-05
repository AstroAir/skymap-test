/**
 * @jest-environment node
 */
import {
  calculateExposure,
  calculateTotalIntegration,
  calculateSubframeCount,
  getImageScale,
  checkSampling,
  calculateFOV,
  formatExposureTime,
  BORTLE_SCALE,
  getBortleExposureMultiplier,
} from '../exposure';

describe('Exposure Calculations', () => {
  // ============================================================================
  // calculateExposure
  // ============================================================================
  describe('calculateExposure', () => {
    it('returns maxUntracked, recommendedSingle, minForSignal', () => {
      const result = calculateExposure({
        bortle: 5,
        focalLength: 300,
        aperture: 75,
        tracking: 'guided',
      });

      expect(result).toHaveProperty('maxUntracked');
      expect(result).toHaveProperty('recommendedSingle');
      expect(result).toHaveProperty('minForSignal');
    });

    it('maxUntracked follows 500 rule', () => {
      const result = calculateExposure({
        bortle: 5,
        focalLength: 500,
        aperture: 100,
        tracking: 'none',
      });

      // 500 / 500 = 1 second
      expect(result.maxUntracked).toBeCloseTo(1, 0);
    });

    it('longer focal length = shorter untracked exposure', () => {
      const short = calculateExposure({
        bortle: 5,
        focalLength: 200,
        aperture: 50,
        tracking: 'none',
      });
      const long = calculateExposure({
        bortle: 5,
        focalLength: 500,
        aperture: 125,
        tracking: 'none',
      });

      expect(long.maxUntracked).toBeLessThan(short.maxUntracked);
    });

    it('guided tracking allows longer exposures than basic', () => {
      const basic = calculateExposure({
        bortle: 5,
        focalLength: 300,
        aperture: 75,
        tracking: 'basic',
      });
      const guided = calculateExposure({
        bortle: 5,
        focalLength: 300,
        aperture: 75,
        tracking: 'guided',
      });

      expect(guided.recommendedSingle).toBeGreaterThanOrEqual(basic.recommendedSingle);
    });

    it('no tracking limits to maxUntracked', () => {
      const result = calculateExposure({
        bortle: 5,
        focalLength: 100, // maxUntracked = 5s
        aperture: 25,
        tracking: 'none',
      });

      expect(result.recommendedSingle).toBeLessThanOrEqual(result.maxUntracked * 0.9);
    });

    it('darker skies allow longer exposures', () => {
      const dark = calculateExposure({
        bortle: 2,
        focalLength: 300,
        aperture: 75,
        tracking: 'guided',
      });
      const bright = calculateExposure({
        bortle: 8,
        focalLength: 300,
        aperture: 75,
        tracking: 'guided',
      });

      expect(dark.recommendedSingle).toBeGreaterThan(bright.recommendedSingle);
    });
  });

  // ============================================================================
  // calculateTotalIntegration
  // ============================================================================
  describe('calculateTotalIntegration', () => {
    it('returns minimum, recommended, ideal', () => {
      const result = calculateTotalIntegration({
        bortle: 5,
        targetType: 'galaxy',
      });

      expect(result).toHaveProperty('minimum');
      expect(result).toHaveProperty('recommended');
      expect(result).toHaveProperty('ideal');
    });

    it('ideal > recommended > minimum', () => {
      const result = calculateTotalIntegration({
        bortle: 5,
        targetType: 'galaxy',
      });

      expect(result.ideal).toBeGreaterThan(result.recommended);
      expect(result.recommended).toBeGreaterThan(result.minimum);
    });

    it('different target types have different requirements', () => {
      const galaxy = calculateTotalIntegration({ bortle: 5, targetType: 'galaxy' });
      const cluster = calculateTotalIntegration({ bortle: 5, targetType: 'cluster' });

      // Galaxies generally need more time than clusters
      expect(galaxy.recommended).toBeGreaterThan(cluster.recommended);
    });

    it('narrowband reduces required time', () => {
      const broadband = calculateTotalIntegration({
        bortle: 7,
        targetType: 'nebula',
        isNarrowband: false,
      });
      const narrowband = calculateTotalIntegration({
        bortle: 7,
        targetType: 'nebula',
        isNarrowband: true,
      });

      expect(narrowband.recommended).toBeLessThan(broadband.recommended);
    });

    it('darker skies allow longer total integration', () => {
      // Note: The multiplier increases for darker skies, meaning you can/should
      // integrate longer to take advantage of the darker conditions
      const dark = calculateTotalIntegration({ bortle: 3, targetType: 'nebula' });
      const bright = calculateTotalIntegration({ bortle: 7, targetType: 'nebula' });

      expect(dark.recommended).toBeGreaterThan(bright.recommended);
    });
  });

  // ============================================================================
  // calculateSubframeCount
  // ============================================================================
  describe('calculateSubframeCount', () => {
    it('calculates correct count', () => {
      // 60 minutes total, 60 second subs = 60 subs
      expect(calculateSubframeCount(60, 60)).toBe(60);
    });

    it('rounds up for partial frames', () => {
      // 61 minutes total, 60 second subs = 61 subs (Math.ceil(61*60/60) = 61)
      expect(calculateSubframeCount(61, 60)).toBe(61);
      // 61 minutes total, 120 second subs = 31 subs (Math.ceil(61*60/120) = 31)
      expect(calculateSubframeCount(61, 120)).toBe(31);
    });

    it('handles longer subs', () => {
      // 60 minutes total, 120 second subs = 30 subs
      expect(calculateSubframeCount(60, 120)).toBe(30);
    });

    it('handles short subs', () => {
      // 10 minutes total, 30 second subs = 20 subs
      expect(calculateSubframeCount(10, 30)).toBe(20);
    });
  });

  // ============================================================================
  // getImageScale
  // ============================================================================
  describe('getImageScale', () => {
    it('calculates correct image scale', () => {
      // 1000mm FL, 4µm pixels: 206.265 * 4 / 1000 = 0.825 arcsec/pixel
      expect(getImageScale(1000, 4)).toBeCloseTo(0.825, 2);
    });

    it('shorter FL gives larger scale', () => {
      const short = getImageScale(200, 4);
      const long = getImageScale(1000, 4);

      expect(short).toBeGreaterThan(long);
    });

    it('larger pixels give larger scale', () => {
      const small = getImageScale(500, 3);
      const large = getImageScale(500, 6);

      expect(large).toBeGreaterThan(small);
    });
  });

  // ============================================================================
  // checkSampling
  // ============================================================================
  describe('checkSampling', () => {
    it('returns "optimal" for good sampling', () => {
      // 2 arcsec seeing, optimal scale = 1 arcsec/pixel
      expect(checkSampling(1, 2)).toBe('optimal');
    });

    it('returns "undersampled" for large scale', () => {
      // 2 arcsec seeing, optimal = 1, scale 2.5 = undersampled
      expect(checkSampling(2.5, 2)).toBe('undersampled');
    });

    it('returns "oversampled" for small scale', () => {
      // 2 arcsec seeing, optimal = 1, scale 0.3 = oversampled
      expect(checkSampling(0.3, 2)).toBe('oversampled');
    });

    it('handles different seeing conditions', () => {
      // Poor seeing (4") - 2 arcsec scale would be optimal
      expect(checkSampling(2, 4)).toBe('optimal');

      // Excellent seeing (1") - 0.5 arcsec scale would be optimal
      expect(checkSampling(0.5, 1)).toBe('optimal');
    });
  });

  // ============================================================================
  // calculateFOV
  // ============================================================================
  describe('calculateFOV', () => {
    it('returns FOV in degrees', () => {
      const fov = calculateFOV(36, 1000);
      expect(typeof fov).toBe('number');
      expect(fov).toBeGreaterThan(0);
    });

    it('larger sensor = larger FOV', () => {
      const small = calculateFOV(24, 500);
      const large = calculateFOV(36, 500);

      expect(large).toBeGreaterThan(small);
    });

    it('longer FL = smaller FOV', () => {
      const short = calculateFOV(36, 300);
      const long = calculateFOV(36, 1000);

      expect(short).toBeGreaterThan(long);
    });

    it('calculates reasonable values', () => {
      // Full frame sensor (36mm) at 500mm = ~4 degrees
      const fov = calculateFOV(36, 500);
      expect(fov).toBeCloseTo(4.1, 0);
    });
  });

  // ============================================================================
  // formatExposureTime
  // ============================================================================
  describe('formatExposureTime', () => {
    it('formats milliseconds', () => {
      expect(formatExposureTime(0.5)).toBe('500ms');
      expect(formatExposureTime(0.1)).toBe('100ms');
    });

    it('formats seconds', () => {
      expect(formatExposureTime(30)).toBe('30s');
      expect(formatExposureTime(1)).toBe('1s');
    });

    it('formats minutes and seconds', () => {
      expect(formatExposureTime(90)).toBe('1m 30s');
      expect(formatExposureTime(150)).toBe('2m 30s');
    });

    it('formats hours and minutes', () => {
      expect(formatExposureTime(3660)).toBe('1h 1m');
      expect(formatExposureTime(7200)).toBe('2h 0m');
    });
  });

  // ============================================================================
  // BORTLE_SCALE
  // ============================================================================
  describe('BORTLE_SCALE', () => {
    it('has 9 entries', () => {
      expect(BORTLE_SCALE).toHaveLength(9);
    });

    it('entries have required properties', () => {
      for (const entry of BORTLE_SCALE) {
        expect(entry).toHaveProperty('value');
        expect(entry).toHaveProperty('name');
        expect(entry).toHaveProperty('sqm');
        expect(entry).toHaveProperty('description');
      }
    });

    it('values range from 1 to 9', () => {
      expect(BORTLE_SCALE[0].value).toBe(1);
      expect(BORTLE_SCALE[8].value).toBe(9);
    });

    it('SQM decreases with Bortle value', () => {
      for (let i = 1; i < BORTLE_SCALE.length; i++) {
        expect(BORTLE_SCALE[i].sqm).toBeLessThan(BORTLE_SCALE[i - 1].sqm);
      }
    });
  });

  // ============================================================================
  // getBortleExposureMultiplier
  // ============================================================================
  describe('getBortleExposureMultiplier', () => {
    it('returns higher multiplier for darker skies', () => {
      expect(getBortleExposureMultiplier(1)).toBeGreaterThan(getBortleExposureMultiplier(5));
      expect(getBortleExposureMultiplier(5)).toBeGreaterThan(getBortleExposureMultiplier(9));
    });

    it('returns valid multipliers for all Bortle values', () => {
      for (let i = 1; i <= 9; i++) {
        const mult = getBortleExposureMultiplier(i);
        expect(mult).toBeGreaterThan(0);
      }
    });

    it('handles out-of-range values', () => {
      expect(getBortleExposureMultiplier(0)).toBe(2); // Default
      expect(getBortleExposureMultiplier(10)).toBe(2); // Default
    });
  });
});
