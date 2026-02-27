/**
 * Tests for stellarium-canvas.ts
 * Stellarium canvas timeout, resource, interaction, and debounce constants
 */

import {
  SCRIPT_LOAD_TIMEOUT,
  WASM_INIT_TIMEOUT,
  MAX_RETRY_COUNT,
  OVERALL_LOADING_TIMEOUT,
  SCRIPT_PATH,
  WASM_PATH,
  LONG_PRESS_DURATION,
  TOUCH_MOVE_THRESHOLD,
  RIGHT_CLICK_THRESHOLD,
  RIGHT_CLICK_TIME_THRESHOLD,
  ENGINE_FOV_INIT_DELAY,
  ENGINE_SETTINGS_INIT_DELAY,
  RETRY_DELAY_MS,
  SETTINGS_DEBOUNCE_MS,
} from '../stellarium-canvas';

describe('Timeout configurations', () => {
  it('SCRIPT_LOAD_TIMEOUT is positive', () => {
    expect(SCRIPT_LOAD_TIMEOUT).toBeGreaterThan(0);
  });

  it('WASM_INIT_TIMEOUT is positive and >= SCRIPT_LOAD_TIMEOUT', () => {
    expect(WASM_INIT_TIMEOUT).toBeGreaterThan(0);
    expect(WASM_INIT_TIMEOUT).toBeGreaterThanOrEqual(SCRIPT_LOAD_TIMEOUT);
  });

  it('OVERALL_LOADING_TIMEOUT is greater than individual timeouts', () => {
    expect(OVERALL_LOADING_TIMEOUT).toBeGreaterThan(SCRIPT_LOAD_TIMEOUT);
    expect(OVERALL_LOADING_TIMEOUT).toBeGreaterThan(WASM_INIT_TIMEOUT);
  });

  it('MAX_RETRY_COUNT is a non-negative integer', () => {
    expect(Number.isInteger(MAX_RETRY_COUNT)).toBe(true);
    expect(MAX_RETRY_COUNT).toBeGreaterThanOrEqual(0);
  });
});

describe('Resource paths', () => {
  it('SCRIPT_PATH is a valid path to a .js file', () => {
    expect(SCRIPT_PATH).toMatch(/\.js$/);
    expect(SCRIPT_PATH.startsWith('/')).toBe(true);
  });

  it('WASM_PATH is a valid path to a .wasm file', () => {
    expect(WASM_PATH).toMatch(/\.wasm$/);
    expect(WASM_PATH.startsWith('/')).toBe(true);
  });
});

describe('Touch/Mouse interaction thresholds', () => {
  it('LONG_PRESS_DURATION is positive ms', () => {
    expect(LONG_PRESS_DURATION).toBeGreaterThan(0);
  });

  it('TOUCH_MOVE_THRESHOLD is positive pixels', () => {
    expect(TOUCH_MOVE_THRESHOLD).toBeGreaterThan(0);
  });

  it('RIGHT_CLICK_THRESHOLD is positive pixels', () => {
    expect(RIGHT_CLICK_THRESHOLD).toBeGreaterThan(0);
  });

  it('RIGHT_CLICK_TIME_THRESHOLD is positive ms', () => {
    expect(RIGHT_CLICK_TIME_THRESHOLD).toBeGreaterThan(0);
  });
});

describe('Engine initialization delays', () => {
  it('ENGINE_FOV_INIT_DELAY is positive', () => {
    expect(ENGINE_FOV_INIT_DELAY).toBeGreaterThan(0);
  });

  it('ENGINE_SETTINGS_INIT_DELAY is >= ENGINE_FOV_INIT_DELAY', () => {
    expect(ENGINE_SETTINGS_INIT_DELAY).toBeGreaterThanOrEqual(ENGINE_FOV_INIT_DELAY);
  });

  it('RETRY_DELAY_MS is positive', () => {
    expect(RETRY_DELAY_MS).toBeGreaterThan(0);
  });
});

describe('Settings debounce', () => {
  it('SETTINGS_DEBOUNCE_MS is non-negative', () => {
    expect(SETTINGS_DEBOUNCE_MS).toBeGreaterThanOrEqual(0);
  });
});
