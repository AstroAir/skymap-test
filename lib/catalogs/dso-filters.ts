/**
 * DSO Filters
 * Ported from NINA's SkyAtlasVM filter implementation
 * 
 * Provides transit time filtering, altitude duration filtering, and other advanced options
 */

import { 
  calculateTargetAltitudeData, 
  type DataPoint,
} from '../astronomy/visibility/target-visibility';
import { CustomHorizon } from '../astronomy/horizon/custom-horizon';
import { getMoonPosition, getMoonPhase, getMoonIllumination } from '../astronomy/celestial/moon';
import { angularSeparation } from '../astronomy/celestial/separation';

// ============================================================================
// Types
// ============================================================================

export interface DSOSearchFilters {
  // Basic filters
  objectName: string;
  objectTypes: Array<{ type: string; selected: boolean }>;
  constellation: string;
  
  // Coordinate filters
  raRange: { from: number | null; through: number | null };
  decRange: { from: number | null; through: number | null };
  
  // Magnitude and size filters
  magnitudeRange: { from: number | null; through: number | null };
  brightnessRange: { from: number | null; through: number | null };
  sizeRange: { from: number | null; through: number | null };
  
  // Altitude filters (NINA-style)
  minimumAltitude: number;
  altitudeDuration: number;           // Hours target must stay above minimum altitude
  altitudeTimeFrom: Date | null;      // Time window start
  altitudeTimeThrough: Date | null;   // Time window end
  useCustomHorizon: boolean;          // Use above-horizon filter instead of fixed altitude
  
  // Transit time filters (NINA-style)
  transitTimeFrom: Date | null;       // Transit time window start
  transitTimeThrough: Date | null;    // Transit time window end
  
  // Moon filters
  minimumMoonDistance: number;
  
  // Sort options
  orderByField: DSOOrderByField;
  orderByDirection: 'asc' | 'desc';
}

export type DSOOrderByField = 
  | 'name'
  | 'magnitude'
  | 'sizeMax'
  | 'ra'
  | 'dec'
  | 'altitude'
  | 'transitTime'
  | 'moonDistance'
  | 'imagingScore';

export interface DSOFilterResult {
  id: string;
  name: string;
  type: string;
  constellation: string;
  ra: number;
  dec: number;
  magnitude: number | null;
  sizeMax: number | null;
  sizeMin: number | null;
  surfaceBrightness: number | null;
  
  // Calculated values
  altitude: number;
  azimuth: number;
  transitTime: Date | null;
  transitAltitude: number;
  moonDistance: number;
  imagingScore: number;
  
  // Visibility info
  isCircumpolar: boolean;
  neverRises: boolean;
  riseTime: Date | null;
  setTime: Date | null;
  
  // Altitude data for chart
  altitudeData: DataPoint[];
  horizonData: DataPoint[];
}

// ============================================================================
// Default Filter Values
// ============================================================================

export const DEFAULT_DSO_FILTERS: DSOSearchFilters = {
  objectName: '',
  objectTypes: [],
  constellation: '',
  
  raRange: { from: null, through: null },
  decRange: { from: null, through: null },
  
  magnitudeRange: { from: null, through: null },
  brightnessRange: { from: null, through: null },
  sizeRange: { from: null, through: null },
  
  minimumAltitude: 0,
  altitudeDuration: 1,
  altitudeTimeFrom: null,
  altitudeTimeThrough: null,
  useCustomHorizon: false,
  
  transitTimeFrom: null,
  transitTimeThrough: null,
  
  minimumMoonDistance: 0,
  
  orderByField: 'sizeMax',
  orderByDirection: 'desc',
};

// ============================================================================
// Constants
// ============================================================================

// Special altitude filter value indicating "above custom horizon"
export const ALTITUDE_ABOVE_HORIZON_FILTER = 999;

// ============================================================================
// Filter Functions
// ============================================================================

/**
 * Calculate transit time for a target
 * Based on NINA's transit time calculation in SkyAtlasVM
 */
