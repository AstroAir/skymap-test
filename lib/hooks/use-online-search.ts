'use client';

/**
 * Online Object Search Hook
 * Extends the base search with online database support (SIMBAD, Sesame, VizieR)
 */

import { useState, useCallback, useRef, useMemo, useEffect, useTransition } from 'react';
import { useStellariumStore } from '@/lib/stores';
import type { SearchResultItem } from '@/lib/core/types';
import { useTargetListStore } from '@/lib/stores/target-list-store';
import { useSearchStore, type SearchMode } from '@/lib/stores/search-store';
import {
  searchOnlineByName,
  checkOnlineSearchAvailability,
  type OnlineSearchResult,
  type OnlineSearchSource,
} from '@/lib/services/online-search-service';
import {
  calculateSearchMatch,
  COMMON_NAME_TO_CATALOG,
  PHONETIC_VARIATIONS,
  parseCatalogId,
  jaroWinklerSimilarity,
} from '@/lib/catalogs';
import { createLogger } from '@/lib/logger';

const logger = createLogger('use-online-search');

// ============================================================================
// Types
// ============================================================================

export interface OnlineSearchResultItem extends SearchResultItem {
  source?: OnlineSearchSource;
  sourceUrl?: string;
  alternateNames?: string[];
  redshift?: number;
  morphologicalType?: string;
  spectralType?: string;
  distance?: string;
  _fuzzyScore?: number;
  _isOnlineResult?: boolean;
}

export type OnlineObjectType = 
  | 'DSO' 
  | 'Planet' 
  | 'Star' 
  | 'Moon' 
  | 'Comet' 
  | 'TargetList' 
  | 'Constellation'
  | 'Galaxy'
  | 'Nebula'
  | 'Cluster'
  | 'Quasar';

export type OnlineSortOption = 'name' | 'type' | 'ra' | 'relevance' | 'magnitude' | 'source';

export interface OnlineSearchFilters {
  types: OnlineObjectType[];
  includeTargetList: boolean;
  searchMode: 'name' | 'coordinates' | 'catalog';
  minMagnitude?: number;
  maxMagnitude?: number;
  searchRadius?: number;
  onlineOnly?: boolean;
  sources?: OnlineSearchSource[];
}

export interface OnlineSearchStats {
  totalResults: number;
  localResults: number;
  onlineResults: number;
  resultsByType: Record<string, number>;
  resultsBySource: Record<string, number>;
  searchTimeMs: number;
  onlineSearchTimeMs?: number;
}

export interface OnlineSearchState {
  query: string;
  results: OnlineSearchResultItem[];
  isSearching: boolean;
  isOnlineSearching: boolean;
  selectedIds: Set<string>;
  filters: OnlineSearchFilters;
  sortBy: OnlineSortOption;
  searchMode: SearchMode;
  onlineAvailable: boolean;
}

export interface UseOnlineSearchReturn {
  // State
  query: string;
  results: OnlineSearchResultItem[];
  groupedResults: Map<string, OnlineSearchResultItem[]>;
  isSearching: boolean;
  isOnlineSearching: boolean;
  selectedIds: Set<string>;
  filters: OnlineSearchFilters;
  sortBy: OnlineSortOption;
  searchMode: SearchMode;
  searchStats: OnlineSearchStats | null;
  onlineAvailable: boolean;
  
  // Actions
  setQuery: (query: string) => void;
  search: (query: string) => void;
  searchOnline: (query: string) => Promise<void>;
  clearSearch: () => void;
  toggleSelection: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  setFilters: (filters: Partial<OnlineSearchFilters>) => void;
  setSortBy: (sort: OnlineSortOption) => void;
  setSearchMode: (mode: SearchMode) => void;
  
  // Favorites
  addToFavorites: (item: OnlineSearchResultItem) => void;
  removeFromFavorites: (id: string) => void;
  isFavorite: (id: string) => boolean;
  
