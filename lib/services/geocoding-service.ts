/**
 * Unified geocoding service
 * Provides geocoding and reverse geocoding across multiple map providers with intelligent fallback
 */

import type { 
  BaseMapProvider,
  Coordinates,
  BoundingBox,
  GeocodingResult,
  ReverseGeocodingResult 
} from './map-providers/base-map-provider';
import { createMapProvider } from './map-providers';
import { mapConfig } from './map-config';
import { connectivityChecker } from './connectivity-checker';
import { LRUCache, RequestDeduplicator } from './lru-cache';

export interface GeocodingOptions {
  limit?: number;
  bounds?: BoundingBox;
  language?: string;
  provider?: 'openstreetmap' | 'google' | 'mapbox';
  fallback?: boolean;
  timeout?: number;
}

export interface ReverseGeocodingOptions {
  language?: string;
  provider?: 'openstreetmap' | 'google' | 'mapbox';
  fallback?: boolean;
  timeout?: number;
}

export interface CachedResult<T> {
  data: T;
  timestamp: number;
  provider: string;
  expiresAt: number;
}

interface CacheValue {
  data: GeocodingResult[] | ReverseGeocodingResult;
  provider: string;
}

class GeocodingService {
  private providers: Map<string, BaseMapProvider> = new Map();
  private cache: LRUCache<string, CacheValue>;
  private geocodeDeduplicator = new RequestDeduplicator<string, GeocodingResult[]>();
  private reverseGeocodeDeduplicator = new RequestDeduplicator<string, ReverseGeocodingResult>();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private readonly MAX_CACHE_SIZE = 500; // Maximum cached entries
  private readonly DEFAULT_TIMEOUT = 10000; // 10 seconds

  constructor() {
    this.cache = new LRUCache<string, CacheValue>({
      maxSize: this.MAX_CACHE_SIZE,
      ttl: this.CACHE_DURATION,
    });
    
    this.initializeProviders();
    
    // Listen for configuration changes
    mapConfig.addConfigurationListener(() => {
      this.initializeProviders();
    });
    
    // Periodically prune expired cache entries
    if (typeof window !== 'undefined') {
      setInterval(() => this.cache.prune(), 60000); // Prune every minute
    }
  }

  private initializeProviders(): void {
    this.providers.clear();
    
    const enabledProviders = mapConfig.getEnabledProviders();
    
    for (const providerConfig of enabledProviders) {
      try {
        const apiKey = mapConfig.getActiveApiKey(providerConfig.provider);
        const config = {
          ...providerConfig.config,
          apiKey: apiKey?.apiKey,
        };
        
        const provider = createMapProvider(providerConfig.provider, config);
        this.providers.set(providerConfig.provider, provider);
        
        // Start monitoring provider health
        connectivityChecker.startMonitoring(provider);
      } catch (error) {
        console.warn(`Failed to initialize provider ${providerConfig.provider}:`, error);
      }
    }
  }

  private getProviderForGeocoding(preferredProvider?: string): BaseMapProvider | null {
    // Use specified provider if available and healthy
    if (preferredProvider) {
      const provider = this.providers.get(preferredProvider);
      const health = connectivityChecker.getProviderHealth(preferredProvider as 'openstreetmap' | 'google' | 'mapbox');
      
      if (provider && health?.isHealthy !== false) {
        return provider;
      }
    }

    // Get recommended provider from connectivity checker
    const recommendedProvider = connectivityChecker.getRecommendedProvider();
    if (recommendedProvider) {
      return this.providers.get(recommendedProvider) || null;
    }

    // Fallback to any available provider
    const availableProviders = Array.from(this.providers.entries());
    for (const [, provider] of availableProviders) {
      if (provider.getCapabilities().geocoding) {
        return provider;
      }
    }

    return null;
  }

  private getCacheKey(type: 'geocode' | 'reverse', input: string | Coordinates, options?: Record<string, unknown>): string {
    // Use sorted keys for consistent cache keys
    const optionsStr = options ? JSON.stringify(options, Object.keys(options).sort()) : '';
    if (typeof input === 'string') {
      return `${type}:${input}:${optionsStr}`;
    } else {
      return `${type}:${input.latitude},${input.longitude}:${optionsStr}`;
    }
  }

