/**
 * Tauri API wrapper for unified cache management
 * Only available in Tauri desktop environment
 */

import { isTauri } from '@/lib/storage/platform';

// Lazy import to avoid errors in web environment
async function getInvoke() {
  if (!isTauri()) {
    throw new Error('Tauri API is only available in desktop environment');
  }
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke;
}

// ============================================================================
// Types
// ============================================================================

export interface UnifiedCacheResponse {
  data: number[];
  content_type: string;
  timestamp: number;
  ttl: number;
}

export interface CacheEntryMeta {
  key: string;
  content_type: string;
  size_bytes: number;
  timestamp: number;
  ttl: number;
  etag: string | null;
  access_count: number;
  last_access: number;
}

export interface UnifiedCacheStats {
  total_entries: number;
  total_size: number;
  max_size: number;
  max_entries: number;
  hit_rate: number;
  last_cleanup: string | null;
}

// ============================================================================
// Unified Cache API
// ============================================================================

export const unifiedCacheApi = {
  /**
   * Get a cache entry
   */
  async getEntry(key: string): Promise<UnifiedCacheResponse | null> {
    const invoke = await getInvoke();
    return invoke('get_unified_cache_entry', { key });
  },

  /**
   * Put data in cache
   */
  async putEntry(
    key: string,
    data: Uint8Array,
    contentType: string,
    ttl?: number
  ): Promise<void> {
    const invoke = await getInvoke();
    return invoke('put_unified_cache_entry', {
      key,
      data: Array.from(data),
      contentType,
      ttl,
    });
  },

  /**
   * Delete a cache entry
   */
  async deleteEntry(key: string): Promise<boolean> {
    const invoke = await getInvoke();
    return invoke('delete_unified_cache_entry', { key });
  },

  /**
   * Clear all cache entries
   */
  async clearCache(): Promise<number> {
    const invoke = await getInvoke();
    return invoke('clear_unified_cache');
  },

  /**
   * Get total cache size
   */
  async getCacheSize(): Promise<number> {
    const invoke = await getInvoke();
    return invoke('get_unified_cache_size');
  },

  /**
   * List all cache keys
   */
  async listKeys(): Promise<string[]> {
    const invoke = await getInvoke();
    return invoke('list_unified_cache_keys');
  },

  /**
   * Get cache statistics
   */
  async getStats(): Promise<UnifiedCacheStats> {
    const invoke = await getInvoke();
    return invoke('get_unified_cache_stats');
  },

  /**
   * Cleanup expired entries
   */
  async cleanup(): Promise<number> {
    const invoke = await getInvoke();
    return invoke('cleanup_unified_cache');
  },

  /**
   * Prefetch a URL into cache
   */
  async prefetchUrl(url: string, ttl?: number): Promise<void> {
    const invoke = await getInvoke();
    return invoke('prefetch_url', { url, ttl });
  },

  /**
   * Prefetch multiple URLs into cache
   */
  async prefetchUrls(urls: string[], ttl?: number): Promise<number> {
    const invoke = await getInvoke();
    return invoke('prefetch_urls', { urls, ttl });
  },

  /** Check if unified cache API is available */
  isAvailable: isTauri,
};

export default unifiedCacheApi;
