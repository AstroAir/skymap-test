/**
 * Sky Atlas Search Engine - Ported from N.I.N.A.
 * Implements comprehensive DSO filtering and search
 */

import type {
  DeepSkyObject,
  SkyAtlasFilters,
  SkyAtlasSearchResult,
  NighttimeData,
  OrderByField,
  OrderByDirection,
} from './types';
import {
  calculateAltitudeData,
  calculateMoonDistance,
  calculateTransitTime,
  isAboveAltitudeForDuration,
  enrichDeepSkyObject,
} from './deep-sky-object';
import { calculateNighttimeData, getReferenceDate } from './nighttime-calculator';

// ============================================================================
// Default Filter Values
// ============================================================================

export function createDefaultFilters(): SkyAtlasFilters {
  const now = new Date();
  const refDate = getReferenceDate(now);
  
  return {
    objectName: '',
    filterDate: refDate,
    objectTypes: [],
    constellation: '',
    raRange: { from: null, through: null },
    decRange: { from: null, through: null },
    magnitudeRange: { from: null, through: null },
    brightnessRange: { from: null, through: null },
    sizeRange: { from: null, through: null },
    minimumAltitude: 0,
    altitudeTimeFrom: refDate,
    altitudeTimeThrough: new Date(refDate.getTime() + 24 * 3600000),
    altitudeDuration: 0,
    minimumMoonDistance: 0,
    transitTimeFrom: null,
    transitTimeThrough: null,
    orderByField: 'imagingScore',
    orderByDirection: 'desc',
  };
}

/**
 * Initialize filters with nighttime data
 */
export function initializeFiltersWithNighttime(
  nighttimeData: NighttimeData
): Partial<SkyAtlasFilters> {
  // Default to astronomical twilight window
  const defaultFrom = nighttimeData.twilightRiseAndSet.set || 
                      nighttimeData.nauticalTwilightRiseAndSet.set ||
                      nighttimeData.sunRiseAndSet.set ||
                      nighttimeData.referenceDate;
  
  const defaultThrough = nighttimeData.twilightRiseAndSet.rise ||
                         nighttimeData.nauticalTwilightRiseAndSet.rise ||
                         nighttimeData.sunRiseAndSet.rise ||
                         new Date(nighttimeData.referenceDate.getTime() + 24 * 3600000);
  
  return {
    altitudeTimeFrom: defaultFrom,
    altitudeTimeThrough: defaultThrough,
  };
}

// ============================================================================
// Search Implementation
// ============================================================================

export interface SearchOptions {
  latitude: number;
  longitude: number;
  pageSize?: number;
  page?: number;
}

/**
 * Main search function - filters and sorts DSOs
 * Ported from NINA SkyAtlasVM.Search()
 */
