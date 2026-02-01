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

// Touch/Mouse interaction thresholds
export const LONG_PRESS_DURATION = 500; // ms
export const TOUCH_MOVE_THRESHOLD = 10; // pixels
export const RIGHT_CLICK_THRESHOLD = 5; // pixels - if moved more than this, it's a drag
export const RIGHT_CLICK_TIME_THRESHOLD = 300; // ms - max time for a click

// Settings debounce
export const SETTINGS_DEBOUNCE_MS = 50;
