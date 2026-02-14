'use client';

import { useState, useCallback, useRef, useMemo, useEffect, useTransition } from 'react';
import { useStellariumStore } from '@/lib/stores';
import type { SearchResultItem } from '@/lib/core/types';
import { useTargetListStore } from '@/lib/stores/target-list-store';
import { useSearchStore } from '@/lib/stores/search-store';
import {
  searchOnlineByName,
  checkOnlineSearchAvailability,
  type OnlineSearchResult,
} from '@/lib/services/online-search-service';
import { 
  CELESTIAL_BODIES,
  POPULAR_DSOS,
  MESSIER_CATALOG,
  CONSTELLATION_SEARCH_DATA,
  DSO_NAME_INDEX,
  getMatchScore,
  getDetailedSearchMatch,
  fuzzyMatch,
  DSO_CATALOG,
  getDSOById,
  getMessierObjects,
  parseCatalogId,
  enhancedQuickSearch,
  calculateAltitude,
  calculateMoonDistance,
} from '@/lib/catalogs';
import { searchLocalCatalog } from '@/lib/services/local-resolve-service';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { parseRACoordinate, parseDecCoordinate } from '@/lib/astronomy/coordinates/conversions';
import { createLogger } from '@/lib/logger';
import { getResultId } from '@/lib/core/search-utils';

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

