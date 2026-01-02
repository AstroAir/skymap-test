/**
 * Object Information Service
 * Fetches detailed information about celestial objects from multiple sources
 */

import { smartFetch } from './http-fetch';
import {
  useObjectInfoConfigStore,
  getActiveImageSources,
  getActiveDataSources,
  generateImageUrl,
} from './object-info-config';

// ============================================================================
// Types
// ============================================================================

export interface ObjectImage {
  url: string;
  thumbnailUrl?: string;
  source: string;
  credit: string;
  title?: string;
  width?: number;
  height?: number;
}

export interface ObjectDetailedInfo {
  // Basic info
  names: string[];
  type: string;
  typeCategory: 'galaxy' | 'nebula' | 'cluster' | 'star' | 'planet' | 'comet' | 'other';
  constellation?: string;
  
  // Astrometric data
  ra: number;
  dec: number;
  raString: string;
  decString: string;
  
  // Physical properties
  magnitude?: number;
  surfaceBrightness?: number;
  angularSize?: string; // e.g., "10.0' x 8.5'"
  angularSizeArcmin?: { width: number; height: number };
  distance?: string; // e.g., "2.5 Mly"
  distanceLy?: number;
  
  // Additional info
  description?: string;
  morphologicalType?: string; // For galaxies: Sb, E0, etc.
  spectralType?: string; // For stars: G2V, etc.
  
  // External references
  simbadUrl?: string;
  wikipediaUrl?: string;
  
  // Images from various sources
  images: ObjectImage[];
  
  // Data sources used
  sources: string[];
  
  // Loading/error state
  isLoading?: boolean;
  error?: string;
}

// Common DSO types mapping
const DSO_TYPE_MAP: Record<string, { type: string; category: ObjectDetailedInfo['typeCategory'] }> = {
  'G': { type: 'Galaxy', category: 'galaxy' },
  'Gx': { type: 'Galaxy', category: 'galaxy' },
  'GX': { type: 'Galaxy', category: 'galaxy' },
  'AGN': { type: 'Active Galactic Nucleus', category: 'galaxy' },
  'GAL': { type: 'Galaxy', category: 'galaxy' },
  'IG': { type: 'Interacting Galaxies', category: 'galaxy' },
  'GC': { type: 'Globular Cluster', category: 'cluster' },
  'Gb': { type: 'Globular Cluster', category: 'cluster' },
  'OC': { type: 'Open Cluster', category: 'cluster' },
  'OpC': { type: 'Open Cluster', category: 'cluster' },
  'C+N': { type: 'Cluster + Nebula', category: 'cluster' },
  'Cl': { type: 'Star Cluster', category: 'cluster' },
  'PN': { type: 'Planetary Nebula', category: 'nebula' },
  'Pl': { type: 'Planetary Nebula', category: 'nebula' },
  'HII': { type: 'HII Region', category: 'nebula' },
  'EN': { type: 'Emission Nebula', category: 'nebula' },
  'RN': { type: 'Reflection Nebula', category: 'nebula' },
  'DN': { type: 'Dark Nebula', category: 'nebula' },
  'SNR': { type: 'Supernova Remnant', category: 'nebula' },
  'Nb': { type: 'Nebula', category: 'nebula' },
  'Neb': { type: 'Nebula', category: 'nebula' },
  '*': { type: 'Star', category: 'star' },
  '**': { type: 'Double Star', category: 'star' },
  'V*': { type: 'Variable Star', category: 'star' },
  'QSO': { type: 'Quasar', category: 'galaxy' },
};

// ============================================================================
// Image URL Generators
// ============================================================================

/**
 * Generate DSS (Digitized Sky Survey) image URL
 */
export function getDSSImageUrl(ra: number, dec: number, size: number = 15): string {
  // Use STScI DSS server
  const raHours = ra / 15;
  const h = Math.floor(raHours);
  const m = Math.floor((raHours - h) * 60);
  const s = ((raHours - h) * 60 - m) * 60;
  
  const decSign = dec >= 0 ? '%2B' : '-';
  const decAbs = Math.abs(dec);
  const d = Math.floor(decAbs);
  const dm = Math.floor((decAbs - d) * 60);
  const ds = ((decAbs - d) * 60 - dm) * 60;
  
  const raStr = `${h.toString().padStart(2, '0')}+${m.toString().padStart(2, '0')}+${s.toFixed(1).padStart(4, '0')}`;
  const decStr = `${decSign}${d.toString().padStart(2, '0')}+${dm.toString().padStart(2, '0')}+${ds.toFixed(0).padStart(2, '0')}`;
  
  return `https://archive.stsci.edu/cgi-bin/dss_search?v=poss2ukstu_red&r=${raStr}&d=${decStr}&e=J2000&h=${size}&w=${size}&f=gif&c=none`;
}

