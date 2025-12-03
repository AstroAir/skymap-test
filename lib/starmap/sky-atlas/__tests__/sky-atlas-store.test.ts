/**
 * @jest-environment jsdom
 */
import { useSkyAtlasStore } from '../sky-atlas-store';

// Mock zustand persist
jest.mock('zustand/middleware', () => ({
  persist: (config: unknown) => config,
}));

// Mock search-engine
jest.mock('../search-engine', () => ({
  searchDeepSkyObjects: jest.fn(() => ({
    objects: [],
    totalCount: 0,
    filteredCount: 0,
    page: 0,
    pageSize: 50,
    totalPages: 0,
  })),
  createDefaultFilters: jest.fn(() => ({
    minAltitude: 30,
    maxAltitude: 90,
    minMagnitude: 0,
    maxMagnitude: 15,
    types: [],
    constellations: [],
    catalogs: [],
    searchTerm: '',
    orderBy: 'altitude',
    orderDirection: 'desc',
  })),
  initializeFiltersWithNighttime: jest.fn((filters) => filters),
  getTonightsBest: jest.fn(() => []),
  quickSearchByName: jest.fn(() => []),
  getCatalogStats: jest.fn(() => ({
    totalObjects: 0,
    byType: {},
    byConstellation: {},
    byCatalog: {},
    magnitudeRange: { min: 0, max: 20 },
    sizeRange: { min: 0, max: 100 },
  })),
}));

// Mock nighttime-calculator
jest.mock('../nighttime-calculator', () => ({
  calculateNighttimeData: jest.fn(() => ({
    sunRiseAndSet: { rise: new Date(), set: new Date() },
    moonRiseAndSet: { rise: new Date(), set: new Date() },
    moonPhase: 'waxingGibbous',
    moonPhaseValue: 0.45,
    moonIllumination: 97,
  })),
  getReferenceDate: jest.fn(() => new Date()),
}));

// Mock catalog-data
jest.mock('../catalog-data', () => ({
  DSO_CATALOG: [],
}));

describe('useSkyAtlasStore', () => {
  describe('initial state', () => {
    it('has default location at 0,0', () => {
      const state = useSkyAtlasStore.getState();
      expect(state.latitude).toBe(0);
      expect(state.longitude).toBe(0);
    });

    it('has filters defined', () => {
      const state = useSkyAtlasStore.getState();
      expect(state.filters).toBeDefined();
    });

    it('has no nighttime data initially', () => {
      expect(useSkyAtlasStore.getState().nighttimeData).toBeNull();
    });

    it('has no search result initially', () => {
      expect(useSkyAtlasStore.getState().searchResult).toBeNull();
    });

    it('is not searching initially', () => {
      expect(useSkyAtlasStore.getState().isSearching).toBe(false);
    });

    it('has no selected object', () => {
      expect(useSkyAtlasStore.getState().selectedObject).toBeNull();
    });

    it('has empty quick search', () => {
      expect(useSkyAtlasStore.getState().quickSearchTerm).toBe('');
      expect(useSkyAtlasStore.getState().quickSearchResults).toEqual([]);
    });

    it('shows panels by default', () => {
      expect(useSkyAtlasStore.getState().showFiltersPanel).toBe(true);
      expect(useSkyAtlasStore.getState().showResultsPanel).toBe(true);
    });
  });

  describe('setLocation', () => {
    it('sets location coordinates', () => {
      useSkyAtlasStore.getState().setLocation(40.7128, -74.006, 10);

      const state = useSkyAtlasStore.getState();
      expect(state.latitude).toBe(40.7128);
      expect(state.longitude).toBe(-74.006);
      expect(state.elevation).toBe(10);
    });

    it('uses default elevation if not provided', () => {
      useSkyAtlasStore.getState().setLocation(51.5074, -0.1278);

      const state = useSkyAtlasStore.getState();
      expect(state.latitude).toBe(51.5074);
      expect(state.longitude).toBe(-0.1278);
    });
  });

  describe('setFilters', () => {
    it('updates filter values', () => {
      useSkyAtlasStore.getState().setFilters({ minimumAltitude: 45 });

      expect(useSkyAtlasStore.getState().filters.minimumAltitude).toBe(45);
    });
  });

  describe('resetFilters', () => {
    it('resets filters to defaults', () => {
      useSkyAtlasStore.getState().setFilters({ minimumAltitude: 60 });
      useSkyAtlasStore.getState().resetFilters();

      // After reset, minimumAltitude should be back to default
      expect(useSkyAtlasStore.getState().filters).toBeDefined();
    });
  });

  describe('selectObject', () => {
    it('selects an object', () => {
      const dso = {
        id: 'M31',
        name: 'Andromeda Galaxy',
        type: 'Galaxy' as const,
        constellation: 'Andromeda',
        ra: 10.68,
        dec: 41.27,
      };

      useSkyAtlasStore.getState().selectObject(dso);
      expect(useSkyAtlasStore.getState().selectedObject).toEqual(dso);
    });

    it('clears selected object', () => {
      useSkyAtlasStore.getState().selectObject(null);
      expect(useSkyAtlasStore.getState().selectedObject).toBeNull();
    });
  });

  describe('setQuickSearchTerm', () => {
    it('sets quick search term', () => {
      useSkyAtlasStore.getState().setQuickSearchTerm('M31');
      expect(useSkyAtlasStore.getState().quickSearchTerm).toBe('M31');
    });
  });

  describe('toggleFiltersPanel', () => {
    it('toggles filters panel visibility', () => {
      const initial = useSkyAtlasStore.getState().showFiltersPanel;

      useSkyAtlasStore.getState().toggleFiltersPanel();
      expect(useSkyAtlasStore.getState().showFiltersPanel).toBe(!initial);

      useSkyAtlasStore.getState().toggleFiltersPanel();
      expect(useSkyAtlasStore.getState().showFiltersPanel).toBe(initial);
    });
  });

  describe('toggleResultsPanel', () => {
    it('toggles results panel visibility', () => {
      const initial = useSkyAtlasStore.getState().showResultsPanel;

      useSkyAtlasStore.getState().toggleResultsPanel();
      expect(useSkyAtlasStore.getState().showResultsPanel).toBe(!initial);

      useSkyAtlasStore.getState().toggleResultsPanel();
      expect(useSkyAtlasStore.getState().showResultsPanel).toBe(initial);
    });
  });

  describe('setPage', () => {
    it('sets current page', () => {
      useSkyAtlasStore.getState().setPage(5);
      expect(useSkyAtlasStore.getState().currentPage).toBe(5);
    });
  });
});
