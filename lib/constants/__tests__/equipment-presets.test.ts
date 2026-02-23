/**
 * Tests for equipment-presets.ts
 * Sensor and telescope preset data validation
 */

import { SENSOR_PRESETS, TELESCOPE_PRESETS } from '../equipment-presets';

describe('SENSOR_PRESETS', () => {
  it('should have multiple categories', () => {
    expect(Object.keys(SENSOR_PRESETS).length).toBeGreaterThan(0);
  });

  it('should have valid sensor data in each category', () => {
    for (const [, presets] of Object.entries(SENSOR_PRESETS)) {
      expect(presets.length).toBeGreaterThan(0);
      for (const sensor of presets) {
        expect(typeof sensor.name).toBe('string');
        expect(sensor.width).toBeGreaterThan(0);
        expect(sensor.height).toBeGreaterThan(0);
      }
    }
  });

  it('should contain fullFrame category', () => {
    expect(SENSOR_PRESETS.fullFrame).toBeDefined();
    expect(SENSOR_PRESETS.fullFrame.length).toBeGreaterThan(0);
  });
});

describe('TELESCOPE_PRESETS', () => {
  it('should be a non-empty array', () => {
    expect(TELESCOPE_PRESETS.length).toBeGreaterThan(0);
  });

  it('should have valid telescope data', () => {
    for (const telescope of TELESCOPE_PRESETS) {
      expect(typeof telescope.name).toBe('string');
      expect(telescope.focalLength).toBeGreaterThan(0);
      expect(telescope.aperture).toBeGreaterThan(0);
      expect(typeof telescope.type).toBe('string');
    }
  });
});