  // Helpers
  getSelectedItems: () => OnlineSearchResultItem[];
  isSelected: (id: string) => boolean;
  checkOnlineAvailability: () => Promise<void>;
  
  // Quick access
  popularObjects: OnlineSearchResultItem[];
  favorites: OnlineSearchResultItem[];
  recentSearches: string[];
  clearRecentSearches: () => void;
}

// ============================================================================
// Local Data Sources
// ============================================================================

const CELESTIAL_BODIES: OnlineSearchResultItem[] = [
  { Name: 'Sun', Type: 'Star', source: 'local' },
  { Name: 'Mercury', Type: 'Planet', source: 'local' },
  { Name: 'Venus', Type: 'Planet', source: 'local' },
  { Name: 'Moon', Type: 'Moon', source: 'local' },
  { Name: 'Mars', Type: 'Planet', source: 'local' },
  { Name: 'Jupiter', Type: 'Planet', source: 'local' },
  { Name: 'Saturn', Type: 'Planet', source: 'local' },
  { Name: 'Uranus', Type: 'Planet', source: 'local' },
  { Name: 'Neptune', Type: 'Planet', source: 'local' },
  { Name: 'Pluto', Type: 'Planet', source: 'local' },
];

const POPULAR_DSOS: OnlineSearchResultItem[] = [
  { Name: 'M31', Type: 'DSO', RA: 10.6847, Dec: 41.2689, 'Common names': 'Andromeda Galaxy', Magnitude: 3.4, Size: "178'x63'", source: 'local' },
  { Name: 'M42', Type: 'DSO', RA: 83.8221, Dec: -5.3911, 'Common names': 'Orion Nebula', Magnitude: 4.0, Size: "85'x60'", source: 'local' },
  { Name: 'M45', Type: 'DSO', RA: 56.75, Dec: 24.1167, 'Common names': 'Pleiades', Magnitude: 1.6, Size: "110'", source: 'local' },
  { Name: 'M1', Type: 'DSO', RA: 83.6333, Dec: 22.0167, 'Common names': 'Crab Nebula', Magnitude: 8.4, Size: "6'x4'", source: 'local' },
  { Name: 'M51', Type: 'DSO', RA: 202.4696, Dec: 47.1952, 'Common names': 'Whirlpool Galaxy', Magnitude: 8.4, Size: "11'x7'", source: 'local' },
  { Name: 'M101', Type: 'DSO', RA: 210.8024, Dec: 54.3488, 'Common names': 'Pinwheel Galaxy', Magnitude: 7.9, Size: "29'x27'", source: 'local' },
  { Name: 'M104', Type: 'DSO', RA: 189.9976, Dec: -11.6231, 'Common names': 'Sombrero Galaxy', Magnitude: 8.0, Size: "9'x4'", source: 'local' },
  { Name: 'M13', Type: 'DSO', RA: 250.4217, Dec: 36.4613, 'Common names': 'Hercules Cluster', Magnitude: 5.8, Size: "20'", source: 'local' },
  { Name: 'M57', Type: 'DSO', RA: 283.3962, Dec: 33.0286, 'Common names': 'Ring Nebula', Magnitude: 8.8, Size: "1.4'x1'", source: 'local' },
  { Name: 'M27', Type: 'DSO', RA: 299.9017, Dec: 22.7211, 'Common names': 'Dumbbell Nebula', Magnitude: 7.5, Size: "8'x6'", source: 'local' },
  { Name: 'NGC7000', Type: 'DSO', RA: 314.6833, Dec: 44.3167, 'Common names': 'North America Nebula', Magnitude: 4.0, Size: "120'x100'", source: 'local' },
  { Name: 'NGC6992', Type: 'DSO', RA: 312.7583, Dec: 31.7167, 'Common names': 'Veil Nebula', Magnitude: 7.0, Size: "60'", source: 'local' },
  { Name: 'IC1396', Type: 'DSO', RA: 324.7458, Dec: 57.4833, 'Common names': 'Elephant Trunk Nebula', Magnitude: 3.5, Size: "170'", source: 'local' },
  { Name: 'M33', Type: 'DSO', RA: 23.4621, Dec: 30.6599, 'Common names': 'Triangulum Galaxy', Magnitude: 5.7, Size: "73'x45'", source: 'local' },
  { Name: 'M81', Type: 'DSO', RA: 148.8882, Dec: 69.0653, 'Common names': "Bode's Galaxy", Magnitude: 6.9, Size: "27'x14'", source: 'local' },
  { Name: 'M82', Type: 'DSO', RA: 148.9685, Dec: 69.6797, 'Common names': 'Cigar Galaxy', Magnitude: 8.4, Size: "11'x5'", source: 'local' },
];

