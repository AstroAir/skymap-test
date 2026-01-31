/**
 * HiPS survey service
 */

import type { 
  HiPSSurvey, 
  HiPSRegistry, 
  HiPSRegistryEntry, 
  HiPSCategory 
} from './types';
import { createLogger } from '@/lib/logger';

const logger = createLogger('hips-service');

// ============================================================================
// Registry URL
// ============================================================================

const ALADIN_REGISTRY_URL = 'https://aladin.cds.unistra.fr/hips/list';

// ============================================================================
// Default Surveys
// ============================================================================

export const DEFAULT_SURVEYS: HiPSSurvey[] = [
  {
    id: 'dss-color',
    name: 'DSS Color',
    url: 'https://alasky.cds.unistra.fr/DSS/DSSColor/',
    category: 'optical',
    description: 'Digitized Sky Survey - Color composite',
    isDefault: true,
  },
  {
    id: 'panstarrs',
    name: 'PanSTARRS DR1',
    url: 'https://alasky.cds.unistra.fr/Pan-STARRS/DR1/color-z-zg-g/',
    category: 'optical',
    description: 'Pan-STARRS Data Release 1',
  },
  {
    id: '2mass-color',
    name: '2MASS Color',
    url: 'https://alasky.cds.unistra.fr/2MASS/Color/',
    category: 'infrared',
    description: 'Two Micron All Sky Survey',
  },
  {
    id: 'mellinger',
    name: 'Mellinger Color',
    url: 'https://alasky.cds.unistra.fr/Mellinger/',
    category: 'optical',
    description: 'Axel Mellinger all-sky panorama',
  },
  {
    id: 'sdss9',
    name: 'SDSS9 Color',
    url: 'https://alasky.cds.unistra.fr/SDSS/DR9/color/',
    category: 'optical',
    description: 'Sloan Digital Sky Survey DR9',
  },
  {
    id: 'wise-allsky',
    name: 'WISE AllSky',
    url: 'https://alasky.cds.unistra.fr/AllWISE/RGB-W4-W2-W1/',
    category: 'infrared',
    description: 'Wide-field Infrared Survey Explorer',
  },
  {
    id: 'fermi-color',
    name: 'Fermi LAT',
    url: 'https://alasky.cds.unistra.fr/Fermi/Color/',
    category: 'gamma',
    description: 'Fermi Gamma-ray Space Telescope',
  },
];

// ============================================================================
// Registry Cache
// ============================================================================

let registryCache: HiPSRegistry | null = null;

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Fetch HiPS registry from Aladin
 */
export async function fetchRegistry(): Promise<HiPSRegistry> {
  if (registryCache && Date.now() - registryCache.lastUpdated.getTime() < 86400000) {
    return registryCache;
  }
  
  try {
    const response = await fetch(ALADIN_REGISTRY_URL, {
      headers: { Accept: 'application/json' },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data: HiPSRegistryEntry[] = await response.json();
    const surveys = parseRegistryEntries(data);
    
    registryCache = {
      surveys,
      lastUpdated: new Date(),
    };
    
    return registryCache;
  } catch (error) {
    logger.warn('Failed to fetch HiPS registry, using defaults', error);
    return {
      surveys: DEFAULT_SURVEYS,
      lastUpdated: new Date(),
    };
  }
}

/**
 * Get surveys by category
 */
export async function getSurveysByCategory(
  category: HiPSCategory
): Promise<HiPSSurvey[]> {
  const registry = await fetchRegistry();
  return registry.surveys.filter(s => s.category === category);
}

/**
 * Get recommended surveys
 */
export function getRecommendedSurveys(): HiPSSurvey[] {
  return DEFAULT_SURVEYS;
}

/**
 * Get survey by ID
 */
export async function getSurveyById(id: string): Promise<HiPSSurvey | null> {
  const registry = await fetchRegistry();
  return registry.surveys.find(s => s.id === id) ?? null;
}

/**
 * Get default survey
 */
export function getDefaultSurvey(): HiPSSurvey {
  return DEFAULT_SURVEYS.find(s => s.isDefault) ?? DEFAULT_SURVEYS[0];
}

/**
 * Generate tile URL for a HiPS survey
 */
export function getTileUrl(
  survey: HiPSSurvey,
  order: number,
  pixelIndex: number,
  format: 'jpg' | 'png' = 'jpg'
): string {
  const dir = Math.floor(pixelIndex / 10000) * 10000;
  return `${survey.url}/Norder${order}/Dir${dir}/Npix${pixelIndex}.${format}`;
}

/**
 * Estimate cache size for a survey at given order
 */
export function estimateCacheSize(maxOrder: number): number {
  // HEALPix: 12 * 4^order tiles
  let totalTiles = 0;
  for (let order = 0; order <= maxOrder; order++) {
    totalTiles += 12 * Math.pow(4, order);
  }
  // Assume average 50KB per tile
  return totalTiles * 50 * 1024;
}

// ============================================================================
// Helper Functions
// ============================================================================

function parseRegistryEntries(entries: HiPSRegistryEntry[]): HiPSSurvey[] {
  return entries
    .filter(e => e.hips_service_url && e.obs_title)
    .map(e => ({
      id: e.ID.replace(/\//g, '-'),
      name: e.obs_title,
      url: e.hips_service_url,
      category: parseCategory(e.obs_regime || e.client_category),
      maxOrder: e.hips_order ? parseInt(e.hips_order) : undefined,
      tileFormat: parseTileFormat(e.hips_tile_format),
    }));
}

function parseCategory(regime?: string): HiPSCategory {
  if (!regime) return 'optical';
  
  const lower = regime.toLowerCase();
  if (lower.includes('optical') || lower.includes('vis')) return 'optical';
  if (lower.includes('infrared') || lower.includes('ir')) return 'infrared';
  if (lower.includes('radio')) return 'radio';
  if (lower.includes('uv') || lower.includes('ultra')) return 'uv';
  if (lower.includes('xray') || lower.includes('x-ray')) return 'xray';
  if (lower.includes('gamma')) return 'gamma';
  return 'other';
}

function parseTileFormat(format?: string): 'jpg' | 'png' | 'webp' | undefined {
  if (!format) return undefined;
  if (format.includes('png')) return 'png';
  if (format.includes('webp')) return 'webp';
  return 'jpg';
}
