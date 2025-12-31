/**
 * Advanced Scoring Algorithms for Celestial Object Search and Recommendations
 * Based on industry best practices from:
 * - N.I.N.A. Sky Atlas
 * - Telescopius
 * - Clark's Visual Astronomy Method
 * - Professional observatory planning tools (airmass.org, LCO)
 */

// ============================================================================
// Constants
// ============================================================================

const DEG_TO_RAD = Math.PI / 180;

// Bortle Scale sky brightness values (mag/arcsec²)
export const BORTLE_SKY_BRIGHTNESS: Record<number, number> = {
  1: 22.0,  // Excellent dark-sky site
  2: 21.9,  // Typical truly dark site
  3: 21.7,  // Rural sky
  4: 21.3,  // Rural/suburban transition
  5: 20.8,  // Suburban sky
  6: 20.3,  // Bright suburban sky
  7: 19.5,  // Suburban/urban transition
  8: 18.5,  // City sky
  9: 18.0,  // Inner-city sky
};

// Standard atmospheric extinction coefficient (mag/airmass)
const ATMOSPHERIC_EXTINCTION = 0.2;

// ============================================================================
// Airmass Calculation - Industry Standard
// ============================================================================

/**
 * Calculate airmass using Pickering (2002) formula
 * More accurate than simple secant(z) for low altitudes
 * 
 * Airmass represents how much atmosphere light must travel through:
 * - 1.0 = zenith (directly overhead)
 * - 1.5 = ~42° altitude (good for imaging)
 * - 2.0 = ~30° altitude (acceptable limit)
 * - 3.0 = ~19° altitude (poor conditions)
 */
export function calculateAirmass(altitudeDeg: number): number {
  if (altitudeDeg <= 0) return Infinity;
  if (altitudeDeg >= 90) return 1.0;
  
  // Pickering (2002) formula - accurate down to horizon
  const h = altitudeDeg;
  const sinArg = (h + 244 / (165 + 47 * Math.pow(h, 1.1))) * DEG_TO_RAD;
  const airmass = 1 / Math.sin(sinArg);
  
  return Math.max(1.0, airmass);
}

/**
 * Calculate atmospheric extinction in magnitudes
 */
export function calculateExtinction(altitudeDeg: number, coefficient: number = ATMOSPHERIC_EXTINCTION): number {
  const airmass = calculateAirmass(altitudeDeg);
  if (!isFinite(airmass)) return Infinity;
  return coefficient * airmass;
}

/**
 * Get airmass quality rating
 */
export function getAirmassQuality(airmass: number): 'excellent' | 'good' | 'fair' | 'poor' | 'bad' {
  if (airmass <= 1.2) return 'excellent';
  if (airmass <= 1.5) return 'good';
  if (airmass <= 2.0) return 'fair';
  if (airmass <= 3.0) return 'poor';
  return 'bad';
}

// ============================================================================
// Surface Brightness and Contrast Calculations
// ============================================================================

/**
 * Calculate surface brightness of an extended object
 * Based on Roger Clark's Visual Astronomy method
 * 
 * SB = m + 2.5 * log10(π * a * b / 4)
 * where a, b are semi-major/minor axes in arcsec
 * 
 * @param magnitude Visual magnitude
 * @param sizeMaxArcmin Major axis in arcminutes
 * @param sizeMinArcmin Minor axis in arcminutes (defaults to major)
 * @returns Surface brightness in mag/arcsec²
 */
export function calculateSurfaceBrightness(
  magnitude: number,
  sizeMaxArcmin: number,
  sizeMinArcmin?: number
): number {
  const a = (sizeMaxArcmin * 60) / 2; // Semi-major in arcsec
  const b = ((sizeMinArcmin ?? sizeMaxArcmin) * 60) / 2; // Semi-minor in arcsec
  
  if (a <= 0 || b <= 0) return magnitude; // Point source
  
  const area = Math.PI * a * b; // Area in arcsec²
  const sb = magnitude + 2.5 * Math.log10(area);
  
  return sb;
}

