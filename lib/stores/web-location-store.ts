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
  setDefault: (id: string) => void;
  clearAll: () => void;
}

function generateId(): string {
  return `web-loc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function pickIndexById(locations: WebLocation[], preferredId?: string): number {
  if (!preferredId) return -1;
  return locations.findIndex((loc) => loc.id === preferredId);
}

function pickCurrentIndex(locations: WebLocation[], preferredCurrentId?: string): number {
  const preferredIndex = pickIndexById(locations, preferredCurrentId);
  if (preferredIndex >= 0) return preferredIndex;

  const flaggedCurrent = locations.findIndex((loc) => loc.is_current);
  if (flaggedCurrent >= 0) return flaggedCurrent;

  const flaggedDefault = locations.findIndex((loc) => loc.is_default);
  if (flaggedDefault >= 0) return flaggedDefault;

  return 0;
}

function pickDefaultIndex(locations: WebLocation[], preferredDefaultId?: string): number {
  const preferredIndex = pickIndexById(locations, preferredDefaultId);
  if (preferredIndex >= 0) return preferredIndex;

  const flaggedDefault = locations.findIndex((loc) => loc.is_default);
  if (flaggedDefault >= 0) return flaggedDefault;

  return 0;
}

export function normalizeWebLocations(
  locations: WebLocation[],
  preferredCurrentId?: string,
  preferredDefaultId?: string
): WebLocation[] {
  if (locations.length === 0) return [];

  const currentIndex = pickCurrentIndex(locations, preferredCurrentId);
  const defaultIndex = pickDefaultIndex(locations, preferredDefaultId);

  return locations.map((loc, index) => ({
    ...loc,
    is_current: index === currentIndex,
    is_default: index === defaultIndex,
  }));
}

export const useWebLocationStore = create<WebLocationState>()(
  persist(
    (set) => ({
      locations: [],

      addLocation: (location) => {
        const id = generateId();
        set((state) => ({
          locations: normalizeWebLocations(
            [...state.locations, { ...location, id }],
            location.is_current ? id : undefined,
            location.is_default ? id : undefined
          ),
        }));
        return id;
      },

      updateLocation: (id, updates) => {
        const preferredCurrentId = updates.is_current ? id : undefined;
        const preferredDefaultId = updates.is_default ? id : undefined;
        set((state) => ({
          locations: normalizeWebLocations(
            state.locations.map((loc) =>
              loc.id === id ? { ...loc, ...updates } : loc
            ),
            preferredCurrentId,
            preferredDefaultId
          ),
        }));
      },

      removeLocation: (id) => {
        set((state) => ({
          locations: normalizeWebLocations(
            state.locations.filter((loc) => loc.id !== id)
          ),
        }));
      },

      setCurrent: (id) => {
        set((state) => ({
          locations: normalizeWebLocations(state.locations, id),
        }));
      },

      setDefault: (id) => {
        set((state) => ({
          locations: normalizeWebLocations(state.locations, undefined, id),
        }));
      },

      clearAll: () => {
        set({ locations: [] });
      },
    }),
    {
      name: 'starmap-web-locations',
      storage: getZustandStorage(),
      merge: (persistedState, currentState) => {
        const persisted = (persistedState ?? {}) as Partial<WebLocationState>;
        const restoredLocations = Array.isArray(persisted.locations) ? persisted.locations : [];
        return {
          ...currentState,
          ...persisted,
          locations: normalizeWebLocations(restoredLocations),
        };
      },
    }
  )
);
