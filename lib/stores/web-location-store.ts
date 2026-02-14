/**
 * Web Location Store
 * 
 * Zustand persist store for managing observation locations in web (non-Tauri) mode.
 * Replaces raw localStorage usage in location-manager.tsx for consistency
 * with other stores and DataManager import/export coverage.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getZustandStorage } from '@/lib/storage';
import type { WebLocation } from '@/types/starmap/management';

interface WebLocationState {
  locations: WebLocation[];
  addLocation: (location: Omit<WebLocation, 'id'>) => string;
  updateLocation: (id: string, updates: Partial<Omit<WebLocation, 'id'>>) => void;
  removeLocation: (id: string) => void;
  setCurrent: (id: string) => void;
  clearAll: () => void;
}

function generateId(): string {
  return `web-loc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export const useWebLocationStore = create<WebLocationState>()(
  persist(
    (set) => ({
      locations: [],

      addLocation: (location) => {
        const id = generateId();
        set((state) => ({
          locations: [...state.locations, { ...location, id }],
        }));
        return id;
      },

      updateLocation: (id, updates) => {
        set((state) => ({
          locations: state.locations.map((loc) =>
            loc.id === id ? { ...loc, ...updates } : loc
          ),
        }));
      },

      removeLocation: (id) => {
        set((state) => ({
          locations: state.locations.filter((loc) => loc.id !== id),
        }));
      },

      setCurrent: (id) => {
        set((state) => ({
          locations: state.locations.map((loc) => ({
            ...loc,
            is_current: loc.id === id,
          })),
        }));
      },

      clearAll: () => {
        set({ locations: [] });
      },
    }),
    {
      name: 'starmap-web-locations',
      storage: getZustandStorage(),
    }
  )
);
