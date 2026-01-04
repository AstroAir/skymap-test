/**
 * Global keyboard shortcuts hook for star map navigation
 */

import { useEffect, useCallback, useRef } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  description: string;
  action: () => void;
  /** Only trigger when no input is focused (default: true) */
  ignoreInputs?: boolean;
}

export interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

/**
 * Check if an element is an input-like element
 */
function isInputElement(element: Element | null): boolean {
  if (!element) return false;
  const tagName = element.tagName.toLowerCase();
  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    (element as HTMLElement).isContentEditable
  );
}

/**
 * Hook for managing global keyboard shortcuts
 */
export function useKeyboardShortcuts({
  shortcuts,
  enabled = true,
}: UseKeyboardShortcutsOptions): void {
  const shortcutsRef = useRef(shortcuts);

  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    const activeElement = document.activeElement;
    const key = event.key.toLowerCase();

    for (const shortcut of shortcutsRef.current) {
      // Check if we should ignore this shortcut when an input is focused
      if (shortcut.ignoreInputs !== false && isInputElement(activeElement)) {
        continue;
      }

      // Match the key
      if (shortcut.key.toLowerCase() !== key) continue;

      // Match modifiers
      if (shortcut.ctrl && !event.ctrlKey) continue;
      if (shortcut.shift && !event.shiftKey) continue;
      if (shortcut.alt && !event.altKey) continue;
      if (shortcut.meta && !event.metaKey) continue;

      // If modifiers are not specified but pressed, skip (for simple shortcuts)
      if (!shortcut.ctrl && event.ctrlKey) continue;
      if (!shortcut.shift && event.shiftKey) continue;
      if (!shortcut.alt && event.altKey) continue;
      if (!shortcut.meta && event.metaKey) continue;

      // Execute the action
      event.preventDefault();
      event.stopPropagation();
      shortcut.action();
      return;
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [handleKeyDown, enabled]);
}

/**
 * Predefined shortcut keys for common star map actions
 */
export const STARMAP_SHORTCUT_KEYS = {
  // Navigation
  ZOOM_IN: '+',
  ZOOM_OUT: '-',
  RESET_VIEW: 'r',
  CENTER_VIEW: 'c',
  
  // Panels
  TOGGLE_SEARCH: 'f',
  TOGGLE_SETTINGS: ',',
  TOGGLE_SESSION_PANEL: 'p',
  TOGGLE_FOV: 'o',
  
  // Display
  TOGGLE_CONSTELLATIONS: 'l',
  TOGGLE_GRID: 'g',
  TOGGLE_DSO: 'd',
  TOGGLE_ATMOSPHERE: 'a',
  
  // Time
  PAUSE_TIME: ' ', // Space
  SPEED_UP: ']',
  SLOW_DOWN: '[',
  RESET_TIME: 't',
  
  // Object actions
  ADD_TO_LIST: 'Enter',
  CLOSE_PANEL: 'Escape',
} as const;

/**
 * Format shortcut for display
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];
  
  if (shortcut.ctrl) parts.push('Ctrl');
  if (shortcut.alt) parts.push('Alt');
  if (shortcut.shift) parts.push('Shift');
  if (shortcut.meta) parts.push('⌘');
  
  // Format special keys
  let key = shortcut.key;
  switch (key.toLowerCase()) {
    case ' ':
      key = 'Space';
      break;
    case 'escape':
      key = 'Esc';
      break;
    case 'enter':
      key = '↵';
      break;
    case 'arrowup':
      key = '↑';
      break;
    case 'arrowdown':
      key = '↓';
      break;
    case 'arrowleft':
      key = '←';
      break;
    case 'arrowright':
      key = '→';
      break;
    default:
      key = key.toUpperCase();
  }
  
  parts.push(key);
  return parts.join('+');
}
