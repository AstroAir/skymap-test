// ============================================================================
// Stellarium Canvas Constants
// ============================================================================

// Timeout configurations
export const SCRIPT_LOAD_TIMEOUT = 15000; // 15s for script
export const WASM_INIT_TIMEOUT = 30000;   // 30s for WASM init
export const MAX_RETRY_COUNT = 2;

// Resource paths
export const SCRIPT_PATH = '/stellarium-js/stellarium-web-engine.js';
export const WASM_PATH = '/stellarium-js/stellarium-web-engine.wasm';

// FOV limits
export const MIN_FOV = 0.5;
export const MAX_FOV = 180;
export const DEFAULT_FOV = 60;

// Common zoom presets (FOV in degrees)
export const ZOOM_PRESETS = [
  { fov: 90, labelKey: 'wideField' },
  { fov: 60, labelKey: 'normal' },
  { fov: 30, labelKey: 'medium' },
  { fov: 15, labelKey: 'closeUp' },
  { fov: 5, labelKey: 'detail' },
  { fov: 1, labelKey: 'maxZoom' },
] as const;

// Touch/Mouse interaction thresholds
export const LONG_PRESS_DURATION = 500; // ms
export const TOUCH_MOVE_THRESHOLD = 10; // pixels
export const RIGHT_CLICK_THRESHOLD = 5; // pixels - if moved more than this, it's a drag
export const RIGHT_CLICK_TIME_THRESHOLD = 300; // ms - max time for a click

// Engine initialization delays
export const ENGINE_FOV_INIT_DELAY = 100;      // ms - delay before setting initial FOV after engine ready
export const ENGINE_SETTINGS_INIT_DELAY = 200;  // ms - delay before applying initial settings after engine ready
export const RETRY_DELAY_MS = 1000;             // ms - delay between auto-retry attempts

// Settings debounce
export const SETTINGS_DEBOUNCE_MS = 50;
