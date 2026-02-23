/**
 * Tests for celestial-search-data.ts
 * Validates shared celestial object data arrays used by search hooks
 */

import {
  CELESTIAL_BODIES,
  POPULAR_DSOS,
  MESSIER_CATALOG,
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
