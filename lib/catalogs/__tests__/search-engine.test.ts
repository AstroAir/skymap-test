/**
 * Tests for search-engine.ts
 */

import {
  createDefaultFilters,
  initializeFiltersWithNighttime,
  searchDeepSkyObjects,
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
  calculateNighttimeData: jest.fn(),
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
});
