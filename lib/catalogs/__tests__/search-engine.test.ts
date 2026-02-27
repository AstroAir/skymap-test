/**
 * Tests for search-engine.ts
 */

import {
  createDefaultFilters,
  initializeFiltersWithNighttime,
  searchDeepSkyObjects,
  quickSearchByName,
  enhancedSearch,
  enhancedQuickSearch,
  searchWithFuzzyName,
  getCatalogStats,
  getTonightsBest,
  clearSearchIndexCache,
} from '../search-engine';
import type { DeepSkyObject, NighttimeData } from '../types';

// Mock deep-sky-object functions
jest.mock('../deep-sky-object', () => ({
  calculateAltitudeData: jest.fn(() => ({ altitudes: [] })),
  calculateMoonDistance: jest.fn(() => 90),
  calculateTransitTime: jest.fn(() => new Date()),
  isAboveAltitudeForDuration: jest.fn(() => true),
  enrichDeepSkyObject: jest.fn((obj) => obj),
}));

// Mock nighttime-calculator
jest.mock('../nighttime-calculator', () => ({
  calculateNighttimeData: jest.fn(() => ({
    referenceDate: new Date('2025-06-15T12:00:00Z'),
    date: new Date('2025-06-15'),
    sunRiseAndSet: { rise: new Date('2025-06-16T05:00:00Z'), set: new Date('2025-06-15T20:00:00Z') },
    nauticalTwilightRiseAndSet: { rise: new Date('2025-06-16T04:00:00Z'), set: new Date('2025-06-15T21:00:00Z') },
    civilTwilightRiseAndSet: { rise: new Date('2025-06-16T04:30:00Z'), set: new Date('2025-06-15T20:30:00Z') },
    twilightRiseAndSet: { rise: new Date('2025-06-16T03:00:00Z'), set: new Date('2025-06-15T22:00:00Z') },
    moonRiseAndSet: { rise: null, set: null },
    moonIllumination: 50,
    moonPhase: 'firstQuarter',
    moonPhaseValue: 0.5,
  })),
  getReferenceDate: jest.fn((date) => date || new Date()),
}));

describe('createDefaultFilters', () => {
  it('should create default filter object', () => {
    const filters = createDefaultFilters();
    
    expect(filters).toBeDefined();
    expect(filters.objectName).toBe('');
    expect(filters.objectTypes).toEqual([]);
    expect(filters.constellation).toBe('');
    expect(filters.minimumAltitude).toBe(0);
    expect(filters.minimumMoonDistance).toBe(0);
    expect(filters.orderByField).toBe('imagingScore');
    expect(filters.orderByDirection).toBe('desc');
  });

  it('should have null RA range values', () => {
    const filters = createDefaultFilters();
    expect(filters.raRange.from).toBeNull();
    expect(filters.raRange.through).toBeNull();
  });

  it('should have null Dec range values', () => {
    const filters = createDefaultFilters();
    expect(filters.decRange.from).toBeNull();
    expect(filters.decRange.through).toBeNull();
  });

  it('should have null magnitude range values', () => {
    const filters = createDefaultFilters();
    expect(filters.magnitudeRange.from).toBeNull();
    expect(filters.magnitudeRange.through).toBeNull();
  });

  it('should have filter date as Date object', () => {
    const filters = createDefaultFilters();
    expect(filters.filterDate).toBeInstanceOf(Date);
  });
});

