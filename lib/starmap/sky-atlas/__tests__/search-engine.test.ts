/**
 * @jest-environment jsdom
 */
import {
  createDefaultFilters,
  initializeFiltersWithNighttime,
  searchDeepSkyObjects,
  quickSearchByName,
  getTonightsBest,
  getCatalogStats,
} from '../search-engine';
import type { NighttimeData } from '../types';

// Mock deep-sky-object
jest.mock('../deep-sky-object', () => ({
  calculateAltitudeData: jest.fn(() => ({
    objectId: '',
    points: [],
    maxAltitude: 60,
    maxAltitudeTime: new Date(),
    transitTime: new Date(),
    riseTime: new Date(),
    setTime: new Date(),
  })),
  calculateMoonDistance: jest.fn(() => 45),
  calculateTransitTime: jest.fn(() => new Date()),
  isAboveAltitudeForDuration: jest.fn(() => true),
  enrichDeepSkyObject: jest.fn((dso) => ({ ...dso, altitude: 60, moonDistance: 45 })),
}));

// Mock nighttime-calculator
jest.mock('../nighttime-calculator', () => ({
  calculateNighttimeData: jest.fn(() => ({
    date: new Date(),
    referenceDate: new Date(),
    sunRiseAndSet: { rise: new Date(), set: new Date() },
    twilightRiseAndSet: { rise: new Date(), set: new Date() },
    moonRiseAndSet: { rise: new Date(), set: new Date() },
    moonPhase: 'waxingGibbous',
    moonPhaseValue: 0.45,
    moonIllumination: 97,
  })),
  getReferenceDate: jest.fn(() => new Date()),
}));

describe('createDefaultFilters', () => {
  it('returns filter object', () => {
    const filters = createDefaultFilters();
    expect(filters).toBeDefined();
    expect(typeof filters).toBe('object');
  });

  it('has empty objectName', () => {
    const filters = createDefaultFilters();
    expect(filters.objectName).toBe('');
  });

  it('has filterDate', () => {
    const filters = createDefaultFilters();
    expect(filters.filterDate).toBeDefined();
    expect(filters.filterDate instanceof Date).toBe(true);
  });

  it('has default minimumAltitude of 0', () => {
    const filters = createDefaultFilters();
    expect(filters.minimumAltitude).toBe(0);
  });

  it('has default minimumMoonDistance of 0', () => {
    const filters = createDefaultFilters();
    expect(filters.minimumMoonDistance).toBe(0);
  });

  it('has orderByField', () => {
    const filters = createDefaultFilters();
    expect(filters.orderByField).toBeDefined();
  });

  it('has orderByDirection', () => {
    const filters = createDefaultFilters();
    expect(filters.orderByDirection).toBeDefined();
  });
});

describe('initializeFiltersWithNighttime', () => {
  it('returns partial filter object', () => {
    const nighttimeData: NighttimeData = {
      date: new Date(),
      referenceDate: new Date(),
      sunRiseAndSet: { rise: new Date(), set: new Date() },
      civilTwilightRiseAndSet: { rise: new Date(), set: new Date() },
      nauticalTwilightRiseAndSet: { rise: new Date(), set: new Date() },
      twilightRiseAndSet: { rise: new Date(), set: new Date() },
      moonRiseAndSet: { rise: new Date(), set: new Date() },
      moonPhase: 'waxingGibbous',
      moonPhaseValue: 0.45,
      moonIllumination: 97,
    };

    const filters = initializeFiltersWithNighttime(nighttimeData);
    expect(filters).toBeDefined();
    expect(typeof filters).toBe('object');
  });

  it('sets altitudeTimeFrom', () => {
    const nighttimeData: NighttimeData = {
      date: new Date(),
      referenceDate: new Date(),
      sunRiseAndSet: { rise: new Date(), set: new Date() },
      civilTwilightRiseAndSet: { rise: new Date(), set: new Date() },
      nauticalTwilightRiseAndSet: { rise: new Date(), set: new Date() },
      twilightRiseAndSet: { rise: new Date(), set: new Date() },
      moonRiseAndSet: { rise: new Date(), set: new Date() },
      moonPhase: 'waxingGibbous',
      moonPhaseValue: 0.45,
      moonIllumination: 97,
    };

    const filters = initializeFiltersWithNighttime(nighttimeData);
    expect(filters.altitudeTimeFrom).toBeDefined();
  });

  it('sets altitudeTimeThrough', () => {
    const nighttimeData: NighttimeData = {
      date: new Date(),
      referenceDate: new Date(),
      sunRiseAndSet: { rise: new Date(), set: new Date() },
      civilTwilightRiseAndSet: { rise: new Date(), set: new Date() },
      nauticalTwilightRiseAndSet: { rise: new Date(), set: new Date() },
      twilightRiseAndSet: { rise: new Date(), set: new Date() },
      moonRiseAndSet: { rise: new Date(), set: new Date() },
      moonPhase: 'waxingGibbous',
      moonPhaseValue: 0.45,
      moonIllumination: 97,
    };

    const filters = initializeFiltersWithNighttime(nighttimeData);
    expect(filters.altitudeTimeThrough).toBeDefined();
  });
});

describe('searchDeepSkyObjects', () => {
  it('returns search result object', async () => {
    const filters = createDefaultFilters();
    const result = await searchDeepSkyObjects([], filters, { latitude: 40.7128, longitude: -74.006 });

    expect(result).toBeDefined();
    expect(result).toHaveProperty('objects');
    expect(result).toHaveProperty('totalCount');
    expect(result).toHaveProperty('totalPages');
  });

  it('returns empty array for empty catalog', async () => {
    const filters = createDefaultFilters();
    const result = await searchDeepSkyObjects([], filters, { latitude: 40.7128, longitude: -74.006 });

    expect(result.objects).toEqual([]);
    expect(result.totalCount).toBe(0);
  });
});

describe('quickSearchByName', () => {
  it('returns array', () => {
    const result = quickSearchByName([], 'M31');
    expect(Array.isArray(result)).toBe(true);
  });

  it('returns empty array for empty query', () => {
    const result = quickSearchByName([], '');
    expect(result).toEqual([]);
  });
});

describe('getTonightsBest', () => {
  it('returns array', () => {
    const result = getTonightsBest([], { latitude: 40.7128, longitude: -74.006 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe('getCatalogStats', () => {
  it('returns stats object', () => {
    const stats = getCatalogStats([]);

    expect(stats).toBeDefined();
    expect(stats).toHaveProperty('totalObjects');
    expect(stats).toHaveProperty('byType');
    expect(stats).toHaveProperty('byConstellation');
  });

  it('returns zero total for empty catalog', () => {
    const stats = getCatalogStats([]);
    expect(stats.totalObjects).toBe(0);
  });
});
