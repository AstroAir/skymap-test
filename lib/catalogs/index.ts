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
  // Enhanced fuzzy search
  enhancedSearch,
  enhancedQuickSearch,
  searchWithFuzzyName,
  clearSearchIndexCache,
  type SearchOptions,
  type CatalogStats,
  type TonightsBestOptions,
  type EnhancedSearchOptions,
  type EnhancedSearchResult,
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

// Advanced Scoring Algorithms
export {
  // Airmass calculations
  calculateAirmass,
  calculateExtinction,
  getAirmassQuality,
  BORTLE_SKY_BRIGHTNESS,
  
  // Surface brightness and contrast
  calculateSurfaceBrightness,
  calculateContrastRatio,
  isObjectVisible,
  
  // Meridian transit
  calculateMeridianProximity,
  transitDuringDarkHours,
  
  // Moon impact
  calculateMoonImpact,
  getMoonSkyBrighteningMag,
  
  // Seasonal scoring
  calculateSeasonalScore,
  EXTENDED_SEASONAL_DATA,
  
  // Comprehensive imaging score
  calculateComprehensiveImagingScore,
  
  // Search matching
  calculateSearchMatch,
  levenshteinDistance,
  calculateSimilarity,
  matchCatalogPrefix,
  
  // Utility exports
  ScoringUtils,
  
  // Types
  type SeasonalObjectData,
  type ImagingScoreFactors,
  type ImagingScoreResult,
  type SearchMatchResult,
} from './scoring-algorithms';

// Fuzzy Search Engine
export {
  // String similarity algorithms
  levenshteinDistance as fuzzyLevenshtein,
  jaroSimilarity,
  jaroWinklerSimilarity,
  calculateSimilarity as fuzzyCalculateSimilarity,
  
  // Catalog notation parsing
  parseCatalogId,
  generateCatalogVariations,
  
  // Common name mappings
  COMMON_NAME_TO_CATALOG,
  PHONETIC_VARIATIONS,
  
  // Search index
  buildSearchIndex,
  
  // Fuzzy search functions
  fuzzySearch,
  quickFuzzySearch,
  weightedSearch,
  
  // Types
  type ParsedCatalogId,
  type SearchIndexEntry,
  type SearchMatch,
  type FuzzySearchOptions,
  type WeightedSearchOptions,
} from './fuzzy-search';

// Advanced Recommendation Engine
export {
  // Main engine class
  AdvancedRecommendationEngine,
  recommendationEngine,
  
  // Quick recommendation function
  getQuickRecommendations,
  
  // Utility functions
  calculateFOV,
  calculateImageScale,
  checkFOVFit,
  checkResolutionMatch,
  estimateExposure,
  checkMeridianCrossing,
  
  // Types
  type EquipmentProfile,
  type ObservingSite,
  type HorizonObstruction,
  type WeatherConditions,
  type RecommendationConfig,
  type ScoredRecommendation,
  type ScoreBreakdown,
  type ImagingWindow,
  type ImagingFeasibility,
} from './advanced-recommendation-engine';

// Celestial Search Data (shared between search hooks)
export {
  CELESTIAL_BODIES,
  POPULAR_DSOS,
  MESSIER_CATALOG,
  CONSTELLATION_SEARCH_DATA,
  DSO_NAME_INDEX,
  getMatchScore,
  getDetailedMatch as getDetailedSearchMatch,
  fuzzyMatch,
} from './celestial-search-data';

// DSO Filters (NINA-style)
export {
  // Filter application
  applyDSOFilters,
  checkAltitudeDuration,
  calculateTransitTime as calculateObjectTransitTime,
  enrichDSOWithCalculations,
  
  // Constants
  ALTITUDE_ABOVE_HORIZON_FILTER,
  DEFAULT_DSO_FILTERS,
  
  // Types
  type DSOSearchFilters,
  type DSOOrderByField,
  type DSOFilterResult,
  
  // Backward compatibility aliases (deprecated)
  applyEnhancedFilters,
  DEFAULT_ENHANCED_FILTERS,
  type EnhancedSearchFilters,
  type SkyAtlasOrderByField,
  type FilteredDSOResult,
} from './dso-filters';
