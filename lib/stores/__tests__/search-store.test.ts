/**
 * Search Store Tests
 */

import { act } from '@testing-library/react';
import { useSearchStore } from '../search-store';

describe('search-store', () => {
  beforeEach(() => {
    useSearchStore.getState().resetSearchState();
  });

  describe('settings', () => {
    it('should have default settings', () => {
      const { settings } = useSearchStore.getState();

      expect(settings.mode).toBe('hybrid');
      expect(settings.autoSwitchToOnline).toBe(true);
      expect(settings.defaultLimit).toBe(30);
      expect(settings.timeout).toBe(15000);
      expect(settings.cacheResults).toBe(true);
    });

    it('should update settings', () => {
      const { updateSettings } = useSearchStore.getState();

      act(() => {
        updateSettings({ timeout: 20000 });
      });

      const { settings } = useSearchStore.getState();
      expect(settings.timeout).toBe(20000);
    });

    it('should have online sources configured', () => {
      const { settings } = useSearchStore.getState();

      expect(settings.onlineSources.length).toBeGreaterThan(0);
      expect(settings.onlineSources.some(s => s.id === 'simbad')).toBe(true);
      expect(settings.onlineSources.some(s => s.id === 'sesame')).toBe(true);
    });
  });

  describe('search mode', () => {
    it('should set search mode', () => {
      const { setSearchMode } = useSearchStore.getState();

      act(() => {
        setSearchMode('online');
      });

      const { currentSearchMode } = useSearchStore.getState();
      expect(currentSearchMode).toBe('online');
    });

    it('should toggle between modes', () => {
      const { setSearchMode } = useSearchStore.getState();

      act(() => {
        setSearchMode('local');
      });

      expect(useSearchStore.getState().currentSearchMode).toBe('local');

      act(() => {
        setSearchMode('hybrid');
      });

      expect(useSearchStore.getState().currentSearchMode).toBe('hybrid');
    });
  });

  describe('online sources', () => {
    it('should toggle online source', () => {
      const { toggleOnlineSource, settings } = useSearchStore.getState();
      const simbadSource = settings.onlineSources.find(s => s.id === 'simbad');
      const initialState = simbadSource?.enabled;

      act(() => {
        toggleOnlineSource('simbad', !initialState);
      });

      const updatedSettings = useSearchStore.getState().settings;
      const updatedSource = updatedSettings.onlineSources.find(s => s.id === 'simbad');
      expect(updatedSource?.enabled).toBe(!initialState);
    });

    it('should get enabled sources', () => {
      const { getEnabledSources } = useSearchStore.getState();
      const enabledSources = getEnabledSources();

      expect(Array.isArray(enabledSources)).toBe(true);
      expect(enabledSources.includes('sesame')).toBe(true);
    });
  });

  describe('favorites', () => {
    const mockResult = {
      id: 'test-m31',
      name: 'M31',
      canonicalId: 'M31',
      identifiers: ['M31', 'NGC 224'],
      confidence: 0.9,
      alternateNames: ['Andromeda Galaxy'],
      type: 'Galaxy',
      category: 'galaxy' as const,
      ra: 10.68,
      dec: 41.27,
      magnitude: 3.4,
      source: 'simbad' as const,
    };

    it('should add favorite', () => {
      const { addFavorite } = useSearchStore.getState();

      act(() => {
        addFavorite(mockResult);
      });

      const updatedFavorites = useSearchStore.getState().favorites;
      expect(updatedFavorites.length).toBe(1);
      expect(updatedFavorites[0].name).toBe('M31');
    });

    it('should not add duplicate favorite', () => {
      const { addFavorite } = useSearchStore.getState();

      act(() => {
        addFavorite(mockResult);
        addFavorite(mockResult);
      });

      const { favorites } = useSearchStore.getState();
      expect(favorites.length).toBe(1);
    });

    it('should remove favorite', () => {
      const { addFavorite, removeFavorite } = useSearchStore.getState();

      act(() => {
        addFavorite(mockResult);
      });

      act(() => {
        removeFavorite('test-m31');
      });

      const { favorites } = useSearchStore.getState();
      expect(favorites.length).toBe(0);
    });

    it('should check if item is favorite', () => {
      const { addFavorite } = useSearchStore.getState();

      act(() => {
        addFavorite(mockResult);
      });

      expect(useSearchStore.getState().isFavorite('test-m31')).toBe(true);
      expect(useSearchStore.getState().isFavorite('non-existent')).toBe(false);
    });

    it('should update favorite notes', () => {
      const { addFavorite, updateFavorite } = useSearchStore.getState();

      act(() => {
        addFavorite(mockResult);
      });

      act(() => {
        updateFavorite('test-m31', { notes: 'Test notes' });
      });

      const { favorites } = useSearchStore.getState();
      expect(favorites[0].notes).toBe('Test notes');
    });

    it('should get favorites by category', () => {
      const { addFavorite } = useSearchStore.getState();

      act(() => {
        addFavorite(mockResult);
      });

      const galaxies = useSearchStore.getState().getFavoritesByCategory('galaxy');
      expect(galaxies.length).toBe(1);

      const nebulae = useSearchStore.getState().getFavoritesByCategory('nebula');
      expect(nebulae.length).toBe(0);
    });

    it('should clear all favorites', () => {
      const { addFavorite, clearFavorites } = useSearchStore.getState();

      act(() => {
        addFavorite(mockResult);
      });

      act(() => {
        clearFavorites();
      });

      const { favorites } = useSearchStore.getState();
      expect(favorites.length).toBe(0);
    });
  });

  describe('recent searches', () => {
    it('should add recent search', () => {
      const { addRecentSearch } = useSearchStore.getState();

      act(() => {
        addRecentSearch('M31', 5, 'mixed');
      });

      const { recentSearches } = useSearchStore.getState();
      expect(recentSearches.length).toBe(1);
      expect(recentSearches[0].query).toBe('M31');
      expect(recentSearches[0].resultCount).toBe(5);
    });

    it('should not add duplicate recent search', () => {
      const { addRecentSearch } = useSearchStore.getState();

      act(() => {
        addRecentSearch('M31', 5, 'mixed');
        addRecentSearch('M31', 10, 'online');
      });

      const { recentSearches } = useSearchStore.getState();
      expect(recentSearches.length).toBe(1);
      expect(recentSearches[0].resultCount).toBe(10); // Updated
    });

    it('should get recent searches with limit', () => {
      const { addRecentSearch } = useSearchStore.getState();

      act(() => {
        addRecentSearch('M31', 5, 'mixed');
        addRecentSearch('NGC7000', 3, 'local');
        addRecentSearch('Mars', 1, 'local');
      });

      const recent = useSearchStore.getState().getRecentSearches(2);
      expect(recent.length).toBe(2);
    });

    it('should clear recent searches', () => {
      const { addRecentSearch, clearRecentSearches } = useSearchStore.getState();

      act(() => {
        addRecentSearch('M31', 5, 'mixed');
      });

      act(() => {
        clearRecentSearches();
      });

      const { recentSearches } = useSearchStore.getState();
      expect(recentSearches.length).toBe(0);
    });
  });

  describe('cache', () => {
    const mockResults = [
      {
        id: 'test-1',
        name: 'M31',
        canonicalId: 'M31',
        identifiers: ['M31'],
        confidence: 0.9,
        type: 'Galaxy',
        category: 'galaxy' as const,
        ra: 10.68,
        dec: 41.27,
        source: 'simbad' as const,
      },
    ];

    it('should cache search results', () => {
      const { cacheSearchResults } = useSearchStore.getState();

      act(() => {
        cacheSearchResults('m31', mockResults, 'online');
      });

      const cached = useSearchStore.getState().getCachedResults('M31'); // Case insensitive
      expect(cached).not.toBeNull();
      expect(cached?.results.length).toBe(1);
    });

    it('should return null for uncached query', () => {
      const { getCachedResults } = useSearchStore.getState();

      const cached = getCachedResults('unknown');
      expect(cached).toBeNull();
    });

    it('should clear cache', () => {
      const { cacheSearchResults, clearCache } = useSearchStore.getState();

      act(() => {
        cacheSearchResults('m31', mockResults, 'online');
      });

      act(() => {
        clearCache();
      });

      const cached = useSearchStore.getState().getCachedResults('m31');
      expect(cached).toBeNull();
    });
  });

  describe('online status', () => {
    it('should set online status for source', () => {
      const { setOnlineStatus } = useSearchStore.getState();

      act(() => {
        setOnlineStatus('simbad', false);
      });

      expect(useSearchStore.getState().isSourceAvailable('simbad')).toBe(false);

      act(() => {
        setOnlineStatus('simbad', true);
      });

      expect(useSearchStore.getState().isSourceAvailable('simbad')).toBe(true);
    });

    it('should update all online status', () => {
      const { updateAllOnlineStatus } = useSearchStore.getState();

      act(() => {
        updateAllOnlineStatus({
          simbad: false,
          sesame: false,
          vizier: true,
          ned: true,
          mpc: true,
          local: true,
        });
      });

      const store = useSearchStore.getState();
      expect(store.isSourceAvailable('simbad')).toBe(false);
      expect(store.isSourceAvailable('sesame')).toBe(false);
      expect(store.isSourceAvailable('vizier')).toBe(true);
    });

    it('should get available sources', () => {
      const { updateAllOnlineStatus } = useSearchStore.getState();

      act(() => {
        updateAllOnlineStatus({
          simbad: true,
          sesame: true,
          vizier: false,
          ned: false,
          mpc: true,
          local: true,
        });
      });

      const available = useSearchStore.getState().getAvailableSources();
      expect(available.includes('sesame')).toBe(true);
      expect(available.includes('simbad')).toBe(true);
    });
  });
});
