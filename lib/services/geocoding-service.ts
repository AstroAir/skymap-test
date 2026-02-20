/**
 * Unified geocoding service
 * Provides geocoding and reverse geocoding across multiple map providers with policy-aware fallback.
 */

import type {
  BaseMapProvider,
  Coordinates,
  BoundingBox,
  GeocodingResult,
  ReverseGeocodingResult,
} from './map-providers/base-map-provider';
import { createMapProvider } from './map-providers';
import { mapConfig } from './map-config';
import { connectivityChecker } from './connectivity-checker';
import { LRUCache, RequestDeduplicator } from './lru-cache';
import { createLogger } from '@/lib/logger';

const logger = createLogger('geocoding-service');

type ProviderName = 'openstreetmap' | 'google' | 'mapbox';
type ProviderCapability = 'geocoding' | 'reverseGeocoding' | 'autocomplete';

export type GeocodingErrorCode =
  | 'NO_PROVIDER'
  | 'OFFLINE_RESTRICTED'
  | 'QUOTA_EXCEEDED'
  | 'POLICY_RESTRICTED';

export class GeocodingServiceError extends Error {
  constructor(
    public readonly code: GeocodingErrorCode,
    message: string,
    public readonly causeError?: unknown,
  ) {
    super(message);
    this.name = 'GeocodingServiceError';
  }
}

export interface GeocodingOptions {
  limit?: number;
  bounds?: BoundingBox;
  language?: string;
  provider?: ProviderName;
  fallback?: boolean;
  timeout?: number;
}

export interface ReverseGeocodingOptions {
  language?: string;
  provider?: ProviderName;
  fallback?: boolean;
  timeout?: number;
}

interface CacheValue {
  data: GeocodingResult[] | ReverseGeocodingResult;
  provider: string;
}

export interface SearchCapabilities {
  autocompleteAvailable: boolean;
  mode: 'online-autocomplete' | 'submit-search' | 'offline-cache' | 'disabled';
  reason?: GeocodingErrorCode;
  providers: ProviderName[];
}

export interface AutocompleteResult {
  description: string;
  place_id?: string;
  coordinates?: Coordinates;
  sourceProvider?: ProviderName;
  mode?: 'online-autocomplete' | 'submit-search' | 'offline-cache';
}

class GeocodingService {
  private providers: Map<ProviderName, BaseMapProvider> = new Map();
  private providerSignatures: Map<ProviderName, string> = new Map();
  private cache: LRUCache<string, CacheValue>;
  private geocodeDeduplicator = new RequestDeduplicator<string, GeocodingResult[]>();
  private reverseGeocodeDeduplicator = new RequestDeduplicator<string, ReverseGeocodingResult>();
  private pruneIntervalId: ReturnType<typeof setInterval> | null = null;
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000;
  private readonly MAX_CACHE_SIZE = 500;
  private readonly DEFAULT_TIMEOUT = 10000;

  constructor() {
    const cfg = mapConfig.getConfiguration();
    this.cache = new LRUCache<string, CacheValue>({
      maxSize: this.MAX_CACHE_SIZE,
      ttl: cfg.cacheDuration || this.CACHE_DURATION,
    });

    this.initializeProviders();
    this.startPruneInterval();

    mapConfig.addConfigurationListener(() => {
      const nextCfg = mapConfig.getConfiguration();
      this.cache = new LRUCache<string, CacheValue>({
        maxSize: this.MAX_CACHE_SIZE,
        ttl: nextCfg.cacheDuration || this.CACHE_DURATION,
      });
      this.initializeProviders();
    });
  }

  private startPruneInterval(): void {
    if (typeof window !== 'undefined') {
      if (this.pruneIntervalId !== null) {
        clearInterval(this.pruneIntervalId);
      }
      this.pruneIntervalId = setInterval(() => this.cache.prune(), 60000);
    }
  }

  private shouldUseCache(): boolean {
    return mapConfig.getConfiguration().cacheResponses;
  }

  private getCacheTtl(): number {
    const cfg = mapConfig.getConfiguration();
    return cfg.cacheDuration || this.CACHE_DURATION;
  }

