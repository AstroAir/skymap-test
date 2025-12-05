/**
 * Object info data source configuration
 */

import type { DataSource, DataSourceId } from './types';

// ============================================================================
// Default Data Sources
// ============================================================================

export const DEFAULT_DATA_SOURCES: DataSource[] = [
  {
    id: 'simbad',
    name: 'SIMBAD Astronomical Database',
    url: 'https://simbad.u-strasbg.fr/simbad',
    enabled: true,
    priority: 1,
    timeout: 5000,
    healthy: true,
  },
  {
    id: 'wikipedia',
    name: 'Wikipedia',
    url: 'https://en.wikipedia.org/api/rest_v1',
    enabled: true,
    priority: 2,
    timeout: 5000,
    healthy: true,
  },
  {
    id: 'dss',
    name: 'Digitized Sky Survey',
    url: 'https://archive.stsci.edu/cgi-bin/dss_search',
    enabled: true,
    priority: 3,
    timeout: 10000,
    healthy: true,
  },
  {
    id: 'nasa-apod',
    name: 'NASA APOD',
    url: 'https://api.nasa.gov/planetary/apod',
    enabled: false,
    priority: 4,
    timeout: 5000,
    healthy: true,
  },
  {
    id: 'local',
    name: 'Local Database',
    enabled: true,
    priority: 0,
    timeout: 100,
    healthy: true,
  },
  {
    id: 'stellarium',
    name: 'Stellarium Engine',
    enabled: true,
    priority: 0,
    timeout: 100,
    healthy: true,
  },
];

// ============================================================================
// URL Generators
// ============================================================================

/**
 * Generate DSS image URL
 */
export function getDSSImageUrl(
  ra: number, 
  dec: number, 
  size: number = 30 // arcminutes
): string {
  return `https://archive.stsci.edu/cgi-bin/dss_search?` +
    `v=poss2ukstu_red&r=${ra / 15}&d=${dec}&e=J2000&` +
    `h=${size}&w=${size}&f=gif&c=none&fov=NONE&v3=`;
}

/**
 * Generate Wikipedia API URL
 */
export function getWikipediaApiUrl(title: string): string {
  return `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
}

/**
 * Generate Wikipedia image URL
 */
export function getWikipediaImageUrl(title: string, size: number = 300): string {
  return `https://en.wikipedia.org/wiki/Special:FilePath/${encodeURIComponent(title)}?width=${size}`;
}

/**
 * Generate SIMBAD query URL
 */
export function getSimbadQueryUrl(identifier: string): string {
  return `https://simbad.u-strasbg.fr/simbad/sim-id?Ident=${encodeURIComponent(identifier)}&output.format=ASCII`;
}

/**
 * Generate SIMBAD TAP query URL
 */
export function getSimbadTapUrl(query: string): string {
  return `https://simbad.u-strasbg.fr/simbad/sim-tap/sync?` +
    `REQUEST=doQuery&LANG=ADQL&FORMAT=json&QUERY=${encodeURIComponent(query)}`;
}

// ============================================================================
// Health Check
// ============================================================================

/**
 * Check health of a data source
 */
export async function checkSourceHealth(source: DataSource): Promise<boolean> {
  if (!source.url) return true;
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), source.timeout);
    
    const response = await fetch(source.url, {
      method: 'HEAD',
      signal: controller.signal,
    });
    
    clearTimeout(timeout);
    return response.ok || response.status === 405; // 405 = method not allowed but server is up
  } catch {
    return false;
  }
}

/**
 * Check health of all sources
 */
export async function checkAllSourcesHealth(
  sources: DataSource[]
): Promise<Map<DataSourceId, boolean>> {
  const results = new Map<DataSourceId, boolean>();
  
  await Promise.all(
    sources.map(async (source) => {
      const healthy = await checkSourceHealth(source);
      results.set(source.id, healthy);
    })
  );
  
  return results;
}

// ============================================================================
// Source Management
// ============================================================================

/**
 * Get active sources sorted by priority
 */
export function getActiveSources(sources: DataSource[]): DataSource[] {
  return sources
    .filter(s => s.enabled && s.healthy)
    .sort((a, b) => a.priority - b.priority);
}

/**
 * Find source by ID
 */
export function findSource(
  sources: DataSource[], 
  id: DataSourceId
): DataSource | undefined {
  return sources.find(s => s.id === id);
}
