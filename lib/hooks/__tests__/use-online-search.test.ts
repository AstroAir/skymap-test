/**
 * Online Search Hook Tests
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useOnlineSearch } from '../use-online-search';

// Mock dependencies
jest.mock('@/lib/stores', () => ({
  useStellariumStore: jest.fn(() => ({ stel: null })),
}));

jest.mock('@/lib/stores/target-list-store', () => ({
  useTargetListStore: jest.fn(() => ({ targets: [] })),
}));

jest.mock('@/lib/stores/search-store', () => ({
  useSearchStore: jest.fn(() => ({
    settings: { timeout: 15000 },
    favorites: [],
    currentSearchMode: 'hybrid',
    setSearchMode: jest.fn(),
    addFavorite: jest.fn(),
    removeFavorite: jest.fn(),
    isFavorite: jest.fn(() => false),
    addRecentSearch: jest.fn(),
    getRecentSearches: jest.fn(() => []),
    clearRecentSearches: jest.fn(),
    cacheSearchResults: jest.fn(),
    getCachedResults: jest.fn(() => null),
    updateAllOnlineStatus: jest.fn(),
    getEnabledSources: jest.fn(() => ['sesame', 'simbad']),
  })),
}));

jest.mock('@/lib/services/online-search-service', () => ({
  searchOnlineByName: jest.fn(() => Promise.resolve({
    results: [],
    sources: ['sesame'],
    totalCount: 0,
    searchTimeMs: 100,
  })),
  // Return a never-resolving promise to avoid async setState outside act()
  checkOnlineSearchAvailability: jest.fn().mockReturnValue(new Promise(() => {})),
}));

jest.mock('@/lib/catalogs', () => ({
  calculateSearchMatch: jest.fn(() => ({ score: 0.5, matchType: 'contains' })),
  COMMON_NAME_TO_CATALOG: {},
  PHONETIC_VARIATIONS: {},
  parseCatalogId: jest.fn(() => null),
  jaroWinklerSimilarity: jest.fn(() => 0.5),
  CELESTIAL_BODIES: [
    { Name: 'Moon', Type: 'Moon', RA: 0, Dec: 0 },
    { Name: 'Jupiter', Type: 'Planet', RA: 0, Dec: 0 },
  ],
  POPULAR_DSOS: [
    { Name: 'M31', Type: 'DSO', RA: 10.68, Dec: 41.27 },
  ],
  CONSTELLATION_SEARCH_DATA: [],
  getMatchScore: jest.fn(() => 0),
}));

describe('useOnlineSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useOnlineSearch());

      expect(result.current.query).toBe('');
      expect(result.current.results).toEqual([]);
      expect(result.current.isSearching).toBe(false);
      expect(result.current.isOnlineSearching).toBe(false);
      expect(result.current.searchMode).toBe('hybrid');
    });

    it('should have default filters', () => {
      const { result } = renderHook(() => useOnlineSearch());

      expect(result.current.filters.types).toContain('DSO');
      expect(result.current.filters.types).toContain('Planet');
      expect(result.current.filters.includeTargetList).toBe(true);
      expect(result.current.filters.searchMode).toBe('name');
    });

    it('should have popular objects', () => {
      const { result } = renderHook(() => useOnlineSearch());

      expect(result.current.popularObjects.length).toBeGreaterThan(0);
      expect(result.current.popularObjects[0].Name).toBe('M31');
    });
  });

  describe('search functionality', () => {
    it('should update query when setQuery is called', () => {
      const { result } = renderHook(() => useOnlineSearch());

      act(() => {
        result.current.setQuery('M31');
      });

      expect(result.current.query).toBe('M31');
    });

    it('should clear search results', () => {
      const { result } = renderHook(() => useOnlineSearch());

      act(() => {
        result.current.setQuery('M31');
      });

      act(() => {
        result.current.clearSearch();
      });

      expect(result.current.query).toBe('');
      expect(result.current.results).toEqual([]);
    });

    it('should debounce search', async () => {
      const { result } = renderHook(() => useOnlineSearch());

      act(() => {
        result.current.search('M31');
      });

      // Should not search immediately
      expect(result.current.isSearching).toBe(false);

      // Fast-forward debounce timer
      act(() => {
        jest.advanceTimersByTime(250);
      });

      await waitFor(() => {
        expect(result.current.query).toBe('M31');
      });
    });
  });

  describe('selection management', () => {
    it('should toggle selection', () => {
      const { result } = renderHook(() => useOnlineSearch());

      act(() => {
        result.current.toggleSelection('test-id');
      });

      expect(result.current.isSelected('test-id')).toBe(true);

      act(() => {
        result.current.toggleSelection('test-id');
      });

      expect(result.current.isSelected('test-id')).toBe(false);
    });

    it('should clear selection', () => {
      const { result } = renderHook(() => useOnlineSearch());

      act(() => {
        result.current.toggleSelection('test-id-1');
        result.current.toggleSelection('test-id-2');
      });

      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.selectedIds.size).toBe(0);
    });
  });

  describe('filters', () => {
    it('should update filters', () => {
      const { result } = renderHook(() => useOnlineSearch());

      act(() => {
        result.current.setFilters({ minMagnitude: 5 });
      });

      expect(result.current.filters.minMagnitude).toBe(5);
    });

    it('should update sort option', () => {
      const { result } = renderHook(() => useOnlineSearch());

      act(() => {
        result.current.setSortBy('magnitude');
      });

      expect(result.current.sortBy).toBe('magnitude');
    });
  });

  describe('search mode', () => {
    it('should update search mode', () => {
      const { result } = renderHook(() => useOnlineSearch());

      act(() => {
        result.current.setSearchMode('online');
      });

      expect(result.current.searchMode).toBe('online');
    });
  });

  describe('grouped results', () => {
    it('should return empty map for no results', () => {
      const { result } = renderHook(() => useOnlineSearch());

      expect(result.current.groupedResults.size).toBe(0);
    });
  });

  describe('favorites', () => {
    it('should check if item is favorite', () => {
      const { result } = renderHook(() => useOnlineSearch());

      const isFav = result.current.isFavorite('test-id');
      expect(typeof isFav).toBe('boolean');
    });
  });

  describe('recent searches', () => {
    it('should return recent searches', () => {
      const { result } = renderHook(() => useOnlineSearch());

      expect(Array.isArray(result.current.recentSearches)).toBe(true);
    });
  });
});
