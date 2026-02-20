/**
 * Search Configuration Store
 * Manages search settings, online/offline mode, favorites, and search history
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getZustandStorage } from '@/lib/storage';
import { LRUCache } from '@/lib/services/lru-cache';
import { CACHE_CONFIG } from '@/lib/cache/config';
import type { OnlineSearchSource, OnlineSearchResult, ObjectCategory } from '@/lib/services/online-search-service';

// ============================================================================
// Types
// ============================================================================

export interface SearchFavorite {
  id: string;
  name: string;
  canonicalId?: string;
  identifiers?: string[];
  confidence?: number;
  alternateNames?: string[];
  type: string;
  category: ObjectCategory;
  ra: number;
  dec: number;
  raString?: string;
  decString?: string;
  magnitude?: number;
  angularSize?: string;
  source: OnlineSearchSource;
  addedAt: number;
  notes?: string;
  tags?: string[];
}

export interface RecentSearch {
  query: string;
  timestamp: number;
  resultCount: number;
  source: 'local' | 'online' | 'mixed';
}

export interface SearchSourceConfig {
  id: OnlineSearchSource;
  enabled: boolean;
  priority: number;
}

export type SearchMode = 'local' | 'online' | 'hybrid';

export interface SearchSettings {
  mode: SearchMode;
  autoSwitchToOnline: boolean;
  onlineSources: SearchSourceConfig[];
  defaultLimit: number;
  timeout: number;
  cacheResults: boolean;
  cacheDuration: number; // hours
  showSourceBadges: boolean;
  groupBySource: boolean;
}

export interface SearchCache {
  query: string;
  results: OnlineSearchResult[];
  timestamp: number;
  source: SearchMode;
}

interface SearchState {
  // Settings
  settings: SearchSettings;
  
  // Favorites
  favorites: SearchFavorite[];
  
  // Recent searches
  recentSearches: RecentSearch[];
  maxRecentSearches: number;
  
  // Online status
  onlineStatus: Record<OnlineSearchSource, boolean>;
  lastStatusCheck: number;
  
  // UI state
  isOnlineSearchEnabled: boolean;
  currentSearchMode: SearchMode;
}

// Runtime cache (not persisted) - using LRUCache for efficient eviction
const searchResultsCache = new LRUCache<string, SearchCache>({
  maxSize: CACHE_CONFIG.search.maxSize,
  ttl: CACHE_CONFIG.search.defaultTTL,
});

interface SearchActions {
  // Settings
  updateSettings: (settings: Partial<SearchSettings>) => void;
  setSearchMode: (mode: SearchMode) => void;
  toggleOnlineSource: (sourceId: OnlineSearchSource, enabled: boolean) => void;
  setSourcePriority: (sourceId: OnlineSearchSource, priority: number) => void;
  
  // Favorites
  addFavorite: (result: OnlineSearchResult, notes?: string, tags?: string[]) => void;
  removeFavorite: (id: string) => void;
  updateFavorite: (id: string, updates: Partial<Pick<SearchFavorite, 'notes' | 'tags'>>) => void;
  isFavorite: (id: string) => boolean;
  getFavoritesByCategory: (category: ObjectCategory) => SearchFavorite[];
  getFavoritesByTag: (tag: string) => SearchFavorite[];
  clearFavorites: () => void;
  
  // Recent searches
  addRecentSearch: (query: string, resultCount: number, source: RecentSearch['source']) => void;
  clearRecentSearches: () => void;
  getRecentSearches: (limit?: number) => RecentSearch[];
  setMaxRecentSearches: (max: number) => void;
  
  // Cache
  cacheSearchResults: (query: string, results: OnlineSearchResult[], source: SearchMode) => void;
  getCachedResults: (query: string) => SearchCache | null;
  clearCache: () => void;
  
  // Online status
  setOnlineStatus: (source: OnlineSearchSource, status: boolean) => void;
  updateAllOnlineStatus: (status: Record<OnlineSearchSource, boolean>) => void;
  isSourceAvailable: (source: OnlineSearchSource) => boolean;
  getAvailableSources: () => OnlineSearchSource[];
  
  // Quick access
  getEnabledSources: () => OnlineSearchSource[];
  resetSearchState: () => void;
}

type SearchStore = SearchState & SearchActions;

// ============================================================================
// Default Values
// ============================================================================

const DEFAULT_SETTINGS: SearchSettings = {
  mode: 'hybrid',
  autoSwitchToOnline: true,
  onlineSources: [
    { id: 'sesame', enabled: true, priority: 0 },
    { id: 'simbad', enabled: true, priority: 1 },
    { id: 'mpc', enabled: true, priority: 2 },
    { id: 'vizier', enabled: false, priority: 3 },
    { id: 'ned', enabled: false, priority: 4 },
    { id: 'local', enabled: true, priority: -1 },
  ],
  defaultLimit: 30,
  timeout: 15000,
  cacheResults: true,
  cacheDuration: 24,
  showSourceBadges: true,
  groupBySource: false,
};

const DEFAULT_ONLINE_STATUS: Record<OnlineSearchSource, boolean> = {
  simbad: true,
  sesame: true,
  vizier: true,
  ned: true,
  mpc: true,
  local: true,
};

function cloneDefaultSettings(): SearchSettings {
  return {
    ...DEFAULT_SETTINGS,
    onlineSources: DEFAULT_SETTINGS.onlineSources.map((source) => ({ ...source })),
  };
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useSearchStore = create<SearchStore>()(
  persist(
    (set, get) => ({
      // Initial state
      settings: cloneDefaultSettings(),
      favorites: [],
      recentSearches: [],
      maxRecentSearches: 20,
      onlineStatus: DEFAULT_ONLINE_STATUS,
      lastStatusCheck: 0,
      isOnlineSearchEnabled: true,
      currentSearchMode: 'hybrid',
      
      // Settings actions
      updateSettings: (updates) => {
        set((state) => ({
          settings: { ...state.settings, ...updates },
        }));
      },
      
      setSearchMode: (mode) => {
        set({ currentSearchMode: mode });
      },
      
      toggleOnlineSource: (sourceId, enabled) => {
        set((state) => ({
          settings: {
            ...state.settings,
            onlineSources: state.settings.onlineSources.map((s) =>
              s.id === sourceId ? { ...s, enabled } : s
            ),
          },
        }));
      },
      
      setSourcePriority: (sourceId, priority) => {
        set((state) => ({
          settings: {
            ...state.settings,
            onlineSources: state.settings.onlineSources.map((s) =>
              s.id === sourceId ? { ...s, priority } : s
            ),
          },
        }));
      },
      
      // Favorites actions
      addFavorite: (result, notes, tags) => {
        const favorite: SearchFavorite = {
          id: result.id,
          name: result.name,
          canonicalId: result.canonicalId,
          identifiers: result.identifiers,
          confidence: result.confidence,
          alternateNames: result.alternateNames,
          type: result.type,
          category: result.category,
          ra: result.ra,
          dec: result.dec,
          raString: result.raString,
          decString: result.decString,
          magnitude: result.magnitude,
          angularSize: result.angularSize,
          source: result.source,
          addedAt: Date.now(),
          notes,
          tags,
        };
        
        set((state) => {
          // Avoid duplicates
          if (state.favorites.some((f) => f.id === favorite.id)) {
            return state;
          }
          return {
            favorites: [favorite, ...state.favorites],
          };
        });
      },
      
      removeFavorite: (id) => {
        set((state) => ({
          favorites: state.favorites.filter((f) => f.id !== id),
        }));
      },
      
      updateFavorite: (id, updates) => {
        set((state) => ({
          favorites: state.favorites.map((f) =>
            f.id === id ? { ...f, ...updates } : f
          ),
        }));
      },
      
      isFavorite: (id) => {
        return get().favorites.some((f) => f.id === id);
      },
      
      getFavoritesByCategory: (category) => {
        return get().favorites.filter((f) => f.category === category);
      },
      
      getFavoritesByTag: (tag) => {
        return get().favorites.filter((f) => f.tags?.includes(tag));
      },
      
      clearFavorites: () => {
        set({ favorites: [] });
      },
      
      // Recent searches actions
      addRecentSearch: (query, resultCount, source) => {
        if (!query.trim()) return;
        
        set((state) => {
          const filtered = state.recentSearches.filter(
            (s) => s.query.toLowerCase() !== query.toLowerCase()
          );
          
          const newSearch: RecentSearch = {
            query,
            timestamp: Date.now(),
            resultCount,
            source,
          };
          
          return {
            recentSearches: [newSearch, ...filtered].slice(0, state.maxRecentSearches),
          };
        });
      },
      
      clearRecentSearches: () => {
        set({ recentSearches: [] });
      },
      
      getRecentSearches: (limit = 10) => {
        return get().recentSearches.slice(0, limit);
      },

      setMaxRecentSearches: (max) => {
        const normalizedMax = Math.max(1, Math.floor(max));
        set((state) => ({
          maxRecentSearches: normalizedMax,
          recentSearches: state.recentSearches.slice(0, normalizedMax),
        }));
      },
      
      // Cache actions (using external LRUCache for efficient management)
      cacheSearchResults: (query, results, source) => {
        const state = get();
        if (!state.settings.cacheResults) return;
        
        const normalizedQuery = query.toLowerCase().trim();
        const cache: SearchCache = {
          query: normalizedQuery,
          results,
          timestamp: Date.now(),
          source,
        };
        
        // LRUCache handles TTL and size limits automatically
        searchResultsCache.set(normalizedQuery, cache);
      },
      
      getCachedResults: (query) => {
        const state = get();
        if (!state.settings.cacheResults) return null;
        
        const normalizedQuery = query.toLowerCase().trim();
        // LRUCache.get() automatically handles TTL expiration
        return searchResultsCache.get(normalizedQuery) ?? null;
      },
      
      clearCache: () => {
        searchResultsCache.clear();
      },
      
      // Online status actions
      setOnlineStatus: (source, status) => {
        set((state) => ({
          onlineStatus: { ...state.onlineStatus, [source]: status },
          lastStatusCheck: Date.now(),
        }));
      },
      
      updateAllOnlineStatus: (status) => {
        set({
          onlineStatus: status,
          lastStatusCheck: Date.now(),
        });
      },
      
      isSourceAvailable: (source) => {
        return get().onlineStatus[source] ?? false;
      },
      
      getAvailableSources: () => {
        const state = get();
        return state.settings.onlineSources
          .filter((s) => s.enabled && state.onlineStatus[s.id])
          .sort((a, b) => a.priority - b.priority)
          .map((s) => s.id);
      },
      
      // Quick access
      getEnabledSources: () => {
        return get().settings.onlineSources
          .filter((s) => s.enabled)
          .sort((a, b) => a.priority - b.priority)
          .map((s) => s.id);
      },

      resetSearchState: () => {
        searchResultsCache.clear();
        set({
          favorites: [],
          recentSearches: [],
          maxRecentSearches: 20,
          settings: cloneDefaultSettings(),
          onlineStatus: { ...DEFAULT_ONLINE_STATUS },
          lastStatusCheck: 0,
          isOnlineSearchEnabled: true,
          currentSearchMode: 'hybrid',
        });
      },
    }),
    {
      name: 'starmap-search-store',
      storage: getZustandStorage(),
      partialize: (state) => ({
        settings: state.settings,
        favorites: state.favorites,
        recentSearches: state.recentSearches,
        currentSearchMode: state.currentSearchMode,
      }),
    }
  )
);

// ============================================================================
// Selectors
// ============================================================================

export const selectSearchSettings = (state: SearchStore) => state.settings;
export const selectFavorites = (state: SearchStore) => state.favorites;
export const selectRecentSearches = (state: SearchStore) => state.recentSearches;
export const selectSearchMode = (state: SearchStore) => state.currentSearchMode;
export const selectOnlineStatus = (state: SearchStore) => state.onlineStatus;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert SearchFavorite to OnlineSearchResult for display
 */
