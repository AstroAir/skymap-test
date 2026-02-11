/**
 * Shared celestial object data for search hooks.
 * Single source of truth for CELESTIAL_BODIES, POPULAR_DSOS, CONSTELLATIONS,
 * and MESSIER_CATALOG used by both use-object-search and use-online-search.
 */

import type { SearchResultItem } from '@/lib/core/types';
import {
  calculateSearchMatch,
  type SearchMatchResult,
  COMMON_NAME_TO_CATALOG,
  PHONETIC_VARIATIONS,
  parseCatalogId,
  jaroWinklerSimilarity,
} from '@/lib/catalogs';

// ============================================================================
// Data Sources
// ============================================================================

/** Celestial bodies (planets, sun, moon) */
export const CELESTIAL_BODIES: SearchResultItem[] = [
  { Name: 'Sun', Type: 'Star' },
  { Name: 'Mercury', Type: 'Planet' },
  { Name: 'Venus', Type: 'Planet' },
  { Name: 'Moon', Type: 'Moon' },
  { Name: 'Mars', Type: 'Planet' },
  { Name: 'Jupiter', Type: 'Planet' },
  { Name: 'Saturn', Type: 'Planet' },
  { Name: 'Uranus', Type: 'Planet' },
  { Name: 'Neptune', Type: 'Planet' },
  { Name: 'Pluto', Type: 'Planet' },
];

