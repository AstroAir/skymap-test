import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Observable window for a target
 */
export interface ObservableWindow {
  start: Date;
  end: Date;
  maxAltitude: number;
  transitTime: Date;
  isCircumpolar: boolean;
}

/**
 * Target item for shot planning
 */
export interface TargetItem {
  id: string;
  name: string;
  ra: number; // degrees
  dec: number; // degrees
  raString: string;
  decString: string;
  // Camera/FOV settings at time of adding
  sensorWidth?: number;
  sensorHeight?: number;
  focalLength?: number;
  rotationAngle?: number;
  // Mosaic settings
  mosaic?: {
    enabled: boolean;
    rows: number;
    cols: number;
    overlap: number;
  };
  // Exposure plan
  exposurePlan?: {
    singleExposure: number; // seconds
    totalExposure: number; // minutes
    subFrames: number;
    filter?: string;
  };
  // Notes
  notes?: string;
  // Timestamps
  addedAt: number;
  priority: 'low' | 'medium' | 'high';
  status: 'planned' | 'in_progress' | 'completed';
  // Tags for grouping
  tags: string[];
  // Cached observable window
  observableWindow?: ObservableWindow;
  // Favorite/archived flags
  isFavorite: boolean;
  isArchived: boolean;
}

/** Input type for adding a target (without auto-generated fields) */
export type TargetInput = Omit<TargetItem, 'id' | 'addedAt' | 'status' | 'tags' | 'isFavorite' | 'isArchived'> & {
  tags?: string[];
};

/** Batch input for adding multiple targets */
export interface BatchTargetInput {
  name: string;
  ra: number;
  dec: number;
  raString: string;
  decString: string;
}

interface TargetListState {
  targets: TargetItem[];
  activeTargetId: string | null;
  selectedIds: Set<string>;
  availableTags: string[];
  filterTags: string[];
  showArchived: boolean;
  groupBy: 'none' | 'priority' | 'status' | 'tag';
  
  // Single target actions
  addTarget: (target: TargetInput) => void;
  removeTarget: (id: string) => void;
  updateTarget: (id: string, updates: Partial<TargetItem>) => void;
  setActiveTarget: (id: string | null) => void;
  reorderTargets: (fromIndex: number, toIndex: number) => void;
  
  // Batch actions
  addTargetsBatch: (targets: BatchTargetInput[], defaultSettings?: Partial<TargetInput>) => void;
  removeTargetsBatch: (ids: string[]) => void;
  updateTargetsBatch: (ids: string[], updates: Partial<TargetItem>) => void;
  setStatusBatch: (ids: string[], status: TargetItem['status']) => void;
  setPriorityBatch: (ids: string[], priority: TargetItem['priority']) => void;
  addTagBatch: (ids: string[], tag: string) => void;
  removeTagBatch: (ids: string[], tag: string) => void;
  
  // Selection management
  toggleSelection: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  selectByStatus: (status: TargetItem['status']) => void;
  selectByPriority: (priority: TargetItem['priority']) => void;
  
  // Tag management
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  setFilterTags: (tags: string[]) => void;
  
  // View options
  setGroupBy: (groupBy: TargetListState['groupBy']) => void;
  setShowArchived: (show: boolean) => void;
  
  // Favorite/Archive
  toggleFavorite: (id: string) => void;
  toggleArchive: (id: string) => void;
  archiveCompleted: () => void;
  
  // Clear actions
  clearCompleted: () => void;
  clearAll: () => void;
  
  // Observable window cache
  updateObservableWindow: (id: string, window: ObservableWindow) => void;
  
  // Computed getters
  getFilteredTargets: () => TargetItem[];
  getGroupedTargets: () => Map<string, TargetItem[]>;
  getSelectedTargets: () => TargetItem[];
}

