/**
 * Google Maps provider implementation
 * Uses Google Maps API for geocoding and tiles (requires API key)
 */

import {
  BaseMapProvider,
  type Coordinates,
  type BoundingBox,
  type GeocodingResult,
  type ReverseGeocodingResult,
  type MapProviderConfig,
  type MapProviderCapabilities,
} from './base-map-provider';
import { createLogger } from '@/lib/logger';

const logger = createLogger('google-maps-provider');

interface GoogleGeocodingResponse {
  results: Array<{
    address_components: Array<{
      long_name: string;
      short_name: string;
      types: string[];
    }>;
    formatted_address: string;
    geometry: {
      bounds?: {
        northeast: { lat: number; lng: number };
        southwest: { lat: number; lng: number };
      };
      location: { lat: number; lng: number };
      location_type: string;
      viewport: {
        northeast: { lat: number; lng: number };
        southwest: { lat: number; lng: number };
      };
    };
    place_id: string;
    plus_code?: {
      compound_code: string;
      global_code: string;
    };
    types: string[];
  }>;
  status: string;
  error_message?: string;
}

export class GoogleMapsProvider extends BaseMapProvider {
  private readonly GEOCODING_BASE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';
  private readonly STATIC_MAPS_BASE_URL = 'https://maps.googleapis.com/maps/api/staticmap';
  
  constructor(config: MapProviderConfig) {
    if (!config.apiKey) {
      throw new Error('Google Maps API key is required');
    }

    super({
      baseUrl: 'https://mt1.google.com/vt/lyrs=m',
      attribution: '© Google',
      maxZoom: 21,
      minZoom: 0,
      tileSize: 256,
      rateLimit: 50, // Google Maps has higher rate limits
      ...config,
    });
  }

  getName(): string {
    return 'Google Maps';
  }

  getProviderType(): 'google' {
    return 'google';
  }

  getCapabilities(): MapProviderCapabilities {
    return {
      geocoding: true,
      reverseGeocoding: true,
      tiles: true,
      routing: true,
      places: true,
      autocomplete: true,
    };
  }