/**
 * Generate SkyView image URL (NASA)
 */
export function getSkyViewImageUrl(ra: number, dec: number, survey: string = 'DSS2 Red', size: number = 0.25): string {
  return `https://skyview.gsfc.nasa.gov/current/cgi/runquery.pl?Position=${ra},${dec}&Survey=${encodeURIComponent(survey)}&Coordinates=J2000&Size=${size}&Pixels=500&Return=GIF`;
}

/**
 * Generate Aladin Lite preview URL
 */
export function getAladinPreviewUrl(ra: number, dec: number, fov: number = 0.25): string {
  return `https://alasky.cds.unistra.fr/hips-image-services/hips2fits?hips=CDS/P/DSS2/color&ra=${ra}&dec=${dec}&fov=${fov}&width=500&height=500&format=jpg`;
}

/**
 * Generate ESO image search URL (for reference, not direct image)
 */
export function getESOSearchUrl(objectName: string): string {
  return `https://archive.eso.org/scienceportal/home?search=${encodeURIComponent(objectName)}`;
}

/**
 * Generate Wikipedia search URL
 */
export function getWikipediaUrl(objectName: string): string {
  // Clean up the name for Wikipedia
  const cleanName = objectName
    .replace(/^(M|NGC|IC|Caldwell|C)\s*/, '$1 ')
    .replace(/\s+/g, '_');
  return `https://en.wikipedia.org/wiki/${encodeURIComponent(cleanName)}`;
}

/**
 * Generate SIMBAD URL
 */
export function getSimbadUrl(objectName: string): string {
  return `https://simbad.u-strasbg.fr/simbad/sim-basic?Ident=${encodeURIComponent(objectName)}&submit=SIMBAD+search`;
}

// ============================================================================
// Object Info Fetchers
// ============================================================================

/**
 * Parse object type from various formats
 */
export function parseObjectType(typeStr?: string): { type: string; category: ObjectDetailedInfo['typeCategory'] } {
  if (!typeStr) return { type: 'Unknown', category: 'other' };
  
  const normalized = typeStr.trim().toUpperCase();
  
  // Check direct mapping
  for (const [key, value] of Object.entries(DSO_TYPE_MAP)) {
    if (normalized === key.toUpperCase() || normalized.startsWith(key.toUpperCase())) {
      return value;
    }
  }
  
  // Check if contains known keywords
  if (normalized.includes('GALAX')) return { type: 'Galaxy', category: 'galaxy' };
  if (normalized.includes('NEBULA') || normalized.includes('NEB')) return { type: 'Nebula', category: 'nebula' };
  if (normalized.includes('CLUSTER') || normalized.includes('CL')) return { type: 'Star Cluster', category: 'cluster' };
  if (normalized.includes('STAR') || normalized === '*') return { type: 'Star', category: 'star' };
  if (normalized.includes('PLANET')) return { type: 'Planet', category: 'planet' };
  if (normalized.includes('COMET')) return { type: 'Comet', category: 'comet' };
  
  return { type: typeStr, category: 'other' };
}

/**
 * Get constellation from RA/Dec (simplified)
 * @param ra - Right ascension in degrees (reserved for boundary lookup)
 * @param dec - Declination in degrees (reserved for boundary lookup)
 */
export function getConstellation(ra: number, dec: number): string | undefined {
  // This is a simplified approximation - for accurate results, 
  // use a proper constellation boundary database
  // Parameters reserved for future implementation
  void ra;
  void dec;
  return undefined;
}

/**
 * Format angular size string
 */
export function formatAngularSize(widthArcmin?: number, heightArcmin?: number): string | undefined {
  if (!widthArcmin) return undefined;
  
  if (!heightArcmin || widthArcmin === heightArcmin) {
    if (widthArcmin < 1) {
      return `${(widthArcmin * 60).toFixed(1)}"`;
    }
    return `${widthArcmin.toFixed(1)}'`;
  }
  
  if (widthArcmin < 1 && heightArcmin < 1) {
    return `${(widthArcmin * 60).toFixed(1)}" × ${(heightArcmin * 60).toFixed(1)}"`;
  }
  return `${widthArcmin.toFixed(1)}' × ${heightArcmin.toFixed(1)}'`;
}

/**
 * Generate images for an object from configured sources
 */