/**
 * Calculate contrast ratio between object and sky background
 * Higher values indicate better visibility
 * 
 * @param objectSB Object surface brightness (mag/arcsec²)
 * @param skySB Sky background brightness (mag/arcsec²)
 * @returns Contrast ratio (linear scale, >1 means object is brighter)
 */
export function calculateContrastRatio(objectSB: number, skySB: number): number {
  // Convert from magnitude scale to linear flux scale
  // Flux ratio = 10^((skySB - objectSB) / 2.5)
  const magDiff = skySB - objectSB;
  return Math.pow(10, magDiff / 2.5);
}

/**
 * Estimate visibility threshold based on Clark's method
 * Returns true if object should be visible under given conditions
 */
export function isObjectVisible(
  objectSB: number,
  skySB: number,
  objectSizeArcmin: number
): boolean {
  const contrast = calculateContrastRatio(objectSB, skySB);
  
  // Simplified visibility threshold based on object size
  // Larger objects need less contrast to be visible
  const sizeArcmin = Math.max(0.1, objectSizeArcmin);
  const requiredContrast = Math.max(0.1, 1.5 / Math.sqrt(sizeArcmin));
  
  return contrast >= requiredContrast;
}

// ============================================================================
// Meridian Transit Scoring
// ============================================================================

/**
 * Calculate how close an object is to meridian transit
 * Objects near transit are at their highest altitude
 * 
 * @returns Score 0-1, where 1 = at transit, 0 = 12h from transit
 */
export function calculateMeridianProximity(
  transitTime: Date | null,
  currentTime: Date,
  windowHours: number = 6
): number {
  if (!transitTime) return 0.5;
  
  const diffMs = Math.abs(transitTime.getTime() - currentTime.getTime());
  const diffHours = diffMs / (1000 * 60 * 60);
  
  // Use cosine falloff for smooth transition
  const normalizedDiff = Math.min(diffHours / windowHours, 1);
  return Math.cos(normalizedDiff * Math.PI / 2);
}

/**
 * Check if transit occurs during dark hours
 */
export function transitDuringDarkHours(
  transitTime: Date | null,
  darkStart: Date | null,
  darkEnd: Date | null
): boolean {
  if (!transitTime || !darkStart || !darkEnd) return false;
  
  const transitMs = transitTime.getTime();
  return transitMs >= darkStart.getTime() && transitMs <= darkEnd.getTime();
}

// ============================================================================
// Moon Impact Calculation
// ============================================================================

/**
 * Calculate moon impact score based on distance and illumination
 * Returns 0-1 where 1 = no impact, 0 = severe impact
 */
export function calculateMoonImpact(
  moonDistanceDeg: number,
  moonIllumination: number // 0-100
): number {
  // No impact if moon is new (< 5% illumination)
  if (moonIllumination < 5) return 1.0;
  
  // Calculate required safe distance based on illumination
  // Full moon (100%) needs ~90° distance for minimal impact
  // Quarter moon (50%) needs ~45° distance
  const requiredDistance = (moonIllumination / 100) * 90;
  
  if (moonDistanceDeg >= requiredDistance) {
    return 1.0;
  }
  
  // Calculate impact using exponential falloff
  const ratio = moonDistanceDeg / Math.max(1, requiredDistance);
  const impact = Math.pow(ratio, 2); // Quadratic falloff
  
  return Math.max(0, Math.min(1, impact));
}

/**
 * Get sky brightness increase due to moon
 * Returns additional magnitudes to add to sky background
 */
export function getMoonSkyBrighteningMag(
  moonDistanceDeg: number,
  moonIllumination: number,
  moonAltitudeDeg: number
): number {
  // Moon below horizon has no effect
  if (moonAltitudeDeg <= 0) return 0;
  
  // Maximum brightening at full moon, close distance
  const maxBrightening = 3.0; // mag/arcsec² increase
  
  // Distance factor (closer = more brightening)
  const distanceFactor = Math.max(0, 1 - moonDistanceDeg / 180);
  
  // Illumination factor
  const illuminationFactor = moonIllumination / 100;
  
  // Altitude factor (higher moon = more brightening)
  const altitudeFactor = Math.sin(moonAltitudeDeg * DEG_TO_RAD);
  
  return maxBrightening * distanceFactor * illuminationFactor * altitudeFactor;
}

