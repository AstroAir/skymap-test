import { create } from 'zustand';
import type { SolverType } from '@/lib/tauri/plate-solver-api';

export interface CliPlateSolverLaunch {
  imagePath?: string;
  solver?: SolverType;
  raHint?: number;
  decHint?: number;
  fovHint?: number;
}

interface CliBridgeState {
  searchRequestId: number;
  pendingSearchQuery: string | null;
  sessionPlanImportRequestId: number;
  sessionPlanImportContent: string | null;
  sessionPlanImportSourcePath: string | null;
  plateSolverRequestId: number;
  plateSolverLaunch: CliPlateSolverLaunch | null;
  requestSearch: (query?: string | null) => void;
  requestSessionPlanImport: (content: string, sourcePath?: string | null) => void;
  requestPlateSolverLaunch: (launch?: CliPlateSolverLaunch | null) => void;
}

export const useCliBridgeStore = create<CliBridgeState>((set) => ({
  searchRequestId: 0,
  pendingSearchQuery: null,
  sessionPlanImportRequestId: 0,
  sessionPlanImportContent: null,
  sessionPlanImportSourcePath: null,
  plateSolverRequestId: 0,
  plateSolverLaunch: null,
  requestSearch: (query) =>
    set((state) => ({
      searchRequestId: state.searchRequestId + 1,
      pendingSearchQuery: query ?? null,
    })),
  requestSessionPlanImport: (content, sourcePath) =>
    set((state) => ({
      sessionPlanImportRequestId: state.sessionPlanImportRequestId + 1,
      sessionPlanImportContent: content,
      sessionPlanImportSourcePath: sourcePath ?? null,
    })),
  requestPlateSolverLaunch: (launch) =>
    set((state) => ({
      plateSolverRequestId: state.plateSolverRequestId + 1,
      plateSolverLaunch: launch ?? null,
    })),
}));
