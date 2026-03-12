export type SearchIntent = 'name' | 'catalog' | 'coordinates' | 'minor' | 'batch';

export type CatalogPrefix = 'm' | 'ngc' | 'ic' | 'hd' | 'hip';

export type SearchRefinementHintLevel = 'info' | 'warning';

export interface SearchRefinementHint {
  code: string;
  message: string;
  level: SearchRefinementHintLevel;
}

export interface ParsedCoordinate {
  ra: number;
  dec: number;
}

export interface ParsedSearchQuery {
  raw: string;
  normalized: string;
  intent: SearchIntent;
  commandPrefix?: CatalogPrefix | '@';
  catalogQuery?: string;
  coordinates?: ParsedCoordinate;
  batchQueries?: string[];
  explicitMinor: boolean;
  canonicalId?: string;
  refinedQuery: string;
  normalizationSteps: string[];
  refinementHints: SearchRefinementHint[];
}

export function isCatalogPrefix(value: string): value is CatalogPrefix {
  return value === 'm' || value === 'ngc' || value === 'ic' || value === 'hd' || value === 'hip';
}