// Parse coordinate string using shared parsing from conversions.ts
function parseCoordinateSearch(query: string): { ra: number; dec: number } | null {
  const trimmed = query.trim();
  
  // Try decimal format: "10.68 41.27" or "10.68, 41.27"
  const decimalMatch = trimmed.match(/^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/);
  if (decimalMatch) {
    const ra = parseRACoordinate(decimalMatch[1]);
    const dec = parseDecCoordinate(decimalMatch[2]);
    if (ra !== null && dec !== null) {
      return { ra, dec };
    }
  }
  
  // Try splitting on whitespace for structured formats (HMS+DMS, colon-separated)
  // Match patterns like "00h42m44s +41°16'09\"" or "00:42:44 +41:16:09"
  const parts = trimmed.match(/^(\S+(?:\s+\S+)?)\s+([+-]?\S+(?:\s+\S+)?)$/);
  if (parts) {
    const ra = parseRACoordinate(parts[1]);
    const dec = parseDecCoordinate(parts[2]);
    if (ra !== null && dec !== null) {
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
  isOnlineSearching: boolean;
  selectedIds: Set<string>;
  filters: SearchFilters;
  sortBy: SortOption;
  onlineAvailable: boolean;
}

export interface UseObjectSearchReturn {
  // State
  query: string;
  results: SearchResultItem[];
  groupedResults: Map<string, SearchResultItem[]>;
  isSearching: boolean;
  isOnlineSearching: boolean;
  selectedIds: Set<string>;
  filters: SearchFilters;
  sortBy: SortOption;
  recentSearches: string[];
  searchStats: SearchStats | null;
  onlineAvailable: boolean;
  
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

const MAX_RECENT = 8;
const FUZZY_THRESHOLD = 0.3; // Minimum score to include in results

// Convert online search result to SearchResultItem for unified display
function onlineResultToSearchItem(result: OnlineSearchResult): SearchResultItem {
  const typeMap: Record<string, string> = {
    galaxy: 'DSO',
    nebula: 'DSO',
    cluster: 'DSO',
    star: 'Star',
    planet: 'Planet',
    comet: 'Comet',
    asteroid: 'DSO',
    quasar: 'DSO',
    other: 'DSO',
  };
  
  return {
    Name: result.name,
    Type: (typeMap[result.category] || 'DSO') as SearchResultItem['Type'],
    RA: result.ra,
    Dec: result.dec,
    'Common names': result.alternateNames?.join(', '),
    Magnitude: result.magnitude,
    Size: result.angularSize,
    _isOnlineResult: true,
    _onlineSource: result.source,
  };
}


export function useObjectSearch(): UseObjectSearchReturn {
  const stel = useStellariumStore((state) => state.stel);
  const targets = useTargetListStore((state) => state.targets);
  
  // Search store integration for online search
  const {
    currentSearchMode,
    settings: searchSettings,
    getEnabledSources,
    addRecentSearch: addStoreRecentSearch,
    getRecentSearches,
    clearRecentSearches: clearStoreRecentSearches,
    updateAllOnlineStatus,
  } = useSearchStore();
  
  const enableFuzzySearch = useSettingsStore((s) => s.search.enableFuzzySearch);
  const autoSearchDelay = useSettingsStore((s) => s.search.autoSearchDelay);
  const maxSearchResults = useSettingsStore((s) => s.search.maxSearchResults);
  
  const [state, setState] = useState<SearchState>({
    query: '',
    results: [],
    isSearching: false,
    isOnlineSearching: false,
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
    onlineAvailable: true,
  });
  
  const [searchStats, setSearchStats] = useState<SearchStats | null>(null);
  
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [, startTransition] = useTransition();
  
  // Refs to avoid stale closure
  const searchModeRef = useRef(currentSearchMode);
  const onlineAvailableRef = useRef(true);
  const filtersRef = useRef(state.filters);
  
  useEffect(() => { searchModeRef.current = currentSearchMode; }, [currentSearchMode]);
  useEffect(() => { onlineAvailableRef.current = state.onlineAvailable; }, [state.onlineAvailable]);
  useEffect(() => { filtersRef.current = state.filters; }, [state.filters]);
  
  // Check online availability on mount (throttled: skip if checked within 5 min)
  const lastStatusCheck = useSearchStore((s) => s.lastStatusCheck);
  useEffect(() => {
    const THROTTLE_MS = 5 * 60 * 1000; // 5 minutes
    if (Date.now() - lastStatusCheck < THROTTLE_MS) {
      // Use cached status
      const cachedStatus = useSearchStore.getState().onlineStatus;
      const anyOnline = Object.values(cachedStatus).some(v => v);
      setState(prev => ({ ...prev, onlineAvailable: anyOnline }));
      return;
    }

    const controller = new AbortController();
    checkOnlineSearchAvailability().then((status) => {
      if (!controller.signal.aborted) {
        updateAllOnlineStatus(status);
        const anyOnline = Object.values(status).some(v => v);
        setState(prev => ({ ...prev, onlineAvailable: anyOnline }));
      }
    }).catch(() => {
      if (!controller.signal.aborted) {
        setState(prev => ({ ...prev, onlineAvailable: false }));
      }
    });

    return () => { controller.abort(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateAllOnlineStatus]);
  
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
      setState(prev => ({ ...prev, results: [], isSearching: false, isOnlineSearching: false }));
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
        results.push({ ...item, _fuzzyScore: score });
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
    
    // 3. Local catalog ID fast path (getDSOById)
    if (filters.types.includes('DSO')) {
      const catalogId = parseCatalogId(query);
      if (catalogId) {
        const localObj = getDSOById(catalogId.normalized);
        if (localObj) {
          addResult({
            Name: localObj.name,
            Type: 'DSO',
            RA: localObj.ra,
            Dec: localObj.dec,
            Magnitude: localObj.magnitude,
            'Common names': localObj.alternateNames?.join(', '),
          }, 2.5);
        }
      }
      
      // 3b. Search full DSO_CATALOG with enhanced fuzzy search or simple matching
      if (enableFuzzySearch) {
        const dsoResults = enhancedQuickSearch(DSO_CATALOG, query, 20);
        for (const dso of dsoResults) {
          addResult({
            Name: dso.name,
            Type: 'DSO',
            RA: dso.ra,
            Dec: dso.dec,
            Magnitude: dso.magnitude,
            'Common names': dso.alternateNames?.join(', '),
          }, 1.5);
        }
      } else {
        // Non-fuzzy: use DSO_NAME_INDEX for fast prefix/contains lookup
        const firstChar = query.trim()[0]?.toUpperCase();
        if (firstChar && DSO_NAME_INDEX.has(firstChar)) {
          for (const dso of DSO_NAME_INDEX.get(firstChar)!) {
            const score = getMatchScore(dso, query);
            if (score >= FUZZY_THRESHOLD) {
              addResult(dso, score);
            }
          }
        }
      }
      
      // 3c. Also search POPULAR_DSOS/MESSIER_CATALOG for SearchResultItem-typed entries
      for (const dso of POPULAR_DSOS) {
        const score = getMatchScore(dso, query);
        if (score >= FUZZY_THRESHOLD) {
          addResult(dso, score);
        }
      }
      
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
      
      // Comets (with fuzzy matching)
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
                  const score = fuzzyMatch(name, query);
                  if (score >= FUZZY_THRESHOLD) {
                    addResult({
                      Name: name,
                      Type: 'Comet',
                      StellariumObj: comet,
                    }, score);
                    break;
                  }
                }
              }
              if (results.length >= maxSearchResults) break;
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
        const scoreA = a._fuzzyScore || 0;
        const scoreB = b._fuzzyScore || 0;
        return scoreB - scoreA;
      })
      .slice(0, maxSearchResults);
    
    // Enrich DSO results with current altitude and visibility data
    let obsLat = 40, obsLon = -74;
    if (stel?.core?.observer) {
      try {
        obsLat = stel.core.observer.latitude ?? 40;
        obsLon = stel.core.observer.longitude ?? -74;
      } catch { /* use defaults */ }
    } else {
      // Fallback to mount store location (works for Aladin engine)
      try {
        const { useMountStore } = await import('@/lib/stores');
        const profile = useMountStore.getState().profileInfo;
        obsLat = profile.AstrometrySettings.Latitude || 40;
        obsLon = profile.AstrometrySettings.Longitude || -74;
      } catch { /* use defaults */ }
    }
    const now = new Date();
    for (const result of sortedResults) {
      if (result.Type === 'DSO' && result.RA !== undefined && result.Dec !== undefined) {
        try {
          const alt = calculateAltitude(result.RA, result.Dec, obsLat, obsLon, now);
          result._currentAltitude = Math.round(alt * 10) / 10;
          result._isVisible = alt > 0;
          result._moonDistance = Math.round(calculateMoonDistance(result.RA, result.Dec, now) * 10) / 10;
        } catch {
          // Skip enrichment on error
        }
      }
    }
    
    // Calculate search statistics for local results
    const localEndTime = performance.now();
    const resultsByType: Record<string, number> = {};
    for (const result of sortedResults) {
      const type = result.Type || 'Unknown';
      resultsByType[type] = (resultsByType[type] || 0) + 1;
    }
    
    // Show local results immediately
    setState(prev => ({
      ...prev,
      results: sortedResults,
      isSearching: false,
    }));
    
    setSearchStats({
      totalResults: sortedResults.length,
      resultsByType,
      searchTimeMs: Math.round(localEndTime - startTime),
    });
    
    // Fire online search if mode is hybrid/online
    // Skip online if we already have a high-confidence local match (e.g., catalog ID resolved)
    const hasHighConfidenceMatch = sortedResults.some(
      r => (r._fuzzyScore || 0) >= 2.0
    );
    const currentMode = searchModeRef.current;
    const isOnlineAvailable = onlineAvailableRef.current;
    const shouldSearchOnline = 
      (currentMode === 'hybrid' || currentMode === 'online') &&
      isOnlineAvailable &&
      query.length >= 2 &&
      !hasHighConfidenceMatch;
    
    if (shouldSearchOnline) {
      setState(prev => ({ ...prev, isOnlineSearching: true }));
      
      try {
        const enabledSources = getEnabledSources().filter(s => s !== 'local');
        const signal = abortControllerRef.current?.signal;
        
        const onlineResponse = await searchOnlineByName(query, {
          sources: enabledSources.length > 0 ? enabledSources : ['sesame', 'simbad'],
          limit: maxSearchResults,
          timeout: searchSettings.timeout,
          signal,
        });
        
        // Convert online results to SearchResultItem and merge
        const onlineItems = onlineResponse.results.map(onlineResultToSearchItem);
        const existingNames = new Set(sortedResults.map(r => r.Name.toLowerCase()));
        const newOnlineItems: SearchResultItem[] = [];
        
        for (const item of onlineItems) {
          if (!existingNames.has(item.Name.toLowerCase())) {
            existingNames.add(item.Name.toLowerCase());
            newOnlineItems.push(item);
          }
        }
        
        if (newOnlineItems.length > 0) {
          const mergedResults = [...sortedResults, ...newOnlineItems].slice(0, maxSearchResults);
          
          // Recalculate stats
          const mergedResultsByType: Record<string, number> = {};
          for (const result of mergedResults) {
            const type = result.Type || 'Unknown';
            mergedResultsByType[type] = (mergedResultsByType[type] || 0) + 1;
          }
          
          setState(prev => ({
            ...prev,
            results: mergedResults,
            isOnlineSearching: false,
          }));
          
          setSearchStats({
            totalResults: mergedResults.length,
            resultsByType: mergedResultsByType,
            searchTimeMs: Math.round(performance.now() - startTime),
          });
        } else {
          setState(prev => ({ ...prev, isOnlineSearching: false }));
        }
      } catch (error) {
        logger.debug('Online search error in unified hook', error);
        setState(prev => ({ ...prev, isOnlineSearching: false }));
      }
    } else if (
      // Local catalog fallback: when online would be useful but is unavailable,
      // supplement results using deeper local catalog search
      (currentMode === 'hybrid' || currentMode === 'online') &&
      !isOnlineAvailable &&
      query.length >= 2 &&
      !hasHighConfidenceMatch &&
      sortedResults.length < 5
    ) {
      try {
        const localFallbackResults = searchLocalCatalog(query, maxSearchResults);
        const existingNames = new Set(sortedResults.map(r => r.Name.toLowerCase()));
        const newLocalItems: SearchResultItem[] = [];
        
        for (const localResult of localFallbackResults) {
          if (!existingNames.has(localResult.name.toLowerCase())) {
            existingNames.add(localResult.name.toLowerCase());
            newLocalItems.push(onlineResultToSearchItem(localResult));
          }
        }
        
        if (newLocalItems.length > 0) {
          const mergedResults = [...sortedResults, ...newLocalItems].slice(0, maxSearchResults);
          const mergedResultsByType: Record<string, number> = {};
          for (const result of mergedResults) {
            const type = result.Type || 'Unknown';
            mergedResultsByType[type] = (mergedResultsByType[type] || 0) + 1;
          }
          
          setState(prev => ({
            ...prev,
            results: mergedResults,
          }));
          
          setSearchStats({
            totalResults: mergedResults.length,
            resultsByType: mergedResultsByType,
            searchTimeMs: Math.round(performance.now() - startTime),
          });
        }
      } catch (error) {
        logger.debug('Local catalog fallback error', error);
      }
    }
    
    // Record in store-based search history
    addStoreRecentSearch(query, sortedResults.length, searchModeRef.current === 'local' ? 'local' : 'mixed');
    
  }, [stel, targets, getEnabledSources, searchSettings.timeout, addStoreRecentSearch, enableFuzzySearch, maxSearchResults]);
  
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
    }, autoSearchDelay);
  }, [performSearch, startTransition, autoSearchDelay]);
  
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
  
  // Recent searches — unified via searchStore
  const addRecentSearch = useCallback((query: string) => {
    if (!query.trim()) return;
    addStoreRecentSearch(query, 0, 'local');
  }, [addStoreRecentSearch]);
  
  const clearRecentSearches = useCallback(() => {
    clearStoreRecentSearches();
  }, [clearStoreRecentSearches]);
  
  const recentSearches = useMemo(() => {
    return getRecentSearches(MAX_RECENT).map(s => s.query);
  }, [getRecentSearches]);
  
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
  
  const quickCategories = useMemo(() => {
    const messierItems: SearchResultItem[] = getMessierObjects().slice(0, 15).map(dso => ({
      Name: dso.name,
      Type: 'DSO' as const,
      RA: dso.ra,
      Dec: dso.dec,
      Magnitude: dso.magnitude,
      'Common names': dso.alternateNames?.join(', '),
    }));

    // Use DSO_CATALOG type field for reliable categorization instead of string matching on Common names
    const galaxyTypes = new Set(['Galaxy', 'GalaxyPair', 'GalaxyTriplet', 'GalaxyCluster']);
    const nebulaTypes = new Set(['Nebula', 'PlanetaryNebula', 'EmissionNebula', 'ReflectionNebula', 'DarkNebula', 'HII', 'SupernovaRemnant']);
    const clusterTypes = new Set(['OpenCluster', 'GlobularCluster', 'StarCluster']);

    const toSearchItem = (dso: typeof DSO_CATALOG[number]): SearchResultItem => ({
      Name: dso.name,
      Type: 'DSO' as const,
      RA: dso.ra,
      Dec: dso.dec,
      Magnitude: dso.magnitude,
      'Common names': dso.alternateNames?.join(', '),
    });

    return [
      { label: 'messier', items: messierItems },
      { label: 'galaxies', items: DSO_CATALOG.filter(d => galaxyTypes.has(d.type) && d.magnitude !== undefined && d.magnitude <= 10).slice(0, 15).map(toSearchItem) },
      { label: 'nebulae', items: DSO_CATALOG.filter(d => nebulaTypes.has(d.type) && d.magnitude !== undefined && d.magnitude <= 10).slice(0, 15).map(toSearchItem) },
      { label: 'planets', items: CELESTIAL_BODIES.filter(b => b.Type === 'Planet') },
      { label: 'clusters', items: DSO_CATALOG.filter(d => clusterTypes.has(d.type) && d.magnitude !== undefined && d.magnitude <= 10).slice(0, 15).map(toSearchItem) },
    ];
  }, []);
  
  return {
    query: state.query,
    results: state.results,
    groupedResults,
    isSearching: state.isSearching,
    isOnlineSearching: state.isOnlineSearching,
    selectedIds: state.selectedIds,
    filters: state.filters,
    sortBy: state.sortBy,
    recentSearches,
    onlineAvailable: state.onlineAvailable,
    
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