// Helper to generate unique ID
const generateId = () => `target-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const useTargetListStore = create<TargetListState>()(
  persist(
    (set, get) => ({
      targets: [],
      activeTargetId: null,
      selectedIds: new Set<string>(),
      availableTags: ['galaxy', 'nebula', 'cluster', 'planetary', 'tonight', 'priority'],
      filterTags: [],
      showArchived: false,
      groupBy: 'none',
      
      // ========== Single target actions ==========
      addTarget: (target) => {
        const newTarget: TargetItem = {
          ...target,
          id: generateId(),
          addedAt: Date.now(),
          status: 'planned',
          tags: target.tags || [],
          isFavorite: false,
          isArchived: false,
        };
        set((state) => ({
          targets: [...state.targets, newTarget],
        }));
      },
      
      removeTarget: (id) => set((state) => {
        const newSelected = new Set(state.selectedIds);
        newSelected.delete(id);
        return {
          targets: state.targets.filter((t) => t.id !== id),
          activeTargetId: state.activeTargetId === id ? null : state.activeTargetId,
          selectedIds: newSelected,
        };
      }),
      
      updateTarget: (id, updates) => set((state) => ({
        targets: state.targets.map((t) =>
          t.id === id ? { ...t, ...updates } : t
        ),
      })),
      
      setActiveTarget: (id) => set({ activeTargetId: id }),
      
      reorderTargets: (fromIndex, toIndex) => set((state) => {
        const newTargets = [...state.targets];
        const [removed] = newTargets.splice(fromIndex, 1);
        newTargets.splice(toIndex, 0, removed);
        return { targets: newTargets };
      }),
      
      // ========== Batch actions ==========
      addTargetsBatch: (targets, defaultSettings = {}) => {
        const newTargets: TargetItem[] = targets.map((t) => ({
          ...defaultSettings,
          ...t,
          id: generateId(),
          addedAt: Date.now(),
          status: 'planned' as const,
          priority: defaultSettings.priority || 'medium',
          tags: defaultSettings.tags || [],
          isFavorite: false,
          isArchived: false,
        }));
        set((state) => ({
          targets: [...state.targets, ...newTargets],
        }));
      },
      
      removeTargetsBatch: (ids) => set((state) => {
        const idsSet = new Set(ids);
        const newSelected = new Set(state.selectedIds);
        ids.forEach(id => newSelected.delete(id));
        return {
          targets: state.targets.filter((t) => !idsSet.has(t.id)),
          activeTargetId: idsSet.has(state.activeTargetId || '') ? null : state.activeTargetId,
          selectedIds: newSelected,
        };
      }),
      
      updateTargetsBatch: (ids, updates) => set((state) => {
        const idsSet = new Set(ids);
        return {
          targets: state.targets.map((t) =>
            idsSet.has(t.id) ? { ...t, ...updates } : t
          ),
        };
      }),
      
      setStatusBatch: (ids, status) => {
        get().updateTargetsBatch(ids, { status });
      },
      
      setPriorityBatch: (ids, priority) => {
        get().updateTargetsBatch(ids, { priority });
      },
      
      addTagBatch: (ids, tag) => set((state) => {
        const idsSet = new Set(ids);
        return {
          targets: state.targets.map((t) =>
            idsSet.has(t.id) && !t.tags.includes(tag)
              ? { ...t, tags: [...t.tags, tag] }
              : t
          ),
          availableTags: state.availableTags.includes(tag)
            ? state.availableTags
            : [...state.availableTags, tag],
        };
      }),
      
      removeTagBatch: (ids, tag) => set((state) => {
        const idsSet = new Set(ids);
        return {
          targets: state.targets.map((t) =>
            idsSet.has(t.id)
              ? { ...t, tags: t.tags.filter((tg) => tg !== tag) }
              : t
          ),
        };
      }),
      
      // ========== Selection management ==========
      toggleSelection: (id) => set((state) => {
        const newSelected = new Set(state.selectedIds);
        if (newSelected.has(id)) {
          newSelected.delete(id);
        } else {
          newSelected.add(id);
        }
        return { selectedIds: newSelected };
      }),
      
      selectAll: () => set((state) => ({
        selectedIds: new Set(state.targets.filter(t => !t.isArchived || state.showArchived).map(t => t.id)),
      })),
      
      clearSelection: () => set({ selectedIds: new Set() }),
      
      selectByStatus: (status) => set((state) => ({
        selectedIds: new Set(state.targets.filter(t => t.status === status).map(t => t.id)),
      })),
      
      selectByPriority: (priority) => set((state) => ({
        selectedIds: new Set(state.targets.filter(t => t.priority === priority).map(t => t.id)),
      })),
      
      // ========== Tag management ==========
      addTag: (tag) => set((state) => ({
        availableTags: state.availableTags.includes(tag)
          ? state.availableTags
          : [...state.availableTags, tag],
      })),
      
      removeTag: (tag) => set((state) => ({
        availableTags: state.availableTags.filter((t) => t !== tag),
        filterTags: state.filterTags.filter((t) => t !== tag),
        targets: state.targets.map((t) => ({
          ...t,
          tags: t.tags.filter((tg) => tg !== tag),
        })),
      })),
      
      setFilterTags: (tags) => set({ filterTags: tags }),
      
      // ========== View options ==========
      setGroupBy: (groupBy) => set({ groupBy }),
      setShowArchived: (show) => set({ showArchived: show }),
      
      // ========== Favorite/Archive ==========
      toggleFavorite: (id) => set((state) => ({
        targets: state.targets.map((t) =>
          t.id === id ? { ...t, isFavorite: !t.isFavorite } : t
        ),
      })),
      
      toggleArchive: (id) => set((state) => ({
        targets: state.targets.map((t) =>
          t.id === id ? { ...t, isArchived: !t.isArchived } : t
        ),
      })),
      
      archiveCompleted: () => set((state) => ({
        targets: state.targets.map((t) =>
          t.status === 'completed' ? { ...t, isArchived: true } : t
        ),
      })),
      
      // ========== Clear actions ==========
      clearCompleted: () => set((state) => ({
        targets: state.targets.filter((t) => t.status !== 'completed'),
        selectedIds: new Set([...state.selectedIds].filter(id => 
          state.targets.find(t => t.id === id)?.status !== 'completed'
        )),
      })),
      
      clearAll: () => set({ targets: [], activeTargetId: null, selectedIds: new Set() }),
      
      // ========== Observable window cache ==========
      updateObservableWindow: (id, window) => set((state) => ({
        targets: state.targets.map((t) =>
          t.id === id ? { ...t, observableWindow: window } : t
        ),
      })),
      
      // ========== Computed getters ==========
      getFilteredTargets: () => {
        const state = get();
        let filtered = state.targets;
        
        // Filter by archived status
        if (!state.showArchived) {
          filtered = filtered.filter((t) => !t.isArchived);
        }
        
        // Filter by tags
        if (state.filterTags.length > 0) {
          filtered = filtered.filter((t) =>
            state.filterTags.some((tag) => t.tags.includes(tag))
          );
        }
        
        return filtered;
      },
      
      getGroupedTargets: () => {
        const state = get();
        const filtered = state.getFilteredTargets();
        const groups = new Map<string, TargetItem[]>();
        
        if (state.groupBy === 'none') {
          groups.set('all', filtered);
          return groups;
        }
        
        for (const target of filtered) {
          let key: string;
          switch (state.groupBy) {
            case 'priority':
              key = target.priority;
              break;
            case 'status':
              key = target.status;
              break;
            case 'tag':
              // For tag grouping, a target can appear in multiple groups
              if (target.tags.length === 0) {
                key = 'untagged';
                if (!groups.has(key)) groups.set(key, []);
                groups.get(key)!.push(target);
              } else {
                for (const tag of target.tags) {
                  if (!groups.has(tag)) groups.set(tag, []);
                  groups.get(tag)!.push(target);
                }
              }
              continue;
            default:
              key = 'all';
          }
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key)!.push(target);
        }
        
        return groups;
      },
      
      getSelectedTargets: () => {
        const state = get();
        return state.targets.filter((t) => state.selectedIds.has(t.id));
      },
    }),
    {
      name: 'starmap-target-list',
      partialize: (state) => ({
        targets: state.targets,
        activeTargetId: state.activeTargetId,
        availableTags: state.availableTags,
        groupBy: state.groupBy,
        showArchived: state.showArchived,
      }),
    }
  )
);
