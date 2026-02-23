/**
 * Tests for use-observing-conditions.ts
 * Astronomical observing conditions calculation
 */

import { renderHook } from '@testing-library/react';
import { useObservingConditions } from '../use-observing-conditions';

describe('useObservingConditions', () => {
  it('should return observing conditions object', () => {
    const { result } = renderHook(() => useObservingConditions(40, -74));
    const c = result.current;
    expect(c).toBeDefined();
    expect(typeof c.moonPhaseName).toBe('string');
    expect(typeof c.moonIllumination).toBe('number');
    expect(typeof c.sunAltitude).toBe('number');
    expect(typeof c.isDark).toBe('boolean');
    expect(typeof c.isTwilight).toBe('boolean');
    expect(typeof c.isDay).toBe('boolean');
  });

  it('should have moonIllumination between 0-100', () => {
    const { result } = renderHook(() => useObservingConditions(40, -74));
    expect(result.current.moonIllumination).toBeGreaterThanOrEqual(0);
    expect(result.current.moonIllumination).toBeLessThanOrEqual(100);
  });

  it('should have exactly one of isDark/isTwilight/isDay be true', () => {
    const { result } = renderHook(() => useObservingConditions(40, -74));
    const { isDark, isTwilight, isDay } = result.current;
    const trueCount = [isDark, isTwilight, isDay].filter(Boolean).length;
    expect(trueCount).toBe(1);
  });

  it('should include twilight times', () => {
    const { result } = renderHook(() => useObservingConditions(40, -74));
    expect(result.current.twilight).toBeDefined();
  });
});
