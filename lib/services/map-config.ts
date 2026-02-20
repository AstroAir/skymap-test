/**
 * Map API configuration management service
 * Manages provider configuration and API keys (web local storage / Tauri secure storage)
 */

import type { MapProviderConfig } from './map-providers/base-map-provider';
import { mapKeysApi } from '@/lib/tauri/map-keys-api';
import { isTauri } from '@/lib/storage/platform';
import { createLogger } from '@/lib/logger';

const logger = createLogger('map-config');

const CURRENT_CONFIG_VERSION = 2;

export interface MapApiKey {
  id: string;
  provider: 'openstreetmap' | 'google' | 'mapbox';
  apiKey: string;
  label?: string;
  isDefault?: boolean;
  isActive?: boolean;
  quota?: {
    daily?: number;
    monthly?: number;
    used?: number;
    resetDate?: string;
  };
  restrictions?: {
    domains?: string[];
    ips?: string[];
    regions?: string[];
  };
  createdAt: string;
  lastUsed?: string;
}

export interface MapApiKeyMeta {
  id: string;
  provider: 'openstreetmap' | 'google' | 'mapbox';
  label?: string;
  isDefault?: boolean;
  isActive?: boolean;
  quota?: {
    daily?: number;
    monthly?: number;
    used?: number;
    resetDate?: string;
  };
  restrictions?: {
    domains?: string[];
    ips?: string[];
    regions?: string[];
  };
  createdAt: string;
  lastUsed?: string;
}

export interface SecureKeyMigrationResult {
  migrated: number;
  skipped: number;
  failed: number;
  message?: string;
}

export interface MapProviderSettings {
  provider: 'openstreetmap' | 'google' | 'mapbox';
  priority: number;
  enabled: boolean;
  config: MapProviderConfig;
  fallbackDelay?: number;
  maxRetries?: number;
}

export interface MapConfiguration {
  defaultProvider: 'openstreetmap' | 'google' | 'mapbox';
  providers: MapProviderSettings[];
  apiKeys: MapApiKey[];
  fallbackStrategy: 'priority' | 'fastest' | 'random' | 'round-robin';
  healthCheckInterval: number;
  enableAutoFallback: boolean;
  cacheResponses: boolean;
  cacheDuration: number;
  enableOfflineMode: boolean;
  offlineFallbackProvider?: 'openstreetmap';
  policyMode: 'strict' | 'balanced' | 'legacy';
  searchBehaviorWhenNoAutocomplete: 'submit-only' | 'disabled';
  configVersion: number;
}

class MapConfigurationService {
  private config: MapConfiguration;
  private listeners: Array<(config: MapConfiguration) => void> = [];
  private readonly STORAGE_KEY = 'skymap-map-config';
  private readonly MIGRATION_KEY = 'skymap-map-config-secure-keys-v2';
  private secureKeysInitialized = false;

  constructor() {
    this.config = this.getDefaultConfiguration();
    this.loadConfiguration();
    void this.initializeSecureKeys();
  }

  private isTauriEnv(): boolean {
    return isTauri();
  }

  private getDefaultConfiguration(): MapConfiguration {
    return {
      defaultProvider: 'openstreetmap',
      providers: [
        {
          provider: 'openstreetmap',
          priority: 1,
          enabled: true,
          config: {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
            minZoom: 0,
            rateLimit: 1000,
          },
        },
        {
          provider: 'google',
          priority: 2,
          enabled: false,
          config: {
            attribution: '© Google',
            maxZoom: 21,
            minZoom: 0,
            rateLimit: 50,
          },
        },
        {
          provider: 'mapbox',
          priority: 3,
          enabled: false,
          config: {
            attribution: '© Mapbox © OpenStreetMap contributors',
            maxZoom: 22,
            minZoom: 0,
            rateLimit: 600,
          },
        },
      ],
      apiKeys: [],
      fallbackStrategy: 'priority',
      healthCheckInterval: 300000,
      enableAutoFallback: true,
      cacheResponses: true,
      cacheDuration: 3600000,
      enableOfflineMode: true,
      offlineFallbackProvider: 'openstreetmap',
      policyMode: 'strict',
      searchBehaviorWhenNoAutocomplete: 'submit-only',
      configVersion: CURRENT_CONFIG_VERSION,
    };
  }

