/**
 * Celestial Object Icons Service
 * Fetches and caches icons for celestial objects from various sources
 */

import { createLogger } from '@/lib/logger';

const logger = createLogger('celestial-icons');

// ============================================================================
// Types
// ============================================================================

export interface CelestialIconInfo {
  id: string;
  name: string;
  iconUrl?: string;
  thumbnailUrl?: string;
  imageUrl?: string;
  source: string;
  type: 'galaxy' | 'nebula' | 'cluster' | 'star' | 'planet' | 'moon' | 'comet' | 'asteroid' | 'satellite' | 'other';
}

// ============================================================================
// Icon Sources Configuration
// ============================================================================

// Icon sources for reference (used in fetch functions)
export const ICON_SOURCES = {
  // NASA APOD for famous objects
  nasa: 'https://api.nasa.gov/planetary/apod',
  // Stellarium Web thumbnails
  stellarium: 'https://stellarium-web.org/api/v1',
  // Wikipedia for object images
  wikipedia: 'https://en.wikipedia.org/api/rest_v1',
  // Simbad for astronomical data
  simbad: 'https://simbad.u-strasbg.fr/simbad',
};

// ============================================================================
// Famous Objects Database
// ============================================================================

const FAMOUS_OBJECTS: Record<string, CelestialIconInfo> = {
  // Messier Objects
  'M1': { id: 'M1', name: 'Crab Nebula', type: 'nebula', source: 'local', thumbnailUrl: '/icons/dso/m1.jpg' },
  'M31': { id: 'M31', name: 'Andromeda Galaxy', type: 'galaxy', source: 'local', thumbnailUrl: '/icons/dso/m31.jpg' },
  'M42': { id: 'M42', name: 'Orion Nebula', type: 'nebula', source: 'local', thumbnailUrl: '/icons/dso/m42.jpg' },
  'M45': { id: 'M45', name: 'Pleiades', type: 'cluster', source: 'local', thumbnailUrl: '/icons/dso/m45.jpg' },
  'M51': { id: 'M51', name: 'Whirlpool Galaxy', type: 'galaxy', source: 'local', thumbnailUrl: '/icons/dso/m51.jpg' },
  'M57': { id: 'M57', name: 'Ring Nebula', type: 'nebula', source: 'local', thumbnailUrl: '/icons/dso/m57.jpg' },
  'M81': { id: 'M81', name: 'Bode\'s Galaxy', type: 'galaxy', source: 'local', thumbnailUrl: '/icons/dso/m81.jpg' },
  'M101': { id: 'M101', name: 'Pinwheel Galaxy', type: 'galaxy', source: 'local', thumbnailUrl: '/icons/dso/m101.jpg' },
  'M104': { id: 'M104', name: 'Sombrero Galaxy', type: 'galaxy', source: 'local', thumbnailUrl: '/icons/dso/m104.jpg' },
  
  // NGC Objects
  'NGC7000': { id: 'NGC7000', name: 'North America Nebula', type: 'nebula', source: 'local', thumbnailUrl: '/icons/dso/ngc7000.jpg' },
  'NGC6992': { id: 'NGC6992', name: 'Veil Nebula', type: 'nebula', source: 'local', thumbnailUrl: '/icons/dso/ngc6992.jpg' },
  'NGC2237': { id: 'NGC2237', name: 'Rosette Nebula', type: 'nebula', source: 'local', thumbnailUrl: '/icons/dso/ngc2237.jpg' },
  
  // Planets
  'Mercury': { id: 'Mercury', name: 'Mercury', type: 'planet', source: 'local', thumbnailUrl: '/icons/planets/mercury.jpg' },
  'Venus': { id: 'Venus', name: 'Venus', type: 'planet', source: 'local', thumbnailUrl: '/icons/planets/venus.jpg' },
  'Mars': { id: 'Mars', name: 'Mars', type: 'planet', source: 'local', thumbnailUrl: '/icons/planets/mars.jpg' },
  'Jupiter': { id: 'Jupiter', name: 'Jupiter', type: 'planet', source: 'local', thumbnailUrl: '/icons/planets/jupiter.jpg' },
  'Saturn': { id: 'Saturn', name: 'Saturn', type: 'planet', source: 'local', thumbnailUrl: '/icons/planets/saturn.jpg' },
  'Uranus': { id: 'Uranus', name: 'Uranus', type: 'planet', source: 'local', thumbnailUrl: '/icons/planets/uranus.jpg' },
  'Neptune': { id: 'Neptune', name: 'Neptune', type: 'planet', source: 'local', thumbnailUrl: '/icons/planets/neptune.jpg' },
  
  // Moon
  'Moon': { id: 'Moon', name: 'Moon', type: 'moon', source: 'local', thumbnailUrl: '/icons/planets/moon.jpg' },
  
  // Famous Stars
  'Sirius': { id: 'Sirius', name: 'Sirius', type: 'star', source: 'local', thumbnailUrl: '/icons/stars/sirius.jpg' },
  'Vega': { id: 'Vega', name: 'Vega', type: 'star', source: 'local', thumbnailUrl: '/icons/stars/vega.jpg' },
  'Betelgeuse': { id: 'Betelgeuse', name: 'Betelgeuse', type: 'star', source: 'local', thumbnailUrl: '/icons/stars/betelgeuse.jpg' },
  'Polaris': { id: 'Polaris', name: 'Polaris', type: 'star', source: 'local', thumbnailUrl: '/icons/stars/polaris.jpg' },
};

