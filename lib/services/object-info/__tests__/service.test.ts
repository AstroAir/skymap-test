/**
 * Tests for service.ts
 */

import {
  fetchObjectInfo,
  clearInfoCache,
  getCacheStats,
} from '../service';

// Mock fetch
global.fetch = jest.fn();

describe('object-info service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearInfoCache();
  });

  describe('fetchObjectInfo', () => {
    it('should return aggregated info', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          extract: 'Test description',
          thumbnail: { source: 'http://example.com/image.jpg' },
        }),
      });

      const result = await fetchObjectInfo('M31', 10.68, 41.27);

      expect(result).toBeDefined();
      expect(result.object).toBeDefined();
      expect(result.object.name).toBe('M31');
      expect(result.sources).toBeDefined();
      expect(Array.isArray(result.errors)).toBe(true);
      expect(typeof result.totalFetchTime).toBe('number');
    });

    it('should use cache for repeated requests', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ extract: 'Test' }),
      });

      const result1 = await fetchObjectInfo('M42');
      const fetchCount1 = (global.fetch as jest.Mock).mock.calls.length;

      const result2 = await fetchObjectInfo('M42');
      const fetchCount2 = (global.fetch as jest.Mock).mock.calls.length;

      expect(result1.object.name).toBe(result2.object.name);
      expect(fetchCount2).toBe(fetchCount1);
      expect(result2.totalFetchTime).toBe(0);
    });

    it('should be case insensitive for cache', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ extract: 'Test' }),
      });

      await fetchObjectInfo('M31');
      const cacheStats1 = getCacheStats();

      await fetchObjectInfo('m31');
      const cacheStats2 = getCacheStats();

      expect(cacheStats2.size).toBe(cacheStats1.size);
    });

    it('should handle fetch errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await fetchObjectInfo('Test Object');

      expect(result).toBeDefined();
      expect(result.object).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should include coordinates in result', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({}),
      });

      const result = await fetchObjectInfo('Test', 123.45, 67.89);

      expect(result.object.ra).toBe(123.45);
      expect(result.object.dec).toBe(67.89);
    });

    it('should set default coordinates when not provided', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({}),
      });

      const result = await fetchObjectInfo('Test');

      expect(result.object.ra).toBe(0);
      expect(result.object.dec).toBe(0);
    });

    it('should include lastUpdated timestamp', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({}),
      });

      const before = new Date();
      const result = await fetchObjectInfo('Test');
      const after = new Date();

      expect(result.object.lastUpdated).toBeDefined();
      expect(result.object.lastUpdated.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(result.object.lastUpdated.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should fetch local info for known objects', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: false });

      const result = await fetchObjectInfo('m31');

      expect(result.object.names).toBeDefined();
    });
  });

  describe('clearInfoCache', () => {
    it('should clear all cached entries', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({}),
      });

      await fetchObjectInfo('Object1');
      await fetchObjectInfo('Object2');

      const statsBefore = getCacheStats();
      expect(statsBefore.size).toBe(2);

      clearInfoCache();

      const statsAfter = getCacheStats();
      expect(statsAfter.size).toBe(0);
    });

    it('should allow fresh fetches after clearing', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({}),
      });

      await fetchObjectInfo('Test');
      clearInfoCache();

      const fetchCountBefore = (global.fetch as jest.Mock).mock.calls.length;
      await fetchObjectInfo('Test');
      const fetchCountAfter = (global.fetch as jest.Mock).mock.calls.length;

      expect(fetchCountAfter).toBeGreaterThan(fetchCountBefore);
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', () => {
      const stats = getCacheStats();

      expect(stats).toBeDefined();
      expect(typeof stats.size).toBe('number');
    });

    it('should return zero size for empty cache', () => {
      clearInfoCache();
      const stats = getCacheStats();

      expect(stats.size).toBe(0);
      expect(stats.oldestEntry).toBeUndefined();
    });

    it('should track cache size', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({}),
      });

      await fetchObjectInfo('Object1');
      const stats1 = getCacheStats();

      await fetchObjectInfo('Object2');
      const stats2 = getCacheStats();

      expect(stats2.size).toBe(stats1.size + 1);
    });

    it('should track oldest entry', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({}),
      });

      const before = new Date();
      await fetchObjectInfo('Test');
      const stats = getCacheStats();

      expect(stats.oldestEntry).toBeDefined();
      expect(stats.oldestEntry!.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });
  });
});
