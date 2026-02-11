/**
 * View bookmarks store for saving and restoring sky views
 * Allows users to save specific view positions with custom names
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getZustandStorage } from '@/lib/storage';

export interface ViewBookmark {
  id: string;
  name: string;
  ra: number;
  dec: number;
  fov: number;
  description?: string;
  color?: string;
  icon?: BookmarkIcon;
  createdAt: number;
  updatedAt: number;
}

export type BookmarkIcon = 'star' | 'heart' | 'flag' | 'pin' | 'eye' | 'camera' | 'telescope';

export const BOOKMARK_ICONS: BookmarkIcon[] = ['star', 'heart', 'flag', 'pin', 'eye', 'camera', 'telescope'];

export const BOOKMARK_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
] as const;

interface BookmarksState {
  bookmarks: ViewBookmark[];
  
  // Actions
  addBookmark: (bookmark: Omit<ViewBookmark, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateBookmark: (id: string, updates: Partial<ViewBookmark>) => void;
  removeBookmark: (id: string) => void;
  getBookmark: (id: string) => ViewBookmark | undefined;
  reorderBookmarks: (fromIndex: number, toIndex: number) => void;
  duplicateBookmark: (id: string, copySuffix?: string) => string | null;
}

// Generate unique ID for bookmarks
const generateId = () => `bm_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

/**
 * Default bookmarks for common celestial objects
 */
export const DEFAULT_BOOKMARKS: Omit<ViewBookmark, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'North Celestial Pole',
    ra: 0,
    dec: 90,
    fov: 30,
    description: 'The point in the sky directly above Earth\'s North Pole',
    icon: 'star',
    color: BOOKMARK_COLORS[4],
  },
  {
    name: 'Orion Nebula',
    ra: 83.82,
    dec: -5.39,
    fov: 2,
    description: 'M42 - The Great Orion Nebula',
    icon: 'camera',
    color: BOOKMARK_COLORS[6],
  },
  {
    name: 'Andromeda Galaxy',
    ra: 10.68,
    dec: 41.27,
    fov: 3,
    description: 'M31 - Our nearest major galaxy',
    icon: 'telescope',
    color: BOOKMARK_COLORS[5],
  },
  {
    name: 'Galactic Center',
    ra: 266.42,
    dec: -29.01,
    fov: 15,
    description: 'Center of the Milky Way',
    icon: 'eye',
    color: BOOKMARK_COLORS[1],
  },
];

export const useBookmarksStore = create<BookmarksState>()(
  persist(
    (set, get) => ({
      bookmarks: [],

      addBookmark: (bookmark) => {
        const id = generateId();
        const now = Date.now();
        
        const newBookmark: ViewBookmark = {
          ...bookmark,
          id,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          bookmarks: [...state.bookmarks, newBookmark],
        }));

        return id;
      },

      updateBookmark: (id, updates) => {
        set((state) => ({
          bookmarks: state.bookmarks.map((b) =>
            b.id === id ? { ...b, ...updates, updatedAt: Date.now() } : b
          ),
        }));
      },

      removeBookmark: (id) => {
        set((state) => ({
          bookmarks: state.bookmarks.filter((b) => b.id !== id),
        }));
      },

      getBookmark: (id) => {
        return get().bookmarks.find((b) => b.id === id);
      },

      reorderBookmarks: (fromIndex, toIndex) => {
        set((state) => {
          const bookmarks = [...state.bookmarks];
          // Bounds validation
          if (fromIndex < 0 || fromIndex >= bookmarks.length ||
              toIndex < 0 || toIndex >= bookmarks.length) {
            return state;
          }
          const [removed] = bookmarks.splice(fromIndex, 1);
          bookmarks.splice(toIndex, 0, removed);
          return { bookmarks };
        });
      },

      duplicateBookmark: (id, copySuffix = '(Copy)') => {
        const original = get().getBookmark(id);
        if (!original) return null;

        const newId = generateId();
        const now = Date.now();

        const duplicated: ViewBookmark = {
          ...original,
          id: newId,
          name: `${original.name} ${copySuffix}`,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          bookmarks: [...state.bookmarks, duplicated],
        }));

        return newId;
      },
    }),
    {
      name: 'starmap-bookmarks',
      storage: getZustandStorage(),
      onRehydrateStorage: () => (state) => {
        // Load default bookmarks on first use (empty store)
        if (state && state.bookmarks.length === 0) {
          const now = Date.now();
          const defaults = DEFAULT_BOOKMARKS.map((b, i) => ({
            ...b,
            id: generateId() + `_${i}`,
            createdAt: now,
            updatedAt: now,
          }));
          useBookmarksStore.setState({ bookmarks: defaults });
        }
      },
    }
  )
);
