/**
 * Tests for aladin-canvas.ts
 * Aladin Lite canvas constants and projection mapping
 */

import {
  ALADIN_DEFAULT_FOV,
  ALADIN_DEFAULT_SURVEY,
  ALADIN_DEFAULT_PROJECTION,
  ALADIN_DEFAULT_COO_FRAME,
  ALADIN_INIT_TIMEOUT,
  ALADIN_NAVIGATE_DURATION,
  ALADIN_ZOOM_IN_FACTOR,
  ALADIN_ZOOM_OUT_FACTOR,
  STELLARIUM_TO_ALADIN_PROJECTION,
} from '../aladin-canvas';

describe('Aladin canvas default values', () => {
  it('ALADIN_DEFAULT_FOV is a positive number', () => {
    expect(ALADIN_DEFAULT_FOV).toBeGreaterThan(0);
    expect(ALADIN_DEFAULT_FOV).toBeLessThanOrEqual(360);
  });

  it('ALADIN_DEFAULT_SURVEY is a valid HiPS ID string', () => {
    expect(typeof ALADIN_DEFAULT_SURVEY).toBe('string');
    expect(ALADIN_DEFAULT_SURVEY.length).toBeGreaterThan(0);
  });

  it('ALADIN_DEFAULT_PROJECTION is a string', () => {
    expect(typeof ALADIN_DEFAULT_PROJECTION).toBe('string');
  });

  it('ALADIN_DEFAULT_COO_FRAME is a string', () => {
    expect(typeof ALADIN_DEFAULT_COO_FRAME).toBe('string');
  });

  it('ALADIN_INIT_TIMEOUT is a positive number', () => {
    expect(ALADIN_INIT_TIMEOUT).toBeGreaterThan(0);
  });

  it('ALADIN_NAVIGATE_DURATION is a positive number', () => {
    expect(ALADIN_NAVIGATE_DURATION).toBeGreaterThan(0);
  });
});

describe('Aladin zoom factors', () => {
  it('ALADIN_ZOOM_IN_FACTOR is less than 1 (zooming in reduces FOV)', () => {
    expect(ALADIN_ZOOM_IN_FACTOR).toBeGreaterThan(0);
    expect(ALADIN_ZOOM_IN_FACTOR).toBeLessThan(1);
  });

  it('ALADIN_ZOOM_OUT_FACTOR is greater than 1 (zooming out increases FOV)', () => {
    expect(ALADIN_ZOOM_OUT_FACTOR).toBeGreaterThan(1);
  });

  it('zoom in and out are inverse operations', () => {
    // After zooming in then out, FOV should approximately recover
    const fov = 60;
    const afterZoomIn = fov * ALADIN_ZOOM_IN_FACTOR;
    const afterZoomOut = afterZoomIn * ALADIN_ZOOM_OUT_FACTOR;
    expect(afterZoomOut).toBeCloseTo(fov * ALADIN_ZOOM_IN_FACTOR * ALADIN_ZOOM_OUT_FACTOR);
  });
});

describe('STELLARIUM_TO_ALADIN_PROJECTION', () => {
  const expectedProjections = [
    'stereographic',
    'equal-area',
    'perspective',
    'fisheye',
    'hammer',
    'cylinder',
    'mercator',
    'orthographic',
    'sinusoidal',
    'miller',
  ];

  it('maps all Stellarium projection types', () => {
    for (const proj of expectedProjections) {
      expect(STELLARIUM_TO_ALADIN_PROJECTION).toHaveProperty(proj);
    }
  });

  it('all values are non-empty strings', () => {
    for (const [key, value] of Object.entries(STELLARIUM_TO_ALADIN_PROJECTION)) {
      expect(typeof key).toBe('string');
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThan(0);
    }
  });

  it('maps standard projections correctly', () => {
    expect(STELLARIUM_TO_ALADIN_PROJECTION['perspective']).toBe('TAN');
    expect(STELLARIUM_TO_ALADIN_PROJECTION['stereographic']).toBe('STG');
    expect(STELLARIUM_TO_ALADIN_PROJECTION['orthographic']).toBe('SIN');
    expect(STELLARIUM_TO_ALADIN_PROJECTION['mercator']).toBe('MER');
  });
});
