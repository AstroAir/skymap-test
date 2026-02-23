/**
 * Tests for use-night-mode.ts
 * Night mode CSS class management
 */

import { renderHook } from '@testing-library/react';
import { useNightModeEffect } from '../use-night-mode';

describe('useNightModeEffect', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('night-mode');
  });

  it('should add night-mode class when enabled', () => {
    renderHook(() => useNightModeEffect(true));
    expect(document.documentElement.classList.contains('night-mode')).toBe(true);
  });

  it('should remove night-mode class when disabled', () => {
    document.documentElement.classList.add('night-mode');
    renderHook(() => useNightModeEffect(false));
    expect(document.documentElement.classList.contains('night-mode')).toBe(false);
  });

  it('should toggle class on re-render', () => {
    const { rerender } = renderHook(
      ({ enabled }) => useNightModeEffect(enabled),
      { initialProps: { enabled: true } }
    );
    expect(document.documentElement.classList.contains('night-mode')).toBe(true);

    rerender({ enabled: false });
    expect(document.documentElement.classList.contains('night-mode')).toBe(false);
  });
});
