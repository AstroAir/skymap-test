/**
 * Tests for exposure-utils.ts
 * Covers: calculateSkyFlux, estimateReadNoise, calculateSNR, calculateOptimalSubExposure,
 *         estimateFileSize, estimateSessionTime
 */

import {
  calculateSkyFlux,
  estimateReadNoise,
  calculateSNR,
  calculateSNRFull,
  calculateOptimalSubExposure,
  estimateFileSize,
  estimateSessionTime,
} from '../exposure-utils';

// ============================================================================
// calculateSkyFlux
// ============================================================================

describe('calculateSkyFlux', () => {
  it('returns higher flux for brighter skies (higher Bortle)', () => {
    const fluxBortle3 = calculateSkyFlux(3);
    const fluxBortle7 = calculateSkyFlux(7);
    expect(fluxBortle7).toBeGreaterThan(fluxBortle3);
  });

  it('returns positive values for all Bortle levels', () => {
    for (let b = 1; b <= 9; b++) {
      expect(calculateSkyFlux(b)).toBeGreaterThan(0);
    }
  });

  it('returns lower flux for narrowband filters', () => {
    const broadband = calculateSkyFlux(5, 5, 3.76, 400, false);
    const narrowband = calculateSkyFlux(5, 5, 3.76, 400, true);
    expect(narrowband).toBeLessThan(broadband);
    expect(narrowband).toBeCloseTo(broadband * 0.05, 5);
  });

  it('returns higher flux for faster f-ratios', () => {
    const f5 = calculateSkyFlux(5, 5);
    const f10 = calculateSkyFlux(5, 10);
    expect(f5).toBeGreaterThan(f10);
  });

  it('returns higher flux for larger pixels', () => {
    const smallPx = calculateSkyFlux(5, 5, 2.0, 400);
    const largePx = calculateSkyFlux(5, 5, 5.0, 400);
    expect(largePx).toBeGreaterThan(smallPx);
  });

  it('handles edge case with Bortle out of range', () => {
    expect(calculateSkyFlux(0)).toBeGreaterThan(0);
    expect(calculateSkyFlux(10)).toBeGreaterThan(0);
  });
});

// ============================================================================
// estimateReadNoise
// ============================================================================

describe('estimateReadNoise', () => {
  it('returns 5.0 for gain 0', () => {
    expect(estimateReadNoise(0)).toBe(5.0);
  });

  it('decreases with increasing gain up to 100', () => {
    const rn0 = estimateReadNoise(0);
    const rn50 = estimateReadNoise(50);
    const rn100 = estimateReadNoise(100);
    expect(rn50).toBeLessThan(rn0);
    expect(rn100).toBeLessThan(rn50);
  });

  it('returns at least 1.0 for any gain', () => {
    expect(estimateReadNoise(0)).toBeGreaterThanOrEqual(1.0);
    expect(estimateReadNoise(100)).toBeGreaterThanOrEqual(1.0);
    expect(estimateReadNoise(300)).toBeGreaterThanOrEqual(1.0);
    expect(estimateReadNoise(500)).toBeGreaterThanOrEqual(1.0);
  });

  it('handles negative gain gracefully', () => {
    expect(estimateReadNoise(-10)).toBe(5.0);
  });
});

// ============================================================================
// calculateSNR
// ============================================================================

describe('calculateSNR', () => {
  it('returns positive SNR for valid inputs', () => {
    const snr = calculateSNR(120, 100, 5, false);
    expect(snr).toBeGreaterThan(0);
  });

  it('increases with longer exposure time', () => {
    const snr30 = calculateSNR(30, 100, 5, false);
    const snr120 = calculateSNR(120, 100, 5, false);
    const snr300 = calculateSNR(300, 100, 5, false);
    expect(snr120).toBeGreaterThan(snr30);
    expect(snr300).toBeGreaterThan(snr120);
  });

  it('is lower for narrowband filters', () => {
    const broadband = calculateSNR(120, 100, 5, false);
    const narrowband = calculateSNR(120, 100, 5, true);
    expect(narrowband).toBeLessThan(broadband);
  });

  it('is affected by Bortle scale', () => {
    const darkSky = calculateSNR(120, 100, 2, false);
    const citySky = calculateSNR(120, 100, 8, false);
    // Different Bortle values give different SNR
    expect(darkSky).not.toBeCloseTo(citySky, 1);
  });

  it('accepts optional f-ratio and pixel size', () => {
    const snrDefault = calculateSNR(120, 100, 5, false);
    const snrWithParams = calculateSNR(120, 100, 5, false, 7, 4.5);
    // Different optics should give different SNR
    expect(snrWithParams).not.toBeCloseTo(snrDefault, 1);
  });

  it('accepts optional read noise override', () => {
    const snrAutoRN = calculateSNR(120, 100, 5, false);
    const snrHighRN = calculateSNR(120, 100, 5, false, undefined, undefined, 10);
    expect(snrHighRN).toBeLessThan(snrAutoRN);
  });

  it('returns 0 for zero exposure time', () => {
    expect(calculateSNR(0, 100, 5, false)).toBe(0);
  });
});

// ============================================================================
// calculateSNRFull
// ============================================================================

