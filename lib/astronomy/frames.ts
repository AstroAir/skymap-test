import type {
  AstronomicalFrame,
  CoordinateMetadata,
  CoordinateQualityFlag,
  EopFreshness,
  TimeScale,
} from '@/lib/core/types/astronomy';

export function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360;
}

export function normalizeHourAngle(value: number): number {
  let normalized = normalizeDegrees(value);
  if (normalized > 180) normalized -= 360;
  return normalized;
}

export function clampDeclination(decDeg: number): number {
  return Math.max(-90, Math.min(90, decDeg));
}

export function createCoordinateMetadata(params: {
  frame: AstronomicalFrame;
  epochJd: number;
  timeScale: TimeScale;
  qualityFlag: CoordinateQualityFlag;
  dataFreshness: EopFreshness;
  source: 'calculation' | 'engine';
}): CoordinateMetadata {
  return {
    ...params,
    generatedAt: new Date().toISOString(),
  };
}
