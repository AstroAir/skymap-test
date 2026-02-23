/**
 * Tests for use-time-controls.ts
 * Stellarium time control actions
 */

import { renderHook, act } from '@testing-library/react';
import { useTimeControls } from '../use-time-controls';

function makeStel(speed = 1) {
  return {
    core: {
      time_speed: speed,
      observer: { utc: 0 },
    },
  };
}

describe('useTimeControls', () => {
  it('should return all action handlers', () => {
    const { result } = renderHook(() => useTimeControls(makeStel()));
    expect(result.current.handlePauseTime).toBeDefined();
    expect(result.current.handleSpeedUp).toBeDefined();
    expect(result.current.handleSlowDown).toBeDefined();
    expect(result.current.handleResetTime).toBeDefined();
  });

  it('should pause time (set speed to 0)', () => {
    const stel = makeStel(1);
    const { result } = renderHook(() => useTimeControls(stel));
    act(() => result.current.handlePauseTime());
    expect(stel.core.time_speed).toBe(0);
  });

  it('should resume time (set speed to 1) when paused', () => {
    const stel = makeStel(0);
    const { result } = renderHook(() => useTimeControls(stel));
    act(() => result.current.handlePauseTime());
    expect(stel.core.time_speed).toBe(1);
  });

  it('should speed up (double speed)', () => {
    const stel = makeStel(1);
    const { result } = renderHook(() => useTimeControls(stel));
    act(() => result.current.handleSpeedUp());
    expect(stel.core.time_speed).toBe(2);
  });

  it('should cap speed at 1024', () => {
    const stel = makeStel(1024);
    const { result } = renderHook(() => useTimeControls(stel));
    act(() => result.current.handleSpeedUp());
    expect(stel.core.time_speed).toBe(1024);
  });

  it('should slow down (halve speed)', () => {
    const stel = makeStel(4);
    const { result } = renderHook(() => useTimeControls(stel));
    act(() => result.current.handleSlowDown());
    expect(stel.core.time_speed).toBe(2);
  });

  it('should not slow below 1/1024', () => {
    const stel = makeStel(1 / 1024);
    const { result } = renderHook(() => useTimeControls(stel));
    act(() => result.current.handleSlowDown());
    expect(stel.core.time_speed).toBeCloseTo(1 / 1024);
  });

  it('should reset time to now with speed 1', () => {
    const stel = makeStel(8);
    const { result } = renderHook(() => useTimeControls(stel));
    act(() => result.current.handleResetTime());
    expect(stel.core.time_speed).toBe(1);
    expect(stel.core.observer.utc).toBeGreaterThan(0);
  });

  it('should no-op when stel is null', () => {
    const { result } = renderHook(() => useTimeControls(null));
    // Should not throw
    act(() => {
      result.current.handlePauseTime();
      result.current.handleSpeedUp();
      result.current.handleSlowDown();
      result.current.handleResetTime();
    });
  });
});
