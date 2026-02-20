/**
 * Astronomy-related type definitions
 */

// ============================================================================
// Coordinate Types
// ============================================================================

export interface EquatorialCoordinates {
  ra: number;   // Right Ascension in degrees
  dec: number;  // Declination in degrees
}

export interface HorizontalCoordinates {
  altitude: number;  // Altitude in degrees
  azimuth: number;   // Azimuth in degrees
}

export interface GeographicCoordinates {
  latitude: number;   // Latitude in degrees
  longitude: number;  // Longitude in degrees
  elevation?: number; // Elevation in meters
}

export type AstronomicalFrame = 'ICRF' | 'CIRS' | 'OBSERVED' | 'VIEW';
export type TimeScale = 'UTC' | 'UT1' | 'TT';
export type CoordinateQualityFlag = 'precise' | 'interpolated' | 'fallback';
export type EopFreshness = 'fresh' | 'stale' | 'fallback';

export interface CoordinateMetadata {
  frame: AstronomicalFrame;
  epochJd: number;
  timeScale: TimeScale;
  qualityFlag: CoordinateQualityFlag;
  dataFreshness: EopFreshness;
  source: 'calculation' | 'engine';
  generatedAt: string;
}

export interface CoordinateContext {
  latitude: number;
  longitude: number;
  date?: Date;
  jdUtc?: number;
  fromFrame?: AstronomicalFrame;
  toFrame?: AstronomicalFrame;
  precisionMode?: 'core_high_precision' | 'realtime_lightweight';
  deltaUt1Seconds?: number;
}

export interface CoordinateResult {
  raDeg: number;
  decDeg: number;
  altitudeDeg: number;
  azimuthDeg: number;
  hourAngleDeg: number;
  lstDeg: number;
  gstDeg: number;
  metadata: CoordinateMetadata;
}

export type RecommendationProfile = 'imaging' | 'visual' | 'hybrid';

export interface RecommendationBreakdownV2 {
  observability: number;
  moonImpact: number;
  equipmentMatch: number;
  targetSuitability: number;
  timingQuality: number;
  difficultyPenalty: number;
}

// ============================================================================
// Time Types
// ============================================================================

export interface RiseAndSet {
  rise: Date | null;
  set: Date | null;
}

// ============================================================================
// Twilight Types
// ============================================================================

export type TwilightPhase = 'day' | 'civil' | 'nautical' | 'astronomical' | 'night';

export interface TwilightTimes {
  sunset: Date | null;
  civilDusk: Date | null;
  nauticalDusk: Date | null;
  astronomicalDusk: Date | null;
  astronomicalDawn: Date | null;
  nauticalDawn: Date | null;
  civilDawn: Date | null;
  sunrise: Date | null;
  nightDuration: number;
  darknessDuration: number;
  isCurrentlyNight: boolean;
  currentTwilightPhase: TwilightPhase;
}

// ============================================================================
// Moon Types
// ============================================================================

export type MoonPhase = 
  | 'new'
  | 'waxingCrescent'
  | 'firstQuarter'
  | 'waxingGibbous'
  | 'full'
  | 'waningGibbous'
  | 'lastQuarter'
  | 'waningCrescent';

export interface MoonInfo {
  phase: number;
  phaseName: MoonPhase;
  illumination: number;
  position: EquatorialCoordinates;
}

// ============================================================================
// Target Visibility Types
// ============================================================================

export interface TargetVisibility {
  riseTime: Date | null;
  setTime: Date | null;
  transitTime: Date | null;
  transitAltitude: number;
  isCurrentlyVisible: boolean;
  isCircumpolar: boolean;
  neverRises: boolean;
  imagingWindowStart: Date | null;
  imagingWindowEnd: Date | null;
  imagingHours: number;
  darkImagingStart: Date | null;
  darkImagingEnd: Date | null;
  darkImagingHours: number;
}

// ============================================================================
// Imaging Feasibility Types
// ============================================================================

export type FeasibilityRecommendation = 'excellent' | 'good' | 'fair' | 'poor' | 'not_recommended';

export interface ImagingFeasibility {
  score: number;
  moonScore: number;
  altitudeScore: number;
  durationScore: number;
  twilightScore: number;
  recommendation: FeasibilityRecommendation;
  warnings: string[];
  tips: string[];
}

// ============================================================================
// Multi-Target Planning Types
// ============================================================================

export interface PlannedTarget {
  id: string;
  name: string;
  ra: number;
  dec: number;
  windowStart: Date | null;
  windowEnd: Date | null;
  duration: number;
  feasibility: ImagingFeasibility;
  conflicts: string[];
}

export interface MultiTargetPlan {
  targets: PlannedTarget[];
  totalImagingTime: number;
  nightCoverage: number;
  recommendations: string[];
}

// ============================================================================
// Altitude Data Types
// ============================================================================

export interface AltitudePoint {
  time: Date;
  hour: number;
  altitude: number;
  azimuth: number;
  isAboveHorizon: boolean;
}

export interface AltitudeData {
  points: AltitudePoint[];
  maxAltitude: number;
  maxAltitudeTime: Date;
  transitTime: Date | null;
  riseTime: Date | null;
  setTime: Date | null;
}

// ============================================================================
// Bortle Scale
// ============================================================================

export interface BortleScaleEntry {
  value: number;
  name: string;
  sqm: number;
  description: string;
}

// ============================================================================
// Exposure Calculation Types
// ============================================================================

export interface ExposureCalculationParams {
  bortle: number;
  focalLength: number;
  aperture: number;
  pixelSize?: number;
  tracking: 'none' | 'basic' | 'guided';
}

export interface ExposureCalculationResult {
  maxUntracked: number;
  recommendedSingle: number;
  minForSignal: number;
}

export interface IntegrationCalculationParams {
  bortle: number;
  targetType: 'galaxy' | 'nebula' | 'cluster' | 'planetary';
  isNarrowband?: boolean;
}

export interface IntegrationCalculationResult {
  minimum: number;
  recommended: number;
  ideal: number;
}

