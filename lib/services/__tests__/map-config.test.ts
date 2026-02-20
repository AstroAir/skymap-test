/**
 * @jest-environment jsdom
 */

import { mapConfig } from '../map-config';

describe('mapConfig', () => {
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: jest.fn((key: string) => store[key] || null),
      setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
      removeItem: jest.fn((key: string) => { delete store[key]; }),
      clear: jest.fn(() => { store = {}; }),
    };
  })();

  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
    localStorageMock.clear();
    mapConfig.resetConfiguration();
  });

  describe('getConfiguration', () => {
    it('should return default configuration', () => {
      const config = mapConfig.getConfiguration();
      
      expect(config.defaultProvider).toBe('openstreetmap');
      expect(config.fallbackStrategy).toBe('priority');
      expect(config.enableAutoFallback).toBe(true);
      expect(config.cacheResponses).toBe(true);
      expect(config.policyMode).toBe('strict');
      expect(config.searchBehaviorWhenNoAutocomplete).toBe('submit-only');
      expect(config.configVersion).toBeGreaterThanOrEqual(2);
    });

    it('should return a copy of configuration', () => {
      const config1 = mapConfig.getConfiguration();
      const config2 = mapConfig.getConfiguration();
      
      expect(config1).not.toBe(config2);
      expect(config1).toEqual(config2);
    });
  });

  describe('getDefaultProvider', () => {
    it('should return default provider', () => {
      expect(mapConfig.getDefaultProvider()).toBe('openstreetmap');
    });
  });

  describe('setDefaultProvider', () => {
    it('should set default provider', () => {
      mapConfig.setDefaultProvider('google');
      
      expect(mapConfig.getDefaultProvider()).toBe('google');
    });

    it('should persist to localStorage', () => {
      mapConfig.setDefaultProvider('mapbox');
      
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  describe('getEnabledProviders', () => {
    it('should return only enabled providers', () => {
      const enabled = mapConfig.getEnabledProviders();
      
      expect(enabled.length).toBe(1);
      expect(enabled[0].provider).toBe('openstreetmap');
    });

    it('should return providers sorted by priority', () => {
      mapConfig.enableProvider('google', true);
      mapConfig.enableProvider('mapbox', true);
      
      const enabled = mapConfig.getEnabledProviders();
      
      expect(enabled[0].priority).toBeLessThan(enabled[1].priority);
    });
  });

  describe('enableProvider', () => {
    it('should enable provider', () => {
      mapConfig.enableProvider('google', true);
      
      const settings = mapConfig.getProviderSettings('google');
      expect(settings?.enabled).toBe(true);
    });

    it('should disable provider', () => {
      mapConfig.enableProvider('openstreetmap', false);
      
      const settings = mapConfig.getProviderSettings('openstreetmap');
      expect(settings?.enabled).toBe(false);
    });
  });

  describe('setProviderPriority', () => {
    it('should set provider priority', () => {
      mapConfig.setProviderPriority('google', 0);
      
      const settings = mapConfig.getProviderSettings('google');
      expect(settings?.priority).toBe(0);
    });
  });

  describe('updateProviderConfig', () => {
    it('should update provider config', () => {
      mapConfig.updateProviderConfig('openstreetmap', { maxZoom: 20 });
      
      const settings = mapConfig.getProviderSettings('openstreetmap');
      expect(settings?.config.maxZoom).toBe(20);
    });

    it('should merge with existing config', () => {
      mapConfig.updateProviderConfig('openstreetmap', { maxZoom: 20 });
      
      const settings = mapConfig.getProviderSettings('openstreetmap');
      expect(settings?.config.attribution).toBeDefined();
    });
  });

  describe('API key management', () => {
    it('should add API key', () => {
      const id = mapConfig.addApiKey({
        provider: 'google',
        apiKey: 'test-key-123',
        label: 'Test Key',
      });
      
      expect(id).toBeDefined();
      expect(id).toContain('google');
      
      const keys = mapConfig.getApiKeys('google');
      expect(keys.length).toBe(1);
      expect(keys[0].apiKey).toBe('test-key-123');
    });

    it('should auto-activate first key for provider', () => {
      mapConfig.addApiKey({
        provider: 'mapbox',
        apiKey: 'first-key',
      });
      
      const activeKey = mapConfig.getActiveApiKey('mapbox');
      expect(activeKey?.isActive).toBe(true);
    });

    it('should update API key', () => {
      const id = mapConfig.addApiKey({
        provider: 'google',
        apiKey: 'old-key',
      });
      
      mapConfig.updateApiKey(id, { label: 'Updated Label' });
      
      const keys = mapConfig.getApiKeys('google');
      expect(keys[0].label).toBe('Updated Label');
    });

    it('should remove API key', () => {
      const id = mapConfig.addApiKey({
        provider: 'google',
        apiKey: 'to-remove',
      });
      
      mapConfig.removeApiKey(id);
      
      const keys = mapConfig.getApiKeys('google');
      expect(keys.length).toBe(0);
    });

    it('should set default API key', () => {
      mapConfig.addApiKey({ provider: 'google', apiKey: 'key1' });
      const id2 = mapConfig.addApiKey({ provider: 'google', apiKey: 'key2' });
      
      mapConfig.setDefaultApiKey(id2);
      
      const keys = mapConfig.getApiKeys('google');
      const defaultKey = keys.find(k => k.isDefault);
      expect(defaultKey?.id).toBe(id2);
    });

    it('should set active API key', () => {
      mapConfig.addApiKey({ provider: 'google', apiKey: 'key1' });
      const id2 = mapConfig.addApiKey({ provider: 'google', apiKey: 'key2' });
      
      mapConfig.setActiveApiKey('google', id2);
      
      const activeKey = mapConfig.getActiveApiKey('google');
      expect(activeKey?.id).toBe(id2);
    });
  });

  describe('quota management', () => {
    it('should update quota usage', () => {
      mapConfig.addApiKey({
        provider: 'google',
        apiKey: 'key',
        quota: { daily: 1000, used: 0 },
      });
      
      mapConfig.updateQuotaUsage('google', 50);
      
      const activeKey = mapConfig.getActiveApiKey('google');
      expect(activeKey?.quota?.used).toBe(50);
    });

    it('should reset quota usage', () => {
      mapConfig.addApiKey({
        provider: 'google',
        apiKey: 'key',
        quota: { daily: 1000, used: 500 },
      });
      
      mapConfig.resetQuotaUsage('google');
      
      const activeKey = mapConfig.getActiveApiKey('google');
      expect(activeKey?.quota?.used).toBe(0);
    });

    it('should check quota exceeded', () => {
      mapConfig.addApiKey({
        provider: 'google',
        apiKey: 'key',
        quota: { daily: 100, used: 100 },
      });
      
      const exceeded = mapConfig.checkQuotaExceeded('google');
      expect(exceeded).toBe(true);
    });

    it('should return false when no quota set', () => {
      mapConfig.addApiKey({
        provider: 'google',
        apiKey: 'key',
      });
      
      const exceeded = mapConfig.checkQuotaExceeded('google');
      expect(exceeded).toBe(false);
    });
  });

  describe('configuration settings', () => {
    it('should set fallback strategy', () => {
      mapConfig.setFallbackStrategy('fastest');
      
      const config = mapConfig.getConfiguration();
      expect(config.fallbackStrategy).toBe('fastest');
    });

    it('should set auto fallback', () => {
      mapConfig.setAutoFallback(false);
      
      const config = mapConfig.getConfiguration();
      expect(config.enableAutoFallback).toBe(false);
    });

    it('should set cache settings', () => {
      mapConfig.setCacheSettings(false, 7200000);
      
      const config = mapConfig.getConfiguration();
      expect(config.cacheResponses).toBe(false);
      expect(config.cacheDuration).toBe(7200000);
    });

    it('should set offline mode', () => {
      mapConfig.setOfflineMode(true, 'openstreetmap');
      
      const config = mapConfig.getConfiguration();
      expect(config.enableOfflineMode).toBe(true);
      expect(config.offlineFallbackProvider).toBe('openstreetmap');
    });

    it('should set health check interval', () => {
      mapConfig.setHealthCheckInterval(600000);
      
      const config = mapConfig.getConfiguration();
      expect(config.healthCheckInterval).toBe(600000);
    });

    it('should set policy mode', () => {
      mapConfig.setPolicyMode('balanced');

      const config = mapConfig.getConfiguration();
      expect(config.policyMode).toBe('balanced');
    });

    it('should set search behavior when no autocomplete', () => {
      mapConfig.setSearchBehaviorWhenNoAutocomplete('disabled');

      const config = mapConfig.getConfiguration();
      expect(config.searchBehaviorWhenNoAutocomplete).toBe('disabled');
    });
  });

  describe('configuration listeners', () => {
    it('should notify listeners on change', () => {
      const listener = jest.fn();
      mapConfig.addConfigurationListener(listener);
      
      mapConfig.setDefaultProvider('google');
      
      expect(listener).toHaveBeenCalled();
    });

    it('should unsubscribe listener', () => {
      const listener = jest.fn();
      const unsubscribe = mapConfig.addConfigurationListener(listener);
      
      unsubscribe();
      mapConfig.setDefaultProvider('mapbox');
      
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('import/export', () => {
    it('should export configuration', () => {
      mapConfig.addApiKey({
        provider: 'google',
        apiKey: 'secret-key',
      });
      
      const exported = mapConfig.exportConfiguration();
      const parsed = JSON.parse(exported);
      
      expect(parsed.defaultProvider).toBe('openstreetmap');
      expect(parsed.apiKeys[0].apiKey).toBe('***REDACTED***');
    });

    it('should import configuration preserving API keys', () => {
      mapConfig.addApiKey({
        provider: 'google',
        apiKey: 'my-key',
      });
      
      const importConfig = JSON.stringify({
        defaultProvider: 'mapbox',
        fallbackStrategy: 'random',
      });
      
      mapConfig.importConfiguration(importConfig, true);
      
      const config = mapConfig.getConfiguration();
      expect(config.defaultProvider).toBe('mapbox');
      expect(config.apiKeys.length).toBe(1);
    });

    it('should throw on invalid import', () => {
      expect(() => {
        mapConfig.importConfiguration('invalid json');
      }).toThrow('Invalid configuration format');
    });
  });

  describe('import validation', () => {
    it('should reject non-object config', () => {
      expect(() => mapConfig.importConfiguration('"just a string"')).toThrow('Configuration must be an object');
    });

    it('should reject invalid defaultProvider', () => {
      expect(() => mapConfig.importConfiguration(JSON.stringify({ defaultProvider: 'invalid' }))).toThrow('Invalid defaultProvider');
    });

    it('should reject invalid fallbackStrategy', () => {
      expect(() => mapConfig.importConfiguration(JSON.stringify({ fallbackStrategy: 'bad' }))).toThrow('Invalid fallbackStrategy');
    });

    it('should reject invalid policyMode', () => {
      expect(() => mapConfig.importConfiguration(JSON.stringify({ policyMode: 'bad' }))).toThrow('Invalid policyMode');
    });

    it('should reject invalid searchBehaviorWhenNoAutocomplete', () => {
      expect(() => mapConfig.importConfiguration(JSON.stringify({ searchBehaviorWhenNoAutocomplete: 'bad' })))
        .toThrow('Invalid searchBehaviorWhenNoAutocomplete');
    });

    it('should reject healthCheckInterval below minimum', () => {
      expect(() => mapConfig.importConfiguration(JSON.stringify({ healthCheckInterval: 1000 }))).toThrow('healthCheckInterval must be a number >= 5000ms');
    });

    it('should reject negative cacheDuration', () => {
      expect(() => mapConfig.importConfiguration(JSON.stringify({ cacheDuration: -1 }))).toThrow('cacheDuration must be a non-negative number');
    });

    it('should reject invalid provider type in providers array', () => {
      expect(() => mapConfig.importConfiguration(JSON.stringify({
        providers: [{ provider: 'invalid', priority: 1, enabled: true, config: {} }],
      }))).toThrow('Invalid provider type');
    });

    it('should reject non-array providers', () => {
      expect(() => mapConfig.importConfiguration(JSON.stringify({
        providers: 'not an array',
      }))).toThrow('providers must be an array');
    });

    it('should accept valid config with all valid fields', () => {
      expect(() => mapConfig.importConfiguration(JSON.stringify({
        defaultProvider: 'google',
        fallbackStrategy: 'round-robin',
        healthCheckInterval: 60000,
        cacheDuration: 7200000,
      }))).not.toThrow();
    });
  });

  describe('API key obfuscation', () => {
    it('should store API keys obfuscated in localStorage', () => {
      mapConfig.addApiKey({
        provider: 'google',
        apiKey: 'test-secret-key',
      });

      // Check that localStorage contains obfuscated key (base64)
      const lastSetCall = localStorageMock.setItem.mock.calls[localStorageMock.setItem.mock.calls.length - 1];
      const stored = JSON.parse(lastSetCall[1]);
      const storedKey = stored.apiKeys[0].apiKey;

      // Should NOT be stored in plain text
      expect(storedKey).not.toBe('test-secret-key');
      // Should be valid base64
      expect(atob(storedKey)).toBe('test-secret-key');
    });

    it('should deobfuscate API keys when reading config', () => {
      mapConfig.addApiKey({
        provider: 'mapbox',
        apiKey: 'my-mapbox-token',
      });

      // In-memory config should have plain text key
      const keys = mapConfig.getApiKeys('mapbox');
      expect(keys[0].apiKey).toBe('my-mapbox-token');
    });
  });

  describe('resetConfiguration', () => {
    it('should reset to defaults', () => {
      mapConfig.setDefaultProvider('google');
      mapConfig.setFallbackStrategy('fastest');
      
      mapConfig.resetConfiguration();
      
      const config = mapConfig.getConfiguration();
      expect(config.defaultProvider).toBe('openstreetmap');
      expect(config.fallbackStrategy).toBe('priority');
    });
  });
});
