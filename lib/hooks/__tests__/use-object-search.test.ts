/**
 * @jest-environment jsdom
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useObjectSearch, getDetailedMatch } from '../use-object-search';

// Mock the stores
jest.mock('@/lib/stores', () => ({
  useStellariumStore: jest.fn(() => null),
}));

jest.mock('@/lib/stores/target-list-store', () => ({
  useTargetListStore: jest.fn(() => []),
}));

describe('useObjectSearch', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('initial state', () => {
    it('should have empty initial state', () => {
      const { result } = renderHook(() => useObjectSearch());
      
      expect(result.current.query).toBe('');
      expect(result.current.results).toEqual([]);
      expect(result.current.isSearching).toBe(false);
    });

    it('should have default filters', () => {
      const { result } = renderHook(() => useObjectSearch());
      
      expect(result.current.filters.types).toContain('DSO');
      expect(result.current.filters.types).toContain('Planet');
      expect(result.current.filters.includeTargetList).toBe(true);
      expect(result.current.filters.searchMode).toBe('name');
    });

    it('should have default sort by relevance', () => {
      const { result } = renderHook(() => useObjectSearch());
      
      expect(result.current.sortBy).toBe('relevance');
    });

    it('should have popular objects available', () => {
      const { result } = renderHook(() => useObjectSearch());
      
      expect(result.current.popularObjects).toBeDefined();
      expect(result.current.popularObjects.length).toBeGreaterThan(0);
    });
  });

  describe('search', () => {
    it('should update query', async () => {
      const { result } = renderHook(() => useObjectSearch());
      
      act(() => {
        result.current.setQuery('M31');
      });
      
      expect(result.current.query).toBe('M31');
    });

    it('should find Messier objects', async () => {
      const { result } = renderHook(() => useObjectSearch());
      
      act(() => {
        result.current.search('M31');
        jest.advanceTimersByTime(200);
      });
      
      await waitFor(() => {
        expect(result.current.results.length).toBeGreaterThan(0);
      });
      
      const m31 = result.current.results.find(r => r.Name === 'M31');
      expect(m31).toBeDefined();
    });

    it('should find objects by common name', async () => {
      const { result } = renderHook(() => useObjectSearch());
      
      act(() => {
        result.current.search('Andromeda');
        jest.advanceTimersByTime(200);
      });
      
      await waitFor(() => {
        expect(result.current.results.length).toBeGreaterThan(0);
      });
      
      // Should find M31 (Andromeda Galaxy) or Andromeda constellation
      const hasAndromeda = result.current.results.some(
        r => r.Name.includes('Andromeda') || r['Common names']?.includes('Andromeda')
      );
      expect(hasAndromeda).toBe(true);
    });

    it('should find planets', async () => {
      const { result } = renderHook(() => useObjectSearch());
      
      act(() => {
        result.current.search('Jupiter');
        jest.advanceTimersByTime(200);
      });
      
      await waitFor(() => {
        expect(result.current.results.length).toBeGreaterThan(0);
      });
      
      const jupiter = result.current.results.find(r => r.Name === 'Jupiter');
      expect(jupiter).toBeDefined();
      expect(jupiter?.Type).toBe('Planet');
    });

    it('should find constellations', async () => {
      const { result } = renderHook(() => useObjectSearch());
      
      act(() => {
        result.current.search('Orion');
        jest.advanceTimersByTime(200);
      });
      
      await waitFor(() => {
        expect(result.current.results.length).toBeGreaterThan(0);
      });
      
      const orion = result.current.results.find(r => r.Type === 'Constellation');
      expect(orion).toBeDefined();
    });

    it('should debounce search', async () => {
      const { result } = renderHook(() => useObjectSearch());
      
      act(() => {
        result.current.search('M');
        result.current.search('M3');
        result.current.search('M31');
      });
      
      // Before debounce completes
      expect(result.current.results).toEqual([]);
      
      act(() => {
        jest.advanceTimersByTime(200);
      });
      
      await waitFor(() => {
        expect(result.current.results.length).toBeGreaterThan(0);
      });
    });

    it('should clear results for empty query', async () => {
      const { result } = renderHook(() => useObjectSearch());
      
      // First search
      act(() => {
        result.current.search('M31');
        jest.advanceTimersByTime(200);
      });
      
      await waitFor(() => {
        expect(result.current.results.length).toBeGreaterThan(0);
      });
      
      // Clear search
      act(() => {
        result.current.search('');
        jest.advanceTimersByTime(200);
      });
      
      await waitFor(() => {
        expect(result.current.results).toEqual([]);
      });
    });
  });

  describe('clearSearch', () => {
    it('should clear query and results', async () => {
      const { result } = renderHook(() => useObjectSearch());
      
      act(() => {
        result.current.search('M31');
        jest.advanceTimersByTime(200);
      });
      
      await waitFor(() => {
        expect(result.current.results.length).toBeGreaterThan(0);
      });
      
      act(() => {
        result.current.clearSearch();
      });
      
      expect(result.current.query).toBe('');
      expect(result.current.results).toEqual([]);
    });

    it('should clear selection', async () => {
      const { result } = renderHook(() => useObjectSearch());
      
      act(() => {
        result.current.search('M31');
        jest.advanceTimersByTime(200);
      });
      
      await waitFor(() => {
        expect(result.current.results.length).toBeGreaterThan(0);
      });
      
      act(() => {
        result.current.selectAll();
        result.current.clearSearch();
      });
      
      expect(result.current.selectedIds.size).toBe(0);
    });
  });

  describe('selection', () => {
    it('should toggle selection', async () => {
      const { result } = renderHook(() => useObjectSearch());
      
      act(() => {
        result.current.search('M31');
        jest.advanceTimersByTime(200);
      });
      
      await waitFor(() => {
        expect(result.current.results.length).toBeGreaterThan(0);
      });
      
      const firstResult = result.current.results[0];
      const id = `${firstResult.Type}-${firstResult.Name}`;
      
      act(() => {
        result.current.toggleSelection(id);
      });
      
      expect(result.current.isSelected(id)).toBe(true);
      
      act(() => {
        result.current.toggleSelection(id);
      });
      
      expect(result.current.isSelected(id)).toBe(false);
    });

    it('should select all results', async () => {
      const { result } = renderHook(() => useObjectSearch());
      
      act(() => {
        result.current.search('M3');
        jest.advanceTimersByTime(200);
      });
      
      await waitFor(() => {
        expect(result.current.results.length).toBeGreaterThan(0);
      });
      
      act(() => {
        result.current.selectAll();
      });
      
      expect(result.current.selectedIds.size).toBe(result.current.results.length);
    });

    it('should clear selection', async () => {
      const { result } = renderHook(() => useObjectSearch());
      
      act(() => {
        result.current.search('M31');
        jest.advanceTimersByTime(200);
      });
      
      await waitFor(() => {
        expect(result.current.results.length).toBeGreaterThan(0);
      });
      
      act(() => {
        result.current.selectAll();
        result.current.clearSelection();
      });
      
      expect(result.current.selectedIds.size).toBe(0);
    });

    it('should get selected items', async () => {
      const { result } = renderHook(() => useObjectSearch());
      
      act(() => {
        result.current.search('M31');
        jest.advanceTimersByTime(200);
      });
      
      await waitFor(() => {
        expect(result.current.results.length).toBeGreaterThan(0);
      });
      
      const firstResult = result.current.results[0];
      const id = `${firstResult.Type}-${firstResult.Name}`;
      
      act(() => {
        result.current.toggleSelection(id);
      });
      
      const selected = result.current.getSelectedItems();
      expect(selected.length).toBe(1);
      expect(selected[0].Name).toBe(firstResult.Name);
    });
  });

  describe('filters', () => {
    it('should update filters', async () => {
      const { result } = renderHook(() => useObjectSearch());
      
      act(() => {
        result.current.setFilters({ types: ['DSO'] });
      });
      
      expect(result.current.filters.types).toEqual(['DSO']);
    });

    it('should merge with existing filters', async () => {
      const { result } = renderHook(() => useObjectSearch());
      
      act(() => {
        result.current.setFilters({ minMagnitude: 5 });
      });
      
      expect(result.current.filters.minMagnitude).toBe(5);
      expect(result.current.filters.types).toBeDefined();
    });
  });

  describe('sorting', () => {
    it('should update sort option', () => {
      const { result } = renderHook(() => useObjectSearch());
      
      act(() => {
        result.current.setSortBy('name');
      });
      
      expect(result.current.sortBy).toBe('name');
    });
  });

  describe('recent searches', () => {
    it('should add recent search', () => {
      const { result } = renderHook(() => useObjectSearch());
      
      act(() => {
        result.current.addRecentSearch('M31');
      });
      
      expect(result.current.recentSearches).toContain('M31');
    });

    it('should clear recent searches', () => {
      const { result } = renderHook(() => useObjectSearch());
      
      act(() => {
        result.current.addRecentSearch('M31');
        result.current.clearRecentSearches();
      });
      
      expect(result.current.recentSearches).toEqual([]);
    });

    it('should store recent searches in state', () => {
      const { result } = renderHook(() => useObjectSearch());
      
      act(() => {
        result.current.addRecentSearch('M42');
        result.current.addRecentSearch('NGC7000');
      });
      
      expect(result.current.recentSearches).toContain('M42');
      expect(result.current.recentSearches).toContain('NGC7000');
    });
  });

  describe('search stats', () => {
    it('should provide search statistics', async () => {
      const { result } = renderHook(() => useObjectSearch());
      
      act(() => {
        result.current.search('M31');
        jest.advanceTimersByTime(200);
      });
      
      await waitFor(() => {
        expect(result.current.searchStats).not.toBeNull();
      });
      
      expect(result.current.searchStats?.totalResults).toBeGreaterThan(0);
      expect(result.current.searchStats?.searchTimeMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('grouped results', () => {
    it('should group results by type', async () => {
      const { result } = renderHook(() => useObjectSearch());
      
      act(() => {
        result.current.search('M');
        jest.advanceTimersByTime(200);
      });
      
      await waitFor(() => {
        expect(result.current.results.length).toBeGreaterThan(0);
      });
      
      expect(result.current.groupedResults).toBeInstanceOf(Map);
    });
  });

  describe('quick categories', () => {
    it('should provide quick categories', () => {
      const { result } = renderHook(() => useObjectSearch());
      
      expect(result.current.quickCategories).toBeDefined();
      expect(result.current.quickCategories.length).toBeGreaterThan(0);
      
      result.current.quickCategories.forEach(category => {
        expect(category.label).toBeDefined();
        expect(category.items).toBeDefined();
      });
    });
  });
});

describe('getDetailedMatch', () => {
  it('should return match result for exact match', () => {
    const item = { Name: 'M31', Type: 'DSO' as const };
    const result = getDetailedMatch(item, 'M31');
    
    expect(result.score).toBeGreaterThan(0);
    expect(result.matchType).toBeDefined();
  });

  it('should return match result for partial match', () => {
    const item = { Name: 'M31', Type: 'DSO' as const, 'Common names': 'Andromeda Galaxy' };
    const result = getDetailedMatch(item, 'andromeda');
    
    expect(result.score).toBeGreaterThan(0);
  });

  it('should return low score for non-match', () => {
    const item = { Name: 'M31', Type: 'DSO' as const };
    const result = getDetailedMatch(item, 'xyz123');
    
    expect(result.score).toBeLessThan(0.3);
  });
});
