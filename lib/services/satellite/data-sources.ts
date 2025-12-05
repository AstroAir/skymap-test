/**
 * Satellite TLE data sources
 */

import type { TLEDataSource, TLEData, TLEFetchResult, SatelliteCategory } from './types';
import { parseTLEText } from './propagator';

// ============================================================================
// Data Source Configuration
// ============================================================================

export const TLE_SOURCES: TLEDataSource[] = [
  {
    id: 'celestrak-stations',
    name: 'CelesTrak Space Stations',
    url: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle',
    category: ['space-stations', 'iss'],
    updateInterval: 12,
  },
  {
    id: 'celestrak-visual',
    name: 'CelesTrak 100 Brightest',
    url: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=visual&FORMAT=tle',
    category: ['visual'],
    updateInterval: 24,
  },
  {
    id: 'celestrak-starlink',
    name: 'CelesTrak Starlink',
    url: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=tle',
    category: ['starlink'],
    updateInterval: 24,
  },
  {
    id: 'celestrak-weather',
    name: 'CelesTrak Weather',
    url: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=weather&FORMAT=tle',
    category: ['weather'],
    updateInterval: 24,
  },
  {
    id: 'celestrak-amateur',
    name: 'CelesTrak Amateur Radio',
    url: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=amateur&FORMAT=tle',
    category: ['amateur'],
    updateInterval: 24,
  },
];

// ============================================================================
// TLE Cache
// ============================================================================

interface TLECache {
  [sourceId: string]: {
    data: TLEData[];
    fetchedAt: Date;
    expiresAt: Date;
  };
}

const tleCache: TLECache = {};

// ============================================================================
// Fetch Functions
// ============================================================================

/**
 * Fetch TLE data from a source
 */
export async function fetchTLEFromSource(
  source: TLEDataSource
): Promise<TLEFetchResult> {
  // Check cache
  const cached = tleCache[source.id];
  if (cached && cached.expiresAt > new Date()) {
    return {
      source: source.id,
      satellites: cached.data,
      fetchedAt: cached.fetchedAt,
    };
  }
  
  try {
    const response = await fetch(source.url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const text = await response.text();
    const satellites = parseTLEText(text);
    
    const now = new Date();
    const expiresAt = new Date(now.getTime() + source.updateInterval * 3600 * 1000);
    
    tleCache[source.id] = {
      data: satellites,
      fetchedAt: now,
      expiresAt,
    };
    
    return {
      source: source.id,
      satellites,
      fetchedAt: now,
    };
  } catch (error) {
    return {
      source: source.id,
      satellites: [],
      fetchedAt: new Date(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetch TLEs by category
 */
export async function fetchTLEByCategory(
  category: SatelliteCategory
): Promise<TLEFetchResult> {
  const source = TLE_SOURCES.find(s => s.category.includes(category));
  if (!source) {
    return {
      source: 'none',
      satellites: [],
      fetchedAt: new Date(),
      error: `No source for category: ${category}`,
    };
  }
  
  return fetchTLEFromSource(source);
}

/**
 * Fetch TLE for specific satellite by NORAD ID
 */
export async function fetchTLEByNoradId(
  noradId: number
): Promise<TLEData | null> {
  const url = `https://celestrak.org/NORAD/elements/gp.php?CATNR=${noradId}&FORMAT=tle`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const text = await response.text();
    const satellites = parseTLEText(text);
    
    return satellites[0] ?? null;
  } catch {
    return null;
  }
}

/**
 * Fetch ISS TLE specifically
 */
export async function fetchISSTLE(): Promise<TLEData | null> {
  return fetchTLEByNoradId(25544);
}

// ============================================================================
// Well-known Satellites
// ============================================================================

export const NOTABLE_SATELLITES = {
  ISS: { noradId: 25544, name: 'ISS (ZARYA)' },
  HST: { noradId: 20580, name: 'HST' },
  TIANGONG: { noradId: 48274, name: 'CSS (TIANHE)' },
} as const;

/**
 * Get TLE cache status
 */
export function getCacheStatus(): Record<string, { 
  hasCached: boolean; 
  expiresAt?: Date;
  count?: number;
}> {
  const status: Record<string, { hasCached: boolean; expiresAt?: Date; count?: number }> = {};
  
  for (const source of TLE_SOURCES) {
    const cached = tleCache[source.id];
    status[source.id] = cached
      ? { hasCached: true, expiresAt: cached.expiresAt, count: cached.data.length }
      : { hasCached: false };
  }
  
  return status;
}

/**
 * Clear TLE cache
 */
export function clearTLECache(): void {
  for (const key of Object.keys(tleCache)) {
    delete tleCache[key];
  }
}
