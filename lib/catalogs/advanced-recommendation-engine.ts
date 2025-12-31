/**
 * Advanced Recommendation Engine for Deep Sky Objects
 * 
 * Implements industry-standard observation planning algorithms:
 * - Equipment-aware scoring (focal length, aperture, sensor size)
 * - Light pollution adaptation (Bortle scale consideration)
 * - Enhanced seasonal optimization
 * - Imaging feasibility assessment
 * - Meridian flip consideration for equatorial mounts
 * - Multi-session planning support
 * - Weather-aware hooks
 */

import type { DeepSkyObject, NighttimeData, ObjectAltitudeData } from './types';
import {
  calculateAltitudeData,
  enrichDeepSkyObject,
} from './deep-sky-object';
import { calculateNighttimeData } from './nighttime-calculator';

// ============================================================================
// Types
// ============================================================================

export interface EquipmentProfile {
  telescopeFocalLength: number;    // mm
  telescopeAperture: number;       // mm
  cameraSensorWidth: number;       // mm
  cameraSensorHeight: number;      // mm
  cameraPixelSize: number;         // μm
  cameraResolutionX: number;       // pixels
  cameraResolutionY: number;       // pixels
  mountType: 'equatorial' | 'altaz' | 'star_tracker';
  hasAutoGuider: boolean;
  filterWheelType?: 'mono' | 'osc' | 'narrowband' | 'none';
}

export interface ObservingSite {
  latitude: number;
  longitude: number;
  elevation: number;               // meters
  bortleClass: number;             // 1-9
  horizonObstructions?: HorizonObstruction[];
  typicalSeeing?: number;          // arcseconds
  name?: string;
}

export interface HorizonObstruction {
  azimuthStart: number;            // degrees
  azimuthEnd: number;              // degrees
  altitudeLimit: number;           // degrees
}

export interface WeatherConditions {
  cloudCover: number;              // 0-100%
  humidity: number;                // 0-100%
  windSpeed: number;               // km/h
  temperature: number;             // Celsius
  dewPoint: number;                // Celsius
  transparency: 'excellent' | 'good' | 'average' | 'poor';
  seeing: 'excellent' | 'good' | 'average' | 'poor';
}

export interface RecommendationConfig {
  minimumAltitude: number;         // degrees
  minimumMoonDistance: number;     // degrees
  minimumImagingHours: number;     // hours
  preferMeridianTransit: boolean;
  avoidMeridianFlip: boolean;
  preferCircumpolar: boolean;
  maxTargetsPerSession: number;
  difficultyPreference: 'beginner' | 'intermediate' | 'advanced' | 'any';
  objectTypePreferences: string[];
}

export interface ScoredRecommendation {
  object: DeepSkyObject;
  totalScore: number;
  scoreBreakdown: ScoreBreakdown;
  imagingWindow: ImagingWindow;
  feasibility: ImagingFeasibility;
  reasons: string[];
  warnings: string[];
  tips: string[];
}

export interface ScoreBreakdown {
  altitudeScore: number;
  moonScore: number;
  seasonalScore: number;
  sizeScore: number;
  brightnessScore: number;
  durationScore: number;
  equipmentScore: number;
  lightPollutionScore: number;
  difficultyScore: number;
  transitScore: number;
}

export interface ImagingWindow {
  start: Date;
  end: Date;
  peakAltitudeTime: Date;
  peakAltitude: number;
  totalHours: number;
  darkHours: number;
  meridianCrossing: Date | null;
  requiresMeridianFlip: boolean;
}

export interface ImagingFeasibility {
  overallRating: 'excellent' | 'good' | 'fair' | 'marginal' | 'poor';
  fovFit: 'perfect' | 'good' | 'tight' | 'too_large' | 'too_small';
  resolutionMatch: 'optimal' | 'acceptable' | 'oversampled' | 'undersampled';
  exposureEstimate: number;        // seconds per sub
  totalExposureNeeded: number;     // minutes
  snrEstimate: number;             // relative 0-100
}

// ============================================================================
// Extended Seasonal Data
// ============================================================================

