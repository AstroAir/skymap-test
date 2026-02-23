/**
 * Tests for use-object-astro-data.ts
 * Astronomical data computation for selected objects
 */

import { renderHook } from '@testing-library/react';
import { useAstroEnvironment, useTargetAstroData } from '../use-object-astro-data';
import type { SelectedObjectData } from '@/lib/core/types';

describe('useAstroEnvironment', () => {
  it('should compute environment data', () => {
    const now = new Date();
    const { result } = renderHook(() =>
      useAstroEnvironment(40, -74, now)
    );
    const env = result.current;
    expect(typeof env.moonPhaseName).toBe('string');
    expect(typeof env.moonIllumination).toBe('number');
    expect(typeof env.sunAltitude).toBe('number');
    expect(typeof env.lstString).toBe('string');
  });

  it('should have moonIllumination between 0 and 100', () => {
    const now = new Date();
    const { result } = renderHook(() =>
      useAstroEnvironment(40, -74, now)
    );
    expect(result.current.moonIllumination).toBeGreaterThanOrEqual(0);
    expect(result.current.moonIllumination).toBeLessThanOrEqual(100);
  });
});

describe('useTargetAstroData', () => {
  const mockObject = {
    names: ['M31'],
    raDeg: 10.68,
    decDeg: 41.27,
    ra: '0h 42m 44s',
    dec: '+41° 16\' 09"',
    type: 'Galaxy',
    constellation: 'And',
    magnitude: 3.4,
  } as unknown as SelectedObjectData;

  it('should return null when no object selected', () => {
    const now = new Date();
    const { result } = renderHook(() =>
      useTargetAstroData(null, 40, -74, 0, 0, now)
    );
    expect(result.current).toBeNull();
  });

  it('should compute target data when object is selected', () => {
    const now = new Date();
    const { result } = renderHook(() =>
      useTargetAstroData(mockObject, 40, -74, 10, 30, now)
    );
    expect(result.current).not.toBeNull();
    expect(typeof result.current!.altitude).toBe('number');
    expect(typeof result.current!.azimuth).toBe('number');
    expect(typeof result.current!.moonDistance).toBe('number');
  });
});