export async function searchDeepSkyObjects(
  catalog: DeepSkyObject[],
  filters: SkyAtlasFilters,
  options: SearchOptions
): Promise<SkyAtlasSearchResult> {
  const { latitude, longitude, pageSize = 50, page = 1 } = options;
  const referenceDate = getReferenceDate(filters.filterDate);
  
  let results = [...catalog];
  
  // ============ Name Filter ============
  if (filters.objectName && filters.objectName.trim()) {
    const searchTerm = filters.objectName.trim().toLowerCase();
    results = results.filter(obj => {
      const nameMatch = obj.name.toLowerCase().includes(searchTerm);
      const altNameMatch = obj.alternateNames?.some(n => 
        n.toLowerCase().includes(searchTerm)
      );
      return nameMatch || altNameMatch;
    });
  }
  
  // ============ Object Type Filter ============
  const selectedTypes = filters.objectTypes.filter(t => t.selected).map(t => t.type);
  if (selectedTypes.length > 0) {
    results = results.filter(obj => selectedTypes.includes(obj.type));
  }
  
  // ============ Constellation Filter ============
  if (filters.constellation && filters.constellation.trim()) {
    const constellation = filters.constellation.trim().toLowerCase();
    results = results.filter(obj => 
      obj.constellation.toLowerCase() === constellation ||
      obj.constellation.toLowerCase().includes(constellation)
    );
  }
  
  // ============ RA Filter ============
  if (filters.raRange.from !== null || filters.raRange.through !== null) {
    results = results.filter(obj => {
      const raDeg = obj.ra;
      if (filters.raRange.from !== null && raDeg < filters.raRange.from) return false;
      if (filters.raRange.through !== null && raDeg > filters.raRange.through) return false;
      return true;
    });
  }
  
  // ============ Dec Filter ============
  if (filters.decRange.from !== null || filters.decRange.through !== null) {
    const decFrom = Math.min(filters.decRange.from ?? -90, filters.decRange.through ?? 90);
    const decThrough = Math.max(filters.decRange.from ?? -90, filters.decRange.through ?? 90);
    results = results.filter(obj => obj.dec >= decFrom && obj.dec <= decThrough);
  }
  
  // ============ Magnitude Filter ============
  if (filters.magnitudeRange.from !== null || filters.magnitudeRange.through !== null) {
    results = results.filter(obj => {
      if (obj.magnitude === undefined) return false;
      if (filters.magnitudeRange.from !== null && obj.magnitude < filters.magnitudeRange.from) return false;
      if (filters.magnitudeRange.through !== null && obj.magnitude > filters.magnitudeRange.through) return false;
      return true;
    });
  }
  
  // ============ Surface Brightness Filter ============
  if (filters.brightnessRange.from !== null || filters.brightnessRange.through !== null) {
    results = results.filter(obj => {
      if (obj.surfaceBrightness === undefined) return false;
      if (filters.brightnessRange.from !== null && obj.surfaceBrightness < filters.brightnessRange.from) return false;
      if (filters.brightnessRange.through !== null && obj.surfaceBrightness > filters.brightnessRange.through) return false;
      return true;
    });
  }
  
  // ============ Size Filter (arcsec) ============
  if (filters.sizeRange.from !== null || filters.sizeRange.through !== null) {
    results = results.filter(obj => {
      if (obj.sizeMax === undefined) return false;
      const sizeArcsec = obj.sizeMax * 60; // Convert arcmin to arcsec
      if (filters.sizeRange.from !== null && sizeArcsec < filters.sizeRange.from) return false;
      if (filters.sizeRange.through !== null && sizeArcsec > filters.sizeRange.through) return false;
      return true;
    });
  }
  
  // ============ Enrich objects with calculated data ============
  results = results.map(obj => enrichDeepSkyObject(obj, latitude, longitude, referenceDate));
  
  // ============ Altitude Duration Filter ============
  if (filters.minimumAltitude > 0 && filters.altitudeDuration > 0) {
    const startTime = filters.altitudeTimeFrom;
    const endTime = filters.altitudeTimeThrough;
    
    results = results.filter(obj => {
      const altitudeData = calculateAltitudeData(obj.ra, obj.dec, latitude, longitude, referenceDate);
      return isAboveAltitudeForDuration(
        altitudeData,
        filters.minimumAltitude,
        filters.altitudeDuration,
        startTime,
        endTime
      );
    });
  }
  
  // ============ Moon Distance Filter ============
  if (filters.minimumMoonDistance > 0) {
    results = results.filter(obj => {
      const moonDistance = obj.moonDistance ?? calculateMoonDistance(obj.ra, obj.dec, referenceDate);
      return moonDistance >= filters.minimumMoonDistance;
    });
  }
  
  // ============ Transit Time Filter ============
  if (filters.transitTimeFrom !== null || filters.transitTimeThrough !== null) {
    results = results.filter(obj => {
      const transitTime = obj.transitTime ?? calculateTransitTime(obj.ra, longitude, referenceDate);
      if (!transitTime) return false;
      
      const transitMs = transitTime.getTime();
      if (filters.transitTimeFrom && transitMs < filters.transitTimeFrom.getTime()) return false;
      if (filters.transitTimeThrough && transitMs > filters.transitTimeThrough.getTime()) return false;
      return true;
    });
  }
  
  // ============ Sorting ============
  results = sortResults(results, filters.orderByField, filters.orderByDirection, longitude, referenceDate);
  
  // ============ Pagination ============
  const totalCount = results.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const startIndex = (page - 1) * pageSize;
  const pagedResults = results.slice(startIndex, startIndex + pageSize);
  
  return {
    objects: pagedResults,
    totalCount,
    pageSize,
    currentPage: page,
    totalPages,
  };
}

// ============================================================================
// Sorting
// ============================================================================

function sortResults(
  results: DeepSkyObject[],
  field: OrderByField,
  direction: OrderByDirection,
  longitude: number,
  referenceDate: Date
): DeepSkyObject[] {
  const sorted = [...results];
  const multiplier = direction === 'asc' ? 1 : -1;
  
  sorted.sort((a, b) => {
    let comparison = 0;
    
    switch (field) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
        
      case 'magnitude':
        const magA = a.magnitude ?? 99;
        const magB = b.magnitude ?? 99;
        comparison = magA - magB;
        break;
        
      case 'size':
        const sizeA = a.sizeMax ?? 0;
        const sizeB = b.sizeMax ?? 0;
        comparison = sizeA - sizeB;
        break;
        
      case 'altitude':
        const altA = a.altitude ?? -90;
        const altB = b.altitude ?? -90;
        comparison = altA - altB;
        break;
        
      case 'transitTime':
        const transitA = a.transitTime ?? calculateTransitTime(a.ra, longitude, referenceDate);
        const transitB = b.transitTime ?? calculateTransitTime(b.ra, longitude, referenceDate);
        comparison = (transitA?.getTime() ?? 0) - (transitB?.getTime() ?? 0);
        break;
        
      case 'surfaceBrightness':
        const sbA = a.surfaceBrightness ?? 99;
        const sbB = b.surfaceBrightness ?? 99;
        comparison = sbA - sbB;
        break;
        
      case 'moonDistance':
        const moonA = a.moonDistance ?? 0;
        const moonB = b.moonDistance ?? 0;
        comparison = moonA - moonB;
        break;
        
      case 'imagingScore':
        const scoreA = a.imagingScore ?? 0;
        const scoreB = b.imagingScore ?? 0;
        comparison = scoreA - scoreB;
        break;
        
      default:
        comparison = 0;
    }
    
    return comparison * multiplier;
  });
  
  return sorted;
}

