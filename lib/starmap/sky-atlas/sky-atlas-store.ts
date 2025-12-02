/**
 * Sky Atlas Store - Zustand state management
 * Ported from N.I.N.A. SkyAtlasVM
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  DeepSkyObject,
  SkyAtlasFilters,
  SkyAtlasSearchResult,
  NighttimeData,
  DSOTypeFilter,
  DSOType,
  OrderByField,
  OrderByDirection,
  FilterPreset,
} from './types';
import { 
  searchDeepSkyObjects, 
  createDefaultFilters,
  initializeFiltersWithNighttime,
  getTonightsBest,
  quickSearchByName,
  getCatalogStats,
  type CatalogStats,
} from './search-engine';
import { calculateNighttimeData, getReferenceDate } from './nighttime-calculator';
import { DSO_CATALOG } from './catalog-data';

// ============================================================================
// Store State Types
// ============================================================================

interface SkyAtlasState {
  // Location
  latitude: number;
  longitude: number;
  elevation: number;
  
  // Filters
  filters: SkyAtlasFilters;
  
  // Nighttime Data
  nighttimeData: NighttimeData | null;
  
  // Search Results
  searchResult: SkyAtlasSearchResult | null;
  isSearching: boolean;
  searchError: string | null;
  
  // Catalog
  catalog: DeepSkyObject[];
  catalogStats: CatalogStats | null;
  
  // Selected Object
  selectedObject: DeepSkyObject | null;
  
  // Quick Search
  quickSearchTerm: string;
  quickSearchResults: DeepSkyObject[];
  
  // UI State
  showFiltersPanel: boolean;
  showResultsPanel: boolean;
  currentPage: number;
  pageSize: number;
  
  // Tonight's Best
  tonightsBest: DeepSkyObject[];
}

interface SkyAtlasActions {
  // Location
  setLocation: (latitude: number, longitude: number, elevation?: number) => void;
  
  // Filters
  setFilters: (filters: Partial<SkyAtlasFilters>) => void;
  resetFilters: () => void;
  applyPreset: (preset: FilterPreset) => void;
  setFilterDate: (date: Date) => void;
  toggleObjectType: (type: string) => void;
  setOrderBy: (field: OrderByField, direction: OrderByDirection) => void;
  
  // Search
  search: () => Promise<void>;
  cancelSearch: () => void;
  setPage: (page: number) => void;
  
  // Quick Search
  setQuickSearchTerm: (term: string) => void;
  
  // Selection
  selectObject: (object: DeepSkyObject | null) => void;
  
  // Nighttime
  updateNighttimeData: () => void;
  
  // Tonight's Best
  loadTonightsBest: () => void;
  
  // UI
  toggleFiltersPanel: () => void;
  toggleResultsPanel: () => void;
  
  // Catalog
  loadCatalog: () => void;
}

type SkyAtlasStore = SkyAtlasState & SkyAtlasActions;

// ============================================================================
// Store Implementation
// ============================================================================

let searchAbortController: AbortController | null = null;

export const useSkyAtlasStore = create<SkyAtlasStore>()(
  persist(
    (set, get) => ({
      // ============ Initial State ============
      latitude: 0,
      longitude: 0,
      elevation: 0,
      filters: createDefaultFilters(),
      nighttimeData: null,
      searchResult: null,
      isSearching: false,
      searchError: null,
      catalog: [],
      catalogStats: null,
      selectedObject: null,
      quickSearchTerm: '',
      quickSearchResults: [],
      showFiltersPanel: true,
      showResultsPanel: true,
      currentPage: 1,
      pageSize: 50,
      tonightsBest: [],
      
      // ============ Location Actions ============
      setLocation: (latitude, longitude, elevation = 0) => {
        set({ latitude, longitude, elevation });
        get().updateNighttimeData();
      },
      
      // ============ Filter Actions ============
      setFilters: (newFilters) => {
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
          currentPage: 1, // Reset to first page on filter change
        }));
      },
      
      resetFilters: () => {
        const { nighttimeData } = get();
        let filters = createDefaultFilters();
        
        if (nighttimeData) {
          filters = { ...filters, ...initializeFiltersWithNighttime(nighttimeData) };
        }
        
        set({ filters, currentPage: 1, searchResult: null });
      },
      
      applyPreset: (preset) => {
        const currentFilters = get().filters;
        set({
          filters: { ...currentFilters, ...preset.filters },
          currentPage: 1,
        });
      },
      
      setFilterDate: (date) => {
        const referenceDate = getReferenceDate(date);
        set((state) => ({
          filters: { ...state.filters, filterDate: referenceDate },
          currentPage: 1,
          searchResult: null,
        }));
        get().updateNighttimeData();
      },
      
      toggleObjectType: (type) => {
        set((state) => {
          const objectTypes = [...state.filters.objectTypes];
          const index = objectTypes.findIndex(t => t.type === type);
          
          if (index >= 0) {
            objectTypes[index] = { ...objectTypes[index], selected: !objectTypes[index].selected };
          }
          
          return { filters: { ...state.filters, objectTypes } };
        });
      },
      
      setOrderBy: (field, direction) => {
        set((state) => ({
          filters: { ...state.filters, orderByField: field, orderByDirection: direction },
        }));
      },
      
      // ============ Search Actions ============
      search: async () => {
        const { catalog, filters, latitude, longitude, pageSize, currentPage } = get();
        
        // Cancel any pending search
        if (searchAbortController) {
          searchAbortController.abort();
        }
        searchAbortController = new AbortController();
        
        set({ isSearching: true, searchError: null });
        
        try {
          const result = await searchDeepSkyObjects(catalog, filters, {
            latitude,
            longitude,
            pageSize,
            page: currentPage,
          });
          
          // Check if aborted
          if (searchAbortController.signal.aborted) {
            return;
          }
          
          set({ searchResult: result, isSearching: false });
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            return;
          }
          set({ 
            searchError: error instanceof Error ? error.message : 'Search failed',
            isSearching: false,
          });
        }
      },
      
      cancelSearch: () => {
        if (searchAbortController) {
          searchAbortController.abort();
          searchAbortController = null;
        }
        set({ isSearching: false });
      },
      
      setPage: (page) => {
        set({ currentPage: page });
        get().search();
      },
      
      // ============ Quick Search ============
      setQuickSearchTerm: (term) => {
        const { catalog } = get();
        const results = quickSearchByName(catalog, term, 10);
        set({ quickSearchTerm: term, quickSearchResults: results });
      },
      
      // ============ Selection ============
      selectObject: (object) => {
        set({ selectedObject: object });
      },
      
      // ============ Nighttime ============
      updateNighttimeData: () => {
        const { latitude, longitude, filters } = get();
        
        if (latitude === 0 && longitude === 0) {
          return; // Location not set
        }
        
        const nighttimeData = calculateNighttimeData(latitude, longitude, filters.filterDate);
        const updatedFilters = { ...filters, ...initializeFiltersWithNighttime(nighttimeData) };
        
        set({ nighttimeData, filters: updatedFilters });
      },
      
      // ============ Tonight's Best ============
      loadTonightsBest: () => {
        const { catalog, latitude, longitude, filters } = get();
        
        if (catalog.length === 0 || (latitude === 0 && longitude === 0)) {
          return;
        }
        
        const best = getTonightsBest(catalog, {
          latitude,
          longitude,
          date: filters.filterDate,
          minimumAltitude: 30,
          minimumMoonDistance: 30,
          limit: 20,
        });
        
        set({ tonightsBest: best });
      },
      
      // ============ UI Actions ============
      toggleFiltersPanel: () => {
        set((state) => ({ showFiltersPanel: !state.showFiltersPanel }));
      },
      
      toggleResultsPanel: () => {
        set((state) => ({ showResultsPanel: !state.showResultsPanel }));
      },
      
      // ============ Catalog ============
      loadCatalog: () => {
        const catalog = DSO_CATALOG;
        const catalogStats = getCatalogStats(catalog);
        
        // Initialize object types from catalog
        const typeSet = new Set<DSOType>(catalog.map((obj: DeepSkyObject) => obj.type));
        const objectTypes: DSOTypeFilter[] = Array.from(typeSet).map((type: DSOType) => ({
          type: type,
          selected: false,
          label: type.replace(/([A-Z])/g, ' $1').trim(),
        }));
        
        set((state) => ({
          catalog,
          catalogStats,
          filters: { ...state.filters, objectTypes },
        }));
        
        get().updateNighttimeData();
        get().loadTonightsBest();
      },
    }),
    {
      name: 'sky-atlas-store',
      partialize: (state) => ({
        latitude: state.latitude,
        longitude: state.longitude,
        elevation: state.elevation,
        pageSize: state.pageSize,
        showFiltersPanel: state.showFiltersPanel,
        showResultsPanel: state.showResultsPanel,
      }),
    }
  )
);

// ============================================================================
// Initialization Hook
// ============================================================================

/**
 * Initialize the Sky Atlas store with location
 */
export function initializeSkyAtlas(latitude: number, longitude: number, elevation?: number) {
  const store = useSkyAtlasStore.getState();
  store.setLocation(latitude, longitude, elevation);
  store.loadCatalog();
}