describe('initializeFiltersWithNighttime', () => {
  it('should return altitude time settings', () => {
    const nighttimeData = {
      referenceDate: new Date('2024-06-15T12:00:00'),
      date: new Date('2024-06-15'),
      sunRiseAndSet: { rise: new Date('2024-06-16T05:00:00'), set: new Date('2024-06-15T20:00:00') },
      nauticalTwilightRiseAndSet: { rise: new Date('2024-06-16T04:00:00'), set: new Date('2024-06-15T21:00:00') },
      civilTwilightRiseAndSet: { rise: new Date('2024-06-16T04:30:00'), set: new Date('2024-06-15T20:30:00') },
      twilightRiseAndSet: { rise: new Date('2024-06-16T03:00:00'), set: new Date('2024-06-15T22:00:00') },
      moonRiseAndSet: { rise: null, set: null },
      moonIllumination: 50,
      moonPhase: 'firstQuarter',
      moonPhaseValue: 0.5,
    } as NighttimeData;

    const result = initializeFiltersWithNighttime(nighttimeData);
    
    expect(result.altitudeTimeFrom).toBeDefined();
    expect(result.altitudeTimeThrough).toBeDefined();
  });

  it('should fallback to reference date when no twilight data', () => {
    const nighttimeData = {
      referenceDate: new Date('2024-06-15T12:00:00'),
      date: new Date('2024-06-15'),
      sunRiseAndSet: { rise: null, set: null },
      nauticalTwilightRiseAndSet: { rise: null, set: null },
      civilTwilightRiseAndSet: { rise: null, set: null },
      twilightRiseAndSet: { rise: null, set: null },
      moonRiseAndSet: { rise: null, set: null },
      moonIllumination: 50,
      moonPhase: 'firstQuarter',
      moonPhaseValue: 0.5,
    } as NighttimeData;

    const result = initializeFiltersWithNighttime(nighttimeData);
    
    expect(result.altitudeTimeFrom).toEqual(nighttimeData.referenceDate);
  });
});

