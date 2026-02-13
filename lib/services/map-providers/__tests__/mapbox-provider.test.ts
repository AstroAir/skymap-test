/**
 * Tests for mapbox-provider.ts
 */

import { MapboxProvider } from '../mapbox-provider';

// Mock fetch
global.fetch = jest.fn();

describe('MapboxProvider', () => {
  const mockApiKey = 'test-mapbox-token';
  let provider: MapboxProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new MapboxProvider({ apiKey: mockApiKey });
  });

  describe('constructor', () => {
    it('should require API key', () => {
      expect(() => new MapboxProvider({})).toThrow('Mapbox API key is required');
    });

    it('should create provider with valid API key', () => {
      const p = new MapboxProvider({ apiKey: 'test-key' });
      expect(p).toBeDefined();
    });

    it('should set default config values', () => {
      const p = new MapboxProvider({ apiKey: 'test-key' });
      expect(p.getMaxZoom()).toBe(22);
      expect(p.getMinZoom()).toBe(0);
    });

    it('should allow custom config values', () => {
      const p = new MapboxProvider({
        apiKey: 'test-key',
        maxZoom: 18,
        minZoom: 2,
      });
      expect(p.getMaxZoom()).toBe(18);
      expect(p.getMinZoom()).toBe(2);
    });
  });

  describe('getName', () => {
    it('should return Mapbox', () => {
      expect(provider.getName()).toBe('Mapbox');
    });
  });

  describe('getProviderType', () => {
    it('should return mapbox', () => {
      expect(provider.getProviderType()).toBe('mapbox');
    });
  });

  describe('getCapabilities', () => {
    it('should return all capabilities', () => {
      const capabilities = provider.getCapabilities();
      
      expect(capabilities.geocoding).toBe(true);
      expect(capabilities.reverseGeocoding).toBe(true);
      expect(capabilities.tiles).toBe(true);
      expect(capabilities.routing).toBe(true);
      expect(capabilities.places).toBe(true);
      expect(capabilities.autocomplete).toBe(true);
    });
  });

  describe('getTileUrl', () => {
    it('should generate valid tile URL with access token', () => {
      const url = provider.getTileUrl(1, 2, 3);
      
      expect(url).toContain('mapbox.com');
      expect(url).toContain('access_token=');
      expect(url).toContain(mockApiKey);
    });

    it('should handle 512px tiles with coordinate adjustment', () => {
      const p = new MapboxProvider({ apiKey: 'test', tileSize: 512 });
      const url = p.getTileUrl(4, 4, 3);
      
      expect(url).toContain('@2x');
    });
  });

  describe('getMaxZoom', () => {
    it('should return max zoom level', () => {
      expect(provider.getMaxZoom()).toBe(22);
    });
  });

  describe('getMinZoom', () => {
    it('should return min zoom level', () => {
      expect(provider.getMinZoom()).toBe(0);
    });
  });

  describe('geocode', () => {
    it('should call Mapbox geocoding API', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          type: 'FeatureCollection',
          features: [{
            id: 'place.123',
            type: 'Feature',
            place_type: ['place'],
            relevance: 0.95,
            text: 'New York',
            place_name: 'New York, New York, United States',
            center: [-74.0060, 40.7128],
            bbox: [-74.1, 40.6, -73.9, 40.8],
            geometry: {
              type: 'Point',
              coordinates: [-74.0060, 40.7128],
            },
            context: [
              { id: 'region.123', text: 'New York' },
              { id: 'country.123', text: 'United States', short_code: 'us' },
            ],
          }],
        }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const results = await provider.geocode('New York');

      expect(global.fetch).toHaveBeenCalled();
      expect(results).toHaveLength(1);
      expect(results[0].coordinates.latitude).toBeCloseTo(40.7128, 4);
      expect(results[0].coordinates.longitude).toBeCloseTo(-74.0060, 4);
    });

    it('should handle empty results', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          type: 'FeatureCollection',
          features: [],
        }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const results = await provider.geocode('nonexistent place xyz');
      expect(results).toHaveLength(0);
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(provider.geocode('New York'))
        .rejects.toThrow('Network error');
    });

    it('should include bounds in request when provided', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          type: 'FeatureCollection',
          features: [],
        }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await provider.geocode('Test', {
        bounds: { north: 41, south: 40, east: -73, west: -75 },
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(fetchCall).toContain('bbox=');
    });
  });

  describe('geocode with language option', () => {
    it('should pass language parameter to API', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          type: 'FeatureCollection',
          features: [],
        }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await provider.geocode('Tokyo', { language: 'ja' });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(fetchCall).toContain('language=ja');
    });
  });

  describe('reverseGeocode', () => {
    it('should call Mapbox reverse geocoding API', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          type: 'FeatureCollection',
          features: [{
            id: 'address.123',
            type: 'Feature',
            place_type: ['address'],
            relevance: 1,
            text: '123 Main St',
            place_name: '123 Main St, New York, NY 10001',
            center: [-74.0060, 40.7128],
            geometry: {
              type: 'Point',
              coordinates: [-74.0060, 40.7128],
            },
            context: [
              { id: 'place.123', text: 'New York' },
              { id: 'region.123', text: 'New York' },
              { id: 'postcode.123', text: '10001' },
              { id: 'country.123', text: 'United States', short_code: 'us' },
            ],
          }],
        }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await provider.reverseGeocode({
        latitude: 40.7128,
        longitude: -74.0060,
      });

      expect(global.fetch).toHaveBeenCalled();
      expect(result.address).toBeDefined();
      expect(result.components).toBeDefined();
    });

    it('should validate coordinates', async () => {
      await expect(provider.reverseGeocode({
        latitude: 100, // Invalid latitude
        longitude: 0,
      })).rejects.toThrow();
    });

    it('should handle no results', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          type: 'FeatureCollection',
          features: [],
        }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(provider.reverseGeocode({
        latitude: 0,
        longitude: 0,
      })).rejects.toThrow('No results found');
    });
  });

  describe('getAvailableStyles', () => {
    it('should return available map styles', () => {
      const styles = provider.getAvailableStyles();

      expect(Array.isArray(styles)).toBe(true);
      expect(styles.length).toBeGreaterThan(0);
      expect(styles.some(s => s.name === 'Streets')).toBe(true);
      expect(styles.some(s => s.name === 'Satellite')).toBe(true);
    });

    it('should have id, name, and styleId for each style', () => {
      const styles = provider.getAvailableStyles();

      styles.forEach(style => {
        expect(style.id).toBeDefined();
        expect(style.name).toBeDefined();
        expect(style.styleId).toBeDefined();
      });
    });

    it('should include dark and light themes', () => {
      const styles = provider.getAvailableStyles();
      
      expect(styles.some(s => s.name === 'Dark')).toBe(true);
      expect(styles.some(s => s.name === 'Light')).toBe(true);
    });
  });

  describe('setMapStyle', () => {
    it('should update map style', () => {
      expect(() => provider.setMapStyle('dark-v10')).not.toThrow();
    });
  });

  describe('getStaticMapUrl', () => {
    it('should generate valid static map URL', () => {
      const url = provider.getStaticMapUrl(
        { latitude: 40.7128, longitude: -74.0060 },
        12,
        { width: 400, height: 300 }
      );

      expect(url).toContain('mapbox.com');
      expect(url).toContain('static');
      expect(url).toContain('-74.006');
      expect(url).toContain('40.7128');
      expect(url).toContain('12');
      expect(url).toContain('400x300');
      expect(url).toContain('access_token=');
    });

    it('should support retina option', () => {
      const url = provider.getStaticMapUrl(
        { latitude: 0, longitude: 0 },
        10,
        { width: 200, height: 200 },
        { retina: true }
      );

      expect(url).toContain('@2x');
    });

    it('should support custom style', () => {
      const url = provider.getStaticMapUrl(
        { latitude: 0, longitude: 0 },
        10,
        { width: 200, height: 200 },
        { style: 'satellite-v9' }
      );

      expect(url).toContain('satellite-v9');
    });

    it('should support pin overlays', () => {
      const url = provider.getStaticMapUrl(
        { latitude: 0, longitude: 0 },
        10,
        { width: 200, height: 200 },
        {
          overlays: [
            { type: 'pin', data: { latitude: 1, longitude: 1 } },
          ],
        }
      );

      expect(url).toContain('pin-s');
    });
  });

  describe('getDirections', () => {
    it('should call Mapbox Directions API', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          routes: [{
            geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] },
            legs: [],
            duration: 3600,
            distance: 10000,
          }],
        }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await provider.getDirections([
        { latitude: 40.7128, longitude: -74.0060 },
        { latitude: 40.7580, longitude: -73.9855 },
      ]);

      expect(global.fetch).toHaveBeenCalled();
      expect(result.routes).toBeDefined();
      expect(result.routes.length).toBeGreaterThan(0);
    });

    it('should require at least 2 waypoints', async () => {
      await expect(provider.getDirections([
        { latitude: 40.7128, longitude: -74.0060 },
      ])).rejects.toThrow('At least 2 waypoints are required');
    });

    it('should support different profiles', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          routes: [{ geometry: {}, legs: [], duration: 0, distance: 0 }],
        }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await provider.getDirections(
        [
          { latitude: 0, longitude: 0 },
          { latitude: 1, longitude: 1 },
        ],
        { profile: 'walking' }
      );

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(fetchCall).toContain('walking');
    });

    it('should handle API errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        statusText: 'Forbidden',
      });

      await expect(provider.getDirections([
        { latitude: 0, longitude: 0 },
        { latitude: 1, longitude: 1 },
      ])).rejects.toThrow();
    });
  });
});
