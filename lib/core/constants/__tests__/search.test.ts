/**
 * Tests for search.ts
 * Search-related constants: object types, catalog presets, source color map
 */

import {
  ALL_OBJECT_TYPES,
  CATALOG_PRESETS,
  SOURCE_COLOR_MAP,
} from '../search';

describe('ALL_OBJECT_TYPES', () => {
  it('is a non-empty array', () => {
    expect(ALL_OBJECT_TYPES.length).toBeGreaterThan(0);
  });

  it('contains common object types', () => {
    expect(ALL_OBJECT_TYPES).toContain('DSO');
    expect(ALL_OBJECT_TYPES).toContain('Planet');
    expect(ALL_OBJECT_TYPES).toContain('Star');
  });

  it('all entries are strings', () => {
    for (const type of ALL_OBJECT_TYPES) {
      expect(typeof type).toBe('string');
    }
  });

  it('has no duplicates', () => {
    expect(new Set(ALL_OBJECT_TYPES).size).toBe(ALL_OBJECT_TYPES.length);
  });
});

describe('CATALOG_PRESETS', () => {
  it('has multiple presets', () => {
    expect(CATALOG_PRESETS.length).toBeGreaterThan(0);
  });

  it('each preset has id, label, and query', () => {
    for (const preset of CATALOG_PRESETS) {
      expect(typeof preset.id).toBe('string');
      expect(typeof preset.label).toBe('string');
      expect(typeof preset.query).toBe('string');
      expect(preset.id.length).toBeGreaterThan(0);
      expect(preset.label.length).toBeGreaterThan(0);
      expect(preset.query.length).toBeGreaterThan(0);
    }
  });

  it('all IDs are unique', () => {
    const ids = CATALOG_PRESETS.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('contains Messier and NGC presets', () => {
    const ids = CATALOG_PRESETS.map(p => p.id);
    expect(ids).toContain('messier');
    expect(ids).toContain('ngc');
  });
});

describe('SOURCE_COLOR_MAP', () => {
  it('is a non-empty object', () => {
    expect(Object.keys(SOURCE_COLOR_MAP).length).toBeGreaterThan(0);
  });

  it('all values are non-empty CSS class strings', () => {
    for (const [key, value] of Object.entries(SOURCE_COLOR_MAP)) {
      expect(typeof key).toBe('string');
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThan(0);
    }
  });

  it('contains simbad and sesame sources', () => {
    expect(SOURCE_COLOR_MAP).toHaveProperty('simbad');
    expect(SOURCE_COLOR_MAP).toHaveProperty('sesame');
  });
});