interface ExtendedSeasonalInfo {
  bestMonths: number[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  recommendedExposure: number;     // minutes total
  narrowbandSuitable: boolean;
  requiredAperture: number;        // minimum mm
  idealFocalLength: { min: number; max: number };
  notes?: string;
}

const EXTENDED_SEASONAL_DATA: Record<string, ExtendedSeasonalInfo> = {
  // === GALAXIES ===
  'M31': {
    bestMonths: [9, 10, 11, 12, 1],
    difficulty: 'beginner',
    recommendedExposure: 120,
    narrowbandSuitable: false,
    requiredAperture: 50,
    idealFocalLength: { min: 200, max: 600 },
    notes: 'Very large, may need mosaic for full coverage'
  },
  'M33': {
    bestMonths: [9, 10, 11, 12, 1],
    difficulty: 'intermediate',
    recommendedExposure: 300,
    narrowbandSuitable: true,
    requiredAperture: 80,
    idealFocalLength: { min: 300, max: 800 },
    notes: 'Low surface brightness, needs dark skies'
  },
  'M51': {
    bestMonths: [3, 4, 5, 6],
    difficulty: 'beginner',
    recommendedExposure: 180,
    narrowbandSuitable: false,
    requiredAperture: 100,
    idealFocalLength: { min: 800, max: 2000 },
    notes: 'Classic face-on spiral with companion'
  },
  'M81': {
    bestMonths: [2, 3, 4, 5],
    difficulty: 'beginner',
    recommendedExposure: 120,
    narrowbandSuitable: false,
    requiredAperture: 80,
    idealFocalLength: { min: 600, max: 1500 },
    notes: 'Pair with M82 for wider field'
  },
  'M82': {
    bestMonths: [2, 3, 4, 5],
    difficulty: 'beginner',
    recommendedExposure: 120,
    narrowbandSuitable: true,
    requiredAperture: 80,
    idealFocalLength: { min: 800, max: 2000 },
    notes: 'H-alpha regions visible'
  },
  'M101': {
    bestMonths: [3, 4, 5, 6],
    difficulty: 'intermediate',
    recommendedExposure: 300,
    narrowbandSuitable: true,
    requiredAperture: 100,
    idealFocalLength: { min: 500, max: 1200 },
    notes: 'Large and faint, needs long exposure'
  },
  'M104': {
    bestMonths: [3, 4, 5, 6],
    difficulty: 'beginner',
    recommendedExposure: 120,
    narrowbandSuitable: false,
    requiredAperture: 100,
    idealFocalLength: { min: 1000, max: 2500 },
    notes: 'Iconic dust lane'
  },
  'M63': {
    bestMonths: [3, 4, 5, 6],
    difficulty: 'intermediate',
    recommendedExposure: 180,
    narrowbandSuitable: false,
    requiredAperture: 100,
    idealFocalLength: { min: 800, max: 2000 },
  },
  'M64': {
    bestMonths: [4, 5, 6],
    difficulty: 'intermediate',
    recommendedExposure: 180,
    narrowbandSuitable: false,
    requiredAperture: 100,
    idealFocalLength: { min: 1000, max: 2500 },
    notes: 'Famous "Black Eye" feature'
  },
  'M106': {
    bestMonths: [3, 4, 5, 6],
    difficulty: 'intermediate',
    recommendedExposure: 240,
    narrowbandSuitable: true,
    requiredAperture: 100,
    idealFocalLength: { min: 600, max: 1500 },
  },
  'NGC4565': {
    bestMonths: [4, 5, 6],
    difficulty: 'intermediate',
    recommendedExposure: 240,
    narrowbandSuitable: false,
    requiredAperture: 100,
    idealFocalLength: { min: 800, max: 2000 },
    notes: 'Edge-on "Needle Galaxy"'
  },
  
  // === NEBULAE ===
  'M42': {
    bestMonths: [11, 12, 1, 2, 3],
    difficulty: 'beginner',
    recommendedExposure: 60,
    narrowbandSuitable: true,
    requiredAperture: 50,
    idealFocalLength: { min: 200, max: 800 },
    notes: 'HDR recommended for core'
  },
  'M1': {
    bestMonths: [11, 12, 1, 2],
    difficulty: 'beginner',
    recommendedExposure: 180,
    narrowbandSuitable: true,
    requiredAperture: 100,
    idealFocalLength: { min: 800, max: 2000 },
  },
  'M8': {
    bestMonths: [6, 7, 8],
    difficulty: 'beginner',
    recommendedExposure: 120,
    narrowbandSuitable: true,
    requiredAperture: 50,
    idealFocalLength: { min: 200, max: 600 },
  },
  'M16': {
    bestMonths: [6, 7, 8],
    difficulty: 'intermediate',
    recommendedExposure: 180,
    narrowbandSuitable: true,
    requiredAperture: 80,
    idealFocalLength: { min: 500, max: 1500 },
    notes: 'Famous "Pillars of Creation"'
  },
  'M17': {
    bestMonths: [6, 7, 8],
    difficulty: 'beginner',
    recommendedExposure: 120,
    narrowbandSuitable: true,
    requiredAperture: 80,
    idealFocalLength: { min: 400, max: 1000 },
  },
  'M20': {
    bestMonths: [6, 7, 8],
    difficulty: 'intermediate',
    recommendedExposure: 150,
    narrowbandSuitable: true,
    requiredAperture: 80,
    idealFocalLength: { min: 400, max: 1000 },
  },
  'M27': {
    bestMonths: [7, 8, 9, 10],
    difficulty: 'beginner',
    recommendedExposure: 90,
    narrowbandSuitable: true,
    requiredAperture: 80,
    idealFocalLength: { min: 600, max: 1500 },
  },
  'M57': {
    bestMonths: [6, 7, 8, 9],
    difficulty: 'beginner',
    recommendedExposure: 120,
    narrowbandSuitable: true,
    requiredAperture: 100,
    idealFocalLength: { min: 1500, max: 3000 },
    notes: 'Small, needs long focal length'
  },
  'M97': {
    bestMonths: [2, 3, 4, 5],
    difficulty: 'intermediate',
    recommendedExposure: 240,
    narrowbandSuitable: true,
    requiredAperture: 100,
    idealFocalLength: { min: 1000, max: 2500 },
  },
  'NGC7000': {
    bestMonths: [7, 8, 9, 10],
    difficulty: 'intermediate',
    recommendedExposure: 240,
    narrowbandSuitable: true,
    requiredAperture: 50,
    idealFocalLength: { min: 100, max: 400 },
    notes: 'Very large, ideal for wide field'
  },
  'NGC6992': {
    bestMonths: [7, 8, 9, 10],
    difficulty: 'intermediate',
    recommendedExposure: 300,
    narrowbandSuitable: true,
    requiredAperture: 80,
    idealFocalLength: { min: 300, max: 800 },
  },
  'NGC6960': {
    bestMonths: [7, 8, 9, 10],
    difficulty: 'intermediate',
    recommendedExposure: 300,
    narrowbandSuitable: true,
    requiredAperture: 80,
    idealFocalLength: { min: 300, max: 800 },
  },
  'NGC2237': {
    bestMonths: [12, 1, 2, 3],
    difficulty: 'intermediate',
    recommendedExposure: 300,
    narrowbandSuitable: true,
    requiredAperture: 80,
    idealFocalLength: { min: 200, max: 600 },
    notes: 'Rosette Nebula, large target'
  },
  'IC1805': {
    bestMonths: [9, 10, 11, 12, 1],
    difficulty: 'intermediate',
    recommendedExposure: 300,
    narrowbandSuitable: true,
    requiredAperture: 80,
    idealFocalLength: { min: 200, max: 500 },
    notes: 'Heart Nebula'
  },
  'IC1848': {
    bestMonths: [9, 10, 11, 12, 1],
    difficulty: 'intermediate',
    recommendedExposure: 300,
    narrowbandSuitable: true,
    requiredAperture: 80,
    idealFocalLength: { min: 200, max: 500 },
    notes: 'Soul Nebula, pair with IC1805'
  },
  'NGC7635': {
    bestMonths: [8, 9, 10, 11],
    difficulty: 'advanced',
    recommendedExposure: 360,
    narrowbandSuitable: true,
    requiredAperture: 100,
    idealFocalLength: { min: 800, max: 2000 },
    notes: 'Bubble Nebula'
  },
  'IC1396': {
    bestMonths: [8, 9, 10],
    difficulty: 'intermediate',
    recommendedExposure: 300,
    narrowbandSuitable: true,
    requiredAperture: 50,
    idealFocalLength: { min: 200, max: 500 },
    notes: 'Elephant Trunk Nebula'
  },
  'NGC1499': {
    bestMonths: [10, 11, 12, 1, 2],
    difficulty: 'intermediate',
    recommendedExposure: 300,
    narrowbandSuitable: true,
    requiredAperture: 50,
    idealFocalLength: { min: 100, max: 300 },
    notes: 'California Nebula, very large'
  },
  'NGC2264': {
    bestMonths: [12, 1, 2, 3],
    difficulty: 'intermediate',
    recommendedExposure: 240,
    narrowbandSuitable: true,
    requiredAperture: 80,
    idealFocalLength: { min: 300, max: 800 },
    notes: 'Cone Nebula + Christmas Tree'
  },
  'NGC7293': {
    bestMonths: [8, 9, 10, 11],
    difficulty: 'intermediate',
    recommendedExposure: 300,
    narrowbandSuitable: true,
    requiredAperture: 80,
    idealFocalLength: { min: 400, max: 1000 },
    notes: 'Helix Nebula, large planetary'
  },
  'B33': {
    bestMonths: [11, 12, 1, 2],
    difficulty: 'advanced',
    recommendedExposure: 360,
    narrowbandSuitable: true,
    requiredAperture: 100,
    idealFocalLength: { min: 400, max: 1000 },
    notes: 'Horsehead Nebula, requires H-alpha'
  },
  
  // === CLUSTERS ===
  'M45': {
    bestMonths: [10, 11, 12, 1, 2],
    difficulty: 'beginner',
    recommendedExposure: 90,
    narrowbandSuitable: false,
    requiredAperture: 50,
    idealFocalLength: { min: 100, max: 400 },
    notes: 'Pleiades, large for wide field'
  },
  'M13': {
    bestMonths: [5, 6, 7, 8],
    difficulty: 'beginner',
    recommendedExposure: 60,
    narrowbandSuitable: false,
    requiredAperture: 100,
    idealFocalLength: { min: 800, max: 2000 },
  },
  'M44': {
    bestMonths: [2, 3, 4, 5],
    difficulty: 'beginner',
    recommendedExposure: 30,
    narrowbandSuitable: false,
    requiredAperture: 50,
    idealFocalLength: { min: 100, max: 300 },
    notes: 'Beehive Cluster, large'
  },
  'NGC869': {
    bestMonths: [9, 10, 11, 12],
    difficulty: 'beginner',
    recommendedExposure: 45,
    narrowbandSuitable: false,
    requiredAperture: 50,
    idealFocalLength: { min: 200, max: 600 },
    notes: 'Double Cluster with NGC884'
  },
  'NGC884': {
    bestMonths: [9, 10, 11, 12],
    difficulty: 'beginner',
    recommendedExposure: 45,
    narrowbandSuitable: false,
    requiredAperture: 50,
    idealFocalLength: { min: 200, max: 600 },
  },
  'M11': {
    bestMonths: [7, 8, 9],
    difficulty: 'beginner',
    recommendedExposure: 45,
    narrowbandSuitable: false,
    requiredAperture: 80,
    idealFocalLength: { min: 500, max: 1200 },
    notes: 'Wild Duck Cluster'
  },
};

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_EQUIPMENT: EquipmentProfile = {
  telescopeFocalLength: 500,
  telescopeAperture: 80,
  cameraSensorWidth: 22.3,
  cameraSensorHeight: 14.9,
  cameraPixelSize: 3.76,
  cameraResolutionX: 6000,
  cameraResolutionY: 4000,
  mountType: 'equatorial',
  hasAutoGuider: false,
  filterWheelType: 'osc',
};

const DEFAULT_SITE: ObservingSite = {
  latitude: 40,
  longitude: -74,
  elevation: 0,
  bortleClass: 6,
  typicalSeeing: 3,
};

const DEFAULT_CONFIG: RecommendationConfig = {
  minimumAltitude: 25,
  minimumMoonDistance: 25,
  minimumImagingHours: 1.5,
  preferMeridianTransit: true,
  avoidMeridianFlip: false,
  preferCircumpolar: false,
  maxTargetsPerSession: 3,
  difficultyPreference: 'any',
  objectTypePreferences: [],
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate field of view in arcminutes
 */
export function calculateFOV(
  focalLength: number,
  sensorWidth: number,
  sensorHeight: number
): { width: number; height: number; diagonal: number } {
  const widthArcmin = (sensorWidth / focalLength) * 3438;
  const heightArcmin = (sensorHeight / focalLength) * 3438;
  const diagonalArcmin = Math.sqrt(widthArcmin ** 2 + heightArcmin ** 2);
  
  return {
    width: widthArcmin,
    height: heightArcmin,
    diagonal: diagonalArcmin,
  };
}

/**
 * Calculate image scale in arcseconds per pixel
 */
export function calculateImageScale(focalLength: number, pixelSize: number): number {
  return (pixelSize / focalLength) * 206.265;
}

/**
 * Check if object fits in field of view
 */
export function checkFOVFit(
  objectSize: number,  // arcminutes
  fovWidth: number,
  fovHeight: number
): ImagingFeasibility['fovFit'] {
  const minFOV = Math.min(fovWidth, fovHeight);
  const maxFOV = Math.max(fovWidth, fovHeight);
  
  const sizeRatio = objectSize / minFOV;
  
  if (sizeRatio < 0.15) return 'too_small';
  if (sizeRatio < 0.3) return 'good';
  if (sizeRatio < 0.6) return 'perfect';
  if (sizeRatio < 0.9) return 'tight';
  if (objectSize < maxFOV) return 'tight';
  return 'too_large';
}

/**
 * Check resolution match for object
 */
export function checkResolutionMatch(
  imageScale: number,  // arcsec/pixel
  objectSize: number,  // arcminutes
  seeing: number = 2.5 // arcseconds
): ImagingFeasibility['resolutionMatch'] {
  // Ideal: image scale should be about half the seeing
  // For extended objects, can be more relaxed
  
  const objectArcsec = objectSize * 60;
  const pixelsAcross = objectArcsec / imageScale;
  
  // Want at least 500 pixels across for good detail
  // But not so many that we're oversampling the seeing
  
  if (imageScale > seeing) return 'undersampled';
  if (imageScale < seeing / 3) return 'oversampled';
  if (pixelsAcross < 300) return 'undersampled';
  if (pixelsAcross > 10000 && objectSize > 30) return 'oversampled';
  return imageScale < seeing / 2 ? 'acceptable' : 'optimal';
}

/**
 * Estimate required exposure based on object properties
 */
export function estimateExposure(
  magnitude: number | undefined,
  surfaceBrightness: number | undefined,
  bortleClass: number,
  hasAutoGuider: boolean
): { subExposure: number; totalExposure: number } {
  // Base exposure for mag 10 object at Bortle 5
  let baseExposure = 120;
  
  // Adjust for magnitude
  if (magnitude !== undefined) {
    baseExposure *= Math.pow(2.512, (magnitude - 10) / 2);
  }
  
  // Adjust for surface brightness
  if (surfaceBrightness !== undefined) {
    baseExposure *= Math.pow(2.512, (surfaceBrightness - 20) / 3);
  }
  
  // Adjust for light pollution
  baseExposure *= Math.pow(1.3, bortleClass - 5);
  
  // Cap based on guiding capability
  const maxSubExposure = hasAutoGuider ? 600 : 120;
  const subExposure = Math.min(baseExposure, maxSubExposure);
  
  // Total exposure scales with sub exposure length
  const totalExposure = subExposure < 60 ? 30 : subExposure < 120 ? 60 : 120;
  
  return {
    subExposure: Math.round(subExposure),
    totalExposure: totalExposure,
  };
}

/**
 * Check if target crosses meridian during imaging window
 */
export function checkMeridianCrossing(
  ra: number,
  longitude: number,
  imagingStart: Date,
  imagingEnd: Date
): { crosses: boolean; crossingTime: Date | null } {
  // Calculate LST at start and end
  const startLST = getLocalSiderealTime(imagingStart, longitude);
  const endLST = getLocalSiderealTime(imagingEnd, longitude);
  
  // Target crosses meridian when LST = RA
  const targetHour = ra / 15;
  
  // Check if target hour is between start and end LST
  let crosses = false;
  let crossingTime: Date | null = null;
  
  if (startLST < endLST) {
    crosses = targetHour >= startLST && targetHour <= endLST;
  } else {
    // LST wraps around midnight
    crosses = targetHour >= startLST || targetHour <= endLST;
  }
  
  if (crosses) {
    // Calculate crossing time
    let hoursToTransit = targetHour - startLST;
    if (hoursToTransit < 0) hoursToTransit += 24;
    crossingTime = new Date(imagingStart.getTime() + hoursToTransit * 3600 * 1000);
  }
  
  return { crosses, crossingTime };
}

/**
 * Simple LST calculation
 */
function getLocalSiderealTime(date: Date, longitude: number): number {
  const jd = dateToJD(date);
  const T = (jd - 2451545.0) / 36525;
  
  let gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) +
             0.000387933 * T * T - T * T * T / 38710000;
  
  gmst = gmst % 360;
  if (gmst < 0) gmst += 360;
  
  let lst = (gmst + longitude) / 15;
  lst = lst % 24;
  if (lst < 0) lst += 24;
  
  return lst;
}

function dateToJD(date: Date): number {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate() + 
            date.getUTCHours() / 24 + 
            date.getUTCMinutes() / 1440 + 
            date.getUTCSeconds() / 86400;
  
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + 
         Math.floor(yy / 4) - Math.floor(yy / 100) + 
         Math.floor(yy / 400) - 32045;
}

/**
 * Check if object never rises at given latitude
 */
function neverRises(dec: number, latitude: number): boolean {
  if (latitude >= 0) {
    return dec < -(90 - latitude);
  }
  return dec > (90 + latitude);
}

/**
 * Check if object is circumpolar
 */
function isCircumpolar(dec: number, latitude: number): boolean {
  return Math.abs(dec) > (90 - Math.abs(latitude));
}

/**
 * Check if altitude is above horizon obstructions
 */
function isAboveHorizon(
  altitude: number,
  azimuth: number,
  obstructions?: HorizonObstruction[]
): boolean {
  if (!obstructions || obstructions.length === 0) {
    return altitude > 0;
  }
  
  for (const obs of obstructions) {
    let inRange = false;
    if (obs.azimuthStart < obs.azimuthEnd) {
      inRange = azimuth >= obs.azimuthStart && azimuth <= obs.azimuthEnd;
    } else {
      // Wraps around 360
      inRange = azimuth >= obs.azimuthStart || azimuth <= obs.azimuthEnd;
    }
    
    if (inRange && altitude < obs.altitudeLimit) {
      return false;
    }
  }
  
  return altitude > 0;
}

// ============================================================================
// Main Recommendation Engine
// ============================================================================

export class AdvancedRecommendationEngine {
  private equipment: EquipmentProfile;
  private site: ObservingSite;
  private config: RecommendationConfig;
  private weather?: WeatherConditions;
  private nighttimeData: NighttimeData | null = null;
  private fov: { width: number; height: number; diagonal: number };
  private imageScale: number;
  