/** Popular DSO catalog for quick search (with magnitude and size data) */
export const POPULAR_DSOS: SearchResultItem[] = [
  { Name: 'M31', Type: 'DSO', RA: 10.6847, Dec: 41.2689, 'Common names': 'Andromeda Galaxy', Magnitude: 3.4, Size: "178'x63'" },
  { Name: 'M42', Type: 'DSO', RA: 83.8221, Dec: -5.3911, 'Common names': 'Orion Nebula', Magnitude: 4.0, Size: "85'x60'" },
  { Name: 'M45', Type: 'DSO', RA: 56.75, Dec: 24.1167, 'Common names': 'Pleiades', Magnitude: 1.6, Size: "110'" },
  { Name: 'M1', Type: 'DSO', RA: 83.6333, Dec: 22.0167, 'Common names': 'Crab Nebula', Magnitude: 8.4, Size: "6'x4'" },
  { Name: 'M51', Type: 'DSO', RA: 202.4696, Dec: 47.1952, 'Common names': 'Whirlpool Galaxy', Magnitude: 8.4, Size: "11'x7'" },
  { Name: 'M101', Type: 'DSO', RA: 210.8024, Dec: 54.3488, 'Common names': 'Pinwheel Galaxy', Magnitude: 7.9, Size: "29'x27'" },
  { Name: 'M104', Type: 'DSO', RA: 189.9976, Dec: -11.6231, 'Common names': 'Sombrero Galaxy', Magnitude: 8.0, Size: "9'x4'" },
  { Name: 'M13', Type: 'DSO', RA: 250.4217, Dec: 36.4613, 'Common names': 'Hercules Cluster', Magnitude: 5.8, Size: "20'" },
  { Name: 'M57', Type: 'DSO', RA: 283.3962, Dec: 33.0286, 'Common names': 'Ring Nebula', Magnitude: 8.8, Size: "1.4'x1'" },
  { Name: 'M27', Type: 'DSO', RA: 299.9017, Dec: 22.7211, 'Common names': 'Dumbbell Nebula', Magnitude: 7.5, Size: "8'x6'" },
  { Name: 'NGC7000', Type: 'DSO', RA: 314.6833, Dec: 44.3167, 'Common names': 'North America Nebula', Magnitude: 4.0, Size: "120'x100'" },
  { Name: 'NGC6992', Type: 'DSO', RA: 312.7583, Dec: 31.7167, 'Common names': 'Veil Nebula', Magnitude: 7.0, Size: "60'" },
  { Name: 'IC1396', Type: 'DSO', RA: 324.7458, Dec: 57.4833, 'Common names': 'Elephant Trunk Nebula', Magnitude: 3.5, Size: "170'" },
  { Name: 'NGC2244', Type: 'DSO', RA: 97.9833, Dec: 4.9333, 'Common names': 'Rosette Nebula', Magnitude: 4.8, Size: "80'" },
  { Name: 'M8', Type: 'DSO', RA: 270.9208, Dec: -24.3833, 'Common names': 'Lagoon Nebula', Magnitude: 6.0, Size: "90'x40'" },
  { Name: 'M20', Type: 'DSO', RA: 270.6208, Dec: -23.0333, 'Common names': 'Trifid Nebula', Magnitude: 6.3, Size: "28'" },
  { Name: 'M16', Type: 'DSO', RA: 274.7, Dec: -13.8167, 'Common names': 'Eagle Nebula', Magnitude: 6.4, Size: "35'x28'" },
  { Name: 'M17', Type: 'DSO', RA: 275.1958, Dec: -16.1833, 'Common names': 'Omega Nebula', Magnitude: 6.0, Size: "11'" },
  { Name: 'NGC6888', Type: 'DSO', RA: 303.0583, Dec: 38.35, 'Common names': 'Crescent Nebula', Magnitude: 7.4, Size: "20'x10'" },
  { Name: 'M33', Type: 'DSO', RA: 23.4621, Dec: 30.6599, 'Common names': 'Triangulum Galaxy', Magnitude: 5.7, Size: "73'x45'" },
  { Name: 'M81', Type: 'DSO', RA: 148.8882, Dec: 69.0653, 'Common names': "Bode's Galaxy", Magnitude: 6.9, Size: "27'x14'" },
  { Name: 'M82', Type: 'DSO', RA: 148.9685, Dec: 69.6797, 'Common names': 'Cigar Galaxy', Magnitude: 8.4, Size: "11'x5'" },
  { Name: 'NGC6960', Type: 'DSO', RA: 312.2417, Dec: 30.7333, 'Common names': "Witch's Broom Nebula", Magnitude: 7.0, Size: "70'" },
  { Name: 'M78', Type: 'DSO', RA: 86.6917, Dec: 0.0833, 'Common names': 'Reflection Nebula', Magnitude: 8.3, Size: "8'x6'" },
  { Name: 'NGC2024', Type: 'DSO', RA: 85.4208, Dec: -1.9, 'Common names': 'Flame Nebula', Magnitude: 7.2, Size: "30'x30'" },
  { Name: 'IC434', Type: 'DSO', RA: 85.25, Dec: -2.4583, 'Common names': 'Horsehead Nebula', Magnitude: 6.8, Size: "60'x10'" },
  { Name: 'M97', Type: 'DSO', RA: 168.6988, Dec: 55.0192, 'Common names': 'Owl Nebula', Magnitude: 9.9, Size: "3.4'x3.3'" },
  { Name: 'NGC7293', Type: 'DSO', RA: 337.4108, Dec: -20.8372, 'Common names': 'Helix Nebula', Magnitude: 7.6, Size: "13'" },
  { Name: 'M64', Type: 'DSO', RA: 194.1825, Dec: 21.6828, 'Common names': 'Black Eye Galaxy', Magnitude: 8.5, Size: "10'x5'" },
  { Name: 'NGC253', Type: 'DSO', RA: 11.888, Dec: -25.2883, 'Common names': 'Sculptor Galaxy', Magnitude: 7.2, Size: "28'x7'" },
];

