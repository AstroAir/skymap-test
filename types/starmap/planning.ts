/**
 * Type definitions for starmap planning components
 * Extracted from components/starmap/planning/ for architectural separation
 */

import type { ImagingFeasibility } from '@/lib/astronomy/astro-utils';
import type { TargetItem } from '@/lib/stores/target-list-store';
import type { DeepSkyObject } from '@/lib/catalogs';
import type { I18nMessage } from '@/lib/core/types';

export type { I18nMessage };

// ============================================================================
// AltitudeChart
// ============================================================================

export interface AltitudeChartProps {
  ra: number;
  dec: number;
  name?: string;
  hoursAhead?: number;
}

// ============================================================================
// AstroSessionPanel
// ============================================================================

export interface AstroSessionPanelProps {
  selectedRa?: number;
  selectedDec?: number;
  selectedName?: string;
}

// ============================================================================
// ExposureCalculator
// ============================================================================

export interface ExposureSettings {
  exposureTime: number;
  gain: number;
  offset: number;
  binning: '1x1' | '2x2' | '3x3' | '4x4';
  imageType: 'LIGHT' | 'DARK' | 'FLAT' | 'BIAS';
  count: number;
  filter: string;
  ditherEvery: number;
  ditherEnabled: boolean;
}

export type ExposureGainStrategy = 'unity' | 'max_dynamic_range' | 'manual';

export interface ExposurePlanAdvanced {
  sqm?: number;
  filterBandwidthNm?: number;
  readNoiseLimitPercent?: number;
  gainStrategy?: ExposureGainStrategy;
  recommendedGain?: number;
  recommendedExposureSec?: number;
  skyFluxPerPixel?: number;
  targetSignalPerPixelPerSec?: number;
  dynamicRangeScore?: number;
  dynamicRangeStops?: number;
  readNoiseUsed?: number;
  darkCurrentUsed?: number;
  noiseFractions?: {
    read?: number;
    sky?: number;
    dark?: number;
  };
  stackEstimate?: {
    recommendedFrameCount?: number;
    estimatedTotalMinutes?: number;
    framesForTargetSNR?: number;
    framesForTimeNoise?: number;
    targetSNR?: number;
    targetTimeNoiseRatio?: number;
  };
}

export interface ExposurePlan {
  settings: ExposureSettings;
  totalExposure: number; // minutes
  totalFrames: number;
  estimatedFileSize: number; // MB
  estimatedTime: string;
  advanced?: ExposurePlanAdvanced;
}

export interface ExposureCalculatorProps {
  focalLength?: number;
  aperture?: number;
  pixelSize?: number;
  onExposurePlanChange?: (plan: ExposurePlan) => void;
}

// ============================================================================
// SessionPlanner
// ============================================================================

export interface ScheduledTarget {
  target: TargetItem;
  startTime: Date;
  endTime: Date;
  duration: number; // hours
  transitTime: Date | null;
  maxAltitude: number;
  moonDistance: number;
  feasibility: ImagingFeasibility;
  conflicts: string[];
  isOptimal: boolean;
  order: number;
}

export interface SessionPlan {
  targets: ScheduledTarget[];
  totalImagingTime: number;
  nightCoverage: number;
  efficiency: number;
  gaps: Array<{ start: Date; end: Date; duration: number }>;
  recommendations: I18nMessage[];
  warnings: I18nMessage[];
  conflicts?: SessionConflict[];
}

export interface SessionConflict {
  type: string;
  message: string;
}

export type OptimizationStrategy = 'altitude' | 'transit' | 'moon' | 'duration' | 'balanced';

// ============================================================================
// ObservationLog
// ============================================================================

export interface ObservationLogProps {
  currentSelection?: {
    name: string;
    ra: number;
    dec: number;
    raString: string;
    decString: string;
    type?: string;
    constellation?: string;
  } | null;
}

// ============================================================================
// ShotList
// ============================================================================

export interface ShotListProps {
  onNavigateToTarget?: (ra: number, dec: number) => void;
  currentSelection?: {
    name: string;
    ra: number;
    dec: number;
    raString: string;
    decString: string;
  } | null;
}

// ============================================================================
// SkyAtlasPanel
// ============================================================================

export interface DSOCardProps {
  object: DeepSkyObject;
  onSelect: (object: DeepSkyObject) => void;
  onAddToList?: (object: DeepSkyObject) => void;
  onGoto?: (object: DeepSkyObject) => void;
  isSelected?: boolean;
}

export interface FilterPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

// ============================================================================
// TonightRecommendations
// ============================================================================

export interface NightTimelineProps {
  twilight: {
    sunset: Date | null;
    sunrise: Date | null;
    civilDusk: Date | null;
    civilDawn: Date | null;
    nauticalDusk: Date | null;
    nauticalDawn: Date | null;
    astronomicalDusk: Date | null;
    astronomicalDawn: Date | null;
  };
  currentTime: Date;
}

export interface MoonPhaseDisplayProps {
  phase: number;
  illumination: number;
  phaseName: string;
}

// ============================================================================
// AstroCalculator (migrated from astro-calculator/types.ts)
// ============================================================================

export interface CelestialPosition {
  name: string;
  type: string;
  ra: number;
  dec: number;
  magnitude?: number;
  angularSize?: number;
  altitude: number;
  azimuth: number;
  transitTime: Date | null;
  maxElevation: number;
  elongation?: number;
  constellation?: string;
}

export interface EphemerisEntry {
  date: Date;
  ra: number;
  dec: number;
  altitude: number;
  azimuth: number;
  magnitude?: number;
  phase?: number;
  distance?: number;
  elongation?: number;
}

export interface WUTObject {
  name: string;
  type: string;
  ra: number;
  dec: number;
  magnitude?: number;
  riseTime: Date | null;
  transitTime: Date | null;
  setTime: Date | null;
  maxElevation: number;
  angularSize?: number;
  constellation?: string;
  score: number;
}

export interface PhenomenaEvent {
  date: Date;
  type: 'conjunction' | 'opposition' | 'elongation' | 'occultation' | 'close_approach' | 'moon_phase';
  object1: string;
  object2?: string;
  separation?: number;
  details: string;
  importance: 'high' | 'medium' | 'low';
}
