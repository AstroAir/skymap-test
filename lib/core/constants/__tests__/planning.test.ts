/**
 * Tests for planning.ts
 * Exposure calculator constants and filter sequence presets
 */

import {
  COMMON_FILTERS,
  BINNING_OPTIONS,
  IMAGE_TYPES,
  FILTER_SEQUENCE_PRESETS,
} from '../planning';
import type { FilterSequencePreset } from '../planning';

describe('COMMON_FILTERS', () => {
  it('has expected number of filters', () => {
    expect(COMMON_FILTERS.length).toBe(8);
  });

  it('each filter has required properties', () => {
    for (const filter of COMMON_FILTERS) {
      expect(filter).toHaveProperty('id');
      expect(filter).toHaveProperty('nameKey');
      expect(filter).toHaveProperty('type');
      expect(filter).toHaveProperty('bandwidthNm');
      expect(typeof filter.id).toBe('string');
      expect(typeof filter.nameKey).toBe('string');
      expect(filter.bandwidthNm).toBeGreaterThan(0);
    }
  });

  it('all IDs are unique', () => {
    const ids = COMMON_FILTERS.map(f => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has both broadband and narrowband types', () => {
    const types = new Set(COMMON_FILTERS.map(f => f.type));
    expect(types.has('broadband')).toBe(true);
    expect(types.has('narrowband')).toBe(true);
  });

  it('narrowband filters have smaller bandwidth', () => {
    const narrowband = COMMON_FILTERS.filter(f => f.type === 'narrowband');
    const broadband = COMMON_FILTERS.filter(f => f.type === 'broadband');
    const maxNarrow = Math.max(...narrowband.map(f => f.bandwidthNm));
    const minBroad = Math.min(...broadband.map(f => f.bandwidthNm));
    expect(maxNarrow).toBeLessThan(minBroad);
  });

  it('contains standard LRGB filters', () => {
    const ids = COMMON_FILTERS.map(f => f.id);
    expect(ids).toContain('L');
    expect(ids).toContain('R');
    expect(ids).toContain('G');
    expect(ids).toContain('B');
  });

  it('contains standard narrowband filters', () => {
    const ids = COMMON_FILTERS.map(f => f.id);
    expect(ids).toContain('Ha');
    expect(ids).toContain('OIII');
    expect(ids).toContain('SII');
  });
});

describe('BINNING_OPTIONS', () => {
  it('has 4 options', () => {
    expect(BINNING_OPTIONS).toHaveLength(4);
  });

  it('contains expected binning values', () => {
    expect(BINNING_OPTIONS).toContain('1x1');
    expect(BINNING_OPTIONS).toContain('2x2');
    expect(BINNING_OPTIONS).toContain('3x3');
    expect(BINNING_OPTIONS).toContain('4x4');
  });
});

describe('IMAGE_TYPES', () => {
  it('has 4 types', () => {
    expect(IMAGE_TYPES).toHaveLength(4);
  });

  it('each type has id and nameKey', () => {
    for (const type of IMAGE_TYPES) {
      expect(typeof type.id).toBe('string');
      expect(typeof type.nameKey).toBe('string');
    }
  });

  it('contains standard image types', () => {
    const ids = IMAGE_TYPES.map(t => t.id);
    expect(ids).toContain('LIGHT');
    expect(ids).toContain('DARK');
    expect(ids).toContain('FLAT');
    expect(ids).toContain('BIAS');
  });
});

describe('FILTER_SEQUENCE_PRESETS', () => {
  it('has multiple presets', () => {
    expect(FILTER_SEQUENCE_PRESETS.length).toBeGreaterThan(0);
  });

  it('each preset has required properties', () => {
    for (const preset of FILTER_SEQUENCE_PRESETS) {
      expect(preset).toHaveProperty('id');
      expect(preset).toHaveProperty('nameKey');
      expect(preset).toHaveProperty('filters');
      expect(preset.filters.length).toBeGreaterThan(0);
    }
  });

  it('all preset IDs are unique', () => {
    const ids = FILTER_SEQUENCE_PRESETS.map((p: FilterSequencePreset) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('each filter entry has filterId and ratio > 0', () => {
    for (const preset of FILTER_SEQUENCE_PRESETS) {
      for (const entry of preset.filters) {
        expect(typeof entry.filterId).toBe('string');
        expect(entry.ratio).toBeGreaterThan(0);
      }
    }
  });

  it('all filter references exist in COMMON_FILTERS', () => {
    const validIds = new Set<string>(COMMON_FILTERS.map(f => f.id));
    for (const preset of FILTER_SEQUENCE_PRESETS) {
      for (const entry of preset.filters) {
        expect(validIds.has(entry.filterId)).toBe(true);
      }
    }
  });

  it('contains standard presets (lrgb, rgb, sho)', () => {
    const ids = FILTER_SEQUENCE_PRESETS.map((p: FilterSequencePreset) => p.id);
    expect(ids).toContain('lrgb');
    expect(ids).toContain('rgb');
    expect(ids).toContain('sho');
  });
});