/** Extended Messier catalog */
export const MESSIER_CATALOG: SearchResultItem[] = [
  ...POPULAR_DSOS.filter(d => d.Name.startsWith('M')),
  { Name: 'M2', Type: 'DSO', RA: 323.3625, Dec: -0.8231 },
  { Name: 'M3', Type: 'DSO', RA: 205.5483, Dec: 28.3772 },
  { Name: 'M4', Type: 'DSO', RA: 245.8967, Dec: -26.5256 },
  { Name: 'M5', Type: 'DSO', RA: 229.6383, Dec: 2.0811 },
  { Name: 'M6', Type: 'DSO', RA: 265.0833, Dec: -32.2167 },
  { Name: 'M7', Type: 'DSO', RA: 268.4667, Dec: -34.7933 },
  { Name: 'M9', Type: 'DSO', RA: 259.7992, Dec: -18.5164 },
  { Name: 'M10', Type: 'DSO', RA: 254.2875, Dec: -4.1003 },
  { Name: 'M11', Type: 'DSO', RA: 282.7667, Dec: -6.2667, 'Common names': 'Wild Duck Cluster' },
  { Name: 'M12', Type: 'DSO', RA: 251.8092, Dec: -1.9483 },
  { Name: 'M14', Type: 'DSO', RA: 264.4008, Dec: -3.2458 },
  { Name: 'M15', Type: 'DSO', RA: 322.4933, Dec: 12.1672 },
  { Name: 'M18', Type: 'DSO', RA: 274.9333, Dec: -17.1333 },
  { Name: 'M19', Type: 'DSO', RA: 255.6575, Dec: -26.2681 },
  { Name: 'M21', Type: 'DSO', RA: 270.9, Dec: -22.4833 },
  { Name: 'M22', Type: 'DSO', RA: 279.0992, Dec: -23.9047 },
  { Name: 'M23', Type: 'DSO', RA: 269.2667, Dec: -19.0167 },
  { Name: 'M24', Type: 'DSO', RA: 274.5333, Dec: -18.4833, 'Common names': 'Sagittarius Star Cloud' },
  { Name: 'M25', Type: 'DSO', RA: 277.9, Dec: -19.1167 },
  { Name: 'M26', Type: 'DSO', RA: 281.3167, Dec: -9.3833 },
  { Name: 'M28', Type: 'DSO', RA: 276.1367, Dec: -24.8697 },
  { Name: 'M29', Type: 'DSO', RA: 305.9667, Dec: 38.5333 },
  { Name: 'M30', Type: 'DSO', RA: 325.0917, Dec: -23.1797 },
  { Name: 'M32', Type: 'DSO', RA: 10.6742, Dec: 40.8652 },
  { Name: 'M34', Type: 'DSO', RA: 40.5167, Dec: 42.7833 },
  { Name: 'M35', Type: 'DSO', RA: 92.2833, Dec: 24.35 },
  { Name: 'M36', Type: 'DSO', RA: 84.0833, Dec: 34.1333 },
  { Name: 'M37', Type: 'DSO', RA: 88.0667, Dec: 32.55 },
  { Name: 'M38', Type: 'DSO', RA: 82.1667, Dec: 35.85 },
  { Name: 'M39', Type: 'DSO', RA: 323.0667, Dec: 48.4333 },
  { Name: 'M40', Type: 'DSO', RA: 185.5667, Dec: 58.0833, 'Common names': 'Winnecke 4' },
  { Name: 'M41', Type: 'DSO', RA: 101.5, Dec: -20.7333 },
  { Name: 'M43', Type: 'DSO', RA: 83.8833, Dec: -5.2667 },
  { Name: 'M44', Type: 'DSO', RA: 130.1, Dec: 19.6667, 'Common names': 'Beehive Cluster' },
  { Name: 'M46', Type: 'DSO', RA: 115.4333, Dec: -14.8167 },
  { Name: 'M47', Type: 'DSO', RA: 114.15, Dec: -14.4833 },
  { Name: 'M48', Type: 'DSO', RA: 123.4167, Dec: -5.8 },
  { Name: 'M49', Type: 'DSO', RA: 187.4442, Dec: 8.0003 },
  { Name: 'M50', Type: 'DSO', RA: 105.6833, Dec: -8.3333 },
  { Name: 'M52', Type: 'DSO', RA: 351.2, Dec: 61.5833 },
  { Name: 'M53', Type: 'DSO', RA: 198.2292, Dec: 18.1683 },
  { Name: 'M54', Type: 'DSO', RA: 283.7633, Dec: -30.4783 },
  { Name: 'M55', Type: 'DSO', RA: 294.9983, Dec: -30.9647 },
  { Name: 'M56', Type: 'DSO', RA: 289.1483, Dec: 30.1836 },
  { Name: 'M58', Type: 'DSO', RA: 189.4308, Dec: 11.8181 },
  { Name: 'M59', Type: 'DSO', RA: 190.5092, Dec: 11.6472 },
  { Name: 'M60', Type: 'DSO', RA: 190.9167, Dec: 11.5528 },
  { Name: 'M61', Type: 'DSO', RA: 185.4792, Dec: 4.4739 },
  { Name: 'M62', Type: 'DSO', RA: 255.3033, Dec: -30.1136 },
  { Name: 'M63', Type: 'DSO', RA: 198.9558, Dec: 42.0294, 'Common names': 'Sunflower Galaxy' },
  { Name: 'M65', Type: 'DSO', RA: 169.7333, Dec: 13.0922 },
  { Name: 'M66', Type: 'DSO', RA: 170.0625, Dec: 12.9914 },
  { Name: 'M67', Type: 'DSO', RA: 132.825, Dec: 11.8167 },
  { Name: 'M68', Type: 'DSO', RA: 189.8667, Dec: -26.7447 },
  { Name: 'M69', Type: 'DSO', RA: 277.8458, Dec: -32.3481 },
  { Name: 'M70', Type: 'DSO', RA: 280.8033, Dec: -32.2908 },
  { Name: 'M71', Type: 'DSO', RA: 298.4433, Dec: 18.7792 },
  { Name: 'M72', Type: 'DSO', RA: 313.3642, Dec: -12.5372 },
  { Name: 'M73', Type: 'DSO', RA: 314.75, Dec: -12.6333 },
  { Name: 'M74', Type: 'DSO', RA: 24.1742, Dec: 15.7833, 'Common names': 'Phantom Galaxy' },
  { Name: 'M75', Type: 'DSO', RA: 301.5208, Dec: -21.9211 },
  { Name: 'M76', Type: 'DSO', RA: 25.5817, Dec: 51.5753, 'Common names': 'Little Dumbbell Nebula' },
  { Name: 'M77', Type: 'DSO', RA: 40.6696, Dec: -0.0133, 'Common names': 'Cetus A' },
  { Name: 'M79', Type: 'DSO', RA: 81.0458, Dec: -24.5244 },
  { Name: 'M80', Type: 'DSO', RA: 244.2608, Dec: -22.9756 },
  { Name: 'M83', Type: 'DSO', RA: 204.2538, Dec: -29.8656, 'Common names': 'Southern Pinwheel Galaxy' },
  { Name: 'M84', Type: 'DSO', RA: 186.2658, Dec: 12.8869 },
  { Name: 'M85', Type: 'DSO', RA: 186.3508, Dec: 18.1911 },
  { Name: 'M86', Type: 'DSO', RA: 186.5492, Dec: 12.9461 },
  { Name: 'M87', Type: 'DSO', RA: 187.7058, Dec: 12.3911, 'Common names': 'Virgo A' },
  { Name: 'M88', Type: 'DSO', RA: 187.9967, Dec: 14.4203 },
  { Name: 'M89', Type: 'DSO', RA: 188.9158, Dec: 12.5564 },
  { Name: 'M90', Type: 'DSO', RA: 189.2092, Dec: 13.1628 },
  { Name: 'M91', Type: 'DSO', RA: 188.8642, Dec: 14.4969 },
  { Name: 'M92', Type: 'DSO', RA: 259.2808, Dec: 43.1364 },
  { Name: 'M93', Type: 'DSO', RA: 116.1333, Dec: -23.8667 },
  { Name: 'M94', Type: 'DSO', RA: 192.7217, Dec: 41.1203, 'Common names': "Cat's Eye Galaxy" },
  { Name: 'M95', Type: 'DSO', RA: 160.9908, Dec: 11.7039 },
  { Name: 'M96', Type: 'DSO', RA: 161.6908, Dec: 11.8197 },
  { Name: 'M98', Type: 'DSO', RA: 183.4517, Dec: 14.9003 },
  { Name: 'M99', Type: 'DSO', RA: 184.7067, Dec: 14.4164, 'Common names': 'Coma Pinwheel' },
  { Name: 'M100', Type: 'DSO', RA: 185.7288, Dec: 15.8222 },
  { Name: 'M102', Type: 'DSO', RA: 226.6233, Dec: 55.7636, 'Common names': 'Spindle Galaxy' },
  { Name: 'M103', Type: 'DSO', RA: 23.3417, Dec: 60.7 },
  { Name: 'M105', Type: 'DSO', RA: 161.9567, Dec: 12.5817 },
  { Name: 'M106', Type: 'DSO', RA: 184.7396, Dec: 47.3039 },
  { Name: 'M107', Type: 'DSO', RA: 248.1333, Dec: -13.0536 },
  { Name: 'M108', Type: 'DSO', RA: 167.8792, Dec: 55.6742, 'Common names': 'Surfboard Galaxy' },
  { Name: 'M109', Type: 'DSO', RA: 179.4, Dec: 53.3744 },
  { Name: 'M110', Type: 'DSO', RA: 10.0917, Dec: 41.6853 },
];

