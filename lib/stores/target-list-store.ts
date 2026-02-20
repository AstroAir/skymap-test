import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getZustandStorage } from '@/lib/storage';
import { isTauri } from '@/lib/storage/platform';
import { targetListApi, type ExposurePlan as TauriExposurePlan } from '@/lib/tauri/target-list-api';
import { createLogger } from '@/lib/logger';
import type { RecommendationProfile } from '@/lib/core/types';

const logger = createLogger('target-list-store');

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

export interface ExposurePlanAdvanced {
  sqm?: number;
  filterBandwidthNm?: number;
  readNoiseLimitPercent?: number;
  gainStrategy?: 'unity' | 'max_dynamic_range' | 'manual';
  recommendedGain?: number;
  recommendedExposureSec?: number;
  skyFluxPerPixel?: number;
  targetSignalPerPixelPerSec?: number;
  dynamicRangeScore?: number;
  dynamicRangeStops?: number;
  readNoiseUsed?: number;
  darkCurrentUsed?: number;
  noiseFractions?: {
    read?: number;
    sky?: number;
    dark?: number;
  };
  stackEstimate?: {
    recommendedFrameCount?: number;
    estimatedTotalMinutes?: number;
    framesForTargetSNR?: number;
    framesForTimeNoise?: number;
    targetSNR?: number;
    targetTimeNoiseRatio?: number;
  };
}

export interface TargetExposurePlan {
  singleExposure: number;
  totalExposure: number;
  subFrames: number;
  filter?: string;
  advanced?: ExposurePlanAdvanced;
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
  exposurePlan?: TargetExposurePlan;
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
  searchQuery: string;
  filterStatus: 'all' | TargetItem['status'];
  filterPriority: 'all' | TargetItem['priority'];
  sortBy: 'manual' | 'name' | 'priority' | 'status' | 'addedAt' | 'feasibility';
  sortOrder: 'asc' | 'desc';
  scoreProfile: RecommendationProfile;
  scoreVersion: 'v1' | 'v2';
  scoreBreakdownVisibility: 'collapsed' | 'expanded';
  
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
  setSearchQuery: (query: string) => void;
  setFilterStatus: (status: TargetListState['filterStatus']) => void;
  setFilterPriority: (priority: TargetListState['filterPriority']) => void;
  setSortBy: (sortBy: TargetListState['sortBy']) => void;
  setSortOrder: (order: TargetListState['sortOrder']) => void;
  setScoreProfile: (profile: RecommendationProfile) => void;
  setScoreVersion: (version: TargetListState['scoreVersion']) => void;
  setScoreBreakdownVisibility: (visibility: TargetListState['scoreBreakdownVisibility']) => void;
  
  // Favorite/Archive
  toggleFavorite: (id: string) => void;
  toggleArchive: (id: string) => void;
  archiveCompleted: () => void;
  
  // Clear actions
  clearCompleted: () => void;
  clearAll: () => void;
  
  // Observable window cache
  updateObservableWindow: (id: string, window: ObservableWindow) => void;
  
  // Tauri sync
  syncWithTauri: () => Promise<void>;
  _tauriInitialized: boolean;
  
  // Computed getters
  getFilteredTargets: () => TargetItem[];
  getGroupedTargets: () => Map<string, TargetItem[]>;
  getSelectedTargets: () => TargetItem[];
  checkDuplicate: (name: string, ra: number, dec: number) => TargetItem | undefined;
}

