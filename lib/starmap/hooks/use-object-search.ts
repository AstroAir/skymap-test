'use client';

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useStellariumStore } from '@/lib/starmap/stores';
import type { SearchResultItem } from '@/lib/starmap/types';
import { useTargetListStore } from '@/lib/starmap/stores/target-list-store';

// ============================================================================
// Data Sources
// ============================================================================

/** Celestial bodies (planets, sun, moon) */
const CELESTIAL_BODIES: SearchResultItem[] = [
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

/** Popular DSO catalog for quick search */
const POPULAR_DSOS: SearchResultItem[] = [
  { Name: 'M31', Type: 'DSO', RA: 10.6847, Dec: 41.2689, 'Common names': 'Andromeda Galaxy' },
  { Name: 'M42', Type: 'DSO', RA: 83.8221, Dec: -5.3911, 'Common names': 'Orion Nebula' },
  { Name: 'M45', Type: 'DSO', RA: 56.75, Dec: 24.1167, 'Common names': 'Pleiades' },
  { Name: 'M1', Type: 'DSO', RA: 83.6333, Dec: 22.0167, 'Common names': 'Crab Nebula' },
  { Name: 'M51', Type: 'DSO', RA: 202.4696, Dec: 47.1952, 'Common names': 'Whirlpool Galaxy' },
  { Name: 'M101', Type: 'DSO', RA: 210.8024, Dec: 54.3488, 'Common names': 'Pinwheel Galaxy' },
  { Name: 'M104', Type: 'DSO', RA: 189.9976, Dec: -11.6231, 'Common names': 'Sombrero Galaxy' },
  { Name: 'M13', Type: 'DSO', RA: 250.4217, Dec: 36.4613, 'Common names': 'Hercules Cluster' },
  { Name: 'M57', Type: 'DSO', RA: 283.3962, Dec: 33.0286, 'Common names': 'Ring Nebula' },
  { Name: 'M27', Type: 'DSO', RA: 299.9017, Dec: 22.7211, 'Common names': 'Dumbbell Nebula' },
  { Name: 'NGC7000', Type: 'DSO', RA: 314.6833, Dec: 44.3167, 'Common names': 'North America Nebula' },
  { Name: 'NGC6992', Type: 'DSO', RA: 312.7583, Dec: 31.7167, 'Common names': 'Veil Nebula' },
  { Name: 'IC1396', Type: 'DSO', RA: 324.7458, Dec: 57.4833, 'Common names': 'Elephant Trunk Nebula' },
  { Name: 'NGC2244', Type: 'DSO', RA: 97.9833, Dec: 4.9333, 'Common names': 'Rosette Nebula' },
  { Name: 'M8', Type: 'DSO', RA: 270.9208, Dec: -24.3833, 'Common names': 'Lagoon Nebula' },
  { Name: 'M20', Type: 'DSO', RA: 270.6208, Dec: -23.0333, 'Common names': 'Trifid Nebula' },
  { Name: 'M16', Type: 'DSO', RA: 274.7, Dec: -13.8167, 'Common names': 'Eagle Nebula' },
  { Name: 'M17', Type: 'DSO', RA: 275.1958, Dec: -16.1833, 'Common names': 'Omega Nebula' },
  { Name: 'NGC6888', Type: 'DSO', RA: 303.0583, Dec: 38.35, 'Common names': 'Crescent Nebula' },
  { Name: 'M33', Type: 'DSO', RA: 23.4621, Dec: 30.6599, 'Common names': 'Triangulum Galaxy' },
  { Name: 'M81', Type: 'DSO', RA: 148.8882, Dec: 69.0653, 'Common names': "Bode's Galaxy" },
  { Name: 'M82', Type: 'DSO', RA: 148.9685, Dec: 69.6797, 'Common names': 'Cigar Galaxy' },
  { Name: 'NGC6960', Type: 'DSO', RA: 312.2417, Dec: 30.7333, 'Common names': "Witch's Broom Nebula" },
  { Name: 'M78', Type: 'DSO', RA: 86.6917, Dec: 0.0833, 'Common names': 'Reflection Nebula' },
  { Name: 'NGC2024', Type: 'DSO', RA: 85.4208, Dec: -1.9, 'Common names': 'Flame Nebula' },
  { Name: 'IC434', Type: 'DSO', RA: 85.25, Dec: -2.4583, 'Common names': 'Horsehead Nebula' },
  { Name: 'M97', Type: 'DSO', RA: 168.6988, Dec: 55.0192, 'Common names': 'Owl Nebula' },
  { Name: 'NGC7293', Type: 'DSO', RA: 337.4108, Dec: -20.8372, 'Common names': 'Helix Nebula' },
  { Name: 'M64', Type: 'DSO', RA: 194.1825, Dec: 21.6828, 'Common names': 'Black Eye Galaxy' },
  { Name: 'NGC253', Type: 'DSO', RA: 11.888, Dec: -25.2883, 'Common names': 'Sculptor Galaxy' },
];

/** Extended Messier catalog */
const MESSIER_CATALOG: SearchResultItem[] = [
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

// ============================================================================
// Fuzzy Search Utility
// ============================================================================

/**
 * Simple fuzzy match scoring function
 * Returns a score from 0 to 1, where 1 is an exact match
 * Returns 0 if no match found
 */
function fuzzyMatch(text: string, query: string): number {
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();
  
  // Exact match gets highest score
  if (textLower === queryLower) return 1;
  
  // Starts with query gets high score
  if (textLower.startsWith(queryLower)) return 0.9;
  
  // Contains query as substring
  if (textLower.includes(queryLower)) return 0.7;
  
  // Fuzzy character matching
  let queryIndex = 0;
  let consecutiveMatches = 0;
  let maxConsecutive = 0;
  
  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      queryIndex++;
      consecutiveMatches++;
      maxConsecutive = Math.max(maxConsecutive, consecutiveMatches);
    } else {
      consecutiveMatches = 0;
    }
  }
  
  // All query characters must be found in order
  if (queryIndex < queryLower.length) return 0;
  
  // Score based on match quality
  const lengthRatio = queryLower.length / textLower.length;
  const consecutiveBonus = maxConsecutive / queryLower.length;
  
  return 0.3 + (lengthRatio * 0.2) + (consecutiveBonus * 0.2);
}

