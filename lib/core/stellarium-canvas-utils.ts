// ============================================================================
// Stellarium Canvas Utilities
// ============================================================================

import { WASM_PATH } from './constants/stellarium-canvas';

/** Timeout wrapper for promises */
export const withTimeout = <T,>(promise: Promise<T>, ms: number, message: string): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
};

/** Prefetch WASM into browser cache for faster subsequent loads.
 *  Uses the original (non-intercepted) fetch so the browser can cache the
 *  compiled WASM module natively via V8/SpiderMonkey code caching. */
export const prefetchWasm = async (): Promise<boolean> => {
  try {
    const fetchFn = typeof window !== 'undefined' && (window as unknown as { __originalFetch?: typeof fetch }).__originalFetch
      ? (window as unknown as { __originalFetch: typeof fetch }).__originalFetch
      : fetch;
    const response = await fetchFn(WASM_PATH, { credentials: 'same-origin' });
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
