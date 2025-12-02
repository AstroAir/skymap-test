/**
 * Sky Atlas Module - Complete DSO recommendation and calculation system
 * Ported from N.I.N.A. (Nighttime Imaging 'N' Astronomy)
 */

// Types
export * from './types';

// Core Calculations
export {
  // Julian Date
  dateToJulianDate,
  julianDateToDate,
  
  // Celestial Positions
  getSunPosition,
  getMoonPosition,
  getMoonPhase,
  getMoonPhaseName,
  getMoonIllumination,
  
  // Time
  getLocalSiderealTime,
  lstToHours,
  getReferenceDate,
  
  // Rise/Set Calculations
  calculateSunRiseAndSet,
  calculateCivilTwilight,
  calculateNauticalTwilight,
  calculateAstronomicalTwilight,
  calculateMoonRiseAndSet,
  
  // Nighttime Data
  calculateNighttimeData,
  
  // Position Calculations
  calculateAltitude,
  calculateAzimuth,
  calculateAngularSeparation,
} from './nighttime-calculator';

// Deep Sky Object Calculations
export {
  calculateAltitudeData,
  calculateTransitTime,
  doesTransitSouth,
  calculateMoonDistance,
  isAboveAltitudeForDuration,
  calculateImagingScore,
  enrichDeepSkyObject,
  enrichDeepSkyObjects,
} from './deep-sky-object';

// Search Engine
export {
  createDefaultFilters,
  initializeFiltersWithNighttime,
  searchDeepSkyObjects,
  quickSearchByName,
  getCatalogStats,
  getTonightsBest,
  type SearchOptions,
  type CatalogStats,
  type TonightsBestOptions,
} from './search-engine';

// Catalog Data
export {
  DSO_CATALOG,
  getDSOById,
  getMessierObjects,
  getDSOsByConstellation,
  getDSOsByType,
} from './catalog-data';

// Store
export {
  useSkyAtlasStore,
  initializeSkyAtlas,
} from './sky-atlas-store';