describe('searchDeepSkyObjects', () => {
  const mockCatalog: DeepSkyObject[] = [
    {
      id: '1',
      name: 'M31',
      type: 'Galaxy',
      ra: 10.68,
      dec: 41.27,
      magnitude: 3.4,
      constellation: 'And',
      alternateNames: ['Andromeda Galaxy', 'NGC 224'],
    },
    {
      id: '2',
      name: 'M42',
      type: 'Nebula',
      ra: 83.82,
      dec: -5.39,
      magnitude: 4.0,
      constellation: 'Ori',
      alternateNames: ['Orion Nebula'],
    },
    {
      id: '3',
      name: 'M45',
      type: 'OpenCluster',
      ra: 56.87,
      dec: 24.12,
      magnitude: 1.6,
      constellation: 'Tau',
      alternateNames: ['Pleiades'],
    },
  ];

  const defaultOptions = {
    latitude: 45,
    longitude: -75,
    pageSize: 50,
    page: 1,
  };

  it('should return all objects with no filters', async () => {
    const filters = createDefaultFilters();
    const result = await searchDeepSkyObjects(mockCatalog, filters, defaultOptions);
    
    expect(result.objects.length).toBe(3);
    expect(result.totalCount).toBe(3);
  });

  it('should filter by object name', async () => {
    const filters = createDefaultFilters();
    filters.objectName = 'M31';
    
    const result = await searchDeepSkyObjects(mockCatalog, filters, defaultOptions);
    
    expect(result.objects.length).toBe(1);
    expect(result.objects[0].name).toBe('M31');
  });

  it('should filter by alternate name', async () => {
    const filters = createDefaultFilters();
    filters.objectName = 'Andromeda';
    
    const result = await searchDeepSkyObjects(mockCatalog, filters, defaultOptions);
    
    expect(result.objects.length).toBe(1);
    expect(result.objects[0].name).toBe('M31');
  });

  it('should filter by object type', async () => {
    const filters = createDefaultFilters();
    filters.objectTypes = [{ type: 'Galaxy', label: 'Galaxy', selected: true }];
    
    const result = await searchDeepSkyObjects(mockCatalog, filters, defaultOptions);
    
    expect(result.objects.length).toBe(1);
    expect(result.objects[0].type).toBe('Galaxy');
  });

  it('should filter by constellation', async () => {
    const filters = createDefaultFilters();
    filters.constellation = 'Ori';
    
    const result = await searchDeepSkyObjects(mockCatalog, filters, defaultOptions);
    
    expect(result.objects.length).toBe(1);
    expect(result.objects[0].constellation).toBe('Ori');
  });

  it('should filter by RA range', async () => {
    const filters = createDefaultFilters();
    filters.raRange = { from: 50, through: 100 };
    
    const result = await searchDeepSkyObjects(mockCatalog, filters, defaultOptions);
    
    expect(result.objects.length).toBe(2);
  });

  it('should filter by Dec range', async () => {
    const filters = createDefaultFilters();
    filters.decRange = { from: 0, through: 50 };
    
    const result = await searchDeepSkyObjects(mockCatalog, filters, defaultOptions);
    
    expect(result.objects.length).toBe(2);
  });

  it('should filter by magnitude range', async () => {
    const filters = createDefaultFilters();
    filters.magnitudeRange = { from: 1, through: 2 };
    
    const result = await searchDeepSkyObjects(mockCatalog, filters, defaultOptions);
    
    expect(result.objects.length).toBe(1);
    expect(result.objects[0].name).toBe('M45');
  });

  it('should handle pagination', async () => {
    const filters = createDefaultFilters();
    const options = { ...defaultOptions, pageSize: 2, page: 1 };
    
    const result = await searchDeepSkyObjects(mockCatalog, filters, options);
    
    expect(result.objects.length).toBe(2);
    expect(result.totalCount).toBe(3);
    expect(result.totalPages).toBe(2);
    expect(result.currentPage).toBe(1);
  });

  it('should return second page correctly', async () => {
    const filters = createDefaultFilters();
    const options = { ...defaultOptions, pageSize: 2, page: 2 };
    
    const result = await searchDeepSkyObjects(mockCatalog, filters, options);
    
    expect(result.objects.length).toBe(1);
    expect(result.currentPage).toBe(2);
  });

  it('should handle empty catalog', async () => {
    const filters = createDefaultFilters();
    const result = await searchDeepSkyObjects([], filters, defaultOptions);
    
    expect(result.objects.length).toBe(0);
    expect(result.totalCount).toBe(0);
  });

  it('should handle case-insensitive name search', async () => {
    const filters = createDefaultFilters();
    filters.objectName = 'm31';
    
    const result = await searchDeepSkyObjects(mockCatalog, filters, defaultOptions);
    
    expect(result.objects.length).toBe(1);
  });

  it('should filter by surface brightness range', async () => {
    const catalogWithSB: DeepSkyObject[] = [
      { ...mockCatalog[0], surfaceBrightness: 22.0 },
      { ...mockCatalog[1], surfaceBrightness: 18.0 },
      { ...mockCatalog[2], surfaceBrightness: undefined },
    ];
    const filters = createDefaultFilters();
    filters.brightnessRange = { from: 17, through: 20 };
    
    const result = await searchDeepSkyObjects(catalogWithSB, filters, defaultOptions);
    expect(result.objects.length).toBe(1);
  });

  it('should filter by size range', async () => {
    const catalogWithSize: DeepSkyObject[] = [
      { ...mockCatalog[0], sizeMax: 178 },
      { ...mockCatalog[1], sizeMax: 85 },
      { ...mockCatalog[2], sizeMax: undefined },
    ];
    const filters = createDefaultFilters();
    // sizeMax is in arcmin, filter is in arcsec (converted internally: sizeMax * 60)
    // M31=178*60=10680, M42=85*60=5100 — both in range, but M45 has no size
    filters.sizeRange = { from: 3000, through: 6000 };
    
    const result = await searchDeepSkyObjects(catalogWithSize, filters, defaultOptions);
    expect(result.objects.length).toBe(1); // Only M42 (85 * 60 = 5100 arcsec)
  });

  it('should sort by different fields', async () => {
    const filters = createDefaultFilters();
    filters.orderByField = 'magnitude';
    filters.orderByDirection = 'asc';
    
    const result = await searchDeepSkyObjects(mockCatalog, filters, defaultOptions);
    expect(result.objects[0].name).toBe('M45'); // mag 1.6
  });

  it('should sort descending', async () => {
    const filters = createDefaultFilters();
    filters.orderByField = 'magnitude';
    filters.orderByDirection = 'desc';
    
    const result = await searchDeepSkyObjects(mockCatalog, filters, defaultOptions);
    expect(result.objects[0].name).toBe('M42'); // mag 4.0
  });

  it('should sort by name', async () => {
    const filters = createDefaultFilters();
    filters.orderByField = 'name';
    filters.orderByDirection = 'asc';
    
    const result = await searchDeepSkyObjects(mockCatalog, filters, defaultOptions);
    expect(result.objects[0].name).toBe('M31');
  });

  it('should sort by size', async () => {
    const catalogWithSize: DeepSkyObject[] = [
      { ...mockCatalog[0], sizeMax: 178 },
      { ...mockCatalog[1], sizeMax: 85 },
      { ...mockCatalog[2], sizeMax: 110 },
    ];
    const filters = createDefaultFilters();
    filters.orderByField = 'size';
    filters.orderByDirection = 'desc';
    
    const result = await searchDeepSkyObjects(catalogWithSize, filters, defaultOptions);
    expect(result.objects[0].sizeMax).toBe(178);
  });

  it('should sort by altitude', async () => {
    const catalogWithAlt: DeepSkyObject[] = [
      { ...mockCatalog[0], altitude: 45 },
      { ...mockCatalog[1], altitude: 60 },
      { ...mockCatalog[2], altitude: 30 },
    ];
    const filters = createDefaultFilters();
    filters.orderByField = 'altitude';
    filters.orderByDirection = 'desc';
    
    const result = await searchDeepSkyObjects(catalogWithAlt, filters, defaultOptions);
    expect(result.objects[0].altitude).toBe(60);
  });

  it('should sort by surfaceBrightness', async () => {
    const catalogWithSB: DeepSkyObject[] = [
      { ...mockCatalog[0], surfaceBrightness: 22 },
      { ...mockCatalog[1], surfaceBrightness: 18 },
      { ...mockCatalog[2], surfaceBrightness: 20 },
    ];
    const filters = createDefaultFilters();
    filters.orderByField = 'surfaceBrightness';
    filters.orderByDirection = 'asc';
    
    const result = await searchDeepSkyObjects(catalogWithSB, filters, defaultOptions);
    expect(result.objects[0].surfaceBrightness).toBe(18);
  });

  it('should sort by moonDistance', async () => {
    const catalogWithMoon: DeepSkyObject[] = [
      { ...mockCatalog[0], moonDistance: 90 },
      { ...mockCatalog[1], moonDistance: 30 },
      { ...mockCatalog[2], moonDistance: 60 },
    ];
    const filters = createDefaultFilters();
    filters.orderByField = 'moonDistance';
    filters.orderByDirection = 'desc';
    
    const result = await searchDeepSkyObjects(catalogWithMoon, filters, defaultOptions);
    expect(result.objects[0].moonDistance).toBe(90);
  });

  it('should sort by imagingScore', async () => {
    const catalogWithScore: DeepSkyObject[] = [
      { ...mockCatalog[0], imagingScore: 80 },
      { ...mockCatalog[1], imagingScore: 95 },
      { ...mockCatalog[2], imagingScore: 70 },
    ];
    const filters = createDefaultFilters();
    filters.orderByField = 'imagingScore';
    filters.orderByDirection = 'desc';
    
    const result = await searchDeepSkyObjects(catalogWithScore, filters, defaultOptions);
    expect(result.objects[0].imagingScore).toBe(95);
  });
});