export function favoriteToSearchResult(favorite: SearchFavorite): OnlineSearchResult {
  return {
    id: favorite.id,
    name: favorite.name,
    canonicalId: favorite.canonicalId || buildFallbackCanonicalId(favorite),
    identifiers: favorite.identifiers || buildFallbackIdentifiers(favorite),
    confidence: favorite.confidence ?? 0.6,
    alternateNames: favorite.alternateNames,
    type: favorite.type,
    category: favorite.category,
    ra: favorite.ra,
    dec: favorite.dec,
    raString: favorite.raString,
    decString: favorite.decString,
    magnitude: favorite.magnitude,
    angularSize: favorite.angularSize,
    source: favorite.source,
  };
}

function buildFallbackCanonicalId(favorite: SearchFavorite): string {
  return favorite.name.toUpperCase().replace(/\s+/g, ' ').trim();
}

function buildFallbackIdentifiers(favorite: SearchFavorite): string[] {
  const aliases = favorite.alternateNames ?? [];
  return [favorite.name, ...aliases];
}

/**
 * Get all unique tags from favorites
 */
export function getAllFavoriteTags(): string[] {
  const favorites = useSearchStore.getState().favorites;
  const tags = new Set<string>();
  for (const fav of favorites) {
    if (fav.tags) {
      for (const tag of fav.tags) {
        tags.add(tag);
      }
    }
  }
  return Array.from(tags).sort();
}