describe('calculateSNRFull', () => {
  it('produces same result as calculateSNR', () => {
    const snr1 = calculateSNR(120, 100, 5, false, 7, 4.5);
    const snr2 = calculateSNRFull({
      exposureTime: 120,
      gain: 100,
      bortle: 5,
      isNarrowband: false,
      fRatio: 7,
      pixelSize: 4.5,
    });
    expect(snr2).toBeCloseTo(snr1, 10);
  });
});

// ============================================================================
// calculateOptimalSubExposure
// ============================================================================

describe('calculateOptimalSubExposure', () => {
  it('returns three exposure levels in correct order', () => {
    const result = calculateOptimalSubExposure(5);
    expect(result.aggressive).toBeLessThanOrEqual(result.balanced);
    expect(result.balanced).toBeLessThanOrEqual(result.conservative);
  });

  it('returns positive values', () => {
    const result = calculateOptimalSubExposure(5);
    expect(result.aggressive).toBeGreaterThanOrEqual(1);
    expect(result.balanced).toBeGreaterThanOrEqual(1);
    expect(result.conservative).toBeGreaterThanOrEqual(1);
  });

  it('recommends shorter exposures for brighter skies', () => {
    const dark = calculateOptimalSubExposure(2);
    const bright = calculateOptimalSubExposure(7);
    expect(bright.balanced).toBeLessThan(dark.balanced);
  });

  it('recommends longer exposures for narrowband', () => {
    const broadband = calculateOptimalSubExposure(5, 5, 3.76, 400, false);
    const narrowband = calculateOptimalSubExposure(5, 5, 3.76, 400, true);
    expect(narrowband.balanced).toBeGreaterThan(broadband.balanced);
  });

  it('includes sky flux and read noise info', () => {
    const result = calculateOptimalSubExposure(5);
    expect(result.skyFluxPerPixel).toBeGreaterThan(0);
    expect(result.readNoiseUsed).toBeGreaterThan(0);
  });

  it('clamps values to reasonable range', () => {
    const result = calculateOptimalSubExposure(1, 5, 3.76, 400, true);
    expect(result.conservative).toBeLessThanOrEqual(3600);
    expect(result.balanced).toBeLessThanOrEqual(1800);
    expect(result.aggressive).toBeLessThanOrEqual(900);
  });

  it('accepts custom read noise', () => {
    const autoRN = calculateOptimalSubExposure(5, 5, 3.76, 400, false, undefined, 100);
    const highRN = calculateOptimalSubExposure(5, 5, 3.76, 400, false, 8.0, 100);
    expect(highRN.balanced).toBeGreaterThan(autoRN.balanced);
  });
});

// ============================================================================
// estimateFileSize
// ============================================================================

describe('estimateFileSize', () => {
  it('returns positive file size', () => {
    expect(estimateFileSize('1x1')).toBeGreaterThan(0);
  });

  it('decreases with higher binning', () => {
    const bin1 = estimateFileSize('1x1');
    const bin2 = estimateFileSize('2x2');
    const bin4 = estimateFileSize('4x4');
    expect(bin2).toBeLessThan(bin1);
    expect(bin4).toBeLessThan(bin2);
    // 2x2 binning should be ~1/4 of 1x1
    expect(bin2).toBeCloseTo(bin1 / 4, 1);
  });

  it('uses custom dimensions', () => {
    const defaultSize = estimateFileSize('1x1', 16, 4656, 3520);
    const smallSensor = estimateFileSize('1x1', 16, 1920, 1080);
    expect(smallSensor).toBeLessThan(defaultSize);
  });

  it('scales with bit depth', () => {
    const bit8 = estimateFileSize('1x1', 8, 1000, 1000);
    const bit16 = estimateFileSize('1x1', 16, 1000, 1000);
    expect(bit16).toBeCloseTo(bit8 * 2, 5);
  });
});

// ============================================================================
// estimateSessionTime
// ============================================================================

describe('estimateSessionTime', () => {
  it('calculates basic imaging time', () => {
    const result = estimateSessionTime(120, 30);
    expect(result.imagingMinutes).toBe(60); // 120s * 30 / 60
  });

  it('includes download overhead', () => {
    const result = estimateSessionTime(120, 30, false, 3, 5);
    expect(result.overheadMinutes).toBeGreaterThan(0);
    expect(result.totalMinutes).toBeGreaterThan(result.imagingMinutes);
  });

  it('includes dither overhead when enabled', () => {
    const noDither = estimateSessionTime(120, 30, false);
    const withDither = estimateSessionTime(120, 30, true, 3);
    expect(withDither.overheadMinutes).toBeGreaterThan(noDither.overheadMinutes);
  });

  it('totalMinutes = imagingMinutes + overheadMinutes', () => {
    const result = estimateSessionTime(120, 30, true, 3, 5);
    expect(result.totalMinutes).toBeCloseTo(result.imagingMinutes + result.overheadMinutes, 10);
  });

  it('handles zero frames', () => {
    const result = estimateSessionTime(120, 0);
    expect(result.imagingMinutes).toBe(0);
    expect(result.totalMinutes).toBe(0);
  });

  it('handles dither disabled', () => {
    const result = estimateSessionTime(120, 30, false, 3);
    // Only download overhead, no dither overhead
    const downloadOnly = (5 * 30) / 60;
    expect(result.overheadMinutes).toBeCloseTo(downloadOnly, 5);
  });
});