describe('quickSearchByName', () => {
  const mockCatalog: DeepSkyObject[] = [
    { id: '1', name: 'M31', type: 'Galaxy', ra: 10, dec: 41, constellation: 'And', alternateNames: ['Andromeda Galaxy'] },
    { id: '2', name: 'M32', type: 'Galaxy', ra: 10, dec: 40, constellation: 'And' },
    { id: '3', name: 'M33', type: 'Galaxy', ra: 23, dec: 30, constellation: 'Tri', alternateNames: ['Triangulum Galaxy'] },
    { id: '4', name: 'NGC7000', type: 'Nebula', ra: 314, dec: 44, constellation: 'Cyg' },
  ];

  it('should return empty array for empty search term', () => {
    expect(quickSearchByName(mockCatalog, '')).toEqual([]);
    expect(quickSearchByName(mockCatalog, '  ')).toEqual([]);
  });

  it('should find exact match', () => {
    const results = quickSearchByName(mockCatalog, 'M31');
    expect(results[0].name).toBe('M31');
  });

  it('should find prefix matches', () => {
    const results = quickSearchByName(mockCatalog, 'M3');
    expect(results.length).toBe(3);
  });

  it('should find contains matches', () => {
    const results = quickSearchByName(mockCatalog, '700');
    expect(results.some(r => r.name === 'NGC7000')).toBe(true);
  });

  it('should find alternate name matches', () => {
    const results = quickSearchByName(mockCatalog, 'Andromeda');
    expect(results.some(r => r.name === 'M31')).toBe(true);
  });

  it('should respect limit', () => {
    const results = quickSearchByName(mockCatalog, 'M', 2);
    expect(results.length).toBeLessThanOrEqual(2);
  });

  it('should prioritize exact over prefix over contains', () => {
    const results = quickSearchByName(mockCatalog, 'M31');
    expect(results[0].name).toBe('M31');
  });
});

