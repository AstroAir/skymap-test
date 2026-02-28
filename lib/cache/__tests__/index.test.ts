/**
 * Tests for cache/index.ts barrel exports
 */

import * as cacheModule from '../index';

describe('cache/index barrel exports', () => {
  it('should export config utilities', () => {
    expect(cacheModule.CACHE_CONFIG).toBeDefined();
    expect(cacheModule.CACHEABLE_URL_PATTERNS).toBeDefined();
    expect(cacheModule.PREFETCH_RESOURCES).toBeDefined();
    expect(typeof cacheModule.hoursToMs).toBe('function');
    expect(typeof cacheModule.daysToMs).toBe('function');
    expect(typeof cacheModule.formatBytes).toBe('function');
    expect(typeof cacheModule.formatDuration).toBe('function');
  });

  it('should export stats utilities', () => {
    expect(typeof cacheModule.collectCacheStats).toBe('function');
    expect(typeof cacheModule.formatCacheStats).toBe('function');
    expect(typeof cacheModule.getCacheStatsSummary).toBe('function');
    expect(cacheModule.cacheStats).toBeDefined();
  });

  it('should export compression utilities', () => {
    expect(typeof cacheModule.isCompressionSupported).toBe('function');
    expect(typeof cacheModule.shouldCompress).toBe('function');
    expect(typeof cacheModule.compress).toBe('function');
    expect(typeof cacheModule.decompress).toBe('function');
    expect(typeof cacheModule.getCompressionRatio).toBe('function');
    expect(typeof cacheModule.formatCompressionSavings).toBe('function');
  });

  it('should export migration utilities', () => {
    expect(typeof cacheModule.getCacheVersion).toBe('function');
    expect(typeof cacheModule.isMigrationNeeded).toBe('function');
    expect(typeof cacheModule.runMigrations).toBe('function');
    expect(typeof cacheModule.resetAllCaches).toBe('function');
    expect(typeof cacheModule.initializeCacheSystem).toBe('function');
  });
});
