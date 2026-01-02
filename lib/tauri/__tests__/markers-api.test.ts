/**
 * @jest-environment jsdom
 */

// Mock isTauri
jest.mock('@/lib/storage/platform', () => ({
  isTauri: jest.fn(() => true),
}));

// Mock @tauri-apps/api/core
const mockInvoke = jest.fn();
jest.mock('@tauri-apps/api/core', () => ({
  invoke: mockInvoke,
}));

import { isTauri } from '@/lib/storage/platform';
import { markersApi } from '../markers-api';

const mockIsTauri = isTauri as jest.Mock;

describe('markersApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsTauri.mockReturnValue(true);
  });

  const mockMarkersData = {
    markers: [
      {
        id: 'marker-1',
        name: 'M31',
        description: 'Andromeda Galaxy',
        ra: 10.68,
        dec: 41.27,
        ra_string: '00h 42m 44s',
        dec_string: "+41° 16' 09\"",
        color: '#ff0000',
        icon: 'star' as const,
        created_at: 1704067200,
        updated_at: 1704067200,
        group: 'galaxies',
        visible: true,
      },
    ],
    groups: ['galaxies', 'nebulae'],
    show_markers: true,
  };

  it('should load markers', async () => {
    mockInvoke.mockResolvedValue(mockMarkersData);

    const result = await markersApi.load();

    expect(mockInvoke).toHaveBeenCalledWith('load_markers');
    expect(result).toEqual(mockMarkersData);
  });

  it('should save markers', async () => {
    mockInvoke.mockResolvedValue(undefined);

    await markersApi.save(mockMarkersData);

    expect(mockInvoke).toHaveBeenCalledWith('save_markers', { markersData: mockMarkersData });
  });

  it('should add marker', async () => {
    const markerInput = {
      name: 'M42',
      description: 'Orion Nebula',
      ra: 83.82,
      dec: -5.39,
      ra_string: '05h 35m 17s',
      dec_string: "-05° 23' 28\"",
      color: '#00ff00',
      icon: 'circle' as const,
      group: 'nebulae',
    };
    const updatedData = {
      ...mockMarkersData,
      markers: [...mockMarkersData.markers, { id: 'marker-2', ...markerInput, created_at: 1704153600, updated_at: 1704153600, visible: true }],
    };
    mockInvoke.mockResolvedValue(updatedData);

    const result = await markersApi.addMarker(markerInput);

    expect(mockInvoke).toHaveBeenCalledWith('add_marker', { marker: markerInput });
    expect(result.markers).toHaveLength(2);
  });

  it('should update marker', async () => {
    const updates = { name: 'M31 - Andromeda', color: '#0000ff' };
    const updatedData = {
      ...mockMarkersData,
      markers: [{ ...mockMarkersData.markers[0], ...updates }],
    };
    mockInvoke.mockResolvedValue(updatedData);

    const result = await markersApi.updateMarker('marker-1', updates);

    expect(mockInvoke).toHaveBeenCalledWith('update_marker', { markerId: 'marker-1', updates });
    expect(result.markers[0].name).toBe('M31 - Andromeda');
  });

  it('should remove marker', async () => {
    const updatedData = { ...mockMarkersData, markers: [] };
    mockInvoke.mockResolvedValue(updatedData);

    const result = await markersApi.removeMarker('marker-1');

    expect(mockInvoke).toHaveBeenCalledWith('remove_marker', { markerId: 'marker-1' });
    expect(result.markers).toHaveLength(0);
  });

  it('should remove markers by group', async () => {
    const updatedData = { ...mockMarkersData, markers: [] };
    mockInvoke.mockResolvedValue(updatedData);

    const result = await markersApi.removeMarkersByGroup('galaxies');

    expect(mockInvoke).toHaveBeenCalledWith('remove_markers_by_group', { group: 'galaxies' });
    expect(result.markers).toHaveLength(0);
  });

  it('should clear all markers', async () => {
    const updatedData = { markers: [], groups: [], show_markers: true };
    mockInvoke.mockResolvedValue(updatedData);

    const result = await markersApi.clearAll();

    expect(mockInvoke).toHaveBeenCalledWith('clear_all_markers');
    expect(result.markers).toHaveLength(0);
  });

  it('should toggle marker visibility', async () => {
    const updatedData = {
      ...mockMarkersData,
      markers: [{ ...mockMarkersData.markers[0], visible: false }],
    };
    mockInvoke.mockResolvedValue(updatedData);

    const result = await markersApi.toggleVisibility('marker-1');

    expect(mockInvoke).toHaveBeenCalledWith('toggle_marker_visibility', { markerId: 'marker-1' });
    expect(result.markers[0].visible).toBe(false);
  });

  it('should set all markers visible', async () => {
    mockInvoke.mockResolvedValue(mockMarkersData);

    const result = await markersApi.setAllVisible(true);

    expect(mockInvoke).toHaveBeenCalledWith('set_all_markers_visible', { visible: true });
    expect(result).toEqual(mockMarkersData);
  });

  it('should set all markers hidden', async () => {
    const updatedData = {
      ...mockMarkersData,
      markers: [{ ...mockMarkersData.markers[0], visible: false }],
    };
    mockInvoke.mockResolvedValue(updatedData);

    const result = await markersApi.setAllVisible(false);

    expect(mockInvoke).toHaveBeenCalledWith('set_all_markers_visible', { visible: false });
    expect(result.markers[0].visible).toBe(false);
  });

  it('should set show markers flag', async () => {
    const updatedData = { ...mockMarkersData, show_markers: false };
    mockInvoke.mockResolvedValue(updatedData);

    const result = await markersApi.setShowMarkers(false);

    expect(mockInvoke).toHaveBeenCalledWith('set_show_markers', { show: false });
    expect(result.show_markers).toBe(false);
  });

  it('should add group', async () => {
    const updatedData = { ...mockMarkersData, groups: [...mockMarkersData.groups, 'clusters'] };
    mockInvoke.mockResolvedValue(updatedData);

    const result = await markersApi.addGroup('clusters');

    expect(mockInvoke).toHaveBeenCalledWith('add_marker_group', { group: 'clusters' });
    expect(result.groups).toContain('clusters');
  });

  it('should remove group', async () => {
    const updatedData = { ...mockMarkersData, groups: ['nebulae'] };
    mockInvoke.mockResolvedValue(updatedData);

    const result = await markersApi.removeGroup('galaxies');

    expect(mockInvoke).toHaveBeenCalledWith('remove_marker_group', { group: 'galaxies' });
    expect(result.groups).not.toContain('galaxies');
  });

  it('should rename group', async () => {
    const updatedData = { ...mockMarkersData, groups: ['spiral_galaxies', 'nebulae'] };
    mockInvoke.mockResolvedValue(updatedData);

    const result = await markersApi.renameGroup('galaxies', 'spiral_galaxies');

    expect(mockInvoke).toHaveBeenCalledWith('rename_marker_group', {
      oldName: 'galaxies',
      newName: 'spiral_galaxies',
    });
    expect(result.groups).toContain('spiral_galaxies');
  });

  it('should get visible markers', async () => {
    mockInvoke.mockResolvedValue(mockMarkersData.markers);

    const result = await markersApi.getVisible();

    expect(mockInvoke).toHaveBeenCalledWith('get_visible_markers');
    expect(result).toEqual(mockMarkersData.markers);
  });

  it('should have isAvailable function', () => {
    expect(markersApi.isAvailable).toBeDefined();
    expect(typeof markersApi.isAvailable).toBe('function');
  });

  it('should throw error when not in Tauri', async () => {
    mockIsTauri.mockReturnValue(false);

    await expect(markersApi.load()).rejects.toThrow(
      'Tauri API is only available in desktop environment'
    );
  });
});
