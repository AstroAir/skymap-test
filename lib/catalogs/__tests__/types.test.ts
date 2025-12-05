/**
 * @jest-environment node
 */
import {
  MOON_PHASE_NAMES,
  CONSTELLATIONS,
  CONSTELLATION_NAMES,
  DSO_TYPE_LABELS,
  DEFAULT_FILTER_PRESETS,
} from '../types';

describe('Catalogs Types', () => {
  // ============================================================================
  // MOON_PHASE_NAMES
  // ============================================================================
  describe('MOON_PHASE_NAMES', () => {
    it('has all 8 moon phases', () => {
      const phases = Object.keys(MOON_PHASE_NAMES);
      expect(phases).toHaveLength(8);
    });

    it('has correct phase names', () => {
      expect(MOON_PHASE_NAMES.new).toBe('New Moon');
      expect(MOON_PHASE_NAMES.full).toBe('Full Moon');
      expect(MOON_PHASE_NAMES.firstQuarter).toBe('First Quarter');
      expect(MOON_PHASE_NAMES.lastQuarter).toBe('Last Quarter');
      expect(MOON_PHASE_NAMES.waxingCrescent).toBe('Waxing Crescent');
      expect(MOON_PHASE_NAMES.waningCrescent).toBe('Waning Crescent');
      expect(MOON_PHASE_NAMES.waxingGibbous).toBe('Waxing Gibbous');
      expect(MOON_PHASE_NAMES.waningGibbous).toBe('Waning Gibbous');
    });
  });

  // ============================================================================
  // CONSTELLATIONS
  // ============================================================================
  describe('CONSTELLATIONS', () => {
    it('has 88 constellations', () => {
      expect(CONSTELLATIONS).toHaveLength(88);
    });

    it('contains well-known constellations', () => {
      expect(CONSTELLATIONS).toContain('Ori'); // Orion
      expect(CONSTELLATIONS).toContain('UMa'); // Ursa Major
      expect(CONSTELLATIONS).toContain('Cyg'); // Cygnus
      expect(CONSTELLATIONS).toContain('Cas'); // Cassiopeia
      expect(CONSTELLATIONS).toContain('Sgr'); // Sagittarius
    });

    it('all abbreviations are 3 characters', () => {
      for (const abbr of CONSTELLATIONS) {
        expect(abbr.length).toBe(3);
      }
    });

    it('has no duplicates', () => {
      const unique = new Set(CONSTELLATIONS);
      expect(unique.size).toBe(CONSTELLATIONS.length);
    });
  });

  // ============================================================================
  // CONSTELLATION_NAMES
  // ============================================================================
  describe('CONSTELLATION_NAMES', () => {
    it('has 88 constellation names', () => {
      const names = Object.keys(CONSTELLATION_NAMES);
      expect(names).toHaveLength(88);
    });

    it('maps abbreviations to full names', () => {
      expect(CONSTELLATION_NAMES.Ori).toBe('Orion');
      expect(CONSTELLATION_NAMES.UMa).toBe('Ursa Major');
      expect(CONSTELLATION_NAMES.Cyg).toBe('Cygnus');
      expect(CONSTELLATION_NAMES.Cas).toBe('Cassiopeia');
      expect(CONSTELLATION_NAMES.Sgr).toBe('Sagittarius');
    });

    it('all CONSTELLATIONS have corresponding names', () => {
      for (const abbr of CONSTELLATIONS) {
        expect(CONSTELLATION_NAMES[abbr]).toBeDefined();
        expect(typeof CONSTELLATION_NAMES[abbr]).toBe('string');
        expect(CONSTELLATION_NAMES[abbr].length).toBeGreaterThan(0);
      }
    });
  });

  // ============================================================================
  // DSO_TYPE_LABELS
  // ============================================================================
  describe('DSO_TYPE_LABELS', () => {
    it('has all DSO types', () => {
      const types = Object.keys(DSO_TYPE_LABELS);
      expect(types.length).toBeGreaterThan(10);
    });

    it('has correct labels', () => {
      expect(DSO_TYPE_LABELS.Galaxy).toBe('Galaxy');
      expect(DSO_TYPE_LABELS.Nebula).toBe('Nebula');
      expect(DSO_TYPE_LABELS.OpenCluster).toBe('Open Cluster');
      expect(DSO_TYPE_LABELS.GlobularCluster).toBe('Globular Cluster');
      expect(DSO_TYPE_LABELS.PlanetaryNebula).toBe('Planetary Nebula');
      expect(DSO_TYPE_LABELS.EmissionNebula).toBe('Emission Nebula');
    });

    it('all labels are non-empty strings', () => {
      for (const label of Object.values(DSO_TYPE_LABELS)) {
        expect(typeof label).toBe('string');
        expect(label.length).toBeGreaterThan(0);
      }
    });
  });

  // ============================================================================
  // DEFAULT_FILTER_PRESETS
  // ============================================================================
  describe('DEFAULT_FILTER_PRESETS', () => {
    it('has multiple presets', () => {
      expect(DEFAULT_FILTER_PRESETS.length).toBeGreaterThan(5);
    });

    it('each preset has required properties', () => {
      for (const preset of DEFAULT_FILTER_PRESETS) {
        expect(preset).toHaveProperty('id');
        expect(preset).toHaveProperty('name');
        expect(preset).toHaveProperty('description');
        expect(preset).toHaveProperty('filters');
      }
    });

    it('all IDs are unique', () => {
      const ids = DEFAULT_FILTER_PRESETS.map(p => p.id);
      const unique = new Set(ids);
      expect(unique.size).toBe(ids.length);
    });

    it('contains Tonight\'s Best preset', () => {
      const preset = DEFAULT_FILTER_PRESETS.find(p => p.id === 'tonight-best');
      expect(preset).toBeDefined();
      expect(preset?.filters.minimumAltitude).toBeDefined();
    });

    it('contains Messier preset', () => {
      const preset = DEFAULT_FILTER_PRESETS.find(p => p.id === 'messier');
      expect(preset).toBeDefined();
      expect(preset?.filters.objectName).toBe('M');
    });

    it('contains Galaxies preset', () => {
      const preset = DEFAULT_FILTER_PRESETS.find(p => p.id === 'galaxies');
      expect(preset).toBeDefined();
      expect(preset?.filters.objectTypes).toBeDefined();
    });

    it('contains Nebulae preset', () => {
      const preset = DEFAULT_FILTER_PRESETS.find(p => p.id === 'nebulae');
      expect(preset).toBeDefined();
    });

    it('contains Clusters preset', () => {
      const preset = DEFAULT_FILTER_PRESETS.find(p => p.id === 'clusters');
      expect(preset).toBeDefined();
    });
  });
});
