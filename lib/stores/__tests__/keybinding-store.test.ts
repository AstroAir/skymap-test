/**
 * Tests for keybinding-store.ts
 * Custom keyboard shortcut management
 */

import { act } from '@testing-library/react';
import {
  useKeybindingStore,
  DEFAULT_KEYBINDINGS,
  formatKeyBinding,
  eventToKeyBinding,
} from '../keybinding-store';

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

  describe('isCustom', () => {
    it('should return false when no custom binding exists', () => {
      expect(useKeybindingStore.getState().isCustom('ZOOM_IN')).toBe(false);
    });

    it('should return true after setting a custom binding', () => {
      act(() => {
        useKeybindingStore.getState().setBinding('ZOOM_IN', { key: '=' });
      });
      expect(useKeybindingStore.getState().isCustom('ZOOM_IN')).toBe(true);
    });

    it('should return false after resetting a custom binding', () => {
      act(() => {
        useKeybindingStore.getState().setBinding('ZOOM_IN', { key: '=' });
        useKeybindingStore.getState().resetBinding('ZOOM_IN');
      });
      expect(useKeybindingStore.getState().isCustom('ZOOM_IN')).toBe(false);
    });
  });

  describe('findConflict', () => {
    it('should find conflict with default binding', () => {
      const conflict = useKeybindingStore.getState().findConflict({ key: '+' });
      expect(conflict).toBe('ZOOM_IN');
    });

    it('should find conflict with custom binding', () => {
      act(() => {
        useKeybindingStore.getState().setBinding('ZOOM_IN', { key: 'x', ctrl: true });
      });
      const conflict = useKeybindingStore.getState().findConflict({ key: 'x', ctrl: true });
      expect(conflict).toBe('ZOOM_IN');
    });

    it('should return null when no conflict', () => {
      const conflict = useKeybindingStore.getState().findConflict({ key: 'z', ctrl: true, shift: true, alt: true });
      expect(conflict).toBeNull();
    });

    it('should exclude specified action from conflict check', () => {
      const conflict = useKeybindingStore.getState().findConflict({ key: '+' }, 'ZOOM_IN');
      expect(conflict).toBeNull();
    });

    it('should be case-insensitive for key comparison', () => {
      act(() => {
        useKeybindingStore.getState().setBinding('ZOOM_IN', { key: 'A' });
      });
      const conflict = useKeybindingStore.getState().findConflict({ key: 'a' });
      expect(conflict).toBe('ZOOM_IN');
    });
  });
});

describe('formatKeyBinding', () => {
  it('should format simple key', () => {
    expect(formatKeyBinding({ key: 'a' })).toBe('A');
  });

  it('should format with Ctrl modifier', () => {
    expect(formatKeyBinding({ key: 'a', ctrl: true })).toBe('Ctrl+A');
  });

  it('should format with multiple modifiers', () => {
    expect(formatKeyBinding({ key: 'a', ctrl: true, shift: true, alt: true })).toBe('Ctrl+Alt+Shift+A');
  });

  it('should format with Meta modifier', () => {
    expect(formatKeyBinding({ key: 'a', meta: true })).toBe('⌘+A');
  });

  it('should format Space key', () => {
    expect(formatKeyBinding({ key: ' ' })).toBe('Space');
  });

  it('should format Escape key', () => {
    expect(formatKeyBinding({ key: 'Escape' })).toBe('Esc');
  });

  it('should format Enter key', () => {
    expect(formatKeyBinding({ key: 'Enter' })).toBe('Enter');
  });

  it('should format arrow keys', () => {
    expect(formatKeyBinding({ key: 'ArrowUp' })).toBe('↑');
    expect(formatKeyBinding({ key: 'ArrowDown' })).toBe('↓');
    expect(formatKeyBinding({ key: 'ArrowLeft' })).toBe('←');
    expect(formatKeyBinding({ key: 'ArrowRight' })).toBe('→');
  });

  it('should preserve multi-char key names', () => {
    expect(formatKeyBinding({ key: 'F1' })).toBe('F1');
  });
});

describe('eventToKeyBinding', () => {
  function makeEvent(overrides: Partial<KeyboardEvent>): KeyboardEvent {
    return {
      key: 'a',
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      ...overrides,
    } as KeyboardEvent;
  }

  it('should convert keyboard event to binding', () => {
    const result = eventToKeyBinding(makeEvent({ key: 'a', ctrlKey: true }));
    expect(result).toEqual({ key: 'a', ctrl: true, shift: undefined, alt: undefined, meta: undefined });
  });

  it('should return null for standalone modifier keys', () => {
    expect(eventToKeyBinding(makeEvent({ key: 'Control' }))).toBeNull();
    expect(eventToKeyBinding(makeEvent({ key: 'Shift' }))).toBeNull();
    expect(eventToKeyBinding(makeEvent({ key: 'Alt' }))).toBeNull();
    expect(eventToKeyBinding(makeEvent({ key: 'Meta' }))).toBeNull();
  });

  it('should capture all modifiers', () => {
    const result = eventToKeyBinding(makeEvent({
      key: 'a',
      ctrlKey: true,
      shiftKey: true,
      altKey: true,
      metaKey: true,
    }));
    expect(result?.ctrl).toBe(true);
    expect(result?.shift).toBe(true);
    expect(result?.alt).toBe(true);
    expect(result?.meta).toBe(true);
  });
});