  private obfuscateKey(key: string): string {
    if (typeof btoa === 'undefined') return key;
    return btoa(key);
  }

  private deobfuscateKey(encoded: string): string {
    if (typeof atob === 'undefined') return encoded;
    try {
      return atob(encoded);
    } catch {
      return encoded;
    }
  }

  private normalizeConfiguration(config: Partial<MapConfiguration>): MapConfiguration {
    return {
      ...this.getDefaultConfiguration(),
      ...config,
      apiKeys: config.apiKeys ?? [],
      configVersion: config.configVersion ?? CURRENT_CONFIG_VERSION,
    };
  }

  private loadConfiguration(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return;

      const parsed = JSON.parse(stored) as Partial<MapConfiguration>;
      if (parsed.apiKeys) {
        parsed.apiKeys = parsed.apiKeys.map((k: MapApiKey) => ({
          ...k,
          apiKey: k.apiKey ? this.deobfuscateKey(k.apiKey) : '',
        }));
      }

      this.config = this.normalizeConfiguration(parsed);
      if (this.config.configVersion < CURRENT_CONFIG_VERSION) {
        this.config.configVersion = CURRENT_CONFIG_VERSION;
      }
    } catch (error) {
      logger.warn('Failed to load map configuration', error);
    }
  }

  private sanitizeForStorage(): MapConfiguration {
    if (this.isTauriEnv()) {
      return {
        ...this.config,
        apiKeys: this.config.apiKeys.map(k => ({
          ...k,
          apiKey: '',
        })),
      };
    }

    return {
      ...this.config,
      apiKeys: this.config.apiKeys.map(k => ({
        ...k,
        apiKey: this.obfuscateKey(k.apiKey),
      })),
    };
  }

  private saveConfiguration(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.sanitizeForStorage()));
      this.notifyListeners();
    } catch (error) {
      logger.error('Failed to save map configuration', error);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.getConfiguration());
      } catch (error) {
        logger.error('Error in configuration listener', error);
      }
    });
  }

  private toMeta(key: MapApiKey): MapApiKeyMeta {
    const { apiKey, ...meta } = key;
    void apiKey;
    return meta;
  }

  private async persistKeyToSecureStore(key: MapApiKey): Promise<void> {
    if (!this.isTauriEnv() || !mapKeysApi.isAvailable()) return;
    await mapKeysApi.save({
      ...this.toMeta(key),
      apiKey: key.apiKey,
    });
  }

  private async removeKeyFromSecureStore(keyId: string): Promise<void> {
    if (!this.isTauriEnv() || !mapKeysApi.isAvailable()) return;
    await mapKeysApi.remove(keyId);
  }

  private setActiveKeyInSecureStore(provider: 'openstreetmap' | 'google' | 'mapbox', keyId: string): void {
    if (!this.isTauriEnv() || !mapKeysApi.isAvailable()) return;
    void mapKeysApi.setActive(provider, keyId).catch(error => logger.warn('Failed to set active key in secure store', error));
  }

  private async initializeSecureKeys(): Promise<void> {
    if (this.secureKeysInitialized || !this.isTauriEnv() || !mapKeysApi.isAvailable()) return;
    this.secureKeysInitialized = true;

    try {
      const metas = await mapKeysApi.listMeta();
      const legacyKeys = this.config.apiKeys.filter(k => !!k.apiKey);

      // First-run migration: move locally stored keys to secure storage.
      if (metas.length === 0 && legacyKeys.length > 0 && typeof window !== 'undefined' && !localStorage.getItem(this.MIGRATION_KEY)) {
        await this.migrateLegacyKeysToSecureStore(legacyKeys);
      }

      const refreshedMetas = await mapKeysApi.listMeta();
      const secureKeys: MapApiKey[] = [];
      for (const meta of refreshedMetas) {
        const apiKey = await mapKeysApi.get(meta.id);
        if (!apiKey) continue;
        secureKeys.push({ ...meta, apiKey });
      }

      this.config.apiKeys = secureKeys;
      this.saveConfiguration();
    } catch (error) {
      logger.warn('Failed to initialize secure map keys', error);
    }
  }

  private async migrateLegacyKeysToSecureStore(legacyKeys: MapApiKey[]): Promise<SecureKeyMigrationResult> {
    let migrated = 0;
    let skipped = 0;
    let failed = 0;

    for (const key of legacyKeys) {
      if (!key.apiKey) {
        skipped++;
        continue;
      }
      try {
        await this.persistKeyToSecureStore(key);
        migrated++;
      } catch (error) {
        failed++;
        logger.warn(`Failed to migrate API key ${key.id}`, error);
      }
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(this.MIGRATION_KEY, new Date().toISOString());
    }

    return {
      migrated,
      skipped,
      failed,
      message: failed > 0 ? 'Some keys failed to migrate' : 'Migration completed',
    };
  }

  // Configuration getters
  getConfiguration(): MapConfiguration {
    return {
      ...this.config,
      providers: this.config.providers.map(p => ({ ...p, config: { ...p.config } })),
      apiKeys: this.config.apiKeys.map(k => ({ ...k, quota: k.quota ? { ...k.quota } : undefined })),
    };
  }

  getDefaultProvider(): 'openstreetmap' | 'google' | 'mapbox' {
    return this.config.defaultProvider;
  }

  getEnabledProviders(): MapProviderSettings[] {
    return this.config.providers
      .filter(p => p.enabled)
      .sort((a, b) => a.priority - b.priority);
  }

  getProviderSettings(provider: 'openstreetmap' | 'google' | 'mapbox'): MapProviderSettings | undefined {
    return this.config.providers.find(p => p.provider === provider);
  }

  // Provider management
  setDefaultProvider(provider: 'openstreetmap' | 'google' | 'mapbox'): void {
    this.config.defaultProvider = provider;
    this.saveConfiguration();
  }

  enableProvider(provider: 'openstreetmap' | 'google' | 'mapbox', enabled = true): void {
    const settings = this.config.providers.find(p => p.provider === provider);
    if (settings) {
      settings.enabled = enabled;
      this.saveConfiguration();
    }
  }

  setProviderPriority(provider: 'openstreetmap' | 'google' | 'mapbox', priority: number): void {
    const settings = this.config.providers.find(p => p.provider === provider);
    if (settings) {
      settings.priority = priority;
      this.saveConfiguration();
    }
  }

  updateProviderConfig(provider: 'openstreetmap' | 'google' | 'mapbox', config: Partial<MapProviderConfig>): void {
    const settings = this.config.providers.find(p => p.provider === provider);
    if (settings) {
      settings.config = { ...settings.config, ...config };
      this.saveConfiguration();
    }
  }

  // API Key management
  getApiKeys(provider?: 'openstreetmap' | 'google' | 'mapbox'): MapApiKey[] {
    return this.config.apiKeys.filter(key => !provider || key.provider === provider);
  }

  getActiveApiKey(provider: 'openstreetmap' | 'google' | 'mapbox'): MapApiKey | undefined {
    const active = this.config.apiKeys.find(key => key.provider === provider && key.isActive);
    if (active) return active;

    const def = this.config.apiKeys.find(key => key.provider === provider && key.isDefault);
    if (def) return def;

    return this.config.apiKeys.find(key => key.provider === provider);
  }

  addApiKey(apiKey: Omit<MapApiKey, 'id' | 'createdAt'>): string {
    const id = `${apiKey.provider}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    const newKey: MapApiKey = {
      ...apiKey,
      id,
      createdAt: new Date().toISOString(),
    };

    const existingKeys = this.getApiKeys(apiKey.provider);
    if (existingKeys.length === 0) {
      newKey.isActive = true;
      newKey.isDefault = true;
    }

    this.config.apiKeys.push(newKey);
    this.saveConfiguration();
    void this.persistKeyToSecureStore(newKey);
    return id;
  }

  updateApiKey(id: string, updates: Partial<MapApiKey>): void {
    const keyIndex = this.config.apiKeys.findIndex(key => key.id === id);
    if (keyIndex >= 0) {
      this.config.apiKeys[keyIndex] = {
        ...this.config.apiKeys[keyIndex],
        ...updates,
      };
      this.saveConfiguration();
      void this.persistKeyToSecureStore(this.config.apiKeys[keyIndex]);
    }
  }

  removeApiKey(id: string): void {
    const removed = this.config.apiKeys.find(key => key.id === id);
    this.config.apiKeys = this.config.apiKeys.filter(key => key.id !== id);

    if (removed) {
      const remaining = this.getApiKeys(removed.provider);
      const hasActive = remaining.some(k => k.isActive);
      const hasDefault = remaining.some(k => k.isDefault);

      if (remaining.length > 0 && !hasDefault) {
        remaining[0].isDefault = true;
      }

      if (remaining.length > 0 && !hasActive) {
        remaining.forEach(k => {
          k.isActive = false;
        });
        remaining[0].isActive = true;
        remaining[0].lastUsed = new Date().toISOString();
      }
    }

    this.saveConfiguration();
    void this.removeKeyFromSecureStore(id);
  }

  setDefaultApiKey(keyId: string): void {
    const key = this.config.apiKeys.find(k => k.id === keyId);
    if (key) {
      this.config.apiKeys.forEach(k => {
        if (k.provider === key.provider) {
          k.isDefault = false;
          k.isActive = false;
        }
      });
      key.isDefault = true;
      key.isActive = true;
      key.lastUsed = new Date().toISOString();
      this.saveConfiguration();
      void this.persistKeyToSecureStore(key);
      this.setActiveKeyInSecureStore(key.provider, key.id);
    }
  }

  setActiveApiKey(provider: 'openstreetmap' | 'google' | 'mapbox', keyId: string): void {
    this.config.apiKeys.forEach(key => {
      if (key.provider === provider) {
        key.isActive = false;
      }
    });

    const selectedKey = this.config.apiKeys.find(key => key.id === keyId);
    if (selectedKey && selectedKey.provider === provider) {
      selectedKey.isActive = true;
      selectedKey.lastUsed = new Date().toISOString();
      void this.persistKeyToSecureStore(selectedKey);
      this.setActiveKeyInSecureStore(provider, keyId);
    }

    this.saveConfiguration();
  }

  // Quota management
  updateQuotaUsage(provider: 'openstreetmap' | 'google' | 'mapbox', usage: number): void {
    const activeKey = this.getActiveApiKey(provider);
    if (activeKey && activeKey.quota) {
      activeKey.quota.used = (activeKey.quota.used || 0) + usage;
      this.saveConfiguration();
      void this.persistKeyToSecureStore(activeKey);
    }
  }

  resetQuotaUsage(provider: 'openstreetmap' | 'google' | 'mapbox'): void {
    const activeKey = this.getActiveApiKey(provider);
    if (activeKey && activeKey.quota) {
      activeKey.quota.used = 0;
      activeKey.quota.resetDate = new Date().toISOString();
      this.saveConfiguration();
      void this.persistKeyToSecureStore(activeKey);
    }
  }

  checkQuotaExceeded(provider: 'openstreetmap' | 'google' | 'mapbox'): boolean {
    const activeKey = this.getActiveApiKey(provider);
    if (!activeKey || !activeKey.quota) {
      return false;
    }

    const { daily, monthly, used = 0 } = activeKey.quota;
    const now = new Date();
    const resetDate = activeKey.quota.resetDate ? new Date(activeKey.quota.resetDate) : null;

    if (resetDate) {
      const daysSinceReset = Math.floor((now.getTime() - resetDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceReset >= 1 && daily) {
        this.resetQuotaUsage(provider);
        return false;
      }

      const monthsSinceReset = (now.getFullYear() - resetDate.getFullYear()) * 12
        + (now.getMonth() - resetDate.getMonth());
      if (monthsSinceReset >= 1 && monthly) {
        this.resetQuotaUsage(provider);
        return false;
      }
    }

    if (daily && used >= daily) {
      return true;
    }

    if (monthly && used >= monthly) {
      return true;
    }

    return false;
  }

  // Configuration management
  setFallbackStrategy(strategy: MapConfiguration['fallbackStrategy']): void {
    this.config.fallbackStrategy = strategy;
    this.saveConfiguration();
  }

  setAutoFallback(enabled: boolean): void {
    this.config.enableAutoFallback = enabled;
    this.saveConfiguration();
  }

  setCacheSettings(enabled: boolean, duration?: number): void {
    this.config.cacheResponses = enabled;
    if (duration !== undefined) {
      this.config.cacheDuration = duration;
    }
    this.saveConfiguration();
  }

  setOfflineMode(enabled: boolean, fallbackProvider?: 'openstreetmap'): void {
    this.config.enableOfflineMode = enabled;
    if (fallbackProvider) {
      this.config.offlineFallbackProvider = fallbackProvider;
    }
    this.saveConfiguration();
  }

  setHealthCheckInterval(interval: number): void {
    this.config.healthCheckInterval = interval;
    this.saveConfiguration();
  }

  setPolicyMode(mode: MapConfiguration['policyMode']): void {
    this.config.policyMode = mode;
    this.saveConfiguration();
  }

  setSearchBehaviorWhenNoAutocomplete(mode: MapConfiguration['searchBehaviorWhenNoAutocomplete']): void {
    this.config.searchBehaviorWhenNoAutocomplete = mode;
    this.saveConfiguration();
  }

  addConfigurationListener(listener: (config: MapConfiguration) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  exportConfiguration(): string {
    const exportConfig = { ...this.getConfiguration() };
    exportConfig.apiKeys = exportConfig.apiKeys.map(key => ({
      ...key,
      apiKey: '***REDACTED***',
    }));
    return JSON.stringify(exportConfig, null, 2);
  }

  importConfiguration(configJson: string, preserveApiKeys = true): void {
    try {
      const importedConfig = JSON.parse(configJson);
      this.validateImportedConfig(importedConfig);

      if (preserveApiKeys) {
        importedConfig.apiKeys = this.config.apiKeys;
      }

      this.config = this.normalizeConfiguration(importedConfig);
      this.saveConfiguration();
    } catch (error) {
      throw new Error(`Invalid configuration format: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private validateImportedConfig(config: unknown): void {
    if (typeof config !== 'object' || config === null) {
      throw new Error('Configuration must be an object');
    }

    const c = config as Record<string, unknown>;
    const validProviders = ['openstreetmap', 'google', 'mapbox'];
    const validStrategies = ['priority', 'fastest', 'random', 'round-robin'];
    const validPolicyModes = ['strict', 'balanced', 'legacy'];
    const validSearchBehaviors = ['submit-only', 'disabled'];

    if (c.defaultProvider !== undefined && !validProviders.includes(c.defaultProvider as string)) {
      throw new Error(`Invalid defaultProvider: ${c.defaultProvider}`);
    }

    if (c.fallbackStrategy !== undefined && !validStrategies.includes(c.fallbackStrategy as string)) {
      throw new Error(`Invalid fallbackStrategy: ${c.fallbackStrategy}`);
    }

    if (c.policyMode !== undefined && !validPolicyModes.includes(c.policyMode as string)) {
      throw new Error(`Invalid policyMode: ${c.policyMode}`);
    }

    if (
      c.searchBehaviorWhenNoAutocomplete !== undefined
      && !validSearchBehaviors.includes(c.searchBehaviorWhenNoAutocomplete as string)
    ) {
      throw new Error(`Invalid searchBehaviorWhenNoAutocomplete: ${c.searchBehaviorWhenNoAutocomplete}`);
    }

    if (c.healthCheckInterval !== undefined && (typeof c.healthCheckInterval !== 'number' || c.healthCheckInterval < 5000)) {
      throw new Error('healthCheckInterval must be a number >= 5000ms');
    }

    if (c.cacheDuration !== undefined && (typeof c.cacheDuration !== 'number' || c.cacheDuration < 0)) {
      throw new Error('cacheDuration must be a non-negative number');
    }

    if (c.providers !== undefined) {
      if (!Array.isArray(c.providers)) {
        throw new Error('providers must be an array');
      }
      for (const p of c.providers) {
        if (typeof p !== 'object' || p === null) throw new Error('Each provider must be an object');
        const provider = p as Record<string, unknown>;
        if (!validProviders.includes(provider.provider as string)) {
          throw new Error(`Invalid provider type: ${provider.provider}`);
        }
      }
    }
  }

  resetConfiguration(): void {
    this.config = this.getDefaultConfiguration();
    this.saveConfiguration();
  }
}

export const mapConfig = new MapConfigurationService();
