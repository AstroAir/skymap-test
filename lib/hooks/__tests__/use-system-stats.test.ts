/**
 * Tests for use-system-stats.ts
 * System performance metrics hook
 */

import { renderHook } from '@testing-library/react';
import { useSystemStats } from '../use-system-stats';

jest.mock('@/lib/tauri/app-control-api', () => ({
  isTauri: () => false,
}));

describe('useSystemStats', () => {
  it('should return initial stats', () => {
    const { result } = renderHook(() => useSystemStats());
    expect(result.current.online).toBe(true);
    expect(result.current.isTauriEnv).toBe(false);
    expect(result.current.memoryUsage).toBeNull();
  });

  it('should detect non-Tauri environment', () => {
    const { result } = renderHook(() => useSystemStats());
    expect(result.current.isTauriEnv).toBe(false);
  });
});