const CONSTELLATIONS: OnlineSearchResultItem[] = [
  { Name: 'Orion', Type: 'Constellation', RA: 85.0, Dec: 0.0, 'Common names': 'The Hunter', source: 'local' },
  { Name: 'Ursa Major', Type: 'Constellation', RA: 165.0, Dec: 55.0, 'Common names': 'Great Bear, Big Dipper', source: 'local' },
  { Name: 'Cassiopeia', Type: 'Constellation', RA: 15.0, Dec: 60.0, 'Common names': 'The Queen', source: 'local' },
  { Name: 'Cygnus', Type: 'Constellation', RA: 310.0, Dec: 45.0, 'Common names': 'The Swan', source: 'local' },
  { Name: 'Leo', Type: 'Constellation', RA: 165.0, Dec: 15.0, 'Common names': 'The Lion', source: 'local' },
  { Name: 'Scorpius', Type: 'Constellation', RA: 255.0, Dec: -30.0, 'Common names': 'The Scorpion', source: 'local' },
  { Name: 'Sagittarius', Type: 'Constellation', RA: 285.0, Dec: -30.0, 'Common names': 'The Archer', source: 'local' },
  { Name: 'Andromeda', Type: 'Constellation', RA: 10.0, Dec: 40.0, 'Common names': 'The Chained Princess', source: 'local' },
];

// ============================================================================
// Helper Functions
// ============================================================================

function getResultId(item: OnlineSearchResultItem): string {
  const source = item.source || 'local';
  return `${source}-${item.Type || 'unknown'}-${item.Name}`;
}

function onlineResultToSearchItem(result: OnlineSearchResult): OnlineSearchResultItem {
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
    Type: (typeMap[result.category] || 'DSO') as OnlineSearchResultItem['Type'],
    RA: result.ra,
    Dec: result.dec,
    'Common names': result.alternateNames?.join(', '),
    Magnitude: result.magnitude,
    Size: result.angularSize,
    source: result.source,
    sourceUrl: result.sourceUrl,
    alternateNames: result.alternateNames,
    redshift: result.redshift,
    morphologicalType: result.morphologicalType,
    spectralType: result.spectralType,
    distance: result.distance,
    _isOnlineResult: true,
  };
}

function getMatchScore(item: OnlineSearchResultItem, query: string): number {
  const queryLower = query.toLowerCase().trim();
  
  const commonNameMatches = COMMON_NAME_TO_CATALOG[queryLower];
  if (commonNameMatches) {
    const itemNameUpper = item.Name.toUpperCase();
    if (commonNameMatches.some(cat => itemNameUpper === cat.toUpperCase())) {
      return 1.8;
    }
  }
  
  for (const [correctName, variations] of Object.entries(PHONETIC_VARIATIONS)) {
    if (variations.some(v => queryLower.includes(v) || v.includes(queryLower))) {
      const catalogMatches = COMMON_NAME_TO_CATALOG[correctName];
      if (catalogMatches) {
        const itemNameUpper = item.Name.toUpperCase();
        if (catalogMatches.some(cat => itemNameUpper === cat.toUpperCase())) {
          return 1.7;
        }
      }
      if (item['Common names']?.toLowerCase().includes(correctName)) {
        return 1.6;
      }
    }
  }
  
  const parsedCatalog = parseCatalogId(query);
  if (parsedCatalog) {
    const itemParsed = parseCatalogId(item.Name);
    if (itemParsed && 
        itemParsed.catalog === parsedCatalog.catalog && 
        itemParsed.number === parsedCatalog.number) {
      return 2.0;
    }
  }
  
  if (item['Common names']) {
    const commonNameLower = item['Common names'].toLowerCase();
    const jwScore = jaroWinklerSimilarity(queryLower, commonNameLower);
    if (jwScore > 0.85) {
      return jwScore * 1.5;
    }
  }
  
  const result = calculateSearchMatch(query, item.Name, undefined, item['Common names']);
  return result.score;
}

