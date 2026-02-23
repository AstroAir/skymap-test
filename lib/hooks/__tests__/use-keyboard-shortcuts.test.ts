/**
 * Tests for use-keyboard-shortcuts.ts
 * Global keyboard shortcut matching and execution
 */

import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from '../use-keyboard-shortcuts';

describe('useKeyboardShortcuts', () => {
  it('should register and respond to a shortcut', () => {
    const action = jest.fn();
    renderHook(() =>
      useKeyboardShortcuts({
        shortcuts: [{ key: 'a', description: 'Test', action }],
      })
    );

    const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true });
    document.dispatchEvent(event);
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('should not fire when disabled', () => {
    const action = jest.fn();
    renderHook(() =>
      useKeyboardShortcuts({
        shortcuts: [{ key: 'b', description: 'Test', action }],
        enabled: false,
      })
    );

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', bubbles: true }));
    expect(action).not.toHaveBeenCalled();
  });

  it('should match modifier keys', () => {
    const action = jest.fn();
    renderHook(() =>
      useKeyboardShortcuts({
        shortcuts: [{ key: 'f', ctrl: true, description: 'Find', action }],
      })
    );

    // Without ctrl → should NOT fire
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'f', bubbles: true }));
    expect(action).not.toHaveBeenCalled();

    // With ctrl → should fire
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'f', ctrlKey: true, bubbles: true }));
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('should ignore shortcuts when input is focused by default', () => {
    const action = jest.fn();
    renderHook(() =>
      useKeyboardShortcuts({
        shortcuts: [{ key: 'a', description: 'Test', action }],
      })
    );

    // Create and focus an input
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
    expect(action).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });

  it('should fire even when input focused if ignoreInputs is false', () => {
    const action = jest.fn();
    renderHook(() =>
      useKeyboardShortcuts({
        shortcuts: [{ key: 'a', description: 'Test', action, ignoreInputs: false }],
      })
    );

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
    expect(action).toHaveBeenCalledTimes(1);

    document.body.removeChild(input);
  });
});
