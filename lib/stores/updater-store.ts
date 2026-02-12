import { create } from 'zustand';
import { createLogger } from '@/lib/logger';
import type { UpdateStatus, UpdateInfo, UpdateProgress } from '@/lib/tauri/updater-api';

const logger = createLogger('updater-store');

// ============================================================================
// Types
// ============================================================================

export interface UpdaterState {
  status: UpdateStatus;
  currentVersion: string | null;
  lastChecked: number | null;
  skippedVersion: string | null;
  downloadSpeed: number | null;
  estimatedTimeRemaining: number | null;
}

export interface UpdaterActions {
  setStatus: (status: UpdateStatus) => void;
  setCurrentVersion: (version: string) => void;
  setLastChecked: (timestamp: number) => void;
  setSkippedVersion: (version: string | null) => void;
  setDownloadMetrics: (speed: number | null, eta: number | null) => void;
  reset: () => void;
}

export type UpdaterStore = UpdaterState & UpdaterActions;

// ============================================================================
// Selectors
// ============================================================================

export function selectIsChecking(state: UpdaterStore): boolean {
  return state.status.status === 'checking';
}

export function selectIsDownloading(state: UpdaterStore): boolean {
  return state.status.status === 'downloading';
}

export function selectIsReady(state: UpdaterStore): boolean {
  return state.status.status === 'ready';
}

export function selectHasUpdate(state: UpdaterStore): boolean {
  return state.status.status === 'available' || state.status.status === 'ready';
}

export function selectUpdateInfo(state: UpdaterStore): UpdateInfo | null {
  if (state.status.status === 'available' || state.status.status === 'ready') {
    return state.status.data;
  }
  return null;
}

export function selectProgress(state: UpdaterStore): UpdateProgress | null {
  if (state.status.status === 'downloading') {
    return state.status.data;
  }
  return null;
}

export function selectError(state: UpdaterStore): string | null {
  if (state.status.status === 'error') {
    return state.status.data;
  }
  return null;
}

// ============================================================================
// Store
// ============================================================================

const initialState: UpdaterState = {
  status: { status: 'idle' },
  currentVersion: null,
  lastChecked: null,
  skippedVersion: null,
  downloadSpeed: null,
  estimatedTimeRemaining: null,
};

export const useUpdaterStore = create<UpdaterStore>()((set) => ({
  ...initialState,

  setStatus: (status) => {
    set({ status });
    logger.debug('Update status changed', { status: status.status });
  },

  setCurrentVersion: (version) => set({ currentVersion: version }),

  setLastChecked: (timestamp) => set({ lastChecked: timestamp }),

  setSkippedVersion: (version) => set({ skippedVersion: version }),

  setDownloadMetrics: (speed, eta) => set({
    downloadSpeed: speed,
    estimatedTimeRemaining: eta,
  }),

  reset: () => set(initialState),
}));
