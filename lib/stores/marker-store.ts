import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getZustandStorage } from '@/lib/storage';
import { isTauri } from '@/lib/storage/platform';
import { markersApi } from '@/lib/tauri/markers-api';

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
  
  // Tauri sync
  syncWithTauri: () => Promise<void>;
  _tauriInitialized: boolean;
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
        
        // Sync to Tauri
        if (isTauri()) {
          markersApi.addMarker({
            name: newMarker.name,
            description: newMarker.description,
            ra: newMarker.ra,
            dec: newMarker.dec,
            ra_string: newMarker.raString,
            dec_string: newMarker.decString,
            color: newMarker.color,
            icon: newMarker.icon,
            group: newMarker.group,
          }).catch(console.error);
        }
        
        return id;
      },
      
      removeMarker: (id) => {
        set((state) => ({
          markers: state.markers.filter((m) => m.id !== id),
          activeMarkerId: state.activeMarkerId === id ? null : state.activeMarkerId,
        }));
        // Sync to Tauri
        if (isTauri()) {
          markersApi.removeMarker(id).catch(console.error);
        }
      },
      
      updateMarker: (id, updates) => {
        set((state) => {
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
        });
        // Sync to Tauri
        if (isTauri()) {
          const tauriUpdates: Record<string, unknown> = {};
          if (updates.name !== undefined) tauriUpdates.name = updates.name;
          if (updates.description !== undefined) tauriUpdates.description = updates.description;
          if (updates.ra !== undefined) tauriUpdates.ra = updates.ra;
          if (updates.dec !== undefined) tauriUpdates.dec = updates.dec;
          if (updates.raString !== undefined) tauriUpdates.ra_string = updates.raString;
          if (updates.decString !== undefined) tauriUpdates.dec_string = updates.decString;
          if (updates.color !== undefined) tauriUpdates.color = updates.color;
          if (updates.icon !== undefined) tauriUpdates.icon = updates.icon;
          if (updates.group !== undefined) tauriUpdates.group = updates.group;
          if (updates.visible !== undefined) tauriUpdates.visible = updates.visible;
          markersApi.updateMarker(id, tauriUpdates).catch(console.error);
        }
      },
      
      setActiveMarker: (id) => set({ activeMarkerId: id }),
      
      // ========== Bulk operations ==========
      removeMarkersByGroup: (group) => {
        set((state) => ({
          markers: state.markers.filter((m) => m.group !== group),
          activeMarkerId: state.markers.find(m => m.id === state.activeMarkerId)?.group === group
            ? null
            : state.activeMarkerId,
        }));
        // Sync to Tauri
        if (isTauri()) {
          markersApi.removeMarkersByGroup(group).catch(console.error);
        }
      },
      
      clearAllMarkers: () => {
        set({ markers: [], activeMarkerId: null });
        // Sync to Tauri
        if (isTauri()) {
          markersApi.clearAll().catch(console.error);
        }
      },
      
      // ========== Visibility ==========
      toggleMarkerVisibility: (id) => {
        set((state) => ({
          markers: state.markers.map((m) =>
            m.id === id ? { ...m, visible: !m.visible } : m
          ),
        }));
        // Sync to Tauri
        if (isTauri()) {
          markersApi.toggleVisibility(id).catch(console.error);
        }
      },
      
      setAllMarkersVisible: (visible) => set((state) => ({
        markers: state.markers.map((m) => ({ ...m, visible })),
      })),
      
      setShowMarkers: (show) => {
        set({ showMarkers: show });
        // Sync to Tauri
        if (isTauri()) {
          markersApi.setShowMarkers(show).catch(console.error);
        }
      },
      
      // ========== Group management ==========
      addGroup: (group) => {
        set((state) => ({
          groups: state.groups.includes(group) ? state.groups : [...state.groups, group],
        }));
        // Sync to Tauri
        if (isTauri()) {
          markersApi.addGroup(group).catch(console.error);
        }
      },
      
      removeGroup: (group) => {
        set((state) => ({
          groups: state.groups.filter((g) => g !== group),
          // Move markers in this group to "Default"
          markers: state.markers.map((m) =>
            m.group === group ? { ...m, group: 'Default' } : m
          ),
        }));
        // Sync to Tauri
        if (isTauri()) {
          markersApi.removeGroup(group).catch(console.error);
        }
      },
      
      renameGroup: (oldName, newName) => {
        set((state) => ({
          groups: state.groups.map((g) => g === oldName ? newName : g),
          markers: state.markers.map((m) =>
            m.group === oldName ? { ...m, group: newName } : m
          ),
        }));
        // Sync to Tauri
        if (isTauri()) {
          markersApi.renameGroup(oldName, newName).catch(console.error);
        }
      },
      
      // ========== Tauri sync ==========
      _tauriInitialized: false,
      
      syncWithTauri: async () => {
        if (!isTauri() || get()._tauriInitialized) return;
        
        try {
          const data = await markersApi.load();
          if (data) {
            set({
              markers: data.markers.map(m => ({
                ...m,
                raString: m.ra_string,
                decString: m.dec_string,
                createdAt: m.created_at,
                updatedAt: m.updated_at,
              })),
              groups: data.groups,
              showMarkers: data.show_markers,
              _tauriInitialized: true,
            });
          }
        } catch (error) {
          console.error('Failed to sync markers with Tauri:', error);
        }
      },
      
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
      storage: getZustandStorage(),
      partialize: (state) => ({
        markers: state.markers,
        groups: state.groups,
        showMarkers: state.showMarkers,
      }),
    }
  )
);
