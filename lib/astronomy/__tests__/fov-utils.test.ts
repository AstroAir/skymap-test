/**
 * Tests for fov-utils.ts
 * FOV ↔ slider logarithmic conversion and FOV formatting
 */

import { fovToSlider, sliderToFov, formatFov } from '../fov-utils';

const MIN_FOV = 0.1;
const MAX_FOV = 180;

describe('fovToSlider', () => {
  it('should return 0 for minimum FOV', () => {
    expect(fovToSlider(MIN_FOV, MIN_FOV, MAX_FOV)).toBeCloseTo(0);
  });

  it('should return 100 for maximum FOV', () => {
    expect(fovToSlider(MAX_FOV, MIN_FOV, MAX_FOV)).toBeCloseTo(100);
  });

  it('should return value between 0 and 100 for mid-range FOV', () => {
    const result = fovToSlider(10, MIN_FOV, MAX_FOV);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(100);
  });

  it('should clamp values below min', () => {
    const result = fovToSlider(0.01, MIN_FOV, MAX_FOV);
    expect(result).toBeCloseTo(0);
  });

  it('should clamp values above max', () => {
    const result = fovToSlider(500, MIN_FOV, MAX_FOV);
    expect(result).toBeCloseTo(100);
  });
});

describe('sliderToFov', () => {
  it('should return minFov for slider 0', () => {
    expect(sliderToFov(0, MIN_FOV, MAX_FOV)).toBeCloseTo(MIN_FOV);
  });

  it('should return maxFov for slider 100', () => {
    expect(sliderToFov(100, MIN_FOV, MAX_FOV)).toBeCloseTo(MAX_FOV);
  });

  it('should be inverse of fovToSlider', () => {
    const testFovs = [0.5, 1, 5, 10, 45, 90, 120];
    for (const fov of testFovs) {
      const slider = fovToSlider(fov, MIN_FOV, MAX_FOV);
      const roundTrip = sliderToFov(slider, MIN_FOV, MAX_FOV);
      expect(roundTrip).toBeCloseTo(fov, 5);
    }
  });
});

describe('formatFov', () => {
  it('should use 2 decimals for FOV < 1°', () => {
    expect(formatFov(0.5)).toBe('0.50');
    expect(formatFov(0.123)).toBe('0.12');
  });

  it('should use 1 decimal for FOV ≥ 1°', () => {
    expect(formatFov(1)).toBe('1.0');
    expect(formatFov(10.56)).toBe('10.6');
    expect(formatFov(180)).toBe('180.0');
  });
});
