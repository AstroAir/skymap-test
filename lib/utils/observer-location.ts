/**
 * Observer Location Utilities
 *
 * Pure functions for loading, saving, and validating observer location data
 * used by the setup wizard's location step.
 */

import type { ObserverLocation } from '@/types/starmap/setup-wizard';
import { LOCATION_STORAGE_KEY } from '@/lib/constants/setup-wizard';

/**
 * Load stored observer location from localStorage
 */
export function loadStoredLocation(): ObserverLocation | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(LOCATION_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

/**
 * Save observer location to localStorage
 */
export function saveLocation(location: ObserverLocation): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Validate that a location object has valid coordinates
 */
export function isValidLocation(location: ObserverLocation | null): location is ObserverLocation {
  if (!location) return false;
  const { latitude, longitude } = location;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false;
  if (latitude < -90 || latitude > 90) return false;
  if (longitude < -180 || longitude > 180) return false;
  return true;
}
