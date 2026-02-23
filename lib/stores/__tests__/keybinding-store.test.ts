/**
 * Tests for keybinding-store.ts
 * Custom keyboard shortcut management
 */

import { act } from '@testing-library/react';
import { useKeybindingStore, DEFAULT_KEYBINDINGS } from '../keybinding-store';

beforeEach(() => {
  act(() => {
    useKeybindingStore.getState().resetAllBindings();
  });
});

describe('useKeybindingStore', () => {
  it('should provide default keybindings', () => {
    expect(DEFAULT_KEYBINDINGS).toBeDefined();
    expect(DEFAULT_KEYBINDINGS.ZOOM_IN).toBeDefined();
    expect(DEFAULT_KEYBINDINGS.ZOOM_IN.key).toBe('+');
  });

  it('should get effective binding falling back to default', () => {
    const binding = useKeybindingStore.getState().getBinding('ZOOM_IN');
    expect(binding).toEqual(DEFAULT_KEYBINDINGS.ZOOM_IN);
  });

  it('should set a custom binding', () => {
    act(() => {
      useKeybindingStore.getState().setBinding('ZOOM_IN', { key: '=', ctrl: true });
    });
    const binding = useKeybindingStore.getState().getBinding('ZOOM_IN');
    expect(binding.key).toBe('=');
    expect(binding.ctrl).toBe(true);
  });

  it('should reset a single binding to default', () => {
    act(() => {
      useKeybindingStore.getState().setBinding('ZOOM_IN', { key: '=' });
      useKeybindingStore.getState().resetBinding('ZOOM_IN');
    });
    const binding = useKeybindingStore.getState().getBinding('ZOOM_IN');
    expect(binding).toEqual(DEFAULT_KEYBINDINGS.ZOOM_IN);
  });

  it('should reset all bindings', () => {
    act(() => {
      useKeybindingStore.getState().setBinding('ZOOM_IN', { key: '=' });
      useKeybindingStore.getState().setBinding('ZOOM_OUT', { key: '_' });
      useKeybindingStore.getState().resetAllBindings();
    });
    expect(useKeybindingStore.getState().customBindings).toEqual({});
  });
});
