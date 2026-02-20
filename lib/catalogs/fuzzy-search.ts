/**
 * Fuzzy Search Engine for Celestial Objects
 * Implements industry-standard fuzzy matching algorithms for astronomical catalogs
 * 
 * Features:
 * - Levenshtein distance for typo tolerance
 * - Jaro-Winkler similarity for name matching
 * - Catalog notation parsing (M31, NGC224, IC342, etc.)
 * - Multi-field weighted search
 * - Phonetic matching for common misspellings
 */
import { parseCatalogIdentifier } from '@/lib/astronomy/object-resolver/parser';

// ============================================================================
// String Similarity Algorithms
// ============================================================================

/**
 * Calculate Levenshtein distance between two strings
 * Used for typo tolerance in search
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  
  // Create distance matrix
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  // Initialize first column and row
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  // Fill the matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // deletion
        dp[i][j - 1] + 1,      // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }
  
  return dp[m][n];
}

/**
 * Calculate Jaro similarity between two strings
 * Better for name matching than Levenshtein
 */
export function jaroSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  if (str1.length === 0 || str2.length === 0) return 0;
  
  const matchWindow = Math.max(0, Math.floor(Math.max(str1.length, str2.length) / 2) - 1);
  
  const str1Matches: boolean[] = new Array(str1.length).fill(false);
  const str2Matches: boolean[] = new Array(str2.length).fill(false);
  
  let matches = 0;
  let transpositions = 0;
  
  // Find matches
  for (let i = 0; i < str1.length; i++) {
    const start = Math.max(0, i - matchWindow);
    const end = Math.min(i + matchWindow + 1, str2.length);
    
    for (let j = start; j < end; j++) {
      if (str2Matches[j] || str1[i] !== str2[j]) continue;
      str1Matches[i] = true;
      str2Matches[j] = true;
      matches++;
      break;
    }
  }
  
  if (matches === 0) return 0;
  
  // Count transpositions
  let k = 0;
  for (let i = 0; i < str1.length; i++) {
    if (!str1Matches[i]) continue;
    while (!str2Matches[k]) k++;
    if (str1[i] !== str2[k]) transpositions++;
    k++;
  }
  
  return (
    (matches / str1.length +
      matches / str2.length +
      (matches - transpositions / 2) / matches) / 3
  );
}

/**
 * Calculate Jaro-Winkler similarity
 * Gives higher scores to strings that match from the beginning
 * Ideal for astronomical object names
 */
export function jaroWinklerSimilarity(str1: string, str2: string, p: number = 0.1): number {
  const jaro = jaroSimilarity(str1, str2);
  
  // Find common prefix (up to 4 chars)
  let prefix = 0;
  const maxPrefix = Math.min(4, Math.min(str1.length, str2.length));
  
  for (let i = 0; i < maxPrefix; i++) {
    if (str1[i] === str2[i]) {
      prefix++;
    } else {
      break;
    }
  }
  
  return jaro + prefix * p * (1 - jaro);
}

/**
 * Calculate normalized similarity score (0-1)
 * Combines multiple similarity metrics
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  // Exact match
  if (s1 === s2) return 1;
  
  // Prefix match bonus
  if (s1.startsWith(s2) || s2.startsWith(s1)) {
    return 0.95;
  }
  
  // Contains match
  if (s1.includes(s2) || s2.includes(s1)) {
    return 0.85;
  }
  
  // Jaro-Winkler for fuzzy matching
  const jw = jaroWinklerSimilarity(s1, s2);
  
  // Also consider Levenshtein for short strings
  if (s1.length <= 10 && s2.length <= 10) {
    const maxLen = Math.max(s1.length, s2.length);
    const levenshtein = 1 - levenshteinDistance(s1, s2) / maxLen;
    return Math.max(jw, levenshtein);
  }
  
  return jw;
}

// ============================================================================
// Catalog Notation Parser
// ============================================================================

export interface ParsedCatalogId {
  catalog: string;
  number: number | null;
  suffix?: string;
  originalInput: string;
  normalized: string;
}

/**
 * Parse a catalog designation into structured data
 */
export function parseCatalogId(input: string): ParsedCatalogId | null {
  const parsed = parseCatalogIdentifier(input);
  if (!parsed) return null;
  return {
    catalog: parsed.catalog,
    number: parsed.number,
    suffix: parsed.suffix,
    originalInput: input,
    normalized: parsed.normalized,
  };
}

/**
 * Generate all possible variations of a catalog ID
 */