// ============================================================================
// Constants
// ============================================================================

const DEBOUNCE_MS = 200;
const MAX_LOCAL_RESULTS = 30;
const MAX_ONLINE_RESULTS = 30;
const FUZZY_THRESHOLD = 0.3;

// ============================================================================
// Hook Implementation
// ============================================================================

export function useOnlineSearch(): UseOnlineSearchReturn {
  const stel = useStellariumStore((state) => state.stel);
  const targets = useTargetListStore((state) => state.targets);
  
  const {
    settings: searchSettings,
    favorites: storedFavorites,
    currentSearchMode,
    setSearchMode: setStoreSearchMode,
    addFavorite,
    removeFavorite,
    isFavorite,
    addRecentSearch: addStoreRecentSearch,
    getRecentSearches,
    clearRecentSearches: clearStoreRecentSearches,
    cacheSearchResults,
    getCachedResults,
    updateAllOnlineStatus,
    getEnabledSources,
  } = useSearchStore();
  
  const [state, setState] = useState<OnlineSearchState>({
    query: '',
    results: [],
    isSearching: false,
    isOnlineSearching: false,
    selectedIds: new Set(),
    filters: {
      types: ['DSO', 'Planet', 'Star', 'Moon', 'Comet', 'TargetList', 'Constellation', 'Galaxy', 'Nebula', 'Cluster'],
      includeTargetList: true,
      searchMode: 'name',
      minMagnitude: undefined,
      maxMagnitude: undefined,
      searchRadius: 5,
      onlineOnly: false,
      sources: ['sesame', 'simbad'],
    },
    sortBy: 'relevance',
    searchMode: currentSearchMode,
    onlineAvailable: true,
  });
  
  const [searchStats, setSearchStats] = useState<OnlineSearchStats | null>(null);
  
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [, startTransition] = useTransition();
  
  useEffect(() => {
    const currentDebounce = debounceRef.current;
    const currentAbort = abortControllerRef.current;
    return () => {
      if (currentDebounce) clearTimeout(currentDebounce);
      if (currentAbort) currentAbort.abort();
    };
  }, []);
  
  useEffect(() => {
    checkOnlineSearchAvailability().then((status) => {
      updateAllOnlineStatus(status);
      const anyOnline = Object.values(status).some(v => v);
      setState(prev => ({ ...prev, onlineAvailable: anyOnline }));
    });
  }, [updateAllOnlineStatus]);
  
  const performLocalSearch = useCallback((query: string, filters: OnlineSearchFilters): OnlineSearchResultItem[] => {
    if (!query.trim()) return [];
    
    const results: OnlineSearchResultItem[] = [];
    const addedNames = new Set<string>();
    const lowerQuery = query.toLowerCase().trim();
    
    const passesMagnitudeFilter = (magnitude?: number): boolean => {
      if (magnitude === undefined) return true;
      if (filters.minMagnitude !== undefined && magnitude < filters.minMagnitude) return false;
      if (filters.maxMagnitude !== undefined && magnitude > filters.maxMagnitude) return false;
      return true;
    };
    
    const addResult = (item: OnlineSearchResultItem, score: number = 1) => {
      const key = `${item.Type}-${item.Name}`;
      if (!addedNames.has(key) && passesMagnitudeFilter(item.Magnitude)) {
        addedNames.add(key);
        results.push({ ...item, _fuzzyScore: score });
      }
    };
    
    if (filters.includeTargetList) {
      for (const target of targets) {
        if (target.name.toLowerCase().includes(lowerQuery)) {
          addResult({
            Name: target.name,
            Type: 'DSO',
            RA: target.ra,
            Dec: target.dec,
            'Common names': 'From Target List',
            source: 'local',
          }, 1.5);
        }
      }
    }
    
    for (const dso of POPULAR_DSOS) {
      const score = getMatchScore(dso, query);
      if (score >= FUZZY_THRESHOLD) {
        addResult(dso, score);
      }
    }
    
    for (const constellation of CONSTELLATIONS) {
      const score = getMatchScore(constellation, query);
      if (score >= FUZZY_THRESHOLD) {
        addResult(constellation, score);
      }
    }
    
    for (const body of CELESTIAL_BODIES) {
      const nameLower = body.Name.toLowerCase();
      if (nameLower.includes(lowerQuery) || lowerQuery.includes(nameLower)) {
        if (stel) {
          try {
            const obj = stel.getObj(`NAME ${body.Name}`);
            if (obj && obj.designations && obj.designations().length > 0) {
              addResult({ ...body, StellariumObj: obj }, 1.5);
              continue;
            }
          } catch { /* ignore */ }
        }
        addResult(body, 1.0);
      }
    }
    
    if (stel && lowerQuery.length >= 2) {
      try {
        const comets = stel.core.comets;
        if (comets?.listObjs) {
          const cometList = comets.listObjs(stel.core.observer, 50, () => true);
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
                    source: 'local',
                  }, 1.0);
                  break;
                }
              }
            }
            if (results.length >= MAX_LOCAL_RESULTS) break;
          }
        }
      } catch { /* ignore */ }
    }
    
    return results
      .sort((a, b) => (b._fuzzyScore || 0) - (a._fuzzyScore || 0))
      .slice(0, MAX_LOCAL_RESULTS);
  }, [stel, targets]);
  
  const performOnlineSearch = useCallback(async (query: string, _filters: OnlineSearchFilters): Promise<OnlineSearchResultItem[]> => {
    if (!query.trim() || query.length < 2) return [];
    
    try {
      const enabledSources = getEnabledSources().filter(s => s !== 'local');
      
      const response = await searchOnlineByName(query, {
        sources: enabledSources.length > 0 ? enabledSources : ['sesame', 'simbad'],
        limit: MAX_ONLINE_RESULTS,
        timeout: searchSettings.timeout,
      });
      
      return response.results.map(onlineResultToSearchItem);
    } catch (error) {
      logger.warn('Online search error', error);
      return [];
    }
  }, [getEnabledSources, searchSettings.timeout]);
  
  const performSearch = useCallback(async (query: string, filters: OnlineSearchFilters) => {
    const startTime = performance.now();
    
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
    
    const cached = getCachedResults(query);
    if (cached) {
      const cachedItems = cached.results.map(onlineResultToSearchItem);
      setState(prev => ({ ...prev, results: cachedItems, isSearching: false }));
      setSearchStats({
        totalResults: cachedItems.length,
        localResults: 0,
        onlineResults: cachedItems.length,
        resultsByType: {},
        resultsBySource: { cached: cachedItems.length },
        searchTimeMs: 0,
      });
      return;
    }
    
    const localResults = !filters.onlineOnly ? performLocalSearch(query, filters) : [];
    const localEndTime = performance.now();
    
    setState(prev => ({ ...prev, results: localResults }));
    
    const shouldSearchOnline = 
      (state.searchMode === 'hybrid' || state.searchMode === 'online') &&
      state.onlineAvailable &&
      query.length >= 2;
    
    if (shouldSearchOnline) {
      setState(prev => ({ ...prev, isOnlineSearching: true }));
      
      try {
        const onlineStartTime = performance.now();
        const onlineResults = await performOnlineSearch(query, filters);
        const onlineEndTime = performance.now();
        
        const mergedResults = [...localResults];
        const existingNames = new Set(localResults.map(r => r.Name.toLowerCase()));
        
        for (const result of onlineResults) {
          if (!existingNames.has(result.Name.toLowerCase())) {
            existingNames.add(result.Name.toLowerCase());
            mergedResults.push(result);
          }
        }
        
        mergedResults.sort((a, b) => (b._fuzzyScore || 0) - (a._fuzzyScore || 0));
        
        setState(prev => ({ 
          ...prev, 
          results: mergedResults.slice(0, MAX_LOCAL_RESULTS + MAX_ONLINE_RESULTS),
          isOnlineSearching: false,
        }));
        
        const resultsByType: Record<string, number> = {};
        const resultsBySource: Record<string, number> = {};
        
        for (const r of mergedResults) {
          const type = r.Type || 'Unknown';
          const source = r.source || 'local';
          resultsByType[type] = (resultsByType[type] || 0) + 1;
          resultsBySource[source] = (resultsBySource[source] || 0) + 1;
        }
        
        setSearchStats({
          totalResults: mergedResults.length,
          localResults: localResults.length,
          onlineResults: onlineResults.length,
          resultsByType,
          resultsBySource,
          searchTimeMs: Math.round(localEndTime - startTime),
          onlineSearchTimeMs: Math.round(onlineEndTime - onlineStartTime),
        });
        
        if (onlineResults.length > 0) {
          const onlineForCache = onlineResults.map(r => ({
            id: getResultId(r),
            name: r.Name,
            type: r.Type || 'Unknown',
            category: 'other' as const,
            ra: r.RA || 0,
            dec: r.Dec || 0,
            source: r.source || 'local',
          }));
          cacheSearchResults(query, onlineForCache, 'online');
        }
        
      } catch (error) {
        logger.warn('Online search failed', error);
        setState(prev => ({ ...prev, isOnlineSearching: false }));
      }
    } else {
      const resultsByType: Record<string, number> = {};
      for (const r of localResults) {
        const type = r.Type || 'Unknown';
        resultsByType[type] = (resultsByType[type] || 0) + 1;
      }
      
      setSearchStats({
        totalResults: localResults.length,
        localResults: localResults.length,
        onlineResults: 0,
        resultsByType,
        resultsBySource: { local: localResults.length },
        searchTimeMs: Math.round(localEndTime - startTime),
      });
    }
    
    setState(prev => ({ ...prev, isSearching: false }));
    
    addStoreRecentSearch(query, localResults.length, state.searchMode === 'local' ? 'local' : 'mixed');
    
  }, [state.searchMode, state.onlineAvailable, performLocalSearch, performOnlineSearch, getCachedResults, cacheSearchResults, addStoreRecentSearch]);
  
  const search = useCallback((query: string) => {
    setState(prev => ({ ...prev, query }));
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      startTransition(() => {
        performSearch(query, state.filters);
      });
    }, DEBOUNCE_MS);
  }, [performSearch, state.filters, startTransition]);
  
  const searchOnlineDirect = useCallback(async (query: string) => {
    setState(prev => ({ ...prev, query, isOnlineSearching: true }));
    
    try {
      const results = await performOnlineSearch(query, state.filters);
      setState(prev => ({ 
        ...prev, 
        results,
        isOnlineSearching: false,
      }));
    } catch {
      setState(prev => ({ ...prev, isOnlineSearching: false }));
    }
  }, [performOnlineSearch, state.filters]);
  
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
    setSearchStats(null);
  }, []);
  
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
  
  const getSelectedItems = useCallback((): OnlineSearchResultItem[] => {
    return state.results.filter(r => state.selectedIds.has(getResultId(r)));
  }, [state.results, state.selectedIds]);
  
  const isSelected = useCallback((id: string): boolean => {
    return state.selectedIds.has(id);
  }, [state.selectedIds]);
  
  const setFilters = useCallback((updates: Partial<OnlineSearchFilters>) => {
    setState(prev => {
      const newFilters = { ...prev.filters, ...updates };
      if (prev.query) {
        performSearch(prev.query, newFilters);
      }
      return { ...prev, filters: newFilters };
    });
  }, [performSearch]);
  
  const setSortBy = useCallback((sort: OnlineSortOption) => {
    setState(prev => ({ ...prev, sortBy: sort }));
  }, []);
  
  const setSearchMode = useCallback((mode: SearchMode) => {
    setState(prev => ({ ...prev, searchMode: mode }));
    setStoreSearchMode(mode);
  }, [setStoreSearchMode]);
  
  const addToFavorites = useCallback((item: OnlineSearchResultItem) => {
    addFavorite({
      id: getResultId(item),
      name: item.Name,
      alternateNames: item.alternateNames,
      type: item.Type || 'Unknown',
      category: 'other',
      ra: item.RA || 0,
      dec: item.Dec || 0,
      raString: item.RA ? `${item.RA.toFixed(4)}°` : undefined,
      decString: item.Dec ? `${item.Dec.toFixed(4)}°` : undefined,
      magnitude: item.Magnitude,
      angularSize: item.Size,
      source: item.source || 'local',
    });
  }, [addFavorite]);
  
  const removeFromFavorites = useCallback((id: string) => {
    removeFavorite(id);
  }, [removeFavorite]);
  
  const checkFavorite = useCallback((id: string): boolean => {
    return isFavorite(id);
  }, [isFavorite]);
  
  const checkOnlineAvailabilityFn = useCallback(async () => {
    const status = await checkOnlineSearchAvailability();
    updateAllOnlineStatus(status);
    const anyOnline = Object.values(status).some(v => v);
    setState(prev => ({ ...prev, onlineAvailable: anyOnline }));
  }, [updateAllOnlineStatus]);
  
  const groupedResults = useMemo(() => {
    const groups = new Map<string, OnlineSearchResultItem[]>();
    
    const sorted = [...state.results].sort((a, b) => {
      switch (state.sortBy) {
        case 'name':
          return a.Name.localeCompare(b.Name);
        case 'type':
          return (a.Type || '').localeCompare(b.Type || '');
        case 'ra':
          return (a.RA || 0) - (b.RA || 0);
        case 'magnitude':
          return (a.Magnitude || 99) - (b.Magnitude || 99);
        case 'source':
          return (a.source || '').localeCompare(b.source || '');
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
  
  const favorites = useMemo(() => {
    return storedFavorites.map(f => ({
      Name: f.name,
      Type: f.type as OnlineSearchResultItem['Type'],
      RA: f.ra,
      Dec: f.dec,
      Magnitude: f.magnitude,
      Size: f.angularSize,
      source: f.source,
      alternateNames: f.alternateNames,
    } as OnlineSearchResultItem));
  }, [storedFavorites]);
  
  const recentSearches = useMemo(() => {
    return getRecentSearches(10).map(s => s.query);
  }, [getRecentSearches]);
  
  return {
    query: state.query,
    results: state.results,
    groupedResults,
    isSearching: state.isSearching,
    isOnlineSearching: state.isOnlineSearching,
    selectedIds: state.selectedIds,
    filters: state.filters,
    sortBy: state.sortBy,
    searchMode: state.searchMode,
    searchStats,
    onlineAvailable: state.onlineAvailable,
    
    setQuery,
    search,
    searchOnline: searchOnlineDirect,
    clearSearch,
    toggleSelection,
    selectAll,
    clearSelection,
    setFilters,
    setSortBy,
    setSearchMode,
    
    addToFavorites,
    removeFromFavorites,
    isFavorite: checkFavorite,
    
    getSelectedItems,
    isSelected,
    checkOnlineAvailability: checkOnlineAvailabilityFn,
    
    popularObjects: POPULAR_DSOS,
    favorites,
    recentSearches,
    clearRecentSearches: clearStoreRecentSearches,
  };
}
