/**
 * Satellite tracking types
 */

// ============================================================================
// TLE Types
// ============================================================================

export interface TLEData {
  name: string;
  line1: string;
  line2: string;
  catalogNumber: number;
  epochYear: number;
  epochDay: number;
  inclination: number;
  raan: number;
  eccentricity: number;
  argOfPerigee: number;
  meanAnomaly: number;
  meanMotion: number;
}

// ============================================================================
// Position Types
// ============================================================================

export interface SatellitePosition {
  latitude: number;
  longitude: number;
  altitude: number; // km
  velocity: number; // km/s
  azimuth: number;  // degrees
  elevation: number; // degrees
  range: number; // km from observer
  isSunlit: boolean;
  isVisible: boolean; // sunlit and above horizon in dark sky
}

export interface SatelliteGroundTrack {
  positions: Array<{
    time: Date;
    latitude: number;
    longitude: number;
    altitude: number;
  }>;
  period: number; // orbital period in minutes
}

// ============================================================================
// Pass Prediction Types
// ============================================================================

export interface SatellitePass {
  satellite: string;
  startTime: Date;
  endTime: Date;
  maxElevation: number;
  maxElevationTime: Date;
  startAzimuth: number;
  endAzimuth: number;
  isVisible: boolean; // sunlit during pass
  magnitude?: number; // estimated visual magnitude
}

export interface PassPredictionParams {
  latitude: number;
  longitude: number;
  elevation?: number;
  minElevation?: number; // minimum elevation to consider
  hours?: number; // how many hours ahead to predict
}

// ============================================================================
// Satellite Category Types
// ============================================================================

export type SatelliteCategory = 
  | 'iss'
  | 'starlink'
  | 'weather'
  | 'amateur'
  | 'gps'
  | 'visual'
  | 'space-stations'
  | 'other';

export interface SatelliteCatalogEntry {
  noradId: number;
  name: string;
  category: SatelliteCategory;
  intlDesignator?: string;
  launchDate?: Date;
  decayDate?: Date;
  isActive: boolean;
}

// ============================================================================
// Data Source Types
// ============================================================================

export interface TLEDataSource {
  id: string;
  name: string;
  url: string;
  category: SatelliteCategory[];
  updateInterval: number; // hours
  lastUpdate?: Date;
}

export interface TLEFetchResult {
  source: string;
  satellites: TLEData[];
  fetchedAt: Date;
  error?: string;
}
