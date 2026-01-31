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
import { cacheApi } from '../cache-api';

const mockIsTauri = isTauri as jest.Mock;

describe('cacheApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsTauri.mockReturnValue(true);
  });

  it('should get cache stats', async () => {
    const mockStats = {
      total_regions: 5,
      total_tiles: 1000,
      total_size_bytes: 50000000,
      completed_regions: 3,
      surveys: [{ survey_id: 'dss', tile_count: 500, size_bytes: 25000000 }],
    };
    mockInvoke.mockResolvedValue(mockStats);

    const result = await cacheApi.getStats();

    expect(mockInvoke).toHaveBeenCalledWith('get_cache_stats');
    expect(result).toEqual(mockStats);
  });

  it('should list cache regions', async () => {
    const mockRegions = [
      {
        id: 'region-1',
        name: 'Orion',
        center_ra: 83.82,
        center_dec: -5.39,
        radius_deg: 5,
        min_zoom: 1,
        max_zoom: 8,
        survey_id: 'dss',
        tile_count: 100,
        size_bytes: 5000000,
        status: 'completed',
        progress: 100,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      },
    ];
    mockInvoke.mockResolvedValue(mockRegions);

    const result = await cacheApi.listRegions();

    expect(mockInvoke).toHaveBeenCalledWith('list_cache_regions');
    expect(result).toEqual(mockRegions);
  });

  it('should create cache region', async () => {
    const mockRegion = {
      id: 'region-2',
      name: 'Andromeda',
      center_ra: 10.68,
      center_dec: 41.27,
      radius_deg: 3,
      min_zoom: 1,
      max_zoom: 10,
      survey_id: 'dss',
      tile_count: 200,
      size_bytes: 0,
      status: 'pending',
      progress: 0,
      created_at: '2024-01-02',
      updated_at: '2024-01-02',
    };
    mockInvoke.mockResolvedValue(mockRegion);

    const result = await cacheApi.createRegion('Andromeda', 10.68, 41.27, 3, 1, 10, 'dss');

    expect(mockInvoke).toHaveBeenCalledWith('create_cache_region', {
      args: {
        name: 'Andromeda',
        center_ra: 10.68,
        center_dec: 41.27,
        radius_deg: 3,
        min_zoom: 1,
        max_zoom: 10,
        survey_id: 'dss',
      },
    });
    expect(result).toEqual(mockRegion);
  });

  it('should update cache region', async () => {
    const mockRegion = {
      id: 'region-1',
      name: 'Orion',
      status: 'downloading',
      progress: 50,
    };
    mockInvoke.mockResolvedValue(mockRegion);

    const result = await cacheApi.updateRegion('region-1', 'downloading', 50, 2500000);

    expect(mockInvoke).toHaveBeenCalledWith('update_cache_region', {
      regionId: 'region-1',
      status: 'downloading',
      progress: 50,
      sizeBytes: 2500000,
    });
    expect(result).toEqual(mockRegion);
  });

  it('should delete cache region', async () => {
    mockInvoke.mockResolvedValue(undefined);

    await cacheApi.deleteRegion('region-1', true);

    expect(mockInvoke).toHaveBeenCalledWith('delete_cache_region', {
      regionId: 'region-1',
      deleteTiles: true,
    });
  });

  it('should delete region without deleting tiles', async () => {
    mockInvoke.mockResolvedValue(undefined);

    await cacheApi.deleteRegion('region-1', false);

    expect(mockInvoke).toHaveBeenCalledWith('delete_cache_region', {
      regionId: 'region-1',
      deleteTiles: false,
    });
  });

  it('should save tile', async () => {
    mockInvoke.mockResolvedValue(undefined);
    const tileData = new Uint8Array([1, 2, 3, 4, 5]);

    await cacheApi.saveTile('dss', 5, 100, 200, tileData);

    expect(mockInvoke).toHaveBeenCalledWith('save_cached_tile', {
      surveyId: 'dss',
      zoom: 5,
      x: 100,
      y: 200,
      data: [1, 2, 3, 4, 5],
    });
  });

  it('should load tile', async () => {
    mockInvoke.mockResolvedValue([1, 2, 3, 4, 5]);

    const result = await cacheApi.loadTile('dss', 5, 100, 200);

    expect(mockInvoke).toHaveBeenCalledWith('load_cached_tile', {
      surveyId: 'dss',
      zoom: 5,
      x: 100,
      y: 200,
    });
    expect(result).toEqual(new Uint8Array([1, 2, 3, 4, 5]));
  });

  it('should return null for non-existent tile', async () => {
    mockInvoke.mockResolvedValue(null);

    const result = await cacheApi.loadTile('dss', 5, 100, 200);

    expect(result).toBeNull();
  });

  it('should check if tile is cached', async () => {
    mockInvoke.mockResolvedValue(true);

    const result = await cacheApi.isTileCached('dss', 5, 100, 200);

    expect(mockInvoke).toHaveBeenCalledWith('is_tile_cached', {
      surveyId: 'dss',
      zoom: 5,
      x: 100,
      y: 200,
    });
    expect(result).toBe(true);
  });

  it('should clear survey cache', async () => {
    mockInvoke.mockResolvedValue(500);

    const result = await cacheApi.clearSurveyCache('dss');

    expect(mockInvoke).toHaveBeenCalledWith('clear_survey_cache', { surveyId: 'dss' });
    expect(result).toBe(500);
  });

  it('should clear all cache', async () => {
    mockInvoke.mockResolvedValue(1000);

    const result = await cacheApi.clearAllCache();

    expect(mockInvoke).toHaveBeenCalledWith('clear_all_cache');
    expect(result).toBe(1000);
  });

  it('should get cache directory', async () => {
    mockInvoke.mockResolvedValue('/home/user/.cache/skymap');

    const result = await cacheApi.getCacheDirectory();

    expect(mockInvoke).toHaveBeenCalledWith('get_cache_directory');
    expect(result).toBe('/home/user/.cache/skymap');
  });

  it('should have isAvailable function', () => {
    expect(cacheApi.isAvailable).toBeDefined();
    expect(typeof cacheApi.isAvailable).toBe('function');
  });

  it('should throw error when not in Tauri', async () => {
    mockIsTauri.mockReturnValue(false);

    await expect(cacheApi.getStats()).rejects.toThrow(
      'Tauri API is only available in desktop environment'
    );
  });
});
