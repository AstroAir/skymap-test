/**
 * Tests for connectivity-checker.ts
 */

import { connectivityChecker } from '../connectivity-checker';

describe('ConnectivityChecker', () => {
  beforeEach(() => {
    connectivityChecker.reset();
  });

  describe('getProviderHealth', () => {
    it('should return undefined for unknown provider', () => {
      const health = connectivityChecker.getProviderHealth('openstreetmap');
      expect(health).toBeUndefined();
    });
  });

  describe('getAllProviderHealth', () => {
    it('should return empty array initially', () => {
      const health = connectivityChecker.getAllProviderHealth();
      expect(health).toEqual([]);
    });
  });

  describe('getTestHistory', () => {
    it('should return empty array for unknown provider', () => {
      const history = connectivityChecker.getTestHistory('openstreetmap');
      expect(history).toEqual([]);
    });
  });

  describe('getNetworkQuality', () => {
    it('should return default metrics with no history', () => {
      const metrics = connectivityChecker.getNetworkQuality();
      expect(metrics.averageResponseTime).toBe(0);
      expect(metrics.successRate).toBe(0);
      expect(typeof metrics.isOnline).toBe('boolean');
    });
  });

  describe('getRecommendedProvider', () => {
    it('should return a provider type or null', () => {
      const provider = connectivityChecker.getRecommendedProvider();
      expect(['openstreetmap', 'google', 'mapbox', 'other', null]).toContain(provider);
    });
  });

  describe('addHealthListener', () => {
    it('should return unsubscribe function', () => {
      const listener = jest.fn();
      const unsubscribe = connectivityChecker.addHealthListener(listener);
      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });
  });

  describe('reset', () => {
    it('should clear all data', () => {
      connectivityChecker.reset();
      const health = connectivityChecker.getAllProviderHealth();
      expect(health).toEqual([]);
    });
  });

  describe('getStatistics', () => {
    it('should return empty statistics initially', () => {
      const stats = connectivityChecker.getStatistics();
      expect(stats.totalTests).toBe(0);
      expect(stats.successRate).toBe(0);
      expect(stats.averageResponseTime).toBe(0);
      expect(stats.providerStats).toEqual([]);
    });
  });

  describe('quickConnectivityTest', () => {
    it('should return boolean result', async () => {
      // Mock fetch to avoid actual network calls
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValue({ ok: true });
      
      const result = await connectivityChecker.quickConnectivityTest();
      expect(typeof result).toBe('boolean');
      
      global.fetch = originalFetch;
    });

    it('should return false when all tests fail', async () => {
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
      
      const result = await connectivityChecker.quickConnectivityTest();
      expect(result).toBe(false);
      
      global.fetch = originalFetch;
    });
  });

  describe('stopMonitoring', () => {
    it('should not throw for unknown provider', () => {
      expect(() => {
        connectivityChecker.stopMonitoring('openstreetmap');
      }).not.toThrow();
    });
  });

  describe('checkAllProvidersHealth', () => {
    it('should return empty array', async () => {
      const results = await connectivityChecker.checkAllProvidersHealth();
      expect(results).toEqual([]);
    });
  });

  describe('round-robin counter', () => {
    it('should return consistent provider type across calls with no providers', () => {
      const result1 = connectivityChecker.getRecommendedProvider();
      const result2 = connectivityChecker.getRecommendedProvider();
      // With no providers registered, both should return the same (null or fallback)
      expect(result1).toEqual(result2);
    });
  });

  describe('reset cleanup', () => {
    it('should not throw when called multiple times', () => {
      expect(() => {
        connectivityChecker.reset();
        connectivityChecker.reset();
        connectivityChecker.reset();
      }).not.toThrow();
    });

    it('should clear all health data after reset', () => {
      connectivityChecker.reset();
      expect(connectivityChecker.getAllProviderHealth()).toEqual([]);
      expect(connectivityChecker.getStatistics().totalTests).toBe(0);
    });
  });
});
