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

export type GainStrategy = 'unity' | 'max_dynamic_range' | 'manual';

export interface CameraNoiseProfile {
  readNoise?: number;
  darkCurrent?: number;
  fullWell?: number;
  qe?: number;
  bitDepth?: number;
  ePerAdu?: number;
  gain?: number;
}

export interface SkyModelInput {
  bortle?: number;
  sqm?: number;
  filterBandwidthNm?: number;
  skyFluxOverride?: number;
  isNarrowband?: boolean;
  fRatio?: number;
  pixelSize?: number;
  focalLength?: number;
  targetSurfaceBrightness?: number;
  targetSignalRate?: number;
}

export interface SmartExposureInput {
  camera?: CameraNoiseProfile;
  sky: SkyModelInput;
  readNoiseLimitPercent?: number;
  gainStrategy?: GainStrategy;
  manualGain?: number;
  minExposureSec?: number;
  maxExposureSec?: number;
  targetSNR?: number;
  targetTimeNoiseRatio?: number;
}

export interface SmartExposureNoiseBreakdown {
  readNoise: number;
  skyNoise: number;
  darkNoise: number;
  totalNoise: number;
  readFraction: number;
  skyFraction: number;
  darkFraction: number;
}

export interface SmartExposureStackEstimate {
  perFrameSNR: number;
  perFrameTimeNoiseRatio: number;
  targetSNR?: number;
  targetTimeNoiseRatio: number;
  framesForTargetSNR?: number;
  framesForTimeNoise: number;
  recommendedFrameCount: number;
  estimatedTotalMinutes: number;
}