/** Constellation data for search */
export const CONSTELLATION_SEARCH_DATA: SearchResultItem[] = [
  { Name: 'Orion', Type: 'Constellation', RA: 85.0, Dec: 0.0, 'Common names': 'The Hunter' },
  { Name: 'Ursa Major', Type: 'Constellation', RA: 165.0, Dec: 55.0, 'Common names': 'Great Bear, Big Dipper' },
  { Name: 'Ursa Minor', Type: 'Constellation', RA: 225.0, Dec: 75.0, 'Common names': 'Little Bear, Little Dipper' },
  { Name: 'Cassiopeia', Type: 'Constellation', RA: 15.0, Dec: 60.0, 'Common names': 'The Queen' },
  { Name: 'Cygnus', Type: 'Constellation', RA: 310.0, Dec: 45.0, 'Common names': 'The Swan, Northern Cross' },
  { Name: 'Leo', Type: 'Constellation', RA: 165.0, Dec: 15.0, 'Common names': 'The Lion' },
  { Name: 'Scorpius', Type: 'Constellation', RA: 255.0, Dec: -30.0, 'Common names': 'The Scorpion' },
  { Name: 'Sagittarius', Type: 'Constellation', RA: 285.0, Dec: -30.0, 'Common names': 'The Archer' },
  { Name: 'Andromeda', Type: 'Constellation', RA: 10.0, Dec: 40.0, 'Common names': 'The Chained Princess' },
  { Name: 'Perseus', Type: 'Constellation', RA: 50.0, Dec: 45.0, 'Common names': 'The Hero' },
  { Name: 'Taurus', Type: 'Constellation', RA: 65.0, Dec: 20.0, 'Common names': 'The Bull' },
  { Name: 'Gemini', Type: 'Constellation', RA: 105.0, Dec: 25.0, 'Common names': 'The Twins' },
  { Name: 'Virgo', Type: 'Constellation', RA: 195.0, Dec: 0.0, 'Common names': 'The Maiden' },
  { Name: 'Aquarius', Type: 'Constellation', RA: 330.0, Dec: -10.0, 'Common names': 'The Water Bearer' },
  { Name: 'Pisces', Type: 'Constellation', RA: 0.0, Dec: 10.0, 'Common names': 'The Fish' },
  { Name: 'Aries', Type: 'Constellation', RA: 35.0, Dec: 20.0, 'Common names': 'The Ram' },
  { Name: 'Cancer', Type: 'Constellation', RA: 130.0, Dec: 20.0, 'Common names': 'The Crab' },
  { Name: 'Capricornus', Type: 'Constellation', RA: 315.0, Dec: -20.0, 'Common names': 'The Sea Goat' },
  { Name: 'Libra', Type: 'Constellation', RA: 225.0, Dec: -15.0, 'Common names': 'The Scales' },
  { Name: 'Draco', Type: 'Constellation', RA: 255.0, Dec: 65.0, 'Common names': 'The Dragon' },
  { Name: 'Lyra', Type: 'Constellation', RA: 285.0, Dec: 35.0, 'Common names': 'The Lyre' },
  { Name: 'Aquila', Type: 'Constellation', RA: 295.0, Dec: 5.0, 'Common names': 'The Eagle' },
  { Name: 'Pegasus', Type: 'Constellation', RA: 340.0, Dec: 20.0, 'Common names': 'The Winged Horse' },
  { Name: 'Centaurus', Type: 'Constellation', RA: 195.0, Dec: -45.0, 'Common names': 'The Centaur' },
  { Name: 'Canis Major', Type: 'Constellation', RA: 105.0, Dec: -20.0, 'Common names': 'The Great Dog' },
  { Name: 'Canis Minor', Type: 'Constellation', RA: 115.0, Dec: 5.0, 'Common names': 'The Little Dog' },
  { Name: 'Carina', Type: 'Constellation', RA: 135.0, Dec: -60.0, 'Common names': 'The Keel' },
  { Name: 'Puppis', Type: 'Constellation', RA: 120.0, Dec: -35.0, 'Common names': 'The Stern' },
  { Name: 'Vela', Type: 'Constellation', RA: 140.0, Dec: -50.0, 'Common names': 'The Sails' },
];