export function generateCatalogVariations(catalogId: ParsedCatalogId): string[] {
  const variations: string[] = [catalogId.normalized];
  const { catalog, number, suffix } = catalogId;
  
  if (number === null) return variations;
  
  // Add variations with spaces
  variations.push(`${catalog} ${number}${suffix || ''}`);
  
  // Catalog-specific variations
  switch (catalog) {
    case 'M':
      variations.push(`Messier ${number}`);
      variations.push(`Messier${number}`);
      break;
    case 'NGC':
      variations.push(`N${number}${suffix || ''}`);
      break;
    case 'C':
      variations.push(`Caldwell ${number}`);
      break;
    case 'Sh2':
      variations.push(`Sharpless ${number}`);
      variations.push(`Sh 2-${number}`);
      break;
    case 'B':
      variations.push(`Barnard ${number}`);
      break;
  }
  
  return [...new Set(variations)];
}

// ============================================================================
// Common Name Mappings
// ============================================================================

/**
 * Map of common names to catalog IDs
 * Includes variations and misspellings
 */
export const COMMON_NAME_TO_CATALOG: Record<string, string[]> = {
  // Galaxies
  'andromeda': ['M31', 'NGC224'],
  'andromeda galaxy': ['M31', 'NGC224'],
  'triangulum': ['M33', 'NGC598'],
  'triangulum galaxy': ['M33', 'NGC598'],
  'pinwheel': ['M101', 'NGC5457'],
  'pinwheel galaxy': ['M101', 'NGC5457'],
  'whirlpool': ['M51', 'NGC5194'],
  'whirlpool galaxy': ['M51', 'NGC5194'],
  'sombrero': ['M104', 'NGC4594'],
  'sombrero galaxy': ['M104', 'NGC4594'],
  'cigar': ['M82', 'NGC3034'],
  'cigar galaxy': ['M82', 'NGC3034'],
  'bodes galaxy': ['M81', 'NGC3031'],
  'bode\'s galaxy': ['M81', 'NGC3031'],
  'sunflower': ['M63', 'NGC5055'],
  'sunflower galaxy': ['M63', 'NGC5055'],
  'black eye': ['M64', 'NGC4826'],
  'black eye galaxy': ['M64', 'NGC4826'],
  'leo triplet': ['M65', 'M66', 'NGC3628'],
  
  // Nebulae
  'orion': ['M42', 'NGC1976'],
  'orion nebula': ['M42', 'NGC1976'],
  'great orion nebula': ['M42', 'NGC1976'],
  'crab': ['M1', 'NGC1952'],
  'crab nebula': ['M1', 'NGC1952'],
  'ring': ['M57', 'NGC6720'],
  'ring nebula': ['M57', 'NGC6720'],
  'dumbbell': ['M27', 'NGC6853'],
  'dumbbell nebula': ['M27', 'NGC6853'],
  'lagoon': ['M8', 'NGC6523'],
  'lagoon nebula': ['M8', 'NGC6523'],
  'trifid': ['M20', 'NGC6514'],
  'trifid nebula': ['M20', 'NGC6514'],
  'eagle': ['M16', 'NGC6611'],
  'eagle nebula': ['M16', 'NGC6611'],
  'pillars of creation': ['M16', 'NGC6611'],
  'owl': ['M97', 'NGC3587'],
  'owl nebula': ['M97', 'NGC3587'],
  'helix': ['NGC7293'],
  'helix nebula': ['NGC7293'],
  'cat eye': ['NGC6543'],
  'cat\'s eye': ['NGC6543'],
  'cat eye nebula': ['NGC6543'],
  'veil': ['NGC6992', 'NGC6960'],
  'veil nebula': ['NGC6992', 'NGC6960'],
  'western veil': ['NGC6960'],
  'eastern veil': ['NGC6992'],
  'north america': ['NGC7000'],
  'north america nebula': ['NGC7000'],
  'pelican': ['IC5070'],
  'pelican nebula': ['IC5070'],
  'rosette': ['NGC2237', 'NGC2244'],
  'rosette nebula': ['NGC2237', 'NGC2244'],
  'horsehead': ['B33', 'IC434'],
  'horsehead nebula': ['B33', 'IC434'],
  'flame': ['NGC2024'],
  'flame nebula': ['NGC2024'],
  'running man': ['NGC1977'],
  'running man nebula': ['NGC1977'],
  'soul': ['IC1848'],
  'soul nebula': ['IC1848'],
  'heart': ['IC1805'],
  'heart nebula': ['IC1805'],
  'heart and soul': ['IC1805', 'IC1848'],
  'bubble': ['NGC7635'],
  'bubble nebula': ['NGC7635'],
  'elephant trunk': ['IC1396'],
  'elephant trunk nebula': ['IC1396'],
  'california': ['NGC1499'],
  'california nebula': ['NGC1499'],
  'witch head': ['IC2118'],
  'witch head nebula': ['IC2118'],
  'cone': ['NGC2264'],
  'cone nebula': ['NGC2264'],
  'christmas tree': ['NGC2264'],
  'christmas tree cluster': ['NGC2264'],
  
  // Clusters
  'pleiades': ['M45'],
  'seven sisters': ['M45'],
  'hyades': ['Mel25', 'C41'],
  'beehive': ['M44', 'NGC2632'],
  'beehive cluster': ['M44', 'NGC2632'],
  'praesepe': ['M44', 'NGC2632'],
  'double cluster': ['NGC869', 'NGC884'],
  'hercules cluster': ['M13', 'NGC6205'],
  'great hercules cluster': ['M13', 'NGC6205'],
  'wild duck': ['M11', 'NGC6705'],
  'wild duck cluster': ['M11', 'NGC6705'],
  'butterfly cluster': ['M6', 'NGC6405'],
  'ptolemy cluster': ['M7', 'NGC6475'],
  
  // Other
  'omega centauri': ['NGC5139'],
  '47 tucanae': ['NGC104'],
};

