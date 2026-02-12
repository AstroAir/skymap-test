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
