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
import { targetListApi } from '../target-list-api';

const mockIsTauri = isTauri as jest.Mock;

describe('targetListApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsTauri.mockReturnValue(true);
  });

  const mockTargetListData = {
    targets: [
      {
        id: 'target-1',
        name: 'M31',
        ra: 10.68,
        dec: 41.27,
        ra_string: '00h 42m 44s',
        dec_string: "+41° 16' 09\"",
        added_at: 1704067200,
        priority: 'high' as const,
        status: 'planned' as const,
        tags: ['galaxy', 'messier'],
        is_favorite: true,
        is_archived: false,
      },
    ],
    available_tags: ['galaxy', 'messier', 'nebula'],
    active_target_id: 'target-1',
  };

  it('should load target list', async () => {
    mockInvoke.mockResolvedValue(mockTargetListData);

    const result = await targetListApi.load();

    expect(mockInvoke).toHaveBeenCalledWith('load_target_list');
    expect(result).toEqual(mockTargetListData);
  });

  it('should save target list', async () => {
    mockInvoke.mockResolvedValue(undefined);

    await targetListApi.save(mockTargetListData);

    expect(mockInvoke).toHaveBeenCalledWith('save_target_list', { targetList: mockTargetListData });
  });

  it('should add target', async () => {
    const targetInput = {
      name: 'M42',
      ra: 83.82,
      dec: -5.39,
      ra_string: '05h 35m 17s',
      dec_string: "-05° 23' 28\"",
      priority: 'medium' as const,
      tags: ['nebula'],
    };
    const updatedData = {
      ...mockTargetListData,
      targets: [...mockTargetListData.targets, { id: 'target-2', ...targetInput, added_at: 1704153600, status: 'planned', is_favorite: false, is_archived: false }],
    };
    mockInvoke.mockResolvedValue(updatedData);

    const result = await targetListApi.addTarget(targetInput);

    expect(mockInvoke).toHaveBeenCalledWith('add_target', { target: targetInput });
    expect(result.targets).toHaveLength(2);
  });

  it('should add targets batch', async () => {
    const batchTargets = [
      { name: 'M42', ra: 83.82, dec: -5.39, ra_string: '05h 35m 17s', dec_string: "-05° 23' 28\"" },
      { name: 'M45', ra: 56.87, dec: 24.12, ra_string: '03h 47m 29s', dec_string: "+24° 07' 00\"" },
    ];
    const updatedData = { ...mockTargetListData, targets: [...mockTargetListData.targets, ...batchTargets.map((t, i) => ({ id: `target-${i + 2}`, ...t }))] };
    mockInvoke.mockResolvedValue(updatedData);

    const result = await targetListApi.addTargetsBatch(batchTargets, 'medium', ['import']);

    expect(mockInvoke).toHaveBeenCalledWith('add_targets_batch', {
      targets: batchTargets,
      defaultPriority: 'medium',
      defaultTags: ['import'],
    });
    expect(result.targets.length).toBeGreaterThan(1);
  });

  it('should update target', async () => {
    const updates = { priority: 'low' as const, notes: 'Updated notes' };
    const updatedData = {
      ...mockTargetListData,
      targets: [{ ...mockTargetListData.targets[0], ...updates }],
    };
    mockInvoke.mockResolvedValue(updatedData);

    const result = await targetListApi.updateTarget('target-1', updates);

    expect(mockInvoke).toHaveBeenCalledWith('update_target', { targetId: 'target-1', updates });
    expect(result.targets[0].priority).toBe('low');
  });

  it('should remove target', async () => {
    const updatedData = { ...mockTargetListData, targets: [], active_target_id: undefined };
    mockInvoke.mockResolvedValue(updatedData);

    const result = await targetListApi.removeTarget('target-1');

    expect(mockInvoke).toHaveBeenCalledWith('remove_target', { targetId: 'target-1' });
    expect(result.targets).toHaveLength(0);
  });

  it('should remove targets batch', async () => {
    const updatedData = { ...mockTargetListData, targets: [] };
    mockInvoke.mockResolvedValue(updatedData);

    const result = await targetListApi.removeTargetsBatch(['target-1', 'target-2']);

    expect(mockInvoke).toHaveBeenCalledWith('remove_targets_batch', { targetIds: ['target-1', 'target-2'] });
    expect(result.targets).toHaveLength(0);
  });

  it('should set active target', async () => {
    const updatedData = { ...mockTargetListData, active_target_id: 'target-2' };
    mockInvoke.mockResolvedValue(updatedData);

    const result = await targetListApi.setActiveTarget('target-2');

    expect(mockInvoke).toHaveBeenCalledWith('set_active_target', { targetId: 'target-2' });
    expect(result.active_target_id).toBe('target-2');
  });

  it('should clear active target', async () => {
    const updatedData = { ...mockTargetListData, active_target_id: undefined };
    mockInvoke.mockResolvedValue(updatedData);

    const result = await targetListApi.setActiveTarget(null);

    expect(mockInvoke).toHaveBeenCalledWith('set_active_target', { targetId: null });
    expect(result.active_target_id).toBeUndefined();
  });

  it('should toggle favorite', async () => {
    const updatedData = {
      ...mockTargetListData,
      targets: [{ ...mockTargetListData.targets[0], is_favorite: false }],
    };
    mockInvoke.mockResolvedValue(updatedData);

    const result = await targetListApi.toggleFavorite('target-1');

    expect(mockInvoke).toHaveBeenCalledWith('toggle_target_favorite', { targetId: 'target-1' });
    expect(result.targets[0].is_favorite).toBe(false);
  });

  it('should toggle archive', async () => {
    const updatedData = {
      ...mockTargetListData,
      targets: [{ ...mockTargetListData.targets[0], is_archived: true }],
    };
    mockInvoke.mockResolvedValue(updatedData);

    const result = await targetListApi.toggleArchive('target-1');

    expect(mockInvoke).toHaveBeenCalledWith('toggle_target_archive', { targetId: 'target-1' });
    expect(result.targets[0].is_archived).toBe(true);
  });

  it('should set status batch', async () => {
    const updatedData = {
      ...mockTargetListData,
      targets: [{ ...mockTargetListData.targets[0], status: 'completed' as const }],
    };
    mockInvoke.mockResolvedValue(updatedData);

    const result = await targetListApi.setStatusBatch(['target-1'], 'completed');

    expect(mockInvoke).toHaveBeenCalledWith('set_targets_status_batch', {
      targetIds: ['target-1'],
      status: 'completed',
    });
    expect(result.targets[0].status).toBe('completed');
  });

  it('should set priority batch', async () => {
    const updatedData = {
      ...mockTargetListData,
      targets: [{ ...mockTargetListData.targets[0], priority: 'low' as const }],
    };
    mockInvoke.mockResolvedValue(updatedData);

    const result = await targetListApi.setPriorityBatch(['target-1'], 'low');

    expect(mockInvoke).toHaveBeenCalledWith('set_targets_priority_batch', {
      targetIds: ['target-1'],
      priority: 'low',
    });
    expect(result.targets[0].priority).toBe('low');
  });

  it('should add tag to targets', async () => {
    const updatedData = {
      ...mockTargetListData,
      targets: [{ ...mockTargetListData.targets[0], tags: [...mockTargetListData.targets[0].tags, 'autumn'] }],
    };
    mockInvoke.mockResolvedValue(updatedData);

    const result = await targetListApi.addTagToTargets(['target-1'], 'autumn');

    expect(mockInvoke).toHaveBeenCalledWith('add_tag_to_targets', {
      targetIds: ['target-1'],
      tag: 'autumn',
    });
    expect(result.targets[0].tags).toContain('autumn');
  });

  it('should remove tag from targets', async () => {
    const updatedData = {
      ...mockTargetListData,
      targets: [{ ...mockTargetListData.targets[0], tags: ['messier'] }],
    };
    mockInvoke.mockResolvedValue(updatedData);

    const result = await targetListApi.removeTagFromTargets(['target-1'], 'galaxy');

    expect(mockInvoke).toHaveBeenCalledWith('remove_tag_from_targets', {
      targetIds: ['target-1'],
      tag: 'galaxy',
    });
    expect(result.targets[0].tags).not.toContain('galaxy');
  });

  it('should archive completed targets', async () => {
    mockInvoke.mockResolvedValue(mockTargetListData);

    const result = await targetListApi.archiveCompleted();

    expect(mockInvoke).toHaveBeenCalledWith('archive_completed_targets');
    expect(result).toEqual(mockTargetListData);
  });

  it('should clear completed targets', async () => {
    mockInvoke.mockResolvedValue(mockTargetListData);

    const result = await targetListApi.clearCompleted();

    expect(mockInvoke).toHaveBeenCalledWith('clear_completed_targets');
    expect(result).toEqual(mockTargetListData);
  });

  it('should clear all targets', async () => {
    const updatedData = { targets: [], available_tags: [], active_target_id: undefined };
    mockInvoke.mockResolvedValue(updatedData);

    const result = await targetListApi.clearAll();

    expect(mockInvoke).toHaveBeenCalledWith('clear_all_targets');
    expect(result.targets).toHaveLength(0);
  });

  it('should search targets', async () => {
    mockInvoke.mockResolvedValue(mockTargetListData.targets);

    const result = await targetListApi.search('M31');

    expect(mockInvoke).toHaveBeenCalledWith('search_targets', { query: 'M31' });
    expect(result).toEqual(mockTargetListData.targets);
  });

  it('should get stats', async () => {
    const mockStats = {
      total: 10,
      planned: 5,
      in_progress: 3,
      completed: 2,
      favorites: 4,
      archived: 1,
      high_priority: 3,
      medium_priority: 4,
      low_priority: 3,
      by_tag: [['galaxy', 5], ['nebula', 3]] as [string, number][],
    };
    mockInvoke.mockResolvedValue(mockStats);

    const result = await targetListApi.getStats();

    expect(mockInvoke).toHaveBeenCalledWith('get_target_stats');
    expect(result).toEqual(mockStats);
  });

  it('should have isAvailable function', () => {
    expect(targetListApi.isAvailable).toBeDefined();
    expect(typeof targetListApi.isAvailable).toBe('function');
  });

  it('should throw error when not in Tauri', async () => {
    mockIsTauri.mockReturnValue(false);

    await expect(targetListApi.load()).rejects.toThrow(
      'Tauri API is only available in desktop environment'
    );
  });
});
