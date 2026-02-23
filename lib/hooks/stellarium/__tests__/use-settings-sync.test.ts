/**
 * Tests for use-settings-sync.ts
 * Stellarium settings debounced sync
 */

import { renderHook } from '@testing-library/react';
import { useSettingsSync } from '../use-settings-sync';
import { useRef } from 'react';

jest.mock('@/lib/stores', () => ({
  useSettingsStore: jest.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({ stellarium: {} })
  ),
  useStellariumStore: jest.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({ updateStellariumCore: jest.fn() })
  ),
}));

describe('useSettingsSync', () => {
  it('should return stellariumSettings and settingsTimeoutRef', () => {
    const { result } = renderHook(() => {
      const ref = useRef(null);
      return useSettingsSync(ref, false);
    });
    expect(result.current.stellariumSettings).toBeDefined();
    expect(result.current.settingsTimeoutRef).toBeDefined();
  });

  it('should not apply settings when engine is not ready', () => {
    const { result } = renderHook(() => {
      const ref = useRef(null);
      return useSettingsSync(ref, false);
    });
    expect(result.current.settingsTimeoutRef.current).toBeNull();
  });
});