describe('enhancedSearch', () => {
  const mockCatalog: DeepSkyObject[] = [
    { id: 'M31', name: 'M31', type: 'Galaxy', ra: 10, dec: 41, constellation: 'And', alternateNames: ['Andromeda Galaxy'] },
    { id: 'M42', name: 'M42', type: 'Nebula', ra: 83, dec: -5, constellation: 'Ori', alternateNames: ['Orion Nebula'] },
    { id: 'M45', name: 'M45', type: 'OpenCluster', ra: 56, dec: 24, constellation: 'Tau', alternateNames: ['Pleiades'] },
  ];

  afterEach(() => {
    clearSearchIndexCache();
  });

  it('should return empty for empty query', () => {
    expect(enhancedSearch(mockCatalog, '')).toEqual([]);
    expect(enhancedSearch(mockCatalog, '  ')).toEqual([]);
  });

  it('should find objects with fuzzy=true (default)', () => {
    const results = enhancedSearch(mockCatalog, 'M31');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].object.name).toBe('M31');
  });

  it('should find objects with fuzzy=false', () => {
    const results = enhancedSearch(mockCatalog, 'M31', { fuzzy: false });
    expect(results.length).toBeGreaterThan(0);
  });

  it('should respect minScore option', () => {
    const results = enhancedSearch(mockCatalog, 'xyz', { minScore: 0.9 });
    expect(results.length).toBe(0);
  });

  it('should respect limit option', () => {
    const results = enhancedSearch(mockCatalog, 'M', { limit: 1 });
    expect(results.length).toBeLessThanOrEqual(1);
  });

  it('should include match details', () => {
    const results = enhancedSearch(mockCatalog, 'M31');
    if (results.length > 0) {
      expect(results[0].score).toBeGreaterThan(0);
      expect(results[0].matchedField).toBeDefined();
    }
  });

  it('should accept custom weights', () => {
    const results = enhancedSearch(mockCatalog, 'Galaxy', {
      weights: { name: 2.0, type: 1.0 },
    });
    expect(Array.isArray(results)).toBe(true);
  });
});

describe('enhancedQuickSearch', () => {
  const mockCatalog: DeepSkyObject[] = [
    { id: 'M31', name: 'M31', type: 'Galaxy', ra: 10, dec: 41, constellation: 'And', alternateNames: ['Andromeda Galaxy'] },
    { id: 'M42', name: 'M42', type: 'Nebula', ra: 83, dec: -5, constellation: 'Ori' },
  ];

  afterEach(() => {
    clearSearchIndexCache();
  });

  it('should return DeepSkyObject array', () => {
    const results = enhancedQuickSearch(mockCatalog, 'M31');
    expect(Array.isArray(results)).toBe(true);
    if (results.length > 0) {
      expect(results[0].name).toBeDefined();
    }
  });

  it('should respect limit', () => {
    const results = enhancedQuickSearch(mockCatalog, 'M', 1);
    expect(results.length).toBeLessThanOrEqual(1);
  });
});

describe('searchWithFuzzyName', () => {
  const mockCatalog: DeepSkyObject[] = [
    { id: 'M31', name: 'M31', type: 'Galaxy', ra: 10, dec: 41, constellation: 'And', alternateNames: ['Andromeda Galaxy'] },
    { id: 'M42', name: 'M42', type: 'Nebula', ra: 83, dec: -5, constellation: 'Ori' },
  ];

  afterEach(() => {
    clearSearchIndexCache();
  });

  it('should use fuzzy name matching when enabled', async () => {
    const filters = createDefaultFilters();
    filters.objectName = 'Andromeda';
    
    const result = await searchWithFuzzyName(mockCatalog, filters, {
      latitude: 45,
      longitude: -75,
      fuzzySearch: true,
    });
    expect(result.objects.some(o => o.name === 'M31')).toBe(true);
  });

  it('should fall back to standard search without name filter', async () => {
    const filters = createDefaultFilters();
    
    const result = await searchWithFuzzyName(mockCatalog, filters, {
      latitude: 45,
      longitude: -75,
      fuzzySearch: true,
    });
    expect(result.objects.length).toBe(2);
  });

  it('should fall back when fuzzySearch is false', async () => {
    const filters = createDefaultFilters();
    filters.objectName = 'M31';
    
    const result = await searchWithFuzzyName(mockCatalog, filters, {
      latitude: 45,
      longitude: -75,
      fuzzySearch: false,
    });
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
  });
});

