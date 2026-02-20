import { act, renderHook } from '@testing-library/react';
import { useTargetListStore, type TargetInput } from '../target-list-store';

// Mock Tauri platform check
jest.mock('@/lib/storage/platform', () => ({
  isTauri: jest.fn(() => false),
}));

// Mock target list API
jest.mock('@/lib/tauri/target-list-api', () => ({
  targetListApi: {
    addTarget: jest.fn().mockResolvedValue(undefined),
    removeTarget: jest.fn().mockResolvedValue(undefined),
    updateTarget: jest.fn().mockResolvedValue(undefined),
    getTargets: jest.fn().mockResolvedValue([]),
  },
}));

// Mock zustand storage
jest.mock('@/lib/storage', () => ({
  getZustandStorage: jest.fn(() => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  })),
}));

describe('useTargetListStore', () => {
  const mockTarget: TargetInput = {
    name: 'M31 - Andromeda Galaxy',
    ra: 10.684,
    dec: 41.269,
    raString: '00h 42m 44s',
    decString: '+41° 16\' 09"',
    priority: 'high',
  };

  beforeEach(() => {
    const { result } = renderHook(() => useTargetListStore());
    act(() => {
      result.current.clearAll();
      result.current.setSearchQuery('');
      result.current.setFilterStatus('all');
      result.current.setFilterPriority('all');
      result.current.setFilterTags([]);
      result.current.setSortBy('manual');
      result.current.setSortOrder('asc');
      result.current.setScoreProfile('imaging');
      result.current.setScoreVersion('v2');
      result.current.setScoreBreakdownVisibility('collapsed');
      result.current.setShowArchived(false);
    });
  });

  describe('initial state', () => {
    it('should have empty targets array', () => {
      const { result } = renderHook(() => useTargetListStore());
      expect(result.current.targets).toEqual([]);
    });

    it('should have no active target', () => {
      const { result } = renderHook(() => useTargetListStore());
      expect(result.current.activeTargetId).toBeNull();
    });

    it('should have showArchived disabled', () => {
      const { result } = renderHook(() => useTargetListStore());
      expect(result.current.showArchived).toBe(false);
    });

    it('should have groupBy set to none', () => {
      const { result } = renderHook(() => useTargetListStore());
      expect(result.current.groupBy).toBe('none');
    });
  });

  describe('addTarget', () => {
    it('should add a new target', () => {
      const { result } = renderHook(() => useTargetListStore());

      act(() => {
        result.current.addTarget(mockTarget);
      });

      expect(result.current.targets).toHaveLength(1);
      expect(result.current.targets[0].name).toBe('M31 - Andromeda Galaxy');
    });

    it('should set default status to planned', () => {
      const { result } = renderHook(() => useTargetListStore());

      act(() => {
        result.current.addTarget(mockTarget);
      });

      expect(result.current.targets[0].status).toBe('planned');
    });

    it('should set default isFavorite to false', () => {
      const { result } = renderHook(() => useTargetListStore());

      act(() => {
        result.current.addTarget(mockTarget);
      });

      expect(result.current.targets[0].isFavorite).toBe(false);
    });

    it('should set default isArchived to false', () => {
      const { result } = renderHook(() => useTargetListStore());

      act(() => {
        result.current.addTarget(mockTarget);
      });

      expect(result.current.targets[0].isArchived).toBe(false);
    });
  });

  describe('removeTarget', () => {
    it('should remove a target by id', () => {
      const { result } = renderHook(() => useTargetListStore());

      act(() => {
        result.current.addTarget(mockTarget);
      });

      const targetId = result.current.targets[0].id;

      act(() => {
        result.current.removeTarget(targetId);
      });

      expect(result.current.targets).toHaveLength(0);
    });

    it('should clear activeTargetId if removed target was active', () => {
      const { result } = renderHook(() => useTargetListStore());

      act(() => {
        result.current.addTarget(mockTarget);
      });

      const targetId = result.current.targets[0].id;

      act(() => {
        result.current.setActiveTarget(targetId);
      });

      expect(result.current.activeTargetId).toBe(targetId);

      act(() => {
        result.current.removeTarget(targetId);
      });

      expect(result.current.activeTargetId).toBeNull();
    });
  });

  describe('updateTarget', () => {
    it('should update target properties', () => {
      const { result } = renderHook(() => useTargetListStore());

      act(() => {
        result.current.addTarget(mockTarget);
      });

      const targetId = result.current.targets[0].id;

      act(() => {
        result.current.updateTarget(targetId, { 
          notes: 'Great imaging target',
          priority: 'medium',
        });
      });

      expect(result.current.targets[0].notes).toBe('Great imaging target');
      expect(result.current.targets[0].priority).toBe('medium');
    });

    it('should update target status', () => {
      const { result } = renderHook(() => useTargetListStore());

      act(() => {
        result.current.addTarget(mockTarget);
      });

      const targetId = result.current.targets[0].id;

      act(() => {
        result.current.updateTarget(targetId, { status: 'in_progress' });
      });

      expect(result.current.targets[0].status).toBe('in_progress');
    });
  });

  describe('setActiveTarget', () => {
    it('should set active target id', () => {
      const { result } = renderHook(() => useTargetListStore());

      act(() => {
        result.current.addTarget(mockTarget);
      });

      const targetId = result.current.targets[0].id;

      act(() => {
        result.current.setActiveTarget(targetId);
      });

      expect(result.current.activeTargetId).toBe(targetId);
    });

    it('should allow setting to null', () => {
      const { result } = renderHook(() => useTargetListStore());

      act(() => {
        result.current.addTarget(mockTarget);
      });

      act(() => {
        result.current.setActiveTarget(result.current.targets[0].id);
      });

      act(() => {
        result.current.setActiveTarget(null);
      });

      expect(result.current.activeTargetId).toBeNull();
    });
  });

  describe('batch operations', () => {
    it('should add multiple targets at once', () => {
      const { result } = renderHook(() => useTargetListStore());

      const batchTargets = [
        { name: 'M31', ra: 10.684, dec: 41.269, raString: '00h 42m', decString: '+41°' },
        { name: 'M42', ra: 83.822, dec: -5.391, raString: '05h 35m', decString: '-05°' },
        { name: 'M45', ra: 56.601, dec: 24.105, raString: '03h 47m', decString: '+24°' },
      ];

      act(() => {
        result.current.addTargetsBatch(batchTargets);
      });

      expect(result.current.targets).toHaveLength(3);
    });

    it('should remove multiple targets at once', () => {
      const { result } = renderHook(() => useTargetListStore());

      act(() => {
        result.current.addTarget({ ...mockTarget, name: 'Target 1' });
        result.current.addTarget({ ...mockTarget, name: 'Target 2' });
        result.current.addTarget({ ...mockTarget, name: 'Target 3' });
      });

      const ids = result.current.targets.slice(0, 2).map(t => t.id);

      act(() => {
        result.current.removeTargetsBatch(ids);
      });

      expect(result.current.targets).toHaveLength(1);
      expect(result.current.targets[0].name).toBe('Target 3');
    });

    it('should update status for multiple targets', () => {
      const { result } = renderHook(() => useTargetListStore());

      act(() => {
        result.current.addTarget({ ...mockTarget, name: 'Target 1' });
        result.current.addTarget({ ...mockTarget, name: 'Target 2' });
      });

      const ids = result.current.targets.map(t => t.id);

      act(() => {
        result.current.setStatusBatch(ids, 'completed');
      });

      expect(result.current.targets.every(t => t.status === 'completed')).toBe(true);
    });

    it('should update priority for multiple targets', () => {
      const { result } = renderHook(() => useTargetListStore());

      act(() => {
        result.current.addTarget({ ...mockTarget, name: 'Target 1' });
        result.current.addTarget({ ...mockTarget, name: 'Target 2' });
      });

      const ids = result.current.targets.map(t => t.id);

      act(() => {
        result.current.setPriorityBatch(ids, 'low');
      });

      expect(result.current.targets.every(t => t.priority === 'low')).toBe(true);
    });
  });

  describe('tag management', () => {
    it('should add tag to target', () => {
      const { result } = renderHook(() => useTargetListStore());

      act(() => {
        result.current.addTarget(mockTarget);
      });

      const targetId = result.current.targets[0].id;

      act(() => {
        result.current.addTagBatch([targetId], 'galaxy');
      });

      expect(result.current.targets[0].tags).toContain('galaxy');
    });

    it('should remove tag from target', () => {
      const { result } = renderHook(() => useTargetListStore());

      act(() => {
        result.current.addTarget({ ...mockTarget, tags: ['galaxy', 'priority'] });
      });

      const targetId = result.current.targets[0].id;

      act(() => {
        result.current.removeTagBatch([targetId], 'priority');
      });

      expect(result.current.targets[0].tags).not.toContain('priority');
      expect(result.current.targets[0].tags).toContain('galaxy');
    });
  });

  describe('favorite and archive', () => {
    it('should toggle favorite status', () => {
      const { result } = renderHook(() => useTargetListStore());

      act(() => {
        result.current.addTarget(mockTarget);
      });

      const targetId = result.current.targets[0].id;

      act(() => {
        result.current.toggleFavorite(targetId);
      });

      expect(result.current.targets[0].isFavorite).toBe(true);

      act(() => {
        result.current.toggleFavorite(targetId);
      });

      expect(result.current.targets[0].isFavorite).toBe(false);
    });

    it('should toggle archive status', () => {
      const { result } = renderHook(() => useTargetListStore());

      act(() => {
        result.current.addTarget(mockTarget);
      });

      const targetId = result.current.targets[0].id;

      act(() => {
        result.current.toggleArchive(targetId);
      });

      expect(result.current.targets[0].isArchived).toBe(true);
    });
  });

  describe('filtering', () => {
    it('should set filter tags', () => {
      const { result } = renderHook(() => useTargetListStore());

      act(() => {
        result.current.setFilterTags(['galaxy', 'nebula']);
      });

      expect(result.current.filterTags).toEqual(['galaxy', 'nebula']);
    });

    it('should toggle showArchived', () => {
      const { result } = renderHook(() => useTargetListStore());

      act(() => {
        result.current.setShowArchived(true);
      });

      expect(result.current.showArchived).toBe(true);
    });

    it('should set groupBy option', () => {
      const { result } = renderHook(() => useTargetListStore());

      act(() => {
        result.current.setGroupBy('priority');
      });

      expect(result.current.groupBy).toBe('priority');
    });
  });

  describe('getters', () => {
    it('should get non-archived targets', () => {
      const { result } = renderHook(() => useTargetListStore());

      act(() => {
        result.current.addTarget({ ...mockTarget, name: 'Active Target' });
        result.current.addTarget({ ...mockTarget, name: 'Archived Target' });
      });

      const archivedId = result.current.targets[1].id;

      act(() => {
        result.current.toggleArchive(archivedId);
      });

      const activeTargets = result.current.targets.filter(t => !t.isArchived);
      expect(activeTargets).toHaveLength(1);
      expect(activeTargets[0].name).toBe('Active Target');
    });

    it('should get favorite targets', () => {
      const { result } = renderHook(() => useTargetListStore());

      act(() => {
        result.current.addTarget({ ...mockTarget, name: 'Regular Target' });
        result.current.addTarget({ ...mockTarget, name: 'Favorite Target' });
      });

      const favoriteId = result.current.targets[1].id;

      act(() => {
        result.current.toggleFavorite(favoriteId);
      });

      const favorites = result.current.targets.filter(t => t.isFavorite);
      expect(favorites).toHaveLength(1);
      expect(favorites[0].name).toBe('Favorite Target');
    });
  });

  describe('search and filter state', () => {
    it('should have default search/filter/sort state', () => {
      const { result } = renderHook(() => useTargetListStore());
      expect(result.current.searchQuery).toBe('');
      expect(result.current.filterStatus).toBe('all');
      expect(result.current.filterPriority).toBe('all');
      expect(result.current.sortBy).toBe('manual');
      expect(result.current.sortOrder).toBe('asc');
    });

    it('should set search query', () => {
      const { result } = renderHook(() => useTargetListStore());
      act(() => { result.current.setSearchQuery('andromeda'); });
      expect(result.current.searchQuery).toBe('andromeda');
    });

    it('should set filter status', () => {
      const { result } = renderHook(() => useTargetListStore());
      act(() => { result.current.setFilterStatus('completed'); });
      expect(result.current.filterStatus).toBe('completed');
    });

    it('should set filter priority', () => {
      const { result } = renderHook(() => useTargetListStore());
      act(() => { result.current.setFilterPriority('high'); });
      expect(result.current.filterPriority).toBe('high');
    });

    it('should set sort by', () => {
      const { result } = renderHook(() => useTargetListStore());
      act(() => { result.current.setSortBy('name'); });
      expect(result.current.sortBy).toBe('name');
    });

    it('should set sort order', () => {
      const { result } = renderHook(() => useTargetListStore());
      act(() => { result.current.setSortOrder('desc'); });
      expect(result.current.sortOrder).toBe('desc');
    });
  });

  describe('getFilteredTargets', () => {
    it('should filter by search query (name)', () => {
      const { result } = renderHook(() => useTargetListStore());

      act(() => {
        result.current.addTarget({ ...mockTarget, name: 'M31 - Andromeda Galaxy' });
        result.current.addTarget({ ...mockTarget, name: 'M42 - Orion Nebula' });
        result.current.addTarget({ ...mockTarget, name: 'M45 - Pleiades' });
      });

      act(() => { result.current.setSearchQuery('orion'); });

      const filtered = result.current.getFilteredTargets();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('M42 - Orion Nebula');
    });

    it('should filter by search query (tags)', () => {
      const { result } = renderHook(() => useTargetListStore());

      act(() => {
        result.current.addTarget({ ...mockTarget, name: 'Target A', tags: ['galaxy'] });
        result.current.addTarget({ ...mockTarget, name: 'Target B', tags: ['nebula'] });
      });

      act(() => { result.current.setSearchQuery('galaxy'); });

      const filtered = result.current.getFilteredTargets();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Target A');
    });

    it('should filter by search query (notes)', () => {
      const { result } = renderHook(() => useTargetListStore());

      act(() => {
        result.current.addTarget({ ...mockTarget, name: 'Target A' });
        result.current.addTarget({ ...mockTarget, name: 'Target B' });
      });

      const idB = result.current.targets[1].id;
      act(() => { result.current.updateTarget(idB, { notes: 'best in winter' }); });
      act(() => { result.current.setSearchQuery('winter'); });

      const filtered = result.current.getFilteredTargets();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Target B');
    });

    it('should filter by status', () => {
      const { result } = renderHook(() => useTargetListStore());

      act(() => {
        result.current.addTarget({ ...mockTarget, name: 'Planned' });
        result.current.addTarget({ ...mockTarget, name: 'Done' });
      });

      const doneId = result.current.targets[1].id;
      act(() => { result.current.updateTarget(doneId, { status: 'completed' }); });
      act(() => { result.current.setFilterStatus('completed'); });

      const filtered = result.current.getFilteredTargets();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Done');
    });

    it('should filter by priority', () => {
      const { result } = renderHook(() => useTargetListStore());

      act(() => {
        result.current.addTarget({ ...mockTarget, name: 'High', priority: 'high' });
        result.current.addTarget({ ...mockTarget, name: 'Low', priority: 'low' });
      });

      act(() => { result.current.setFilterPriority('low'); });

      const filtered = result.current.getFilteredTargets();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Low');
    });

    it('should combine search and filter', () => {
      const { result } = renderHook(() => useTargetListStore());

      act(() => {
        result.current.addTarget({ ...mockTarget, name: 'M31', priority: 'high' });
        result.current.addTarget({ ...mockTarget, name: 'M42', priority: 'high' });
        result.current.addTarget({ ...mockTarget, name: 'M45', priority: 'low' });
      });

      act(() => {
        result.current.setSearchQuery('M4');
        result.current.setFilterPriority('high');
      });

      const filtered = result.current.getFilteredTargets();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('M42');
    });

    it('should exclude archived targets by default', () => {
      const { result } = renderHook(() => useTargetListStore());

      act(() => {
        result.current.addTarget({ ...mockTarget, name: 'Active' });
        result.current.addTarget({ ...mockTarget, name: 'Archived' });
      });

      const archivedId = result.current.targets[1].id;
      act(() => { result.current.toggleArchive(archivedId); });

      const filtered = result.current.getFilteredTargets();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Active');
    });

    it('should include archived targets when showArchived is true', () => {
      const { result } = renderHook(() => useTargetListStore());

      act(() => {
        result.current.addTarget({ ...mockTarget, name: 'Active' });
        result.current.addTarget({ ...mockTarget, name: 'Archived' });
      });

      const archivedId = result.current.targets[1].id;
      act(() => {
        result.current.toggleArchive(archivedId);
        result.current.setShowArchived(true);
      });

      const filtered = result.current.getFilteredTargets();
      expect(filtered).toHaveLength(2);
    });
  });

  describe('sorting via getFilteredTargets', () => {
    it('should sort by name ascending', () => {
      const { result } = renderHook(() => useTargetListStore());

      act(() => {
        result.current.addTarget({ ...mockTarget, name: 'Zeta' });
        result.current.addTarget({ ...mockTarget, name: 'Alpha' });
        result.current.addTarget({ ...mockTarget, name: 'Mu' });
      });

      act(() => {
        result.current.setSortBy('name');
        result.current.setSortOrder('asc');
      });

      const filtered = result.current.getFilteredTargets();
      expect(filtered.map(t => t.name)).toEqual(['Alpha', 'Mu', 'Zeta']);
    });

    it('should sort by name descending', () => {
      const { result } = renderHook(() => useTargetListStore());

      act(() => {
        result.current.addTarget({ ...mockTarget, name: 'Zeta' });
        result.current.addTarget({ ...mockTarget, name: 'Alpha' });
      });

      act(() => {
        result.current.setSortBy('name');
        result.current.setSortOrder('desc');
      });

      const filtered = result.current.getFilteredTargets();
      expect(filtered.map(t => t.name)).toEqual(['Zeta', 'Alpha']);
    });

    it('should sort by priority', () => {
      const { result } = renderHook(() => useTargetListStore());

      act(() => {
        result.current.addTarget({ ...mockTarget, name: 'Low', priority: 'low' });
        result.current.addTarget({ ...mockTarget, name: 'High', priority: 'high' });
        result.current.addTarget({ ...mockTarget, name: 'Med', priority: 'medium' });
      });

      act(() => {
        result.current.setSortBy('priority');
        result.current.setSortOrder('asc');
      });

      const filtered = result.current.getFilteredTargets();
      expect(filtered.map(t => t.name)).toEqual(['High', 'Med', 'Low']);
    });

    it('should sort by status', () => {
      const { result } = renderHook(() => useTargetListStore());

      act(() => {
        result.current.addTarget({ ...mockTarget, name: 'Done' });
        result.current.addTarget({ ...mockTarget, name: 'Planned' });
        result.current.addTarget({ ...mockTarget, name: 'InProg' });
      });

      const doneId = result.current.targets[0].id;
      const inProgId = result.current.targets[2].id;
      act(() => {
        result.current.updateTarget(doneId, { status: 'completed' });
        result.current.updateTarget(inProgId, { status: 'in_progress' });
      });

      act(() => {
        result.current.setSortBy('status');
        result.current.setSortOrder('asc');
      });

      const filtered = result.current.getFilteredTargets();
      expect(filtered.map(t => t.name)).toEqual(['Planned', 'InProg', 'Done']);
    });

    it('should not sort when sortBy is manual', () => {
      const { result } = renderHook(() => useTargetListStore());

      act(() => {
        result.current.addTarget({ ...mockTarget, name: 'B' });
        result.current.addTarget({ ...mockTarget, name: 'A' });
        result.current.addTarget({ ...mockTarget, name: 'C' });
      });

      act(() => { result.current.setSortBy('manual'); });

      const filtered = result.current.getFilteredTargets();
      expect(filtered.map(t => t.name)).toEqual(['B', 'A', 'C']);
    });

    it('should sort feasibility ascending and descending consistently', () => {
      const { result } = renderHook(() => useTargetListStore());

      act(() => {
        result.current.addTarget({ ...mockTarget, name: 'Short Window' });
        result.current.addTarget({ ...mockTarget, name: 'Long Window' });
      });

      const shortId = result.current.targets.find((t) => t.name === 'Short Window')!.id;
      const longId = result.current.targets.find((t) => t.name === 'Long Window')!.id;

      act(() => {
        result.current.updateObservableWindow(shortId, {
          start: new Date('2026-01-01T20:00:00Z'),
          end: new Date('2026-01-01T21:00:00Z'),
          maxAltitude: 35,
          transitTime: new Date('2026-01-01T20:30:00Z'),
          isCircumpolar: false,
        });
        result.current.updateObservableWindow(longId, {
          start: new Date('2026-01-01T20:00:00Z'),
          end: new Date('2026-01-02T02:00:00Z'),
          maxAltitude: 75,
          transitTime: new Date('2026-01-01T23:00:00Z'),
          isCircumpolar: true,
        });
        result.current.setSortBy('feasibility');
        result.current.setSortOrder('asc');
      });

      let filtered = result.current.getFilteredTargets();
      expect(filtered[0].name).toBe('Short Window');
      expect(filtered[1].name).toBe('Long Window');

      act(() => {
        result.current.setSortOrder('desc');
      });

      filtered = result.current.getFilteredTargets();
      expect(filtered[0].name).toBe('Long Window');
      expect(filtered[1].name).toBe('Short Window');
    });
  });

  describe('checkDuplicate', () => {
    it('should find duplicate by exact name match (case-insensitive)', () => {
      const { result } = renderHook(() => useTargetListStore());

      act(() => {
        result.current.addTarget({ ...mockTarget, name: 'M31' });
      });

      const dup = result.current.checkDuplicate('m31', 0, 0);
      expect(dup).toBeDefined();
      expect(dup!.name).toBe('M31');
    });

    it('should find duplicate by close coordinates', () => {
      const { result } = renderHook(() => useTargetListStore());

      act(() => {
        result.current.addTarget({ ...mockTarget, name: 'M31', ra: 10.684, dec: 41.269 });
      });

      const dup = result.current.checkDuplicate('Different Name', 10.685, 41.268);
      expect(dup).toBeDefined();
    });

    it('should return undefined when no duplicate', () => {
      const { result } = renderHook(() => useTargetListStore());

      act(() => {
        result.current.addTarget({ ...mockTarget, name: 'M31', ra: 10.684, dec: 41.269 });
      });

      const dup = result.current.checkDuplicate('M42', 83.822, -5.391);
      expect(dup).toBeUndefined();
    });
  });
});
