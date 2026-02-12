/**
 * Keybinding Store - Custom keyboard shortcut management
 *
 * Persists user-customized key bindings. Each action ID maps to a key combination.
 * Falls back to defaults from STARMAP_SHORTCUT_KEYS when no custom binding exists.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getZustandStorage } from '@/lib/storage';

// ============================================================================
// Types
// ============================================================================

export interface KeyBinding {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
}

/** All customizable action IDs, matching STARMAP_SHORTCUT_KEYS keys */
export type ShortcutActionId =
  | 'ZOOM_IN'
  | 'ZOOM_OUT'
  | 'RESET_VIEW'
  | 'TOGGLE_SEARCH'
  | 'TOGGLE_SESSION_PANEL'
  | 'TOGGLE_FOV'
  | 'TOGGLE_CONSTELLATIONS'
  | 'TOGGLE_GRID'
  | 'TOGGLE_DSO'
  | 'TOGGLE_ATMOSPHERE'
  | 'PAUSE_TIME'
  | 'SPEED_UP'
  | 'SLOW_DOWN'
  | 'RESET_TIME'
  | 'CLOSE_PANEL';

// ============================================================================
// Default Bindings
// ============================================================================

export const DEFAULT_KEYBINDINGS: Record<ShortcutActionId, KeyBinding> = {
  ZOOM_IN: { key: '+' },
  ZOOM_OUT: { key: '-' },
  RESET_VIEW: { key: 'r' },
  TOGGLE_SEARCH: { key: 'f', ctrl: true },
  TOGGLE_SESSION_PANEL: { key: 'p' },
  TOGGLE_FOV: { key: 'o' },
  TOGGLE_CONSTELLATIONS: { key: 'l' },
  TOGGLE_GRID: { key: 'g' },
  TOGGLE_DSO: { key: 'd' },
  TOGGLE_ATMOSPHERE: { key: 'a' },
  PAUSE_TIME: { key: ' ' },
  SPEED_UP: { key: ']' },
  SLOW_DOWN: { key: '[' },
  RESET_TIME: { key: 't' },
  CLOSE_PANEL: { key: 'Escape' },
};

// ============================================================================
// Store
// ============================================================================

interface KeybindingState {
  /** Custom overrides — only contains entries the user has changed */
  customBindings: Partial<Record<ShortcutActionId, KeyBinding>>;

  /** Get the effective binding for an action (custom or default) */
  getBinding: (actionId: ShortcutActionId) => KeyBinding;

  /** Set a custom binding for an action */
  setBinding: (actionId: ShortcutActionId, binding: KeyBinding) => void;

  /** Reset a single action to its default */
  resetBinding: (actionId: ShortcutActionId) => void;

  /** Reset all bindings to defaults */
  resetAllBindings: () => void;

  /** Check if an action has a custom binding */
  isCustom: (actionId: ShortcutActionId) => boolean;

  /** Find conflicting action for a given binding (returns null if no conflict) */
  findConflict: (binding: KeyBinding, excludeAction?: ShortcutActionId) => ShortcutActionId | null;
}

function bindingsEqual(a: KeyBinding, b: KeyBinding): boolean {
  return (
    a.key.toLowerCase() === b.key.toLowerCase() &&
    !!a.ctrl === !!b.ctrl &&
    !!a.shift === !!b.shift &&
    !!a.alt === !!b.alt &&
    !!a.meta === !!b.meta
  );
}

export const useKeybindingStore = create<KeybindingState>()(
  persist(
    (set, get) => ({
      customBindings: {},

      getBinding: (actionId) => {
        return get().customBindings[actionId] ?? DEFAULT_KEYBINDINGS[actionId];
      },

      setBinding: (actionId, binding) => {
        set((state) => ({
          customBindings: {
            ...state.customBindings,
            [actionId]: binding,
          },
        }));
      },

      resetBinding: (actionId) => {
        set((state) => {
          const next = { ...state.customBindings };
          delete next[actionId];
          return { customBindings: next };
        });
      },

      resetAllBindings: () => {
        set({ customBindings: {} });
      },

      isCustom: (actionId) => {
        return actionId in get().customBindings;
      },

      findConflict: (binding, excludeAction) => {
        const state = get();
        const allIds = Object.keys(DEFAULT_KEYBINDINGS) as ShortcutActionId[];
        for (const id of allIds) {
          if (id === excludeAction) continue;
          const current = state.customBindings[id] ?? DEFAULT_KEYBINDINGS[id];
          if (bindingsEqual(current, binding)) {
            return id;
          }
        }
        return null;
      },
    }),
    {
      name: 'starmap-keybindings',
      storage: getZustandStorage(),
      version: 1,
      partialize: (state) => ({ customBindings: state.customBindings }),
    }
  )
);

// ============================================================================
// Helpers
// ============================================================================

/**
 * Format a KeyBinding for display (e.g. "Ctrl+Shift+A")
 */
export function formatKeyBinding(binding: KeyBinding): string {
  const parts: string[] = [];
  if (binding.ctrl) parts.push('Ctrl');
  if (binding.alt) parts.push('Alt');
  if (binding.shift) parts.push('Shift');
  if (binding.meta) parts.push('⌘');

  let key = binding.key;
  switch (key.toLowerCase()) {
    case ' ': key = 'Space'; break;
    case 'escape': key = 'Esc'; break;
    case 'enter': key = 'Enter'; break;
    case 'arrowup': key = '↑'; break;
    case 'arrowdown': key = '↓'; break;
    case 'arrowleft': key = '←'; break;
    case 'arrowright': key = '→'; break;
    default:
      if (key.length === 1) key = key.toUpperCase();
  }
  parts.push(key);
  return parts.join('+');
}

/**
 * Parse a KeyboardEvent into a KeyBinding
 */
export function eventToKeyBinding(e: KeyboardEvent): KeyBinding | null {
  // Ignore standalone modifier keys
  if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
    return null;
  }
  return {
    key: e.key,
    ctrl: e.ctrlKey || undefined,
    shift: e.shiftKey || undefined,
    alt: e.altKey || undefined,
    meta: e.metaKey || undefined,
  };
}
