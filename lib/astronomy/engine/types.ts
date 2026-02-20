import type { TwilightTimes } from '@/lib/core/types/astronomy';

export type EngineBody =
  | 'Sun'
  | 'Moon'
  | 'Mercury'
  | 'Venus'
  | 'Mars'
  | 'Jupiter'
  | 'Saturn'
  | 'Uranus'
  | 'Neptune'
  | 'Pluto'
  | 'Custom';

export type RefractionMode = 'none' | 'normal';

export interface ObserverLocation {
  latitude: number;
  longitude: number;
  elevation?: number;
}

export interface EquatorialCoordinate {
  ra: number;
  dec: number;
}

export interface HorizontalCoordinate {
  altitude: number;
  azimuth: number;
}

export interface GalacticCoordinate {
  l: number;
  b: number;
}

export interface EclipticCoordinate {
  longitude: number;
  latitude: number;
}

export interface CoordinateComputationInput {
  coordinate: EquatorialCoordinate;
  observer: ObserverLocation;
  date: Date;
  refraction?: RefractionMode;
}

export interface CoordinateComputationResult {
  equatorial: EquatorialCoordinate;
  horizontal: HorizontalCoordinate;
  galactic: GalacticCoordinate;
  ecliptic: EclipticCoordinate;
  sidereal: {
    gmst: number;
    lst: number;
    hourAngle: number;
  };
  meta: {
    backend: 'tauri' | 'fallback';
    model: string;
  };
}

export interface EphemerisPoint {
  date: Date;
  ra: number;
  dec: number;
  altitude: number;
  azimuth: number;
  galacticL: number;
  galacticB: number;
  eclipticLon: number;
  eclipticLat: number;
  magnitude?: number;
  phaseFraction?: number;
  distanceAu?: number;
  elongation?: number;
}

export interface EphemerisRequest {
  body: EngineBody;
  observer: ObserverLocation;
  startDate: Date;
  stepHours: number;
  steps: number;
  refraction?: RefractionMode;
  customCoordinate?: EquatorialCoordinate;
}

export interface EphemerisResponse {
  body: EngineBody;
  points: EphemerisPoint[];
  meta: {
    backend: 'tauri' | 'fallback';
    model: string;
  };
}

export interface RiseTransitSetRequest {
  body: EngineBody;
  observer: ObserverLocation;
  date: Date;
  minAltitude?: number;
  customCoordinate?: EquatorialCoordinate;
}

export interface RiseTransitSetResponse {
  riseTime: Date | null;
  transitTime: Date | null;
  setTime: Date | null;
  transitAltitude: number;
  currentAltitude: number;
  currentAzimuth: number;
  isCircumpolar: boolean;
  neverRises: boolean;
  darkImagingStart: Date | null;
  darkImagingEnd: Date | null;
  darkImagingHours: number;
  meta: {
    backend: 'tauri' | 'fallback';
    model: string;
  };
}

export type PhenomenaType = 'conjunction' | 'opposition' | 'elongation' | 'moon_phase' | 'close_approach';
export type PhenomenaImportance = 'high' | 'medium' | 'low';

export interface PhenomenaEvent {
  date: Date;
  type: PhenomenaType;
  object1: string;
  object2?: string;
  separation?: number;
  details: string;
  importance: PhenomenaImportance;
  source: 'computed' | 'tauri-events';
}

export interface PhenomenaRequest {
  startDate: Date;
  endDate: Date;
  observer: ObserverLocation;
  includeMinor?: boolean;
}

export interface PhenomenaResponse {
  events: PhenomenaEvent[];
  meta: {
    backend: 'tauri' | 'fallback';
    model: string;
  };
}

export interface AlmanacRequest {
  date: Date;
  observer: ObserverLocation;
  refraction?: RefractionMode;
}

export interface AlmanacResponse {
  twilight: TwilightTimes;
  sun: {
    ra: number;
    dec: number;
    altitude: number;
    azimuth: number;
  };
  moon: {
    ra: number;
    dec: number;
    altitude: number;
    azimuth: number;
    phase: number;
    illumination: number;
    riseTime: Date | null;
    setTime: Date | null;
  };
  meta: {
    backend: 'tauri' | 'fallback';
    model: string;
  };
}

export interface AstronomyEngineBackend {
  computeCoordinates(input: CoordinateComputationInput): Promise<CoordinateComputationResult>;
  computeEphemeris(request: EphemerisRequest): Promise<EphemerisResponse>;
  computeRiseTransitSet(request: RiseTransitSetRequest): Promise<RiseTransitSetResponse>;
  searchPhenomena(request: PhenomenaRequest): Promise<PhenomenaResponse>;
  computeAlmanac(request: AlmanacRequest): Promise<AlmanacResponse>;
}
