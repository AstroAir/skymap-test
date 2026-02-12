/**
 * Shared type definitions for map components and services
 */

export type { Coordinates, GeocodingResult } from '@/lib/services/map-providers/base-map-provider';
import type { Coordinates } from '@/lib/services/map-providers/base-map-provider';
import type { GeocodingResult } from '@/lib/services/map-providers/base-map-provider';

export interface LocationResult {
  coordinates: Coordinates;
  address: string;
  displayName: string;
}

export interface MapProviderInfo {
  id: MapProviderType;
  name: string;
  isAvailable: boolean;
  requiresApiKey: boolean;
  status: 'healthy' | 'degraded' | 'unavailable';
  responseTime?: number;
  successRate?: number;
}

export interface TileLayerConfig {
  url: string;
  attribution: string;
  maxZoom: number;
  subdomains?: string[];
}

export type MapProviderType = 'openstreetmap' | 'google' | 'mapbox';

export interface SearchHistory {
  query: string;
  result: GeocodingResult;
  timestamp: number;
}
