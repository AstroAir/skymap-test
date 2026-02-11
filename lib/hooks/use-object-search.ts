'use client';

import { useState, useCallback, useRef, useMemo, useEffect, useTransition } from 'react';
import { useStellariumStore } from '@/lib/stores';
import type { SearchResultItem } from '@/lib/core/types';
import { useTargetListStore } from '@/lib/stores/target-list-store';
import { 
  CELESTIAL_BODIES,
  POPULAR_DSOS,
  MESSIER_CATALOG,
  CONSTELLATION_SEARCH_DATA,
  getMatchScore,
  getDetailedSearchMatch,
  fuzzyMatch,
} from '@/lib/catalogs';
import { createLogger } from '@/lib/logger';

const logger = createLogger('use-object-search');

// Re-export for backward compatibility
export const getDetailedMatch = getDetailedSearchMatch;
// ============================================================================
// Types
// ============================================================================

export type ObjectType = 'DSO' | 'Planet' | 'Star' | 'Moon' | 'Comet' | 'TargetList' | 'Constellation';
export type SortOption = 'name' | 'type' | 'ra' | 'relevance';
export type SearchMode = 'name' | 'coordinates' | 'catalog';

export interface SearchFilters {
  types: ObjectType[];
  includeTargetList: boolean;
  searchMode: SearchMode;
  minMagnitude?: number;
  maxMagnitude?: number;
  searchRadius?: number; // degrees for coordinate search
}

export interface SearchStats {
  totalResults: number;
  resultsByType: Record<string, number>;
  searchTimeMs: number;
}