// ============================================================================
// Seasonal and Best-Time Calculations
// ============================================================================

/**
 * Extended seasonal data for popular DSOs
 * bestMonths: optimal imaging months (1-12)
 * optimalAltitude: recommended minimum altitude for this object
 * requiresDarkSky: whether object needs dark conditions
 */
export interface SeasonalObjectData {
  bestMonths: number[];
  optimalAltitude: number;
  requiresDarkSky: boolean;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  recommendedExposure: string;
  notes?: string;
}

export const EXTENDED_SEASONAL_DATA: Record<string, SeasonalObjectData> = {
  // Galaxies
  'M31': { bestMonths: [9, 10, 11, 12, 1], optimalAltitude: 40, requiresDarkSky: false, difficulty: 'beginner', recommendedExposure: '60-180s' },
  'M33': { bestMonths: [10, 11, 12, 1], optimalAltitude: 45, requiresDarkSky: true, difficulty: 'intermediate', recommendedExposure: '180-300s', notes: 'Low surface brightness' },
  'M51': { bestMonths: [3, 4, 5, 6], optimalAltitude: 50, requiresDarkSky: false, difficulty: 'intermediate', recommendedExposure: '120-240s' },
  'M81': { bestMonths: [2, 3, 4, 5], optimalAltitude: 55, requiresDarkSky: false, difficulty: 'beginner', recommendedExposure: '90-180s' },
  'M82': { bestMonths: [2, 3, 4, 5], optimalAltitude: 55, requiresDarkSky: false, difficulty: 'beginner', recommendedExposure: '90-180s' },
  'M101': { bestMonths: [3, 4, 5, 6], optimalAltitude: 50, requiresDarkSky: true, difficulty: 'intermediate', recommendedExposure: '180-300s', notes: 'Face-on spiral, low SB' },
  'M104': { bestMonths: [4, 5, 6], optimalAltitude: 35, requiresDarkSky: false, difficulty: 'intermediate', recommendedExposure: '120-240s' },
  'M64': { bestMonths: [4, 5, 6], optimalAltitude: 45, requiresDarkSky: false, difficulty: 'intermediate', recommendedExposure: '120-240s' },
  'NGC253': { bestMonths: [10, 11, 12], optimalAltitude: 25, requiresDarkSky: false, difficulty: 'intermediate', recommendedExposure: '120-240s', notes: 'Low altitude from northern latitudes' },
  'NGC891': { bestMonths: [10, 11, 12, 1], optimalAltitude: 50, requiresDarkSky: true, difficulty: 'advanced', recommendedExposure: '300-600s' },
  
  // Nebulae
  'M42': { bestMonths: [11, 12, 1, 2, 3], optimalAltitude: 35, requiresDarkSky: false, difficulty: 'beginner', recommendedExposure: '30-120s', notes: 'HDR recommended for core' },
  'M1': { bestMonths: [11, 12, 1, 2], optimalAltitude: 45, requiresDarkSky: false, difficulty: 'beginner', recommendedExposure: '120-240s' },
  'M8': { bestMonths: [6, 7, 8], optimalAltitude: 25, requiresDarkSky: false, difficulty: 'beginner', recommendedExposure: '60-180s' },
  'M16': { bestMonths: [6, 7, 8], optimalAltitude: 30, requiresDarkSky: false, difficulty: 'intermediate', recommendedExposure: '120-300s' },
  'M17': { bestMonths: [6, 7, 8], optimalAltitude: 30, requiresDarkSky: false, difficulty: 'beginner', recommendedExposure: '90-180s' },
  'M20': { bestMonths: [6, 7, 8], optimalAltitude: 25, requiresDarkSky: false, difficulty: 'intermediate', recommendedExposure: '120-240s' },
  'M27': { bestMonths: [7, 8, 9, 10], optimalAltitude: 50, requiresDarkSky: false, difficulty: 'beginner', recommendedExposure: '90-180s' },
  'M57': { bestMonths: [6, 7, 8, 9], optimalAltitude: 55, requiresDarkSky: false, difficulty: 'beginner', recommendedExposure: '60-120s' },
  'M97': { bestMonths: [2, 3, 4, 5], optimalAltitude: 55, requiresDarkSky: true, difficulty: 'advanced', recommendedExposure: '300-600s' },
  'NGC7000': { bestMonths: [7, 8, 9, 10], optimalAltitude: 60, requiresDarkSky: true, difficulty: 'intermediate', recommendedExposure: '180-300s', notes: 'Narrowband recommended' },
  'NGC6992': { bestMonths: [7, 8, 9, 10], optimalAltitude: 55, requiresDarkSky: true, difficulty: 'intermediate', recommendedExposure: '180-300s' },
  'NGC6960': { bestMonths: [7, 8, 9, 10], optimalAltitude: 55, requiresDarkSky: true, difficulty: 'intermediate', recommendedExposure: '180-300s' },
  'IC1396': { bestMonths: [8, 9, 10, 11], optimalAltitude: 60, requiresDarkSky: true, difficulty: 'intermediate', recommendedExposure: '300-600s', notes: 'Very large, mosaic recommended' },
  'NGC2244': { bestMonths: [12, 1, 2, 3], optimalAltitude: 40, requiresDarkSky: true, difficulty: 'intermediate', recommendedExposure: '180-300s' },
  'NGC6888': { bestMonths: [7, 8, 9, 10], optimalAltitude: 55, requiresDarkSky: true, difficulty: 'advanced', recommendedExposure: '300-600s' },
  'NGC7293': { bestMonths: [9, 10, 11], optimalAltitude: 30, requiresDarkSky: true, difficulty: 'intermediate', recommendedExposure: '180-300s', notes: 'Very large angular size' },
  'IC434': { bestMonths: [11, 12, 1, 2], optimalAltitude: 40, requiresDarkSky: true, difficulty: 'intermediate', recommendedExposure: '180-300s', notes: 'Horsehead Nebula' },
  'NGC2024': { bestMonths: [11, 12, 1, 2], optimalAltitude: 40, requiresDarkSky: false, difficulty: 'intermediate', recommendedExposure: '120-240s' },
  
  // Clusters
  'M45': { bestMonths: [10, 11, 12, 1, 2], optimalAltitude: 50, requiresDarkSky: true, difficulty: 'beginner', recommendedExposure: '120-300s', notes: 'Reflection nebulosity needs dark skies' },
  'M13': { bestMonths: [5, 6, 7, 8], optimalAltitude: 55, requiresDarkSky: false, difficulty: 'beginner', recommendedExposure: '30-90s' },
  'M92': { bestMonths: [5, 6, 7, 8], optimalAltitude: 60, requiresDarkSky: false, difficulty: 'beginner', recommendedExposure: '30-90s' },
  'M22': { bestMonths: [6, 7, 8], optimalAltitude: 25, requiresDarkSky: false, difficulty: 'beginner', recommendedExposure: '30-60s' },
  'M3': { bestMonths: [4, 5, 6], optimalAltitude: 55, requiresDarkSky: false, difficulty: 'beginner', recommendedExposure: '30-90s' },
  'M5': { bestMonths: [5, 6, 7], optimalAltitude: 45, requiresDarkSky: false, difficulty: 'beginner', recommendedExposure: '30-90s' },
  
  // Double Cluster and others
  'NGC869': { bestMonths: [9, 10, 11, 12], optimalAltitude: 55, requiresDarkSky: false, difficulty: 'beginner', recommendedExposure: '30-90s', notes: 'Double Cluster h' },
  'NGC884': { bestMonths: [9, 10, 11, 12], optimalAltitude: 55, requiresDarkSky: false, difficulty: 'beginner', recommendedExposure: '30-90s', notes: 'Double Cluster χ' },
};

