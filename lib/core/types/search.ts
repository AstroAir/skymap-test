/**
 * Search-related type definitions
 */

import type { StellariumObject } from './stellarium';

// ============================================================================
// Search Result Types
// ============================================================================

export type SearchResultType = 
  | 'Comet' 
  | 'Planet' 
  | 'Star' 
  | 'Moon' 
  | 'StellariumObject' 
  | 'DSO' 
  | 'Constellation' 
  | 'Coordinates';

export interface SearchResultItem {
  Name: string;
  Type?: SearchResultType;
  RA?: number;
  Dec?: number;
  'Common names'?: string;
  M?: string;
  Magnitude?: number;
  Size?: string;
  StellariumObj?: StellariumObject;
}

// ============================================================================
// Object Type Classifications
// ============================================================================

export type ObjectTypeCategory = 
  | 'galaxy' 
  | 'nebula' 
  | 'cluster' 
  | 'star' 
  | 'planet' 
  | 'comet' 
  | 'other';

// ============================================================================
// Search Filter Types
// ============================================================================

export type ObjectType = 
  | 'all' 
  | 'galaxy' 
  | 'nebula' 
  | 'cluster' 
  | 'star' 
  | 'planet' 
  | 'comet' 
  | 'constellation';

export type SortOption = 
  | 'name' 
  | 'magnitude' 
  | 'size' 
  | 'altitude' 
  | 'transit';

export interface SearchFilters {
  objectType: ObjectType;
  minMagnitude: number | null;
  maxMagnitude: number | null;
  minAltitude: number | null;
  sortBy: SortOption;
  sortOrder: 'asc' | 'desc';
}
