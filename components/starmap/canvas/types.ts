// ============================================================================
// Stellarium Canvas Types
// ============================================================================

import type { SelectedObjectData, ClickCoords } from '@/lib/core/types';

// Re-export ClickCoords as ClickCoordinates for backward compatibility
export type ClickCoordinates = ClickCoords;

export interface StellariumCanvasRef {
  zoomIn: () => void;
  zoomOut: () => void;
  setFov: (fov: number) => void;
  getFov: () => number;
  getClickCoordinates: (clientX: number, clientY: number) => ClickCoordinates | null;
  /** Debug: Force reload the engine */
  reloadEngine: () => void;
  /** Debug: Get engine status */
  getEngineStatus: () => EngineStatus;
}

export interface StellariumCanvasProps {
  onSelectionChange?: (selection: SelectedObjectData | null) => void;
  onFovChange?: (fov: number) => void;
  onContextMenu?: (e: React.MouseEvent, coords: ClickCoordinates | null) => void;
}

export interface EngineStatus {
  isLoading: boolean;
  hasError: boolean;
  isReady: boolean;
}

export interface LoadingState {
  isLoading: boolean;
  loadingStatus: string;
  errorMessage: string | null;
}

export interface ViewDirection {
  ra: number;
  dec: number;
  alt: number;
  az: number;
}
