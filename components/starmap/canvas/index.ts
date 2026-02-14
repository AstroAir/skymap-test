// ============================================================================
// Stellarium Canvas Module - Index
// Re-exports from centralized locations for backward compatibility
// ============================================================================

// Main components
export { StellariumCanvas } from './stellarium-canvas';
export { AladinCanvas } from './aladin-canvas';
export { SkyMapCanvas } from './sky-map-canvas';

// Types (from types/)
export type {
  StellariumCanvasRef,
  StellariumCanvasProps,
  ClickCoordinates,
  EngineStatus,
  LoadingState,
  ViewDirection,
} from '@/types/stellarium-canvas';

// Constants (from lib/core/constants/)
export {
  MIN_FOV,
  MAX_FOV,
  DEFAULT_FOV,
  ZOOM_PRESETS,
} from '@/lib/core/constants/fov';
export {
  SCRIPT_PATH,
  WASM_PATH,
} from '@/lib/core/constants/stellarium-canvas';

// Utilities (from lib/core/)
export { fovToRad, fovToDeg } from '@/lib/core/stellarium-canvas-utils';

// Hooks (from lib/hooks/stellarium/)
export {
  useClickCoordinates,
  useStellariumZoom,
  useStellariumEvents,
  useObserverSync,
  useSettingsSync,
  useStellariumLoader,
} from '@/lib/hooks/stellarium';

// Components
export { LoadingOverlay } from './components';
