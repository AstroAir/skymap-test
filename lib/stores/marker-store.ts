import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getZustandStorage } from '@/lib/storage';
import { isTauri } from '@/lib/storage/platform';
import { markersApi } from '@/lib/tauri/markers-api';
import { createLogger } from '@/lib/logger';

const logger = createLogger('marker-store');

/** Maximum number of markers allowed */
export const MAX_MARKERS = 500;

/** Sort options for markers list */
export type MarkerSortBy = 'name' | 'date' | 'ra';

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
  // Visual size (optional, overrides global)
  size?: number;
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
  showLabels: boolean;
  globalMarkerSize: number;
  sortBy: MarkerSortBy;
  pendingCoords: PendingMarkerCoords | null;
  editingMarkerId: string | null;
  
  // CRUD operations
  addMarker: (marker: MarkerInput) => string | null;
  setPendingCoords: (coords: PendingMarkerCoords | null) => void;
  setEditingMarkerId: (id: string | null) => void;
  removeMarker: (id: string) => void;
  updateMarker: (id: string, updates: Partial<SkyMarker>) => void;
  setActiveMarker: (id: string | null) => void;
  
  // Bulk operations
  removeMarkersByGroup: (group: string) => void;
  clearAllMarkers: () => void;
  
  // Visibility & display
  toggleMarkerVisibility: (id: string) => void;
  setAllMarkersVisible: (visible: boolean) => void;
  setShowMarkers: (show: boolean) => void;
  setShowLabels: (show: boolean) => void;
  setGlobalMarkerSize: (size: number) => void;
  setSortBy: (sortBy: MarkerSortBy) => void;
  
  // Group management
  addGroup: (group: string) => void;
  removeGroup: (group: string) => void;
  renameGroup: (oldName: string, newName: string) => void;
  
  // Getters
  getMarkersByGroup: (group?: string) => SkyMarker[];
  getVisibleMarkers: () => SkyMarker[];
  
  // Import/Export
  exportMarkers: () => string;
  importMarkers: (json: string) => { count: number };
  
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
      showLabels: true,
      globalMarkerSize: 20,
      sortBy: 'date' as MarkerSortBy,
      pendingCoords: null,
      editingMarkerId: null,
      
      // ========== CRUD operations ==========
      setPendingCoords: (coords) => set({ pendingCoords: coords }),
      setEditingMarkerId: (id) => set({ editingMarkerId: id }),
      
      addMarker: (marker) => {
        // Check marker count limit
        if (get().markers.length >= MAX_MARKERS) {
          logger.warn(`Maximum marker count reached (${MAX_MARKERS})`);
          return null;
        }
        
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
          }).catch(err => logger.error('Failed to add marker to Tauri', err));
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
          markersApi.removeMarker(id).catch(err => logger.error('Failed to remove marker from Tauri', err));
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
          markersApi.updateMarker(id, tauriUpdates).catch(err => logger.error('Failed to update marker in Tauri', err));
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
          markersApi.removeMarkersByGroup(group).catch(err => logger.error('Failed to remove markers by group in Tauri', err));
        }
      },
      
      clearAllMarkers: () => {
        set({ markers: [], activeMarkerId: null });
        // Sync to Tauri
        if (isTauri()) {
          markersApi.clearAll().catch(err => logger.error('Failed to clear all markers in Tauri', err));
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
          markersApi.toggleVisibility(id).catch(err => logger.error('Failed to toggle marker visibility in Tauri', err));
        }
      },
      
      setAllMarkersVisible: (visible) => set((state) => ({
        markers: state.markers.map((m) => ({ ...m, visible })),
      })),
      
      setShowMarkers: (show) => {
        set({ showMarkers: show });
        // Sync to Tauri
        if (isTauri()) {
          markersApi.setShowMarkers(show).catch(err => logger.error('Failed to set show markers in Tauri', err));
        }
      },
      
      setShowLabels: (show) => set({ showLabels: show }),
      setGlobalMarkerSize: (size) => set({ globalMarkerSize: Math.max(8, Math.min(48, size)) }),
      setSortBy: (sortBy) => set({ sortBy }),
      
      // ========== Group management ==========
      addGroup: (group) => {
        set((state) => ({
          groups: state.groups.includes(group) ? state.groups : [...state.groups, group],
        }));
        // Sync to Tauri
        if (isTauri()) {
          markersApi.addGroup(group).catch(err => logger.error('Failed to add group in Tauri', err));
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
          markersApi.removeGroup(group).catch(err => logger.error('Failed to remove group in Tauri', err));
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
          markersApi.renameGroup(oldName, newName).catch(err => logger.error('Failed to rename group in Tauri', err));
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
          logger.error('Failed to sync markers with Tauri', error);
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
      
      // ========== Import/Export ==========
      exportMarkers: () => {
        const state = get();
        const data = {
          version: 1,
          markers: state.markers,
          groups: state.groups,
        };
        return JSON.stringify(data, null, 2);
      },
      
      importMarkers: (json) => {
        try {
          const data = JSON.parse(json);
          const importedMarkers: SkyMarker[] = Array.isArray(data.markers) ? data.markers : (Array.isArray(data) ? data : []);
          const importedGroups: string[] = Array.isArray(data.groups) ? data.groups : [];
          
          if (importedMarkers.length === 0) {
            throw new Error('No markers found in import data');
          }
          
          // Validate and re-id markers to avoid collisions
          const now = Date.now();
          const currentMarkers = get().markers;
          const remaining = MAX_MARKERS - currentMarkers.length;
          const toImport = importedMarkers.slice(0, remaining).map((m, i) => ({
            ...m,
            id: `marker-${now}-import-${i}-${Math.random().toString(36).slice(2, 7)}`,
            createdAt: m.createdAt || now,
            updatedAt: now,
            visible: m.visible ?? true,
            color: m.color || '#3b82f6',
            icon: (m.icon || 'pin') as MarkerIcon,
          }));
          
          // Merge groups
          const currentGroups = get().groups;
          const newGroups = importedGroups.filter(g => !currentGroups.includes(g));
          const markerGroups = toImport.map(m => m.group).filter((g): g is string => !!g && !currentGroups.includes(g) && !newGroups.includes(g));
          const allNewGroups = [...new Set([...newGroups, ...markerGroups])];
          
          set((state) => ({
            markers: [...state.markers, ...toImport],
            groups: [...state.groups, ...allNewGroups],
          }));
          
          return { count: toImport.length };
        } catch (error) {
          logger.error('Failed to import markers', error);
          throw error;
        }
      },
    }),
    {
      name: 'starmap-markers',
      storage: getZustandStorage(),
      partialize: (state) => ({
        markers: state.markers,
        groups: state.groups,
        showMarkers: state.showMarkers,
        showLabels: state.showLabels,
        globalMarkerSize: state.globalMarkerSize,
        sortBy: state.sortBy,
      }),
    }
  )
);
