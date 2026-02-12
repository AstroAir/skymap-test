/**
 * Keyboard Shortcuts - Data Constants & Utilities
 *
 * Static shortcut group definitions and display formatting utilities
 * for the keyboard shortcuts dialog.
 */

import type { ShortcutGroupDefinition } from '@/types/keyboard-shortcuts';
import { STARMAP_SHORTCUT_KEYS } from '@/lib/hooks';

// ============================================================================
// Utilities
// ============================================================================

/**
 * Format a shortcut key for display (uppercase letters, named keys)
 */
export function displayKey(key: string): string {
  if (key === ' ') return 'Space';
  if (key === 'Escape') return 'Esc';
  if (key.length === 1) return key.toUpperCase();
  return key;
}

// ============================================================================
// Shortcut Group Definitions
// ============================================================================

export const SHORTCUT_GROUP_DEFINITIONS: ShortcutGroupDefinition[] = [
  {
    titleKey: 'navigation',
    iconName: 'Navigation',
    shortcuts: [
      { key: displayKey(STARMAP_SHORTCUT_KEYS.ZOOM_IN), descriptionKey: 'zoomIn', actionId: 'ZOOM_IN' },
      { key: displayKey(STARMAP_SHORTCUT_KEYS.ZOOM_OUT), descriptionKey: 'zoomOut', actionId: 'ZOOM_OUT' },
      { key: displayKey(STARMAP_SHORTCUT_KEYS.RESET_VIEW), descriptionKey: 'resetView', actionId: 'RESET_VIEW' },
      { key: '/', descriptionKey: 'openSearch' },
    ],
  },
  {
    titleKey: 'searchAndPanels',
    iconName: 'Command',
    shortcuts: [
      { key: displayKey(STARMAP_SHORTCUT_KEYS.TOGGLE_SEARCH), modifier: 'Ctrl', descriptionKey: 'toggleSearch', actionId: 'TOGGLE_SEARCH' },
      { key: displayKey(STARMAP_SHORTCUT_KEYS.TOGGLE_SESSION_PANEL), descriptionKey: 'toggleSessionPanel', actionId: 'TOGGLE_SESSION_PANEL' },
      { key: displayKey(STARMAP_SHORTCUT_KEYS.TOGGLE_FOV), descriptionKey: 'toggleFovOverlay', actionId: 'TOGGLE_FOV' },
      { key: displayKey(STARMAP_SHORTCUT_KEYS.CLOSE_PANEL), descriptionKey: 'closePanel', actionId: 'CLOSE_PANEL' },
    ],
  },
  {
    titleKey: 'display',
    iconName: 'Eye',
    shortcuts: [
      { key: displayKey(STARMAP_SHORTCUT_KEYS.TOGGLE_CONSTELLATIONS), descriptionKey: 'toggleConstellations', actionId: 'TOGGLE_CONSTELLATIONS' },
      { key: displayKey(STARMAP_SHORTCUT_KEYS.TOGGLE_GRID), descriptionKey: 'toggleGrid', actionId: 'TOGGLE_GRID' },
      { key: displayKey(STARMAP_SHORTCUT_KEYS.TOGGLE_DSO), descriptionKey: 'toggleDso', actionId: 'TOGGLE_DSO' },
      { key: displayKey(STARMAP_SHORTCUT_KEYS.TOGGLE_ATMOSPHERE), descriptionKey: 'toggleAtmosphere', actionId: 'TOGGLE_ATMOSPHERE' },
    ],
  },
  {
    titleKey: 'timeControl',
    iconName: 'Clock',
    shortcuts: [
      { key: displayKey(STARMAP_SHORTCUT_KEYS.PAUSE_TIME), descriptionKey: 'pauseResumeTime', actionId: 'PAUSE_TIME' },
      { key: displayKey(STARMAP_SHORTCUT_KEYS.SPEED_UP), descriptionKey: 'speedUpTime', actionId: 'SPEED_UP' },
      { key: displayKey(STARMAP_SHORTCUT_KEYS.SLOW_DOWN), descriptionKey: 'slowDownTime', actionId: 'SLOW_DOWN' },
      { key: displayKey(STARMAP_SHORTCUT_KEYS.RESET_TIME), descriptionKey: 'resetTime', actionId: 'RESET_TIME' },
    ],
  },
];