  private buildProviderSignature(provider: ProviderName, apiKey?: string): string {
    const cfg = mapConfig.getConfiguration();
    const providerSettings = mapConfig.getProviderSettings(provider);
    return JSON.stringify({
      provider,
      config: providerSettings?.config,
      apiKey: apiKey || '',
      healthCheckInterval: cfg.healthCheckInterval,
    });
  }

  private initializeProviders(): void {
    const enabledProviders = mapConfig.getEnabledProviders();
    const nextProviders = new Set(enabledProviders.map(p => p.provider));

    // Stop monitoring providers that are no longer enabled.
    for (const providerName of this.providers.keys()) {
      if (!nextProviders.has(providerName)) {
        connectivityChecker.stopMonitoring(providerName);
        this.providers.delete(providerName);
        this.providerSignatures.delete(providerName);
      }
    }

    for (const providerConfig of enabledProviders) {
      const providerName = providerConfig.provider;
      const apiKey = mapConfig.getActiveApiKey(providerName)?.apiKey;
      const signature = this.buildProviderSignature(providerName, apiKey);
      const existingSignature = this.providerSignatures.get(providerName);

      if (existingSignature === signature && this.providers.has(providerName)) {
        continue;
      }

      if (this.providers.has(providerName)) {
        connectivityChecker.stopMonitoring(providerName);
      }

      try {
        const provider = createMapProvider(providerName, {
          ...providerConfig.config,
          apiKey,
        });
        this.providers.set(providerName, provider);
        this.providerSignatures.set(providerName, signature);
        connectivityChecker.startMonitoring(provider);
      } catch (error) {
        logger.warn(`Failed to initialize provider ${providerName}`, error);
      }
    }
  }

  private isOfflineRestricted(): boolean {
    const cfg = mapConfig.getConfiguration();
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    return cfg.enableOfflineMode && !isOnline;
  }

  private getCacheKey(type: 'geocode' | 'reverse', input: string | Coordinates, options?: Record<string, unknown>): string {
    const optionsStr = options ? JSON.stringify(options, Object.keys(options).sort()) : '';
    if (typeof input === 'string') {
      return `${type}:${input}:${optionsStr}`;
    }
    return `${type}:${input.latitude},${input.longitude}:${optionsStr}`;
  }

  private getCachedResult<T>(key: string): T | null {
    if (!this.shouldUseCache()) return null;
    const cached = this.cache.get(key);
    if (!cached) return null;
    return cached.data as T;
  }

  private setCachedResult(key: string, data: GeocodingResult[] | ReverseGeocodingResult, provider: string): void {
    if (!this.shouldUseCache()) return;
    this.cache.set(key, { data, provider }, this.getCacheTtl());
  }

  private getAvailableProviders(capability: ProviderCapability): {
    providers: BaseMapProvider[];
    quotaBlocked: boolean;
  } {
    const available: BaseMapProvider[] = [];
    let quotaBlocked = false;

    const enabledProviders = mapConfig.getEnabledProviders();
    for (const providerConfig of enabledProviders) {
      const providerName = providerConfig.provider;
      const provider = this.providers.get(providerName);
      if (!provider) continue;

      const capabilities = provider.getCapabilities();
      if (!capabilities[capability]) continue;

      if (mapConfig.checkQuotaExceeded(providerName)) {
        quotaBlocked = true;
        continue;
      }

      const health = connectivityChecker.getProviderHealth(providerName);
      if (health?.isHealthy === false) {
        continue;
      }

      available.push(provider);
    }

    return { providers: available, quotaBlocked };
  }

  private selectProvidersForRequest(
    capability: ProviderCapability,
    preferredProvider?: ProviderName,
    fallback = true,
  ): BaseMapProvider[] {
    const cfg = mapConfig.getConfiguration();
    const allowFallback = fallback && cfg.enableAutoFallback;
    const { providers, quotaBlocked } = this.getAvailableProviders(capability);

    if (providers.length === 0) {
      if (quotaBlocked) {
        throw new GeocodingServiceError('QUOTA_EXCEEDED', 'All available providers exceeded quota');
      }
      throw new GeocodingServiceError('NO_PROVIDER', 'No provider available for the requested operation');
    }

    let primary = providers[0];

    if (preferredProvider) {
      const preferred = providers.find(p => p.getProviderType() === preferredProvider);
      if (preferred) {
        primary = preferred;
      }
    } else {
      const recommended = connectivityChecker.getRecommendedProvider();
      if (recommended) {
        const found = providers.find(p => p.getProviderType() === recommended);
        if (found) {
          primary = found;
        }
      }
    }

    if (!allowFallback) {
      return [primary];
    }

    const ordered = [primary, ...providers.filter(p => p !== primary)];
    return ordered;
  }

