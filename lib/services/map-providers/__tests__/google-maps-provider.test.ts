/**
 * Tests for google-maps-provider.ts
 */

import { GoogleMapsProvider } from '../google-maps-provider';

// Mock fetch
global.fetch = jest.fn();

describe('GoogleMapsProvider', () => {
  const mockApiKey = 'test-api-key';
  let provider: GoogleMapsProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new GoogleMapsProvider({ apiKey: mockApiKey });
  });

  describe('constructor', () => {
    it('should require API key', () => {
      expect(() => new GoogleMapsProvider({})).toThrow('Google Maps API key is required');
    });

    it('should create provider with valid API key', () => {
      const p = new GoogleMapsProvider({ apiKey: 'test-key' });
      expect(p).toBeDefined();
    });

    it('should set default config values', () => {
      const p = new GoogleMapsProvider({ apiKey: 'test-key' });
      expect(p.getMaxZoom()).toBe(21);
      expect(p.getMinZoom()).toBe(0);
    });

    it('should allow custom config values', () => {
      const p = new GoogleMapsProvider({
        apiKey: 'test-key',
        maxZoom: 18,
        minZoom: 2,
      });
      expect(p.getMaxZoom()).toBe(18);
      expect(p.getMinZoom()).toBe(2);
    });
  });

  describe('getName', () => {
    it('should return Google Maps', () => {
      expect(provider.getName()).toBe('Google Maps');
    });
  });

  describe('getProviderType', () => {
    it('should return google', () => {
      expect(provider.getProviderType()).toBe('google');
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
    it('should generate valid tile URL', () => {
      const url = provider.getTileUrl(1, 2, 3);
      
      expect(url).toContain('google.com');
      expect(url).toContain('x=1');
      expect(url).toContain('y=2');
      expect(url).toContain('z=3');
    });

    it('should use random server for load balancing', () => {
      const url = provider.getTileUrl(0, 0, 0);
      expect(url).toMatch(/mt[0-3]\.google\.com/);
    });
  });

  describe('getMaxZoom', () => {
    it('should return max zoom level', () => {
      expect(provider.getMaxZoom()).toBe(21);
    });
  });

  describe('getMinZoom', () => {
    it('should return min zoom level', () => {
      expect(provider.getMinZoom()).toBe(0);
    });
  });

  describe('geocode', () => {
    it('should call Google geocoding API', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          status: 'OK',
          results: [{
            formatted_address: '123 Main St, New York, NY',
            geometry: {
              location: { lat: 40.7128, lng: -74.0060 },
              location_type: 'ROOFTOP',
              viewport: {
                northeast: { lat: 40.72, lng: -74.00 },
                southwest: { lat: 40.70, lng: -74.01 },
              },
            },
            address_components: [
              { long_name: 'New York', short_name: 'NY', types: ['locality'] },
              { long_name: 'United States', short_name: 'US', types: ['country'] },
            ],
            types: ['street_address'],
          }],
        }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const results = await provider.geocode('123 Main St, New York');

      expect(global.fetch).toHaveBeenCalled();
      expect(results).toHaveLength(1);
      expect(results[0].coordinates.latitude).toBeCloseTo(40.7128, 4);
      expect(results[0].coordinates.longitude).toBeCloseTo(-74.0060, 4);
    });

    it('should handle API errors', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          status: 'ZERO_RESULTS',
          error_message: 'No results found',
        }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(provider.geocode('nonexistent place xyz'))
        .rejects.toThrow();
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(provider.geocode('New York'))
        .rejects.toThrow('Network error');
    });

    it('should respect limit option', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          status: 'OK',
          results: [
            { formatted_address: 'Result 1', geometry: { location: { lat: 1, lng: 1 }, location_type: 'APPROXIMATE', viewport: { northeast: { lat: 1, lng: 1 }, southwest: { lat: 0, lng: 0 } } }, address_components: [], types: [] },
            { formatted_address: 'Result 2', geometry: { location: { lat: 2, lng: 2 }, location_type: 'APPROXIMATE', viewport: { northeast: { lat: 2, lng: 2 }, southwest: { lat: 1, lng: 1 } } }, address_components: [], types: [] },
            { formatted_address: 'Result 3', geometry: { location: { lat: 3, lng: 3 }, location_type: 'APPROXIMATE', viewport: { northeast: { lat: 3, lng: 3 }, southwest: { lat: 2, lng: 2 } } }, address_components: [], types: [] },
          ],
        }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const results = await provider.geocode('Test', { limit: 2 });
      expect(results.length).toBeLessThanOrEqual(2);
    });
  });

  describe('reverseGeocode', () => {
    it('should call Google reverse geocoding API', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          status: 'OK',
          results: [{
            formatted_address: '123 Main St, New York, NY 10001',
            geometry: {
              location: { lat: 40.7128, lng: -74.0060 },
              location_type: 'ROOFTOP',
            },
            address_components: [
              { long_name: '123', short_name: '123', types: ['street_number'] },
              { long_name: 'Main St', short_name: 'Main St', types: ['route'] },
              { long_name: 'New York', short_name: 'NY', types: ['locality'] },
              { long_name: '10001', short_name: '10001', types: ['postal_code'] },
              { long_name: 'United States', short_name: 'US', types: ['country'] },
            ],
            types: ['street_address'],
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
          status: 'ZERO_RESULTS',
          results: [],
        }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(provider.reverseGeocode({
        latitude: 0,
        longitude: 0,
      })).rejects.toThrow();
    });
  });

  describe('getStaticMapUrl', () => {
    it('should generate valid static map URL', () => {
      const url = provider.getStaticMapUrl(
        { latitude: 40.7128, longitude: -74.0060 },
        12,
        { width: 400, height: 300 }
      );

      expect(url).toContain('staticmap');
      expect(url).toContain('40.7128');
      expect(url).toContain('-74.006');
      expect(url).toContain('zoom=12');
      expect(url).toContain('400x300');
      expect(url).toContain(mockApiKey);
    });

    it('should support different map types', () => {
      const url = provider.getStaticMapUrl(
        { latitude: 0, longitude: 0 },
        10,
        { width: 200, height: 200 },
        { maptype: 'satellite' }
      );

      expect(url).toContain('maptype=satellite');
    });

    it('should support markers', () => {
      const url = provider.getStaticMapUrl(
        { latitude: 0, longitude: 0 },
        10,
        { width: 200, height: 200 },
        {
          markers: [
            { coordinates: { latitude: 1, longitude: 1 }, color: 'red', label: 'A' },
          ],
        }
      );

      expect(url).toContain('markers=');
    });

    it('should support scale parameter', () => {
      const url = provider.getStaticMapUrl(
        { latitude: 0, longitude: 0 },
        10,
        { width: 200, height: 200 },
        { scale: 2 }
      );

      expect(url).toContain('scale=2');
    });
  });

  describe('getAvailableStyles', () => {
    it('should return available map styles', () => {
      const styles = provider.getAvailableStyles();

      expect(Array.isArray(styles)).toBe(true);
      expect(styles.length).toBeGreaterThan(0);
      expect(styles.some(s => s.name === 'Standard')).toBe(true);
      expect(styles.some(s => s.name === 'Satellite')).toBe(true);
    });

    it('should have id, name, and layerType for each style', () => {
      const styles = provider.getAvailableStyles();

      styles.forEach(style => {
        expect(style.id).toBeDefined();
        expect(style.name).toBeDefined();
        expect(style.layerType).toBeDefined();
      });
    });
  });

  describe('setTileLayer', () => {
    it('should update tile layer type', () => {
      expect(() => provider.setTileLayer('s')).not.toThrow();
    });
  });

  describe('autocomplete', () => {
    it('should call Places autocomplete API', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          status: 'OK',
          predictions: [
            { description: 'New York, NY, USA', place_id: 'place1', types: ['locality'] },
            { description: 'New York University', place_id: 'place2', types: ['establishment'] },
          ],
        }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const results = await provider.autocomplete('New York');

      expect(global.fetch).toHaveBeenCalled();
      expect(results.length).toBe(2);
      expect(results[0].description).toBe('New York, NY, USA');
      expect(results[0].place_id).toBe('place1');
    });

    it('should support location bias', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          status: 'OK',
          predictions: [],
        }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await provider.autocomplete('cafe', {
        location: { latitude: 40.7128, longitude: -74.0060 },
        radius: 5000,
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(fetchCall).toContain('location=');
      expect(fetchCall).toContain('radius=5000');
    });

    it('should handle API errors', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          status: 'REQUEST_DENIED',
        }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(provider.autocomplete('test'))
        .rejects.toThrow();
    });
  });
});