/**
 * Calculate seasonal score based on current month
 * @returns 0-1 where 1 = peak season, 0 = worst season
 */
export function calculateSeasonalScore(objectId: string, currentMonth: number): number {
  const seasonal = EXTENDED_SEASONAL_DATA[objectId];
  if (!seasonal) return 0.5; // Default neutral score
  
  const bestMonths = seasonal.bestMonths;
  
  // Check if current month is in best months
  if (bestMonths.includes(currentMonth)) {
    return 1.0;
  }
  
  // Calculate distance to nearest best month (accounting for year wrap)
  let minDistance = 12;
  for (const month of bestMonths) {
    const directDistance = Math.abs(month - currentMonth);
    const wrapDistance = 12 - directDistance;
    minDistance = Math.min(minDistance, directDistance, wrapDistance);
  }
  
  // Score decreases with distance from best month
  return Math.max(0, 1 - minDistance / 6);
}

// ============================================================================
// Comprehensive Imaging Score Calculator
// ============================================================================

export interface ImagingScoreFactors {
  altitude: number;          // Current or max altitude in degrees
  airmass: number;           // Calculated airmass
  moonDistance: number;      // Distance from moon in degrees
  moonIllumination: number;  // Moon illumination 0-100
  magnitude?: number;        // Object visual magnitude
  surfaceBrightness?: number; // Object surface brightness
  sizeArcmin?: number;       // Object size in arcminutes
  transitProximity?: number; // 0-1 proximity to meridian transit
  seasonalScore?: number;    // 0-1 seasonal optimality
  darkSkyRequired?: boolean; // Whether object needs dark skies
  bortleClass?: number;      // Observer's Bortle class 1-9
}