export interface SmartExposureResult {
  recommendedExposureSec: number;
  recommendedGain: number;
  gainStrategyUsed: GainStrategy;
  recommendedGainReason: string;
  exposureRangeSec: {
    min: number;
    max: number;
  };
  skyFluxPerPixel: number;
  targetSignalPerPixelPerSec: number;
  readNoiseLimitPercent: number;
  readNoiseUsed: number;
  darkCurrentUsed: number;
  qeUsed: number;
  dynamicRangeScore: number;
  dynamicRangeStops: number;
  electronsPerAdu: number;
  noiseBreakdown: SmartExposureNoiseBreakdown;
  constraintHits: string[];
  stackEstimate: SmartExposureStackEstimate;
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

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getSqmValue(bortle?: number, sqmOverride?: number): number {
  if (typeof sqmOverride === 'number' && Number.isFinite(sqmOverride)) {
    return sqmOverride;
  }

  const normalizedBortle = clamp(Math.round(bortle ?? 5), 1, 9);
  const bortleEntry = BORTLE_SCALE.find((entry) => entry.value === normalizedBortle);
  return bortleEntry?.sqm ?? 20.49;
}

export function calculateSkyFluxFromSqm(
  sqm: number,
  fRatio: number = 5,
  pixelSizeUm: number = 3.76,
  _focalLengthMm: number = 400,
  filterBandwidthNm: number = 300
): number {
  // KStars/SharpCap-aligned approach:
  // 1) Convert SQM to base e-/s for a 1um pixel at f/1
  //    rate = A * exp(B * SQM), A=1009110388.7838, B=-0.921471...
  // 2) Scale by pixel area and focal ratio:
  //    rate_scaled = rate * pixelSize^2 * (1 / fRatio^2)
  // 3) Apply filter bandwidth factor (300nm broadband reference)
  //
  // This keeps sky flux physically tied to sensor pixel area + focal ratio,
  // and avoids making it depend on focal length directly.
  const sqmClamped = clamp(sqm, 16, 23);
  const baseRateFor1umAtF1 = 1009110388.7838 * Math.exp(-0.921471189594521 * sqmClamped);
  const pixelAreaFactor = Math.max(0.25, pixelSizeUm * pixelSizeUm);
  const fRatioFactor = 1 / Math.max(1, fRatio * fRatio);
  const normalizedBandwidth = clamp(filterBandwidthNm, 2, 300);
  const bandwidthFactor = normalizedBandwidth / 300;

  return Math.max(0.001, baseRateFor1umAtF1 * pixelAreaFactor * fRatioFactor * bandwidthFactor);
}

function estimateElectronsPerAdu(gain: number): number {
  return Math.max(0.1, 4 / (1 + gain / 33.333));
}

function estimateTargetSignalRate(
  targetSignalRate: number | undefined,
  targetSurfaceBrightness: number | undefined,
  sqm: number,
  skyFluxPerPixel: number,
  qe: number
): number {
  if (typeof targetSignalRate === 'number' && targetSignalRate > 0) {
    return targetSignalRate;
  }

  if (typeof targetSurfaceBrightness === 'number' && Number.isFinite(targetSurfaceBrightness)) {
    const relativeFactor = Math.pow(10, -0.4 * (targetSurfaceBrightness - sqm));
    return Math.max(0.0001, skyFluxPerPixel * relativeFactor * qe);
  }

  return Math.max(0.0001, 0.25 * qe);
}

interface SmartCandidate {
  gain: number;
  exposureSec: number;
  readNoise: number;
  darkCurrent: number;
  qe: number;
  skyFlux: number;
  targetSignalRate: number;
  signal: number;
  sky: number;
  dark: number;
  noiseSquared: number;
  totalNoise: number;
  readFraction: number;
  skyFraction: number;
  darkFraction: number;
  dynamicRangeScore: number;
  dynamicRangeStops: number;
  electronsPerAdu: number;
  readNoiseLimitedExposure: number;
  constraints: string[];
  score: number;
}

function evaluateSmartCandidate(
  gain: number,
  input: SmartExposureInput,
  minExposureSec: number,
  maxExposureSec: number,
  readNoiseLimitRatio: number,
  skyFluxPerPixel: number,
  sqm: number
): SmartCandidate {
  const readNoise = input.camera?.readNoise ?? estimateReadNoise(gain);
  const darkCurrent = input.camera?.darkCurrent ?? 0.002;
  const qe = clamp(input.camera?.qe ?? 0.8, 0.05, 1);

  const denominator = skyFluxPerPixel * (Math.pow(1 + readNoiseLimitRatio, 2) - 1);
  const readNoiseLimitedExposure = denominator > 0 ? (readNoise * readNoise) / denominator : maxExposureSec;
  const exposureSec = clamp(readNoiseLimitedExposure, minExposureSec, maxExposureSec);

  const targetSignalRate = estimateTargetSignalRate(
    input.sky.targetSignalRate,
    input.sky.targetSurfaceBrightness,
    sqm,
    skyFluxPerPixel,
    qe
  );

  const signal = targetSignalRate * exposureSec;
  const sky = skyFluxPerPixel * exposureSec;
  const dark = darkCurrent * exposureSec;
  const noiseSquared = signal + sky + dark + readNoise * readNoise;
  const totalNoise = Math.sqrt(Math.max(noiseSquared, 0.000001));

  const readFraction = (readNoise * readNoise) / noiseSquared;
  const skyFraction = sky / noiseSquared;
  const darkFraction = dark / noiseSquared;

  const fullWell = Math.max(1000, input.camera?.fullWell ?? 50000);
  const effectiveFullWell = fullWell * Math.max(0.25, 1 - gain / 500);
  const noiseFloor = Math.max(readNoise, Math.sqrt(readNoise * readNoise + dark));
  const dynamicRangeScore = effectiveFullWell / Math.max(noiseFloor, 0.000001);
  const dynamicRangeStops = Math.log2(Math.max(dynamicRangeScore, 1));

  const electronsPerAdu = input.camera?.ePerAdu ?? estimateElectronsPerAdu(gain);

  const constraints: string[] = [];
  if (readNoiseLimitedExposure < minExposureSec) constraints.push('min_exposure_limit');
  if (readNoiseLimitedExposure > maxExposureSec) constraints.push('max_exposure_limit');

  return {
    gain,
    exposureSec,
    readNoise,
    darkCurrent,
    qe,
    skyFlux: skyFluxPerPixel,
    targetSignalRate,
    signal,
    sky,
    dark,
    noiseSquared,
    totalNoise,
    readFraction,
    skyFraction,
    darkFraction,
    dynamicRangeScore,
    dynamicRangeStops,
    electronsPerAdu,
    readNoiseLimitedExposure,
    constraints,
    score: 0,
  };
}

function scoreSmartCandidate(candidate: SmartCandidate, strategy: GainStrategy): number {
  const timeNoiseRatio = candidate.exposureSec / candidate.totalNoise;
  const skyDominanceBonus = (1 - candidate.readFraction) * 20;

  if (strategy === 'unity') {
    const unityDistance = Math.abs(candidate.electronsPerAdu - 1);
    return 200 - unityDistance * 140 + skyDominanceBonus + timeNoiseRatio + candidate.dynamicRangeStops;
  }

  if (strategy === 'max_dynamic_range') {
    return candidate.dynamicRangeStops * 25 + skyDominanceBonus + timeNoiseRatio * 0.6;
  }

  return candidate.dynamicRangeStops * 5 + skyDominanceBonus + timeNoiseRatio;
}

function getCandidateGains(strategy: GainStrategy, manualGain?: number): number[] {
  if (strategy === 'manual') {
    return [clamp(Math.round(manualGain ?? 100), 0, 300)];
  }

  return [0, 25, 50, 75, 100, 125, 150, 200, 250, 300];
}

export function calculateSmartExposure(input: SmartExposureInput): SmartExposureResult {
  const strategy = input.gainStrategy ?? 'unity';

  const readNoiseLimitPercent = clamp(input.readNoiseLimitPercent ?? 5, 2, 20);
  const readNoiseLimitRatio = readNoiseLimitPercent / 100;

  const minExposureSec = clamp(input.minExposureSec ?? 5, 1, 3600);
  const maxExposureSec = clamp(input.maxExposureSec ?? 600, minExposureSec, 3600);

  const sqm = getSqmValue(input.sky.bortle, input.sky.sqm);
  const fRatio = input.sky.fRatio ?? 5;
  const pixelSize = input.sky.pixelSize ?? 3.76;
  const focalLength = input.sky.focalLength ?? fRatio * 80;
  const defaultBandwidth = input.sky.isNarrowband ? 7 : 300;
  const filterBandwidthNm = input.sky.filterBandwidthNm ?? defaultBandwidth;
  const qeForSky = clamp(input.camera?.qe ?? 0.8, 0.05, 1);

  const skyFluxPerPixelBase =
    input.sky.skyFluxOverride && input.sky.skyFluxOverride > 0
      ? input.sky.skyFluxOverride
      : calculateSkyFluxFromSqm(sqm, fRatio, pixelSize, focalLength, filterBandwidthNm);
  const skyFluxPerPixel = Math.max(0.0001, skyFluxPerPixelBase * qeForSky);

  const candidates = getCandidateGains(strategy, input.manualGain).map((gain) => {
    const candidate = evaluateSmartCandidate(
      gain,
      input,
      minExposureSec,
      maxExposureSec,
      readNoiseLimitRatio,
      skyFluxPerPixel,
      sqm
    );
    return {
      ...candidate,
      score: scoreSmartCandidate(candidate, strategy),
    };
  });

  const selected = candidates.reduce((best, current) => (current.score > best.score ? current : best));

  const perFrameSNR = selected.signal / selected.totalNoise;
  const perFrameTimeNoiseRatio = selected.exposureSec / selected.totalNoise;

  const targetTimeNoiseRatio = Math.max(1, input.targetTimeNoiseRatio ?? 80);
  const framesForTimeNoise = Math.max(
    1,
    Math.ceil(Math.pow(targetTimeNoiseRatio / Math.max(perFrameTimeNoiseRatio, 0.00001), 2))
  );

  const targetSNR = input.targetSNR && input.targetSNR > 0 ? input.targetSNR : undefined;
  const framesForTargetSNR =
    typeof targetSNR === 'number'
      ? Math.max(1, Math.ceil(Math.pow(targetSNR / Math.max(perFrameSNR, 0.00001), 2)))
      : undefined;

  const recommendedFrameCount = Math.max(framesForTimeNoise, framesForTargetSNR ?? 1);
  const estimatedTotalMinutes = (recommendedFrameCount * selected.exposureSec) / 60;

  const recommendedGainReason =
    strategy === 'manual'
      ? 'Manual gain selected; exposure optimized under current read-noise limit.'
      : strategy === 'unity'
        ? 'Gain selected closest to unity conversion while preserving stack efficiency.'
        : 'Gain selected for highest stacked dynamic range within exposure constraints.';

  const strategyConstraint =
    strategy === 'manual'
      ? 'manual_gain'
      : strategy === 'unity'
        ? 'unity_gain'
        : 'max_dynamic_range';

  return {
    recommendedExposureSec: selected.exposureSec,
    recommendedGain: selected.gain,
    gainStrategyUsed: strategy,
    recommendedGainReason,
    exposureRangeSec: {
      min: minExposureSec,
      max: maxExposureSec,
    },
    skyFluxPerPixel,
    targetSignalPerPixelPerSec: selected.targetSignalRate,
    readNoiseLimitPercent,
    readNoiseUsed: selected.readNoise,
    darkCurrentUsed: selected.darkCurrent,
    qeUsed: selected.qe,
    dynamicRangeScore: selected.dynamicRangeScore,
    dynamicRangeStops: selected.dynamicRangeStops,
    electronsPerAdu: selected.electronsPerAdu,
    noiseBreakdown: {
      readNoise: selected.readNoise,
      skyNoise: Math.sqrt(selected.sky),
      darkNoise: Math.sqrt(selected.dark),
      totalNoise: selected.totalNoise,
      readFraction: selected.readFraction,
      skyFraction: selected.skyFraction,
      darkFraction: selected.darkFraction,
    },
    constraintHits: ['read_noise_limited', ...selected.constraints, strategyConstraint],
    stackEstimate: {
      perFrameSNR,
      perFrameTimeNoiseRatio,
      targetSNR,
      targetTimeNoiseRatio,
      framesForTargetSNR,
      framesForTimeNoise,
      recommendedFrameCount,
      estimatedTotalMinutes,
    },
  };
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
