/**
 * Sky Engine abstraction types
 * Defines engine-agnostic interfaces for switching between Stellarium and Aladin Lite
 */

import type { ClickCoords, SelectedObjectData, StellariumEngine } from './stellarium';

// ============================================================================
// Engine Type
// ============================================================================

export type SkyEngineType = 'stellarium' | 'aladin';

// ============================================================================
// Engine Status
// ============================================================================

export interface EngineStatus {
  isLoading: boolean;
  hasError: boolean;
  isReady: boolean;
}

// ============================================================================
// Canvas Ref Interface (engine-agnostic)
// ============================================================================

export interface SkyMapCanvasRef {
  zoomIn: () => void;
  zoomOut: () => void;
  setFov: (fov: number) => void;
  getFov: () => number;
  getClickCoordinates: (clientX: number, clientY: number) => ClickCoords | null;
  reloadEngine: () => void;
  getEngineStatus: () => EngineStatus;
  getEngine?: () => StellariumEngine | null;
  onEngineEvent?: (
    event: 'click' | 'rectSelection',
    cb: (event: unknown) => void
  ) => () => void;
  setEngineFont?: (face: 'regular' | 'bold', url: string) => Promise<void>;
  runCalendar?: (args: { start: Date; end: Date }) => Promise<unknown[]>;
  exportImage?: () => Promise<string | null>;
  gotoObject?: (name: string) => void;
}

// ============================================================================
// Canvas Props Interface (engine-agnostic)
// ============================================================================

export interface SkyMapCanvasProps {
  onSelectionChange?: (selection: SelectedObjectData | null) => void;
  onFovChange?: (fov: number) => void;
  onContextMenu?: (e: React.MouseEvent, coords: ClickCoords | null) => void;
}
