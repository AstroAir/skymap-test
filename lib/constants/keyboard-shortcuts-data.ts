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
      { key: displayKey(STARMAP_SHORTCUT_KEYS.ZOOM_IN), descriptionKey: 'zoomIn' },
      { key: displayKey(STARMAP_SHORTCUT_KEYS.ZOOM_OUT), descriptionKey: 'zoomOut' },
      { key: displayKey(STARMAP_SHORTCUT_KEYS.RESET_VIEW), descriptionKey: 'resetView' },
      { key: '/', descriptionKey: 'openSearch' },
    ],
  },
  {
    titleKey: 'searchAndPanels',
    iconName: 'Command',
    shortcuts: [
      { key: displayKey(STARMAP_SHORTCUT_KEYS.TOGGLE_SEARCH), modifier: 'Ctrl', descriptionKey: 'toggleSearch' },
      { key: displayKey(STARMAP_SHORTCUT_KEYS.TOGGLE_SESSION_PANEL), descriptionKey: 'toggleSessionPanel' },
      { key: displayKey(STARMAP_SHORTCUT_KEYS.TOGGLE_FOV), descriptionKey: 'toggleFovOverlay' },
      { key: displayKey(STARMAP_SHORTCUT_KEYS.CLOSE_PANEL), descriptionKey: 'closePanel' },
    ],
  },
  {
    titleKey: 'display',
    iconName: 'Eye',
    shortcuts: [
      { key: displayKey(STARMAP_SHORTCUT_KEYS.TOGGLE_CONSTELLATIONS), descriptionKey: 'toggleConstellations' },
      { key: displayKey(STARMAP_SHORTCUT_KEYS.TOGGLE_GRID), descriptionKey: 'toggleGrid' },
      { key: displayKey(STARMAP_SHORTCUT_KEYS.TOGGLE_DSO), descriptionKey: 'toggleDso' },
      { key: displayKey(STARMAP_SHORTCUT_KEYS.TOGGLE_ATMOSPHERE), descriptionKey: 'toggleAtmosphere' },
    ],
  },
  {
    titleKey: 'timeControl',
    iconName: 'Clock',
    shortcuts: [
      { key: displayKey(STARMAP_SHORTCUT_KEYS.PAUSE_TIME), descriptionKey: 'pauseResumeTime' },
      { key: displayKey(STARMAP_SHORTCUT_KEYS.SPEED_UP), descriptionKey: 'speedUpTime' },
      { key: displayKey(STARMAP_SHORTCUT_KEYS.SLOW_DOWN), descriptionKey: 'slowDownTime' },
      { key: displayKey(STARMAP_SHORTCUT_KEYS.RESET_TIME), descriptionKey: 'resetTime' },
    ],
  },
];
