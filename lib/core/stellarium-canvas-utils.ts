// ============================================================================
// Stellarium Canvas Utilities
// ============================================================================

import { unifiedCache } from '@/lib/offline';
import { WASM_PATH } from './constants/stellarium-canvas';

/** Timeout wrapper for promises */
export const withTimeout = <T,>(promise: Promise<T>, ms: number, message: string): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
};

/** Prefetch WASM into cache for faster subsequent loads */
export const prefetchWasm = async (): Promise<boolean> => {
  try {
    // Use unified cache to prefetch WASM file
    const response = await unifiedCache.fetch(WASM_PATH, {}, 'cache-first');
    return response.ok;
  } catch {
    return false;
  }
};

// FOV conversion utilities (engine uses radians internally)
export const fovToRad = (deg: number): number => deg * (Math.PI / 180);
export const fovToDeg = (rad: number): number => rad * (180 / Math.PI);

/**
 * Calculate the maximum device pixel ratio based on render quality setting.
 * Used by both the Stellarium canvas ResizeObserver and initial loader setup.
 */
export function getMaxDprForQuality(renderQuality: string): number {
  switch (renderQuality) {
    case 'low': return 1;
    case 'medium': return 1.5;
    case 'high': return 2;
    default: return Infinity; // 'ultra' or unknown → no cap
  }
}

/**
 * Compute the effective DPR clamped by render quality.
 */
export function getEffectiveDpr(renderQuality: string): number {
  return Math.min(window.devicePixelRatio || 1, getMaxDprForQuality(renderQuality));
}