export function generateObjectImages(
  ra: number,
  dec: number,
  names: string[],
  angularSizeArcmin?: number
): ObjectImage[] {
  const images: ObjectImage[] = [];
  const primaryName = names[0] || 'Object';
  const settings = useObjectInfoConfigStore.getState().settings;
  
  // Determine appropriate image size based on object size
  const imageSizeArcmin = angularSizeArcmin 
    ? Math.max(angularSizeArcmin * 2, 10) 
    : settings.defaultImageSize;
  
  // Get active image sources sorted by priority
  const activeSources = getActiveImageSources();
  
  for (const source of activeSources) {
    // Skip SDSS for southern sky
    if (source.id.includes('sdss') && dec < -10) continue;
    
    images.push({
      url: generateImageUrl(source, ra, dec, imageSizeArcmin),
      source: source.name,
      credit: source.credit,
      title: `${primaryName} - ${source.name}`,
    });
  }
  
  // Fallback to hardcoded sources if no active sources
  if (images.length === 0) {
    const imageSizeDeg = imageSizeArcmin / 60;
    images.push({
      url: getAladinPreviewUrl(ra, dec, imageSizeDeg),
      source: 'CDS/Aladin',
      credit: 'CDS Aladin Sky Atlas - DSS2 Color',
      title: `${primaryName} - DSS2 Color`,
    });
  }
  
  return images;
}

/**
 * Fetch object info from SIMBAD via TAP
 */
