import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Sky marker for annotating positions on the celestial sphere
 */
export interface SkyMarker {
  id: string;
  name: string;
  description?: string;
  ra: number; // degrees
  dec: number; // degrees
  raString: string;
  decString: string;
  // Visual properties
  color: string; // hex color
  icon: MarkerIcon;
  // Metadata
  createdAt: number;
  updatedAt: number;
  // Grouping
  group?: string;
  // Visibility
  visible: boolean;
}

export type MarkerIcon = 
  | 'star'
  | 'circle'
  | 'crosshair'
  | 'pin'
  | 'diamond'
  | 'triangle'
  | 'square'
  | 'flag';

export const MARKER_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#ffffff', // white
] as const;

export const MARKER_ICONS: MarkerIcon[] = [
  'star',
  'circle',
  'crosshair',
  'pin',
  'diamond',
  'triangle',
  'square',
  'flag',
];

/** Input type for adding a marker (without auto-generated fields) */
export type MarkerInput = Omit<SkyMarker, 'id' | 'createdAt' | 'updatedAt' | 'visible'> & {
  visible?: boolean;
};

/** Pending marker coordinates for context menu add */
export interface PendingMarkerCoords {
  ra: number;
  dec: number;
  raString: string;
  decString: string;
}

interface MarkerState {
  markers: SkyMarker[];
  groups: string[];
  activeMarkerId: string | null;
  showMarkers: boolean;
  pendingCoords: PendingMarkerCoords | null;
  editingMarkerId: string | null;
  
  // CRUD operations
  addMarker: (marker: MarkerInput) => string;
  setPendingCoords: (coords: PendingMarkerCoords | null) => void;
  setEditingMarkerId: (id: string | null) => void;
  removeMarker: (id: string) => void;
  updateMarker: (id: string, updates: Partial<SkyMarker>) => void;
  setActiveMarker: (id: string | null) => void;
  
  // Bulk operations
  removeMarkersByGroup: (group: string) => void;
  clearAllMarkers: () => void;
  
  // Visibility
  toggleMarkerVisibility: (id: string) => void;
  setAllMarkersVisible: (visible: boolean) => void;
  setShowMarkers: (show: boolean) => void;
  
  // Group management
  addGroup: (group: string) => void;
  removeGroup: (group: string) => void;
  renameGroup: (oldName: string, newName: string) => void;
  
  // Getters
  getMarkersByGroup: (group?: string) => SkyMarker[];
  getVisibleMarkers: () => SkyMarker[];
}

// Helper to generate unique ID
const generateId = () => `marker-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const useMarkerStore = create<MarkerState>()(
  persist(
    (set, get) => ({
      markers: [],
      groups: ['Default'],
      activeMarkerId: null,
      showMarkers: true,
      pendingCoords: null,
      editingMarkerId: null,
      
      // ========== CRUD operations ==========
      setPendingCoords: (coords) => set({ pendingCoords: coords }),
      setEditingMarkerId: (id) => set({ editingMarkerId: id }),
      
      addMarker: (marker) => {
        const id = generateId();
        const newMarker: SkyMarker = {
          ...marker,
          id,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          visible: marker.visible ?? true,
        };
        
        // Add group if it doesn't exist
        if (marker.group && !get().groups.includes(marker.group)) {
          set((state) => ({
            groups: [...state.groups, marker.group!],
          }));
        }
        
        set((state) => ({
          markers: [...state.markers, newMarker],
        }));
        
        return id;
      },
      
      removeMarker: (id) => set((state) => ({
        markers: state.markers.filter((m) => m.id !== id),
        activeMarkerId: state.activeMarkerId === id ? null : state.activeMarkerId,
      })),
      
      updateMarker: (id, updates) => set((state) => {
        // Add group if it doesn't exist
        if (updates.group && !state.groups.includes(updates.group)) {
          return {
            markers: state.markers.map((m) =>
              m.id === id ? { ...m, ...updates, updatedAt: Date.now() } : m
            ),
            groups: [...state.groups, updates.group],
          };
        }
        
        return {
          markers: state.markers.map((m) =>
            m.id === id ? { ...m, ...updates, updatedAt: Date.now() } : m
          ),
        };
      }),
      
      setActiveMarker: (id) => set({ activeMarkerId: id }),
      
      // ========== Bulk operations ==========
      removeMarkersByGroup: (group) => set((state) => ({
        markers: state.markers.filter((m) => m.group !== group),
        activeMarkerId: state.markers.find(m => m.id === state.activeMarkerId)?.group === group
          ? null
          : state.activeMarkerId,
      })),
      
      clearAllMarkers: () => set({ markers: [], activeMarkerId: null }),
      
      // ========== Visibility ==========
      toggleMarkerVisibility: (id) => set((state) => ({
        markers: state.markers.map((m) =>
          m.id === id ? { ...m, visible: !m.visible } : m
        ),
      })),
      
      setAllMarkersVisible: (visible) => set((state) => ({
        markers: state.markers.map((m) => ({ ...m, visible })),
      })),
      
      setShowMarkers: (show) => set({ showMarkers: show }),
      
      // ========== Group management ==========
      addGroup: (group) => set((state) => ({
        groups: state.groups.includes(group) ? state.groups : [...state.groups, group],
      })),
      
      removeGroup: (group) => set((state) => ({
        groups: state.groups.filter((g) => g !== group),
        // Move markers in this group to "Default"
        markers: state.markers.map((m) =>
          m.group === group ? { ...m, group: 'Default' } : m
        ),
      })),
      
      renameGroup: (oldName, newName) => set((state) => ({
        groups: state.groups.map((g) => g === oldName ? newName : g),
        markers: state.markers.map((m) =>
          m.group === oldName ? { ...m, group: newName } : m
        ),
      })),
      
      // ========== Getters ==========
      getMarkersByGroup: (group) => {
        const state = get();
        if (!group) return state.markers;
        return state.markers.filter((m) => m.group === group);
      },
      
      getVisibleMarkers: () => {
        const state = get();
        if (!state.showMarkers) return [];
        return state.markers.filter((m) => m.visible);
      },
    }),
    {
      name: 'starmap-markers',
      partialize: (state) => ({
        markers: state.markers,
        groups: state.groups,
        showMarkers: state.showMarkers,
      }),
    }
  )
);
