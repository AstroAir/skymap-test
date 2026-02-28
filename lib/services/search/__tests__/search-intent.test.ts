import { isCatalogPrefix } from '../search-intent';

describe('search/search-intent', () => {
  describe('isCatalogPrefix', () => {
    it('returns true for valid catalog prefixes', () => {
      expect(isCatalogPrefix('m')).toBe(true);
      expect(isCatalogPrefix('ngc')).toBe(true);
      expect(isCatalogPrefix('ic')).toBe(true);
      expect(isCatalogPrefix('hd')).toBe(true);
      expect(isCatalogPrefix('hip')).toBe(true);
    });

    it('returns false for invalid prefixes', () => {
      expect(isCatalogPrefix('M')).toBe(false);
      expect(isCatalogPrefix('NGC')).toBe(false);
      expect(isCatalogPrefix('messier')).toBe(false);
      expect(isCatalogPrefix('')).toBe(false);
      expect(isCatalogPrefix('abc')).toBe(false);
      expect(isCatalogPrefix('ugc')).toBe(false);
    });
  });
});
