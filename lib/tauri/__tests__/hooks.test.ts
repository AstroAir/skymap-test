/**
 * @jest-environment jsdom
 */
import { renderHook, act, waitFor } from '@testing-library/react';

// Mock isTauri
jest.mock('@/lib/storage/platform', () => ({
  isTauri: jest.fn(() => true),
}));

// Mock tauriApi
jest.mock('../api', () => ({
  tauriApi: {
    equipment: {
      load: jest.fn(),
    },
    locations: {
      load: jest.fn(),
      getCurrent: jest.fn(),
      setCurrent: jest.fn(),
    },
    observationLog: {
      load: jest.fn(),
      getStats: jest.fn(),
    },
    appSettings: {
      load: jest.fn(),
      save: jest.fn(),
      getSystemInfo: jest.fn(),
      saveWindowState: jest.fn(),
      restoreWindowState: jest.fn(),
    },
  },
}));

// Mock target-list-api
jest.mock('../target-list-api', () => ({
  targetListApi: {
    load: jest.fn(),
    getStats: jest.fn(),
    addTarget: jest.fn(),
    removeTarget: jest.fn(),
    updateTarget: jest.fn(),
    setActiveTarget: jest.fn(),
    toggleFavorite: jest.fn(),
  },
}));

// Mock markers-api
jest.mock('../markers-api', () => ({
  markersApi: {
    load: jest.fn(),
    addMarker: jest.fn(),
    removeMarker: jest.fn(),
    updateMarker: jest.fn(),
    toggleVisibility: jest.fn(),
    setShowMarkers: jest.fn(),
    clearAll: jest.fn(),
  },
}));

import { isTauri } from '@/lib/storage/platform';
import { tauriApi } from '../api';
import { targetListApi } from '../target-list-api';
import { markersApi } from '../markers-api';
import {
  useEquipment,
  useLocations,
  useObservationLog,
  useAppSettings,
  useWindowState,
  useTargetList,
  useMarkers,
} from '../hooks';

const mockIsTauri = isTauri as jest.Mock;

// Type-safe mock accessors for nested API objects
const mockEquipmentApi = tauriApi.equipment as jest.Mocked<typeof tauriApi.equipment>;
const mockLocationsApi = tauriApi.locations as jest.Mocked<typeof tauriApi.locations>;
const mockObservationLogApi = tauriApi.observationLog as jest.Mocked<typeof tauriApi.observationLog>;
const mockAppSettingsApi = tauriApi.appSettings as jest.Mocked<typeof tauriApi.appSettings>;
const mockTargetListApi = targetListApi as jest.Mocked<typeof targetListApi>;
const mockMarkersApi = markersApi as jest.Mocked<typeof markersApi>;

describe('useEquipment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsTauri.mockReturnValue(true);
  });

  it('should load equipment on mount', async () => {
    const mockEquipment = {
      telescopes: [{ id: '1', name: 'Test Telescope', focal_length: 1000, aperture: 200 }],
      cameras: [],
      barlow_reducers: [],
      eyepieces: [],
      filters: [],
    };
    mockEquipmentApi.load.mockResolvedValue(mockEquipment);

    const { result } = renderHook(() => useEquipment());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.equipment).toEqual(mockEquipment);
    expect(result.current.error).toBeNull();
    expect(result.current.isAvailable).toBe(true);
  });

  it('should handle load error', async () => {
    mockEquipmentApi.load.mockRejectedValue(new Error('Load failed'));

    const { result } = renderHook(() => useEquipment());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Load failed');
    expect(result.current.equipment).toBeNull();
  });

  it('should not load when not in Tauri', async () => {
    mockIsTauri.mockReturnValue(false);

    const { result } = renderHook(() => useEquipment());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockEquipmentApi.load).not.toHaveBeenCalled();
    expect(result.current.isAvailable).toBe(false);
  });

  it('should refresh equipment', async () => {
    const mockEquipment = { telescopes: [], cameras: [], barlow_reducers: [], eyepieces: [], filters: [] };
    mockEquipmentApi.load.mockResolvedValue(mockEquipment);

    const { result } = renderHook(() => useEquipment());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.refresh();
    });

    expect(mockEquipmentApi.load).toHaveBeenCalledTimes(2);
  });
});

