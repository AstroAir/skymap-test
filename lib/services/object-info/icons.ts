/**
 * Celestial object icons and images service
 */

import type { ObjectCategory } from './types';
import { getDSSImageUrl } from './config';

// ============================================================================
// Icon Mappings
// ============================================================================

/**
 * Emoji icons for object categories
 */
export const CATEGORY_ICONS: Record<ObjectCategory, string> = {
  galaxy: '🌀',
  nebula: '☁️',
  cluster: '✨',
  star: '⭐',
  planet: '🪐',
  moon: '🌙',
  comet: '☄️',
  asteroid: '🪨',
  artificial: '🛰️',
  unknown: '❓',
};

/**
 * Get icon for object category
 */
export function getCategoryIcon(category: ObjectCategory): string {
  return CATEGORY_ICONS[category] || CATEGORY_ICONS.unknown;
}

// ============================================================================
// Famous Objects Database
// ============================================================================

interface FamousObject {
  names: string[];
  category: ObjectCategory;
  imageUrl?: string;
  thumbnailUrl?: string;
}

/**
 * Database of famous objects with known images
 */
export const FAMOUS_OBJECTS: FamousObject[] = [
  {
    names: ['M31', 'NGC 224', 'Andromeda Galaxy'],
    category: 'galaxy',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Andromeda_Galaxy_%28with_h-alpha%29.jpg/1280px-Andromeda_Galaxy_%28with_h-alpha%29.jpg',
  },
  {
    names: ['M42', 'NGC 1976', 'Orion Nebula'],
    category: 'nebula',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Orion_Nebula_-_Hubble_2006_mosaic_18000.jpg/1280px-Orion_Nebula_-_Hubble_2006_mosaic_18000.jpg',
  },
  {
    names: ['M45', 'Pleiades', 'Seven Sisters'],
    category: 'cluster',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Pleiades_large.jpg/1280px-Pleiades_large.jpg',
  },
  {
    names: ['M51', 'NGC 5194', 'Whirlpool Galaxy'],
    category: 'galaxy',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Messier51_sRGB.jpg/1280px-Messier51_sRGB.jpg',
  },
  {
    names: ['M57', 'NGC 6720', 'Ring Nebula'],
    category: 'nebula',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/M57_The_Ring_Nebula.JPG/1280px-M57_The_Ring_Nebula.JPG',
  },
  {
    names: ['M104', 'NGC 4594', 'Sombrero Galaxy'],
    category: 'galaxy',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/M104_ngc4594_sombrero_galaxy_hi-res.jpg/1280px-M104_ngc4594_sombrero_galaxy_hi-res.jpg',
  },
  {
    names: ['NGC 7000', 'North America Nebula'],
    category: 'nebula',
  },
  {
    names: ['NGC 7293', 'Helix Nebula'],
    category: 'nebula',
  },
  {
    names: ['M1', 'NGC 1952', 'Crab Nebula'],
    category: 'nebula',
  },
  {
    names: ['M13', 'NGC 6205', 'Hercules Cluster'],
    category: 'cluster',
  },
];

/**
 * Find famous object by name
 */
export function findFamousObject(name: string): FamousObject | undefined {
  const lower = name.toLowerCase();
  return FAMOUS_OBJECTS.find(obj => 
    obj.names.some(n => n.toLowerCase() === lower)
  );
}

// ============================================================================
// Image URL Generation
// ============================================================================

/**
 * Get the best available image URL for an object
 */
export function getObjectImageUrl(
  objectName: string,
  ra?: number,
  dec?: number,
  preferredSize: number = 30
): string | null {
  // Check famous objects first
  const famous = findFamousObject(objectName);
  if (famous?.imageUrl) {
    return famous.imageUrl;
  }
  
  // Fall back to DSS if coordinates available
  if (ra !== undefined && dec !== undefined) {
    return getDSSImageUrl(ra, dec, preferredSize);
  }
  
  return null;
}

/**
 * Get thumbnail URL
 */
export function getObjectThumbnailUrl(
  objectName: string,
  ra?: number,
  dec?: number
): string | null {
  return getObjectImageUrl(objectName, ra, dec, 10);
}

// ============================================================================
// Satellite Icons
// ============================================================================

/**
 * Get icon for satellite type
 */
export function getSatelliteIcon(satelliteName: string): string {
  const lower = satelliteName.toLowerCase();
  
  if (lower.includes('iss') || lower.includes('zarya')) return '🛸';
  if (lower.includes('starlink')) return '📡';
  if (lower.includes('tiangong') || lower.includes('tianhe')) return '🚀';
  if (lower.includes('hubble') || lower.includes('hst')) return '🔭';
  if (lower.includes('weather') || lower.includes('goes')) return '🌤️';
  if (lower.includes('gps') || lower.includes('navstar')) return '📍';
  
  return '🛰️';
}

/**
 * Get SVG marker for satellite on star map
 */
export function getSatelliteMarkerSvg(color: string = '#00ff00'): string {
  return `<svg viewBox="0 0 24 24" fill="${color}">
    <circle cx="12" cy="12" r="4"/>
    <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="${color}" stroke-width="2"/>
  </svg>`;
}