// Helper to generate unique ID
const generateId = () => `target-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

// Helper to check for duplicate targets (same name or coordinates within 0.01°)
const findDuplicate = (targets: TargetItem[], name: string, ra: number, dec: number): TargetItem | undefined => {
  return targets.find(t => 
    t.name.toLowerCase() === name.toLowerCase() ||
    (Math.abs(t.ra - ra) < 0.01 && Math.abs(t.dec - dec) < 0.01)
  );
};

function toTauriExposurePlan(exposurePlan?: TargetExposurePlan): TauriExposurePlan | undefined {
  if (!exposurePlan) return undefined;

  return {
    single_exposure: exposurePlan.singleExposure,
    total_exposure: exposurePlan.totalExposure,
    sub_frames: exposurePlan.subFrames,
    filter: exposurePlan.filter,
    advanced: exposurePlan.advanced
      ? {
          sqm: exposurePlan.advanced.sqm,
          filter_bandwidth_nm: exposurePlan.advanced.filterBandwidthNm,
          read_noise_limit_percent: exposurePlan.advanced.readNoiseLimitPercent,
          gain_strategy: exposurePlan.advanced.gainStrategy,
          recommended_gain: exposurePlan.advanced.recommendedGain,
          recommended_exposure_sec: exposurePlan.advanced.recommendedExposureSec,
          sky_flux_per_pixel: exposurePlan.advanced.skyFluxPerPixel,
          target_signal_per_pixel_per_sec: exposurePlan.advanced.targetSignalPerPixelPerSec,
          dynamic_range_score: exposurePlan.advanced.dynamicRangeScore,
          dynamic_range_stops: exposurePlan.advanced.dynamicRangeStops,
          read_noise_used: exposurePlan.advanced.readNoiseUsed,
          dark_current_used: exposurePlan.advanced.darkCurrentUsed,
          noise_fractions: exposurePlan.advanced.noiseFractions
            ? {
                read: exposurePlan.advanced.noiseFractions.read,
                sky: exposurePlan.advanced.noiseFractions.sky,
                dark: exposurePlan.advanced.noiseFractions.dark,
              }
            : undefined,
          stack_estimate: exposurePlan.advanced.stackEstimate
            ? {
                recommended_frame_count: exposurePlan.advanced.stackEstimate.recommendedFrameCount,
                estimated_total_minutes: exposurePlan.advanced.stackEstimate.estimatedTotalMinutes,
                frames_for_target_snr: exposurePlan.advanced.stackEstimate.framesForTargetSNR,
                frames_for_time_noise: exposurePlan.advanced.stackEstimate.framesForTimeNoise,
                target_snr: exposurePlan.advanced.stackEstimate.targetSNR,
                target_time_noise_ratio: exposurePlan.advanced.stackEstimate.targetTimeNoiseRatio,
              }
            : undefined,
        }
      : undefined,
  };
}

function fromTauriExposurePlan(exposurePlan?: TauriExposurePlan): TargetExposurePlan | undefined {
  if (!exposurePlan) return undefined;

  return {
    singleExposure: exposurePlan.single_exposure,
    totalExposure: exposurePlan.total_exposure,
    subFrames: exposurePlan.sub_frames,
    filter: exposurePlan.filter,
    advanced: exposurePlan.advanced
      ? {
          sqm: exposurePlan.advanced.sqm,
          filterBandwidthNm: exposurePlan.advanced.filter_bandwidth_nm,
          readNoiseLimitPercent: exposurePlan.advanced.read_noise_limit_percent,
          gainStrategy: exposurePlan.advanced.gain_strategy,
          recommendedGain: exposurePlan.advanced.recommended_gain,
          recommendedExposureSec: exposurePlan.advanced.recommended_exposure_sec,
          skyFluxPerPixel: exposurePlan.advanced.sky_flux_per_pixel,
          targetSignalPerPixelPerSec: exposurePlan.advanced.target_signal_per_pixel_per_sec,
          dynamicRangeScore: exposurePlan.advanced.dynamic_range_score,
          dynamicRangeStops: exposurePlan.advanced.dynamic_range_stops,
          readNoiseUsed: exposurePlan.advanced.read_noise_used,
          darkCurrentUsed: exposurePlan.advanced.dark_current_used,
          noiseFractions: exposurePlan.advanced.noise_fractions
            ? {
                read: exposurePlan.advanced.noise_fractions.read,
                sky: exposurePlan.advanced.noise_fractions.sky,
                dark: exposurePlan.advanced.noise_fractions.dark,
              }
            : undefined,
          stackEstimate: exposurePlan.advanced.stack_estimate
            ? {
                recommendedFrameCount: exposurePlan.advanced.stack_estimate.recommended_frame_count,
                estimatedTotalMinutes: exposurePlan.advanced.stack_estimate.estimated_total_minutes,
                framesForTargetSNR: exposurePlan.advanced.stack_estimate.frames_for_target_snr,
                framesForTimeNoise: exposurePlan.advanced.stack_estimate.frames_for_time_noise,
                targetSNR: exposurePlan.advanced.stack_estimate.target_snr,
                targetTimeNoiseRatio: exposurePlan.advanced.stack_estimate.target_time_noise_ratio,
              }
            : undefined,
        }
      : undefined,
  };
}

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
      searchQuery: '',
      filterStatus: 'all',
      filterPriority: 'all',
      sortBy: 'manual',
      sortOrder: 'asc',
      scoreProfile: 'imaging',
      scoreVersion: 'v2',
      scoreBreakdownVisibility: 'collapsed',
      
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
        // Sync to Tauri
        if (isTauri()) {
          targetListApi.addTarget({
            name: newTarget.name,
            ra: newTarget.ra,
            dec: newTarget.dec,
            ra_string: newTarget.raString || '',
            dec_string: newTarget.decString || '',
            priority: newTarget.priority,
            notes: newTarget.notes,
            tags: newTarget.tags ?? [],
            sensor_width: newTarget.sensorWidth,
            sensor_height: newTarget.sensorHeight,
            focal_length: newTarget.focalLength,
            rotation_angle: newTarget.rotationAngle,
            exposure_plan: toTauriExposurePlan(newTarget.exposurePlan),
          }).catch(err => logger.error('Failed to add target to Tauri', err));
        }
      },
      
      removeTarget: (id) => {
        set((state) => {
          const newSelected = new Set(state.selectedIds);
          newSelected.delete(id);
          return {
            targets: state.targets.filter((t) => t.id !== id),
            activeTargetId: state.activeTargetId === id ? null : state.activeTargetId,
            selectedIds: newSelected,
          };
        });
        // Sync to Tauri
        if (isTauri()) {
          targetListApi.removeTarget(id).catch(err => logger.error('Failed to remove target from Tauri', err));
        }
      },
      
      updateTarget: (id, updates) => {
        set((state) => ({
          targets: state.targets.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        }));
        // Sync to Tauri
        if (isTauri()) {
          const tauriUpdates: Record<string, unknown> = {};
          if (updates.name !== undefined) tauriUpdates.name = updates.name;
          if (updates.ra !== undefined) tauriUpdates.ra = updates.ra;
          if (updates.dec !== undefined) tauriUpdates.dec = updates.dec;
          if (updates.raString !== undefined) tauriUpdates.ra_string = updates.raString;
          if (updates.decString !== undefined) tauriUpdates.dec_string = updates.decString;
          if (updates.priority !== undefined) tauriUpdates.priority = updates.priority;
          if (updates.status !== undefined) tauriUpdates.status = updates.status;
          if (updates.notes !== undefined) tauriUpdates.notes = updates.notes;
          if (updates.tags !== undefined) tauriUpdates.tags = updates.tags;
          if (updates.isFavorite !== undefined) tauriUpdates.is_favorite = updates.isFavorite;
          if (updates.isArchived !== undefined) tauriUpdates.is_archived = updates.isArchived;
          if (updates.exposurePlan !== undefined) tauriUpdates.exposure_plan = toTauriExposurePlan(updates.exposurePlan);
          targetListApi.updateTarget(id, tauriUpdates).catch(err => logger.error('Failed to update target in Tauri', err));
        }
      },
      
      setActiveTarget: (id) => {
        set({ activeTargetId: id });
        // Sync to Tauri
        if (isTauri()) {
          targetListApi.setActiveTarget(id).catch(err => logger.error('Failed to set active target in Tauri', err));
        }
      },
      
      reorderTargets: (fromIndex, toIndex) => set((state) => {
        const newTargets = [...state.targets];
        const [removed] = newTargets.splice(fromIndex, 1);
        newTargets.splice(toIndex, 0, removed);
        return { targets: newTargets };
      }),
      
      // ========== Batch actions ==========
      addTargetsBatch: (targets, defaultSettings = {}) => {
        const baseTime = Date.now();
        const newTargets: TargetItem[] = targets.map((t, index) => ({
          ...defaultSettings,
          ...t,
          id: generateId(),
          addedAt: baseTime + index,
          status: 'planned' as const,
          priority: defaultSettings.priority || 'medium',
          tags: defaultSettings.tags || [],
          isFavorite: false,
          isArchived: false,
        }));
        set((state) => ({
          targets: [...state.targets, ...newTargets],
        }));
        // Sync to Tauri
        if (isTauri()) {
          const batchTargets = targets.map(t => ({
            name: t.name,
            ra: t.ra,
            dec: t.dec,
            ra_string: t.raString || '',
            dec_string: t.decString || '',
          }));
          targetListApi.addTargetsBatch(
            batchTargets,
            defaultSettings.priority || 'medium',
            defaultSettings.tags
          ).catch(err => logger.error('Failed to add batch targets to Tauri', err));
        }
      },
      
      removeTargetsBatch: (ids) => {
        set((state) => {
          const idsSet = new Set(ids);
          const newSelected = new Set(state.selectedIds);
          ids.forEach(id => newSelected.delete(id));
          return {
            targets: state.targets.filter((t) => !idsSet.has(t.id)),
            activeTargetId: idsSet.has(state.activeTargetId || '') ? null : state.activeTargetId,
            selectedIds: newSelected,
          };
        });
        // Sync to Tauri
        if (isTauri()) {
          targetListApi.removeTargetsBatch(ids).catch(err => logger.error('Failed to remove batch targets from Tauri', err));
        }
      },
      
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
            idsSet.has(t.id) && !(t.tags ?? []).includes(tag)
              ? { ...t, tags: [...(t.tags ?? []), tag] }
              : t
          ),
          availableTags: (state.availableTags ?? []).includes(tag)
            ? (state.availableTags ?? [])
            : [...(state.availableTags ?? []), tag],
        };
      }),
      
      removeTagBatch: (ids, tag) => set((state) => {
        const idsSet = new Set(ids);
        return {
          targets: state.targets.map((t) =>
            idsSet.has(t.id)
              ? { ...t, tags: (t.tags ?? []).filter((tg) => tg !== tag) }
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
        availableTags: (state.availableTags ?? []).includes(tag)
          ? (state.availableTags ?? [])
          : [...(state.availableTags ?? []), tag],
      })),
      
      removeTag: (tag) => set((state) => ({
        availableTags: (state.availableTags ?? []).filter((t) => t !== tag),
        filterTags: (state.filterTags ?? []).filter((t) => t !== tag),
        targets: state.targets.map((t) => ({
          ...t,
          tags: (t.tags ?? []).filter((tg) => tg !== tag),
        })),
      })),
      
      setFilterTags: (tags) => set({ filterTags: tags }),
      
      // ========== View options ==========
      setGroupBy: (groupBy) => set({ groupBy }),
      setShowArchived: (show) => set({ showArchived: show }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setFilterStatus: (status) => set({ filterStatus: status }),
      setFilterPriority: (priority) => set({ filterPriority: priority }),
      setSortBy: (sortBy) => set({ sortBy }),
      setSortOrder: (order) => set({ sortOrder: order }),
      setScoreProfile: (scoreProfile) => set({ scoreProfile }),
      setScoreVersion: (scoreVersion) => set({ scoreVersion }),
      setScoreBreakdownVisibility: (scoreBreakdownVisibility) => set({ scoreBreakdownVisibility }),
      
      // ========== Favorite/Archive ==========
      toggleFavorite: (id) => {
        set((state) => ({
          targets: state.targets.map((t) =>
            t.id === id ? { ...t, isFavorite: !t.isFavorite } : t
          ),
        }));
        // Sync to Tauri
        if (isTauri()) {
          targetListApi.toggleFavorite(id).catch(err => logger.error('Failed to toggle favorite in Tauri', err));
        }
      },
      
      toggleArchive: (id) => {
        set((state) => ({
          targets: state.targets.map((t) =>
            t.id === id ? { ...t, isArchived: !t.isArchived } : t
          ),
        }));
        // Sync to Tauri
        if (isTauri()) {
          targetListApi.toggleArchive(id).catch(err => logger.error('Failed to toggle archive in Tauri', err));
        }
      },
      
      archiveCompleted: () => {
        set((state) => ({
          targets: state.targets.map((t) =>
            t.status === 'completed' ? { ...t, isArchived: true } : t
          ),
        }));
        // Sync to Tauri
        if (isTauri()) {
          targetListApi.archiveCompleted().catch(err => logger.error('Failed to archive completed in Tauri', err));
        }
      },
      
      // ========== Clear actions ==========
      clearCompleted: () => {
        set((state) => ({
          targets: state.targets.filter((t) => t.status !== 'completed'),
          selectedIds: new Set([...state.selectedIds].filter(id => 
            state.targets.find(t => t.id === id)?.status !== 'completed'
          )),
        }));
        // Sync to Tauri
        if (isTauri()) {
          targetListApi.clearCompleted().catch(err => logger.error('Failed to clear completed in Tauri', err));
        }
      },
      
      clearAll: () => {
        set({ targets: [], activeTargetId: null, selectedIds: new Set() });
        // Sync to Tauri
        if (isTauri()) {
          targetListApi.clearAll().catch(err => logger.error('Failed to clear all targets in Tauri', err));
        }
      },
      
      // ========== Observable window cache ==========
      updateObservableWindow: (id, window) => set((state) => ({
        targets: state.targets.map((t) =>
          t.id === id ? { ...t, observableWindow: window } : t
        ),
      })),
      
      // ========== Tauri sync ==========
      _tauriInitialized: false,
      
      syncWithTauri: async () => {
        if (!isTauri() || get()._tauriInitialized) return;
        
        try {
          const data = await targetListApi.load();
          if (data) {
            set({
              targets: data.targets.map(t => ({
                ...t,
                addedAt: t.added_at,
                raString: t.ra_string,
                decString: t.dec_string,
                observableWindow: t.observable_window ? {
                  start: new Date(t.observable_window.start),
                  end: new Date(t.observable_window.end),
                  maxAltitude: t.observable_window.max_altitude,
                  transitTime: new Date(t.observable_window.transit_time),
                  isCircumpolar: t.observable_window.is_circumpolar,
                } : undefined,
                isFavorite: t.is_favorite,
                isArchived: t.is_archived,
                sensorWidth: t.sensor_width,
                sensorHeight: t.sensor_height,
                focalLength: t.focal_length,
                rotationAngle: t.rotation_angle,
                exposurePlan: fromTauriExposurePlan(t.exposure_plan),
              })),
              availableTags: data.available_tags,
              activeTargetId: data.active_target_id,
              _tauriInitialized: true,
            });
          }
        } catch (error) {
          logger.error('Failed to sync with Tauri', error);
        }
      },
      
      // ========== Computed getters ==========
      getFilteredTargets: () => {
        const state = get();
        let filtered = state.targets;
        
        // Filter by archived status
        if (!state.showArchived) {
          filtered = filtered.filter((t) => !t.isArchived);
        }
        
        // Filter by search query
        if (state.searchQuery.trim()) {
          const q = state.searchQuery.trim().toLowerCase();
          filtered = filtered.filter((t) =>
            t.name.toLowerCase().includes(q) ||
            (t.tags ?? []).some((tag) => tag.toLowerCase().includes(q)) ||
            t.notes?.toLowerCase().includes(q)
          );
        }
        
        // Filter by status
        if (state.filterStatus !== 'all') {
          filtered = filtered.filter((t) => t.status === state.filterStatus);
        }
        
        // Filter by priority
        if (state.filterPriority !== 'all') {
          filtered = filtered.filter((t) => t.priority === state.filterPriority);
        }
        
        // Filter by tags
        if (state.filterTags.length > 0) {
          filtered = filtered.filter((t) =>
            state.filterTags.some((tag) => (t.tags ?? []).includes(tag))
          );
        }
        
        // Sort
        if (state.sortBy !== 'manual') {
          const dir = state.sortOrder === 'asc' ? 1 : -1;
          filtered = [...filtered].sort((a, b) => {
            switch (state.sortBy) {
              case 'name':
                return dir * a.name.localeCompare(b.name);
              case 'priority': {
                const pOrder = { high: 0, medium: 1, low: 2 };
                return dir * (pOrder[a.priority] - pOrder[b.priority]);
              }
              case 'status': {
                const sOrder = { planned: 0, in_progress: 1, completed: 2 };
                return dir * (sOrder[a.status] - sOrder[b.status]);
              }
              case 'addedAt':
                return dir * (a.addedAt - b.addedAt);
              case 'feasibility': {
                // Composite score: imaging duration (hours) + altitude weight + circumpolar bonus
                const calcScore = (t: TargetItem) => {
                  const w = t.observableWindow;
                  if (!w) return 0;
                  const durationHours = (w.end.getTime() - w.start.getTime()) / 3600000;
                  const altScore = w.maxAltitude / 90; // normalize 0-1
                  const circumpolarBonus = w.isCircumpolar ? 0.2 : 0;
                  return durationHours * 0.5 + altScore * 0.3 + circumpolarBonus;
                };
                return dir * (calcScore(a) - calcScore(b));
              }
              default:
                return 0;
            }
          });
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
              if ((target.tags ?? []).length === 0) {
                key = 'untagged';
                if (!groups.has(key)) groups.set(key, []);
                groups.get(key)!.push(target);
              } else {
                for (const tag of (target.tags ?? [])) {
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
      
      checkDuplicate: (name, ra, dec) => {
        return findDuplicate(get().targets, name, ra, dec);
      },
    }),
    {
      name: 'starmap-target-list',
      storage: getZustandStorage(),
      partialize: (state) => ({
        targets: state.targets,
        activeTargetId: state.activeTargetId,
        availableTags: state.availableTags,
        groupBy: state.groupBy,
        showArchived: state.showArchived,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
        scoreProfile: state.scoreProfile,
        scoreVersion: state.scoreVersion,
        scoreBreakdownVisibility: state.scoreBreakdownVisibility,
      }),
    }
  )
);
