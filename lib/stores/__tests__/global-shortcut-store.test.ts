/**
 * Tests for global-shortcut-store.ts
 * Global shortcut validation, conflict detection, and persisted state behavior.
 */

import { act } from '@testing-library/react';
import {
  DEFAULT_GLOBAL_SHORTCUT_BINDINGS,
  eventToGlobalShortcutAccelerator,
  findConflictWithLocalKeybindings,
  formatGlobalShortcutAccelerator,
  normalizeGlobalShortcutAccelerator,
  useGlobalShortcutStore,
  validateGlobalShortcutAccelerator,
} from '../global-shortcut-store';
import { DEFAULT_KEYBINDINGS } from '../keybinding-store';

beforeEach(() => {
  act(() => {
    useGlobalShortcutStore.getState().resetAllBindings();
    useGlobalShortcutStore.getState().setEnabled(false);
  });
});

describe('useGlobalShortcutStore', () => {
  it('starts disabled with default bindings', () => {
    const state = useGlobalShortcutStore.getState();
    expect(state.enabled).toBe(false);
    expect(state.getBinding('TOGGLE_SEARCH')).toBe(DEFAULT_GLOBAL_SHORTCUT_BINDINGS.TOGGLE_SEARCH);
  });

  it('sets and reads custom binding', () => {
    let result;
    act(() => {
      result = useGlobalShortcutStore.getState().setBinding('TOGGLE_SEARCH', 'Ctrl+Shift+K');
    });
    expect(result).toEqual(expect.objectContaining({ ok: true, normalized: 'Control+Shift+K' }));
    expect(useGlobalShortcutStore.getState().getBinding('TOGGLE_SEARCH')).toBe('Control+Shift+K');
  });

  it('rejects invalid binding', () => {
    let result;
    act(() => {
      result = useGlobalShortcutStore.getState().setBinding('TOGGLE_SEARCH', 'F');
    });
    expect(result).toEqual(expect.objectContaining({ ok: false }));
    expect(useGlobalShortcutStore.getState().isCustom('TOGGLE_SEARCH')).toBe(false);
  });

  it('detects conflicts between global actions', () => {
    act(() => {
      useGlobalShortcutStore.getState().setBinding('TOGGLE_SEARCH', 'Ctrl+Shift+K');
    });

    let result;
    act(() => {
      result = useGlobalShortcutStore.getState().setBinding('TOGGLE_SESSION_PANEL', 'Ctrl+Shift+K');
    });

    expect(result).toEqual(expect.objectContaining({
      ok: false,
      conflictWith: 'TOGGLE_SEARCH',
    }));
  });

  it('resets one binding and all bindings', () => {
    act(() => {
      useGlobalShortcutStore.getState().setBinding('TOGGLE_SEARCH', 'Ctrl+Shift+K');
      useGlobalShortcutStore.getState().setBinding('TOGGLE_SESSION_PANEL', 'Ctrl+Shift+J');
      useGlobalShortcutStore.getState().resetBinding('TOGGLE_SEARCH');
    });

    expect(useGlobalShortcutStore.getState().isCustom('TOGGLE_SEARCH')).toBe(false);
    expect(useGlobalShortcutStore.getState().isCustom('TOGGLE_SESSION_PANEL')).toBe(true);

    act(() => {
      useGlobalShortcutStore.getState().resetAllBindings();
    });

    expect(useGlobalShortcutStore.getState().customBindings).toEqual({});
    expect(useGlobalShortcutStore.getState().registrationErrors).toEqual({});
  });

  it('tracks registration errors', () => {
    act(() => {
      useGlobalShortcutStore.getState().setRegistrationError('TOGGLE_SEARCH', 'taken');
    });
    expect(useGlobalShortcutStore.getState().registrationErrors.TOGGLE_SEARCH).toBe('taken');

    act(() => {
      useGlobalShortcutStore.getState().clearRegistrationError('TOGGLE_SEARCH');
    });
    expect(useGlobalShortcutStore.getState().registrationErrors.TOGGLE_SEARCH).toBeUndefined();
  });
});

describe('global shortcut helpers', () => {
  it('normalizes and validates accelerators', () => {
    expect(normalizeGlobalShortcutAccelerator('ctrl+shift+k')).toBe('Control+Shift+K');
    expect(validateGlobalShortcutAccelerator('ctrl+shift+k')).toEqual({
      valid: true,
      normalized: 'Control+Shift+K',
      error: null,
    });
  });

  it('rejects malformed accelerators', () => {
    const result = validateGlobalShortcutAccelerator('Shift');
    expect(result.valid).toBe(false);
    expect(result.normalized).toBeNull();
  });

  it('converts keyboard events to accelerators', () => {
    const accelerator = eventToGlobalShortcutAccelerator({
      key: 'k',
      code: 'KeyK',
      ctrlKey: true,
      metaKey: false,
      altKey: false,
      shiftKey: true,
    } as KeyboardEvent);

    expect(accelerator).toBe('CommandOrControl+Shift+K');
  });

  it('formats accelerators for display', () => {
    expect(formatGlobalShortcutAccelerator('CommandOrControl+Shift+K')).toBe('Ctrl/Cmd+Shift+K');
  });

  it('detects conflicts with local keybindings', () => {
    const conflict = findConflictWithLocalKeybindings(
      'Control+G',
      { ...DEFAULT_KEYBINDINGS },
    );
    expect(conflict).toBeNull();

    const sameAsSearch = findConflictWithLocalKeybindings(
      'Control+F',
      { ...DEFAULT_KEYBINDINGS },
    );
    expect(sameAsSearch).toBe('TOGGLE_SEARCH');
  });
});

