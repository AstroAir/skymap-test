/**
 * Map-related utility functions
 */

import type { MapApiKey } from '@/lib/services/map-config';

/**
 * Mask an API key for display, showing only first/last 4 characters
 */
export function maskApiKey(key: string): string {
  if (key.length <= 8) return '••••••••';
  return key.substring(0, 4) + '••••••••' + key.substring(key.length - 4);
}

/**
 * Calculate quota usage percentage for an API key
 */
export function getQuotaUsagePercent(key: MapApiKey): number {
  if (!key.quota) return 0;
  const limit = key.quota.daily || key.quota.monthly || 0;
  if (limit === 0) return 0;
  return Math.min(100, ((key.quota.used || 0) / limit) * 100);
}

/**
 * Format a response time in milliseconds to a human-readable string
 */
export function formatResponseTime(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

/**
 * Fetch elevation (meters) for given coordinates using Open-Elevation API.
 * Returns null on failure so callers can fall back gracefully.
 */
export async function fetchElevation(
  latitude: number,
  longitude: number,
  options: { timeout?: number } = {}
): Promise<number | null> {
  const { timeout = 5000 } = options;
  const url = `https://api.open-elevation.com/api/v1/lookup?locations=${latitude},${longitude}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const data: { results?: Array<{ elevation: number }> } = await response.json();
    return data.results?.[0]?.elevation ?? null;
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}