describe('getCatalogStats', () => {
  const mockCatalog: DeepSkyObject[] = [
    { id: '1', name: 'M31', type: 'Galaxy', ra: 10, dec: 41, magnitude: 3.4, sizeMax: 178, constellation: 'And' },
    { id: '2', name: 'M42', type: 'Nebula', ra: 83, dec: -5, magnitude: 4.0, sizeMax: 85, constellation: 'Ori' },
    { id: '3', name: 'M45', type: 'OpenCluster', ra: 56, dec: 24, magnitude: 1.6, sizeMax: 110, constellation: 'Tau' },
    { id: '4', name: 'NGC891', type: 'Galaxy', ra: 35, dec: 42, constellation: 'And' },
  ];

  it('should count total objects', () => {
    const stats = getCatalogStats(mockCatalog);
    expect(stats.totalObjects).toBe(4);
  });

  it('should count by type', () => {
    const stats = getCatalogStats(mockCatalog);
    expect(stats.byType['Galaxy']).toBe(2);
    expect(stats.byType['Nebula']).toBe(1);
    expect(stats.byType['OpenCluster']).toBe(1);
  });

  it('should count by constellation', () => {
    const stats = getCatalogStats(mockCatalog);
    expect(stats.byConstellation['And']).toBe(2);
    expect(stats.byConstellation['Ori']).toBe(1);
  });

  it('should track magnitude range', () => {
    const stats = getCatalogStats(mockCatalog);
    expect(stats.magnitudeRange.min).toBe(1.6);
    expect(stats.magnitudeRange.max).toBe(4.0);
  });

  it('should track size range', () => {
    const stats = getCatalogStats(mockCatalog);
    expect(stats.sizeRange.min).toBe(85);
    expect(stats.sizeRange.max).toBe(178);
  });

  it('should handle empty catalog', () => {
    const stats = getCatalogStats([]);
    expect(stats.totalObjects).toBe(0);
    expect(stats.magnitudeRange.min).toBe(0);
    expect(stats.magnitudeRange.max).toBe(20);
    expect(stats.sizeRange.min).toBe(0);
    expect(stats.sizeRange.max).toBe(100);
  });
});

describe('getTonightsBest', () => {
  const mockCatalog: DeepSkyObject[] = [
    { id: '1', name: 'M31', type: 'Galaxy', ra: 10, dec: 41, magnitude: 3.4, constellation: 'And' },
    { id: '2', name: 'M42', type: 'Nebula', ra: 83, dec: -5, magnitude: 4.0, constellation: 'Ori' },
  ];

  it('should return an array', () => {
    const results = getTonightsBest(mockCatalog, { latitude: 45, longitude: -75 });
    expect(Array.isArray(results)).toBe(true);
  });

  it('should respect limit option', () => {
    const results = getTonightsBest(mockCatalog, { latitude: 45, longitude: -75, limit: 1 });
    expect(results.length).toBeLessThanOrEqual(1);
  });

  it('should accept date option', () => {
    const results = getTonightsBest(mockCatalog, {
      latitude: 45,
      longitude: -75,
      date: new Date('2025-07-15'),
    });
    expect(Array.isArray(results)).toBe(true);
  });
});

describe('clearSearchIndexCache', () => {
  it('should clear the cache without error', () => {
    expect(() => clearSearchIndexCache()).not.toThrow();
  });

  it('should allow subsequent searches after clearing', () => {
    clearSearchIndexCache();
    const catalog: DeepSkyObject[] = [
      { id: 'M31', name: 'M31', type: 'Galaxy', ra: 10, dec: 41, constellation: 'And' },
    ];
    const results = enhancedSearch(catalog, 'M31');
    expect(results.length).toBeGreaterThan(0);
    clearSearchIndexCache();
  });
});
