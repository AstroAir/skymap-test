/**
 * @jest-environment node
 */
import {
  ICON_SOURCES,
  SATELLITE_ICONS,
  SATELLITE_SVG_ICONS,
} from '../celestial-icons';

describe('Celestial Icons Service', () => {
  // ============================================================================
  // ICON_SOURCES
  // ============================================================================
  describe('ICON_SOURCES', () => {
    it('has nasa source', () => {
      expect(ICON_SOURCES.nasa).toBeDefined();
      expect(ICON_SOURCES.nasa).toContain('api.nasa.gov');
    });

    it('has stellarium source', () => {
      expect(ICON_SOURCES.stellarium).toBeDefined();
      expect(ICON_SOURCES.stellarium).toContain('stellarium');
    });

    it('has wikipedia source', () => {
      expect(ICON_SOURCES.wikipedia).toBeDefined();
      expect(ICON_SOURCES.wikipedia).toContain('wikipedia');
    });

    it('has simbad source', () => {
      expect(ICON_SOURCES.simbad).toBeDefined();
      expect(ICON_SOURCES.simbad).toContain('simbad');
    });

    it('all sources are valid URLs', () => {
      for (const source of Object.values(ICON_SOURCES)) {
        expect(source).toMatch(/^https?:\/\//);
      }
    });
  });

  // ============================================================================
  // SATELLITE_ICONS
  // ============================================================================
  describe('SATELLITE_ICONS', () => {
    it('has ISS icon', () => {
      expect(SATELLITE_ICONS.iss).toBeDefined();
    });

    it('has Starlink icon', () => {
      expect(SATELLITE_ICONS.starlink).toBeDefined();
    });

    it('has weather icon', () => {
      expect(SATELLITE_ICONS.weather).toBeDefined();
    });

    it('has GPS icon', () => {
      expect(SATELLITE_ICONS.gps).toBeDefined();
    });

    it('has communication icon', () => {
      expect(SATELLITE_ICONS.communication).toBeDefined();
    });

    it('has scientific icon', () => {
      expect(SATELLITE_ICONS.scientific).toBeDefined();
    });

    it('has amateur icon', () => {
      expect(SATELLITE_ICONS.amateur).toBeDefined();
    });

    it('has other/default icon', () => {
      expect(SATELLITE_ICONS.other).toBeDefined();
    });

    it('all icons are non-empty strings', () => {
      for (const icon of Object.values(SATELLITE_ICONS)) {
        expect(typeof icon).toBe('string');
        expect(icon.length).toBeGreaterThan(0);
      }
    });
  });

  // ============================================================================
  // SATELLITE_SVG_ICONS
  // ============================================================================
  describe('SATELLITE_SVG_ICONS', () => {
    it('has ISS SVG', () => {
      expect(SATELLITE_SVG_ICONS.iss).toBeDefined();
      expect(SATELLITE_SVG_ICONS.iss).toContain('<svg');
    });

    it('has Starlink SVG', () => {
      expect(SATELLITE_SVG_ICONS.starlink).toBeDefined();
      expect(SATELLITE_SVG_ICONS.starlink).toContain('<svg');
    });

    it('has default SVG', () => {
      expect(SATELLITE_SVG_ICONS.default).toBeDefined();
      expect(SATELLITE_SVG_ICONS.default).toContain('<svg');
    });

    it('all SVGs are valid SVG strings', () => {
      for (const svg of Object.values(SATELLITE_SVG_ICONS)) {
        expect(svg).toContain('<svg');
        expect(svg).toContain('</svg>');
        expect(svg).toContain('viewBox');
      }
    });
  });
});