export function calculateTransitTime(
  ra: number,  // degrees
  longitude: number,
  referenceDate: Date
): Date {
  // Get local sidereal time at reference date
  const jd = referenceDate.getTime() / 86400000 + 2440587.5;
  const S = jd - 2451545.0;
  const T = S / 36525.0;
  const GST = 280.46061837 + 360.98564736629 * S + T ** 2 * (0.000387933 - T / 38710000);
  const LST = ((GST + longitude) % 360 + 360) % 360;
  
  // Convert RA to hours for easier calculation
  const raHours = ra / 15;
  const lstHours = LST / 15;
  
  // Hours until transit
  let hoursToTransit = raHours - lstHours;
  if (hoursToTransit < 0) hoursToTransit += 24;
  if (hoursToTransit > 24) hoursToTransit -= 24;
  
  return new Date(referenceDate.getTime() + hoursToTransit * 3600000);
}

/**
 * Check if target meets altitude duration requirement
 * Based on NINA's altitude filtering logic
 */
export function checkAltitudeDuration(
  altitudeData: DataPoint[],
  horizonData: DataPoint[],
  minimumAltitude: number,
  minimumDuration: number,  // hours
  timeFrom: Date | null,
  timeThrough: Date | null,
  useCustomHorizon: boolean
): boolean {
  if (minimumDuration <= 0) return true;
  if (altitudeData.length === 0) return false;
  
  // Convert dates to data point x values
  const fromX = timeFrom ? dateToDataPointX(timeFrom) : altitudeData[0].x;
  const throughX = timeThrough ? dateToDataPointX(timeThrough) : altitudeData[altitudeData.length - 1].x;
  
  // Filter data points within time window
  const filteredData = altitudeData.filter(p => p.x >= fromX && p.x <= throughX);
  if (filteredData.length < 2) return false;
  
  if (minimumDuration === Infinity) {
    // Check if ALL points are above threshold
    return filteredData.every((point, idx) => {
      const threshold = useCustomHorizon && horizonData[idx]
        ? horizonData[idx].y
        : minimumAltitude;
      return point.y > threshold;
    });
  }
  
  // Calculate duration above threshold
  let currentDuration = 0;
  let maxDuration = 0;
  let lastAboveTime = 0;
  let wasAbove = false;
  
  for (let i = 0; i < filteredData.length; i++) {
    const point = filteredData[i];
    const threshold = useCustomHorizon && horizonData[i]
      ? horizonData[i].y
      : minimumAltitude;
    
    const isAbove = point.y > threshold;
    
    if (isAbove) {
      if (!wasAbove) {
        // Started new above-threshold period
        lastAboveTime = point.x;
      }
      currentDuration = (point.x - lastAboveTime) * 24; // Convert days to hours
      maxDuration = Math.max(maxDuration, currentDuration);
    } else {
      wasAbove = false;
      currentDuration = 0;
    }
    
    wasAbove = isAbove;
  }
  
  return maxDuration >= minimumDuration;
}

/**
 * Apply filters to a list of DSO objects
 * Based on NINA's Search() method in SkyAtlasVM
 */
