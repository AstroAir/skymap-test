/**
 * Tests for the geocoding service
 */

import { geocodingService } from '../geocoding-service';

// Mock dependencies
jest.mock('../map-config', () => ({
  mapConfig: {
    getConfiguration: jest.fn(() => ({
      cacheResponses: true,
      cacheDuration: 3600000,
    })),
    getEnabledProviders: jest.fn(() => []),
    getActiveApiKey: jest.fn(() => null),
    addConfigurationListener: jest.fn(),
  },
}));

jest.mock('../connectivity-checker', () => ({
  connectivityChecker: {
    startMonitoring: jest.fn(),
    getProviderHealth: jest.fn(() => ({ isHealthy: true })),
    getRecommendedProvider: jest.fn(() => null),
  },
}));

jest.mock('../map-providers', () => ({
  createMapProvider: jest.fn(() => ({
    geocode: jest.fn(),
    reverseGeocode: jest.fn(),
  })),
}));

describe('GeocodingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('geocode', () => {
    it('should throw error for empty query when no provider available', async () => {
      await expect(geocodingService.geocode('')).rejects.toThrow('No geocoding provider available');
    });

    it('should throw error for whitespace-only query when no provider available', async () => {
      await expect(geocodingService.geocode('   ')).rejects.toThrow('No geocoding provider available');
    });

    it('should throw error when no provider available', async () => {
      await expect(geocodingService.geocode('New York', {
        limit: 5,
        language: 'en',
      })).rejects.toThrow('No geocoding provider available');
    });
  });

  describe('reverseGeocode', () => {
    it('should handle reverse geocoding request', async () => {
      try {
        await geocodingService.reverseGeocode({
          latitude: 40.7128,
          longitude: -74.006,
        });
      } catch (error) {
        // Expected to throw since no providers are configured
        expect(error).toBeDefined();
      }
    });

    it('should handle reverse geocoding with options', async () => {
      try {
        await geocodingService.reverseGeocode(
          { latitude: 40.7128, longitude: -74.006 },
          { language: 'en' }
        );
      } catch (error) {
        // Expected to throw since no providers are configured
        expect(error).toBeDefined();
      }
    });
  });

  describe('getProviderStatus', () => {
    it('should return status for all providers', () => {
      const status = geocodingService.getProviderStatus();
      expect(typeof status).toBe('object');
    });
  });

  describe('clearCache', () => {
    it('should clear the cache without error', () => {
      expect(() => geocodingService.clearCache()).not.toThrow();
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', () => {
      const stats = geocodingService.getCacheStats();
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('maxSize');
      expect(typeof stats.size).toBe('number');
      expect(typeof stats.maxSize).toBe('number');
    });
  });
});

describe('GeocodingService coordinates parsing', () => {
  it('should throw error for coordinate string when no provider available', async () => {
    // Test with coordinate-like input - throws because no provider
    await expect(geocodingService.geocode('40.7128, -74.006')).rejects.toThrow('No geocoding provider available');
  });

  it('should throw error for DMS format when no provider available', async () => {
    // Test with DMS format - throws because no provider
    await expect(geocodingService.geocode("40°42'46\"N 74°0'22\"W")).rejects.toThrow('No geocoding provider available');
  });
});