describe('useLocations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsTauri.mockReturnValue(true);
  });

  it('should load locations and current location on mount', async () => {
    const mockLocations = {
      locations: [{ id: '1', name: 'Home', latitude: 45, longitude: -75, altitude: 100 }],
      default_location_id: '1',
    };
    const mockCurrentLocation = { id: '1', name: 'Home', latitude: 45, longitude: -75, altitude: 100 };
    
    mockLocationsApi.load.mockResolvedValue(mockLocations);
    mockLocationsApi.getCurrent.mockResolvedValue(mockCurrentLocation);

    const { result } = renderHook(() => useLocations());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.locations).toEqual(mockLocations);
    expect(result.current.currentLocation).toEqual(mockCurrentLocation);
  });

  it('should set current location', async () => {
    const mockLocations = {
      locations: [
        { id: '1', name: 'Home', latitude: 45, longitude: -75, altitude: 100 },
        { id: '2', name: 'Observatory', latitude: 46, longitude: -76, altitude: 200 },
      ],
      default_location_id: '1',
    };
    
    mockLocationsApi.load.mockResolvedValue(mockLocations);
    mockLocationsApi.getCurrent.mockResolvedValue(mockLocations.locations[0]);
    mockLocationsApi.setCurrent.mockResolvedValue(mockLocations);

    const { result } = renderHook(() => useLocations());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.setCurrent('2');
    });

    expect(mockLocationsApi.setCurrent).toHaveBeenCalledWith('2');
  });

  it('should handle error when setting current location', async () => {
    mockLocationsApi.load.mockResolvedValue({ locations: [], default_location_id: null });
    mockLocationsApi.getCurrent.mockResolvedValue(null);
    mockLocationsApi.setCurrent.mockRejectedValue(new Error('Set current failed'));

    const { result } = renderHook(() => useLocations());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.setCurrent('invalid');
    });

    expect(result.current.error).toBe('Set current failed');
  });
});

describe('useObservationLog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsTauri.mockReturnValue(true);
  });

  it('should load observation log and stats on mount', async () => {
    const mockLog = { entries: [], version: 1 };
    const mockStats = { totalObservations: 10, uniqueObjects: 5 };
    
    mockObservationLogApi.load.mockResolvedValue(mockLog);
    mockObservationLogApi.getStats.mockResolvedValue(mockStats);

    const { result } = renderHook(() => useObservationLog());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.log).toEqual(mockLog);
    expect(result.current.stats).toEqual(mockStats);
  });

  it('should handle load error', async () => {
    mockObservationLogApi.load.mockRejectedValue(new Error('Log load failed'));

    const { result } = renderHook(() => useObservationLog());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Log load failed');
  });
});

describe('useAppSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsTauri.mockReturnValue(true);
  });

  it('should load settings and system info on mount', async () => {
    const mockSettings = { theme: 'dark', language: 'en' };
    const mockSystemInfo = { os: 'windows', version: '1.0.0' };
    
    mockAppSettingsApi.load.mockResolvedValue(mockSettings);
    mockAppSettingsApi.getSystemInfo.mockResolvedValue(mockSystemInfo);

    const { result } = renderHook(() => useAppSettings());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.settings).toEqual(mockSettings);
    expect(result.current.systemInfo).toEqual(mockSystemInfo);
  });

  it('should update settings', async () => {
    const mockSettings = { theme: 'dark', language: 'en' };
    mockAppSettingsApi.load.mockResolvedValue(mockSettings);
    mockAppSettingsApi.getSystemInfo.mockResolvedValue({});
    mockAppSettingsApi.save.mockResolvedValue(undefined);

    const { result } = renderHook(() => useAppSettings());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.updateSettings({ theme: 'light' });
    });

    expect(mockAppSettingsApi.save).toHaveBeenCalledWith({ theme: 'light', language: 'en' });
    expect(result.current.settings).toEqual({ theme: 'light', language: 'en' });
  });

  it('should handle update error', async () => {
    const mockSettings = { theme: 'dark', language: 'en' };
    mockAppSettingsApi.load.mockResolvedValue(mockSettings);
    mockAppSettingsApi.getSystemInfo.mockResolvedValue({});
    mockAppSettingsApi.save.mockRejectedValue(new Error('Save failed'));

    const { result } = renderHook(() => useAppSettings());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.updateSettings({ theme: 'light' });
    });

    expect(result.current.error).toBe('Save failed');
  });
});

describe('useWindowState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsTauri.mockReturnValue(true);
  });

  it('should save window state', async () => {
    mockAppSettingsApi.saveWindowState.mockResolvedValue(undefined);
    mockAppSettingsApi.restoreWindowState.mockResolvedValue(undefined);

    const { result } = renderHook(() => useWindowState());

    await act(async () => {
      await result.current.saveWindowState();
    });

    expect(mockAppSettingsApi.saveWindowState).toHaveBeenCalled();
  });

  it('should restore window state on mount', async () => {
    mockAppSettingsApi.restoreWindowState.mockResolvedValue(undefined);

    renderHook(() => useWindowState());

    await waitFor(() => {
      expect(mockAppSettingsApi.restoreWindowState).toHaveBeenCalled();
    });
  });

  it('should not save when not in Tauri', async () => {
    mockIsTauri.mockReturnValue(false);

    const { result } = renderHook(() => useWindowState());

    await act(async () => {
      await result.current.saveWindowState();
    });

    expect(mockAppSettingsApi.saveWindowState).not.toHaveBeenCalled();
  });
});

