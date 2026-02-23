/**
 * Tests for use-mount-polling.ts
 * Mount state polling hook
 */

import { renderHook } from '@testing-library/react';
import { useMountPolling } from '../use-mount-polling';

jest.mock('@/lib/stores', () => ({
  useMountStore: jest.fn((selector) =>
    selector({
      mountInfo: { Connected: false },
      applyMountState: jest.fn(),
      resetMountInfo: jest.fn(),
    })
  ),
}));

jest.mock('@/lib/tauri/mount-api', () => ({
  mountApi: {
    getState: jest.fn(() => Promise.resolve({ connected: false })),
  },
}));

jest.mock('@/lib/tauri/app-control-api', () => ({
  isTauri: () => false,
}));

describe('useMountPolling', () => {
  it('should not throw when rendered', () => {
    expect(() => {
      renderHook(() => useMountPolling());
    }).not.toThrow();
  });

  it('should accept custom interval', () => {
    expect(() => {
      renderHook(() => useMountPolling(3000));
    }).not.toThrow();
  });
});