/**
 * Phonetic variations for common misspellings
 */
export const PHONETIC_VARIATIONS: Record<string, string[]> = {
  'andromeda': ['andromida', 'andromada', 'andromedea'],
  'pleiades': ['pleides', 'pleiads', 'pleyades', 'pleiadies'],
  'orion': ['oreon', 'orien'],
  'triangulum': ['triangulam', 'trianglem'],
  'hercules': ['herculis', 'herculus'],
  'dumbbell': ['dumbell', 'dumbel'],
  'sombrero': ['sombero', 'sambrero'],
  'whirlpool': ['wirlpool', 'whirlpol'],
  'california': ['californa', 'californea'],
  'horsehead': ['horsehed', 'horshed'],
  'elephant': ['elefant', 'elephent'],
};

// ============================================================================
// Search Index
// ============================================================================

export interface SearchIndexEntry {
  id: string;
  name: string;
  nameLower: string;
  alternateNames: string[];
  alternateNamesLower: string[];
  catalogIds: ParsedCatalogId[];
  constellation: string;
  constellationLower: string;
  type: string;
  typeLower: string;
  magnitude?: number;
  // Pre-computed search tokens
  tokens: string[];
}

/**
 * Build search index from catalog
 */
export function buildSearchIndex<T extends {
  id: string;
  name: string;
  alternateNames?: string[];
  constellation: string;
  type: string;
  magnitude?: number;
}>(catalog: T[]): Map<string, SearchIndexEntry> {
  const index = new Map<string, SearchIndexEntry>();
  
  for (const obj of catalog) {
    const nameLower = obj.name.toLowerCase();
    const alternateNamesLower = (obj.alternateNames || []).map(n => n.toLowerCase());
    const constellationLower = obj.constellation.toLowerCase();
    const typeLower = obj.type.toLowerCase();
    
    // Parse catalog IDs from name and alternate names
    const catalogIds: ParsedCatalogId[] = [];
    const parsedMain = parseCatalogId(obj.name);
    if (parsedMain) catalogIds.push(parsedMain);
    
    for (const altName of obj.alternateNames || []) {
      const parsed = parseCatalogId(altName);
      if (parsed) catalogIds.push(parsed);
    }
    
    // Build search tokens
    const tokens: string[] = [
      nameLower,
      ...alternateNamesLower,
      constellationLower,
      typeLower,
    ];
    
    // Add catalog variations to tokens
    for (const cid of catalogIds) {
      tokens.push(...generateCatalogVariations(cid).map(v => v.toLowerCase()));
    }
    
    index.set(obj.id, {
      id: obj.id,
      name: obj.name,
      nameLower,
      alternateNames: obj.alternateNames || [],
      alternateNamesLower,
      catalogIds,
      constellation: obj.constellation,
      constellationLower,
      type: obj.type,
      typeLower,
      magnitude: obj.magnitude,
      tokens: [...new Set(tokens)],
    });
  }
  
  return index;
}