// ============================================================================
// Satellite Icons
// ============================================================================

export const SATELLITE_ICONS: Record<string, string> = {
  iss: '🛰️',
  starlink: '📡',
  weather: '🌤️',
  gps: '📍',
  communication: '📶',
  scientific: '🔬',
  amateur: '📻',
  other: '⚫',
};

// SVG icons for satellites (for rendering on canvas)
export const SATELLITE_SVG_ICONS: Record<string, string> = {
  iss: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`,
  starlink: `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="3"/><path d="M12 1v6M12 17v6M1 12h6M17 12h6"/></svg>`,
  default: `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="4"/></svg>`,
};

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get icon info for a celestial object by name
 */
export function getCelestialIcon(name: string): CelestialIconInfo | null {
  // Normalize name
  const normalizedName = name.toUpperCase().replace(/\s+/g, '');
  
  // Check famous objects database
  for (const [key, info] of Object.entries(FAMOUS_OBJECTS)) {
    if (normalizedName.includes(key.toUpperCase()) || key.toUpperCase().includes(normalizedName)) {
      return info;
    }
  }
  
  // Check by common names
  const lowerName = name.toLowerCase();
  for (const info of Object.values(FAMOUS_OBJECTS)) {
    if (info.name.toLowerCase().includes(lowerName) || lowerName.includes(info.name.toLowerCase())) {
      return info;
    }
  }
  
  return null;
}

/**
 * Fetch object image from Wikipedia
 */
export async function fetchWikipediaImage(objectName: string): Promise<string | null> {
  try {
    const searchName = encodeURIComponent(objectName.replace(/\s+/g, '_'));
    const response = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${searchName}`,
      { next: { revalidate: 86400 * 7 } } // Cache for 7 days
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.thumbnail?.source || data.originalimage?.source || null;
  } catch {
    return null;
  }
}

/**
 * Fetch object data from SIMBAD
 */
