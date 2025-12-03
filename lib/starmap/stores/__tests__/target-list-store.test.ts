/**
 * @jest-environment jsdom
 */
import { useTargetListStore, type TargetInput } from '../target-list-store';

// Mock zustand persist
jest.mock('zustand/middleware', () => ({
  persist: (config: unknown) => config,
}));

const createMockTarget = (overrides?: Partial<TargetInput>): TargetInput => ({
  name: 'M31',
  ra: 10.68,
  dec: 41.27,
  raString: '00:42:44',
  decString: '+41:16:09',
  priority: 'medium',
  ...overrides,
});

describe('useTargetListStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useTargetListStore.setState({
      targets: [],
      activeTargetId: null,
      selectedIds: new Set(),
      availableTags: [],
      filterTags: [],
      showArchived: false,
      groupBy: 'none',
    });
  });

  describe('initial state', () => {
    it('has empty targets array', () => {
      expect(useTargetListStore.getState().targets).toEqual([]);
    });

    it('has no active target', () => {
      expect(useTargetListStore.getState().activeTargetId).toBeNull();
    });

    it('has empty selected IDs', () => {
      expect(useTargetListStore.getState().selectedIds.size).toBe(0);
    });

    it('has empty available tags', () => {
      expect(useTargetListStore.getState().availableTags).toEqual([]);
    });

    it('does not show archived by default', () => {
      expect(useTargetListStore.getState().showArchived).toBe(false);
    });

    it('has no grouping by default', () => {
      expect(useTargetListStore.getState().groupBy).toBe('none');
    });
  });

  describe('addTarget', () => {
    it('adds a target', () => {
      const target = createMockTarget();
      useTargetListStore.getState().addTarget(target);

      expect(useTargetListStore.getState().targets.length).toBe(1);
      expect(useTargetListStore.getState().targets[0].name).toBe('M31');
    });

    it('auto-generates ID and timestamps', () => {
      const target = createMockTarget();
      useTargetListStore.getState().addTarget(target);

      const addedTarget = useTargetListStore.getState().targets[0];
      expect(addedTarget.id).toBeDefined();
      expect(addedTarget.addedAt).toBeDefined();
    });

    it('sets default status to planned', () => {
      const target = createMockTarget();
      useTargetListStore.getState().addTarget(target);

      expect(useTargetListStore.getState().targets[0].status).toBe('planned');
    });

    it('sets default flags', () => {
      const target = createMockTarget();
      useTargetListStore.getState().addTarget(target);

      const addedTarget = useTargetListStore.getState().targets[0];
      expect(addedTarget.isFavorite).toBe(false);
      expect(addedTarget.isArchived).toBe(false);
    });
  });

  describe('removeTarget', () => {
    it('removes target by ID', () => {
      const target = createMockTarget();
      useTargetListStore.getState().addTarget(target);
      const id = useTargetListStore.getState().targets[0].id;

      expect(useTargetListStore.getState().targets.length).toBe(1);

      useTargetListStore.getState().removeTarget(id);
      expect(useTargetListStore.getState().targets.length).toBe(0);
    });

    it('clears active target if removed', () => {
      const target = createMockTarget();
      useTargetListStore.getState().addTarget(target);
      const id = useTargetListStore.getState().targets[0].id;
      useTargetListStore.getState().setActiveTarget(id);

      useTargetListStore.getState().removeTarget(id);
      expect(useTargetListStore.getState().activeTargetId).toBeNull();
    });
  });

  describe('updateTarget', () => {
    it('updates target properties', () => {
      const target = createMockTarget();
      useTargetListStore.getState().addTarget(target);
      const id = useTargetListStore.getState().targets[0].id;

      useTargetListStore.getState().updateTarget(id, { name: 'Andromeda Galaxy' });

      expect(useTargetListStore.getState().targets[0].name).toBe('Andromeda Galaxy');
    });

    it('updates priority', () => {
      const target = createMockTarget();
      useTargetListStore.getState().addTarget(target);
      const id = useTargetListStore.getState().targets[0].id;

      useTargetListStore.getState().updateTarget(id, { priority: 'high' });

      expect(useTargetListStore.getState().targets[0].priority).toBe('high');
    });
  });

  describe('setActiveTarget', () => {
    it('sets active target', () => {
      const target = createMockTarget();
      useTargetListStore.getState().addTarget(target);
      const id = useTargetListStore.getState().targets[0].id;

      useTargetListStore.getState().setActiveTarget(id);
      expect(useTargetListStore.getState().activeTargetId).toBe(id);
    });

    it('clears active target', () => {
      useTargetListStore.getState().setActiveTarget('some-id');
      useTargetListStore.getState().setActiveTarget(null);

      expect(useTargetListStore.getState().activeTargetId).toBeNull();
    });
  });

  describe('toggleFavorite', () => {
    it('toggles favorite status', () => {
      const target = createMockTarget();
      useTargetListStore.getState().addTarget(target);
      const id = useTargetListStore.getState().targets[0].id;

      expect(useTargetListStore.getState().targets[0].isFavorite).toBe(false);

      useTargetListStore.getState().toggleFavorite(id);
      expect(useTargetListStore.getState().targets[0].isFavorite).toBe(true);

      useTargetListStore.getState().toggleFavorite(id);
      expect(useTargetListStore.getState().targets[0].isFavorite).toBe(false);
    });
  });

  describe('toggleArchive', () => {
    it('toggles archived status', () => {
      const target = createMockTarget();
      useTargetListStore.getState().addTarget(target);
      const id = useTargetListStore.getState().targets[0].id;

      expect(useTargetListStore.getState().targets[0].isArchived).toBe(false);

      useTargetListStore.getState().toggleArchive(id);
      expect(useTargetListStore.getState().targets[0].isArchived).toBe(true);

      useTargetListStore.getState().toggleArchive(id);
      expect(useTargetListStore.getState().targets[0].isArchived).toBe(false);
    });
  });

  describe('clearAll', () => {
    it('removes all targets', () => {
      useTargetListStore.getState().addTarget(createMockTarget({ name: 'M31' }));
      useTargetListStore.getState().addTarget(createMockTarget({ name: 'M42' }));

      expect(useTargetListStore.getState().targets.length).toBe(2);

      useTargetListStore.getState().clearAll();
      expect(useTargetListStore.getState().targets.length).toBe(0);
    });
  });

  describe('setGroupBy', () => {
    it('sets grouping mode', () => {
      useTargetListStore.getState().setGroupBy('priority');
      expect(useTargetListStore.getState().groupBy).toBe('priority');

      useTargetListStore.getState().setGroupBy('status');
      expect(useTargetListStore.getState().groupBy).toBe('status');
    });
  });

  describe('setShowArchived', () => {
    it('toggles show archived', () => {
      useTargetListStore.getState().setShowArchived(true);
      expect(useTargetListStore.getState().showArchived).toBe(true);

      useTargetListStore.getState().setShowArchived(false);
      expect(useTargetListStore.getState().showArchived).toBe(false);
    });
  });

  describe('getFilteredTargets', () => {
    it('returns all non-archived targets by default', () => {
      useTargetListStore.getState().addTarget(createMockTarget({ name: 'M31' }));
      useTargetListStore.getState().addTarget(createMockTarget({ name: 'M42' }));
      const id2 = useTargetListStore.getState().targets[1].id;
      useTargetListStore.getState().toggleArchive(id2);

      const filtered = useTargetListStore.getState().getFilteredTargets();
      expect(filtered.length).toBe(1);
      expect(filtered[0].name).toBe('M31');
    });

    it('includes archived when showArchived is true', () => {
      useTargetListStore.getState().addTarget(createMockTarget({ name: 'M31' }));
      useTargetListStore.getState().addTarget(createMockTarget({ name: 'M42' }));
      const id2 = useTargetListStore.getState().targets[1].id;
      useTargetListStore.getState().toggleArchive(id2);
      useTargetListStore.getState().setShowArchived(true);

      const filtered = useTargetListStore.getState().getFilteredTargets();
      expect(filtered.length).toBe(2);
    });
  });
});