export function applyDSOFilters(
  objects: DSOFilterResult[],
  filters: DSOSearchFilters,
  latitude: number,
  longitude: number,
  referenceDate: Date,
  customHorizon?: CustomHorizon
): DSOFilterResult[] {
  let result = [...objects];
  
  // Basic name filter
  if (filters.objectName) {
    const searchLower = filters.objectName.toLowerCase();
    result = result.filter(obj => 
      obj.name.toLowerCase().includes(searchLower) ||
      obj.id.toLowerCase().includes(searchLower)
    );
  }
  
  // Object type filter
  const selectedTypes = filters.objectTypes
    .filter(t => t.selected)
    .map(t => t.type);
  if (selectedTypes.length > 0) {
    result = result.filter(obj => selectedTypes.includes(obj.type));
  }
  
  // Constellation filter
  if (filters.constellation) {
    result = result.filter(obj => obj.constellation === filters.constellation);
  }
  
  // RA range filter
  if (filters.raRange.from !== null || filters.raRange.through !== null) {
    result = result.filter(obj => {
      const raHours = obj.ra / 15;
      if (filters.raRange.from !== null && raHours < filters.raRange.from) return false;
      if (filters.raRange.through !== null && raHours > filters.raRange.through) return false;
      return true;
    });
  }
  
  // Dec range filter
  if (filters.decRange.from !== null || filters.decRange.through !== null) {
    const from = filters.decRange.from ?? -90;
    const through = filters.decRange.through ?? 90;
    const [minDec, maxDec] = from < through ? [from, through] : [through, from];
    result = result.filter(obj => obj.dec >= minDec && obj.dec <= maxDec);
  }
  
  // Magnitude filter
  if (filters.magnitudeRange.from !== null || filters.magnitudeRange.through !== null) {
    result = result.filter(obj => {
      if (obj.magnitude === null) return true; // Include objects without magnitude
      if (filters.magnitudeRange.from !== null && obj.magnitude < filters.magnitudeRange.from) return false;
      if (filters.magnitudeRange.through !== null && obj.magnitude > filters.magnitudeRange.through) return false;
      return true;
    });
  }
  
  // Size filter
  if (filters.sizeRange.from !== null || filters.sizeRange.through !== null) {
    result = result.filter(obj => {
      if (obj.sizeMax === null) return true;
      if (filters.sizeRange.from !== null && obj.sizeMax < filters.sizeRange.from) return false;
      if (filters.sizeRange.through !== null && obj.sizeMax > filters.sizeRange.through) return false;
      return true;
    });
  }
  
  // Surface brightness filter
  if (filters.brightnessRange.from !== null || filters.brightnessRange.through !== null) {
    result = result.filter(obj => {
      if (obj.surfaceBrightness === null) return true;
      if (filters.brightnessRange.from !== null && obj.surfaceBrightness < filters.brightnessRange.from) return false;
      if (filters.brightnessRange.through !== null && obj.surfaceBrightness > filters.brightnessRange.through) return false;
      return true;
    });
  }
  
  // Altitude duration filter
  if (filters.minimumAltitude > 0 && filters.altitudeDuration > 0) {
    result = result.filter(obj => {
      const useHorizon = filters.useCustomHorizon && filters.minimumAltitude === ALTITUDE_ABOVE_HORIZON_FILTER;
      return checkAltitudeDuration(
        obj.altitudeData,
        obj.horizonData,
        filters.minimumAltitude,
        filters.altitudeDuration,
        filters.altitudeTimeFrom,
        filters.altitudeTimeThrough,
        useHorizon
      );
    });
  }
  
  // Moon distance filter
  if (filters.minimumMoonDistance > 0) {
    result = result.filter(obj => obj.moonDistance >= filters.minimumMoonDistance);
  }
  
  // Transit time filter
  if (filters.transitTimeFrom !== null || filters.transitTimeThrough !== null) {
    result = result.filter(obj => {
      if (!obj.transitTime) return false;
      
      if (filters.transitTimeFrom !== null && obj.transitTime < filters.transitTimeFrom) {
        return false;
      }
      if (filters.transitTimeThrough !== null && obj.transitTime > filters.transitTimeThrough) {
        return false;
      }
      return true;
    });
  }
  
  // Sort results
  result = sortResults(result, filters.orderByField, filters.orderByDirection);
  
  return result;
}

/**
 * Sort filtered results
 */
function sortResults(
  results: DSOFilterResult[],
  field: DSOOrderByField,
  direction: 'asc' | 'desc'
): DSOFilterResult[] {
  const sorted = [...results].sort((a, b) => {
    let comparison = 0;
    
    switch (field) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'magnitude':
        comparison = (a.magnitude ?? 99) - (b.magnitude ?? 99);
        break;
      case 'sizeMax':
        comparison = (a.sizeMax ?? 0) - (b.sizeMax ?? 0);
        break;
      case 'ra':
        comparison = a.ra - b.ra;
        break;
      case 'dec':
        comparison = a.dec - b.dec;
        break;
      case 'altitude':
        comparison = a.altitude - b.altitude;
        break;
      case 'transitTime':
        const aTime = a.transitTime?.getTime() ?? 0;
        const bTime = b.transitTime?.getTime() ?? 0;
        comparison = aTime - bTime;
        break;
      case 'moonDistance':
        comparison = a.moonDistance - b.moonDistance;
        break;
      case 'imagingScore':
        comparison = a.imagingScore - b.imagingScore;
        break;
    }
    
    return direction === 'asc' ? comparison : -comparison;
  });
  
  return sorted;
}

