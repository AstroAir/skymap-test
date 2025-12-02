import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
}

interface TargetListState {
  targets: TargetItem[];
  activeTargetId: string | null;
  
  // Actions
  addTarget: (target: Omit<TargetItem, 'id' | 'addedAt' | 'status'>) => void;
  removeTarget: (id: string) => void;
  updateTarget: (id: string, updates: Partial<TargetItem>) => void;
  setActiveTarget: (id: string | null) => void;
  reorderTargets: (fromIndex: number, toIndex: number) => void;
  clearCompleted: () => void;
  clearAll: () => void;
}

export const useTargetListStore = create<TargetListState>()(
  persist(
    (set) => ({
      targets: [],
      activeTargetId: null,
      
      addTarget: (target) => {
        const newTarget: TargetItem = {
          ...target,
          id: `target-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          addedAt: Date.now(),
          status: 'planned',
        };
        set((state) => ({
          targets: [...state.targets, newTarget],
        }));
      },
      
      removeTarget: (id) => set((state) => ({
        targets: state.targets.filter((t) => t.id !== id),
        activeTargetId: state.activeTargetId === id ? null : state.activeTargetId,
      })),
      
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
      
      clearCompleted: () => set((state) => ({
        targets: state.targets.filter((t) => t.status !== 'completed'),
      })),
      
      clearAll: () => set({ targets: [], activeTargetId: null }),
    }),
    {
      name: 'starmap-target-list',
    }
  )
);