export async function fetchSimbadInfo(objectName: string): Promise<Partial<ObjectDetailedInfo> | null> {
  // Check if SIMBAD is enabled in config
  const dataSources = getActiveDataSources();
  const simbadSource = dataSources.find(s => s.type === 'simbad');
  
  if (!simbadSource) {
    return null; // SIMBAD is disabled
  }
  
  try {
    const query = `
      SELECT TOP 1 
        main_id, ra, dec, otype_txt, sp_type, flux_v as mag_v,
        galdim_majaxis, galdim_minaxis, morph_type
      FROM basic
      WHERE main_id = '${objectName.replace(/'/g, "''")}'
         OR ident.id = '${objectName.replace(/'/g, "''")}'
    `;
    
    const response = await smartFetch(
      `${simbadSource.baseUrl}${simbadSource.apiEndpoint}?request=doQuery&lang=adql&format=json&query=${encodeURIComponent(query)}`,
      { 
        timeout: simbadSource.timeout,
        headers: { 'Accept': 'application/json' }
      }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json<{ data?: (string | number | null)[][] }>();
    if (!data.data || data.data.length === 0) return null;
    
    const row = data.data[0];
    const typeInfo = parseObjectType(row[3] as string | undefined);
    
    return {
      names: [row[0] as string],
      type: typeInfo.type,
      typeCategory: typeInfo.category,
      ra: row[1] as number,
      dec: row[2] as number,
      spectralType: row[4] as string | undefined,
      magnitude: row[5] as number | undefined,
      angularSizeArcmin: row[6] && row[7] 
        ? { width: row[6] as number, height: row[7] as number }
        : row[6] 
          ? { width: row[6] as number, height: row[6] as number }
          : undefined,
      morphologicalType: row[8] as string | undefined,
      sources: ['SIMBAD'],
    };
  } catch (error) {
    console.warn('Failed to fetch SIMBAD info:', error);
    // Update source status to offline
    useObjectInfoConfigStore.getState().setDataSourceStatus(simbadSource.id, 'error');
    return null;
  }
}

/**
 * Get a brief description based on object type
 */
export function getObjectDescription(
  type: string, 
  category: ObjectDetailedInfo['typeCategory'],
  names: string[],
  magnitude?: number,
  distance?: string,
  morphologicalType?: string
): string {
  const primaryName = names[0] || 'This object';
  
  const descriptions: Record<string, string> = {
    'galaxy': `${primaryName} is a ${morphologicalType ? morphologicalType + ' type ' : ''}galaxy${distance ? ` located approximately ${distance} away` : ''}.${magnitude ? ` It has an apparent magnitude of ${magnitude.toFixed(1)}.` : ''}`,
    'nebula': `${primaryName} is a ${type.toLowerCase()}${distance ? ` located approximately ${distance} away` : ''}.${magnitude ? ` It has an apparent magnitude of ${magnitude.toFixed(1)}.` : ''}`,
    'cluster': `${primaryName} is a ${type.toLowerCase()}${distance ? ` located approximately ${distance} away` : ''}.${magnitude ? ` It has an apparent magnitude of ${magnitude.toFixed(1)}.` : ''}`,
    'star': `${primaryName} is a star${magnitude ? ` with an apparent magnitude of ${magnitude.toFixed(1)}` : ''}.`,
    'planet': `${primaryName} is a planet in our solar system.`,
    'comet': `${primaryName} is a comet.`,
    'other': `${primaryName}${magnitude ? ` has an apparent magnitude of ${magnitude.toFixed(1)}` : ''}.`,
  };
  
  return descriptions[category] || descriptions['other'];
}

// ============================================================================
// Main API
// ============================================================================

/**
 * Build complete object info from available data
 */
export async function getObjectDetailedInfo(
  names: string[],
  ra: number,
  dec: number,
  raString: string,
  decString: string,
  existingData?: {
    type?: string;
    magnitude?: number;
    size?: string;
  }
): Promise<ObjectDetailedInfo> {
  const primaryName = names[0] || 'Unknown Object';
  
  // Parse existing type info
  const typeInfo = parseObjectType(existingData?.type);
  
  // Parse angular size if provided
  let angularSizeArcmin: { width: number; height: number } | undefined;
  if (existingData?.size) {
    const sizeMatch = existingData.size.match(/([\d.]+)['"′]?\s*[×x]?\s*([\d.]+)?['"′]?/);
    if (sizeMatch) {
      const w = parseFloat(sizeMatch[1]);
      const h = sizeMatch[2] ? parseFloat(sizeMatch[2]) : w;
      // Assume arcminutes unless very small
      angularSizeArcmin = { width: w, height: h };
    }
  }
  
  // Generate images
  const images = generateObjectImages(
    ra, 
    dec, 
    names,
    angularSizeArcmin?.width
  );
  
  // Build base info
  const info: ObjectDetailedInfo = {
    names,
    type: typeInfo.type,
    typeCategory: typeInfo.category,
    ra,
    dec,
    raString,
    decString,
    magnitude: existingData?.magnitude,
    angularSize: existingData?.size || formatAngularSize(angularSizeArcmin?.width, angularSizeArcmin?.height),
    angularSizeArcmin,
    images,
    simbadUrl: getSimbadUrl(primaryName),
    wikipediaUrl: getWikipediaUrl(primaryName),
    sources: ['Local'],
  };
  
  // Generate description
  info.description = getObjectDescription(
    info.type,
    info.typeCategory,
    names,
    info.magnitude,
    info.distance,
    info.morphologicalType
  );
  
  return info;
}

/**
 * Fetch additional info from external sources (async enhancement)
 */
export async function enhanceObjectInfo(info: ObjectDetailedInfo): Promise<ObjectDetailedInfo> {
  try {
    const simbadInfo = await fetchSimbadInfo(info.names[0]);
    
    if (simbadInfo) {
      return {
        ...info,
        type: simbadInfo.type || info.type,
        typeCategory: simbadInfo.typeCategory || info.typeCategory,
        magnitude: simbadInfo.magnitude ?? info.magnitude,
        spectralType: simbadInfo.spectralType || info.spectralType,
        morphologicalType: simbadInfo.morphologicalType || info.morphologicalType,
        angularSizeArcmin: simbadInfo.angularSizeArcmin || info.angularSizeArcmin,
        angularSize: simbadInfo.angularSizeArcmin 
          ? formatAngularSize(simbadInfo.angularSizeArcmin.width, simbadInfo.angularSizeArcmin.height)
          : info.angularSize,
        sources: [...new Set([...info.sources, ...simbadInfo.sources || []])],
        description: getObjectDescription(
          simbadInfo.type || info.type,
          simbadInfo.typeCategory || info.typeCategory,
          info.names,
          simbadInfo.magnitude ?? info.magnitude,
          info.distance,
          simbadInfo.morphologicalType || info.morphologicalType
        ),
      };
    }
  } catch (error) {
    console.warn('Failed to enhance object info:', error);
  }
  
  return info;
}

// ============================================================================
// Cache
// ============================================================================

const objectInfoCache = new Map<string, ObjectDetailedInfo>();

/**
 * Get cached or fetch object info
 */
export async function getCachedObjectInfo(
  names: string[],
  ra: number,
  dec: number,
  raString: string,
  decString: string,
  existingData?: {
    type?: string;
    magnitude?: number;
    size?: string;
  }
): Promise<ObjectDetailedInfo> {
  const cacheKey = names[0] || `${ra.toFixed(4)}_${dec.toFixed(4)}`;
  
  if (objectInfoCache.has(cacheKey)) {
    return objectInfoCache.get(cacheKey)!;
  }
  
  const info = await getObjectDetailedInfo(names, ra, dec, raString, decString, existingData);
  objectInfoCache.set(cacheKey, info);
  
  return info;
}

/**
 * Clear the cache
 */
export function clearObjectInfoCache(): void {
  objectInfoCache.clear();
}
