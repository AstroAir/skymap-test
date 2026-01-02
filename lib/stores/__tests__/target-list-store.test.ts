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
});