  private getCachedResult<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    return cached.data as T;
  }

  private setCachedResult(key: string, data: GeocodingResult[] | ReverseGeocodingResult, provider: string): void {
    this.cache.set(key, { data, provider });
  }

  /**
   * Geocode an address to coordinates
   */
  async geocode(address: string, options: GeocodingOptions = {}): Promise<GeocodingResult[]> {
    const {
      limit = 10,
      bounds,
      language = 'en',
      provider: preferredProvider,
      fallback = true,
      timeout = this.DEFAULT_TIMEOUT,
    } = options;

    // Check cache first
    const cacheKey = this.getCacheKey('geocode', address, { limit, bounds, language });
    const cached = this.getCachedResult<GeocodingResult[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Use request deduplication to prevent duplicate concurrent requests
    return this.geocodeDeduplicator.dedupe(cacheKey, async () => {
      // Double-check cache after acquiring dedup lock
      const cachedAfterLock = this.getCachedResult<GeocodingResult[]>(cacheKey);
      if (cachedAfterLock) {
        return cachedAfterLock;
      }

      // Get primary provider
      const provider = this.getProviderForGeocoding(preferredProvider);
      if (!provider) {
        throw new Error('No geocoding provider available');
      }

      const attemptGeocode = async (currentProvider: BaseMapProvider): Promise<GeocodingResult[]> => {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Geocoding timeout')), timeout);
      });

      try {
        const geocodePromise = currentProvider.geocode(address, { limit, bounds });
        const results = await Promise.race([geocodePromise, timeoutPromise]);
        
        // Cache successful results
        this.setCachedResult(cacheKey, results, currentProvider.getProviderType());
        
        // Update quota usage
        const providerType = currentProvider.getProviderType();
        if (providerType !== 'other') {
          mapConfig.updateQuotaUsage(providerType, 1);
        }
        
        return results;
      } catch (error) {
        console.warn(`Geocoding failed with ${currentProvider.getProviderType()}:`, error);
        throw error;
      }
    };

      // Try primary provider
      try {
        return await attemptGeocode(provider);
      } catch (error) {
        if (!fallback) {
          throw error;
        }

        // Try fallback providers
        const allProviders = mapConfig.getEnabledProviders()
          .filter(p => p.provider !== provider!.getProviderType())
          .sort((a, b) => a.priority - b.priority);

        for (const providerConfig of allProviders) {
          const fallbackProvider = this.providers.get(providerConfig.provider);
          if (!fallbackProvider || !fallbackProvider.getCapabilities().geocoding) {
            continue;
          }

          const health = connectivityChecker.getProviderHealth(providerConfig.provider);
          if (health?.isHealthy === false) {
            continue;
          }

          try {
            return await attemptGeocode(fallbackProvider);
          } catch (fallbackError) {
            console.warn(`Fallback geocoding failed with ${providerConfig.provider}:`, fallbackError);
            continue;
          }
        }

        // If all providers failed, throw the original error
        throw error;
      }
    });
  }

  /**
   * Reverse geocode coordinates to address
   */
  async reverseGeocode(
    coordinates: Coordinates, 
    options: ReverseGeocodingOptions = {}
  ): Promise<ReverseGeocodingResult> {
    const {
      language = 'en',
      provider: preferredProvider,
      fallback = true,
      timeout = this.DEFAULT_TIMEOUT,
    } = options;

    // Validate coordinates
    if (typeof coordinates.latitude !== 'number' || 
        coordinates.latitude < -90 || 
        coordinates.latitude > 90) {
      throw new Error('Invalid latitude: must be between -90 and 90');
    }

    if (typeof coordinates.longitude !== 'number' || 
        coordinates.longitude < -180 || 
        coordinates.longitude > 180) {
      throw new Error('Invalid longitude: must be between -180 and 180');
    }

    // Check cache first
    const cacheKey = this.getCacheKey('reverse', coordinates, { language });
    const cached = this.getCachedResult<ReverseGeocodingResult>(cacheKey);
    if (cached) {
      return cached;
    }

    // Use request deduplication to prevent duplicate concurrent requests
    return this.reverseGeocodeDeduplicator.dedupe(cacheKey, async () => {
      // Double-check cache after acquiring dedup lock
      const cachedAfterLock = this.getCachedResult<ReverseGeocodingResult>(cacheKey);
      if (cachedAfterLock) {
        return cachedAfterLock;
      }

      // Get primary provider
      const provider = this.getProviderForGeocoding(preferredProvider);
      if (!provider) {
        throw new Error('No reverse geocoding provider available');
      }

      const attemptReverseGeocode = async (currentProvider: BaseMapProvider): Promise<ReverseGeocodingResult> => {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Reverse geocoding timeout')), timeout);
        });

        try {
          const reverseGeocodePromise = currentProvider.reverseGeocode(coordinates, { language });
          const result = await Promise.race([reverseGeocodePromise, timeoutPromise]);
          
          // Cache successful result
          this.setCachedResult(cacheKey, result, currentProvider.getProviderType());
          
          // Update quota usage
          const providerType = currentProvider.getProviderType();
          if (providerType !== 'other') {
            mapConfig.updateQuotaUsage(providerType, 1);
          }
          
          return result;
        } catch (error) {
          console.warn(`Reverse geocoding failed with ${currentProvider.getProviderType()}:`, error);
          throw error;
        }
      };

      // Try primary provider
      try {
        return await attemptReverseGeocode(provider);
      } catch (error) {
        if (!fallback) {
          throw error;
        }

        // Try fallback providers
        const allProviders = mapConfig.getEnabledProviders()
          .filter(p => p.provider !== provider!.getProviderType())
          .sort((a, b) => a.priority - b.priority);

        for (const providerConfig of allProviders) {
          const fallbackProvider = this.providers.get(providerConfig.provider);
          if (!fallbackProvider || !fallbackProvider.getCapabilities().reverseGeocoding) {
            continue;
          }

          const health = connectivityChecker.getProviderHealth(providerConfig.provider);
          if (health?.isHealthy === false) {
            continue;
          }

          try {
            return await attemptReverseGeocode(fallbackProvider);
          } catch (fallbackError) {
            console.warn(`Fallback reverse geocoding failed with ${providerConfig.provider}:`, fallbackError);
            continue;
          }
        }

        // If all providers failed, throw the original error
        throw error;
      }
    });
  }

  /**
   * Search for addresses with autocomplete
   */
  async autocomplete(
    query: string,
    options: {
      limit?: number;
      location?: Coordinates;
      radius?: number;
      language?: string;
      provider?: 'openstreetmap' | 'google' | 'mapbox';
    } = {}
  ): Promise<Array<{ description: string; place_id?: string; coordinates?: Coordinates }>> {
    const { provider: preferredProvider, limit = 5 } = options;

    // For autocomplete, we prefer providers with this capability
    const provider = this.getProviderForGeocoding(preferredProvider);
    
    // Check if provider supports autocomplete
    if (provider && provider.getCapabilities().autocomplete) {
      try {
        // For now, fallback to geocoding as most providers don't have separate autocomplete
        const results = await this.geocode(query, { 
          limit, 
          language: options.language,
          provider: preferredProvider 
        });
        
        return results.map(result => ({
          description: result.displayName,
          coordinates: result.coordinates,
        }));
      } catch (error) {
        console.warn('Autocomplete failed:', error);
        return [];
      }
    }

    // Fallback to regular geocoding
    try {
      const results = await this.geocode(query, { limit, language: options.language });
      return results.slice(0, limit).map(result => ({
        description: result.displayName,
        coordinates: result.coordinates,
      }));
    } catch (error) {
      console.warn('Autocomplete fallback failed:', error);
      return [];
    }
  }

  /**
   * Get available providers and their status
   */
  getProviderStatus(): Array<{
    provider: string;
    available: boolean;
    healthy: boolean;
    capabilities: {
      geocoding: boolean;
      reverseGeocoding: boolean;
      autocomplete: boolean;
    };
    quotaStatus?: {
      used: number;
      limit: number;
      exceeded: boolean;
    };
  }> {
    const status = [];
    
    for (const [providerName, provider] of this.providers.entries()) {
      const health = connectivityChecker.getProviderHealth(providerName as 'openstreetmap' | 'google' | 'mapbox');
      const quotaExceeded = mapConfig.checkQuotaExceeded(providerName as 'openstreetmap' | 'google' | 'mapbox');
      const activeKey = mapConfig.getActiveApiKey(providerName as 'openstreetmap' | 'google' | 'mapbox');
      
      status.push({
        provider: providerName,
        available: true,
        healthy: health?.isHealthy !== false,
        capabilities: provider.getCapabilities(),
        quotaStatus: activeKey?.quota ? {
          used: activeKey.quota.used || 0,
          limit: activeKey.quota.daily || activeKey.quota.monthly || 0,
          exceeded: quotaExceeded,
        } : undefined,
      });
    }
    
    return status;
  }

  /**
   * Clear geocoding cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    maxSize: number;
    entries: Array<{
      key: string;
      provider: string;
      timestamp: number;
    }>;
  } {
    const cacheEntries = this.cache.entries();
    const entries = cacheEntries.map(entry => ({
      key: String(entry.key),
      provider: entry.value.provider,
      timestamp: entry.timestamp,
    }));
    
    const stats = this.cache.getStats();
    return {
      size: stats.size,
      maxSize: stats.maxSize,
      entries,
    };
  }

  /**
   * Check if geocoding is available
   */
  isAvailable(): boolean {
    return this.providers.size > 0 && 
           Array.from(this.providers.values()).some(p => p.getCapabilities().geocoding);
  }
}

// Singleton instance
export const geocodingService = new GeocodingService();
