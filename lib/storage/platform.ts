/**
 * Platform detection utilities
 * Detects whether the app is running in a Tauri desktop environment or a web browser
 */

/**
 * Check if the app is running in a Tauri environment
 */
export function isTauri(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return '__TAURI__' in window || '__TAURI_INTERNALS__' in window;
}

/**
 * Check if the app is running in a web browser (not Tauri)
 */
export function isWeb(): boolean {
  return !isTauri();
}

/**
 * Check if running on the server (SSR)
 */
export function isServer(): boolean {
  return typeof window === 'undefined';
}

/**
 * Get the current platform type
 */
export type Platform = 'tauri' | 'web' | 'server';

export function getPlatform(): Platform {
  if (isServer()) {
    return 'server';
  }
  if (isTauri()) {
    return 'tauri';
  }
  return 'web';
}

/**
 * Execute a function only in Tauri environment
 */
export async function onlyInTauri<T>(fn: () => Promise<T>): Promise<T | null> {
  if (isTauri()) {
    return fn();
  }
  return null;
}

/**
 * Execute a function only in web environment
 */
export async function onlyInWeb<T>(fn: () => Promise<T>): Promise<T | null> {
  if (isWeb() && !isServer()) {
    return fn();
  }
  return null;
}
