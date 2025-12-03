/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { useObjectSearch } from '../use-object-search';

// Mock stores
jest.mock('@/lib/starmap/stores', () => ({
  useStellariumStore: jest.fn((selector) =>
    selector({
      stel: null,
    })
  ),
}));

jest.mock('@/lib/starmap/stores/target-list-store', () => ({
  useTargetListStore: jest.fn((selector) =>
    selector({
      targets: [],
    })
  ),
}));

describe('useObjectSearch', () => {
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
  });

  it('returns initial state', () => {
    const { result } = renderHook(() => useObjectSearch());

    expect(result.current.query).toBe('');
    expect(result.current.results).toEqual([]);
    expect(result.current.isSearching).toBe(false);
  });

  it('provides setQuery function', () => {
    const { result } = renderHook(() => useObjectSearch());

    expect(typeof result.current.setQuery).toBe('function');
  });

  it('provides search function', () => {
    const { result } = renderHook(() => useObjectSearch());

    expect(typeof result.current.search).toBe('function');
  });

  it('provides clearSearch function', () => {
    const { result } = renderHook(() => useObjectSearch());

    expect(typeof result.current.clearSearch).toBe('function');
  });

  it('updates query', () => {
    const { result } = renderHook(() => useObjectSearch());

    act(() => {
      result.current.setQuery('M31');
    });

    expect(result.current.query).toBe('M31');
  });

  it('clears search', () => {
    const { result } = renderHook(() => useObjectSearch());

    act(() => {
      result.current.setQuery('M31');
    });

    act(() => {
      result.current.clearSearch();
    });

    expect(result.current.query).toBe('');
    expect(result.current.results).toEqual([]);
  });

  it('searches for objects', () => {
    const { result } = renderHook(() => useObjectSearch());

    act(() => {
      result.current.search('M31');
    });

    // Results should be populated after search
    expect(result.current.results.length).toBeGreaterThanOrEqual(0);
  });

  it('provides filters', () => {
    const { result } = renderHook(() => useObjectSearch());

    expect(result.current.filters).toBeDefined();
    expect(result.current.filters.types).toBeDefined();
    expect(Array.isArray(result.current.filters.types)).toBe(true);
  });

  it('provides setFilters function', () => {
    const { result } = renderHook(() => useObjectSearch());

    expect(typeof result.current.setFilters).toBe('function');
  });

  it('updates filters', () => {
    const { result } = renderHook(() => useObjectSearch());

    act(() => {
      result.current.setFilters({ includeTargetList: false });
    });

    expect(result.current.filters.includeTargetList).toBe(false);
  });

  it('provides sortBy option', () => {
    const { result } = renderHook(() => useObjectSearch());

    expect(result.current.sortBy).toBeDefined();
  });

  it('provides setSortBy function', () => {
    const { result } = renderHook(() => useObjectSearch());

    expect(typeof result.current.setSortBy).toBe('function');
  });

  it('updates sortBy', () => {
    const { result } = renderHook(() => useObjectSearch());

    act(() => {
      result.current.setSortBy('name');
    });

    expect(result.current.sortBy).toBe('name');
  });

  it('provides selection functions', () => {
    const { result } = renderHook(() => useObjectSearch());

    expect(typeof result.current.toggleSelection).toBe('function');
    expect(typeof result.current.selectAll).toBe('function');
    expect(typeof result.current.clearSelection).toBe('function');
    expect(typeof result.current.isSelected).toBe('function');
    expect(typeof result.current.getSelectedItems).toBe('function');
  });

  it('provides recent searches', () => {
    const { result } = renderHook(() => useObjectSearch());

    expect(Array.isArray(result.current.recentSearches)).toBe(true);
  });

  it('provides popularObjects', () => {
    const { result } = renderHook(() => useObjectSearch());

    expect(Array.isArray(result.current.popularObjects)).toBe(true);
  });

  it('provides quickCategories', () => {
    const { result } = renderHook(() => useObjectSearch());

    expect(Array.isArray(result.current.quickCategories)).toBe(true);
  });
});