/**
 * Check if item matches query with fuzzy matching
 * Returns match score or 0 if no match
 */
function getMatchScore(item: SearchResultItem, query: string): number {
  const nameScore = fuzzyMatch(item.Name, query);
  const commonNameScore = item['Common names'] ? fuzzyMatch(item['Common names'], query) : 0;
  return Math.max(nameScore, commonNameScore);
}

// ============================================================================
// Types
// ============================================================================

export type ObjectType = 'DSO' | 'Planet' | 'Star' | 'Moon' | 'Comet' | 'TargetList' | 'Constellation';
export type SortOption = 'name' | 'type' | 'ra' | 'relevance';
export type SearchMode = 'name' | 'coordinates' | 'catalog';

export interface SearchFilters {
  types: ObjectType[];
  includeTargetList: boolean;
  searchMode: SearchMode;
}

// Constellation data for search
const CONSTELLATIONS: SearchResultItem[] = [
  { Name: 'Orion', Type: 'Constellation' as const, RA: 85.0, Dec: 0.0, 'Common names': 'The Hunter' },
  { Name: 'Ursa Major', Type: 'Constellation' as const, RA: 165.0, Dec: 55.0, 'Common names': 'Great Bear, Big Dipper' },
  { Name: 'Ursa Minor', Type: 'Constellation' as const, RA: 225.0, Dec: 75.0, 'Common names': 'Little Bear, Little Dipper' },
  { Name: 'Cassiopeia', Type: 'Constellation' as const, RA: 15.0, Dec: 60.0, 'Common names': 'The Queen' },
  { Name: 'Cygnus', Type: 'Constellation' as const, RA: 310.0, Dec: 45.0, 'Common names': 'The Swan, Northern Cross' },
  { Name: 'Leo', Type: 'Constellation' as const, RA: 165.0, Dec: 15.0, 'Common names': 'The Lion' },
  { Name: 'Scorpius', Type: 'Constellation' as const, RA: 255.0, Dec: -30.0, 'Common names': 'The Scorpion' },
  { Name: 'Sagittarius', Type: 'Constellation' as const, RA: 285.0, Dec: -30.0, 'Common names': 'The Archer' },
  { Name: 'Andromeda', Type: 'Constellation' as const, RA: 10.0, Dec: 40.0, 'Common names': 'The Chained Princess' },
  { Name: 'Perseus', Type: 'Constellation' as const, RA: 50.0, Dec: 45.0, 'Common names': 'The Hero' },
  { Name: 'Taurus', Type: 'Constellation' as const, RA: 65.0, Dec: 20.0, 'Common names': 'The Bull' },
  { Name: 'Gemini', Type: 'Constellation' as const, RA: 105.0, Dec: 25.0, 'Common names': 'The Twins' },
  { Name: 'Virgo', Type: 'Constellation' as const, RA: 195.0, Dec: 0.0, 'Common names': 'The Maiden' },
  { Name: 'Aquarius', Type: 'Constellation' as const, RA: 330.0, Dec: -10.0, 'Common names': 'The Water Bearer' },
  { Name: 'Pisces', Type: 'Constellation' as const, RA: 0.0, Dec: 10.0, 'Common names': 'The Fish' },
  { Name: 'Aries', Type: 'Constellation' as const, RA: 35.0, Dec: 20.0, 'Common names': 'The Ram' },
  { Name: 'Cancer', Type: 'Constellation' as const, RA: 130.0, Dec: 20.0, 'Common names': 'The Crab' },
  { Name: 'Capricornus', Type: 'Constellation' as const, RA: 315.0, Dec: -20.0, 'Common names': 'The Sea Goat' },
  { Name: 'Libra', Type: 'Constellation' as const, RA: 225.0, Dec: -15.0, 'Common names': 'The Scales' },
  { Name: 'Draco', Type: 'Constellation' as const, RA: 255.0, Dec: 65.0, 'Common names': 'The Dragon' },
  { Name: 'Lyra', Type: 'Constellation' as const, RA: 285.0, Dec: 35.0, 'Common names': 'The Lyre' },
  { Name: 'Aquila', Type: 'Constellation' as const, RA: 295.0, Dec: 5.0, 'Common names': 'The Eagle' },
  { Name: 'Pegasus', Type: 'Constellation' as const, RA: 340.0, Dec: 20.0, 'Common names': 'The Winged Horse' },
  { Name: 'Centaurus', Type: 'Constellation' as const, RA: 195.0, Dec: -45.0, 'Common names': 'The Centaur' },
  { Name: 'Canis Major', Type: 'Constellation' as const, RA: 105.0, Dec: -20.0, 'Common names': 'The Great Dog' },
  { Name: 'Canis Minor', Type: 'Constellation' as const, RA: 115.0, Dec: 5.0, 'Common names': 'The Little Dog' },
  { Name: 'Carina', Type: 'Constellation' as const, RA: 135.0, Dec: -60.0, 'Common names': 'The Keel' },
  { Name: 'Puppis', Type: 'Constellation' as const, RA: 120.0, Dec: -35.0, 'Common names': 'The Stern' },
  { Name: 'Vela', Type: 'Constellation' as const, RA: 140.0, Dec: -50.0, 'Common names': 'The Sails' },
];

