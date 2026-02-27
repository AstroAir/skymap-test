/**
 * Tests for celestial-search-data.ts
 * Validates shared celestial object data arrays used by search hooks
 */

import {
  CELESTIAL_BODIES,
  POPULAR_DSOS,
  MESSIER_CATALOG,
  CONSTELLATION_SEARCH_DATA,
  DSO_NAME_INDEX,
  getMatchScore,
  getDetailedMatch,
  fuzzyMatch,
} from '../celestial-search-data';

describe('CELESTIAL_BODIES', () => {
  it('should contain all solar system bodies', () => {
    const names = CELESTIAL_BODIES.map(b => b.Name);
    expect(names).toContain('Sun');
    expect(names).toContain('Moon');
    expect(names).toContain('Mars');
    expect(names).toContain('Jupiter');
    expect(names).toContain('Saturn');
  });

  it('should have correct types', () => {
    const planets = CELESTIAL_BODIES.filter(b => b.Type === 'Planet');
    expect(planets.length).toBeGreaterThanOrEqual(7);
    expect(CELESTIAL_BODIES.find(b => b.Name === 'Sun')?.Type).toBe('Star');
    expect(CELESTIAL_BODIES.find(b => b.Name === 'Moon')?.Type).toBe('Moon');
  });
});

describe('POPULAR_DSOS', () => {
  it('should contain well-known deep sky objects', () => {
    const names = POPULAR_DSOS.map(d => d.Name);
    expect(names).toContain('M31');
    expect(names).toContain('M42');
    expect(names).toContain('M45');
  });

  it('should have RA/Dec coordinates', () => {
    for (const dso of POPULAR_DSOS) {
      expect(dso.RA).toBeDefined();
      expect(dso.Dec).toBeDefined();
      expect(typeof dso.RA).toBe('number');
      expect(typeof dso.Dec).toBe('number');
    }
  });

  it('should have common names', () => {
    const m31 = POPULAR_DSOS.find(d => d.Name === 'M31');
    expect(m31?.['Common names']).toContain('Andromeda');
  });

  it('should all be DSO type', () => {
    for (const dso of POPULAR_DSOS) {
      expect(dso.Type).toBe('DSO');
    }
  });
});

describe('MESSIER_CATALOG', () => {
  it('should include all popular Messier objects', () => {
    const messierFromPopular = POPULAR_DSOS.filter(d => d.Name.startsWith('M'));
    for (const m of messierFromPopular) {
      expect(MESSIER_CATALOG.find(c => c.Name === m.Name)).toBeDefined();
    }
  });

  it('should contain extended Messier objects beyond POPULAR_DSOS', () => {
    expect(MESSIER_CATALOG.length).toBeGreaterThan(
      POPULAR_DSOS.filter(d => d.Name.startsWith('M')).length
    );
  });

  it('should have unique names', () => {
    const names = MESSIER_CATALOG.map(m => m.Name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);
  });
});

describe('CONSTELLATION_SEARCH_DATA', () => {
  it('should contain major constellations', () => {
    const names = CONSTELLATION_SEARCH_DATA.map(c => c.Name);
    expect(names).toContain('Orion');
    expect(names).toContain('Ursa Major');
    expect(names).toContain('Cassiopeia');
    expect(names).toContain('Cygnus');
  });

  it('should all be Constellation type', () => {
    for (const c of CONSTELLATION_SEARCH_DATA) {
      expect(c.Type).toBe('Constellation');
    }
  });

  it('should have RA and Dec coordinates', () => {
    for (const c of CONSTELLATION_SEARCH_DATA) {
      expect(typeof c.RA).toBe('number');
      expect(typeof c.Dec).toBe('number');
    }
  });

  it('should have common names', () => {
    const orion = CONSTELLATION_SEARCH_DATA.find(c => c.Name === 'Orion');
    expect(orion?.['Common names']).toContain('Hunter');
  });
});

