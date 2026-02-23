/**
 * Tests for log-store.ts
 * Log store reactive state management
 */

import { act } from '@testing-library/react';
import { useLogStore } from '../log-store';

describe('useLogStore', () => {
  it('should have initial state', () => {
    const state = useLogStore.getState();
    expect(state.logs).toEqual([]);
    expect(state.isPanelOpen).toBe(false);
    expect(state.autoScroll).toBe(true);
  });

  it('should toggle panel open', () => {
    act(() => {
      useLogStore.getState().togglePanel();
    });
    expect(useLogStore.getState().isPanelOpen).toBe(true);
  });

  it('should set auto scroll', () => {
    act(() => {
      useLogStore.getState().setAutoScroll(false);
    });
    expect(useLogStore.getState().autoScroll).toBe(false);
  });

  it('should set filter', () => {
    act(() => {
      useLogStore.getState().setFilter({ module: 'test' });
    });
    expect(useLogStore.getState().filter.module).toBe('test');
  });

  it('should clear filter', () => {
    act(() => {
      useLogStore.getState().setFilter({ module: 'test' });
      useLogStore.getState().clearFilter();
    });
    expect(useLogStore.getState().filter.module).toBeUndefined();
  });
});
