/**
 * Object information types
 */

// ============================================================================
// Object Type Classifications
// ============================================================================

export type ObjectCategory = 
  | 'galaxy'
  | 'nebula'
  | 'cluster'
  | 'star'
  | 'planet'
  | 'moon'
  | 'comet'
  | 'asteroid'
  | 'artificial'
  | 'unknown';

export type GalaxyType = 
  | 'spiral'
  | 'elliptical'
  | 'irregular'
  | 'lenticular';

export type NebulaType = 
  | 'emission'
  | 'reflection'
  | 'dark'
  | 'planetary'
  | 'supernova-remnant';

export type ClusterType = 
  | 'open'
  | 'globular';

// ============================================================================
// Object Information
// ============================================================================

export interface ObjectBasicInfo {
  name: string;
  names: string[];
  category: ObjectCategory;
  constellation?: string;
  ra: number;
  dec: number;
}

export interface ObjectPhysicalData {
  magnitude?: number;
  surfaceBrightness?: number;
  size?: {
    width: number;  // arcminutes
    height: number; // arcminutes
  };
  distance?: {
    value: number;
    unit: 'ly' | 'pc' | 'kpc' | 'Mpc' | 'AU';
  };
  redshift?: number;
  spectralType?: string;
}

export interface ObjectDescription {
  summary?: string;
  description?: string;
  discoverer?: string;
  discoveryYear?: number;
  etymology?: string;
}

export interface ObjectImageInfo {
  thumbnailUrl?: string;
  imageUrl?: string;
  dssUrl?: string;
  wikiImageUrl?: string;
  imageCredit?: string;
}

export interface CelestialObjectInfo extends 
  ObjectBasicInfo, 
  ObjectPhysicalData, 
  ObjectDescription, 
  ObjectImageInfo {
  source: string[];
  lastUpdated: Date;
}

// ============================================================================
// Data Source Types
// ============================================================================

export type DataSourceId = 
  | 'simbad'
  | 'wikipedia'
  | 'nasa-apod'
  | 'dss'
  | 'local'
  | 'stellarium';

export interface DataSource {
  id: DataSourceId;
  name: string;
  url?: string;
  enabled: boolean;
  priority: number;
  timeout: number;
  healthy: boolean;
  lastCheck?: Date;
}

// ============================================================================
// Fetch Result Types
// ============================================================================

export interface InfoFetchResult {
  info: Partial<CelestialObjectInfo>;
  source: DataSourceId;
  success: boolean;
  error?: string;
  fetchTime: number;
}

export interface AggregatedInfo {
  object: CelestialObjectInfo;
  sources: DataSourceId[];
  errors: string[];
  totalFetchTime: number;
}