// Parse coordinate string (supports various formats)
function parseCoordinateSearch(query: string): { ra: number; dec: number } | null {
  // Try to parse as "RA Dec" format
  // Formats: "10.68 41.27", "00h42m44s +41°16'09\"", "00:42:44 +41:16:09"
  
  const trimmed = query.trim();
  
  // Try decimal format: "10.68 41.27" or "10.68, 41.27"
  const decimalMatch = trimmed.match(/^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/);
  if (decimalMatch) {
    const ra = parseFloat(decimalMatch[1]);
    const dec = parseFloat(decimalMatch[2]);
    if (!isNaN(ra) && !isNaN(dec) && ra >= 0 && ra < 360 && dec >= -90 && dec <= 90) {
      return { ra, dec };
    }
  }
  
  // Try HMS/DMS format: "00h42m44s +41°16'09\""
  const hmsMatch = trimmed.match(/(\d+)h\s*(\d+)m\s*([\d.]+)s?\s+([+-]?\d+)[°d]\s*(\d+)[′']\s*([\d.]+)[″"]?/i);
  if (hmsMatch) {
    const raH = parseInt(hmsMatch[1]);
    const raM = parseInt(hmsMatch[2]);
    const raS = parseFloat(hmsMatch[3]);
    const decD = parseInt(hmsMatch[4]);
    const decM = parseInt(hmsMatch[5]);
    const decS = parseFloat(hmsMatch[6]);
    
    const ra = (raH + raM / 60 + raS / 3600) * 15; // Convert hours to degrees
    const decSign = decD < 0 || hmsMatch[4].startsWith('-') ? -1 : 1;
    const dec = decSign * (Math.abs(decD) + decM / 60 + decS / 3600);
    
    if (ra >= 0 && ra < 360 && dec >= -90 && dec <= 90) {
      return { ra, dec };
    }
  }
  
  // Try colon format: "00:42:44 +41:16:09"
  const colonMatch = trimmed.match(/(\d+):(\d+):([\d.]+)\s+([+-]?\d+):(\d+):([\d.]+)/);
  if (colonMatch) {
    const raH = parseInt(colonMatch[1]);
    const raM = parseInt(colonMatch[2]);
    const raS = parseFloat(colonMatch[3]);
    const decD = parseInt(colonMatch[4]);
    const decM = parseInt(colonMatch[5]);
    const decS = parseFloat(colonMatch[6]);
    
    const ra = (raH + raM / 60 + raS / 3600) * 15;
    const decSign = decD < 0 || colonMatch[4].startsWith('-') ? -1 : 1;
    const dec = decSign * (Math.abs(decD) + decM / 60 + decS / 3600);
    
    if (ra >= 0 && ra < 360 && dec >= -90 && dec <= 90) {
      return { ra, dec };
    }
  }
  
  return null;
}

// Format RA in HMS
function formatRA(raDeg: number): string {
  const hours = raDeg / 15;
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  const s = ((hours - h) * 60 - m) * 60;
  return `${h.toString().padStart(2, '0')}h${m.toString().padStart(2, '0')}m${s.toFixed(1)}s`;
}

// Format Dec in DMS
function formatDec(decDeg: number): string {
  const sign = decDeg >= 0 ? '+' : '-';
  const absD = Math.abs(decDeg);
  const d = Math.floor(absD);
  const m = Math.floor((absD - d) * 60);
  const s = ((absD - d) * 60 - m) * 60;
  return `${sign}${d.toString().padStart(2, '0')}°${m.toString().padStart(2, '0')}'${s.toFixed(1)}"`;
}

export interface SearchState {
  query: string;
  results: SearchResultItem[];
  isSearching: boolean;
  selectedIds: Set<string>;
  filters: SearchFilters;
  sortBy: SortOption;
}

export interface UseObjectSearchReturn {
  // State
  query: string;
  results: SearchResultItem[];
  groupedResults: Map<string, SearchResultItem[]>;
  isSearching: boolean;
  selectedIds: Set<string>;
  filters: SearchFilters;
  sortBy: SortOption;
  recentSearches: string[];
  
  // Actions
  setQuery: (query: string) => void;
  search: (query: string) => void;
  clearSearch: () => void;
  toggleSelection: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  setFilters: (filters: Partial<SearchFilters>) => void;
  setSortBy: (sort: SortOption) => void;
  addRecentSearch: (query: string) => void;
  
  // Helpers
  getSelectedItems: () => SearchResultItem[];
  isSelected: (id: string) => boolean;
  
  // Quick access
  popularObjects: SearchResultItem[];
  quickCategories: { label: string; items: SearchResultItem[] }[];
}

// ============================================================================
// Hook Implementation
// ============================================================================

const DEBOUNCE_MS = 150;
const MAX_RESULTS = 50;
const MAX_RECENT = 8;
const FUZZY_THRESHOLD = 0.3; // Minimum score to include in results

// Generate unique ID for search result
function getResultId(item: SearchResultItem): string {
  return `${item.Type || 'unknown'}-${item.Name}`;
}

export function useObjectSearch(): UseObjectSearchReturn {
  const stel = useStellariumStore((state) => state.stel);
  const targets = useTargetListStore((state) => state.targets);
  
  const [state, setState] = useState<SearchState>({
    query: '',
    results: [],
    isSearching: false,
    selectedIds: new Set(),
    filters: {
      types: ['DSO', 'Planet', 'Star', 'Moon', 'Comet', 'TargetList', 'Constellation'],
      includeTargetList: true,
      searchMode: 'name',
    },
    sortBy: 'relevance',
  });
  
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('starmap-recent-searches');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Save recent searches to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('starmap-recent-searches', JSON.stringify(recentSearches));
    }
  }, [recentSearches]);
  
  // Search implementation
  const performSearch = useCallback(async (query: string, filters: SearchFilters) => {
    if (!query.trim()) {
      setState(prev => ({ ...prev, results: [], isSearching: false }));
      return;
    }
    
    setState(prev => ({ ...prev, isSearching: true }));
    
    const results: SearchResultItem[] = [];
    const lowerQuery = query.toLowerCase().trim();
    const addedNames = new Set<string>();
    
    // Helper to add result without duplicates, with fuzzy score
    const addResult = (item: SearchResultItem, score: number = 1) => {
      const key = `${item.Type}-${item.Name}`;
      if (!addedNames.has(key)) {
        addedNames.add(key);
        results.push({ ...item, _fuzzyScore: score } as SearchResultItem & { _fuzzyScore: number });
      }
    };
    
    // 1. Search user's target list
    if (filters.includeTargetList && filters.types.includes('TargetList')) {
      for (const target of targets) {
        if (target.name.toLowerCase().includes(lowerQuery)) {
          addResult({
            Name: target.name,
            Type: 'DSO',
            RA: target.ra,
            Dec: target.dec,
            'Common names': 'From Target List',
          });
        }
      }
    }
    
    // 2. Check for coordinate search
    const coordResult = parseCoordinateSearch(query);
    if (coordResult) {
      addResult({
        Name: `${formatRA(coordResult.ra)} ${formatDec(coordResult.dec)}`,
        Type: 'Coordinates',
        RA: coordResult.ra,
        Dec: coordResult.dec,
        'Common names': 'Custom Coordinates',
      }, 2.0); // High score for exact coordinate match
    }
    
    // 3. Search DSO catalogs with fuzzy matching
    if (filters.types.includes('DSO')) {
      // Search popular DSOs first
      for (const dso of POPULAR_DSOS) {
        const score = getMatchScore(dso, query);
        if (score >= FUZZY_THRESHOLD) {
          addResult(dso, score);
        }
      }
      
      // Search extended Messier catalog
      for (const dso of MESSIER_CATALOG) {
        const score = getMatchScore(dso, query);
        if (score >= FUZZY_THRESHOLD) {
          addResult(dso, score);
        }
      }
    }
    
    // 4. Search constellations
    if (filters.types.includes('Constellation')) {
      for (const constellation of CONSTELLATIONS) {
        const score = getMatchScore(constellation, query);
        if (score >= FUZZY_THRESHOLD) {
          addResult(constellation, score);
        }
      }
    }
    
    // 5. Search celestial bodies via Stellarium with fuzzy matching
    if (stel) {
      // Planets, Sun, Moon
      if (filters.types.includes('Planet') || filters.types.includes('Star') || filters.types.includes('Moon')) {
        for (const body of CELESTIAL_BODIES) {
          if (!filters.types.includes(body.Type as ObjectType)) continue;
          
          const score = fuzzyMatch(body.Name, query);
          if (score >= FUZZY_THRESHOLD) {
            try {
              const obj = stel.getObj(`NAME ${body.Name}`);
              if (obj && obj.designations && obj.designations().length > 0) {
                addResult({ ...body, StellariumObj: obj }, score);
              } else {
                addResult(body, score);
              }
            } catch {
              addResult(body, score);
            }
          }
        }
      }
      
      // Comets
      if (filters.types.includes('Comet')) {
        try {
          const comets = stel.core.comets;
          if (comets && comets.listObjs) {
            const cometList = comets.listObjs(stel.core.observer, 100, () => true);
            for (const comet of cometList) {
              if (comet.designations) {
                const designations = comet.designations();
                for (const designation of designations) {
                  const name = designation.replace(/^NAME /, '');
                  if (name.toLowerCase().includes(lowerQuery)) {
                    addResult({
                      Name: name,
                      Type: 'Comet',
                      StellariumObj: comet,
                    });
                    break;
                  }
                }
              }
              if (results.length >= MAX_RESULTS) break;
            }
          }
        } catch (error) {
          console.log('Comet search error:', error);
        }
      }
    } else {
      // Fallback when Stellarium not available - with fuzzy matching
      if (filters.types.includes('Planet') || filters.types.includes('Star') || filters.types.includes('Moon')) {
        for (const body of CELESTIAL_BODIES) {
          const score = fuzzyMatch(body.Name, query);
          if (score >= FUZZY_THRESHOLD) {
            addResult(body, score);
          }
        }
      }
    }
    
    // Sort results by fuzzy score (highest first)
    const sortedResults = results
      .sort((a, b) => {
        const scoreA = (a as SearchResultItem & { _fuzzyScore?: number })._fuzzyScore || 0;
        const scoreB = (b as SearchResultItem & { _fuzzyScore?: number })._fuzzyScore || 0;
        return scoreB - scoreA;
      })
      .slice(0, MAX_RESULTS);
    
    setState(prev => ({
      ...prev,
      results: sortedResults,
      isSearching: false,
    }));
  }, [stel, targets]);
  
  // Debounced search
  const search = useCallback((query: string) => {
    setState(prev => ({ ...prev, query }));
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      performSearch(query, state.filters);
    }, DEBOUNCE_MS);
  }, [performSearch, state.filters]);
  
  const setQuery = useCallback((query: string) => {
    search(query);
  }, [search]);
  
  const clearSearch = useCallback(() => {
    setState(prev => ({
      ...prev,
      query: '',
      results: [],
      selectedIds: new Set(),
    }));
  }, []);
  
  // Selection management
  const toggleSelection = useCallback((id: string) => {
    setState(prev => {
      const newSelected = new Set(prev.selectedIds);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return { ...prev, selectedIds: newSelected };
    });
  }, []);
  
  const selectAll = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedIds: new Set(prev.results.map(r => getResultId(r))),
    }));
  }, []);
  
  const clearSelection = useCallback(() => {
    setState(prev => ({ ...prev, selectedIds: new Set() }));
  }, []);
  
  const getSelectedItems = useCallback((): SearchResultItem[] => {
    return state.results.filter(r => state.selectedIds.has(getResultId(r)));
  }, [state.results, state.selectedIds]);
  
  const isSelected = useCallback((id: string): boolean => {
    return state.selectedIds.has(id);
  }, [state.selectedIds]);
  
  // Filters
  const setFilters = useCallback((updates: Partial<SearchFilters>) => {
    setState(prev => {
      const newFilters = { ...prev.filters, ...updates };
      // Re-run search with new filters
      if (prev.query) {
        performSearch(prev.query, newFilters);
      }
      return { ...prev, filters: newFilters };
    });
  }, [performSearch]);
  
  const setSortBy = useCallback((sort: SortOption) => {
    setState(prev => ({ ...prev, sortBy: sort }));
  }, []);
  
  // Recent searches
  const addRecentSearch = useCallback((query: string) => {
    if (!query.trim()) return;
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s !== query);
      return [query, ...filtered].slice(0, MAX_RECENT);
    });
  }, []);
  
  // Grouped results by type
  const groupedResults = useMemo(() => {
    const groups = new Map<string, SearchResultItem[]>();
    
    // Sort results first
    const sorted = [...state.results].sort((a, b) => {
      switch (state.sortBy) {
        case 'name':
          return a.Name.localeCompare(b.Name);
        case 'type':
          return (a.Type || '').localeCompare(b.Type || '');
        case 'ra':
          return (a.RA || 0) - (b.RA || 0);
        default:
          return 0;
      }
    });
    
    for (const item of sorted) {
      const type = item.Type || 'Unknown';
      if (!groups.has(type)) {
        groups.set(type, []);
      }
      groups.get(type)!.push(item);
    }
    
    return groups;
  }, [state.results, state.sortBy]);
  
  // Quick access data
  const popularObjects = useMemo(() => POPULAR_DSOS.slice(0, 10), []);
  
  const quickCategories = useMemo(() => [
    { label: 'Galaxies', items: POPULAR_DSOS.filter(d => d['Common names']?.includes('Galaxy')) },
    { label: 'Nebulae', items: POPULAR_DSOS.filter(d => d['Common names']?.includes('Nebula')) },
    { label: 'Planets', items: CELESTIAL_BODIES.filter(b => b.Type === 'Planet') },
    { label: 'Clusters', items: POPULAR_DSOS.filter(d => d['Common names']?.includes('Cluster')) },
  ], []);
  
  return {
    query: state.query,
    results: state.results,
    groupedResults,
    isSearching: state.isSearching,
    selectedIds: state.selectedIds,
    filters: state.filters,
    sortBy: state.sortBy,
    recentSearches,
    
    setQuery,
    search,
    clearSearch,
    toggleSelection,
    selectAll,
    clearSelection,
    setFilters,
    setSortBy,
    addRecentSearch,
    
    getSelectedItems,
    isSelected,
    
    popularObjects,
    quickCategories,
  };
}