// ============================================================================
// Search Result Scoring
// ============================================================================

export interface SearchMatch {
  id: string;
  score: number;
  matchType: 'exact' | 'prefix' | 'contains' | 'fuzzy' | 'catalog' | 'common_name';
  matchedField: string;
  matchedValue: string;
}

export interface FuzzySearchOptions {
  maxResults?: number;
  minScore?: number;
  fuzzyThreshold?: number;
  boostExactMatch?: number;
  boostPrefixMatch?: number;
  boostCatalogMatch?: number;
  boostCommonName?: number;
}

const DEFAULT_SEARCH_OPTIONS: Required<FuzzySearchOptions> = {
  maxResults: 50,
  minScore: 0.3,
  fuzzyThreshold: 0.6,
  boostExactMatch: 2.0,
  boostPrefixMatch: 1.5,
  boostCatalogMatch: 1.8,
  boostCommonName: 1.7,
};

/**
 * Perform fuzzy search on the index
 */
export function fuzzySearch(
  query: string,
  index: Map<string, SearchIndexEntry>,
  options: FuzzySearchOptions = {}
): SearchMatch[] {
  const opts = { ...DEFAULT_SEARCH_OPTIONS, ...options };
  const queryLower = query.toLowerCase().trim();
  
  if (queryLower.length === 0) {
    return [];
  }
  
  const matches: SearchMatch[] = [];
  
  // Check if query is a catalog ID
  const parsedQuery = parseCatalogId(query);
  const queryVariations = parsedQuery ? generateCatalogVariations(parsedQuery).map(v => v.toLowerCase()) : [];
  
  // Check if query matches a common name
  const commonNameMatches = COMMON_NAME_TO_CATALOG[queryLower] || [];
  
  // Also check phonetic variations
  for (const [name, variations] of Object.entries(PHONETIC_VARIATIONS)) {
    if (variations.some(v => queryLower.includes(v) || v.includes(queryLower))) {
      const catalogMatches = COMMON_NAME_TO_CATALOG[name];
      if (catalogMatches) {
        commonNameMatches.push(...catalogMatches);
      }
    }
  }
  
  // Search each entry
  for (const [id, entry] of index) {
    let bestScore = 0;
    let bestMatchType: SearchMatch['matchType'] = 'fuzzy';
    let bestMatchedField = '';
    let bestMatchedValue = '';
    
    // 1. Check catalog ID match (highest priority for catalog queries)
    if (parsedQuery && entry.catalogIds.length > 0) {
      for (const cid of entry.catalogIds) {
        if (cid.catalog === parsedQuery.catalog && cid.number === parsedQuery.number) {
          bestScore = 1.0 * opts.boostCatalogMatch;
          bestMatchType = 'catalog';
          bestMatchedField = 'catalogId';
          bestMatchedValue = cid.normalized;
          break;
        }
      }
    }
    
    // Also check query variations against tokens
    if (queryVariations.length > 0 && bestScore < 1.0) {
      for (const variation of queryVariations) {
        if (entry.tokens.includes(variation)) {
          const score = 0.95 * opts.boostCatalogMatch;
          if (score > bestScore) {
            bestScore = score;
            bestMatchType = 'catalog';
            bestMatchedField = 'name';
            bestMatchedValue = entry.name;
          }
        }
      }
    }
    
    // 2. Check common name match
    if (commonNameMatches.length > 0) {
      const entryIds = [entry.name, ...entry.alternateNames].map(n => n.toUpperCase());
      for (const commonMatch of commonNameMatches) {
        if (entryIds.includes(commonMatch.toUpperCase())) {
          const score = 0.98 * opts.boostCommonName;
          if (score > bestScore) {
            bestScore = score;
            bestMatchType = 'common_name';
            bestMatchedField = 'commonName';
            bestMatchedValue = query;
          }
        }
      }
    }
    
    // 3. Check exact match on name
    if (entry.nameLower === queryLower) {
      const score = 1.0 * opts.boostExactMatch;
      if (score > bestScore) {
        bestScore = score;
        bestMatchType = 'exact';
        bestMatchedField = 'name';
        bestMatchedValue = entry.name;
      }
    }
    
    // 4. Check exact match on alternate names
    if (entry.alternateNamesLower.includes(queryLower)) {
      const score = 0.95 * opts.boostExactMatch;
      if (score > bestScore) {
        bestScore = score;
        bestMatchType = 'exact';
        bestMatchedField = 'alternateName';
        const idx = entry.alternateNamesLower.indexOf(queryLower);
        bestMatchedValue = entry.alternateNames[idx];
      }
    }
    
    // 5. Check prefix match
    if (entry.nameLower.startsWith(queryLower)) {
      const score = 0.9 * opts.boostPrefixMatch;
      if (score > bestScore) {
        bestScore = score;
        bestMatchType = 'prefix';
        bestMatchedField = 'name';
        bestMatchedValue = entry.name;
      }
    }
    
    // 6. Check contains match
    if (entry.nameLower.includes(queryLower)) {
      const score = 0.75;
      if (score > bestScore) {
        bestScore = score;
        bestMatchType = 'contains';
        bestMatchedField = 'name';
        bestMatchedValue = entry.name;
      }
    }
    
    // Also check alternate names for prefix/contains
    for (let i = 0; i < entry.alternateNamesLower.length; i++) {
      const altLower = entry.alternateNamesLower[i];
      
      if (altLower.startsWith(queryLower)) {
        const score = 0.85 * opts.boostPrefixMatch;
        if (score > bestScore) {
          bestScore = score;
          bestMatchType = 'prefix';
          bestMatchedField = 'alternateName';
          bestMatchedValue = entry.alternateNames[i];
        }
      } else if (altLower.includes(queryLower)) {
        const score = 0.7;
        if (score > bestScore) {
          bestScore = score;
          bestMatchType = 'contains';
          bestMatchedField = 'alternateName';
          bestMatchedValue = entry.alternateNames[i];
        }
      }
    }
    
    // 7. Fuzzy matching (only if no good match found yet)
    if (bestScore < opts.fuzzyThreshold) {
      // Check name
      const nameSimilarity = calculateSimilarity(queryLower, entry.nameLower);
      if (nameSimilarity > bestScore && nameSimilarity >= opts.fuzzyThreshold) {
        bestScore = nameSimilarity;
        bestMatchType = 'fuzzy';
        bestMatchedField = 'name';
        bestMatchedValue = entry.name;
      }
      
      // Check alternate names
      for (let i = 0; i < entry.alternateNamesLower.length; i++) {
        const similarity = calculateSimilarity(queryLower, entry.alternateNamesLower[i]);
        if (similarity > bestScore && similarity >= opts.fuzzyThreshold) {
          bestScore = similarity;
          bestMatchType = 'fuzzy';
          bestMatchedField = 'alternateName';
          bestMatchedValue = entry.alternateNames[i];
        }
      }
      
      // Check constellation
      const constSimilarity = calculateSimilarity(queryLower, entry.constellationLower);
      if (constSimilarity > bestScore && constSimilarity >= opts.fuzzyThreshold) {
        bestScore = constSimilarity * 0.8; // Lower weight for constellation matches
        bestMatchType = 'fuzzy';
        bestMatchedField = 'constellation';
        bestMatchedValue = entry.constellation;
      }
    }
    
    // Add to results if score meets minimum
    if (bestScore >= opts.minScore) {
      matches.push({
        id,
        score: bestScore,
        matchType: bestMatchType,
        matchedField: bestMatchedField,
        matchedValue: bestMatchedValue,
      });
    }
  }
  
  // Sort by score descending
  matches.sort((a, b) => b.score - a.score);
  
  // Limit results
  return matches.slice(0, opts.maxResults);
}

