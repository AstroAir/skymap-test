/**
 * Search utility functions
 * Pure helper functions for search operations
 */

import type { SearchResultItem } from './types';

/**
 * Get a unique ID for a search result item.
 * Combines the object type and name to produce a stable identifier.
 */
export function getResultId(item: SearchResultItem): string {
  return `${item.Type || 'unknown'}-${item.Name}`;
}
