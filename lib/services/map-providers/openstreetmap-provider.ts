/**
 * OpenStreetMap provider implementation
 * Uses OSM tiles and Nominatim geocoding service (free, open source)
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

const logger = createLogger('openstreetmap-provider');

interface NominatimGeocodingResponse {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  class: string;
  type: string;
  place_rank: number;
  importance: number;
  addresstype: string;
  name: string;
  display_name: string;
  address?: {
    house_number?: string;
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
  boundingbox: [string, string, string, string]; // [south, north, west, east]
}

interface NominatimReverseResponse {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address: {
    house_number?: string;
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
  boundingbox: [string, string, string, string];
}

export class OpenStreetMapProvider extends BaseMapProvider {
  private readonly TILE_SERVERS = [
    'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
    'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
    'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
  ];

  private readonly NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

  constructor(config: MapProviderConfig = {}) {
    super({
      baseUrl: 'https://tile.openstreetmap.org',
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
      minZoom: 0,
      tileSize: 256,
      rateLimit: 1000, // OSM requires 1 request per second
      ...config,
    });
  }

  getName(): string {
    return 'OpenStreetMap';
  }

  getProviderType(): 'openstreetmap' {
    return 'openstreetmap';
  }

  getCapabilities(): MapProviderCapabilities {
    return {
      geocoding: true,
      reverseGeocoding: true,
      tiles: true,
      routing: false,
      places: false,
      autocomplete: false,
    };
  }

  async geocode(
    address: string,
    options: { limit?: number; bounds?: BoundingBox } = {}
  ): Promise<GeocodingResult[]> {
    await this.applyRateLimit();
    
    const params = new URLSearchParams({
      q: address,
      format: 'json',
      addressdetails: '1',
      limit: String(options.limit || 10),
      'accept-language': 'en',
    });

    if (options.bounds) {
      // Nominatim uses viewbox: left,top,right,bottom (west,north,east,south)
      params.set('viewbox', [
        options.bounds.west,
        options.bounds.north,
        options.bounds.east,
        options.bounds.south,
      ].join(','));
      params.set('bounded', '1');
    }

    const url = `${this.NOMINATIM_BASE_URL}/search?${params.toString()}`;
    
    try {
      const response = await this.fetchWithRetry(url);
      
      if (!response.ok) {
        throw new Error(`Nominatim geocoding failed: ${response.statusText}`);
      }

      const data: NominatimGeocodingResponse[] = await response.json();
      
      return data.map(item => this.transformGeocodingResult(item));
    } catch (error) {
      logger.error('OpenStreetMap geocoding error', error);
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
      lat: String(coordinates.latitude),
      lon: String(coordinates.longitude),
      format: 'json',
      addressdetails: '1',
      'accept-language': options.language || 'en',
    });

    const url = `${this.NOMINATIM_BASE_URL}/reverse?${params.toString()}`;

    try {
      const response = await this.fetchWithRetry(url);
      
      if (!response.ok) {
        throw new Error(`Nominatim reverse geocoding failed: ${response.statusText}`);
      }

      const data: NominatimReverseResponse = await response.json();
      
      return this.transformReverseGeocodingResult(data);
    } catch (error) {
      logger.error('OpenStreetMap reverse geocoding error', error);
      throw error;
    }
  }

  getTileUrl(x: number, y: number, z: number): string {
    // Use coordinate-based hash for consistent tile server selection
    // This provides load balancing while being deterministic and stateless
    const serverIndex = Math.abs((x + y * 2 + z * 3) % this.TILE_SERVERS.length);
    const server = this.TILE_SERVERS[serverIndex];

    return server
      .replace('{z}', String(z))
      .replace('{x}', String(x))
      .replace('{y}', String(y));
  }

  getMaxZoom(): number {
    return this.config.maxZoom || 19;
  }

  getMinZoom(): number {
    return this.config.minZoom || 0;
  }

  protected getHealthCheckUrl(): string {
    return `${this.TILE_SERVERS[0].replace('{z}', '0').replace('{x}', '0').replace('{y}', '0')}`;
  }

  private transformGeocodingResult(item: NominatimGeocodingResponse): GeocodingResult {
    const [south, north, west, east] = item.boundingbox.map(Number);
    
    // Map OSM types to our standardized types
    const typeMapping: Record<string, GeocodingResult['type']> = {
      'city': 'city',
      'town': 'city',
      'village': 'city',
      'hamlet': 'city',
      'municipality': 'administrative',
      'county': 'administrative',
      'state': 'administrative',
      'country': 'administrative',
      'house': 'building',
      'building': 'building',
      'residential': 'building',
      'commercial': 'building',
      'industrial': 'building',
      'retail': 'building',
      'office': 'building',
      'hotel': 'building',
      'school': 'building',
      'university': 'building',
      'church': 'building',
      'mosque': 'building',
      'synagogue': 'building',
      'temple': 'building',
      'restaurant': 'poi',
      'cafe': 'poi',
      'pub': 'poi',
      'bar': 'poi',
      'fast_food': 'poi',
      'bank': 'poi',
      'atm': 'poi',
      'pharmacy': 'poi',
      'hospital': 'poi',
      'clinic': 'poi',
      'dentist': 'poi',
      'veterinary': 'poi',
      'fuel': 'poi',
      'parking': 'poi',
      'bus_station': 'poi',
      'railway': 'poi',
      'airport': 'poi',
      'park': 'natural',
      'forest': 'natural',
      'water': 'natural',
      'river': 'natural',
      'lake': 'natural',
      'mountain': 'natural',
      'hill': 'natural',
      'beach': 'natural',
    };

    return {
      coordinates: {
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
      },
      address: this.formatAddress(item.address),
      displayName: item.display_name,
      confidence: this.calculateConfidence(item),
      boundingBox: { north, south, east, west },
      type: typeMapping[item.type] || 'other',
      countryCode: item.address?.country_code?.toUpperCase(),
      region: item.address?.state,
      locality: item.address?.city || item.address?.town || item.address?.village,
    };
  }

  private transformReverseGeocodingResult(item: NominatimReverseResponse): ReverseGeocodingResult {
    return {
      address: this.formatAddress(item.address),
      displayName: item.display_name,
      components: {
        houseNumber: item.address.house_number,
        street: item.address.road,
        locality: item.address.city || item.address.town || item.address.village,
        region: item.address.state,
        postalCode: item.address.postcode,
        country: item.address.country,
        countryCode: item.address.country_code?.toUpperCase(),
      },
      confidence: 0.9, // Nominatim doesn't provide confidence scores for reverse geocoding
      type: 'reverse',
    };
  }

  private formatAddress(address?: NominatimGeocodingResponse['address'] | NominatimReverseResponse['address']): string {
    if (!address) return '';

    const parts: string[] = [];
    
    if (address.house_number && address.road) {
      parts.push(`${address.house_number} ${address.road}`);
    } else if (address.road) {
      parts.push(address.road);
    }

    const locality = address.city || address.town || address.village;
    if (locality) {
      parts.push(locality);
    }

    if (address.state) {
      parts.push(address.state);
    }

    if (address.country) {
      parts.push(address.country);
    }

    return parts.join(', ');
  }

  private calculateConfidence(item: NominatimGeocodingResponse): number {
    // Calculate confidence based on importance and place rank
    // Nominatim importance is 0-1, place_rank is 1-30 (lower is more important)
    const importanceScore = item.importance || 0;
    const rankScore = Math.max(0, (30 - item.place_rank) / 30);
    
    return Math.min(1, (importanceScore + rankScore) / 2);
  }

  // Additional OSM-specific methods
  
  /**
   * Get different map styles available from OSM community
   */
  getAvailableStyles(): Array<{ id: string; name: string; url: string; attribution: string }> {
    return [
      {
        id: 'osm-standard',
        name: 'Standard',
        url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '© OpenStreetMap contributors',
      },
      {
        id: 'osm-cycle',
        name: 'Cycle Map',
        url: 'https://tile.thunderforest.com/cycle/{z}/{x}/{y}.png',
        attribution: '© OpenStreetMap contributors, © Thunderforest',
      },
      {
        id: 'osm-transport',
        name: 'Transport',
        url: 'https://tile.thunderforest.com/transport/{z}/{x}/{y}.png',
        attribution: '© OpenStreetMap contributors, © Thunderforest',
      },
      {
        id: 'osm-humanitarian',
        name: 'Humanitarian',
        url: 'https://tile-{s}.openstreetmap.fr/hot/{z}/{x}/{y}.png',
        attribution: '© OpenStreetMap contributors, © Humanitarian OSM Team',
      },
    ];
  }

  /**
   * Switch to a different tile style
   */
  setTileStyle(styleId: string): void {
    const styles = this.getAvailableStyles();
    const style = styles.find(s => s.id === styleId);
    
    if (style) {
      this.updateConfig({
        baseUrl: style.url,
        attribution: style.attribution,
      });
    }
  }
}