export interface ImagingScoreResult {
  totalScore: number;        // 0-100 overall score
  breakdown: {
    altitudeScore: number;   // 0-25
    airmassScore: number;    // 0-20
    moonScore: number;       // 0-20
    brightnessScore: number; // 0-15
    seasonalScore: number;   // 0-10
    transitScore: number;    // 0-10
  };
  quality: 'excellent' | 'good' | 'fair' | 'poor' | 'bad';
  recommendations: string[];
}

/**
 * Calculate comprehensive imaging score with detailed breakdown
 * Based on industry-standard algorithms from professional planning tools
 */
export function calculateComprehensiveImagingScore(factors: ImagingScoreFactors): ImagingScoreResult {
  const recommendations: string[] = [];
  const breakdown = {
    altitudeScore: 0,
    airmassScore: 0,
    moonScore: 0,
    brightnessScore: 0,
    seasonalScore: 0,
    transitScore: 0,
  };
  
  // 1. Altitude Score (0-25 points)
  // Industry standard: 40° minimum for quality imaging, 60°+ excellent
  if (factors.altitude >= 70) {
    breakdown.altitudeScore = 25;
  } else if (factors.altitude >= 60) {
    breakdown.altitudeScore = 22;
  } else if (factors.altitude >= 50) {
    breakdown.altitudeScore = 18;
  } else if (factors.altitude >= 40) {
    breakdown.altitudeScore = 14;
    recommendations.push('Good altitude, but higher would reduce atmospheric effects');
  } else if (factors.altitude >= 30) {
    breakdown.altitudeScore = 10;
    recommendations.push('Low altitude - expect some atmospheric distortion');
  } else if (factors.altitude >= 20) {
    breakdown.altitudeScore = 5;
    recommendations.push('Very low altitude - significant atmospheric effects');
  } else {
    breakdown.altitudeScore = 0;
    recommendations.push('Altitude too low for quality imaging');
  }
  
  // 2. Airmass Score (0-20 points)
  // Professional standard: < 1.5 good, < 2.0 acceptable
  const airmassQuality = getAirmassQuality(factors.airmass);
  switch (airmassQuality) {
    case 'excellent':
      breakdown.airmassScore = 20;
      break;
    case 'good':
      breakdown.airmassScore = 16;
      break;
    case 'fair':
      breakdown.airmassScore = 10;
      break;
    case 'poor':
      breakdown.airmassScore = 4;
      recommendations.push('High airmass - consider waiting for better altitude');
      break;
    case 'bad':
      breakdown.airmassScore = 0;
      recommendations.push('Airmass too high for quality imaging');
      break;
  }
  
  // 3. Moon Score (0-20 points)
  const moonImpact = calculateMoonImpact(factors.moonDistance, factors.moonIllumination);
  breakdown.moonScore = Math.round(moonImpact * 20);
  
  if (moonImpact < 0.5) {
    recommendations.push(`Moon is ${factors.moonDistance.toFixed(0)}° away at ${factors.moonIllumination.toFixed(0)}% illumination - consider narrowband filters`);
  } else if (moonImpact < 0.8 && factors.moonIllumination > 50) {
    recommendations.push('Moderate moon interference - broadband imaging may be affected');
  }
  
  // 4. Object Brightness Score (0-15 points)
  if (factors.magnitude !== undefined) {
    if (factors.magnitude <= 6) {
      breakdown.brightnessScore = 15;
    } else if (factors.magnitude <= 8) {
      breakdown.brightnessScore = 12;
    } else if (factors.magnitude <= 10) {
      breakdown.brightnessScore = 9;
    } else if (factors.magnitude <= 12) {
      breakdown.brightnessScore = 6;
    } else if (factors.magnitude <= 14) {
      breakdown.brightnessScore = 3;
      recommendations.push('Faint object - longer total integration time needed');
    } else {
      breakdown.brightnessScore = 0;
      recommendations.push('Very faint object - requires dark skies and long exposures');
    }
  } else {
    breakdown.brightnessScore = 8; // Default neutral
  }
  
  // 5. Seasonal Score (0-10 points)
  breakdown.seasonalScore = Math.round((factors.seasonalScore ?? 0.5) * 10);
  if ((factors.seasonalScore ?? 0.5) < 0.3) {
    recommendations.push('Not the optimal season for this target');
  }
  
  // 6. Transit Proximity Score (0-10 points)
  breakdown.transitScore = Math.round((factors.transitProximity ?? 0.5) * 10);
  if ((factors.transitProximity ?? 0.5) > 0.8) {
    recommendations.push('Near meridian transit - optimal imaging window');
  }
  
  // 7. Dark sky requirement check
  if (factors.darkSkyRequired && factors.bortleClass !== undefined && factors.bortleClass > 5) {
    breakdown.brightnessScore = Math.round(breakdown.brightnessScore * 0.7);
    recommendations.push('This target benefits from darker skies - consider narrowband imaging');
  }
  
  // Calculate total
  const totalScore = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
  
  // Determine quality rating
  let quality: ImagingScoreResult['quality'];
  if (totalScore >= 85) {
    quality = 'excellent';
  } else if (totalScore >= 70) {
    quality = 'good';
  } else if (totalScore >= 50) {
    quality = 'fair';
  } else if (totalScore >= 30) {
    quality = 'poor';
  } else {
    quality = 'bad';
  }
  
  return {
    totalScore,
    breakdown,
    quality,
    recommendations,
  };
}