  constructor(
    equipment: Partial<EquipmentProfile> = {},
    site: Partial<ObservingSite> = {},
    config: Partial<RecommendationConfig> = {}
  ) {
    this.equipment = { ...DEFAULT_EQUIPMENT, ...equipment };
    this.site = { ...DEFAULT_SITE, ...site };
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    this.fov = calculateFOV(
      this.equipment.telescopeFocalLength,
      this.equipment.cameraSensorWidth,
      this.equipment.cameraSensorHeight
    );
    
    this.imageScale = calculateImageScale(
      this.equipment.telescopeFocalLength,
      this.equipment.cameraPixelSize
    );
  }
  
  /**
   * Update site location
   */
  setLocation(latitude: number, longitude: number, elevation: number = 0) {
    this.site.latitude = latitude;
    this.site.longitude = longitude;
    this.site.elevation = elevation;
    this.nighttimeData = null; // Clear cached data
  }
  
  /**
   * Update equipment profile
   */
  setEquipment(equipment: Partial<EquipmentProfile>) {
    this.equipment = { ...this.equipment, ...equipment };
    this.fov = calculateFOV(
      this.equipment.telescopeFocalLength,
      this.equipment.cameraSensorWidth,
      this.equipment.cameraSensorHeight
    );
    this.imageScale = calculateImageScale(
      this.equipment.telescopeFocalLength,
      this.equipment.cameraPixelSize
    );
  }
  