export async function fetchSimbadData(objectName: string): Promise<{
  type: string;
  ra: number;
  dec: number;
  magnitude?: number;
} | null> {
  try {
    const response = await fetch(
      `https://simbad.u-strasbg.fr/simbad/sim-id?output.format=json&Ident=${encodeURIComponent(objectName)}`,
      { next: { revalidate: 86400 } }
    );
    
    if (!response.ok) return null;
    
    const responseData = await response.json();
    // Parse SIMBAD response (simplified)
    if (responseData && responseData.data) {
      return {
        type: responseData.data.otype || 'unknown',
        ra: responseData.data.ra || 0,
        dec: responseData.data.dec || 0,
        magnitude: responseData.data.mag,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Get DSS (Digitized Sky Survey) image URL for coordinates
 */
export function getDSSImageUrl(ra: number, dec: number, size: number = 15): string {
  // Convert RA from degrees to hours
  const raHours = ra / 15;
  const raH = Math.floor(raHours);
  const raM = Math.floor((raHours - raH) * 60);
  const raS = ((raHours - raH) * 60 - raM) * 60;
  
  // Format Dec
  const decSign = dec >= 0 ? '+' : '-';
  const absDec = Math.abs(dec);
  const decD = Math.floor(absDec);
  const decM = Math.floor((absDec - decD) * 60);
  const decS = ((absDec - decD) * 60 - decM) * 60;
  
  const raStr = `${raH.toString().padStart(2, '0')}+${raM.toString().padStart(2, '0')}+${raS.toFixed(1).padStart(4, '0')}`;
  const decStr = `${decSign}${decD.toString().padStart(2, '0')}+${decM.toString().padStart(2, '0')}+${decS.toFixed(1).padStart(4, '0')}`;
  
  return `https://archive.stsci.edu/cgi-bin/dss_search?v=poss2ukstu_red&r=${raStr}&d=${decStr}&e=J2000&h=${size}&w=${size}&f=gif&c=none&fov=NONE&v3=`;
}

/**
 * Get Aladin Lite preview URL
 */
export function getAladinPreviewUrl(ra: number, dec: number, fov: number = 0.5): string {
  return `https://alasky.u-strasbg.fr/hips-image-services/hips2fits?hips=CDS%2FP%2FDSS2%2Fcolor&ra=${ra}&dec=${dec}&fov=${fov}&width=200&height=200`;
}

// ============================================================================
// Icon Cache
// ============================================================================

const iconCache = new Map<string, CelestialIconInfo>();

/**
 * Get or fetch icon for an object
 */
export async function getOrFetchIcon(name: string, ra?: number, dec?: number): Promise<CelestialIconInfo | null> {
  // Check cache
  const cacheKey = name.toLowerCase();
  if (iconCache.has(cacheKey)) {
    return iconCache.get(cacheKey)!;
  }
  
  // Check local database
  const localIcon = getCelestialIcon(name);
  if (localIcon) {
    iconCache.set(cacheKey, localIcon);
    return localIcon;
  }
  
  // Try to fetch from Wikipedia
  const wikiImage = await fetchWikipediaImage(name);
  if (wikiImage) {
    const info: CelestialIconInfo = {
      id: name,
      name: name,
      thumbnailUrl: wikiImage,
      source: 'wikipedia',
      type: 'other',
    };
    iconCache.set(cacheKey, info);
    return info;
  }
  
  // If we have coordinates, use DSS
  if (ra !== undefined && dec !== undefined) {
    const info: CelestialIconInfo = {
      id: name,
      name: name,
      thumbnailUrl: getAladinPreviewUrl(ra, dec),
      source: 'aladin',
      type: 'other',
    };
    iconCache.set(cacheKey, info);
    return info;
  }
  
  return null;
}

// ============================================================================
// Satellite Rendering Helpers
// ============================================================================

export interface SatelliteRenderInfo {
  id: string;
  name: string;
  x: number;
  y: number;
  type: string;
  color: string;
  size: number;
  visible: boolean;
  altitude: number;
  velocity: number;
}

/**
 * Get color for satellite type
 */
export function getSatelliteColor(type: string): string {
  switch (type) {
    case 'iss': return '#3b82f6'; // blue
    case 'starlink': return '#a855f7'; // purple
    case 'weather': return '#06b6d4'; // cyan
    case 'gps': return '#22c55e'; // green
    case 'communication': return '#f97316'; // orange
    case 'scientific': return '#ec4899'; // pink
    case 'amateur': return '#eab308'; // yellow
    default: return '#6b7280'; // gray
  }
}

/**
 * Calculate satellite screen position from TLE
 * This is a simplified version - real implementation would use SGP4/SDP4
 * 
 * @param tle - Two-line element set for the satellite
 * @param observerLat - Observer latitude in degrees
 * @param observerLng - Observer longitude in degrees  
 * @param observerAlt - Observer altitude in meters
 * @param timestamp - Time for calculation
 * @returns Position data or null if calculation not available
 */
export function calculateSatellitePosition(
  tle: { line1: string; line2: string },
  observerLat: number,
  observerLng: number,
  observerAlt: number,
  timestamp: Date
): { ra: number; dec: number; alt: number; az: number; visible: boolean } | null {
  // This would require a proper SGP4 implementation (e.g., satellite.js library)
  // Log parameters for debugging purposes
  if (process.env.NODE_ENV === 'development') {
    logger.debug('calculateSatellitePosition called with', {
      tle: tle.line1.substring(0, 20) + '...',
      observer: { lat: observerLat, lng: observerLng, alt: observerAlt },
      time: timestamp.toISOString(),
    });
  }
  // For now, return null to indicate we need the actual library
  return null;
}
