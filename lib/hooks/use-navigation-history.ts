/**
 * Navigation history hook for star map view positions
 * Allows users to go back/forward through visited celestial locations
 */

import { useCallback, useRef } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getZustandStorage } from '@/lib/storage';

export interface NavigationPoint {
  id: string;
  ra: number;
  dec: number;
  fov: number;
  name?: string;
  timestamp: number;
}

interface NavigationHistoryState {
  history: NavigationPoint[];
  currentIndex: number;
  maxHistory: number;
  
  // Actions
  push: (point: Omit<NavigationPoint, 'id' | 'timestamp'>) => void;
  back: () => NavigationPoint | null;
  forward: () => NavigationPoint | null;
  goTo: (index: number) => NavigationPoint | null;
  canGoBack: () => boolean;
  canGoForward: () => boolean;
  clear: () => void;
  getCurrent: () => NavigationPoint | null;
  getHistory: () => NavigationPoint[];
}

// Generate unique ID for navigation points
const generateId = () => `nav_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

// Check if two points are similar enough to be considered the same location
const isSimilarPoint = (a: NavigationPoint, b: Omit<NavigationPoint, 'id' | 'timestamp'>): boolean => {
  // Handle RA wrap-around (0° ≈ 360°)
  let raDiff = Math.abs(a.ra - b.ra);
  if (raDiff > 180) raDiff = 360 - raDiff;
  
  const decDiff = Math.abs(a.dec - b.dec);
  const fovDiff = Math.abs(a.fov - b.fov);
  
  // Consider points similar if within 0.1 degree and same FOV
  return raDiff < 0.1 && decDiff < 0.1 && fovDiff < 0.5;
};

export const useNavigationHistoryStore = create<NavigationHistoryState>()(
  persist(
    (set, get) => ({
      history: [],
      currentIndex: -1,
      maxHistory: 50,

      push: (point) => {
        const state = get();
        const { history, currentIndex, maxHistory } = state;
        
        // Don't add if it's the same as current position
        const current = currentIndex >= 0 ? history[currentIndex] : null;
        if (current && isSimilarPoint(current, point)) {
          return;
        }

        const newPoint: NavigationPoint = {
          ...point,
          id: generateId(),
          timestamp: Date.now(),
        };

        // Remove any forward history when adding new point
        const newHistory = history.slice(0, currentIndex + 1);
        newHistory.push(newPoint);

        // Limit history size
        const trimmedHistory = newHistory.slice(-maxHistory);
        const newIndex = trimmedHistory.length - 1;

        set({
          history: trimmedHistory,
          currentIndex: newIndex,
        });
      },

      back: () => {
        const { history, currentIndex } = get();
        if (currentIndex > 0) {
          const newIndex = currentIndex - 1;
          set({ currentIndex: newIndex });
          return history[newIndex];
        }
        return null;
      },

      forward: () => {
        const { history, currentIndex } = get();
        if (currentIndex < history.length - 1) {
          const newIndex = currentIndex + 1;
          set({ currentIndex: newIndex });
          return history[newIndex];
        }
        return null;
      },

      canGoBack: () => {
        const { currentIndex } = get();
        return currentIndex > 0;
      },

      canGoForward: () => {
        const { history, currentIndex } = get();
        return currentIndex < history.length - 1;
      },

      goTo: (index: number) => {
        const { history } = get();
        if (index >= 0 && index < history.length) {
          set({ currentIndex: index });
          return history[index];
        }
        return null;
      },

      clear: () => {
        set({ history: [], currentIndex: -1 });
      },

      getCurrent: () => {
        const { history, currentIndex } = get();
        return currentIndex >= 0 ? history[currentIndex] : null;
      },

      getHistory: () => {
        return get().history;
      },
    }),
    {
      name: 'starmap-navigation-history',
      storage: getZustandStorage(),
      partialize: (state) => {
        const persistedHistory = state.history.slice(-20);
        const offset = state.history.length - persistedHistory.length;
        // If currentIndex points to an item that will be persisted, adjust it
        // Otherwise, reset to the end of persisted history (most recent valid position)
        let persistedIndex: number;
        if (state.currentIndex >= offset) {
          // Current position is within persisted range
          persistedIndex = state.currentIndex - offset;
        } else {
          // Current position is outside persisted range, reset to start (oldest persisted item)
          persistedIndex = 0;
        }
        // Clamp to valid range
        persistedIndex = Math.max(-1, Math.min(persistedIndex, persistedHistory.length - 1));
        return {
          history: persistedHistory,
          currentIndex: persistedIndex,
        };
      },
    }
  )
);

/**
 * Hook for using navigation history with automatic position tracking
 */
export function useNavigationHistory() {
  const store = useNavigationHistoryStore();
  const lastPushRef = useRef<number>(0);
  const DEBOUNCE_MS = 1000; // Minimum time between auto-pushes

  const pushWithDebounce = useCallback((point: Omit<NavigationPoint, 'id' | 'timestamp'>) => {
    const now = Date.now();
    if (now - lastPushRef.current > DEBOUNCE_MS) {
      lastPushRef.current = now;
      store.push(point);
    }
  }, [store]);

  return {
    ...store,
    pushWithDebounce,
    historyCount: store.history.length,
    currentIndex: store.currentIndex,
  };
}

/**
 * Format navigation point for display
 */
export function formatNavigationPoint(point: NavigationPoint): string {
  if (point.name) {
    return point.name;
  }
  
  // Format RA as hours
  const raHours = point.ra / 15;
  const h = Math.floor(raHours);
  const m = Math.floor((raHours - h) * 60);
  
  // Format Dec
  const decSign = point.dec >= 0 ? '+' : '-';
  const dec = Math.abs(point.dec).toFixed(1);
  
  return `${h}h${m}m ${decSign}${dec}°`;
}

/**
 * Format timestamp for display with i18n support
 * @param timestamp - Unix timestamp in milliseconds
 * @param labels - i18n labels for time formatting
 */
export function formatTimestamp(
  timestamp: number,
  labels: {
    justNow: string;
    minutesAgo: (mins: number) => string;
    hoursAgo: (hours: number) => string;
  }
): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - timestamp;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return labels.justNow;
  if (diffMins < 60) return labels.minutesAgo(diffMins);
  if (diffMins < 1440) return labels.hoursAgo(Math.floor(diffMins / 60));
  
  return date.toLocaleDateString();
}