  async geocode(
    address: string,
    options: { limit?: number; bounds?: BoundingBox } = {}
  ): Promise<GeocodingResult[]> {
    await this.applyRateLimit();
    
    const params = new URLSearchParams({
      address,
      key: this.config.apiKey!,
      language: 'en',
    });

    if (options.bounds) {
      // Google Maps bounds format: southwest|northeast
      params.set('bounds', [
        `${options.bounds.south},${options.bounds.west}`,
        `${options.bounds.north},${options.bounds.east}`,
      ].join('|'));
    }

    const url = `${this.GEOCODING_BASE_URL}?${params.toString()}`;
    
    try {
      const response = await this.fetchWithRetry(url);
      
      if (!response.ok) {
        throw new Error(`Google Maps geocoding failed: ${response.statusText}`);
      }

      const data: GoogleGeocodingResponse = await response.json();
      
      if (data.status !== 'OK') {
        throw new Error(`Google Maps API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
      }

      const results = data.results
        .slice(0, options.limit || 10)
        .map(item => this.transformGeocodingResult(item));
      
      return results;
    } catch (error) {
      logger.error('Google Maps geocoding error', error);
      throw error;
    }
  }

  async reverseGeocode(
    coordinates: Coordinates,
    options: { language?: string } = {}
  ): Promise<ReverseGeocodingResult> {
    this.validateCoordinates(coordinates);
    await this.applyRateLimit();

    const params = new URLSearchParams({
      latlng: `${coordinates.latitude},${coordinates.longitude}`,
      key: this.config.apiKey!,
      language: options.language || 'en',
    });

    const url = `${this.GEOCODING_BASE_URL}?${params.toString()}`;

    try {
      const response = await this.fetchWithRetry(url);
      
      if (!response.ok) {
        throw new Error(`Google Maps reverse geocoding failed: ${response.statusText}`);
      }

      const data: GoogleGeocodingResponse = await response.json();
      
      if (data.status !== 'OK' || data.results.length === 0) {
        throw new Error(`Google Maps API error: ${data.status} - ${data.error_message || 'No results found'}`);
      }

      return this.transformReverseGeocodingResult(data.results[0]);
    } catch (error) {
      logger.error('Google Maps reverse geocoding error', error);
      throw error;
    }
  }

  getTileUrl(x: number, y: number, z: number): string {
    // Google Maps tile URL format
    const server = Math.floor(Math.random() * 4); // mt0 - mt3
    return `https://mt${server}.google.com/vt/lyrs=m&x=${x}&y=${y}&z=${z}`;
  }

  getMaxZoom(): number {
    return this.config.maxZoom || 21;
  }

  getMinZoom(): number {
    return this.config.minZoom || 0;
  }

  protected getHealthCheckUrl(): string {
    return `${this.GEOCODING_BASE_URL}?address=New+York&key=${this.config.apiKey}`;
  }

  private transformGeocodingResult(item: GoogleGeocodingResponse['results'][0]): GeocodingResult {
    const { geometry, address_components, formatted_address, types } = item;
    
    // Extract address components
    const components = this.parseAddressComponents(address_components);
    
    // Calculate confidence based on location_type
    const confidence = this.calculateConfidence(geometry.location_type, types);
    
    // Determine bounding box
    const bounds = geometry.bounds || geometry.viewport;
    const boundingBox = {
      north: bounds.northeast.lat,
      south: bounds.southwest.lat,
      east: bounds.northeast.lng,
      west: bounds.southwest.lng,
    };

    return {
      coordinates: {
        latitude: geometry.location.lat,
        longitude: geometry.location.lng,
      },
      address: formatted_address,
      displayName: formatted_address,
      confidence,
      boundingBox,
      type: this.determineResultType(types),
      countryCode: components.country_code,
      region: components.state,
      locality: components.locality,
    };
  }

  private transformReverseGeocodingResult(item: GoogleGeocodingResponse['results'][0]): ReverseGeocodingResult {
    const components = this.parseAddressComponents(item.address_components);
    
    return {
      address: item.formatted_address,
      displayName: item.formatted_address,
      components: {
        houseNumber: components.street_number,
        street: components.route,
        locality: components.locality,
        region: components.state,
        postalCode: components.postal_code,
        country: components.country,
        countryCode: components.country_code,
      },
      confidence: this.calculateConfidence(item.geometry.location_type, item.types),
      type: 'reverse',
    };
  }

  private parseAddressComponents(components: GoogleGeocodingResponse['results'][0]['address_components']) {
    const parsed: Record<string, string> = {};
    
    for (const component of components) {
      const { long_name, short_name, types } = component;
      
      if (types.includes('street_number')) {
        parsed.street_number = long_name;
      } else if (types.includes('route')) {
        parsed.route = long_name;
      } else if (types.includes('locality')) {
        parsed.locality = long_name;
      } else if (types.includes('administrative_area_level_1')) {
        parsed.state = long_name;
      } else if (types.includes('country')) {
        parsed.country = long_name;
        parsed.country_code = short_name;
      } else if (types.includes('postal_code')) {
        parsed.postal_code = long_name;
      } else if (types.includes('sublocality') || types.includes('neighborhood')) {
        parsed.neighborhood = long_name;
      }
    }
    
    return parsed;
  }

  private calculateConfidence(locationType: string, types: string[]): number {
    // Higher confidence for more precise location types
    const locationTypeScores = {
      'ROOFTOP': 1.0,
      'RANGE_INTERPOLATED': 0.9,
      'GEOMETRIC_CENTER': 0.8,
      'APPROXIMATE': 0.6,
    };
    
    let baseScore = locationTypeScores[locationType as keyof typeof locationTypeScores] || 0.5;
    
    // Boost confidence for specific address types
    if (types.includes('street_address')) {
      baseScore = Math.min(1.0, baseScore + 0.1);
    } else if (types.includes('premise')) {
      baseScore = Math.min(1.0, baseScore + 0.05);
    }
    
    return baseScore;
  }

  private determineResultType(types: string[]): GeocodingResult['type'] {
    // Map Google place types to our standardized types
    if (types.includes('street_address') || types.includes('premise')) {
      return 'building';
    } else if (types.includes('locality') || types.includes('sublocality')) {
      return 'city';
    } else if (types.includes('route')) {
      return 'street';
    } else if (types.includes('point_of_interest') || types.includes('establishment')) {
      return 'poi';
    } else if (types.includes('administrative_area_level_1') || types.includes('administrative_area_level_2')) {
      return 'administrative';
    } else if (types.includes('natural_feature')) {
      return 'natural';
    }
    
    return 'other';
  }

  // Google Maps specific methods

  /**
   * Get static map image URL
   */
  getStaticMapUrl(
    center: Coordinates,
    zoom: number,
    size: { width: number; height: number },
    options: {
      maptype?: 'roadmap' | 'satellite' | 'terrain' | 'hybrid';
      markers?: Array<{ coordinates: Coordinates; color?: string; label?: string }>;
      format?: 'png' | 'jpg' | 'gif';
      scale?: 1 | 2;
    } = {}
  ): string {
    const params = new URLSearchParams({
      center: `${center.latitude},${center.longitude}`,
      zoom: String(zoom),
      size: `${size.width}x${size.height}`,
      maptype: options.maptype || 'roadmap',
      format: options.format || 'png',
      scale: String(options.scale || 1),
      key: this.config.apiKey!,
    });

    if (options.markers) {
      options.markers.forEach(marker => {
        const markerParam = [
          options.markers!.length > 1 ? `color:${marker.color || 'red'}` : '',
          marker.label ? `label:${marker.label}` : '',
          `${marker.coordinates.latitude},${marker.coordinates.longitude}`,
        ].filter(Boolean).join('|');
        
        params.append('markers', markerParam);
      });
    }

    return `${this.STATIC_MAPS_BASE_URL}?${params.toString()}`;
  }

  /**
   * Get available map styles
   */
  getAvailableStyles(): Array<{ id: string; name: string; layerType: string }> {
    return [
      { id: 'm', name: 'Standard', layerType: 'roadmap' },
      { id: 's', name: 'Satellite', layerType: 'satellite' },
      { id: 'p', name: 'Terrain', layerType: 'terrain' },
      { id: 'y', name: 'Hybrid', layerType: 'hybrid' },
      { id: 't', name: 'Transit', layerType: 'transit' },
    ];
  }

  /**
   * Switch tile layer type
   */
  setTileLayer(layerType: string): void {
    const baseUrl = `https://mt1.google.com/vt/lyrs=${layerType}`;
    this.updateConfig({ baseUrl });
  }

  /**
   * Places API autocomplete (requires Places API enabled)
   */
  async autocomplete(
    input: string,
    options: {
      location?: Coordinates;
      radius?: number;
      types?: string[];
      language?: string;
    } = {}
  ): Promise<Array<{ description: string; place_id: string; types: string[] }>> {
    await this.applyRateLimit();
    
    const params = new URLSearchParams({
      input,
      key: this.config.apiKey!,
      language: options.language || 'en',
    });

    if (options.location) {
      params.set('location', `${options.location.latitude},${options.location.longitude}`);
    }

    if (options.radius) {
      params.set('radius', String(options.radius));
    }

    if (options.types) {
      params.set('types', options.types.join('|'));
    }

    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`;

    try {
      const response = await this.fetchWithRetry(url);
      
      if (!response.ok) {
        throw new Error(`Google Places API failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.status !== 'OK') {
        throw new Error(`Google Places API error: ${data.status}`);
      }

      return data.predictions.map((prediction: { description: string; place_id: string; types: string[] }) => ({
        description: prediction.description,
        place_id: prediction.place_id,
        types: prediction.types,
      }));
    } catch (error) {
      logger.error('Google Places autocomplete error', error);
      throw error;
    }
  }
}