// ============================================================================
// Shared Search Matching
// ============================================================================

/**
 * Get match score using advanced search algorithm.
 * Supports catalog prefixes (M, NGC, IC), Jaro-Winkler distance,
 * common name mappings, phonetic variations, and multi-field matching.
 */
export function getMatchScore(item: SearchResultItem, query: string): number {
  const queryLower = query.toLowerCase().trim();
  
  // 1. Check common name mappings first (e.g., "orion nebula" → M42)
  const commonNameMatches = COMMON_NAME_TO_CATALOG[queryLower];
  if (commonNameMatches) {
    const itemNameUpper = item.Name.toUpperCase();
    if (commonNameMatches.some(cat => itemNameUpper === cat.toUpperCase())) {
      return 1.8;
    }
  }
  
  // 2. Check phonetic variations (e.g., "andromida" → "andromeda")
  for (const [correctName, variations] of Object.entries(PHONETIC_VARIATIONS)) {
    if (variations.some(v => queryLower.includes(v) || v.includes(queryLower))) {
      const catalogMatches = COMMON_NAME_TO_CATALOG[correctName];
      if (catalogMatches) {
        const itemNameUpper = item.Name.toUpperCase();
        if (catalogMatches.some(cat => itemNameUpper === cat.toUpperCase())) {
          return 1.7;
        }
      }
      if (item['Common names']?.toLowerCase().includes(correctName)) {
        return 1.6;
      }
    }
  }
  
  // 3. Check if query is a catalog ID (e.g., "m31", "ngc 7000")
  const parsedCatalog = parseCatalogId(query);
  if (parsedCatalog) {
    const itemParsed = parseCatalogId(item.Name);
    if (itemParsed && 
        itemParsed.catalog === parsedCatalog.catalog && 
        itemParsed.number === parsedCatalog.number) {
      return 2.0;
    }
  }
  
  // 4. Use Jaro-Winkler for common name matching (better for typos)
  if (item['Common names']) {
    const commonNameLower = item['Common names'].toLowerCase();
    const jwScore = jaroWinklerSimilarity(queryLower, commonNameLower);
    if (jwScore > 0.85) {
      return jwScore * 1.5;
    }
    const commonWords = commonNameLower.split(/[\s,]+/);
    for (const word of commonWords) {
      if (word.length > 2) {
        const wordScore = jaroWinklerSimilarity(queryLower, word);
        if (wordScore > 0.85) {
          return wordScore * 1.3;
        }
      }
    }
  }
  
  // 5. Fall back to standard search matching
  const result = calculateSearchMatch(
    query,
    item.Name,
    undefined,
    item['Common names']
  );
  return result.score;
}

/**
 * Get detailed match result for an item.
 */
export function getDetailedMatch(item: SearchResultItem, query: string): SearchMatchResult {
  return calculateSearchMatch(
    query,
    item.Name,
    undefined,
    item['Common names']
  );
}

/**
 * Legacy fuzzy match for backward compatibility.
 */
export function fuzzyMatch(text: string, query: string): number {
  const result = calculateSearchMatch(query, text);
  return result.score;
}

// ============================================================================
// Search Index
// ============================================================================

/** Pre-computed search indices for faster lookups */
export const DSO_NAME_INDEX = new Map<string, SearchResultItem[]>();

function initializeSearchIndex() {
  [...POPULAR_DSOS, ...MESSIER_CATALOG].forEach(item => {
    const firstChar = item.Name[0].toUpperCase();
    if (!DSO_NAME_INDEX.has(firstChar)) {
      DSO_NAME_INDEX.set(firstChar, []);
    }
    DSO_NAME_INDEX.get(firstChar)!.push(item);
  });
}
initializeSearchIndex();
