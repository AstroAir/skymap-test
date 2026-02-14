/**
 * Local Name Resolution Service
 * Resolves astronomical object names using local catalog data
 * without requiring online API access.
 * 
 * Resolution strategy (ordered by confidence):
 * 1. Exact catalog ID match (e.g., "M31", "NGC7000")
 * 2. Common name lookup (e.g., "Orion Nebula" → M42)
 * 3. Alternate name match in DSO_CATALOG
 * 4. Fuzzy search fallback
 */

import { createLogger } from '@/lib/logger';
import {
  DSO_CATALOG,
  getDSOById,
  parseCatalogId,
  COMMON_NAME_TO_CATALOG,
  enhancedQuickSearch,
  type DeepSkyObject,
} from '@/lib/catalogs';
import { formatRA, formatDec } from '@/lib/astronomy/coordinates/formats';
import type { OnlineSearchResult, ObjectCategory } from './online-search-service';

const logger = createLogger('local-resolve-service');

// ============================================================================
// Type Mapping
// ============================================================================

const DSO_TYPE_TO_CATEGORY: Record<string, ObjectCategory> = {
  'Galaxy': 'galaxy',
  'Nebula': 'nebula',
  'OpenCluster': 'cluster',
  'GlobularCluster': 'cluster',
  'PlanetaryNebula': 'nebula',
  'SupernovaRemnant': 'nebula',
  'DarkNebula': 'nebula',
  'EmissionNebula': 'nebula',
  'ReflectionNebula': 'nebula',
  'StarCluster': 'cluster',
  'DoubleStar': 'star',
  'Asterism': 'cluster',
  'GalaxyCluster': 'galaxy',
  'Quasar': 'quasar',
  'Other': 'other',
};

// ============================================================================
// Helpers
// ============================================================================

function dsoToSearchResult(dso: DeepSkyObject): OnlineSearchResult {
  return {
    id: dso.id,
    name: dso.name,
    alternateNames: dso.alternateNames,
    type: dso.type,
    category: DSO_TYPE_TO_CATEGORY[dso.type] || 'other',
    ra: dso.ra,
    dec: dso.dec,
    raString: formatRA(dso.ra),
    decString: formatDec(dso.dec),
    magnitude: dso.magnitude,
    angularSize: dso.sizeMax
      ? dso.sizeMin
        ? `${dso.sizeMax}' × ${dso.sizeMin}'`
        : `${dso.sizeMax}'`
      : undefined,
    constellation: dso.constellation,
    source: 'local',
  };
}

// ============================================================================
// Local Resolution Functions
// ============================================================================

/**
 * Resolve an object name using local catalog data.
 * Returns the best match or null if not found.
 */
export function resolveObjectNameLocally(name: string): OnlineSearchResult | null {
  if (!name || !name.trim()) return null;

  const trimmed = name.trim();

  // 1. Catalog ID exact match (e.g., "M31", "NGC 7000", "IC 434")
  const catalogId = parseCatalogId(trimmed);
  if (catalogId) {
    const dso = getDSOById(catalogId.normalized);
    if (dso) {
      logger.debug('Local resolve: catalog ID match', { input: trimmed, matched: dso.id });
      return dsoToSearchResult(dso);
    }
    // Try alternate names in catalog
    const byAltName = DSO_CATALOG.find(obj =>
      obj.alternateNames?.some(alt => {
        const parsed = parseCatalogId(alt);
        return parsed && parsed.normalized === catalogId.normalized;
      })
    );
    if (byAltName) {
      logger.debug('Local resolve: catalog ID via alternate name', { input: trimmed, matched: byAltName.id });
      return dsoToSearchResult(byAltName);
    }
  }

  // 2. Common name lookup (e.g., "Orion Nebula" → M42)
  const lowerName = trimmed.toLowerCase();
  const catalogIds = COMMON_NAME_TO_CATALOG[lowerName];
  if (catalogIds && catalogIds.length > 0) {
    const dso = getDSOById(catalogIds[0]);
    if (dso) {
      logger.debug('Local resolve: common name match', { input: trimmed, matched: dso.id });
      return dsoToSearchResult(dso);
    }
  }

  // 3. Direct name/alternateNames contains match in DSO_CATALOG
  const directMatch = DSO_CATALOG.find(obj => {
    const objNameLower = obj.name.toLowerCase();
    if (objNameLower === lowerName || objNameLower.includes(lowerName)) return true;
    return obj.alternateNames?.some(alt => alt.toLowerCase() === lowerName);
  });
  if (directMatch) {
    logger.debug('Local resolve: direct name match', { input: trimmed, matched: directMatch.id });
    return dsoToSearchResult(directMatch);
  }

  // 4. Fuzzy search fallback
  const fuzzyResults = enhancedQuickSearch(DSO_CATALOG, trimmed, 1);
  if (fuzzyResults.length > 0) {
    logger.debug('Local resolve: fuzzy match', { input: trimmed, matched: fuzzyResults[0].id });
    return dsoToSearchResult(fuzzyResults[0]);
  }

  logger.debug('Local resolve: no match found', { input: trimmed });
  return null;
}

/**
 * Resolve multiple object names locally.
 * Returns results for all successfully resolved names.
 */
export function resolveObjectNamesLocally(names: string[]): OnlineSearchResult[] {
  const results: OnlineSearchResult[] = [];
  const seen = new Set<string>();

  for (const name of names) {
    const result = resolveObjectNameLocally(name);
    if (result && !seen.has(result.id)) {
      seen.add(result.id);
      results.push(result);
    }
  }

  return results;
}

/**
 * Search local catalog and return multiple matches.
 * More comprehensive than resolveObjectNameLocally which returns only the best match.
 */
export function searchLocalCatalog(
  query: string,
  limit: number = 20
): OnlineSearchResult[] {
  if (!query || !query.trim()) return [];

  const trimmed = query.trim();
  const results: OnlineSearchResult[] = [];
  const seen = new Set<string>();

  const addResult = (dso: DeepSkyObject) => {
    if (!seen.has(dso.id)) {
      seen.add(dso.id);
      results.push(dsoToSearchResult(dso));
    }
  };

  // 1. Exact catalog ID
  const catalogId = parseCatalogId(trimmed);
  if (catalogId) {
    const dso = getDSOById(catalogId.normalized);
    if (dso) addResult(dso);
  }

  // 2. Common name lookup
  const lowerQuery = trimmed.toLowerCase();
  const catalogIds = COMMON_NAME_TO_CATALOG[lowerQuery];
  if (catalogIds) {
    for (const id of catalogIds) {
      const dso = getDSOById(id);
      if (dso) addResult(dso);
    }
  }

  // 3. Enhanced fuzzy search
  const fuzzyResults = enhancedQuickSearch(DSO_CATALOG, trimmed, limit);
  for (const dso of fuzzyResults) {
    addResult(dso);
    if (results.length >= limit) break;
  }

  return results.slice(0, limit);
}