/**
 * Convert Date to DataPoint x value
 */
function dateToDataPointX(date: Date): number {
  const epoch = new Date(Date.UTC(1900, 0, 1)).getTime();
  return (date.getTime() - epoch) / (24 * 60 * 60 * 1000);
}

/**
 * Calculate all dynamic properties for a DSO
 */
export function enrichDSOWithCalculations(
  dso: {
    id: string;
    name: string;
    type: string;
    constellation: string;
    ra: number;
    dec: number;
    magnitude: number | null;
    sizeMax: number | null;
    sizeMin: number | null;
    surfaceBrightness: number | null;
  },
  latitude: number,
  longitude: number,
  referenceDate: Date,
  customHorizon?: CustomHorizon
): DSOFilterResult {
  // Calculate visibility data
  const visibilityData = calculateTargetAltitudeData(
    dso.ra,
    dso.dec,
    latitude,
    longitude,
    referenceDate,
    customHorizon
  );
  
  // Get current altitude/azimuth (first point or interpolated)
  const currentAlt = visibilityData.altitudes[0]?.y ?? 0;
  const currentAz = 0; // Would need to track azimuth in altitude data
  
  // Calculate moon info
  const moonPos = getMoonPosition();
  const moonDist = angularSeparation(dso.ra, dso.dec, moonPos.ra, moonPos.dec);
  
  // Calculate transit time
  const transitTime = calculateTransitTime(dso.ra, longitude, referenceDate);
  
  // Calculate imaging score
  const moonPhase = getMoonPhase();
  const moonIllum = getMoonIllumination(moonPhase);
  const imagingScore = calculateImagingScoreSimple(
    currentAlt,
    moonDist,
    moonIllum,
    visibilityData.moon.isUp
  );
  
  return {
    ...dso,
    altitude: currentAlt,
    azimuth: currentAz,
    transitTime,
    transitAltitude: visibilityData.maxAltitude.y,
    moonDistance: moonDist,
    imagingScore,
    isCircumpolar: visibilityData.isCircumpolar,
    neverRises: visibilityData.neverRises,
    riseTime: visibilityData.riseTime,
    setTime: visibilityData.setTime,
    altitudeData: visibilityData.altitudes,
    horizonData: visibilityData.horizon,
  };
}

/**
 * Simple imaging score calculation
 */
function calculateImagingScoreSimple(
  altitude: number,
  moonDistance: number,
  moonIllumination: number,
  isMoonUp: boolean
): number {
  let score = 100;
  
  // Altitude penalty
  if (altitude < 0) score -= 100;
  else if (altitude < 15) score -= 50;
  else if (altitude < 30) score -= 30;
  else if (altitude < 45) score -= 15;
  else if (altitude < 60) score -= 5;
  
  // Moon penalty
  if (isMoonUp) {
    if (moonIllumination > 80) {
      score -= 25;
      if (moonDistance < 30) score -= 25;
      else if (moonDistance < 60) score -= 15;
    } else if (moonIllumination > 50) {
      score -= 15;
      if (moonDistance < 30) score -= 15;
    } else if (moonIllumination > 20) {
      score -= 5;
    }
  }
  
  return Math.max(0, Math.min(100, score));
}

// ============================================================================
// Backward Compatibility Aliases (deprecated, use new names)
// ============================================================================

/** @deprecated Use DSOSearchFilters instead */
export type EnhancedSearchFilters = DSOSearchFilters;

/** @deprecated Use DSOOrderByField instead */
export type SkyAtlasOrderByField = DSOOrderByField;

/** @deprecated Use DSOFilterResult instead */
export type FilteredDSOResult = DSOFilterResult;

/** @deprecated Use DEFAULT_DSO_FILTERS instead */
export const DEFAULT_ENHANCED_FILTERS = DEFAULT_DSO_FILTERS;

/** @deprecated Use applyDSOFilters instead */
export const applyEnhancedFilters = applyDSOFilters;
