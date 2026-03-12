import type { AlmanacResponse, RiseTransitSetResponse } from './types';

export interface EngineParityTolerance {
  angleDeg: number;
  durationSeconds: number;
  hours: number;
  phaseFraction: number;
  illuminationPercent: number;
}

export const ENGINE_PARITY_TOLERANCE: EngineParityTolerance = {
  angleDeg: 0.75,
  durationSeconds: 90,
  hours: 0.05,
  phaseFraction: 0.03,
  illuminationPercent: 3,
};

function closeNumber(left: number, right: number, tolerance: number): boolean {
  return Math.abs(left - right) <= tolerance;
}

function closeDate(left: Date | null, right: Date | null, toleranceSeconds: number): boolean {
  if (!left && !right) return true;
  if (!left || !right) return false;
  return Math.abs(left.getTime() - right.getTime()) <= toleranceSeconds * 1000;
}

export function compareRiseTransitSetParity(
  tauri: RiseTransitSetResponse,
  fallback: RiseTransitSetResponse,
  tolerance: EngineParityTolerance = ENGINE_PARITY_TOLERANCE
): string[] {
  const mismatches: string[] = [];

  if (!closeDate(tauri.riseTime, fallback.riseTime, tolerance.durationSeconds)) mismatches.push('riseTime');
  if (!closeDate(tauri.transitTime, fallback.transitTime, tolerance.durationSeconds)) mismatches.push('transitTime');
  if (!closeDate(tauri.setTime, fallback.setTime, tolerance.durationSeconds)) mismatches.push('setTime');
  if (!closeNumber(tauri.transitAltitude, fallback.transitAltitude, tolerance.angleDeg)) mismatches.push('transitAltitude');
  if (!closeNumber(tauri.currentAltitude, fallback.currentAltitude, tolerance.angleDeg)) mismatches.push('currentAltitude');
  if (!closeNumber(tauri.currentAzimuth, fallback.currentAzimuth, tolerance.angleDeg)) mismatches.push('currentAzimuth');
  if (!closeNumber(tauri.darkImagingHours, fallback.darkImagingHours, tolerance.hours)) mismatches.push('darkImagingHours');
  if (tauri.isCircumpolar !== fallback.isCircumpolar) mismatches.push('isCircumpolar');
  if (tauri.neverRises !== fallback.neverRises) mismatches.push('neverRises');

  return mismatches;
}

export function compareAlmanacParity(
  tauri: AlmanacResponse,
  fallback: AlmanacResponse,
  tolerance: EngineParityTolerance = ENGINE_PARITY_TOLERANCE
): string[] {
  const mismatches: string[] = [];

  if (!closeNumber(tauri.sun.ra, fallback.sun.ra, tolerance.angleDeg)) mismatches.push('sun.ra');
  if (!closeNumber(tauri.sun.dec, fallback.sun.dec, tolerance.angleDeg)) mismatches.push('sun.dec');
  if (!closeNumber(tauri.sun.altitude, fallback.sun.altitude, tolerance.angleDeg)) mismatches.push('sun.altitude');
  if (!closeNumber(tauri.sun.azimuth, fallback.sun.azimuth, tolerance.angleDeg)) mismatches.push('sun.azimuth');

  if (!closeNumber(tauri.moon.ra, fallback.moon.ra, tolerance.angleDeg)) mismatches.push('moon.ra');
  if (!closeNumber(tauri.moon.dec, fallback.moon.dec, tolerance.angleDeg)) mismatches.push('moon.dec');
  if (!closeNumber(tauri.moon.altitude, fallback.moon.altitude, tolerance.angleDeg)) mismatches.push('moon.altitude');
  if (!closeNumber(tauri.moon.azimuth, fallback.moon.azimuth, tolerance.angleDeg)) mismatches.push('moon.azimuth');
  if (!closeNumber(tauri.moon.phase, fallback.moon.phase, tolerance.phaseFraction)) mismatches.push('moon.phase');
  if (!closeNumber(tauri.moon.illumination, fallback.moon.illumination, tolerance.illuminationPercent)) mismatches.push('moon.illumination');
  if (!closeDate(tauri.moon.riseTime, fallback.moon.riseTime, tolerance.durationSeconds)) mismatches.push('moon.riseTime');
  if (!closeDate(tauri.moon.setTime, fallback.moon.setTime, tolerance.durationSeconds)) mismatches.push('moon.setTime');

  return mismatches;
}
