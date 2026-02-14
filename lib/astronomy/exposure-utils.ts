/**
 * Exposure calculation utilities
 * Extracted from components/starmap/planning/exposure-calculator.tsx
 */

import { BORTLE_SCALE } from '@/lib/core/constants/bortle-scale';

// ============================================================================
// Types
// ============================================================================

export interface SNRParams {
  exposureTime: number;
  gain: number;
  bortle: number;
  isNarrowband: boolean;
  fRatio?: number;
  pixelSize?: number;
  readNoise?: number;
  darkCurrent?: number;
  focalLength?: number;
}

export interface OptimalSubExposureResult {
  conservative: number;
  balanced: number;
  aggressive: number;
  skyFluxPerPixel: number;
  readNoiseUsed: number;
}

// ============================================================================
// Sky Flux Calculation
// ============================================================================

/**
 * Calculate sky flux per pixel per second (e-/pixel/s) from Bortle/SQM + optics
 * Uses the standard formula: sky_e = 10^((SQM_ref - SQM) / 2.5) × (pixelScale)² / f²
 * Normalized so that Bortle 5 suburban sky gives ~1 e-/pixel/s at f/5, 2"/px
 */
export function calculateSkyFlux(
  bortle: number,
  fRatio: number = 5,
  pixelSizeUm: number = 3.76,
  focalLengthMm: number = 400,
  isNarrowband: boolean = false
): number {
  const bortleEntry = BORTLE_SCALE.find(b => b.value === bortle);
  const sqm = bortleEntry?.sqm ?? 20.49;

  const pixelScaleArcsec = (206.265 * pixelSizeUm) / focalLengthMm;
  const pixelAreaArcsec2 = pixelScaleArcsec * pixelScaleArcsec;

  const sqmRef = 22.0;
  const surfaceBrightnessFactor = Math.pow(10, (sqmRef - sqm) / 2.5);

  const fRatioRef = 5.0;
  const fRatioFactor = (fRatioRef * fRatioRef) / (fRatio * fRatio);

  const pixelAreaRef = 4.0;
  const pixelAreaFactor = pixelAreaArcsec2 / pixelAreaRef;

  let skyFlux = surfaceBrightnessFactor * fRatioFactor * pixelAreaFactor;

  if (isNarrowband) {
    skyFlux *= 0.05;
  }

  return Math.max(0.001, skyFlux);
}

// ============================================================================
// SNR Calculation
// ============================================================================

/**
 * Estimate read noise from gain setting (simplified CMOS model)
 * Real cameras: read noise drops rapidly at unity gain then levels off
 */
export function estimateReadNoise(gain: number): number {
  if (gain <= 0) return 5.0;
  if (gain <= 100) return 5.0 - (gain / 100) * 3.5;
  return Math.max(1.0, 1.5 - ((gain - 100) / 200) * 0.5);
}

/**
 * SNR estimation using standard CCD/CMOS equation
 * SNR = Signal / √(Signal + Sky + Dark + ReadNoise²)
 *
 * Improved model that accounts for:
 * - Sky flux from Bortle/SQM + pixel scale + f-ratio
 * - Read noise estimated from gain (or user-provided)
 * - Optional dark current
 * - Narrowband filter attenuation
 */
export function calculateSNR(
  exposureTime: number,
  gain: number,
  bortle: number,
  isNarrowband: boolean,
  fRatio?: number,
  pixelSize?: number,
  readNoise?: number,
  darkCurrent?: number,
  focalLength?: number
): number {
  const rn = readNoise ?? estimateReadNoise(gain);

  const effectiveFRatio = fRatio ?? 5;
  const effectivePixelSize = pixelSize ?? 3.76;
  const effectiveFocalLength = focalLength ?? effectiveFRatio * 80; // default ~400mm

  const skyFlux = calculateSkyFlux(
    bortle,
    effectiveFRatio,
    effectivePixelSize,
    effectiveFocalLength,
    isNarrowband
  );

  const signalRate = isNarrowband ? 0.3 : 1.0;
  const signal = signalRate * exposureTime;
  const sky = skyFlux * exposureTime;
  const dark = (darkCurrent ?? 0.002) * exposureTime;

  const totalNoiseSq = signal + sky + dark + rn * rn;
  if (totalNoiseSq <= 0) return 0;

  return signal / Math.sqrt(totalNoiseSq);
}

