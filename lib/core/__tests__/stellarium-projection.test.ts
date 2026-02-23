/**
 * Tests for stellarium-projection.ts
 * Projection coordinate transformations
 */

import { viewVectorToNdc, ndcToViewVector } from '../stellarium-projection';
import type { ProjectionContext } from '../stellarium-projection';

describe('viewVectorToNdc', () => {
  const ctx: ProjectionContext = {
    projection: 0, // perspective/gnomonic
    fov: Math.PI / 4, // 45 degrees
    aspect: 16 / 9,
  };

  it('should project center of view to (0, 0)', () => {
    // Direction vector pointing straight ahead [0, 0, -1] in view space
    const result = viewVectorToNdc([0, 0, -1], ctx);
    expect(result).not.toBeNull();
    expect(result!.x).toBeCloseTo(0, 3);
    expect(result!.y).toBeCloseTo(0, 3);
  });

  it('should handle zero-length vector gracefully', () => {
    const result = viewVectorToNdc([0, 0, 0], ctx);
    expect(result).toBeNull();
  });

  it('should produce non-zero NDC for off-center direction', () => {
    const result = viewVectorToNdc([0.1, 0, -1], ctx);
    expect(result).not.toBeNull();
    expect(Math.abs(result!.x)).toBeGreaterThan(0);
  });
});

describe('ndcToViewVector', () => {
  const ctx: ProjectionContext = {
    projection: 0,
    fov: Math.PI / 4,
    aspect: 16 / 9,
  };

  it('should unproject center to forward direction', () => {
    const result = ndcToViewVector(0, 0, ctx);
    expect(result).not.toBeNull();
    // Should point along -z (forward in view space)
    expect(result![2]).toBeLessThan(0);
  });

  it('should round-trip with viewVectorToNdc', () => {
    const dir = [0.05, 0.1, -1];
    const norm = Math.hypot(...dir);
    const normalized = dir.map(v => v / norm);
    
    const ndc = viewVectorToNdc(normalized, ctx);
    if (!ndc) return;
    
    const back = ndcToViewVector(ndc.x, ndc.y, ctx);
    expect(back).not.toBeNull();
    // Direction should be approximately the same
    for (let i = 0; i < 3; i++) {
      expect(back![i]).toBeCloseTo(normalized[i], 2);
    }
  });
});
