/**
 * Favorites store for bookmarked celestial objects
 * Allows users to quickly access their favorite targets
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getZustandStorage } from '@/lib/storage';

export interface FavoriteObject {
  id: string;
  name: string;
  ra: number;
  dec: number;
  raString: string;
  decString: string;
  type?: string;
  magnitude?: number;
  constellation?: string;
  notes?: string;
  addedAt: number;
  lastViewedAt?: number;
  viewCount: number;
  tags: string[];
}

interface FavoritesState {
  favorites: FavoriteObject[];
  recentlyViewed: FavoriteObject[];
  maxRecent: number;
  
  // Actions
  addFavorite: (object: Omit<FavoriteObject, 'id' | 'addedAt' | 'viewCount' | 'tags'>) => void;
  removeFavorite: (id: string) => void;
  updateFavorite: (id: string, updates: Partial<FavoriteObject>) => void;
  isFavorite: (name: string) => boolean;
  getFavoriteByName: (name: string) => FavoriteObject | undefined;
  addTag: (id: string, tag: string) => void;
  removeTag: (id: string, tag: string) => void;
  recordView: (object: Omit<FavoriteObject, 'id' | 'addedAt' | 'viewCount' | 'tags'>) => void;
  clearRecentlyViewed: () => void;
  getAllTags: () => string[];
  getFavoritesByTag: (tag: string) => FavoriteObject[];
}

// Generate unique ID for favorites
const generateId = () => `fav_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      recentlyViewed: [],
      maxRecent: 20,

      addFavorite: (object) => {
        const state = get();
        
        // Check if already exists
        if (state.favorites.some(f => f.name.toLowerCase() === object.name.toLowerCase())) {
          return;
        }

        const newFavorite: FavoriteObject = {
          ...object,
          id: generateId(),
          addedAt: Date.now(),
          viewCount: 0,
          tags: [],
        };

        set({
          favorites: [...state.favorites, newFavorite],
        });
      },

      removeFavorite: (id) => {
        set((state) => ({
          favorites: state.favorites.filter(f => f.id !== id),
        }));
      },

      updateFavorite: (id, updates) => {
        set((state) => ({
          favorites: state.favorites.map(f =>
            f.id === id ? { ...f, ...updates } : f
          ),
        }));
      },

      isFavorite: (name) => {
        return get().favorites.some(f => f.name.toLowerCase() === name.toLowerCase());
      },

      getFavoriteByName: (name) => {
        return get().favorites.find(f => f.name.toLowerCase() === name.toLowerCase());
      },

      addTag: (id, tag) => {
        set((state) => ({
          favorites: state.favorites.map(f =>
            f.id === id && !(f.tags ?? []).includes(tag)
              ? { ...f, tags: [...(f.tags ?? []), tag] }
              : f
          ),
        }));
      },

      removeTag: (id, tag) => {
        set((state) => ({
          favorites: state.favorites.map(f =>
            f.id === id
              ? { ...f, tags: (f.tags ?? []).filter(t => t !== tag) }
              : f
          ),
        }));
      },

      recordView: (object) => {
        const state = get();
        const now = Date.now();
        
        // Update if exists in favorites
        const existingFav = state.favorites.find(
          f => f.name.toLowerCase() === object.name.toLowerCase()
        );
        
        if (existingFav) {
          set({
            favorites: state.favorites.map(f =>
              f.id === existingFav.id
                ? { ...f, lastViewedAt: now, viewCount: f.viewCount + 1 }
                : f
            ),
          });
        }

        // Add to recently viewed
        const recentEntry: FavoriteObject = {
          ...object,
          id: generateId(),
          addedAt: now,
          lastViewedAt: now,
          viewCount: 1,
          tags: [],
        };

        // Remove existing entry if present
        const filteredRecent = state.recentlyViewed.filter(
          r => r.name.toLowerCase() !== object.name.toLowerCase()
        );

        // Add to front and limit size
        const newRecent = [recentEntry, ...filteredRecent].slice(0, state.maxRecent);

        set({ recentlyViewed: newRecent });
      },

      clearRecentlyViewed: () => {
        set({ recentlyViewed: [] });
      },

      getAllTags: () => {
        const tags = new Set<string>();
        get().favorites.forEach(f => (f.tags ?? []).forEach(t => tags.add(t)));
        return Array.from(tags).sort();
      },

      getFavoritesByTag: (tag) => {
        return get().favorites.filter(f => (f.tags ?? []).includes(tag));
      },
    }),
    {
      name: 'starmap-favorites',
      storage: getZustandStorage(),
    }
  )
);

/**
 * Predefined tags for organizing favorites
 */
export const FAVORITE_TAGS = [
  'imaging',
  'visual',
  'must-see',
  'difficult',
  'seasonal',
  'priority',
] as const;

export type FavoriteTag = typeof FAVORITE_TAGS[number];
