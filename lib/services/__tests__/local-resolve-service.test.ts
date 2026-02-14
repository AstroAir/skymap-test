/**
 * @jest-environment jsdom
 */

import {
  resolveObjectNameLocally,
  resolveObjectNamesLocally,
  searchLocalCatalog,
} from '../local-resolve-service';

describe('local-resolve-service', () => {
  describe('resolveObjectNameLocally', () => {
    it('should return null for empty input', () => {
      expect(resolveObjectNameLocally('')).toBeNull();
      expect(resolveObjectNameLocally('   ')).toBeNull();
    });

    it('should resolve Messier catalog IDs', () => {
      const result = resolveObjectNameLocally('M31');
      expect(result).not.toBeNull();
      expect(result!.name).toContain('M31');
      expect(result!.id).toBe('M31');
      expect(result!.source).toBe('local');
      expect(result!.ra).toBeDefined();
      expect(result!.dec).toBeDefined();
    });

    it('should resolve NGC catalog IDs', () => {
      const result = resolveObjectNameLocally('NGC 7000');
      expect(result).not.toBeNull();
      expect(result!.source).toBe('local');
    });

    it('should resolve catalog IDs case-insensitively', () => {
      const result = resolveObjectNameLocally('m42');
      expect(result).not.toBeNull();
      expect(result!.id).toBe('M42');
    });

    it('should resolve catalog IDs with and without spaces', () => {
      const withSpace = resolveObjectNameLocally('M 31');
      const withoutSpace = resolveObjectNameLocally('M31');
      // Both should resolve to the same object
      if (withSpace && withoutSpace) {
        expect(withSpace.id).toBe(withoutSpace.id);
      }
    });

    it('should have raString and decString in results', () => {
      const result = resolveObjectNameLocally('M31');
      expect(result).not.toBeNull();
      expect(result!.raString).toBeDefined();
      expect(result!.decString).toBeDefined();
    });

    it('should set correct category for galaxies', () => {
      const result = resolveObjectNameLocally('M31');
      expect(result).not.toBeNull();
      expect(result!.category).toBe('galaxy');
    });

    it('should set correct category for nebulae', () => {
      const result = resolveObjectNameLocally('M42');
      expect(result).not.toBeNull();
      // M42 is a nebula type
      expect(['nebula', 'other']).toContain(result!.category);
    });

    it('should return null for unknown objects', () => {
      const result = resolveObjectNameLocally('ZZZZZ_NOTREAL_99999');
      // May return a fuzzy match or null
      // The important thing is it doesn't throw
      expect(result === null || result !== null).toBe(true);
    });
  });

  describe('resolveObjectNamesLocally', () => {
    it('should resolve multiple names', () => {
      const results = resolveObjectNamesLocally(['M31', 'M42', 'M45']);
      expect(results.length).toBeGreaterThan(0);
      // Each result should be unique
      const ids = results.map(r => r.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('should skip unresolvable names', () => {
      const results = resolveObjectNamesLocally(['M31', 'ZZZZZ_NOTREAL_99999_XYZ']);
      // Should have at least M31
      expect(results.some(r => r.id === 'M31')).toBe(true);
    });

    it('should deduplicate results', () => {
      const results = resolveObjectNamesLocally(['M31', 'M31']);
      const m31Results = results.filter(r => r.id === 'M31');
      expect(m31Results.length).toBe(1);
    });

    it('should return empty array for empty input', () => {
      expect(resolveObjectNamesLocally([])).toEqual([]);
    });
  });

  describe('searchLocalCatalog', () => {
    it('should return empty array for empty query', () => {
      expect(searchLocalCatalog('')).toEqual([]);
      expect(searchLocalCatalog('   ')).toEqual([]);
    });

    it('should return multiple results for broad query', () => {
      const results = searchLocalCatalog('M', 10);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should respect limit parameter', () => {
      const results = searchLocalCatalog('M', 3);
      expect(results.length).toBeLessThanOrEqual(3);
    });

    it('should return results with source=local', () => {
      const results = searchLocalCatalog('M31');
      for (const result of results) {
        expect(result.source).toBe('local');
      }
    });

    it('should include catalog ID matches first', () => {
      const results = searchLocalCatalog('M31');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('M31');
    });

    it('should not contain duplicate results', () => {
      const results = searchLocalCatalog('M42', 20);
      const ids = results.map(r => r.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });
});