// ============================================================================
// Search Relevance Scoring
// ============================================================================

/**
 * Calculate search relevance score for fuzzy matching
 * Combines multiple factors for better search results
 */
export interface SearchMatchResult {
  score: number;         // 0-1 match score
  matchType: 'exact' | 'prefix' | 'contains' | 'fuzzy' | 'catalog' | 'none';
  matchedField: string;  // Which field matched
}

/**
 * Levenshtein distance for fuzzy matching
 */
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

/**
 * Calculate normalized similarity score from Levenshtein distance
 */
export function calculateSimilarity(a: string, b: string): number {
  const maxLength = Math.max(a.length, b.length);
  if (maxLength === 0) return 1;
  
  const distance = levenshteinDistance(a.toLowerCase(), b.toLowerCase());
  return 1 - distance / maxLength;
}

/**
 * Match against catalog prefixes (M, NGC, IC, etc.)
 */
export function matchCatalogPrefix(query: string, objectName: string): SearchMatchResult | null {
  const queryUpper = query.toUpperCase().trim();
  const nameUpper = objectName.toUpperCase();
  
  // Define catalog patterns
  const patterns = [
    { prefix: 'M', regex: /^M\s*(\d+)$/ },
    { prefix: 'NGC', regex: /^NGC\s*(\d+)$/ },
    { prefix: 'IC', regex: /^IC\s*(\d+)$/ },
    { prefix: 'C', regex: /^C\s*(\d+)$/ },     // Caldwell
    { prefix: 'SH2', regex: /^SH2[-\s]*(\d+)$/ }, // Sharpless
    { prefix: 'B', regex: /^B\s*(\d+)$/ },     // Barnard
    { prefix: 'VDB', regex: /^VDB\s*(\d+)$/ }, // van den Bergh
  ];
  
  for (const { prefix, regex } of patterns) {
    const queryMatch = queryUpper.match(regex);
    const nameMatch = nameUpper.match(new RegExp(`^${prefix}\\s*(\\d+)$`));
    
    if (queryMatch && nameMatch) {
      if (queryMatch[1] === nameMatch[1]) {
        return { score: 1.0, matchType: 'catalog', matchedField: 'name' };
      }
    }
  }
  
  return null;
}

