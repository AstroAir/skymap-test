/**
 * Tests for core/constants/fov.ts
 * FOV constants and zoom presets
 */

import { MIN_FOV, MAX_FOV, DEFAULT_FOV, ZOOM_PRESETS } from '../fov';

describe('FOV constants', () => {
  it('should have MIN_FOV < DEFAULT_FOV < MAX_FOV', () => {
    expect(MIN_FOV).toBeLessThan(DEFAULT_FOV);
    expect(DEFAULT_FOV).toBeLessThan(MAX_FOV);
  });

  it('should have reasonable range', () => {
    expect(MIN_FOV).toBeGreaterThan(0);
    expect(MAX_FOV).toBeLessThanOrEqual(360);
  });
});

describe('ZOOM_PRESETS', () => {
  it('should be a non-empty array', () => {
    expect(ZOOM_PRESETS.length).toBeGreaterThan(0);
  });

  it('should have fov and labelKey for each preset', () => {
    for (const preset of ZOOM_PRESETS) {
      expect(typeof preset.fov).toBe('number');
      expect(preset.fov).toBeGreaterThan(0);
      expect(typeof preset.labelKey).toBe('string');
    }
  });

  it('should be sorted in descending FOV order', () => {
    for (let i = 1; i < ZOOM_PRESETS.length; i++) {
      expect(ZOOM_PRESETS[i].fov).toBeLessThan(ZOOM_PRESETS[i - 1].fov);
    }
  });
});
