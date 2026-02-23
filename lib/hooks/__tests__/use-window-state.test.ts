/**
 * Tests for use-window-state.ts
 * Window state persistence hook
 */

import { renderHook } from '@testing-library/react';
import { useWindowState } from '../use-window-state';

jest.mock('@/lib/tauri/app-control-api', () => ({
  isTauri: () => false,
  saveWindowState: jest.fn(() => Promise.resolve()),
  restoreWindowState: jest.fn(() => Promise.resolve()),
}));

describe('useWindowState', () => {
  it('should not throw in non-Tauri environment', () => {
    expect(() => {
      renderHook(() => useWindowState());
    }).not.toThrow();
  });

  it('should return without error', () => {
    const { result } = renderHook(() => useWindowState());
    expect(result.current).toBeUndefined(); // hook returns void
  });
});