// ============================================================================
// Quick Search
// ============================================================================

/**
 * Quick search by name only (for autocomplete)
 */
export function quickSearchByName(
  catalog: DeepSkyObject[],
  searchTerm: string,
  limit: number = 10
): DeepSkyObject[] {
  if (!searchTerm || searchTerm.trim().length < 1) {
    return [];
  }
  
  const term = searchTerm.trim().toLowerCase();
  
  // Prioritize exact matches, then prefix matches, then contains
  const exactMatches: DeepSkyObject[] = [];
  const prefixMatches: DeepSkyObject[] = [];
  const containsMatches: DeepSkyObject[] = [];
  
  for (const obj of catalog) {
    const nameLower = obj.name.toLowerCase();
    
    if (nameLower === term) {
      exactMatches.push(obj);
    } else if (nameLower.startsWith(term)) {
      prefixMatches.push(obj);
    } else if (nameLower.includes(term)) {
      containsMatches.push(obj);
    } else if (obj.alternateNames?.some(n => n.toLowerCase().includes(term))) {
      containsMatches.push(obj);
    }
    
    // Early exit if we have enough matches
    if (exactMatches.length + prefixMatches.length >= limit) {
      break;
    }
  }
  
  return [...exactMatches, ...prefixMatches, ...containsMatches].slice(0, limit);
}

// ============================================================================
// Catalog Statistics
// ============================================================================

export interface CatalogStats {
  totalObjects: number;
  byType: Record<string, number>;
  byConstellation: Record<string, number>;
  magnitudeRange: { min: number; max: number };
  sizeRange: { min: number; max: number };
}

/**
 * Calculate catalog statistics
 */
export function getCatalogStats(catalog: DeepSkyObject[]): CatalogStats {
  const byType: Record<string, number> = {};
  const byConstellation: Record<string, number> = {};
  let minMag = Infinity;
  let maxMag = -Infinity;
  let minSize = Infinity;
  let maxSize = -Infinity;
  
  for (const obj of catalog) {
    // Count by type
    byType[obj.type] = (byType[obj.type] || 0) + 1;
    
    // Count by constellation
    byConstellation[obj.constellation] = (byConstellation[obj.constellation] || 0) + 1;
    
    // Track magnitude range
    if (obj.magnitude !== undefined) {
      minMag = Math.min(minMag, obj.magnitude);
      maxMag = Math.max(maxMag, obj.magnitude);
    }
    
    // Track size range
    if (obj.sizeMax !== undefined) {
      minSize = Math.min(minSize, obj.sizeMax);
      maxSize = Math.max(maxSize, obj.sizeMax);
    }
  }
  
  return {
    totalObjects: catalog.length,
    byType,
    byConstellation,
    magnitudeRange: { min: minMag === Infinity ? 0 : minMag, max: maxMag === -Infinity ? 20 : maxMag },
    sizeRange: { min: minSize === Infinity ? 0 : minSize, max: maxSize === -Infinity ? 100 : maxSize },
  };
}

// ============================================================================
// Tonight's Best Recommendations
// ============================================================================

export interface TonightsBestOptions {
  latitude: number;
  longitude: number;
  date?: Date;
  minimumAltitude?: number;
  minimumMoonDistance?: number;
  limit?: number;
}

/**
 * Get tonight's best objects for imaging
 * Ported from NINA's recommendation logic
 */
export function getTonightsBest(
  catalog: DeepSkyObject[],
  options: TonightsBestOptions
): DeepSkyObject[] {
  const {
    latitude,
    longitude,
    date = new Date(),
    minimumAltitude = 30,
    minimumMoonDistance = 30,
    limit = 20,
  } = options;
  
  const nighttimeData = calculateNighttimeData(latitude, longitude, date);
  const referenceDate = nighttimeData.referenceDate;
  
  // Get imaging window (astronomical twilight)
  const imagingStart = nighttimeData.twilightRiseAndSet.set || nighttimeData.referenceDate;
  const imagingEnd = nighttimeData.twilightRiseAndSet.rise || 
                     new Date(nighttimeData.referenceDate.getTime() + 24 * 3600000);
  
  // Enrich and filter
  const enrichedObjects = catalog.map(obj => 
    enrichDeepSkyObject(obj, latitude, longitude, referenceDate)
  );
  
  const filtered = enrichedObjects.filter(obj => {
    // Check altitude during imaging window
    const altitudeData = calculateAltitudeData(obj.ra, obj.dec, latitude, longitude, referenceDate);
    const isAboveAlt = isAboveAltitudeForDuration(altitudeData, minimumAltitude, 1, imagingStart, imagingEnd);
    if (!isAboveAlt) return false;
    
    // Check moon distance
    if ((obj.moonDistance ?? 0) < minimumMoonDistance) return false;
    
    return true;
  });
  
  // Sort by imaging score
  filtered.sort((a, b) => (b.imagingScore ?? 0) - (a.imagingScore ?? 0));
  
  return filtered.slice(0, limit);
}