/**
 * Calculate SNR with full params object
 */
export function calculateSNRFull(params: SNRParams): number {
  return calculateSNR(
    params.exposureTime,
    params.gain,
    params.bortle,
    params.isNarrowband,
    params.fRatio,
    params.pixelSize,
    params.readNoise,
    params.darkCurrent,
    params.focalLength
  );
}

// ============================================================================
// Optimal Sub-Exposure Calculation
// ============================================================================

/**
 * Calculate optimal sub-exposure time using Robin Glover / SharpCap formula
 * t_opt = C × ReadNoise² / SkyFlux_per_pixel
 *
 * C is the noise tolerance factor:
 * - Conservative (C=25): read noise contributes < 2% of total noise
 * - Balanced (C=10): read noise contributes < 5% of total noise
 * - Aggressive (C=5): read noise contributes < 10% of total noise
 *
 * @returns Optimal sub-exposure times in seconds for three tolerance levels
 */
export function calculateOptimalSubExposure(
  bortle: number,
  fRatio: number = 5,
  pixelSizeUm: number = 3.76,
  focalLengthMm: number = 400,
  isNarrowband: boolean = false,
  readNoise?: number,
  gain: number = 100
): OptimalSubExposureResult {
  const rn = readNoise ?? estimateReadNoise(gain);
  const skyFlux = calculateSkyFlux(bortle, fRatio, pixelSizeUm, focalLengthMm, isNarrowband);

  const rnSquared = rn * rn;

  const conservative = Math.round((25 * rnSquared) / skyFlux);
  const balanced = Math.round((10 * rnSquared) / skyFlux);
  const aggressive = Math.round((5 * rnSquared) / skyFlux);

  return {
    conservative: Math.max(1, Math.min(conservative, 3600)),
    balanced: Math.max(1, Math.min(balanced, 1800)),
    aggressive: Math.max(1, Math.min(aggressive, 900)),
    skyFluxPerPixel: skyFlux,
    readNoiseUsed: rn,
  };
}

// ============================================================================
// File Size Estimation
// ============================================================================

/**
 * Estimate file size in MB for a single frame
 */
export function estimateFileSize(
  binning: string,
  bitDepth: number = 16,
  width: number = 4656,
  height: number = 3520
): number {
  const binFactor = parseInt(binning.charAt(0)) || 1;
  const effectiveWidth = width / binFactor;
  const effectiveHeight = height / binFactor;
  const bytesPerPixel = bitDepth / 8;
  return (effectiveWidth * effectiveHeight * bytesPerPixel) / (1024 * 1024);
}

// ============================================================================
// Session Time Estimation
// ============================================================================

/**
 * Estimate total session time including overhead
 * @returns Total session time in minutes
 */
export function estimateSessionTime(
  exposureTimeSec: number,
  frameCount: number,
  ditherEnabled: boolean = false,
  ditherEvery: number = 3,
  downloadTimeSec: number = 5
): {
  imagingMinutes: number;
  overheadMinutes: number;
  totalMinutes: number;
} {
  const imagingMinutes = (exposureTimeSec * frameCount) / 60;

  const downloadOverhead = (downloadTimeSec * frameCount) / 60;

  let ditherOverhead = 0;
  if (ditherEnabled && ditherEvery > 0) {
    const ditherCount = Math.floor(frameCount / ditherEvery);
    ditherOverhead = (ditherCount * 15) / 60;
  }

  const overheadMinutes = downloadOverhead + ditherOverhead;

  return {
    imagingMinutes,
    overheadMinutes,
    totalMinutes: imagingMinutes + overheadMinutes,
  };
}