  private async runWithProviders<T>(
    providers: BaseMapProvider[],
    timeout: number,
    runner: (provider: BaseMapProvider) => Promise<T>,
  ): Promise<T> {
    let firstError: unknown;
    for (const provider of providers) {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), timeout);
      });

      try {
        const result = await Promise.race([runner(provider), timeoutPromise]);
        const providerType = provider.getProviderType();
        if (providerType !== 'other') {
          mapConfig.updateQuotaUsage(providerType, 1);
        }
        return result;
      } catch (error) {
        firstError = firstError ?? error;
        logger.warn(`Provider request failed with ${provider.getProviderType()}`, error);
      }
    }

    if (firstError) {
      throw firstError;
    }

    throw new GeocodingServiceError('NO_PROVIDER', 'No provider request could be completed');
  }

  async geocode(address: string, options: GeocodingOptions = {}): Promise<GeocodingResult[]> {
    const {
      limit = 10,
      bounds,
      language = 'en',
      provider: preferredProvider,
      fallback = true,
      timeout = this.DEFAULT_TIMEOUT,
    } = options;

    const cacheKey = this.getCacheKey('geocode', address, { limit, bounds, language, provider: preferredProvider });
    const cached = this.getCachedResult<GeocodingResult[]>(cacheKey);
    if (cached) return cached;

    if (this.isOfflineRestricted()) {
      throw new GeocodingServiceError('OFFLINE_RESTRICTED', 'Offline mode allows cached results only');
    }

    return this.geocodeDeduplicator.dedupe(cacheKey, async () => {
      const cachedAfterLock = this.getCachedResult<GeocodingResult[]>(cacheKey);
      if (cachedAfterLock) return cachedAfterLock;

      const providers = this.selectProvidersForRequest('geocoding', preferredProvider, fallback);
      const results = await this.runWithProviders(providers, timeout, provider =>
        provider.geocode(address, { limit, bounds, language }));

      this.setCachedResult(cacheKey, results, providers[0].getProviderType());
      return results;
    });
  }

  async reverseGeocode(
    coordinates: Coordinates,
    options: ReverseGeocodingOptions = {},
  ): Promise<ReverseGeocodingResult> {
    const {
      language = 'en',
      provider: preferredProvider,
      fallback = true,
      timeout = this.DEFAULT_TIMEOUT,
    } = options;

    if (
      typeof coordinates.latitude !== 'number'
      || coordinates.latitude < -90
      || coordinates.latitude > 90
    ) {
      throw new Error('Invalid latitude: must be between -90 and 90');
    }

    if (
      typeof coordinates.longitude !== 'number'
      || coordinates.longitude < -180
      || coordinates.longitude > 180
    ) {
      throw new Error('Invalid longitude: must be between -180 and 180');
    }

    const cacheKey = this.getCacheKey('reverse', coordinates, { language, provider: preferredProvider });
    const cached = this.getCachedResult<ReverseGeocodingResult>(cacheKey);
    if (cached) return cached;

    if (this.isOfflineRestricted()) {
      throw new GeocodingServiceError('OFFLINE_RESTRICTED', 'Offline mode allows cached results only');
    }

    return this.reverseGeocodeDeduplicator.dedupe(cacheKey, async () => {
      const cachedAfterLock = this.getCachedResult<ReverseGeocodingResult>(cacheKey);
      if (cachedAfterLock) return cachedAfterLock;

      const providers = this.selectProvidersForRequest('reverseGeocoding', preferredProvider, fallback);
      const result = await this.runWithProviders(providers, timeout, provider =>
        provider.reverseGeocode(coordinates, { language }));

      this.setCachedResult(cacheKey, result, providers[0].getProviderType());
      return result;
    });
  }

  getSearchCapabilities(preferredProvider?: ProviderName): SearchCapabilities {
    const cfg = mapConfig.getConfiguration();
    if (this.isOfflineRestricted()) {
      return {
        autocompleteAvailable: false,
        mode: 'offline-cache',
        reason: 'OFFLINE_RESTRICTED',
        providers: [],
      };
    }

    const { providers, quotaBlocked } = this.getAvailableProviders('autocomplete');
    let autocompleteProviders = providers.map(p => p.getProviderType()).filter((p): p is ProviderName => p !== 'other');

    if (preferredProvider) {
      autocompleteProviders = autocompleteProviders.filter(p => p === preferredProvider);
    }

    if (cfg.policyMode === 'strict') {
      autocompleteProviders = autocompleteProviders.filter(provider => provider !== 'openstreetmap');
    }

    if (autocompleteProviders.length > 0) {
      return {
        autocompleteAvailable: true,
        mode: 'online-autocomplete',
        providers: autocompleteProviders,
      };
    }

    if (quotaBlocked) {
      return {
        autocompleteAvailable: false,
        mode: cfg.searchBehaviorWhenNoAutocomplete === 'disabled' ? 'disabled' : 'submit-search',
        reason: 'QUOTA_EXCEEDED',
        providers: [],
      };
    }

    if (cfg.policyMode === 'strict') {
      return {
        autocompleteAvailable: false,
        mode: cfg.searchBehaviorWhenNoAutocomplete === 'disabled' ? 'disabled' : 'submit-search',
        reason: 'POLICY_RESTRICTED',
        providers: [],
      };
    }

    const hasGeocodeProvider = this.getAvailableProviders('geocoding').providers.length > 0;
    return {
      autocompleteAvailable: false,
      mode: hasGeocodeProvider ? 'submit-search' : 'disabled',
      reason: hasGeocodeProvider ? undefined : 'NO_PROVIDER',
      providers: [],
    };
  }

  async autocomplete(
    query: string,
    options: {
      limit?: number;
      location?: Coordinates;
      radius?: number;
      language?: string;
      provider?: ProviderName;
    } = {},
  ): Promise<AutocompleteResult[]> {
    const { provider: preferredProvider, limit = 5 } = options;
    const capabilities = this.getSearchCapabilities(preferredProvider);

    if (capabilities.mode !== 'online-autocomplete') {
      return [];
    }

    const providers = this.selectProvidersForRequest('autocomplete', preferredProvider, true);
    for (const provider of providers) {
      const sourceProvider = provider.getProviderType();
      if (sourceProvider === 'other') continue;

      try {
        const maybeAutocompleteProvider = provider as BaseMapProvider & {
          autocomplete?: (input: string, opts?: Record<string, unknown>) => Promise<Array<{ description: string; place_id?: string; coordinates?: Coordinates }>>;
        };

        if (typeof maybeAutocompleteProvider.autocomplete === 'function') {
          const result = await maybeAutocompleteProvider.autocomplete(query, {
            limit,
            location: options.location,
            radius: options.radius,
            language: options.language,
          });
          return result.map(item => ({
            ...item,
            sourceProvider,
            mode: 'online-autocomplete',
          }));
        }

        const geocodeFallback = await provider.geocode(query, {
          limit,
          language: options.language,
        });
        return geocodeFallback.map(result => ({
          description: result.displayName,
          coordinates: result.coordinates,
          sourceProvider,
          mode: 'online-autocomplete',
        }));
      } catch (error) {
        logger.warn(`Autocomplete failed with ${sourceProvider}`, error);
      }
    }

    return [];
  }

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
      const health = connectivityChecker.getProviderHealth(providerName);
      const quotaExceeded = mapConfig.checkQuotaExceeded(providerName);
      const activeKey = mapConfig.getActiveApiKey(providerName);

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

  clearCache(): void {
    this.cache.clear();
  }

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

  isAvailable(): boolean {
    return this.providers.size > 0
      && Array.from(this.providers.values()).some(p => p.getCapabilities().geocoding);
  }
}

export const geocodingService = new GeocodingService();

