/**
 * Re-export layer for map types and constants
 * Canonical definitions live in @/types/starmap/map and @/lib/constants/map
 */

export type {
  Coordinates,
  LocationResult,
  MapProviderInfo,
  TileLayerConfig,
  MapProviderType,
  SearchHistory,
} from '@/types/starmap/map';

export { TILE_LAYER_CONFIGS, type TileLayerType } from '@/lib/constants/map';