/**
 * Advanced search matching with multiple strategies
 */
export function calculateSearchMatch(
  query: string,
  name: string,
  alternateNames?: string[],
  commonName?: string
): SearchMatchResult {
  const queryLower = query.toLowerCase().trim();
  const nameLower = name.toLowerCase();
  
  // 1. Check catalog prefix match
  const catalogMatch = matchCatalogPrefix(query, name);
  if (catalogMatch) return catalogMatch;
  
  // 2. Exact match
  if (nameLower === queryLower) {
    return { score: 1.0, matchType: 'exact', matchedField: 'name' };
  }
  
  // 3. Check common name exact match
  if (commonName && commonName.toLowerCase() === queryLower) {
    return { score: 0.98, matchType: 'exact', matchedField: 'commonName' };
  }
  
  // 4. Prefix match
  if (nameLower.startsWith(queryLower)) {
    return { score: 0.9, matchType: 'prefix', matchedField: 'name' };
  }
  
  if (commonName && commonName.toLowerCase().startsWith(queryLower)) {
    return { score: 0.88, matchType: 'prefix', matchedField: 'commonName' };
  }
  
  // 5. Contains match
  if (nameLower.includes(queryLower)) {
    return { score: 0.7, matchType: 'contains', matchedField: 'name' };
  }
  
  if (commonName && commonName.toLowerCase().includes(queryLower)) {
    return { score: 0.68, matchType: 'contains', matchedField: 'commonName' };
  }
  
  // 6. Check alternate names
  if (alternateNames) {
    for (const altName of alternateNames) {
      const altLower = altName.toLowerCase();
      if (altLower === queryLower) {
        return { score: 0.95, matchType: 'exact', matchedField: 'alternateName' };
      }
      if (altLower.startsWith(queryLower)) {
        return { score: 0.85, matchType: 'prefix', matchedField: 'alternateName' };
      }
      if (altLower.includes(queryLower)) {
        return { score: 0.65, matchType: 'contains', matchedField: 'alternateName' };
      }
    }
  }
  
  // 7. Fuzzy matching using Levenshtein distance
  const similarity = calculateSimilarity(queryLower, nameLower);
  if (similarity >= 0.6) {
    return { score: similarity * 0.6, matchType: 'fuzzy', matchedField: 'name' };
  }
  
  // Also check common name fuzzy match
  if (commonName) {
    const commonSimilarity = calculateSimilarity(queryLower, commonName.toLowerCase());
    if (commonSimilarity >= 0.6) {
      return { score: commonSimilarity * 0.55, matchType: 'fuzzy', matchedField: 'commonName' };
    }
  }
  
  return { score: 0, matchType: 'none', matchedField: '' };
}

// ============================================================================
// Utility Exports
// ============================================================================

export const ScoringUtils = {
  calculateAirmass,
  calculateExtinction,
  getAirmassQuality,
  calculateSurfaceBrightness,
  calculateContrastRatio,
  isObjectVisible,
  calculateMeridianProximity,
  transitDuringDarkHours,
  calculateMoonImpact,
  getMoonSkyBrighteningMag,
  calculateSeasonalScore,
  calculateComprehensiveImagingScore,
  calculateSearchMatch,
  levenshteinDistance,
  calculateSimilarity,
};

export default ScoringUtils;