/**
 * Quick search for autocomplete (faster, less accurate)
 */
export function quickFuzzySearch(
  query: string,
  index: Map<string, SearchIndexEntry>,
  limit: number = 10
): SearchMatch[] {
  const queryLower = query.toLowerCase().trim();
  
  if (queryLower.length < 1) {
    return [];
  }
  
  const matches: SearchMatch[] = [];
  
  // Quick prefix scan
  for (const [id, entry] of index) {
    // Check name prefix
    if (entry.nameLower.startsWith(queryLower)) {
      matches.push({
        id,
        score: 1.0,
        matchType: 'prefix',
        matchedField: 'name',
        matchedValue: entry.name,
      });
      continue;
    }
    
    // Check alternate name prefix
    for (let i = 0; i < entry.alternateNamesLower.length; i++) {
      if (entry.alternateNamesLower[i].startsWith(queryLower)) {
        matches.push({
          id,
          score: 0.95,
          matchType: 'prefix',
          matchedField: 'alternateName',
          matchedValue: entry.alternateNames[i],
        });
        break;
      }
    }
    
    // Check tokens for catalog matches
    for (const token of entry.tokens) {
      if (token.startsWith(queryLower)) {
        matches.push({
          id,
          score: 0.9,
          matchType: 'catalog',
          matchedField: 'token',
          matchedValue: token,
        });
        break;
      }
    }
    
    if (matches.length >= limit * 2) break;
  }
  
  // Sort and limit
  matches.sort((a, b) => b.score - a.score);
  
  // Deduplicate by id
  const seen = new Set<string>();
  return matches.filter(m => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  }).slice(0, limit);
}