  /**
   * Update observing site
   */
  setSite(site: Partial<ObservingSite>) {
    this.site = { ...this.site, ...site };
    this.nighttimeData = null;
  }
  
  /**
   * Update configuration
   */
  setConfig(config: Partial<RecommendationConfig>) {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * Set weather conditions
   */
  setWeather(weather: WeatherConditions) {
    this.weather = weather;
  }
  
  /**
   * Get nighttime data for current site
   */
  private getNighttimeData(date: Date = new Date()): NighttimeData {
    if (!this.nighttimeData) {
      this.nighttimeData = calculateNighttimeData(
        this.site.latitude,
        this.site.longitude,
        date
      );
    }
    return this.nighttimeData;
  }
  
  /**
   * Score a single object
   */
  scoreObject(
    dso: DeepSkyObject,
    date: Date = new Date()
  ): ScoredRecommendation | null {
    const { latitude, longitude } = this.site;
    
    // Skip objects that never rise
    if (neverRises(dso.dec, latitude)) {
      return null;
    }
    
    const nighttime = this.getNighttimeData(date);
    const enriched = enrichDeepSkyObject(dso, latitude, longitude, nighttime.referenceDate);
    const altData = calculateAltitudeData(dso.ra, dso.dec, latitude, longitude, nighttime.referenceDate);
    
    const darkStart = nighttime.twilightRiseAndSet.set;
    const darkEnd = nighttime.twilightRiseAndSet.rise;
    
    if (!darkStart || !darkEnd) {
      return null;
    }
    
    const reasons: string[] = [];
    const warnings: string[] = [];
    const tips: string[] = [];
    const currentMonth = date.getMonth() + 1;
    
    // Calculate imaging window
    const imagingWindow = this.calculateImagingWindow(
      altData,
      dso.ra,
      darkStart,
      darkEnd
    );
    
    // Skip if not enough imaging time
    if (imagingWindow.darkHours < this.config.minimumImagingHours && !isCircumpolar(dso.dec, latitude)) {
      return null;
    }
    
    // Calculate feasibility
    const feasibility = this.calculateFeasibility(dso);
    
    // Get seasonal info
    const seasonal = EXTENDED_SEASONAL_DATA[dso.id] || EXTENDED_SEASONAL_DATA[dso.name];
    
    // Calculate score breakdown
    const scoreBreakdown = this.calculateScoreBreakdown(
      dso,
      enriched,
      altData,
      imagingWindow,
      feasibility,
      seasonal,
      currentMonth,
      reasons,
      warnings,
      tips
    );
    
    // Calculate total score
    const totalScore = this.calculateTotalScore(scoreBreakdown);
    
    // Skip low-scoring objects
    if (totalScore < 20) {
      return null;
    }
    
    return {
      object: enriched,
      totalScore: Math.min(100, Math.max(0, Math.round(totalScore))),
      scoreBreakdown,
      imagingWindow,
      feasibility,
      reasons,
      warnings,
      tips,
    };
  }
  
  /**
   * Calculate imaging window for object
   */
  private calculateImagingWindow(
    altData: ObjectAltitudeData,
    ra: number,
    darkStart: Date,
    darkEnd: Date
  ): ImagingWindow {
    const darkStartMs = darkStart.getTime();
    const darkEndMs = darkEnd.getTime();
    
    let totalHours = 0;
    let darkHours = 0;
    let start: Date | null = null;
    let end: Date | null = null;
    
    for (const point of altData.points) {
      const timeMs = point.time.getTime();
      const isInDarkWindow = timeMs >= darkStartMs && timeMs <= darkEndMs;
      const isAboveMinAlt = point.altitude >= this.config.minimumAltitude;
      
      if (isAboveMinAlt && isAboveHorizon(point.altitude, point.azimuth, this.site.horizonObstructions)) {
        totalHours += 0.1;
        if (!start) start = point.time;
        end = point.time;
        
        if (isInDarkWindow) {
          darkHours += 0.1;
        }
      }
    }
    
    const meridian = checkMeridianCrossing(
      ra,
      this.site.longitude,
      start || darkStart,
      end || darkEnd
    );
    
    return {
      start: start || darkStart,
      end: end || darkEnd,
      peakAltitudeTime: altData.maxAltitudeTime,
      peakAltitude: altData.maxAltitude,
      totalHours,
      darkHours,
      meridianCrossing: meridian.crossingTime,
      requiresMeridianFlip: meridian.crosses && this.equipment.mountType === 'equatorial',
    };
  }
  
  /**
   * Calculate imaging feasibility
   */
  private calculateFeasibility(dso: DeepSkyObject): ImagingFeasibility {
    const objectSize = dso.sizeMax || 10;
    const fovFit = checkFOVFit(objectSize, this.fov.width, this.fov.height);
    const resolutionMatch = checkResolutionMatch(
      this.imageScale,
      objectSize,
      this.site.typicalSeeing
    );
    
    const exposure = estimateExposure(
      dso.magnitude,
      dso.surfaceBrightness,
      this.site.bortleClass,
      this.equipment.hasAutoGuider
    );
    
    // SNR estimate (simplified)
    let snr = 50;
    if (dso.magnitude !== undefined) {
      snr = Math.max(10, 90 - (dso.magnitude - 6) * 8);
    }
    if (this.site.bortleClass > 5) {
      snr *= 0.9 ** (this.site.bortleClass - 5);
    }
    
    // Overall rating
    let rating: ImagingFeasibility['overallRating'] = 'fair';
    let ratingScore = 0;
    
    if (fovFit === 'perfect') ratingScore += 3;
    else if (fovFit === 'good') ratingScore += 2;
    else if (fovFit === 'tight') ratingScore += 1;
    else ratingScore -= 1;
    
    if (resolutionMatch === 'optimal') ratingScore += 2;
    else if (resolutionMatch === 'acceptable') ratingScore += 1;
    
    if (ratingScore >= 4) rating = 'excellent';
    else if (ratingScore >= 3) rating = 'good';
    else if (ratingScore >= 1) rating = 'fair';
    else if (ratingScore >= -1) rating = 'marginal';
    else rating = 'poor';
    
    return {
      overallRating: rating,
      fovFit,
      resolutionMatch,
      exposureEstimate: exposure.subExposure,
      totalExposureNeeded: exposure.totalExposure,
      snrEstimate: Math.round(snr),
    };
  }
  
  /**
   * Calculate detailed score breakdown
   */
  private calculateScoreBreakdown(
    dso: DeepSkyObject,
    enriched: DeepSkyObject,
    altData: ObjectAltitudeData,
    imagingWindow: ImagingWindow,
    feasibility: ImagingFeasibility,
    seasonal: ExtendedSeasonalInfo | undefined,
    currentMonth: number,
    reasons: string[],
    warnings: string[],
    tips: string[]
  ): ScoreBreakdown {
    // 1. Altitude score (0-15)
    let altitudeScore = 0;
    if (altData.maxAltitude >= 75) {
      altitudeScore = 15;
      reasons.push('Excellent altitude - minimal atmospheric distortion');
    } else if (altData.maxAltitude >= 60) {
      altitudeScore = 12;
      reasons.push('Very good altitude');
    } else if (altData.maxAltitude >= 45) {
      altitudeScore = 9;
    } else if (altData.maxAltitude >= 30) {
      altitudeScore = 5;
      warnings.push('Moderate altitude - some atmospheric effects');
    } else {
      altitudeScore = 2;
      warnings.push('Low altitude - significant atmospheric distortion');
    }
    
    // 2. Moon score (0-20)
    let moonScore = 0;
    const moonDistance = enriched.moonDistance ?? 180;
    const moonIllum = this.nighttimeData?.moonIllumination ?? 50;
    
    if (moonIllum < 20) {
      moonScore = 18;
      reasons.push('Dark moon - excellent for faint objects');
    } else if (moonIllum < 40) {
      if (moonDistance > 60) {
        moonScore = 15;
      } else {
        moonScore = 10;
      }
    } else if (moonIllum < 70) {
      if (moonDistance > 90) {
        moonScore = 12;
        reasons.push('Far from bright moon');
      } else if (moonDistance > 60) {
        moonScore = 8;
      } else if (moonDistance > 30) {
        moonScore = 4;
        warnings.push('Consider narrowband to reduce moon impact');
      } else {
        moonScore = 0;
        warnings.push('Too close to bright moon');
      }
    } else {
      // Bright moon
      if (moonDistance > 90) {
        moonScore = 8;
        tips.push('Use narrowband filters for best results');
      } else if (moonDistance > 60) {
        moonScore = 4;
        warnings.push('Bright moon nearby - narrowband recommended');
      } else {
        moonScore = 0;
        warnings.push('Moon interference likely');
      }
    }
    
    // 3. Seasonal score (0-15)
    let seasonalScore = 5;
    if (seasonal) {
      if (seasonal.bestMonths.includes(currentMonth)) {
        seasonalScore = 15;
        reasons.push('Prime season for this target');
      } else {
        const distance = seasonal.bestMonths.map(m => {
          const diff = Math.abs(m - currentMonth);
          return Math.min(diff, 12 - diff);
        });
        const minDist = Math.min(...distance);
        if (minDist <= 1) {
          seasonalScore = 10;
        } else if (minDist <= 2) {
          seasonalScore = 5;
        } else {
          seasonalScore = 2;
          warnings.push('Not optimal season');
        }
      }
    }
    
    // 4. Size score (0-10)
    let sizeScore = 5;
    if (feasibility.fovFit === 'perfect') {
      sizeScore = 10;
      reasons.push('Perfect size for your FOV');
    } else if (feasibility.fovFit === 'good') {
      sizeScore = 8;
    } else if (feasibility.fovFit === 'tight') {
      sizeScore = 5;
      tips.push('Consider a mosaic for full coverage');
    } else if (feasibility.fovFit === 'too_large') {
      sizeScore = 3;
      warnings.push('Object too large for single frame');
    } else {
      sizeScore = 3;
      warnings.push('Small target - long focal length helps');
    }
    
    // 5. Brightness score (0-10)
    let brightnessScore = 5;
    if (dso.magnitude !== undefined) {
      if (dso.magnitude < 6) {
        brightnessScore = 10;
        reasons.push('Very bright target');
      } else if (dso.magnitude < 8) {
        brightnessScore = 8;
      } else if (dso.magnitude < 10) {
        brightnessScore = 6;
      } else if (dso.magnitude < 12) {
        brightnessScore = 4;
      } else {
        brightnessScore = 2;
        warnings.push('Faint target - needs long exposure');
      }
    }
    
    // Surface brightness adjustment
    if (dso.surfaceBrightness !== undefined) {
      if (dso.surfaceBrightness < 20) {
        brightnessScore += 2;
      } else if (dso.surfaceBrightness > 23) {
        brightnessScore -= 2;
        if (this.site.bortleClass > 5) {
          warnings.push('Low surface brightness - dark skies needed');
        }
      }
    }
    
    // 6. Duration score (0-12)
    let durationScore = 0;
    if (imagingWindow.darkHours >= 6) {
      durationScore = 12;
      reasons.push(`${imagingWindow.darkHours.toFixed(1)}h imaging window`);
    } else if (imagingWindow.darkHours >= 4) {
      durationScore = 9;
      reasons.push(`${imagingWindow.darkHours.toFixed(1)}h imaging time available`);
    } else if (imagingWindow.darkHours >= 2) {
      durationScore = 6;
    } else if (imagingWindow.darkHours >= 1) {
      durationScore = 3;
      warnings.push('Limited imaging time');
    }
    
    // Circumpolar bonus
    if (isCircumpolar(dso.dec, this.site.latitude)) {
      durationScore = Math.min(12, durationScore + 2);
      tips.push('Circumpolar - can image across multiple nights');
    }
    
    // 7. Equipment score (0-10)
    let equipmentScore = 5;
    if (seasonal) {
      // Check focal length match
      if (this.equipment.telescopeFocalLength >= seasonal.idealFocalLength.min &&
          this.equipment.telescopeFocalLength <= seasonal.idealFocalLength.max) {
        equipmentScore = 10;
      } else if (this.equipment.telescopeFocalLength >= seasonal.idealFocalLength.min * 0.7 &&
                 this.equipment.telescopeFocalLength <= seasonal.idealFocalLength.max * 1.3) {
        equipmentScore = 7;
      } else {
        equipmentScore = 4;
        if (this.equipment.telescopeFocalLength < seasonal.idealFocalLength.min) {
          tips.push('Longer focal length would improve detail');
        } else {
          tips.push('Shorter focal length would capture more of object');
        }
      }
      
      // Check aperture
      if (this.equipment.telescopeAperture < seasonal.requiredAperture) {
        equipmentScore -= 2;
        warnings.push('Larger aperture recommended');
      }
      
      // Narrowband bonus/penalty
      if (seasonal.narrowbandSuitable && this.equipment.filterWheelType === 'narrowband') {
        equipmentScore += 2;
        reasons.push('Narrowband suitable - great with your filters');
      }
    } else {
      // Generic equipment scoring
      if (feasibility.resolutionMatch === 'optimal') {
        equipmentScore = 9;
      } else if (feasibility.resolutionMatch === 'acceptable') {
        equipmentScore = 7;
      } else {
        equipmentScore = 4;
      }
    }
    
    // 8. Light pollution score (0-8)
    let lightPollutionScore = 4;
    const bortle = this.site.bortleClass;
    
    if (bortle <= 3) {
      lightPollutionScore = 8;
    } else if (bortle <= 5) {
      lightPollutionScore = 6;
    } else if (bortle <= 7) {
      lightPollutionScore = 4;
      if (dso.surfaceBrightness !== undefined && dso.surfaceBrightness > 22) {
        warnings.push('Light pollution may affect faint details');
      }
    } else {
      lightPollutionScore = 2;
      warnings.push('Heavy light pollution - narrowband recommended');
    }
    
    // Boost for emission nebulae in light-polluted areas
    if (bortle > 5 && this.equipment.filterWheelType === 'narrowband') {
      const objType = (dso.type || '').toLowerCase();
      if (objType.includes('nebula') || objType.includes('emission')) {
        lightPollutionScore += 2;
        reasons.push('Narrowband helps in light-polluted skies');
      }
    }
    
    // 9. Difficulty score (0-5)
    let difficultyScore = 3;
    if (seasonal) {
      switch (seasonal.difficulty) {
        case 'beginner':
          if (this.config.difficultyPreference === 'beginner' || 
              this.config.difficultyPreference === 'any') {
            difficultyScore = 5;
            if (this.config.difficultyPreference === 'beginner') {
              reasons.push('Great target for beginners');
            }
          }
          break;
        case 'intermediate':
          if (this.config.difficultyPreference !== 'beginner') {
            difficultyScore = 4;
          } else {
            difficultyScore = 2;
          }
          break;
        case 'advanced':
          if (this.config.difficultyPreference === 'advanced') {
            difficultyScore = 5;
            reasons.push('Challenging target');
          } else if (this.config.difficultyPreference === 'any') {
            difficultyScore = 3;
          } else {
            difficultyScore = 1;
            warnings.push('Advanced target - may be challenging');
          }
          break;
      }
    }
    
    // 10. Transit score (0-5)
    let transitScore = 2;
    if (this.config.preferMeridianTransit && imagingWindow.meridianCrossing) {
      transitScore = 5;
      reasons.push('Transits during imaging window');
    }
    
    if (this.config.avoidMeridianFlip && imagingWindow.requiresMeridianFlip) {
      transitScore = 0;
      warnings.push('Requires meridian flip');
    }
    
    return {
      altitudeScore,
      moonScore,
      seasonalScore,
      sizeScore,
      brightnessScore,
      durationScore,
      equipmentScore,
      lightPollutionScore,
      difficultyScore,
      transitScore,
    };
  }
  
  /**
   * Calculate total score from breakdown
   */
  private calculateTotalScore(breakdown: ScoreBreakdown): number {
    return (
      breakdown.altitudeScore +
      breakdown.moonScore +
      breakdown.seasonalScore +
      breakdown.sizeScore +
      breakdown.brightnessScore +
      breakdown.durationScore +
      breakdown.equipmentScore +
      breakdown.lightPollutionScore +
      breakdown.difficultyScore +
      breakdown.transitScore
    );
  }
  
  /**
   * Get recommendations for tonight
   */
  getRecommendations(
    catalog: DeepSkyObject[],
    date: Date = new Date(),
    limit: number = 20
  ): ScoredRecommendation[] {
    // Clear cached nighttime data for new date
    this.nighttimeData = null;
    
    const scored: ScoredRecommendation[] = [];
    
    for (const dso of catalog) {
      const result = this.scoreObject(dso, date);
      if (result) {
        scored.push(result);
      }
    }
    
    // Sort by total score
    scored.sort((a, b) => b.totalScore - a.totalScore);
    
    // Apply object type preferences
    if (this.config.objectTypePreferences.length > 0) {
      const preferred: ScoredRecommendation[] = [];
      const other: ScoredRecommendation[] = [];
      
      for (const rec of scored) {
        const type = rec.object.type.toLowerCase();
        if (this.config.objectTypePreferences.some(p => type.includes(p.toLowerCase()))) {
          preferred.push(rec);
        } else {
          other.push(rec);
        }
      }
      
      return [...preferred, ...other].slice(0, limit);
    }
    
    return scored.slice(0, limit);
  }
  
  /**
   * Plan a multi-target session
   */
  planSession(
    recommendations: ScoredRecommendation[],
    maxTargets: number = this.config.maxTargetsPerSession
  ): ScoredRecommendation[] {
    if (recommendations.length === 0) return [];
    
    const session: ScoredRecommendation[] = [];
    const usedTimeSlots: { start: number; end: number }[] = [];
    
    for (const rec of recommendations) {
      if (session.length >= maxTargets) break;
      
      const start = rec.imagingWindow.start.getTime();
      const end = rec.imagingWindow.end.getTime();
      
      // Check for overlap with existing targets
      const hasOverlap = usedTimeSlots.some(slot => 
        (start < slot.end && end > slot.start)
      );
      
      if (!hasOverlap || session.length === 0) {
        session.push(rec);
        usedTimeSlots.push({ start, end });
      }
    }
    
    // Sort by imaging window start
    session.sort((a, b) => 
      a.imagingWindow.start.getTime() - b.imagingWindow.start.getTime()
    );
    
    return session;
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const recommendationEngine = new AdvancedRecommendationEngine();

// ============================================================================
// Helper functions
// ============================================================================

/**
 * Quick recommendation function for simple use cases
 */
export function getQuickRecommendations(
  catalog: DeepSkyObject[],
  latitude: number,
  longitude: number,
  options: {
    date?: Date;
    limit?: number;
    bortleClass?: number;
    focalLength?: number;
    aperture?: number;
  } = {}
): ScoredRecommendation[] {
  const engine = new AdvancedRecommendationEngine(
    {
      telescopeFocalLength: options.focalLength || 500,
      telescopeAperture: options.aperture || 80,
    },
    {
      latitude,
      longitude,
      bortleClass: options.bortleClass || 6,
    }
  );
  
  return engine.getRecommendations(
    catalog,
    options.date || new Date(),
    options.limit || 20
  );
}