// Parse coordinate string (supports various formats)
function parseCoordinateSearch(query: string): { ra: number; dec: number } | null {
  // Try to parse as "RA Dec" format
  // Formats: "10.68 41.27", "00h42m44s +41°16'09\"", "00:42:44 +41:16:09"
  
  const trimmed = query.trim();
  
  // Try decimal format: "10.68 41.27" or "10.68, 41.27"
  const decimalMatch = trimmed.match(/^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/);
  if (decimalMatch) {
    const ra = parseFloat(decimalMatch[1]);
    const dec = parseFloat(decimalMatch[2]);
    if (!isNaN(ra) && !isNaN(dec) && ra >= 0 && ra < 360 && dec >= -90 && dec <= 90) {
      return { ra, dec };
    }
  }
  
  // Try HMS/DMS format: "00h42m44s +41°16'09\""
  const hmsMatch = trimmed.match(/(\d+)h\s*(\d+)m\s*([\d.]+)s?\s+([+-]?\d+)[°d]\s*(\d+)[′']\s*([\d.]+)[″"]?/i);
  if (hmsMatch) {
    const raH = parseInt(hmsMatch[1]);
    const raM = parseInt(hmsMatch[2]);
    const raS = parseFloat(hmsMatch[3]);
    const decD = parseInt(hmsMatch[4]);
    const decM = parseInt(hmsMatch[5]);
    const decS = parseFloat(hmsMatch[6]);
    
    const ra = (raH + raM / 60 + raS / 3600) * 15; // Convert hours to degrees
    const decSign = decD < 0 || hmsMatch[4].startsWith('-') ? -1 : 1;
    const dec = decSign * (Math.abs(decD) + decM / 60 + decS / 3600);
    
    if (ra >= 0 && ra < 360 && dec >= -90 && dec <= 90) {
      return { ra, dec };
    }
  }
  
  // Try colon format: "00:42:44 +41:16:09"
  const colonMatch = trimmed.match(/(\d+):(\d+):([\d.]+)\s+([+-]?\d+):(\d+):([\d.]+)/);
  if (colonMatch) {
    const raH = parseInt(colonMatch[1]);
    const raM = parseInt(colonMatch[2]);
    const raS = parseFloat(colonMatch[3]);
    const decD = parseInt(colonMatch[4]);
    const decM = parseInt(colonMatch[5]);
    const decS = parseFloat(colonMatch[6]);
    
    const ra = (raH + raM / 60 + raS / 3600) * 15;
    const decSign = decD < 0 || colonMatch[4].startsWith('-') ? -1 : 1;
    const dec = decSign * (Math.abs(decD) + decM / 60 + decS / 3600);
    
    if (ra >= 0 && ra < 360 && dec >= -90 && dec <= 90) {
      return { ra, dec };
    }
  }
  
  return null;
}

// Format RA in HMS
function formatRA(raDeg: number): string {
  const hours = raDeg / 15;
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  const s = ((hours - h) * 60 - m) * 60;
  return `${h.toString().padStart(2, '0')}h${m.toString().padStart(2, '0')}m${s.toFixed(1)}s`;
}

// Format Dec in DMS
function formatDec(decDeg: number): string {
  const sign = decDeg >= 0 ? '+' : '-';
  const absD = Math.abs(decDeg);
  const d = Math.floor(absD);
  const m = Math.floor((absD - d) * 60);
  const s = ((absD - d) * 60 - m) * 60;
  return `${sign}${d.toString().padStart(2, '0')}°${m.toString().padStart(2, '0')}'${s.toFixed(1)}"`;
}

export interface SearchState {
  query: string;
  results: SearchResultItem[];
  isSearching: boolean;
  selectedIds: Set<string>;
  filters: SearchFilters;
  sortBy: SortOption;
}

export interface UseObjectSearchReturn {
  // State
  query: string;
  results: SearchResultItem[];
  groupedResults: Map<string, SearchResultItem[]>;
  isSearching: boolean;
  selectedIds: Set<string>;
  filters: SearchFilters;
  sortBy: SortOption;
  recentSearches: string[];
  searchStats: SearchStats | null;
  
  // Actions
  setQuery: (query: string) => void;
  search: (query: string) => void;
  clearSearch: () => void;
  toggleSelection: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  setFilters: (filters: Partial<SearchFilters>) => void;
  setSortBy: (sort: SortOption) => void;
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  
  // Helpers
  getSelectedItems: () => SearchResultItem[];
  isSelected: (id: string) => boolean;
  
  // Quick access
  popularObjects: SearchResultItem[];
  quickCategories: { label: string; items: SearchResultItem[] }[];
}

// ============================================================================
// Hook Implementation
// ============================================================================

const DEBOUNCE_MS = 150;
const MAX_RESULTS = 50;
const MAX_RECENT = 8;
const FUZZY_THRESHOLD = 0.3; // Minimum score to include in results

// Generate unique ID for search result
function getResultId(item: SearchResultItem): string {
  return `${item.Type || 'unknown'}-${item.Name}`;
}

export function useObjectSearch(): UseObjectSearchReturn {
  const stel = useStellariumStore((state) => state.stel);
  const targets = useTargetListStore((state) => state.targets);
  
  const [state, setState] = useState<SearchState>({
    query: '',
    results: [],
    isSearching: false,
    selectedIds: new Set(),
    filters: {
      types: ['DSO', 'Planet', 'Star', 'Moon', 'Comet', 'TargetList', 'Constellation'],
      includeTargetList: true,
      searchMode: 'name',
      minMagnitude: undefined,
      maxMagnitude: undefined,
      searchRadius: 5,
    },
    sortBy: 'relevance',
  });
  
  const [searchStats, setSearchStats] = useState<SearchStats | null>(null);
  
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('starmap-recent-searches');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [, startTransition] = useTransition();
  
  // Save recent searches to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('starmap-recent-searches', JSON.stringify(recentSearches));
    }
  }, [recentSearches]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Search implementation
  const performSearch = useCallback(async (query: string, filters: SearchFilters) => {
    const startTime = performance.now();
    
    // Cancel previous search
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    if (!query.trim()) {
      setState(prev => ({ ...prev, results: [], isSearching: false }));
      setSearchStats(null);
      return;
    }
    
    setState(prev => ({ ...prev, isSearching: true }));
    
    const results: SearchResultItem[] = [];
    const lowerQuery = query.toLowerCase().trim();
    const addedNames = new Set<string>();
    
    // Helper to check magnitude filter
    const passesMagnitudeFilter = (magnitude?: number): boolean => {
      if (magnitude === undefined) return true; // No magnitude data, include by default
      if (filters.minMagnitude !== undefined && magnitude < filters.minMagnitude) return false;
      if (filters.maxMagnitude !== undefined && magnitude > filters.maxMagnitude) return false;
      return true;
    };
    
    // Helper to add result without duplicates, with fuzzy score
    const addResult = (item: SearchResultItem, score: number = 1) => {
      const key = `${item.Type}-${item.Name}`;
      if (!addedNames.has(key)) {
        // Check magnitude filter if item has magnitude
        if (!passesMagnitudeFilter(item.Magnitude)) return;
        
        addedNames.add(key);
        results.push({ ...item, _fuzzyScore: score } as SearchResultItem & { _fuzzyScore: number });
      }
    };
    
    // 1. Search user's target list
    if (filters.includeTargetList && filters.types.includes('TargetList')) {
      for (const target of targets) {
        if (target.name.toLowerCase().includes(lowerQuery)) {
          addResult({
            Name: target.name,
            Type: 'DSO',
            RA: target.ra,
            Dec: target.dec,
            'Common names': 'From Target List',
          });
        }
      }
    }
    
    // 2. Check for coordinate search
    const coordResult = parseCoordinateSearch(query);
    if (coordResult) {
      addResult({
        Name: `${formatRA(coordResult.ra)} ${formatDec(coordResult.dec)}`,
        Type: 'Coordinates',
        RA: coordResult.ra,
        Dec: coordResult.dec,
        'Common names': 'Custom Coordinates',
      }, 2.0); // High score for exact coordinate match
    }
    
    // 3. Search DSO catalogs with fuzzy matching
    if (filters.types.includes('DSO')) {
      // Search popular DSOs first
      for (const dso of POPULAR_DSOS) {
        const score = getMatchScore(dso, query);
        if (score >= FUZZY_THRESHOLD) {
          addResult(dso, score);
        }
      }
      
      // Search extended Messier catalog
      for (const dso of MESSIER_CATALOG) {
        const score = getMatchScore(dso, query);
        if (score >= FUZZY_THRESHOLD) {
          addResult(dso, score);
        }
      }
    }
    
    // 4. Search constellations
    if (filters.types.includes('Constellation')) {
      for (const constellation of CONSTELLATION_SEARCH_DATA) {
        const score = getMatchScore(constellation, query);
        if (score >= FUZZY_THRESHOLD) {
          addResult(constellation, score);
        }
      }
    }
    
    // 5. Search celestial bodies via Stellarium with fuzzy matching
    if (stel) {
      // Planets, Sun, Moon
      if (filters.types.includes('Planet') || filters.types.includes('Star') || filters.types.includes('Moon')) {
        for (const body of CELESTIAL_BODIES) {
          if (!filters.types.includes(body.Type as ObjectType)) continue;
          
          const score = fuzzyMatch(body.Name, query);
          if (score >= FUZZY_THRESHOLD) {
            try {
              const obj = stel.getObj(`NAME ${body.Name}`);
              if (obj && obj.designations && obj.designations().length > 0) {
                addResult({ ...body, StellariumObj: obj }, score);
              } else {
                addResult(body, score);
              }
            } catch {
              addResult(body, score);
            }
          }
        }
      }
      
      // Comets
      if (filters.types.includes('Comet')) {
        try {
          const comets = stel.core.comets;
          if (comets && comets.listObjs) {
            const cometList = comets.listObjs(stel.core.observer, 100, () => true);
            for (const comet of cometList) {
              if (comet.designations) {
                const designations = comet.designations();
                for (const designation of designations) {
                  const name = designation.replace(/^NAME /, '');
                  if (name.toLowerCase().includes(lowerQuery)) {
                    addResult({
                      Name: name,
                      Type: 'Comet',
                      StellariumObj: comet,
                    });
                    break;
                  }
                }
              }
              if (results.length >= MAX_RESULTS) break;
            }
          }
        } catch (error) {
          logger.debug('Comet search error', error);
        }
      }
    } else {
      // Fallback when Stellarium not available - with fuzzy matching
      if (filters.types.includes('Planet') || filters.types.includes('Star') || filters.types.includes('Moon')) {
        for (const body of CELESTIAL_BODIES) {
          const score = fuzzyMatch(body.Name, query);
          if (score >= FUZZY_THRESHOLD) {
            addResult(body, score);
          }
        }
      }
    }
    
    // Sort results by fuzzy score (highest first)
    const sortedResults = results
      .sort((a, b) => {
        const scoreA = (a as SearchResultItem & { _fuzzyScore?: number })._fuzzyScore || 0;
        const scoreB = (b as SearchResultItem & { _fuzzyScore?: number })._fuzzyScore || 0;
        return scoreB - scoreA;
      })
      .slice(0, MAX_RESULTS);
    
    // Calculate search statistics
    const endTime = performance.now();
    const resultsByType: Record<string, number> = {};
    for (const result of sortedResults) {
      const type = result.Type || 'Unknown';
      resultsByType[type] = (resultsByType[type] || 0) + 1;
    }
    
    setSearchStats({
      totalResults: sortedResults.length,
      resultsByType,
      searchTimeMs: Math.round(endTime - startTime),
    });
    
    setState(prev => ({
      ...prev,
      results: sortedResults,
      isSearching: false,
    }));
  }, [stel, targets]);
  
  // Use ref to always have latest filters available in debounced callback
  const filtersRef = useRef(state.filters);
  useEffect(() => {
    filtersRef.current = state.filters;
  }, [state.filters]);

  // Debounced search with transition for smoother UI
  const search = useCallback((query: string) => {
    setState(prev => ({ ...prev, query }));
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      // Use startTransition for non-urgent state updates
      startTransition(() => {
        performSearch(query, filtersRef.current);
      });
    }, DEBOUNCE_MS);
  }, [performSearch, startTransition]);
  
  const setQuery = useCallback((query: string) => {
    search(query);
  }, [search]);
  
  const clearSearch = useCallback(() => {
    setState(prev => ({
      ...prev,
      query: '',
      results: [],
      selectedIds: new Set(),
    }));
  }, []);
  
  // Selection management
  const toggleSelection = useCallback((id: string) => {
    setState(prev => {
      const newSelected = new Set(prev.selectedIds);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return { ...prev, selectedIds: newSelected };
    });
  }, []);
  
  const selectAll = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedIds: new Set(prev.results.map(r => getResultId(r))),
    }));
  }, []);
  
  const clearSelection = useCallback(() => {
    setState(prev => ({ ...prev, selectedIds: new Set() }));
  }, []);
  
  const getSelectedItems = useCallback((): SearchResultItem[] => {
    return state.results.filter(r => state.selectedIds.has(getResultId(r)));
  }, [state.results, state.selectedIds]);
  
  const isSelected = useCallback((id: string): boolean => {
    return state.selectedIds.has(id);
  }, [state.selectedIds]);
  
  // Filters
  const setFilters = useCallback((updates: Partial<SearchFilters>) => {
    setState(prev => {
      const newFilters = { ...prev.filters, ...updates };
      // Re-run search with new filters
      if (prev.query) {
        performSearch(prev.query, newFilters);
      }
      return { ...prev, filters: newFilters };
    });
  }, [performSearch]);
  
  const setSortBy = useCallback((sort: SortOption) => {
    setState(prev => ({ ...prev, sortBy: sort }));
  }, []);
  
  // Recent searches
  const addRecentSearch = useCallback((query: string) => {
    if (!query.trim()) return;
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s !== query);
      return [query, ...filtered].slice(0, MAX_RECENT);
    });
  }, []);
  
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('starmap-recent-searches');
    }
  }, []);
  
  // Grouped results by type
  const groupedResults = useMemo(() => {
    const groups = new Map<string, SearchResultItem[]>();
    
    // Sort results first
    const sorted = [...state.results].sort((a, b) => {
      switch (state.sortBy) {
        case 'name':
          return a.Name.localeCompare(b.Name);
        case 'type':
          return (a.Type || '').localeCompare(b.Type || '');
        case 'ra':
          return (a.RA || 0) - (b.RA || 0);
        default:
          return 0;
      }
    });
    
    for (const item of sorted) {
      const type = item.Type || 'Unknown';
      if (!groups.has(type)) {
        groups.set(type, []);
      }
      groups.get(type)!.push(item);
    }
    
    return groups;
  }, [state.results, state.sortBy]);
  
  // Quick access data
  const popularObjects = useMemo(() => POPULAR_DSOS.slice(0, 10), []);
  
  const quickCategories = useMemo(() => [
    { label: 'Galaxies', items: POPULAR_DSOS.filter(d => d['Common names']?.includes('Galaxy')) },
    { label: 'Nebulae', items: POPULAR_DSOS.filter(d => d['Common names']?.includes('Nebula')) },
    { label: 'Planets', items: CELESTIAL_BODIES.filter(b => b.Type === 'Planet') },
    { label: 'Clusters', items: POPULAR_DSOS.filter(d => d['Common names']?.includes('Cluster')) },
  ], []);
  
  return {
    query: state.query,
    results: state.results,
    groupedResults,
    isSearching: state.isSearching,
    selectedIds: state.selectedIds,
    filters: state.filters,
    sortBy: state.sortBy,
    recentSearches,
    
    searchStats,
    
    setQuery,
    search,
    clearSearch,
    toggleSelection,
    selectAll,
    clearSelection,
    setFilters,
    setSortBy,
    addRecentSearch,
    clearRecentSearches,
    
    getSelectedItems,
    isSelected,
    
    popularObjects,
    quickCategories,
  };
}

