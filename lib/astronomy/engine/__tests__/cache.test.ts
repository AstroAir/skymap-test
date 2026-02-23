/**
 * @jest-environment node
 */
import { AstronomyEngineCache } from '../cache';

describe('AstronomyEngineCache', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('constructor', () => {
    it('should use default maxSize of 500', () => {
      const cache = new AstronomyEngineCache();
      // Fill beyond default and verify eviction
      for (let i = 0; i < 501; i++) {
        cache.set(`key-${i}`, i);
      }
      // First key should have been evicted
      expect(cache.get('key-0')).toBeUndefined();
      // Last key should exist
      expect(cache.get('key-500')).toBe(500);
    });

    it('should accept custom maxSize', () => {
      const cache = new AstronomyEngineCache(3);
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);
      cache.set('d', 4); // Should evict 'a'

      expect(cache.get('a')).toBeUndefined();
      expect(cache.get('b')).toBe(2);
      expect(cache.get('c')).toBe(3);
      expect(cache.get('d')).toBe(4);
    });
  });

  describe('LRU eviction', () => {
    it('should evict the oldest entry when maxSize is reached', () => {
      const cache = new AstronomyEngineCache(2);
      cache.set('first', 1);
      cache.set('second', 2);

      // Adding a third should evict 'first'
      cache.set('third', 3);

      expect(cache.get('first')).toBeUndefined();
      expect(cache.get('second')).toBe(2);
      expect(cache.get('third')).toBe(3);
    });

    it('should evict multiple entries as needed', () => {
      const cache = new AstronomyEngineCache(2);
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3); // evicts 'a'
      cache.set('d', 4); // evicts 'b'

      expect(cache.get('a')).toBeUndefined();
      expect(cache.get('b')).toBeUndefined();
      expect(cache.get('c')).toBe(3);
      expect(cache.get('d')).toBe(4);
    });

    it('should keep recently accessed entries (true LRU)', () => {
      const cache = new AstronomyEngineCache(3);
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);

      // Access 'a' — moves it to most-recently-used position
      cache.get('a');

      // Insert 'd' — should evict 'b' (least recently used), not 'a'
      cache.set('d', 4);

      expect(cache.get('a')).toBe(1);   // kept: was accessed
      expect(cache.get('b')).toBeUndefined(); // evicted: LRU
      expect(cache.get('c')).toBe(3);
      expect(cache.get('d')).toBe(4);
    });

    it('should not evict when updating existing key', () => {
      const cache = new AstronomyEngineCache(2);
      cache.set('a', 1);
      cache.set('b', 2);

      // Update 'a' — should not evict 'b' because 'a' already exists
      cache.set('a', 10);

      expect(cache.get('a')).toBe(10);
      expect(cache.get('b')).toBe(2);
    });
  });

  describe('TTL expiration', () => {
    it('should return undefined for expired entries', () => {
      const cache = new AstronomyEngineCache();
      cache.set('key', 'value', 1000);

      // Advance time past TTL
      jest.advanceTimersByTime(1001);

      expect(cache.get('key')).toBeUndefined();
    });

    it('should return value before TTL expires', () => {
      const cache = new AstronomyEngineCache();
      cache.set('key', 'value', 5000);

      jest.advanceTimersByTime(4999);

      expect(cache.get('key')).toBe('value');
    });
  });

  describe('getOrSet', () => {
    it('should return cached value without calling factory', () => {
      const cache = new AstronomyEngineCache();
      cache.set('key', 42);

      const factory = jest.fn(() => 99);
      const result = cache.getOrSet('key', factory);

      expect(result).toBe(42);
      expect(factory).not.toHaveBeenCalled();
    });

    it('should call factory and cache result on miss', () => {
      const cache = new AstronomyEngineCache();

      const factory = jest.fn(() => 99);
      const result = cache.getOrSet('key', factory);

      expect(result).toBe(99);
      expect(factory).toHaveBeenCalledTimes(1);
      expect(cache.get('key')).toBe(99);
    });
  });

  describe('clear', () => {
    it('should remove all entries', () => {
      const cache = new AstronomyEngineCache();
      cache.set('a', 1);
      cache.set('b', 2);

      cache.clear();

      expect(cache.get('a')).toBeUndefined();
      expect(cache.get('b')).toBeUndefined();
    });
  });
});
