// ============================================================================
// Stellarium Canvas Module - Index
// ============================================================================

// Main component
export { StellariumCanvas } from './stellarium-canvas';

// Types
export type {
  StellariumCanvasRef,
  StellariumCanvasProps,
  ClickCoordinates,
  EngineStatus,
  LoadingState,
  ViewDirection,
} from './types';

// Constants (for external use if needed)
export {
  MIN_FOV,
  MAX_FOV,
  DEFAULT_FOV,
  SCRIPT_PATH,
  WASM_PATH,
} from './constants';

// Utilities (for external use if needed)
export { fovToRad, fovToDeg } from './utils';

// Hooks (for potential reuse)
export {
  useClickCoordinates,
  useStellariumZoom,
  useStellariumEvents,
  useObserverSync,
  useSettingsSync,
  useStellariumLoader,
} from './hooks';

// Components
export { LoadingOverlay } from './components';
