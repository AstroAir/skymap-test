/**
 * Tests for lru-cache.ts
 */

import { LRUCache, RequestDeduplicator } from '../lru-cache';

describe('LRUCache', () => {
  describe('constructor', () => {
    it('should create cache with maxSize', () => {
      const cache = new LRUCache<string, number>({ maxSize: 10 });
      expect(cache.size).toBe(0);
    });

    it('should create cache with ttl', () => {
      const cache = new LRUCache<string, number>({ maxSize: 10, ttl: 1000 });
      expect(cache).toBeDefined();
    });
  });

  describe('get and set', () => {
    it('should store and retrieve values', () => {
      const cache = new LRUCache<string, number>({ maxSize: 10 });
      cache.set('key1', 100);
      expect(cache.get('key1')).toBe(100);
    });

    it('should return undefined for non-existent keys', () => {
      const cache = new LRUCache<string, number>({ maxSize: 10 });
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('should overwrite existing values', () => {
      const cache = new LRUCache<string, number>({ maxSize: 10 });
      cache.set('key1', 100);
      cache.set('key1', 200);
      expect(cache.get('key1')).toBe(200);
    });
  });

  describe('LRU eviction', () => {
    it('should evict oldest entry when at capacity', () => {
      const cache = new LRUCache<string, number>({ maxSize: 2 });
      cache.set('key1', 1);
      cache.set('key2', 2);
      cache.set('key3', 3);
      
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBe(2);
      expect(cache.get('key3')).toBe(3);
    });

    it('should update access order on get', () => {
      const cache = new LRUCache<string, number>({ maxSize: 2 });
      cache.set('key1', 1);
      cache.set('key2', 2);
      cache.get('key1'); // Access key1, making key2 the oldest
      cache.set('key3', 3);
      
      expect(cache.get('key1')).toBe(1);
      expect(cache.get('key2')).toBeUndefined();
      expect(cache.get('key3')).toBe(3);
    });
  });

  describe('TTL expiration', () => {
    it('should expire entries after TTL', async () => {
      const cache = new LRUCache<string, number>({ maxSize: 10, ttl: 50 });
      cache.set('key1', 100);
      
      expect(cache.get('key1')).toBe(100);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(cache.get('key1')).toBeUndefined();
    });

    it('should support custom TTL per entry', async () => {
      const cache = new LRUCache<string, number>({ maxSize: 10 });
      cache.set('key1', 100, 50);
      
      expect(cache.get('key1')).toBe(100);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(cache.get('key1')).toBeUndefined();
    });
  });

  describe('has', () => {
    it('should return true for existing keys', () => {
      const cache = new LRUCache<string, number>({ maxSize: 10 });
      cache.set('key1', 100);
      expect(cache.has('key1')).toBe(true);
    });

    it('should return false for non-existent keys', () => {
      const cache = new LRUCache<string, number>({ maxSize: 10 });
      expect(cache.has('nonexistent')).toBe(false);
    });

    it('should return false for expired keys', async () => {
      const cache = new LRUCache<string, number>({ maxSize: 10, ttl: 50 });
      cache.set('key1', 100);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(cache.has('key1')).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete existing keys', () => {
      const cache = new LRUCache<string, number>({ maxSize: 10 });
      cache.set('key1', 100);
      expect(cache.delete('key1')).toBe(true);
      expect(cache.get('key1')).toBeUndefined();
    });

    it('should return false for non-existent keys', () => {
      const cache = new LRUCache<string, number>({ maxSize: 10 });
      expect(cache.delete('nonexistent')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should remove all entries', () => {
      const cache = new LRUCache<string, number>({ maxSize: 10 });
      cache.set('key1', 1);
      cache.set('key2', 2);
      cache.clear();
      expect(cache.size).toBe(0);
    });
  });

  describe('prune', () => {
    it('should remove expired entries', async () => {
      const cache = new LRUCache<string, number>({ maxSize: 10, ttl: 50 });
      cache.set('key1', 1);
      cache.set('key2', 2);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const pruned = cache.prune();
      expect(pruned).toBe(2);
      expect(cache.size).toBe(0);
    });

    it('should not remove non-expired entries', () => {
      const cache = new LRUCache<string, number>({ maxSize: 10, ttl: 10000 });
      cache.set('key1', 1);
      cache.set('key2', 2);
      
      const pruned = cache.prune();
      expect(pruned).toBe(0);
      expect(cache.size).toBe(2);
    });
  });

  describe('entries', () => {
    it('should return all valid entries', () => {
      const cache = new LRUCache<string, number>({ maxSize: 10 });
      cache.set('key1', 1);
      cache.set('key2', 2);
      
      const entries = cache.entries();
      expect(entries.length).toBe(2);
    });

    it('should exclude expired entries', async () => {
      const cache = new LRUCache<string, number>({ maxSize: 10, ttl: 50 });
      cache.set('key1', 1);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const entries = cache.entries();
      expect(entries.length).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', () => {
      const cache = new LRUCache<string, number>({ maxSize: 10 });
      cache.set('key1', 1);
      cache.set('key2', 2);
      
      const stats = cache.getStats();
      expect(stats.size).toBe(2);
      expect(stats.maxSize).toBe(10);
    });
  });
});

describe('RequestDeduplicator', () => {
  describe('dedupe', () => {
    it('should execute request function', async () => {
      const deduplicator = new RequestDeduplicator<string, number>();
      const result = await deduplicator.dedupe('key1', async () => 100);
      expect(result).toBe(100);
    });

    it('should deduplicate concurrent requests', async () => {
      const deduplicator = new RequestDeduplicator<string, number>();
      let callCount = 0;
      
      const requestFn = async () => {
        callCount++;
        await new Promise(resolve => setTimeout(resolve, 50));
        return 100;
      };
      
      const [result1, result2] = await Promise.all([
        deduplicator.dedupe('key1', requestFn),
        deduplicator.dedupe('key1', requestFn),
      ]);
      
      expect(result1).toBe(100);
      expect(result2).toBe(100);
      expect(callCount).toBe(1);
    });

    it('should handle object keys', async () => {
      const deduplicator = new RequestDeduplicator<{ id: number }, string>();
      const result = await deduplicator.dedupe({ id: 1 }, async () => 'value');
      expect(result).toBe('value');
    });
  });

  describe('pendingCount', () => {
    it('should track pending requests', async () => {
      const deduplicator = new RequestDeduplicator<string, number>();
      
      expect(deduplicator.pendingCount).toBe(0);
      
      const promise = deduplicator.dedupe('key1', async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return 100;
      });
      
      expect(deduplicator.pendingCount).toBe(1);
      
      await promise;
      
      expect(deduplicator.pendingCount).toBe(0);
    });
  });

  describe('clear', () => {
    it('should clear pending requests', () => {
      const deduplicator = new RequestDeduplicator<string, number>();
      deduplicator.clear();
      expect(deduplicator.pendingCount).toBe(0);
    });
  });
});
