/**
 * Tests for mount.ts
 * Mount overlay constants
 */

import {
  MOUNT_CIRCLE_COLOR,
  MOUNT_CIRCLE_BORDER,
  MOUNT_CIRCLE_SIZE,
  MOUNT_CIRCLE_HIDDEN_COLOR,
  MOUNT_CIRCLE_HIDDEN_SIZE,
  MOUNT_LAYER_Z,
} from '../mount';

describe('Mount overlay constants', () => {
  describe('MOUNT_CIRCLE_COLOR', () => {
    it('is an RGBA tuple with 4 elements', () => {
      expect(MOUNT_CIRCLE_COLOR).toHaveLength(4);
    });

    it('has all values in [0, 1] range', () => {
      for (const v of MOUNT_CIRCLE_COLOR) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('MOUNT_CIRCLE_BORDER', () => {
    it('is an RGBA tuple with 4 elements', () => {
      expect(MOUNT_CIRCLE_BORDER).toHaveLength(4);
    });

    it('has alpha = 1 (fully opaque)', () => {
      expect(MOUNT_CIRCLE_BORDER[3]).toBe(1);
    });
  });

  describe('MOUNT_CIRCLE_SIZE', () => {
    it('is a [width, height] tuple', () => {
      expect(MOUNT_CIRCLE_SIZE).toHaveLength(2);
    });

    it('has positive dimensions', () => {
      expect(MOUNT_CIRCLE_SIZE[0]).toBeGreaterThan(0);
      expect(MOUNT_CIRCLE_SIZE[1]).toBeGreaterThan(0);
    });
  });

  describe('MOUNT_CIRCLE_HIDDEN_COLOR', () => {
    it('is fully transparent', () => {
      expect(MOUNT_CIRCLE_HIDDEN_COLOR).toEqual([0, 0, 0, 0]);
    });
  });

  describe('MOUNT_CIRCLE_HIDDEN_SIZE', () => {
    it('is zero size', () => {
      expect(MOUNT_CIRCLE_HIDDEN_SIZE).toEqual([0, 0]);
    });
  });

  describe('MOUNT_LAYER_Z', () => {
    it('is a positive integer', () => {
      expect(Number.isInteger(MOUNT_LAYER_Z)).toBe(true);
      expect(MOUNT_LAYER_Z).toBeGreaterThan(0);
    });
  });
});
