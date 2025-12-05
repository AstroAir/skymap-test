'use client';

import { useEffect, useRef } from 'react';
import { installFetchInterceptor, type CacheStrategy } from '@/lib/offline';

interface UseCacheInitOptions {
  /** Cache strategy to use */
  strategy?: CacheStrategy;
  /** Whether to enable fetch interception */
  enableInterception?: boolean;
}

/**
 * Hook to initialize the unified cache system
 * Should be called once at app startup
 */
export function useCacheInit(options: UseCacheInitOptions = {}) {
  const { strategy = 'cache-first', enableInterception = true } = options;
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Install fetch interceptor for automatic caching
    if (enableInterception) {
      installFetchInterceptor(strategy);
      console.log('[Cache] Fetch interceptor installed with strategy:', strategy);
    }

    // Set up online/offline listeners
    const handleOnline = () => {
      console.log('[Cache] Network online');
    };

    const handleOffline = () => {
      console.log('[Cache] Network offline - using cached data');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Request persistent storage if available
    if ('storage' in navigator && 'persist' in navigator.storage) {
      navigator.storage.persist().then((granted) => {
        if (granted) {
          console.log('[Cache] Persistent storage granted');
        }
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [strategy, enableInterception]);
}

export default useCacheInit;
