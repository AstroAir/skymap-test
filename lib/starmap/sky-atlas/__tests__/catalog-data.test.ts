/**
 * @jest-environment jsdom
 */
import {
  DSO_CATALOG,
  getDSOById,
  getMessierObjects,
  getDSOsByConstellation,
  getDSOsByType,
} from '../catalog-data';

describe('DSO_CATALOG', () => {
  it('is an array', () => {
    expect(Array.isArray(DSO_CATALOG)).toBe(true);
  });

  it('contains objects', () => {
    expect(DSO_CATALOG.length).toBeGreaterThan(0);
  });

  it('contains Messier objects', () => {
    const messierObjects = DSO_CATALOG.filter((obj) => obj.id.startsWith('M'));
    expect(messierObjects.length).toBeGreaterThan(0);
  });

  it('contains M31', () => {
    const m31 = DSO_CATALOG.find((obj) => obj.id === 'M31');
    expect(m31).toBeDefined();
    expect(m31?.name).toContain('Andromeda');
  });

  it('contains M42', () => {
    const m42 = DSO_CATALOG.find((obj) => obj.id === 'M42');
    expect(m42).toBeDefined();
    expect(m42?.name).toContain('Orion');
  });

  it('objects have required properties', () => {
    DSO_CATALOG.forEach((obj) => {
      expect(obj.id).toBeDefined();
      expect(obj.name).toBeDefined();
      expect(obj.type).toBeDefined();
      expect(obj.constellation).toBeDefined();
      expect(obj.ra).toBeDefined();
      expect(obj.dec).toBeDefined();
    });
  });

  it('RA values are in valid range', () => {
    DSO_CATALOG.forEach((obj) => {
      expect(obj.ra).toBeGreaterThanOrEqual(0);
      expect(obj.ra).toBeLessThan(360);
    });
  });

  it('Dec values are in valid range', () => {
    DSO_CATALOG.forEach((obj) => {
      expect(obj.dec).toBeGreaterThanOrEqual(-90);
      expect(obj.dec).toBeLessThanOrEqual(90);
    });
  });

  it('is sorted by magnitude', () => {
    for (let i = 1; i < DSO_CATALOG.length; i++) {
      const prevMag = DSO_CATALOG[i - 1].magnitude ?? 99;
      const currMag = DSO_CATALOG[i].magnitude ?? 99;
      expect(currMag).toBeGreaterThanOrEqual(prevMag);
    }
  });
});

describe('getDSOById', () => {
  it('returns object by ID', () => {
    const m31 = getDSOById('M31');
    expect(m31).toBeDefined();
    expect(m31?.id).toBe('M31');
  });

  it('returns undefined for non-existent ID', () => {
    const result = getDSOById('NONEXISTENT');
    expect(result).toBeUndefined();
  });
});

describe('getMessierObjects', () => {
  it('returns array', () => {
    const messier = getMessierObjects();
    expect(Array.isArray(messier)).toBe(true);
  });

  it('returns 110 Messier objects', () => {
    const messier = getMessierObjects();
    expect(messier.length).toBe(110);
  });

  it('all objects start with M', () => {
    const messier = getMessierObjects();
    messier.forEach((obj) => {
      expect(obj.id.startsWith('M')).toBe(true);
    });
  });
});

describe('getDSOsByConstellation', () => {
  it('returns array', () => {
    const result = getDSOsByConstellation('Ori');
    expect(Array.isArray(result)).toBe(true);
  });

  it('returns objects in Orion', () => {
    const result = getDSOsByConstellation('Ori');
    expect(result.length).toBeGreaterThan(0);
    result.forEach((obj) => {
      expect(obj.constellation.toLowerCase()).toBe('ori');
    });
  });

  it('is case insensitive', () => {
    const result1 = getDSOsByConstellation('Ori');
    const result2 = getDSOsByConstellation('ori');
    const result3 = getDSOsByConstellation('ORI');
    expect(result1.length).toBe(result2.length);
    expect(result2.length).toBe(result3.length);
  });

  it('returns empty array for non-existent constellation', () => {
    const result = getDSOsByConstellation('NONEXISTENT');
    expect(result).toEqual([]);
  });
});

describe('getDSOsByType', () => {
  it('returns array', () => {
    const result = getDSOsByType('Galaxy');
    expect(Array.isArray(result)).toBe(true);
  });

  it('returns galaxies', () => {
    const result = getDSOsByType('Galaxy');
    expect(result.length).toBeGreaterThan(0);
    result.forEach((obj) => {
      expect(obj.type).toBe('Galaxy');
    });
  });

  it('returns globular clusters', () => {
    const result = getDSOsByType('GlobularCluster');
    expect(result.length).toBeGreaterThan(0);
    result.forEach((obj) => {
      expect(obj.type).toBe('GlobularCluster');
    });
  });

  it('returns emission nebulae', () => {
    const result = getDSOsByType('EmissionNebula');
    expect(result.length).toBeGreaterThan(0);
    result.forEach((obj) => {
      expect(obj.type).toBe('EmissionNebula');
    });
  });

  it('returns empty array for non-existent type', () => {
    const result = getDSOsByType('NonExistentType' as never);
    expect(result).toEqual([]);
  });
});
