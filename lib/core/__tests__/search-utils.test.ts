/**
 * Tests for search-utils.ts
 * Search result ID generation
 */

import { getResultId } from '../search-utils';
import type { SearchResultItem } from '../types';

describe('getResultId', () => {
  it('should combine type and name', () => {
    const item: SearchResultItem = { Type: 'DSO', Name: 'M31' };
    expect(getResultId(item)).toBe('DSO-M31');
  });

  it('should use "unknown" when type is missing', () => {
    const item: SearchResultItem = { Name: 'M42' };
    expect(getResultId(item)).toBe('unknown-M42');
  });

  it('should handle empty name', () => {
    const item: SearchResultItem = { Type: 'Star', Name: '' };
    expect(getResultId(item)).toBe('Star-');
  });
});