// ============================================================================
// Multi-Field Weighted Search
// ============================================================================

export interface WeightedSearchOptions {
  nameWeight?: number;
  alternateNameWeight?: number;
  catalogWeight?: number;
  constellationWeight?: number;
  typeWeight?: number;
  magnitudeBoost?: boolean;
}

const DEFAULT_WEIGHTED_OPTIONS: Required<WeightedSearchOptions> = {
  nameWeight: 1.0,
  alternateNameWeight: 0.9,
  catalogWeight: 1.2,
  constellationWeight: 0.5,
  typeWeight: 0.3,
  magnitudeBoost: true,
};

/**
 * Perform multi-field weighted search
 */
export function weightedSearch(
  query: string,
  index: Map<string, SearchIndexEntry>,
  options: WeightedSearchOptions = {}
): SearchMatch[] {
  const opts = { ...DEFAULT_WEIGHTED_OPTIONS, ...options };
  const queryLower = query.toLowerCase().trim();
  const queryTokens = queryLower.split(/\s+/).filter(t => t.length > 0);
  
  if (queryTokens.length === 0) {
    return [];
  }
  
  const scores = new Map<string, { score: number; matchedField: string; matchedValue: string }>();
  
  for (const [id, entry] of index) {
    let totalScore = 0;
    let bestMatchedField = '';
    let bestMatchedValue = '';
    
    for (const token of queryTokens) {
      let tokenScore = 0;
      
      // Name match
      const nameSim = calculateSimilarity(token, entry.nameLower);
      if (nameSim > 0.5) {
        const score = nameSim * opts.nameWeight;
        if (score > tokenScore) {
          tokenScore = score;
          bestMatchedField = 'name';
          bestMatchedValue = entry.name;
        }
      }
      
      // Alternate names
      for (let i = 0; i < entry.alternateNamesLower.length; i++) {
        const sim = calculateSimilarity(token, entry.alternateNamesLower[i]);
        if (sim > 0.5) {
          const score = sim * opts.alternateNameWeight;
          if (score > tokenScore) {
            tokenScore = score;
            bestMatchedField = 'alternateName';
            bestMatchedValue = entry.alternateNames[i];
          }
        }
      }
      
      // Constellation
      const constSim = calculateSimilarity(token, entry.constellationLower);
      if (constSim > 0.7) {
        const score = constSim * opts.constellationWeight;
        if (score > tokenScore) {
          tokenScore = score;
          bestMatchedField = 'constellation';
          bestMatchedValue = entry.constellation;
        }
      }
      
      // Type
      const typeSim = calculateSimilarity(token, entry.typeLower);
      if (typeSim > 0.7) {
        const score = typeSim * opts.typeWeight;
        if (score > tokenScore) {
          tokenScore = score;
          bestMatchedField = 'type';
          bestMatchedValue = entry.type;
        }
      }
      
      totalScore += tokenScore;
    }
    
    // Normalize by number of tokens
    totalScore /= queryTokens.length;
    
    // Magnitude boost for brighter objects
    if (opts.magnitudeBoost && entry.magnitude !== undefined && totalScore > 0) {
      if (entry.magnitude < 6) {
        totalScore *= 1.2;
      } else if (entry.magnitude < 8) {
        totalScore *= 1.1;
      } else if (entry.magnitude < 10) {
        totalScore *= 1.05;
      }
    }
    
    if (totalScore > 0.3) {
      scores.set(id, { score: totalScore, matchedField: bestMatchedField, matchedValue: bestMatchedValue });
    }
  }
  
  // Convert to matches array
  const matches: SearchMatch[] = Array.from(scores.entries()).map(([id, data]) => ({
    id,
    score: data.score,
    matchType: 'fuzzy' as const,
    matchedField: data.matchedField,
    matchedValue: data.matchedValue,
  }));
  
  matches.sort((a, b) => b.score - a.score);
  
  return matches.slice(0, 50);
}
