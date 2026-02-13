/**
 * Map-related constants
 */

import type { TileLayerConfig, MapProviderType } from '@/types/starmap/map';

export const TILE_LAYER_CONFIGS: Record<string, TileLayerConfig> = {
  openstreetmap: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    subdomains: ['a', 'b', 'c'],
  },
  cartodb_light: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 20,
    subdomains: ['a', 'b', 'c', 'd'],
  },
  cartodb_dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 20,
    subdomains: ['a', 'b', 'c', 'd'],
  },
  esri_satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 18,
  },
  esri_topo: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community',
    maxZoom: 18,
  },
};

// Light pollution overlay tile layer (VIIRS Earth at Night)
export const LIGHT_POLLUTION_OVERLAY: TileLayerConfig = {
  url: 'https://map1.vis.earthdata.nasa.gov/wmts-webmerc/VIIRS_CityLights_2012/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpg',
  attribution: 'Imagery &copy; NASA Earth Observatory',
  maxZoom: 8,
};

export type TileLayerType = keyof typeof TILE_LAYER_CONFIGS;

export const PROVIDER_STATIC_INFO: Record<MapProviderType, { keyFormat: string; docsUrl: string }> = {
  openstreetmap: {
    keyFormat: 'No API key required',
    docsUrl: 'https://wiki.openstreetmap.org/wiki/API',
  },
  google: {
    keyFormat: 'AIza...',
    docsUrl: 'https://developers.google.com/maps/documentation/javascript/get-api-key',
  },
  mapbox: {
    keyFormat: 'pk.eyJ1...',
    docsUrl: 'https://docs.mapbox.com/help/getting-started/access-tokens/',
  },
};

export const PROVIDER_REQUIRES_KEY: Record<MapProviderType, boolean> = {
  openstreetmap: false,
  google: true,
  mapbox: true,
};

export const LOCATION_SEARCH_STORAGE_KEY = 'skymap-location-search-history';
export const LOCATION_SEARCH_MAX_HISTORY = 10;
export const LOCATION_SEARCH_HISTORY_EXPIRY_DAYS = 30;
