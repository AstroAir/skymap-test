/**
 * @jest-environment jsdom
 */

import { renderHook } from '@testing-library/react';
import { useClickCoordinates } from '../use-click-coordinates';

function createMockStellarium(projection: number) {
  return {
    core: {
      fov: Math.PI / 3,
      projection,
    },
    observer: {},
    convertFrame: jest.fn((_observer: unknown, _from: string, _to: string, vec: number[]) => vec),
    c2s: jest.fn((vec: number[]) => {
      const [x, y, z] = vec;
      const theta = Math.atan2(y, x);
      const phi = Math.atan2(z, Math.sqrt(x * x + y * y));
      return [theta, phi];
    }),
    anp: jest.fn((angle: number) => {
      const twoPi = 2 * Math.PI;
      return ((angle % twoPi) + twoPi) % twoPi;
    }),
  };
}

describe('useClickCoordinates projection support', () => {
  const projections = [0, 1, 2, 3, 4, 5, 7, 8, 9, 10];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each(projections)('returns normalized coordinates for projection %s', (projection) => {
    const stel = createMockStellarium(projection);
    const canvas = document.createElement('canvas');
    canvas.getBoundingClientRect = jest.fn(() => ({
      width: 800,
      height: 600,
      top: 0,
      left: 0,
      bottom: 600,
      right: 800,
      x: 0,
      y: 0,
      toJSON: () => undefined,
    }));

    const { result } = renderHook(() =>
      useClickCoordinates(
        { current: stel } as never,
        { current: canvas } as never
      )
    );

    const testPoints: Array<[number, number]> = [
      [400, 300], // center
      [780, 300], // right edge
      [400, 40],  // near top edge
    ];

    for (const [x, y] of testPoints) {
      const coords = result.current.getClickCoordinates(x, y);
      expect(coords).not.toBeNull();
      expect(coords!.ra).toBeGreaterThanOrEqual(0);
      expect(coords!.ra).toBeLessThan(360);
      expect(coords!.dec).toBeGreaterThanOrEqual(-90);
      expect(coords!.dec).toBeLessThanOrEqual(90);
      expect(coords!.frame).toBe('ICRF');
      expect(coords!.timeScale).toBe('UTC');
      expect(coords!.qualityFlag).toBe('precise');
    }
  });

  it('normalizes negative RA values into [0, 360)', () => {
    const stel = createMockStellarium(1);
    stel.c2s = jest.fn((_vec: number[]) => [-Math.PI / 4, 0]);

    const canvas = document.createElement('canvas');
    canvas.getBoundingClientRect = jest.fn(() => ({
      width: 800,
      height: 600,
      top: 0,
      left: 0,
      bottom: 600,
      right: 800,
      x: 0,
      y: 0,
      toJSON: () => undefined,
    }));

    const { result } = renderHook(() =>
      useClickCoordinates(
        { current: stel } as never,
        { current: canvas } as never
      )
    );

    const coords = result.current.getClickCoordinates(400, 300);
    expect(coords).not.toBeNull();
    expect(coords!.ra).toBeCloseTo(315, 3);
  });
});
