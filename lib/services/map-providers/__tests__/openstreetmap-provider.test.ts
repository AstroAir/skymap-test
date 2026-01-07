/**
 * Tests for openstreetmap-provider.ts
 */

import { OpenStreetMapProvider } from '../openstreetmap-provider';

// Mock fetch
global.fetch = jest.fn();

describe('OpenStreetMapProvider', () => {
  let provider: OpenStreetMapProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new OpenStreetMapProvider();
  });

  describe('constructor', () => {
    it('should create provider without API key', () => {
      const p = new OpenStreetMapProvider();
      expect(p).toBeDefined();
    });

    it('should set default config values', () => {
      const p = new OpenStreetMapProvider();
      expect(p.getMaxZoom()).toBe(19);
      expect(p.getMinZoom()).toBe(0);
    });

    it('should allow custom config values', () => {
      const p = new OpenStreetMapProvider({
        maxZoom: 18,
        minZoom: 2,
      });
      expect(p.getMaxZoom()).toBe(18);
      expect(p.getMinZoom()).toBe(2);
    });
  });

  describe('getName', () => {
    it('should return OpenStreetMap', () => {
      expect(provider.getName()).toBe('OpenStreetMap');
    });
  });

  describe('getProviderType', () => {
    it('should return openstreetmap', () => {
      expect(provider.getProviderType()).toBe('openstreetmap');
    });
  });

  describe('getCapabilities', () => {
    it('should return correct capabilities', () => {
      const capabilities = provider.getCapabilities();
      
      expect(capabilities.geocoding).toBe(true);
      expect(capabilities.reverseGeocoding).toBe(true);
      expect(capabilities.tiles).toBe(true);
      expect(capabilities.routing).toBe(false);
      expect(capabilities.places).toBe(false);
      expect(capabilities.autocomplete).toBe(false);
    });
  });

  describe('getTileUrl', () => {
    it('should generate valid tile URL', () => {
      const url = provider.getTileUrl(1, 2, 3);
      
      expect(url).toContain('openstreetmap.org');
      expect(url).toContain('/3/');
      expect(url).toContain('/1/');
      expect(url).toContain('/2');
      expect(url).toContain('.png');
    });

    it('should use consistent server selection based on coordinates', () => {
      // Same coordinates should give same server
      const url1 = provider.getTileUrl(100, 200, 10);
      const url2 = provider.getTileUrl(100, 200, 10);
      
      expect(url1).toBe(url2);
    });

    it('should distribute across multiple servers', () => {
      const urls = new Set<string>();
      
      // Generate many different tile URLs
      for (let x = 0; x < 10; x++) {
        for (let y = 0; y < 10; y++) {
          const url = provider.getTileUrl(x, y, 5);
          const server = url.match(/https:\/\/([a-c]\.)?tile/)?.[0];
          if (server) urls.add(server);
        }
      }
      
      // Should use multiple servers for load balancing
      expect(urls.size).toBeGreaterThan(1);
    });
  });

  describe('getMaxZoom', () => {
    it('should return max zoom level', () => {
      expect(provider.getMaxZoom()).toBe(19);
    });
  });

  describe('getMinZoom', () => {
    it('should return min zoom level', () => {
      expect(provider.getMinZoom()).toBe(0);
    });
  });

  describe('geocode', () => {
    it('should call Nominatim geocoding API', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue([{
          place_id: 123,
          lat: '40.7128',
          lon: '-74.0060',
          display_name: 'New York, NY, United States',
          type: 'city',
          importance: 0.9,
          place_rank: 16,
          boundingbox: ['40.4774', '40.9176', '-74.2591', '-73.7004'],
          address: {
            city: 'New York',
            state: 'New York',
            country: 'United States',
            country_code: 'us',
          },
        }]),
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
        json: jest.fn().mockResolvedValue([]),
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

    it('should include viewbox when bounds provided', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue([]),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await provider.geocode('Test', {
        bounds: { north: 41, south: 40, east: -73, west: -75 },
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(fetchCall).toContain('viewbox=');
      expect(fetchCall).toContain('bounded=1');
    });

    it('should map OSM types correctly', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue([
          {
            place_id: 1,
            lat: '0',
            lon: '0',
            display_name: 'City',
            type: 'city',
            importance: 0.5,
            place_rank: 16,
            boundingbox: ['0', '1', '0', '1'],
          },
          {
            place_id: 2,
            lat: '0',
            lon: '0',
            display_name: 'Restaurant',
            type: 'restaurant',
            importance: 0.3,
            place_rank: 20,
            boundingbox: ['0', '1', '0', '1'],
          },
        ]),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const results = await provider.geocode('Test');

      expect(results[0].type).toBe('city');
      expect(results[1].type).toBe('poi');
    });
  });

  describe('reverseGeocode', () => {
    it('should call Nominatim reverse geocoding API', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          place_id: 123,
          lat: '40.7128',
          lon: '-74.0060',
          display_name: '123 Main St, New York, NY 10001, United States',
          address: {
            house_number: '123',
            road: 'Main St',
            city: 'New York',
            state: 'New York',
            postcode: '10001',
            country: 'United States',
            country_code: 'us',
          },
          boundingbox: ['40.7', '40.8', '-74.1', '-74.0'],
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
      expect(result.components.houseNumber).toBe('123');
      expect(result.components.street).toBe('Main St');
    });

    it('should validate coordinates', async () => {
      await expect(provider.reverseGeocode({
        latitude: 100, // Invalid latitude
        longitude: 0,
      })).rejects.toThrow();
    });

    it('should handle different locality types', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          place_id: 123,
          lat: '0',
          lon: '0',
          display_name: 'Village Name, Country',
          address: {
            village: 'Village Name',
            country: 'Country',
            country_code: 'xx',
          },
          boundingbox: ['0', '1', '0', '1'],
        }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await provider.reverseGeocode({
        latitude: 0,
        longitude: 0,
      });

      expect(result.components.locality).toBe('Village Name');
    });
  });

  describe('getAvailableStyles', () => {
    it('should return available map styles', () => {
      const styles = provider.getAvailableStyles();

      expect(Array.isArray(styles)).toBe(true);
      expect(styles.length).toBeGreaterThan(0);
      expect(styles.some(s => s.name === 'Standard')).toBe(true);
    });

    it('should have id, name, url, and attribution for each style', () => {
      const styles = provider.getAvailableStyles();

      styles.forEach(style => {
        expect(style.id).toBeDefined();
        expect(style.name).toBeDefined();
        expect(style.url).toBeDefined();
        expect(style.attribution).toBeDefined();
      });
    });

    it('should include alternative styles', () => {
      const styles = provider.getAvailableStyles();
      const names = styles.map(s => s.name);
      
      expect(names).toContain('Standard');
      // May include Cycle Map, Transport, Humanitarian
    });
  });

  describe('setTileStyle', () => {
    it('should update tile style', () => {
      expect(() => provider.setTileStyle('osm-standard')).not.toThrow();
    });

    it('should handle unknown style gracefully', () => {
      // Should not throw for unknown styles
      expect(() => provider.setTileStyle('unknown-style')).not.toThrow();
    });
  });

  describe('address formatting', () => {
    it('should format address with all components', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          place_id: 123,
          lat: '0',
          lon: '0',
          display_name: 'Full Display Name',
          address: {
            house_number: '123',
            road: 'Main Street',
            city: 'Test City',
            state: 'Test State',
            country: 'Test Country',
          },
          boundingbox: ['0', '1', '0', '1'],
        }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await provider.reverseGeocode({ latitude: 0, longitude: 0 });

      expect(result.address).toContain('123');
      expect(result.address).toContain('Main Street');
      expect(result.address).toContain('Test City');
    });

    it('should handle missing address components', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          place_id: 123,
          lat: '0',
          lon: '0',
          display_name: 'Country Only',
          address: {
            country: 'Test Country',
          },
          boundingbox: ['0', '1', '0', '1'],
        }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await provider.reverseGeocode({ latitude: 0, longitude: 0 });

      expect(result.address).toBeDefined();
    });
  });

  describe('confidence calculation', () => {
    it('should calculate confidence from importance and rank', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue([{
          place_id: 123,
          lat: '0',
          lon: '0',
          display_name: 'Test',
          type: 'city',
          importance: 0.8,
          place_rank: 10,
          boundingbox: ['0', '1', '0', '1'],
        }]),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const results = await provider.geocode('Test');

      expect(results[0].confidence).toBeDefined();
      expect(results[0].confidence).toBeGreaterThan(0);
      expect(results[0].confidence).toBeLessThanOrEqual(1);
    });

    it('should give higher confidence to more important places', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue([
          {
            place_id: 1,
            lat: '0',
            lon: '0',
            display_name: 'Important',
            type: 'city',
            importance: 0.9,
            place_rank: 5,
            boundingbox: ['0', '1', '0', '1'],
          },
          {
            place_id: 2,
            lat: '0',
            lon: '0',
            display_name: 'Less Important',
            type: 'city',
            importance: 0.3,
            place_rank: 25,
            boundingbox: ['0', '1', '0', '1'],
          },
        ]),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const results = await provider.geocode('Test');

      expect(results[0].confidence).toBeGreaterThan(results[1].confidence);
    });
  });
});
