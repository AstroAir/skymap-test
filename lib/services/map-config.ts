/**
 * Map API configuration management service
 * Manages API keys, provider selection, and fallback strategies
 */

import type { MapProviderConfig } from './map-providers/base-map-provider';

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

export interface MapProviderSettings {
  provider: 'openstreetmap' | 'google' | 'mapbox';
  priority: number;
  enabled: boolean;
  config: MapProviderConfig;
  fallbackDelay?: number; // ms to wait before falling back
  maxRetries?: number;
}

export interface MapConfiguration {
  defaultProvider: 'openstreetmap' | 'google' | 'mapbox';
  providers: MapProviderSettings[];
  apiKeys: MapApiKey[];
  fallbackStrategy: 'priority' | 'fastest' | 'random' | 'round-robin';
  healthCheckInterval: number; // ms
  enableAutoFallback: boolean;
  cacheResponses: boolean;
  cacheDuration: number; // ms
  enableOfflineMode: boolean;
  offlineFallbackProvider?: 'openstreetmap';
}

class MapConfigurationService {
  private config: MapConfiguration;
  private listeners: Array<(config: MapConfiguration) => void> = [];
  private readonly STORAGE_KEY = 'skymap-map-config';

  constructor() {
    this.config = this.getDefaultConfiguration();
    this.loadConfiguration();
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
      healthCheckInterval: 300000, // 5 minutes
      enableAutoFallback: true,
      cacheResponses: true,
      cacheDuration: 3600000, // 1 hour
      enableOfflineMode: true,
      offlineFallbackProvider: 'openstreetmap',
    };
  }

  private loadConfiguration(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.config = { ...this.config, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load map configuration:', error);
    }
  }

  private saveConfiguration(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.config));
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to save map configuration:', error);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.config);
      } catch (error) {
        console.error('Error in configuration listener:', error);
      }
    });
  }

  // Configuration getters
  getConfiguration(): MapConfiguration {
    return { ...this.config };
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
    return this.config.apiKeys.filter(key => 
      !provider || key.provider === provider
    );
  }

  getActiveApiKey(provider: 'openstreetmap' | 'google' | 'mapbox'): MapApiKey | undefined {
    return this.config.apiKeys.find(key => 
      key.provider === provider && key.isActive
    );
  }

  addApiKey(apiKey: Omit<MapApiKey, 'id' | 'createdAt'>): string {
    const id = `${apiKey.provider}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    const newKey: MapApiKey = {
      ...apiKey,
      id,
      createdAt: new Date().toISOString(),
    };

    // If this is the first key for the provider, make it active
    const existingKeys = this.getApiKeys(apiKey.provider);
    if (existingKeys.length === 0) {
      newKey.isActive = true;
    }

    this.config.apiKeys.push(newKey);
    this.saveConfiguration();
    return id;
  }

  updateApiKey(id: string, updates: Partial<MapApiKey>): void {
    const keyIndex = this.config.apiKeys.findIndex(key => key.id === id);
    if (keyIndex >= 0) {
      this.config.apiKeys[keyIndex] = { 
        ...this.config.apiKeys[keyIndex], 
        ...updates 
      };
      this.saveConfiguration();
    }
  }

  removeApiKey(id: string): void {
    this.config.apiKeys = this.config.apiKeys.filter(key => key.id !== id);
    this.saveConfiguration();
  }

  setDefaultApiKey(keyId: string): void {
    const key = this.config.apiKeys.find(k => k.id === keyId);
    if (key) {
      // Remove default from all keys of the same provider
      this.config.apiKeys.forEach(k => {
        if (k.provider === key.provider) {
          k.isDefault = false;
        }
      });
      key.isDefault = true;
      this.saveConfiguration();
    }
  }

  setActiveApiKey(provider: 'openstreetmap' | 'google' | 'mapbox', keyId: string): void {
    // Deactivate all keys for this provider
    this.config.apiKeys.forEach(key => {
      if (key.provider === provider) {
        key.isActive = false;
      }
    });

    // Activate the selected key
    const selectedKey = this.config.apiKeys.find(key => key.id === keyId);
    if (selectedKey && selectedKey.provider === provider) {
      selectedKey.isActive = true;
      selectedKey.lastUsed = new Date().toISOString();
    }

    this.saveConfiguration();
  }

  // Quota management
  updateQuotaUsage(provider: 'openstreetmap' | 'google' | 'mapbox', usage: number): void {
    const activeKey = this.getActiveApiKey(provider);
    if (activeKey && activeKey.quota) {
      activeKey.quota.used = (activeKey.quota.used || 0) + usage;
      this.saveConfiguration();
    }
  }

  resetQuotaUsage(provider: 'openstreetmap' | 'google' | 'mapbox'): void {
    const activeKey = this.getActiveApiKey(provider);
    if (activeKey && activeKey.quota) {
      activeKey.quota.used = 0;
      activeKey.quota.resetDate = new Date().toISOString();
      this.saveConfiguration();
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

    // Check if quota needs to be reset
    if (resetDate) {
      const daysSinceReset = Math.floor((now.getTime() - resetDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceReset >= 1 && daily) {
        // Reset daily quota
        this.resetQuotaUsage(provider);
        return false;
      }

      const monthsSinceReset = (now.getFullYear() - resetDate.getFullYear()) * 12 + 
                              (now.getMonth() - resetDate.getMonth());
      if (monthsSinceReset >= 1 && monthly) {
        // Reset monthly quota
        this.resetQuotaUsage(provider);
        return false;
      }
    }

    // Check daily limit
    if (daily && used >= daily) {
      return true;
    }

    // Check monthly limit
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

  // Configuration listeners
  addConfigurationListener(listener: (config: MapConfiguration) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Import/Export configuration
  exportConfiguration(): string {
    const exportConfig = { ...this.config };
    // Remove sensitive API keys from export
    exportConfig.apiKeys = exportConfig.apiKeys.map(key => ({
      ...key,
      apiKey: '***REDACTED***',
    }));
    return JSON.stringify(exportConfig, null, 2);
  }

  importConfiguration(configJson: string, preserveApiKeys = true): void {
    try {
      const importedConfig = JSON.parse(configJson);
      
      if (preserveApiKeys) {
        // Keep existing API keys
        importedConfig.apiKeys = this.config.apiKeys;
      }
      
      this.config = { ...this.getDefaultConfiguration(), ...importedConfig };
      this.saveConfiguration();
    } catch (error) {
      throw new Error(`Invalid configuration format: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  resetConfiguration(): void {
    this.config = this.getDefaultConfiguration();
    this.saveConfiguration();
  }
}

// Singleton instance
export const mapConfig = new MapConfigurationService();
