/**
 * Tauri API wrapper for sky markers management
 * Only available in Tauri desktop environment
 */

import { isTauri } from '@/lib/storage/platform';
import type { MarkerIcon } from '@/lib/stores/marker-store';

// Lazy import to avoid errors in web environment
async function getInvoke() {
  if (!isTauri()) {
    throw new Error('Tauri API is only available in desktop environment');
  }
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke;
}

// ============================================================================
// Types (snake_case for Tauri/Rust IPC compatibility)
// ============================================================================

export interface SkyMarker {
  id: string;
  name: string;
  description?: string | null;
  ra: number;
  dec: number;
  ra_string: string;
  dec_string: string;
  color: string;
  icon: MarkerIcon;
  created_at: number;
  updated_at: number;
  group?: string;
  visible: boolean;
}

export interface MarkerInput {
  id?: string;
  name: string;
  description?: string | null;
  ra: number;
  dec: number;
  ra_string: string;
  dec_string: string;
  color: string;
  icon: MarkerIcon;
  group?: string;
  visible?: boolean;
  created_at?: number;
  updated_at?: number;
}

export interface MarkerUpdateInput {
  name?: string;
  description?: string | null;
  ra?: number;
  dec?: number;
  ra_string?: string;
  dec_string?: string;
  color?: string;
  icon?: MarkerIcon;
  group?: string | null;
  visible?: boolean;
}

export interface MarkersData {
  markers: SkyMarker[];
  groups: string[];
  show_markers: boolean;
  show_markers_updated_at?: number;
}

// ============================================================================
// Markers API
// ============================================================================

export const markersApi = {
  async load(): Promise<MarkersData> {
    const invoke = await getInvoke();
    return invoke('load_markers');
  },

  async save(markersData: MarkersData): Promise<void> {
    const invoke = await getInvoke();
    return invoke('save_markers', { markersData });
  },

  async addMarker(marker: MarkerInput): Promise<MarkersData> {
    const invoke = await getInvoke();
    return invoke('add_marker', { marker });
  },

  async updateMarker(markerId: string, updates: MarkerUpdateInput): Promise<MarkersData> {
    const invoke = await getInvoke();
    return invoke('update_marker', { markerId, updates });
  },

  async removeMarker(markerId: string): Promise<MarkersData> {
    const invoke = await getInvoke();
    return invoke('remove_marker', { markerId });
  },

  async removeMarkersByGroup(group: string): Promise<MarkersData> {
    const invoke = await getInvoke();
    return invoke('remove_markers_by_group', { group });
  },

  async clearAll(): Promise<MarkersData> {
    const invoke = await getInvoke();
    return invoke('clear_all_markers');
  },

  async toggleVisibility(markerId: string): Promise<MarkersData> {
    const invoke = await getInvoke();
    return invoke('toggle_marker_visibility', { markerId });
  },

  async setAllVisible(visible: boolean): Promise<MarkersData> {
    const invoke = await getInvoke();
    return invoke('set_all_markers_visible', { visible });
  },

  async setShowMarkers(show: boolean): Promise<MarkersData> {
    const invoke = await getInvoke();
    return invoke('set_show_markers', { show });
  },

  async addGroup(group: string): Promise<MarkersData> {
    const invoke = await getInvoke();
    return invoke('add_marker_group', { group });
  },

  async removeGroup(group: string): Promise<MarkersData> {
    const invoke = await getInvoke();
    return invoke('remove_marker_group', { group });
  },

  async renameGroup(oldName: string, newName: string): Promise<MarkersData> {
    const invoke = await getInvoke();
    return invoke('rename_marker_group', { oldName, newName });
  },

  async getVisible(): Promise<SkyMarker[]> {
    const invoke = await getInvoke();
    return invoke('get_visible_markers');
  },

  isAvailable: isTauri,
};

export default markersApi;
