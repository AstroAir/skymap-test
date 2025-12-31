/**
 * Unit tests for unified-cache-api.ts
 */

import { unifiedCacheApi } from '../unified-cache-api';
import type { UnifiedCacheResponse, UnifiedCacheStats } from '../unified-cache-api';

// Mock the platform detection
jest.mock('@/lib/storage/platform', () => ({
  isTauri: jest.fn(() => true)
}));

// Mock Tauri API
const mockInvoke = jest.fn();
jest.mock('@tauri-apps/api/core', () => ({
  invoke: mockInvoke
}));

describe('unifiedCacheApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getEntry', () => {
    it('should get cache entry successfully', async () => {
      const mockResponse: UnifiedCacheResponse = {
        data: [72, 101, 108, 108, 111], // "Hello" in bytes
        content_type: 'text/plain',
        timestamp: Date.now(),
        ttl: 3600
      };
      mockInvoke.mockResolvedValueOnce(mockResponse);

      const result = await unifiedCacheApi.getEntry('test-key');

      expect(result).toEqual(mockResponse);
      expect(mockInvoke).toHaveBeenCalledWith('get_unified_cache_entry', {
        key: 'test-key'
      });
    });

    it('should return null when entry does not exist', async () => {
      mockInvoke.mockResolvedValueOnce(null);

      const result = await unifiedCacheApi.getEntry('non-existent-key');

      expect(result).toBeNull();
    });

    it('should handle expired entries', async () => {
      mockInvoke.mockResolvedValueOnce(null);

      const result = await unifiedCacheApi.getEntry('expired-key');

      expect(result).toBeNull();
    });
  });

  describe('putEntry', () => {
    it('should put cache entry successfully', async () => {
      const testData = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
      mockInvoke.mockResolvedValueOnce(undefined);

      await unifiedCacheApi.putEntry('test-key', testData, 'text/plain', 3600);

      expect(mockInvoke).toHaveBeenCalledWith('put_unified_cache_entry', {
        key: 'test-key',
        data: Array.from(testData),
        contentType: 'text/plain',
        ttl: 3600
      });
    });

    it('should put entry without TTL', async () => {
      const testData = new Uint8Array([1, 2, 3]);
      mockInvoke.mockResolvedValueOnce(undefined);

      await unifiedCacheApi.putEntry('test-key', testData, 'application/octet-stream');

      expect(mockInvoke).toHaveBeenCalledWith('put_unified_cache_entry', {
        key: 'test-key',
        data: [1, 2, 3],
        contentType: 'application/octet-stream',
        ttl: undefined
      });
    });

    it('should handle large data', async () => {
      const largeData = new Uint8Array(1024 * 1024); // 1MB
      largeData.fill(42);
      mockInvoke.mockResolvedValueOnce(undefined);

      await unifiedCacheApi.putEntry('large-key', largeData, 'application/octet-stream');

      expect(mockInvoke).toHaveBeenCalledWith('put_unified_cache_entry', {
        key: 'large-key',
        data: Array.from(largeData),
        contentType: 'application/octet-stream',
        ttl: undefined
      });
    });
  });

  describe('deleteEntry', () => {
    it('should delete existing entry', async () => {
      mockInvoke.mockResolvedValueOnce(true);

      const result = await unifiedCacheApi.deleteEntry('test-key');

      expect(result).toBe(true);
      expect(mockInvoke).toHaveBeenCalledWith('delete_unified_cache_entry', {
        key: 'test-key'
      });
    });

    it('should return false for non-existent entry', async () => {
      mockInvoke.mockResolvedValueOnce(false);

      const result = await unifiedCacheApi.deleteEntry('non-existent-key');

      expect(result).toBe(false);
    });
  });

  describe('clearCache', () => {
    it('should clear all cache entries', async () => {
      mockInvoke.mockResolvedValueOnce(25);

      const result = await unifiedCacheApi.clearCache();

      expect(result).toBe(25);
      expect(mockInvoke).toHaveBeenCalledWith('clear_unified_cache');
    });

    it('should return 0 when cache is already empty', async () => {
      mockInvoke.mockResolvedValueOnce(0);

      const result = await unifiedCacheApi.clearCache();

      expect(result).toBe(0);
    });
  });

  describe('getCacheSize', () => {
    it('should return cache size in bytes', async () => {
      mockInvoke.mockResolvedValueOnce(1024000); // 1MB

      const result = await unifiedCacheApi.getCacheSize();

      expect(result).toBe(1024000);
      expect(mockInvoke).toHaveBeenCalledWith('get_unified_cache_size');
    });

    it('should return 0 for empty cache', async () => {
      mockInvoke.mockResolvedValueOnce(0);

      const result = await unifiedCacheApi.getCacheSize();

      expect(result).toBe(0);
    });
  });

  describe('listKeys', () => {
    it('should list all cache keys', async () => {
      const keys = ['key1', 'key2', 'key3', 'images/photo.jpg', 'data/config.json'];
      mockInvoke.mockResolvedValueOnce(keys);

      const result = await unifiedCacheApi.listKeys();

      expect(result).toEqual(keys);
      expect(mockInvoke).toHaveBeenCalledWith('list_unified_cache_keys');
    });

    it('should return empty array for empty cache', async () => {
      mockInvoke.mockResolvedValueOnce([]);

      const result = await unifiedCacheApi.listKeys();

      expect(result).toEqual([]);
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', async () => {
      const stats: UnifiedCacheStats = {
        total_entries: 150,
        total_size: 52428800, // 50MB
        max_size: 524288000, // 500MB
        max_entries: 10000,
        hit_rate: 0.85,
        last_cleanup: '2025-12-25T10:30:00Z'
      };
      mockInvoke.mockResolvedValueOnce(stats);

      const result = await unifiedCacheApi.getStats();

      expect(result).toEqual(stats);
      expect(result.hit_rate).toBe(0.85);
      expect(result.total_entries).toBe(150);
    });

    it('should handle stats for new cache', async () => {
      const stats: UnifiedCacheStats = {
        total_entries: 0,
        total_size: 0,
        max_size: 524288000,
        max_entries: 10000,
        hit_rate: 0,
        last_cleanup: null
      };
      mockInvoke.mockResolvedValueOnce(stats);

      const result = await unifiedCacheApi.getStats();

      expect(result.total_entries).toBe(0);
      expect(result.hit_rate).toBe(0);
      expect(result.last_cleanup).toBeNull();
    });
  });

  describe('cleanup', () => {
    it('should cleanup expired entries', async () => {
      mockInvoke.mockResolvedValueOnce(12);

      const result = await unifiedCacheApi.cleanup();

      expect(result).toBe(12);
      expect(mockInvoke).toHaveBeenCalledWith('cleanup_unified_cache');
    });

    it('should return 0 when no entries need cleanup', async () => {
      mockInvoke.mockResolvedValueOnce(0);

      const result = await unifiedCacheApi.cleanup();

      expect(result).toBe(0);
    });
  });

  describe('prefetchUrl', () => {
    it('should prefetch URL successfully', async () => {
      mockInvoke.mockResolvedValueOnce(undefined);

      await unifiedCacheApi.prefetchUrl('https://example.com/data.json', 3600);

      expect(mockInvoke).toHaveBeenCalledWith('prefetch_url', {
        url: 'https://example.com/data.json',
        ttl: 3600
      });
    });

    it('should prefetch URL without TTL', async () => {
      mockInvoke.mockResolvedValueOnce(undefined);

      await unifiedCacheApi.prefetchUrl('https://example.com/image.png');

      expect(mockInvoke).toHaveBeenCalledWith('prefetch_url', {
        url: 'https://example.com/image.png',
        ttl: undefined
      });
    });

    it('should handle network errors during prefetch', async () => {
      const networkError = new Error('Network unreachable');
      mockInvoke.mockRejectedValueOnce(networkError);

      await expect(unifiedCacheApi.prefetchUrl('https://invalid-url.example'))
        .rejects.toThrow('Network unreachable');
    });
  });

  describe('prefetchUrls', () => {
    it('should prefetch multiple URLs successfully', async () => {
      const urls = [
        'https://example.com/data1.json',
        'https://example.com/data2.json',
        'https://example.com/image.png'
      ];
      mockInvoke.mockResolvedValueOnce(3);

      const result = await unifiedCacheApi.prefetchUrls(urls, 7200);

      expect(result).toBe(3);
      expect(mockInvoke).toHaveBeenCalledWith('prefetch_urls', {
        urls,
        ttl: 7200
      });
    });

    it('should handle partial failures in batch prefetch', async () => {
      const urls = ['https://example.com/good.json', 'https://invalid.example/bad.json'];
      mockInvoke.mockResolvedValueOnce(1); // Only 1 succeeded

      const result = await unifiedCacheApi.prefetchUrls(urls);

      expect(result).toBe(1);
    });

    it('should handle empty URL list', async () => {
      mockInvoke.mockResolvedValueOnce(0);

      const result = await unifiedCacheApi.prefetchUrls([]);

      expect(result).toBe(0);
    });
  });

  describe('isAvailable', () => {
    it('should return true when Tauri is available', () => {
      expect(unifiedCacheApi.isAvailable()).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle cache full errors', async () => {
      const cacheFullError = new Error('Cache storage limit exceeded');
      mockInvoke.mockRejectedValueOnce(cacheFullError);

      await expect(unifiedCacheApi.putEntry('key', new Uint8Array([1, 2, 3]), 'text/plain'))
        .rejects.toThrow('Cache storage limit exceeded');
    });

    it('should handle file system errors', async () => {
      const fsError = new Error('Disk full');
      mockInvoke.mockRejectedValueOnce(fsError);

      await expect(unifiedCacheApi.getStats())
        .rejects.toThrow('Disk full');
    });

    it('should handle invalid key errors', async () => {
      const invalidKeyError = new Error('Invalid cache key format');
      mockInvoke.mockRejectedValueOnce(invalidKeyError);

      await expect(unifiedCacheApi.getEntry(''))
        .rejects.toThrow('Invalid cache key format');
    });
  });

  describe('data integrity', () => {
    it('should preserve binary data during round trip', async () => {
      const originalData = new Uint8Array([0, 1, 127, 128, 255]);
      const mockResponse: UnifiedCacheResponse = {
        data: Array.from(originalData),
        content_type: 'application/octet-stream',
        timestamp: Date.now(),
        ttl: 3600
      };

      // Mock put operation
      mockInvoke.mockResolvedValueOnce(undefined);
      await unifiedCacheApi.putEntry('binary-key', originalData, 'application/octet-stream');

      // Mock get operation
      mockInvoke.mockResolvedValueOnce(mockResponse);
      const result = await unifiedCacheApi.getEntry('binary-key');

      expect(new Uint8Array(result!.data)).toEqual(originalData);
    });
  });
});
