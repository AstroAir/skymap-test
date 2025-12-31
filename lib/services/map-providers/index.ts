/**
 * Map providers export index
 * Centralized exports for all map provider implementations
 */

import { BaseMapProvider } from './base-map-provider';
import type { MapProviderConfig } from './base-map-provider';
import { OpenStreetMapProvider } from './openstreetmap-provider';
import { GoogleMapsProvider } from './google-maps-provider';
import { MapboxProvider } from './mapbox-provider';

export {
  BaseMapProvider,
  type Coordinates,
  type BoundingBox,
  type GeocodingResult,
  type ReverseGeocodingResult,
  type TileInfo,
  type MapProviderConfig,
  type ConnectivityStatus,
  type MapProviderCapabilities,
} from './base-map-provider';

export { OpenStreetMapProvider } from './openstreetmap-provider';
export { GoogleMapsProvider } from './google-maps-provider';
export { MapboxProvider } from './mapbox-provider';

// Provider factory function
export function createMapProvider(
  type: 'openstreetmap' | 'google' | 'mapbox',
  config: MapProviderConfig = {}
): BaseMapProvider {
  switch (type) {
    case 'openstreetmap':
      return new OpenStreetMapProvider(config);
    case 'google':
      return new GoogleMapsProvider(config);
    case 'mapbox':
      return new MapboxProvider(config);
    default:
      throw new Error(`Unsupported map provider type: ${type}`);
  }
}

// Default provider configurations
export const DEFAULT_PROVIDER_CONFIGS: Record<string, MapProviderConfig> = {
  openstreetmap: {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
    minZoom: 0,
    rateLimit: 1000,
  },
  google: {
    attribution: '© Google',
    maxZoom: 21,
    minZoom: 0,
    rateLimit: 50,
  },
  mapbox: {
    attribution: '© Mapbox © OpenStreetMap contributors',
    maxZoom: 22,
    minZoom: 0,
    rateLimit: 600,
  },
};
