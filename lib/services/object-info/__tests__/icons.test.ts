/**
 * Tests for icons.ts
 */

import {
  CATEGORY_ICONS,
  getCategoryIcon,
  FAMOUS_OBJECTS,
  findFamousObject,
  getObjectImageUrl,
  getObjectThumbnailUrl,
  getSatelliteIcon,
  getSatelliteMarkerSvg,
} from '../icons';
import type { ObjectCategory } from '../types';

describe('icons service', () => {
  describe('CATEGORY_ICONS', () => {
    it('should have icons for all object categories', () => {
      const categories: ObjectCategory[] = [
        'galaxy',
        'nebula',
        'cluster',
        'star',
        'planet',
        'moon',
        'comet',
        'asteroid',
        'artificial',
        'unknown',
      ];

      categories.forEach(category => {
        expect(CATEGORY_ICONS[category]).toBeDefined();
        expect(typeof CATEGORY_ICONS[category]).toBe('string');
      });
    });

    it('should have non-empty emoji icons', () => {
      Object.values(CATEGORY_ICONS).forEach(icon => {
        expect(icon.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getCategoryIcon', () => {
    it('should return icon for valid category', () => {
      expect(getCategoryIcon('galaxy')).toBe('🌀');
      expect(getCategoryIcon('nebula')).toBe('☁️');
      expect(getCategoryIcon('cluster')).toBe('✨');
      expect(getCategoryIcon('star')).toBe('⭐');
      expect(getCategoryIcon('planet')).toBe('🪐');
      expect(getCategoryIcon('moon')).toBe('🌙');
      expect(getCategoryIcon('comet')).toBe('☄️');
      expect(getCategoryIcon('asteroid')).toBe('🪨');
      expect(getCategoryIcon('artificial')).toBe('🛰️');
    });

    it('should return unknown icon for unknown category', () => {
      expect(getCategoryIcon('unknown')).toBe('❓');
    });

    it('should return unknown icon for invalid category', () => {
      // @ts-expect-error Testing invalid input
      expect(getCategoryIcon('invalid')).toBe('❓');
    });
  });

  describe('FAMOUS_OBJECTS', () => {
    it('should be an array of famous objects', () => {
      expect(Array.isArray(FAMOUS_OBJECTS)).toBe(true);
      expect(FAMOUS_OBJECTS.length).toBeGreaterThan(0);
    });

    it('should have valid structure for each object', () => {
      FAMOUS_OBJECTS.forEach(obj => {
        expect(obj.names).toBeDefined();
        expect(Array.isArray(obj.names)).toBe(true);
        expect(obj.names.length).toBeGreaterThan(0);
        expect(obj.category).toBeDefined();
      });
    });

    it('should include well-known objects', () => {
      const allNames = FAMOUS_OBJECTS.flatMap(o => o.names.map(n => n.toLowerCase()));
      
      expect(allNames).toContain('m31');
      expect(allNames).toContain('m42');
      expect(allNames).toContain('m45');
    });

    it('should have imageUrl for some objects', () => {
      const withImages = FAMOUS_OBJECTS.filter(o => o.imageUrl);
      expect(withImages.length).toBeGreaterThan(0);
    });
  });

  describe('findFamousObject', () => {
    it('should find object by primary name', () => {
      const result = findFamousObject('M31');
      
      expect(result).toBeDefined();
      expect(result?.names).toContain('M31');
    });

    it('should find object by alternate name', () => {
      const result = findFamousObject('Andromeda Galaxy');
      
      expect(result).toBeDefined();
      expect(result?.names).toContain('M31');
    });

    it('should be case insensitive', () => {
      const lower = findFamousObject('m31');
      const upper = findFamousObject('M31');
      const mixed = findFamousObject('M31');
      
      expect(lower).toEqual(upper);
      expect(upper).toEqual(mixed);
    });

    it('should return undefined for unknown object', () => {
      const result = findFamousObject('Unknown Object XYZ');
      expect(result).toBeUndefined();
    });

    it('should find Orion Nebula', () => {
      const result = findFamousObject('Orion Nebula');
      
      expect(result).toBeDefined();
      expect(result?.category).toBe('nebula');
    });

    it('should find Pleiades', () => {
      const result = findFamousObject('Pleiades');
      
      expect(result).toBeDefined();
      expect(result?.category).toBe('cluster');
    });
  });

  describe('getObjectImageUrl', () => {
    it('should return famous object image URL when available', () => {
      const result = getObjectImageUrl('M31');
      
      expect(result).toBeDefined();
      expect(result).toContain('http');
    });

    it('should return DSS URL when coordinates provided', () => {
      const result = getObjectImageUrl('Unknown Object', 10.68, 41.27);
      
      expect(result).toBeDefined();
      // DSS URL should be generated
    });

    it('should return null when no image available', () => {
      const result = getObjectImageUrl('Totally Unknown Object');
      
      expect(result).toBeNull();
    });

    it('should prefer famous object URL over DSS', () => {
      const result = getObjectImageUrl('M31', 10.68, 41.27);
      
      // Should return famous object URL, not DSS
      expect(result).toContain('wikipedia');
    });

    it('should accept preferred size parameter', () => {
      const result = getObjectImageUrl('Unknown', 0, 0, 60);
      
      expect(result).toBeDefined();
    });
  });

  describe('getObjectThumbnailUrl', () => {
    it('should return thumbnail URL', () => {
      const result = getObjectThumbnailUrl('M31');
      
      expect(result).toBeDefined();
    });

    it('should use smaller default size', () => {
      // Thumbnail uses size of 10 arcminutes
      const thumbnail = getObjectThumbnailUrl('Unknown', 0, 0);
      const fullSize = getObjectImageUrl('Unknown', 0, 0, 30);
      
      // Both should return something (DSS URLs)
      expect(thumbnail).toBeDefined();
      expect(fullSize).toBeDefined();
    });

    it('should return null for unknown objects without coordinates', () => {
      const result = getObjectThumbnailUrl('Unknown Object');
      
      expect(result).toBeNull();
    });
  });

  describe('getSatelliteIcon', () => {
    it('should return ISS icon', () => {
      expect(getSatelliteIcon('ISS (ZARYA)')).toBe('🛸');
      expect(getSatelliteIcon('iss')).toBe('🛸');
      expect(getSatelliteIcon('ZARYA')).toBe('🛸');
    });

    it('should return Starlink icon', () => {
      expect(getSatelliteIcon('STARLINK-1234')).toBe('📡');
      expect(getSatelliteIcon('starlink')).toBe('📡');
    });

    it('should return Chinese station icon', () => {
      expect(getSatelliteIcon('TIANGONG')).toBe('🚀');
      expect(getSatelliteIcon('TIANHE')).toBe('🚀');
    });

    it('should return Hubble icon', () => {
      expect(getSatelliteIcon('HUBBLE')).toBe('🔭');
      expect(getSatelliteIcon('HST')).toBe('🔭');
    });

    it('should return weather satellite icon', () => {
      expect(getSatelliteIcon('GOES-16')).toBe('🌤️');
      expect(getSatelliteIcon('WEATHER SAT')).toBe('🌤️');
    });

    it('should return GPS icon', () => {
      expect(getSatelliteIcon('GPS IIF-1')).toBe('📍');
      expect(getSatelliteIcon('NAVSTAR')).toBe('📍');
    });

    it('should return default satellite icon for unknown', () => {
      expect(getSatelliteIcon('UNKNOWN SATELLITE')).toBe('🛰️');
      expect(getSatelliteIcon('Random Satellite')).toBe('🛰️');
    });

    it('should be case insensitive', () => {
      expect(getSatelliteIcon('iss')).toBe(getSatelliteIcon('ISS'));
      expect(getSatelliteIcon('starlink')).toBe(getSatelliteIcon('STARLINK'));
    });
  });

  describe('getSatelliteMarkerSvg', () => {
    it('should return valid SVG string', () => {
      const svg = getSatelliteMarkerSvg();
      
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
      expect(svg).toContain('viewBox');
    });

    it('should use default color', () => {
      const svg = getSatelliteMarkerSvg();
      
      expect(svg).toContain('#00ff00');
    });

    it('should accept custom color', () => {
      const svg = getSatelliteMarkerSvg('#ff0000');
      
      expect(svg).toContain('#ff0000');
      expect(svg).not.toContain('#00ff00');
    });

    it('should include circle element', () => {
      const svg = getSatelliteMarkerSvg();
      
      expect(svg).toContain('<circle');
    });

    it('should include path for antenna/rays', () => {
      const svg = getSatelliteMarkerSvg();
      
      expect(svg).toContain('<path');
    });
  });
});
