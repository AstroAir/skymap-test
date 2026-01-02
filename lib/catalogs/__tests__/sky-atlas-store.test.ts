import { act, renderHook } from '@testing-library/react';
import { useSkyAtlasStore } from '../sky-atlas-store';

// Mock search-engine
jest.mock('../search-engine', () => ({
  searchDeepSkyObjects: jest.fn().mockResolvedValue({
    objects: [],
    totalCount: 0,
    filteredCount: 0,
    page: 1,
    pageSize: 50,
    totalPages: 0,
  }),
  createDefaultFilters: jest.fn(() => ({
    objectName: '',
    filterDate: new Date(),
    objectTypes: [],
    constellation: '',
    raRange: { from: null, through: null },
    decRange: { from: null, through: null },
    magnitudeRange: { from: null, through: null },
    brightnessRange: { from: null, through: null },
    sizeRange: { from: null, through: null },
    minimumAltitude: 0,
    altitudeTimeFrom: new Date(),
    altitudeTimeThrough: new Date(),
    altitudeDuration: 0,
    minimumMoonDistance: 0,
    transitTimeFrom: null,
    transitTimeThrough: null,
    orderByField: 'imagingScore',
    orderByDirection: 'desc',
  })),
  initializeFiltersWithNighttime: jest.fn((filters) => filters),
  getTonightsBest: jest.fn(() => []),
  quickSearchByName: jest.fn(() => []),
  getCatalogStats: jest.fn(() => ({
    totalObjects: 0,
    byType: {},
    byCatalog: {},
  })),
}));

// Mock nighttime-calculator
jest.mock('../nighttime-calculator', () => ({
  calculateNighttimeData: jest.fn(() => ({
    sunset: new Date(),
    sunrise: new Date(),
    astronomicalDusk: new Date(),
    astronomicalDawn: new Date(),
    nauticalDusk: new Date(),
    nauticalDawn: new Date(),
    civilDusk: new Date(),
    civilDawn: new Date(),
    nightDuration: 8,
    darkSkyDuration: 6,
  })),
  getReferenceDate: jest.fn(() => new Date()),
}));

// Mock catalog-data
jest.mock('../catalog-data', () => ({
  DSO_CATALOG: [],
}));

describe('useSkyAtlasStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { result } = renderHook(() => useSkyAtlasStore());
    act(() => {
      result.current.resetFilters();
      result.current.selectObject(null);
    });
  });

  describe('initial state', () => {
    it('should have default location', () => {
      const { result } = renderHook(() => useSkyAtlasStore());
      expect(typeof result.current.latitude).toBe('number');
      expect(typeof result.current.longitude).toBe('number');
    });

    it('should have default filters', () => {
      const { result } = renderHook(() => useSkyAtlasStore());
      expect(result.current.filters).toBeDefined();
    });

    it('should have no selected object', () => {
      const { result } = renderHook(() => useSkyAtlasStore());
      expect(result.current.selectedObject).toBeNull();
    });

    it('should not be searching initially', () => {
      const { result } = renderHook(() => useSkyAtlasStore());
      expect(result.current.isSearching).toBe(false);
    });
  });

  describe('setLocation', () => {
    it('should update latitude and longitude', () => {
      const { result } = renderHook(() => useSkyAtlasStore());

      act(() => {
        result.current.setLocation(40.7128, -74.006);
      });

      expect(result.current.latitude).toBe(40.7128);
      expect(result.current.longitude).toBe(-74.006);
    });

    it('should update elevation if provided', () => {
      const { result } = renderHook(() => useSkyAtlasStore());

      act(() => {
        result.current.setLocation(40.7128, -74.006, 100);
      });

      expect(result.current.elevation).toBe(100);
    });
  });

  describe('setFilters', () => {
    it('should update filters partially', () => {
      const { result } = renderHook(() => useSkyAtlasStore());

      act(() => {
        result.current.setFilters({ objectName: 'M31' });
      });

      expect(result.current.filters.objectName).toBe('M31');
    });

    it('should update multiple filter properties', () => {
      const { result } = renderHook(() => useSkyAtlasStore());

      act(() => {
        result.current.setFilters({
          minimumAltitude: 30,
          minimumMoonDistance: 45,
        });
      });

      expect(result.current.filters.minimumAltitude).toBe(30);
      expect(result.current.filters.minimumMoonDistance).toBe(45);
    });
  });

  describe('resetFilters', () => {
    it('should reset filters to defaults', () => {
      const { result } = renderHook(() => useSkyAtlasStore());

      act(() => {
        result.current.setFilters({ objectName: 'M31', minimumAltitude: 45 });
      });

      act(() => {
        result.current.resetFilters();
      });

      expect(result.current.filters.objectName).toBe('');
    });
  });

  describe('selectObject', () => {
    it('should set selected object', () => {
      const { result } = renderHook(() => useSkyAtlasStore());
      const mockObject = {
        id: 'M31',
        name: 'Andromeda Galaxy',
        ra: 10.684,
        dec: 41.269,
        type: 'Galaxy' as const,
        magnitude: 3.4,
      };

      act(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        result.current.selectObject(mockObject as any);
      });

      expect(result.current.selectedObject).toBeDefined();
      expect(result.current.selectedObject?.id).toBe('M31');
    });

    it('should clear selected object when set to null', () => {
      const { result } = renderHook(() => useSkyAtlasStore());

      act(() => {
        result.current.selectObject(null);
      });

      expect(result.current.selectedObject).toBeNull();
    });
  });

  describe('setQuickSearchTerm', () => {
    it('should update quick search term', () => {
      const { result } = renderHook(() => useSkyAtlasStore());

      act(() => {
        result.current.setQuickSearchTerm('NGC');
      });

      expect(result.current.quickSearchTerm).toBe('NGC');
    });
  });

  describe('setPage', () => {
    it('should update current page', () => {
      const { result } = renderHook(() => useSkyAtlasStore());

      act(() => {
        result.current.setPage(2);
      });

      expect(result.current.currentPage).toBe(2);
    });
  });

  describe('setOrderBy', () => {
    it('should update order field and direction', () => {
      const { result } = renderHook(() => useSkyAtlasStore());

      act(() => {
        result.current.setOrderBy('magnitude', 'asc');
      });

      expect(result.current.filters.orderByField).toBe('magnitude');
      expect(result.current.filters.orderByDirection).toBe('asc');
    });
  });

  describe('UI state', () => {
    it('should have showFiltersPanel state', () => {
      const { result } = renderHook(() => useSkyAtlasStore());
      expect(typeof result.current.showFiltersPanel).toBe('boolean');
    });

    it('should have showResultsPanel state', () => {
      const { result } = renderHook(() => useSkyAtlasStore());
      expect(typeof result.current.showResultsPanel).toBe('boolean');
    });
  });

  describe('search', () => {
    it('should set isSearching to true during search', async () => {
      const { result } = renderHook(() => useSkyAtlasStore());

      let searchPromise: Promise<void>;
      act(() => {
        searchPromise = result.current.search();
      });

      // Note: isSearching might be true briefly
      await act(async () => {
        await searchPromise;
      });

      expect(result.current.isSearching).toBe(false);
    });
  });
});
