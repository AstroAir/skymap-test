/**
 * Search-related constants
 * Extracted from components/starmap/search/ for reusability
 */

import type { ObjectType } from '@/lib/hooks/use-object-search';

// ============================================================================
// Object Type Constants
// ============================================================================

/** All available celestial object types for search filtering */
export const ALL_OBJECT_TYPES: ObjectType[] = ['DSO', 'Planet', 'Star', 'Moon', 'Comet', 'Asteroid', 'Constellation'];

// ============================================================================
// Catalog Presets
// ============================================================================

export interface CatalogPreset {
  id: string;
  label: string;
  query: string;
}

/** Common astronomical catalog presets for quick search */
export const CATALOG_PRESETS: CatalogPreset[] = [
  { id: 'messier', label: 'Messier (M)', query: 'M' },
  { id: 'ngc', label: 'NGC', query: 'NGC' },
  { id: 'ic', label: 'IC', query: 'IC' },
  { id: 'caldwell', label: 'Caldwell', query: 'Caldwell' },
];

// ============================================================================
// Source Color Map
// ============================================================================

/** Color class mappings for online search source badges */
export const SOURCE_COLOR_MAP: Record<string, string> = {
  simbad: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  sesame: 'bg-purple-500/10 text-purple-500 border-purple-500/30',
  vizier: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
  ned: 'bg-green-500/10 text-green-500 border-green-500/30',
  mpc: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/30',
};