describe('DSO_NAME_INDEX', () => {
  it('should be a Map', () => {
    expect(DSO_NAME_INDEX).toBeInstanceOf(Map);
  });

  it('should have entries indexed by first character', () => {
    expect(DSO_NAME_INDEX.has('M')).toBe(true);
    expect(DSO_NAME_INDEX.has('N')).toBe(true);
    expect(DSO_NAME_INDEX.has('I')).toBe(true);
  });

  it('should have M31 under M', () => {
    const mItems = DSO_NAME_INDEX.get('M');
    expect(mItems).toBeDefined();
    expect(mItems?.some(item => item.Name === 'M31')).toBe(true);
  });

  it('should have NGC items under N', () => {
    const nItems = DSO_NAME_INDEX.get('N');
    expect(nItems).toBeDefined();
    expect(nItems?.some(item => item.Name.startsWith('NGC'))).toBe(true);
  });
});

describe('getMatchScore', () => {
  it('should return high score for common name match', () => {
    const m42 = POPULAR_DSOS.find(d => d.Name === 'M42')!;
    const score = getMatchScore(m42, 'orion nebula');
    expect(score).toBeGreaterThan(1.5);
  });

  it('should return high score for catalog ID match', () => {
    const m31 = POPULAR_DSOS.find(d => d.Name === 'M31')!;
    const score = getMatchScore(m31, 'M31');
    expect(score).toBe(2.0);
  });

  it('should return score for phonetic variation', () => {
    const m31 = POPULAR_DSOS.find(d => d.Name === 'M31')!;
    const score = getMatchScore(m31, 'andromida');
    expect(score).toBeGreaterThan(1.0);
  });

  it('should return score for Jaro-Winkler common name match', () => {
    const m27 = POPULAR_DSOS.find(d => d.Name === 'M27')!;
    const score = getMatchScore(m27, 'Dumbbell Nebula');
    expect(score).toBeGreaterThan(0.5);
  });

  it('should return positive score for partial name match', () => {
    const m31 = POPULAR_DSOS.find(d => d.Name === 'M31')!;
    const score = getMatchScore(m31, 'M3');
    expect(score).toBeGreaterThan(0);
  });

  it('should return 0 or low score for unrelated query', () => {
    const m31 = POPULAR_DSOS.find(d => d.Name === 'M31')!;
    const score = getMatchScore(m31, 'xyz999');
    expect(score).toBeLessThan(0.5);
  });

  it('should handle items without common names', () => {
    const item = { Name: 'M2', Type: 'DSO' as const };
    const score = getMatchScore(item, 'M2');
    expect(score).toBeGreaterThan(0);
  });

  it('should handle phonetic variation matching common names', () => {
    const m45 = POPULAR_DSOS.find(d => d.Name === 'M45')!;
    const score = getMatchScore(m45, 'pleides');
    expect(score).toBeGreaterThan(0);
  });
});

describe('getDetailedMatch', () => {
  it('should return match result with type and field', () => {
    const m31 = POPULAR_DSOS.find(d => d.Name === 'M31')!;
    const result = getDetailedMatch(m31, 'M31');
    expect(result.score).toBeGreaterThan(0);
    expect(result.matchType).toBeDefined();
    expect(result.matchedField).toBeDefined();
  });

  it('should detect catalog match', () => {
    const m42 = POPULAR_DSOS.find(d => d.Name === 'M42')!;
    const result = getDetailedMatch(m42, 'M42');
    expect(result.matchType).toBe('catalog');
  });

  it('should detect prefix match', () => {
    const ngc = POPULAR_DSOS.find(d => d.Name === 'NGC7000')!;
    const result = getDetailedMatch(ngc, 'NGC70');
    expect(result.matchType).toBe('prefix');
  });
});

describe('fuzzyMatch', () => {
  it('should return score > 0 for matching strings', () => {
    expect(fuzzyMatch('M31', 'M31')).toBeGreaterThan(0);
  });

  it('should return 0 for completely different strings', () => {
    expect(fuzzyMatch('M31', 'xyz999')).toBe(0);
  });

  it('should return positive score for similar strings', () => {
    expect(fuzzyMatch('Andromeda', 'Andromida')).toBeGreaterThan(0);
  });

  it('should return score for prefix match', () => {
    expect(fuzzyMatch('NGC7000', 'NGC7')).toBeGreaterThan(0);
  });
});
