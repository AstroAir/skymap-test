'use client';

import { useEffect, useRef } from 'react';
import { installFetchInterceptor, unifiedCache, type CacheStrategy } from '@/lib/offline';
import { PREFETCH_RESOURCES, CACHE_CONFIG } from '@/lib/cache/config';
import { isTauri } from '@/lib/storage/platform';
import { unifiedCacheApi } from '@/lib/tauri/unified-cache-api';
import { createLogger } from '@/lib/logger';

const logger = createLogger('cache-init');

interface UseCacheInitOptions {
  /** Cache strategy to use */
  strategy?: CacheStrategy;
  /** Whether to enable fetch interception */
  enableInterception?: boolean;
  /** Whether to prefetch critical resources on startup */
  enablePrefetch?: boolean;
  /** Custom resources to prefetch (in addition to defaults) */
  additionalPrefetchUrls?: string[];
}

/**
 * Prefetch critical resources for better cold-start performance
 */
async function prefetchCriticalResources(additionalUrls: string[] = []): Promise<void> {
  const urlsToPrefetch = [...PREFETCH_RESOURCES, ...additionalUrls];
  if (urlsToPrefetch.length === 0) return;
  
  logger.info('Starting prefetch of critical resources');
  
  try {
    if (isTauri()) {
      const result = await unifiedCacheApi.prefetchUrls(urlsToPrefetch, CACHE_CONFIG.unified.prefetchTTL);
      logger.info(`Prefetched ${result} resources via Tauri`);
    } else {
      const results = await unifiedCache.prefetchAll(urlsToPrefetch, CACHE_CONFIG.unified.prefetchTTL);
      const successCount = Array.from(results.values()).filter(Boolean).length;
      logger.info(`Prefetched ${successCount}/${urlsToPrefetch.length} resources`);
    }
  } catch (error) {
    logger.warn('Prefetch failed', error);
  }
}

/**
 * Hook to initialize the unified cache system
 * Should be called once at app startup
 */
export function useCacheInit(options: UseCacheInitOptions = {}) {
  const {
    strategy = 'cache-first',
    enableInterception = true,
    enablePrefetch = true,
    additionalPrefetchUrls = [],
  } = options;
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Install fetch interceptor for automatic caching
    if (enableInterception) {
      installFetchInterceptor(strategy);
      logger.info('Fetch interceptor installed', { strategy });
    }

    // Set up online/offline listeners
    const handleOnline = () => {
      logger.info('Network online');
    };

    const handleOffline = () => {
      logger.info('Network offline - using cached data');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Request persistent storage if available
    if ('storage' in navigator && 'persist' in navigator.storage) {
      navigator.storage.persist().then((granted) => {
        if (granted) {
          logger.info('Persistent storage granted');
        }
      });
    }

    // Prefetch critical resources (non-blocking, uses idle time)
    if (enablePrefetch) {
      const startPrefetch = () => prefetchCriticalResources(additionalPrefetchUrls);
      if ('requestIdleCallback' in window) {
        (window as Window & { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(startPrefetch);
      } else {
        setTimeout(startPrefetch, 1000);
      }
    }

    // Setup cache flush on unload for Tauri
    let cleanupFlush: (() => void) | undefined;
    if (isTauri()) {
      const handleBeforeUnload = () => {
        unifiedCacheApi.flush().catch(() => {});
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      cleanupFlush = () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      cleanupFlush?.();
    };
  }, [strategy, enableInterception, enablePrefetch, additionalPrefetchUrls]);
}

export default useCacheInit;
