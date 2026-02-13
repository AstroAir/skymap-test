/**
 * Mapbox provider implementation
 * Uses Mapbox API for geocoding and tiles (requires API key)
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

const logger = createLogger('mapbox-provider');

interface MapboxGeocodingResponse {
  type: 'FeatureCollection';
  query: string[];
  features: Array<{
    id: string;
    type: 'Feature';
    place_type: string[];
    relevance: number;
    properties: Record<string, unknown>;
    text: string;
    place_name: string;
    bbox?: [number, number, number, number]; // [west, south, east, north]
    center: [number, number]; // [longitude, latitude]
    geometry: {
      type: 'Point';
      coordinates: [number, number]; // [longitude, latitude]
    };
    context?: Array<{
      id: string;
      text: string;
      wikidata?: string;
      short_code?: string;
    }>;
  }>;
  attribution: string;
}

export class MapboxProvider extends BaseMapProvider {
  private readonly GEOCODING_BASE_URL = 'https://api.mapbox.com/geocoding/v5/mapbox.places';
  private readonly TILES_BASE_URL = 'https://api.mapbox.com/styles/v1/mapbox';
  
  constructor(config: MapProviderConfig) {
    if (!config.apiKey) {
      throw new Error('Mapbox API key is required');
    }

    super({
      baseUrl: 'https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles',
      attribution: '© Mapbox © OpenStreetMap contributors',
      maxZoom: 22,
      minZoom: 0,
      tileSize: 512,
      rateLimit: 600, // Mapbox has generous rate limits
      ...config,
    });
  }

  getName(): string {
    return 'Mapbox';
  }

  getProviderType(): 'mapbox' {
    return 'mapbox';
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
    options: { limit?: number; bounds?: BoundingBox; language?: string } = {}
  ): Promise<GeocodingResult[]> {
    await this.applyRateLimit();
    
    const encodedAddress = encodeURIComponent(address);
    const params = new URLSearchParams({
      access_token: this.config.apiKey!,
      limit: String(options.limit || 10),
      language: options.language || 'en',
    });

    if (options.bounds) {
      // Mapbox bounds format: minX,minY,maxX,maxY
      params.set('bbox', [
        options.bounds.west,
        options.bounds.south,
        options.bounds.east,
        options.bounds.north,
      ].join(','));
    }

    const url = `${this.GEOCODING_BASE_URL}/${encodedAddress}.json?${params.toString()}`;
    
    try {
      const response = await this.fetchWithRetry(url);
      
      if (!response.ok) {
        throw new Error(`Mapbox geocoding failed: ${response.statusText}`);
      }

      const data: MapboxGeocodingResponse = await response.json();
      
      return data.features.map(feature => this.transformGeocodingResult(feature));
    } catch (error) {
      logger.error('Mapbox geocoding error', error);
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
      access_token: this.config.apiKey!,
      language: options.language || 'en',
    });

    const url = `${this.GEOCODING_BASE_URL}/${coordinates.longitude},${coordinates.latitude}.json?${params.toString()}`;

    try {
      const response = await this.fetchWithRetry(url);
      
      if (!response.ok) {
        throw new Error(`Mapbox reverse geocoding failed: ${response.statusText}`);
      }

      const data: MapboxGeocodingResponse = await response.json();
      
      if (data.features.length === 0) {
        throw new Error('No results found for reverse geocoding');
      }

      return this.transformReverseGeocodingResult(data.features[0]);
    } catch (error) {
      logger.error('Mapbox reverse geocoding error', error);
      throw error;
    }
  }

  getTileUrl(x: number, y: number, z: number): string {
    // Mapbox uses 512x512 tiles, so we need to adjust coordinates
    const tileSize = this.config.tileSize || 512;
    if (tileSize === 512) {
      // For 512px tiles, we need to use z-1 and divide x,y by 2
      const adjustedZ = Math.max(0, z - 1);
      const adjustedX = Math.floor(x / 2);
      const adjustedY = Math.floor(y / 2);
      return `${this.config.baseUrl}/${adjustedZ}/${adjustedX}/${adjustedY}@2x?access_token=${this.config.apiKey}`;
    } else {
      // For 256px tiles
      return `${this.config.baseUrl}/${z}/${x}/${y}?access_token=${this.config.apiKey}`;
    }
  }

  getMaxZoom(): number {
    return this.config.maxZoom || 22;
  }

  getMinZoom(): number {
    return this.config.minZoom || 0;
  }

  protected getHealthCheckUrl(): string {
    return `https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/0/0/0?access_token=${this.config.apiKey}`;
  }

  private transformGeocodingResult(feature: MapboxGeocodingResponse['features'][0]): GeocodingResult {
    const [longitude, latitude] = feature.center;
    
    // Extract address components from context
    const components = this.parseContext(feature.context || []);
    
    // Determine bounding box
    let boundingBox: BoundingBox | undefined;
    if (feature.bbox) {
      const [west, south, east, north] = feature.bbox;
      boundingBox = { north, south, east, west };
    }

    return {
      coordinates: { latitude, longitude },
      address: this.formatAddress(feature, components),
      displayName: feature.place_name,
      confidence: feature.relevance,
      boundingBox,
      type: this.determineResultType(feature.place_type),
      countryCode: components.country_code,
      region: components.region,
      locality: components.locality,
    };
  }

  private transformReverseGeocodingResult(feature: MapboxGeocodingResponse['features'][0]): ReverseGeocodingResult {
    const components = this.parseContext(feature.context || []);
    
    return {
      address: feature.place_name,
      displayName: feature.place_name,
      components: {
        houseNumber: this.extractHouseNumber(feature.text),
        street: feature.place_type.includes('address') ? feature.text : undefined,
        locality: components.locality,
        region: components.region,
        postalCode: components.postcode,
        country: components.country,
        countryCode: components.country_code || undefined,
      },
      confidence: feature.relevance,
      type: 'reverse',
    };
  }

  private parseContext(context: MapboxGeocodingResponse['features'][0]['context']): Record<string, string> {
    const components: Record<string, string> = {};
    
    if (!context) return components;
    
    for (const item of context) {
      const id = item.id;
      
      if (id.startsWith('country.')) {
        components.country = item.text;
        components.country_code = item.short_code?.toUpperCase() ?? '';
      } else if (id.startsWith('region.')) {
        components.region = item.text;
      } else if (id.startsWith('place.')) {
        components.locality = item.text;
      } else if (id.startsWith('postcode.')) {
        components.postcode = item.text;
      } else if (id.startsWith('district.')) {
        components.district = item.text;
      } else if (id.startsWith('neighborhood.')) {
        components.neighborhood = item.text;
      }
    }
    
    return components;
  }

  private formatAddress(
    feature: MapboxGeocodingResponse['features'][0], 
    components: Record<string, string>
  ): string {
    const parts: string[] = [];
    
    // Start with the main text
    if (feature.text) {
      parts.push(feature.text);
    }
    
    // Add locality if different from main text
    if (components.locality && components.locality !== feature.text) {
      parts.push(components.locality);
    }
    
    // Add region
    if (components.region) {
      parts.push(components.region);
    }
    
    // Add country
    if (components.country) {
      parts.push(components.country);
    }
    
    return parts.join(', ');
  }

  private extractHouseNumber(text: string): string | undefined {
    // Try to extract house number from address text
    const match = text.match(/^(\d+[a-zA-Z]?\s*[-–—]?\s*\d*[a-zA-Z]?)/);
    return match ? match[1].trim() : undefined;
  }

  private determineResultType(placeTypes: string[]): GeocodingResult['type'] {
    // Map Mapbox place types to our standardized types
    if (placeTypes.includes('address') || placeTypes.includes('poi')) {
      return placeTypes.includes('address') ? 'building' : 'poi';
    } else if (placeTypes.includes('place') || placeTypes.includes('locality')) {
      return 'city';
    } else if (placeTypes.includes('neighborhood') || placeTypes.includes('district')) {
      return 'street';
    } else if (placeTypes.includes('region') || placeTypes.includes('country')) {
      return 'administrative';
    }
    
    return 'other';
  }

  // Mapbox specific methods

  /**
   * Get available map styles
   */
  getAvailableStyles(): Array<{ id: string; name: string; styleId: string }> {
    return [
      { id: 'streets', name: 'Streets', styleId: 'streets-v11' },
      { id: 'outdoors', name: 'Outdoors', styleId: 'outdoors-v11' },
      { id: 'light', name: 'Light', styleId: 'light-v10' },
      { id: 'dark', name: 'Dark', styleId: 'dark-v10' },
      { id: 'satellite', name: 'Satellite', styleId: 'satellite-v9' },
      { id: 'satellite-streets', name: 'Satellite Streets', styleId: 'satellite-streets-v11' },
      { id: 'navigation-day', name: 'Navigation Day', styleId: 'navigation-day-v1' },
      { id: 'navigation-night', name: 'Navigation Night', styleId: 'navigation-night-v1' },
    ];
  }

  /**
   * Switch to a different map style
   */
  setMapStyle(styleId: string): void {
    const baseUrl = `${this.TILES_BASE_URL}/${styleId}/tiles`;
    this.updateConfig({ baseUrl });
  }

  /**
   * Get static map image URL
   */
  getStaticMapUrl(
    center: Coordinates,
    zoom: number,
    size: { width: number; height: number },
    options: {
      style?: string;
      retina?: boolean;
      attribution?: boolean;
      logo?: boolean;
      overlays?: Array<{
        type: 'pin' | 'path' | 'geojson';
        data: { longitude: number; latitude: number };
      }>;
    } = {}
  ): string {
    const style = options.style || 'streets-v11';
    const retina = options.retina ? '@2x' : '';
    const attribution = options.attribution !== false;
    const logo = options.logo !== false;
    
    let url = `https://api.mapbox.com/styles/v1/mapbox/${style}/static/`;
    
    // Add overlays if provided
    if (options.overlays && options.overlays.length > 0) {
      const overlayStrings = options.overlays.map(overlay => {
        if (overlay.type === 'pin') {
          return `pin-s+ff0000(${overlay.data.longitude},${overlay.data.latitude})`;
        }
        // Add more overlay types as needed
        return '';
      }).filter(Boolean);
      
      if (overlayStrings.length > 0) {
        url += `${overlayStrings.join(',')}/`;
      }
    }
    
    url += `${center.longitude},${center.latitude},${zoom}/${size.width}x${size.height}${retina}`;
    
    const params = new URLSearchParams({
      access_token: this.config.apiKey!,
    });
    
    if (!attribution) {
      params.set('attribution', 'false');
    }
    
    if (!logo) {
      params.set('logo', 'false');
    }
    
    return `${url}?${params.toString()}`;
  }

  /**
   * Mapbox Directions API for routing
   */
  async getDirections(
    waypoints: Coordinates[],
    options: {
      profile?: 'driving' | 'walking' | 'cycling' | 'driving-traffic';
      geometries?: 'geojson' | 'polyline' | 'polyline6';
      overview?: 'full' | 'simplified' | 'false';
      steps?: boolean;
    } = {}
  ): Promise<{ routes: Array<{ geometry: GeoJSON.Geometry | string; legs: unknown[]; duration: number; distance: number }> }> {
    if (waypoints.length < 2) {
      throw new Error('At least 2 waypoints are required for directions');
    }

    await this.applyRateLimit();
    
    const profile = options.profile || 'driving';
    const coordinates = waypoints
      .map(wp => `${wp.longitude},${wp.latitude}`)
      .join(';');
    
    const params = new URLSearchParams({
      access_token: this.config.apiKey!,
      geometries: options.geometries || 'geojson',
      overview: options.overview || 'full',
      steps: String(options.steps !== false),
    });
    
    const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coordinates}?${params.toString()}`;
    
    try {
      const response = await this.fetchWithRetry(url);
      
      if (!response.ok) {
        throw new Error(`Mapbox Directions API failed: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      logger.error('Mapbox directions error', error);
      throw error;
    }
  }
}