describe('useTargetList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsTauri.mockReturnValue(true);
  });

  it('should load target list on mount', async () => {
    const mockTarget = { id: '1', name: 'M31', ra: 10.68, dec: 41.27, ra_string: '0h 42m 44s', dec_string: "+41° 16' 9\"", added_at: Date.now(), priority: 'medium' as const, status: 'planned' as const, tags: ['galaxy'], is_favorite: false, is_archived: false };
    const mockData = { targets: [mockTarget], available_tags: ['galaxy'], active_target_id: undefined };
    const mockStats = { total: 1, planned: 1, in_progress: 0, completed: 0, favorites: 0, archived: 0, high_priority: 0, medium_priority: 1, low_priority: 0, by_tag: [['galaxy', 1]] as [string, number][] };
    
    mockTargetListApi.load.mockResolvedValue(mockData);
    mockTargetListApi.getStats.mockResolvedValue(mockStats);

    const { result } = renderHook(() => useTargetList());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.targets).toEqual(mockData.targets);
    expect(result.current.availableTags).toEqual(mockData.available_tags);
    expect(result.current.stats).toEqual(mockStats);
  });

  it('should add target', async () => {
    const mockData = { targets: [], available_tags: [], active_target_id: undefined };
    const mockTarget = { id: '1', name: 'M31', ra: 10.68, dec: 41.27, ra_string: '0h 42m 44s', dec_string: "+41° 16' 9\"", added_at: Date.now(), priority: 'medium' as const, status: 'planned' as const, tags: [], is_favorite: false, is_archived: false };
    const mockUpdatedData = { targets: [mockTarget], available_tags: [], active_target_id: undefined };
    const mockStats = { total: 0, planned: 0, in_progress: 0, completed: 0, favorites: 0, archived: 0, high_priority: 0, medium_priority: 0, low_priority: 0, by_tag: [] as [string, number][] };
    
    mockTargetListApi.load.mockResolvedValue(mockData);
    mockTargetListApi.getStats.mockResolvedValue(mockStats);
    mockTargetListApi.addTarget.mockResolvedValue(mockUpdatedData);

    const { result } = renderHook(() => useTargetList());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.addTarget({ name: 'M31', ra: 10.68, dec: 41.27, ra_string: '0h 42m 44s', dec_string: "+41° 16' 9\"" });
    });

    expect(mockTargetListApi.addTarget).toHaveBeenCalled();
  });

  it('should remove target', async () => {
    const mockTarget = { id: '1', name: 'M31', ra: 10.68, dec: 41.27, ra_string: '0h 42m 44s', dec_string: "+41° 16' 9\"", added_at: Date.now(), priority: 'medium' as const, status: 'planned' as const, tags: [], is_favorite: false, is_archived: false };
    const mockData = { targets: [mockTarget], available_tags: [], active_target_id: undefined };
    const mockUpdatedData = { targets: [], available_tags: [], active_target_id: undefined };
    const mockStats = { total: 1, planned: 1, in_progress: 0, completed: 0, favorites: 0, archived: 0, high_priority: 0, medium_priority: 1, low_priority: 0, by_tag: [] as [string, number][] };
    
    mockTargetListApi.load.mockResolvedValue(mockData);
    mockTargetListApi.getStats.mockResolvedValue(mockStats);
    mockTargetListApi.removeTarget.mockResolvedValue(mockUpdatedData);

    const { result } = renderHook(() => useTargetList());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.removeTarget('1');
    });

    expect(mockTargetListApi.removeTarget).toHaveBeenCalledWith('1');
  });

  it('should toggle favorite', async () => {
    const mockTarget = { id: '1', name: 'M31', ra: 10.68, dec: 41.27, ra_string: '0h 42m 44s', dec_string: "+41° 16' 9\"", added_at: Date.now(), priority: 'medium' as const, status: 'planned' as const, tags: [], is_favorite: false, is_archived: false };
    const mockData = { targets: [mockTarget], available_tags: [], active_target_id: undefined };
    const mockStats = { total: 1, planned: 1, in_progress: 0, completed: 0, favorites: 0, archived: 0, high_priority: 0, medium_priority: 1, low_priority: 0, by_tag: [] as [string, number][] };
    
    mockTargetListApi.load.mockResolvedValue(mockData);
    mockTargetListApi.getStats.mockResolvedValue(mockStats);
    mockTargetListApi.toggleFavorite.mockResolvedValue({ ...mockData, targets: [{ ...mockTarget, is_favorite: true }] });

    const { result } = renderHook(() => useTargetList());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.toggleFavorite('1');
    });

    expect(mockTargetListApi.toggleFavorite).toHaveBeenCalledWith('1');
  });
});

