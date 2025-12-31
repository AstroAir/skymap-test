/**
 * Tests for catalog-data.ts
 */

import {
  DSO_CATALOG,
  getDSOById,
  getMessierObjects,
  getDSOsByConstellation,
  getDSOsByType,
} from '../catalog-data';

describe('DSO_CATALOG', () => {
  it('should contain objects', () => {
    expect(DSO_CATALOG.length).toBeGreaterThan(100);
  });

  it('should include Messier objects', () => {
    const messier = DSO_CATALOG.filter(obj => obj.id.startsWith('M'));
    expect(messier.length).toBeGreaterThanOrEqual(110);
  });

  it('should have proper object structure', () => {
    const obj = DSO_CATALOG[0];
    expect(obj).toHaveProperty('id');
    expect(obj).toHaveProperty('name');
    expect(obj).toHaveProperty('type');
    expect(obj).toHaveProperty('ra');
    expect(obj).toHaveProperty('dec');
  });
});

describe('getMessierObjects', () => {
  it('should return 110 Messier objects', () => {
    const catalog = getMessierObjects();
    expect(catalog.length).toBe(110);
  });

  it('should include M1 Crab Nebula', () => {
    const catalog = getMessierObjects();
    const m1 = catalog.find(obj => obj.id === 'M1');
    expect(m1).toBeDefined();
    expect(m1?.name).toContain('Crab');
  });

  it('should include M31 Andromeda Galaxy', () => {
    const catalog = getMessierObjects();
    const m31 = catalog.find(obj => obj.id === 'M31');
    expect(m31).toBeDefined();
    expect(m31?.name).toContain('Andromeda');
  });
});

describe('getDSOById', () => {
  it('should find M31 by ID', () => {
    const obj = getDSOById('M31');
    expect(obj).toBeDefined();
    expect(obj?.name).toContain('Andromeda');
  });

  it('should find M42 by ID', () => {
    const obj = getDSOById('M42');
    expect(obj).toBeDefined();
    expect(obj?.name).toContain('Orion');
  });

  it('should return undefined for non-existent ID', () => {
    const obj = getDSOById('NONEXISTENT');
    expect(obj).toBeUndefined();
  });
});

describe('getDSOsByConstellation', () => {
  it('should find objects in Orion', () => {
    const objects = getDSOsByConstellation('Ori');
    expect(objects.length).toBeGreaterThan(0);
  });

  it('should find objects in Sagittarius', () => {
    const objects = getDSOsByConstellation('Sgr');
    expect(objects.length).toBeGreaterThan(0);
  });

  it('should be case-insensitive', () => {
    const objects1 = getDSOsByConstellation('ORI');
    const objects2 = getDSOsByConstellation('ori');
    expect(objects1.length).toBe(objects2.length);
  });

  it('should return empty array for non-existent constellation', () => {
    const objects = getDSOsByConstellation('XYZ');
    expect(objects.length).toBe(0);
  });
});

describe('getDSOsByType', () => {
  it('should find galaxies', () => {
    const objects = getDSOsByType('Galaxy');
    expect(objects.length).toBeGreaterThan(0);
  });

  it('should find globular clusters', () => {
    const objects = getDSOsByType('GlobularCluster');
    expect(objects.length).toBeGreaterThan(0);
  });

  it('should find open clusters', () => {
    const objects = getDSOsByType('OpenCluster');
    expect(objects.length).toBeGreaterThan(0);
  });

  it('should find emission nebulae', () => {
    const objects = getDSOsByType('EmissionNebula');
    expect(objects.length).toBeGreaterThan(0);
  });
});
