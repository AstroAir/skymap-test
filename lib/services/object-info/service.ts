/**
 * Object information fetching service
 */

import type { 
  CelestialObjectInfo, 
  InfoFetchResult, 
  AggregatedInfo,
  DataSourceId,
  ObjectCategory,
} from './types';
import { 
  DEFAULT_DATA_SOURCES, 
  getActiveSources,
  getDSSImageUrl,
  getWikipediaApiUrl,
} from './config';

// ============================================================================
// Info Cache
// ============================================================================

interface InfoCache {
  [key: string]: {
    info: CelestialObjectInfo;
    fetchedAt: Date;
    expiresAt: Date;
  };
}

const infoCache: InfoCache = {};
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

// ============================================================================
// Main Service Functions
// ============================================================================

/**
 * Fetch complete object information from all sources
 */
export async function fetchObjectInfo(
  objectName: string,
  ra?: number,
  dec?: number
): Promise<AggregatedInfo> {
  const cacheKey = objectName.toLowerCase();
  
  // Check cache
  const cached = infoCache[cacheKey];
  if (cached && cached.expiresAt > new Date()) {
    return {
      object: cached.info,
      sources: cached.info.source as DataSourceId[],
      errors: [],
      totalFetchTime: 0,
    };
  }
  
  const startTime = Date.now();
  const sources = getActiveSources(DEFAULT_DATA_SOURCES);
  const results: InfoFetchResult[] = [];
  const errors: string[] = [];
  
  // Fetch from each source
  for (const source of sources) {
    try {
      const result = await fetchFromSource(source.id, objectName, ra, dec);
      results.push(result);
      if (!result.success && result.error) {
        errors.push(`${source.id}: ${result.error}`);
      }
    } catch (e) {
      errors.push(`${source.id}: ${e}`);
    }
  }
  
  // Aggregate results
  const aggregated = aggregateResults(objectName, results, ra, dec);
  const totalFetchTime = Date.now() - startTime;
  
  // Cache result
  const now = new Date();
  infoCache[cacheKey] = {
    info: aggregated,
    fetchedAt: now,
    expiresAt: new Date(now.getTime() + CACHE_DURATION_MS),
  };
  
  return {
    object: aggregated,
    sources: aggregated.source as DataSourceId[],
    errors,
    totalFetchTime,
  };
}

/**
 * Fetch from a specific source
 */
async function fetchFromSource(
  sourceId: DataSourceId,
  objectName: string,
  ra?: number,
  dec?: number
): Promise<InfoFetchResult> {
  const startTime = Date.now();
  
  try {
    let info: Partial<CelestialObjectInfo> = {};
    
    switch (sourceId) {
      case 'wikipedia':
        info = await fetchFromWikipedia(objectName);
        break;
      case 'simbad':
        info = await fetchFromSimbad(objectName);
        break;
      case 'dss':
        if (ra !== undefined && dec !== undefined) {
          info = { dssUrl: getDSSImageUrl(ra, dec) };
        }
        break;
      case 'local':
        info = getLocalInfo(objectName);
        break;
      default:
        break;
    }
    
    return {
      info,
      source: sourceId,
      success: Object.keys(info).length > 0,
      fetchTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      info: {},
      source: sourceId,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      fetchTime: Date.now() - startTime,
    };
  }
}

// ============================================================================
// Source-Specific Fetchers
// ============================================================================

async function fetchFromWikipedia(
  objectName: string
): Promise<Partial<CelestialObjectInfo>> {
  const url = getWikipediaApiUrl(objectName);
  
  const response = await fetch(url);
  if (!response.ok) return {};
  
  const data = await response.json();
  
  return {
    description: data.extract,
    wikiImageUrl: data.thumbnail?.source,
  };
}

async function fetchFromSimbad(
  objectName: string
): Promise<Partial<CelestialObjectInfo>> {
  // Simplified SIMBAD fetch
  // In production, use TAP query for structured data
  // Parameter reserved for future implementation
  void objectName;
  return {};
}

function getLocalInfo(objectName: string): Partial<CelestialObjectInfo> {
  // Check local famous objects database
  const lower = objectName.toLowerCase();
  
  const famousObjects: Record<string, Partial<CelestialObjectInfo>> = {
    'm31': {
      name: 'Andromeda Galaxy',
      names: ['M31', 'NGC 224', 'Andromeda Galaxy'],
      category: 'galaxy' as ObjectCategory,
      constellation: 'Andromeda',
      magnitude: 3.4,
      size: { width: 190, height: 60 },
      distance: { value: 2.537, unit: 'Mpc' },
      description: 'The Andromeda Galaxy is a barred spiral galaxy and is the nearest major galaxy to the Milky Way.',
    },
    'm42': {
      name: 'Orion Nebula',
      names: ['M42', 'NGC 1976', 'Great Orion Nebula'],
      category: 'nebula' as ObjectCategory,
      constellation: 'Orion',
      magnitude: 4.0,
      size: { width: 65, height: 60 },
      distance: { value: 1344, unit: 'ly' },
      description: 'The Orion Nebula is a diffuse nebula situated in the Milky Way, south of Orion\'s Belt.',
    },
    'm45': {
      name: 'Pleiades',
      names: ['M45', 'Pleiades', 'Seven Sisters'],
      category: 'cluster' as ObjectCategory,
      constellation: 'Taurus',
      magnitude: 1.6,
      size: { width: 110, height: 110 },
      distance: { value: 444, unit: 'ly' },
      description: 'The Pleiades is an open star cluster containing middle-aged, hot B-type stars.',
    },
  };
  
  return famousObjects[lower] || {};
}

// ============================================================================
// Result Aggregation
// ============================================================================

function aggregateResults(
  objectName: string,
  results: InfoFetchResult[],
  ra?: number,
  dec?: number
): CelestialObjectInfo {
  const merged: CelestialObjectInfo = {
    name: objectName,
    names: [objectName],
    category: 'unknown',
    ra: ra ?? 0,
    dec: dec ?? 0,
    source: [],
    lastUpdated: new Date(),
  };
  
  for (const result of results) {
    if (!result.success) continue;
    
    // Merge info with priority to earlier sources
    for (const [key, value] of Object.entries(result.info)) {
      const mergedRecord = merged as unknown as Record<string, unknown>;
      if (value !== undefined && (!(key in merged) || mergedRecord[key] === undefined)) {
        mergedRecord[key] = value;
      }
    }
    
    (merged.source as DataSourceId[]).push(result.source);
  }
  
  return merged;
}

// ============================================================================
// Cache Management
// ============================================================================

/**
 * Clear object info cache
 */
export function clearInfoCache(): void {
  for (const key of Object.keys(infoCache)) {
    delete infoCache[key];
  }
}

/**
 * Get cache stats
 */
export function getCacheStats(): { size: number; oldestEntry?: Date } {
  const entries = Object.values(infoCache);
  return {
    size: entries.length,
    oldestEntry: entries.length > 0
      ? entries.reduce((oldest, entry) => 
          entry.fetchedAt < oldest ? entry.fetchedAt : oldest,
          entries[0].fetchedAt
        )
      : undefined,
  };
}