describe('useMarkers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsTauri.mockReturnValue(true);
  });

  it('should load markers on mount', async () => {
    const mockData = { markers: [{ id: '1', name: 'Test Marker', ra: 0, dec: 0, ra_string: '0h 0m 0s', dec_string: "+0° 0' 0\"", color: '#ff0000', icon: 'star' as const, created_at: Date.now(), updated_at: Date.now(), visible: true }], groups: [], show_markers: true };
    mockMarkersApi.load.mockResolvedValue(mockData);

    const { result } = renderHook(() => useMarkers());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.markers).toEqual(mockData.markers);
  });

  it('should add marker', async () => {
    const mockData = { markers: [], groups: [], show_markers: true };
    const mockUpdatedData = { markers: [{ id: '1', name: 'New Marker', ra: 10, dec: 20, ra_string: '0h 40m 0s', dec_string: "+20° 0' 0\"", color: '#ff0000', icon: 'star' as const, created_at: Date.now(), updated_at: Date.now(), visible: true }], groups: [], show_markers: true };
    
    mockMarkersApi.load.mockResolvedValue(mockData);
    mockMarkersApi.addMarker.mockResolvedValue(mockUpdatedData);

    const { result } = renderHook(() => useMarkers());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.addMarker({ name: 'New Marker', ra: 10, dec: 20, ra_string: '0h 40m 0s', dec_string: "+20° 0' 0\"", color: '#ff0000', icon: 'star' });
    });

    expect(mockMarkersApi.addMarker).toHaveBeenCalled();
  });

  it('should remove marker', async () => {
    const mockData = { markers: [{ id: '1', name: 'Marker', ra: 0, dec: 0, ra_string: '0h 0m 0s', dec_string: "+0° 0' 0\"", color: '#ff0000', icon: 'star' as const, created_at: Date.now(), updated_at: Date.now(), visible: true }], groups: [], show_markers: true };
    const mockUpdatedData = { markers: [], groups: [], show_markers: true };
    
    mockMarkersApi.load.mockResolvedValue(mockData);
    mockMarkersApi.removeMarker.mockResolvedValue(mockUpdatedData);

    const { result } = renderHook(() => useMarkers());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.removeMarker('1');
    });

    expect(mockMarkersApi.removeMarker).toHaveBeenCalledWith('1');
  });

  it('should toggle visibility', async () => {
    const mockMarker = { id: '1', name: 'Marker', ra: 0, dec: 0, ra_string: '0h 0m 0s', dec_string: "+0° 0' 0\"", color: '#ff0000', icon: 'star' as const, created_at: Date.now(), updated_at: Date.now(), visible: true };
    const mockData = { markers: [mockMarker], groups: [], show_markers: true };
    
    mockMarkersApi.load.mockResolvedValue(mockData);
    mockMarkersApi.toggleVisibility.mockResolvedValue({ ...mockData, markers: [{ ...mockMarker, visible: false }] });

    const { result } = renderHook(() => useMarkers());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.toggleVisibility('1');
    });

    expect(mockMarkersApi.toggleVisibility).toHaveBeenCalledWith('1');
  });

  it('should set show markers', async () => {
    const mockData = { markers: [], groups: [], show_markers: true };
    
    mockMarkersApi.load.mockResolvedValue(mockData);
    mockMarkersApi.setShowMarkers.mockResolvedValue({ ...mockData, show_markers: false });

    const { result } = renderHook(() => useMarkers());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.setShowMarkers(false);
    });

    expect(mockMarkersApi.setShowMarkers).toHaveBeenCalledWith(false);
  });

  it('should handle error when adding marker', async () => {
    const mockData = { markers: [], groups: [], show_markers: true };
    
    mockMarkersApi.load.mockResolvedValue(mockData);
    mockMarkersApi.addMarker.mockRejectedValue(new Error('Add marker failed'));

    const { result } = renderHook(() => useMarkers());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.addMarker({ name: 'New Marker', ra: 10, dec: 20, ra_string: '0h 40m 0s', dec_string: "+20° 0' 0\"", color: '#ff0000', icon: 'star' });
    });

    expect(result.current.error).toBe('Add marker failed');
  });

  it('should not load when not in Tauri', async () => {
    mockIsTauri.mockReturnValue(false);

    const { result } = renderHook(() => useMarkers());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockMarkersApi.load).not.toHaveBeenCalled();
    expect(result.current.isAvailable).toBe(false);
  });
});
