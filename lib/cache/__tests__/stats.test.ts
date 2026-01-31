/**
 * Tests for cache/stats.ts
 */

import {
  formatCacheStats,
  getCacheStatsSummary,
  type AggregatedCacheStats,
  type CacheStatsEntry,
} from '../stats';

describe('formatCacheStats', () => {
  const mockStats: AggregatedCacheStats = {
    totalSize: 1024 * 1024 * 100, // 100MB
    totalEntries: 500,
    totalHits: 800,
    totalMisses: 200,
    overallHitRate: 0.8,
    caches: [
      {
        name: 'Test Cache 1',
        size: 1024 * 1024 * 50,
        maxSize: 1024 * 1024 * 200,
        entries: 300,
        maxEntries: 1000,
        hits: 500,
        misses: 100,
        hitRate: 0.833,
      },
      {
        name: 'Test Cache 2',
        size: 1024 * 1024 * 50,
        maxSize: 1024 * 1024 * 100,
        entries: 200,
        hits: 300,
        misses: 100,
        hitRate: 0.75,
        errors: 5,
      },
    ],
    lastUpdated: Date.now(),
  };

  it('should format stats as string', () => {
    const result = formatCacheStats(mockStats);
    
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should include total size', () => {
    const result = formatCacheStats(mockStats);
    expect(result).toContain('Total Size');
    expect(result).toContain('MB');
  });

  it('should include total entries', () => {
    const result = formatCacheStats(mockStats);
    expect(result).toContain('Total Entries');
    expect(result).toContain('500');
  });

  it('should include hit rate', () => {
    const result = formatCacheStats(mockStats);
    expect(result).toContain('Hit Rate');
    expect(result).toContain('80');
  });

  it('should include per-cache breakdown', () => {
    const result = formatCacheStats(mockStats);
    expect(result).toContain('Test Cache 1');
    expect(result).toContain('Test Cache 2');
  });

  it('should include errors when present', () => {
    const result = formatCacheStats(mockStats);
    expect(result).toContain('Errors');
    expect(result).toContain('5');
  });

  it('should handle undefined hit rate', () => {
    const statsWithNoHitRate: AggregatedCacheStats = {
      ...mockStats,
      overallHitRate: undefined,
    };
    
    const result = formatCacheStats(statsWithNoHitRate);
    expect(result).toContain('N/A');
  });
});

describe('getCacheStatsSummary', () => {
  it('should return a summary string', () => {
    const stats: AggregatedCacheStats = {
      totalSize: 1024 * 1024 * 125,
      totalEntries: 1234,
      totalHits: 870,
      totalMisses: 130,
      overallHitRate: 0.87,
      caches: [],
      lastUpdated: Date.now(),
    };
    
    const result = getCacheStatsSummary(stats);
    
    expect(typeof result).toBe('string');
    expect(result).toContain('125');
    expect(result).toContain('MB');
    expect(result).toContain('1234');
    expect(result).toContain('entries');
    expect(result).toContain('87%');
    expect(result).toContain('hit rate');
  });

  it('should handle undefined hit rate', () => {
    const stats: AggregatedCacheStats = {
      totalSize: 0,
      totalEntries: 0,
      totalHits: 0,
      totalMisses: 0,
      overallHitRate: undefined,
      caches: [],
      lastUpdated: Date.now(),
    };
    
    const result = getCacheStatsSummary(stats);
    expect(result).toContain('-');
  });

  it('should format small sizes correctly', () => {
    const stats: AggregatedCacheStats = {
      totalSize: 512,
      totalEntries: 5,
      totalHits: 3,
      totalMisses: 2,
      overallHitRate: 0.6,
      caches: [],
      lastUpdated: Date.now(),
    };
    
    const result = getCacheStatsSummary(stats);
    expect(result).toContain('B');
  });
});

describe('CacheStatsEntry type', () => {
  it('should accept valid cache stats entry', () => {
    const entry: CacheStatsEntry = {
      name: 'Test Cache',
      size: 1000,
      maxSize: 10000,
      entries: 50,
      maxEntries: 500,
      hits: 100,
      misses: 20,
      hitRate: 0.833,
      errors: 2,
    };
    
    expect(entry.name).toBe('Test Cache');
    expect(entry.hitRate).toBe(0.833);
  });

  it('should accept entry without optional fields', () => {
    const entry: CacheStatsEntry = {
      name: 'Minimal Cache',
      size: 500,
      maxSize: 5000,
      entries: 10,
      hits: 5,
      misses: 5,
      hitRate: 0.5,
    };
    
    expect(entry.maxEntries).toBeUndefined();
    expect(entry.errors).toBeUndefined();
  });
});
