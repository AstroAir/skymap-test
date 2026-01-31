/**
 * Cache Statistics Service
 * Provides centralized cache monitoring and statistics collection
 */

import { isTauri } from '@/lib/storage/platform';
import { unifiedCache } from '@/lib/offline/unified-cache';
import { unifiedCacheApi } from '@/lib/tauri/unified-cache-api';
import { getNighttimeCacheStats } from '@/lib/catalogs/nighttime-calculator';
import { formatBytes } from './config';
import { createLogger } from '@/lib/logger';

const logger = createLogger('cache-stats');

// ============================================================================
// Types
// ============================================================================

export interface CacheStatsEntry {
  name: string;
  size: number;
  maxSize: number;
  entries: number;
  maxEntries?: number;
  hits: number;
  misses: number;
  hitRate: number | undefined;
  errors?: number;
}

export interface AggregatedCacheStats {
  totalSize: number;
  totalEntries: number;
  totalHits: number;
  totalMisses: number;
  overallHitRate: number | undefined;
  caches: CacheStatsEntry[];
  lastUpdated: number;
}

// ============================================================================
// Stats Collection
// ============================================================================

/**
 * Collect statistics from all cache subsystems
 */
export async function collectCacheStats(): Promise<AggregatedCacheStats> {
  const caches: CacheStatsEntry[] = [];
  
  // 1. Unified Cache (Web or Tauri)
  try {
    if (isTauri()) {
      const tauriStats = await unifiedCacheApi.getStats();
      caches.push({
        name: 'Unified Cache (Desktop)',
        size: tauriStats.total_size,
        maxSize: tauriStats.max_size || 1024 * 1024 * 1024,
        entries: tauriStats.total_entries,
        maxEntries: tauriStats.max_entries || 10000,
        hits: 0, // Tauri doesn't track hits/misses yet
        misses: 0,
        hitRate: tauriStats.hit_rate,
      });
    } else {
      const webStats = unifiedCache.getCacheStats();
      const webSize = await unifiedCache.getSize();
      const webKeys = await unifiedCache.keys();
      caches.push({
        name: 'Unified Cache (Web)',
        size: webSize,
        maxSize: 500 * 1024 * 1024,
        entries: webKeys.length,
        hits: webStats.hits,
        misses: webStats.misses,
        hitRate: webStats.hitRate,
        errors: webStats.errors,
      });
    }
  } catch (error) {
    logger.warn('Failed to get unified cache stats', error);
  }
  
  // 2. Nighttime Calculator Cache
  try {
    const nighttimeStats = getNighttimeCacheStats();
    const totalHits = nighttimeStats.nighttime.hits + 
                      nighttimeStats.sunPosition.hits + 
                      nighttimeStats.moonPosition.hits + 
                      nighttimeStats.hourAngle.hits;
    const totalMisses = nighttimeStats.nighttime.misses + 
                        nighttimeStats.sunPosition.misses + 
                        nighttimeStats.moonPosition.misses + 
                        nighttimeStats.hourAngle.misses;
    const totalEntries = nighttimeStats.nighttime.size + 
                         nighttimeStats.sunPosition.size + 
                         nighttimeStats.moonPosition.size + 
                         nighttimeStats.hourAngle.size;
    
    caches.push({
      name: 'Astronomical Calculations',
      size: totalEntries * 200, // Rough estimate: ~200 bytes per entry
      maxSize: 4000 * 200, // 4 caches × 1000 max entries
      entries: totalEntries,
      maxEntries: 4000,
      hits: totalHits,
      misses: totalMisses,
      hitRate: (totalHits + totalMisses) > 0 ? totalHits / (totalHits + totalMisses) : undefined,
    });
  } catch (error) {
    logger.warn('Failed to get nighttime cache stats', error);
  }
  
  // Aggregate totals
  const totalSize = caches.reduce((sum, c) => sum + c.size, 0);
  const totalEntries = caches.reduce((sum, c) => sum + c.entries, 0);
  const totalHits = caches.reduce((sum, c) => sum + c.hits, 0);
  const totalMisses = caches.reduce((sum, c) => sum + c.misses, 0);
  const overallHitRate = (totalHits + totalMisses) > 0 
    ? totalHits / (totalHits + totalMisses) 
    : undefined;
  
  return {
    totalSize,
    totalEntries,
    totalHits,
    totalMisses,
    overallHitRate,
    caches,
    lastUpdated: Date.now(),
  };
}

// ============================================================================
// Formatting Utilities
// ============================================================================

/**
 * Format cache stats for display
 */
export function formatCacheStats(stats: AggregatedCacheStats): string {
  const lines: string[] = [
    `=== Cache Statistics ===`,
    `Total Size: ${formatBytes(stats.totalSize)}`,
    `Total Entries: ${stats.totalEntries.toLocaleString()}`,
    `Overall Hit Rate: ${stats.overallHitRate !== undefined ? `${(stats.overallHitRate * 100).toFixed(1)}%` : 'N/A'}`,
    ``,
    `--- Per-Cache Breakdown ---`,
  ];
  
  for (const cache of stats.caches) {
    lines.push(`${cache.name}:`);
    lines.push(`  Size: ${formatBytes(cache.size)} / ${formatBytes(cache.maxSize)}`);
    lines.push(`  Entries: ${cache.entries}${cache.maxEntries ? ` / ${cache.maxEntries}` : ''}`);
    lines.push(`  Hit Rate: ${cache.hitRate !== undefined ? `${(cache.hitRate * 100).toFixed(1)}%` : 'N/A'} (${cache.hits} hits, ${cache.misses} misses)`);
    if (cache.errors) {
      lines.push(`  Errors: ${cache.errors}`);
    }
  }
  
  return lines.join('\n');
}

/**
 * Get a summary string for UI display
 */
export function getCacheStatsSummary(stats: AggregatedCacheStats): string {
  const hitRateStr = stats.overallHitRate !== undefined 
    ? `${(stats.overallHitRate * 100).toFixed(0)}%` 
    : '-';
  return `${formatBytes(stats.totalSize)} | ${stats.totalEntries} entries | ${hitRateStr} hit rate`;
}

// ============================================================================
// Export singleton for convenience
// ============================================================================

export const cacheStats = {
  collect: collectCacheStats,
  format: formatCacheStats,
  summary: getCacheStatsSummary,
};

export default cacheStats;
