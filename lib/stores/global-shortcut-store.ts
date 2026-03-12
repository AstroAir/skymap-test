/**
 * Global Shortcut Store
 *
 * Tracks desktop global shortcut preferences and runtime registration status.
 * Uses accelerator strings as canonical persisted format.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getZustandStorage } from '@/lib/storage';
import type { KeyBinding } from './keybinding-store';

export type GlobalShortcutActionId =
  | 'FOCUS_MAIN_WINDOW'
  | 'TOGGLE_SEARCH'
  | 'TOGGLE_SESSION_PANEL'
  | 'MOUNT_ABORT_SLEW';

export const DEFAULT_GLOBAL_SHORTCUT_ENABLED = false;

export const DEFAULT_GLOBAL_SHORTCUT_BINDINGS: Record<GlobalShortcutActionId, string> = {
  FOCUS_MAIN_WINDOW: 'CommandOrControl+Shift+Space',
  TOGGLE_SEARCH: 'CommandOrControl+Shift+F',
  TOGGLE_SESSION_PANEL: 'CommandOrControl+Shift+P',
  MOUNT_ABORT_SLEW: 'CommandOrControl+Alt+Shift+X',
};

const MODIFIER_ORDER = ['CommandOrControl', 'Command', 'Control', 'Alt', 'Shift', 'Super'] as const;
const MODIFIER_ALIASES: Record<string, (typeof MODIFIER_ORDER)[number]> = {
  CMDORCTRL: 'CommandOrControl',
  COMMANDORCONTROL: 'CommandOrControl',
  COMMANDORCTRL: 'CommandOrControl',
  CONTROLORCOMMAND: 'CommandOrControl',
  COMMAND: 'Command',
  CMD: 'Command',
  META: 'Command',
  CTRL: 'Control',
  CONTROL: 'Control',
  ALT: 'Alt',
  OPTION: 'Alt',
  SHIFT: 'Shift',
  SUPER: 'Super',
  WIN: 'Super',
  WINDOWS: 'Super',
};

const KEY_ALIASES: Record<string, string> = {
  ESC: 'Escape',
  RETURN: 'Enter',
  SPACE: 'Space',
  SPACEBAR: 'Space',
  LEFT: 'ArrowLeft',
  RIGHT: 'ArrowRight',
  UP: 'ArrowUp',
  DOWN: 'ArrowDown',
  DEL: 'Delete',
  INS: 'Insert',
  PGUP: 'PageUp',
  PGDN: 'PageDown',
  PLUS: 'Plus',
  MINUS: 'Minus',
};

const SPECIAL_KEYS = new Set([
  'Escape',
  'Enter',
  'Tab',
  'Backspace',
  'Delete',
  'Insert',
  'Home',
  'End',
  'PageUp',
  'PageDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Space',
  'Plus',
  'Minus',
  'CapsLock',
  'NumLock',
  'ScrollLock',
  'PrintScreen',
  'Pause',
]);

const DISPLAY_TOKEN_MAP: Record<string, string> = {
  CommandOrControl: 'Ctrl/Cmd',
  Command: 'Cmd',
  Control: 'Ctrl',
  Alt: 'Alt',
  Shift: 'Shift',
  Super: 'Super',
  ArrowLeft: '←',
  ArrowRight: '→',
  ArrowUp: '↑',
  ArrowDown: '↓',
  Space: 'Space',
  Escape: 'Esc',
};

export interface GlobalShortcutValidationResult {
  valid: boolean;
  normalized: string | null;
  error: string | null;
}

export interface GlobalShortcutBindingUpdateResult {
  ok: boolean;
  normalized: string | null;
  error: string | null;
  conflictWith: GlobalShortcutActionId | null;
}

function normalizeKeyToken(rawToken: string): string | null {
  const token = rawToken.trim();
  if (!token) return null;

  const upper = token.toUpperCase();
  if (upper in KEY_ALIASES) {
    return KEY_ALIASES[upper];
  }

  if (upper.length === 1 && /^[A-Z0-9]$/.test(upper)) {
    return upper;
  }

  if (/^F([1-9]|1[0-2])$/.test(upper)) {
    return upper;
  }

  if (/^NUMPAD[0-9]$/.test(upper)) {
    return upper.replace('NUMPAD', 'Numpad');
  }

  return SPECIAL_KEYS.has(token) ? token : null;
}

function normalizeModifierToken(rawToken: string): (typeof MODIFIER_ORDER)[number] | null {
  const token = rawToken.trim();
  if (!token) return null;
  return MODIFIER_ALIASES[token.toUpperCase()] ?? null;
}

export function validateGlobalShortcutAccelerator(accelerator: string): GlobalShortcutValidationResult {
  const tokens = accelerator
    .split('+')
    .map((part) => part.trim())
    .filter(Boolean);

  if (tokens.length < 2) {
    return {
      valid: false,
      normalized: null,
      error: 'Shortcut must include at least one modifier and one key',
    };
  }

  const modifiers = new Set<(typeof MODIFIER_ORDER)[number]>();
  let keyToken: string | null = null;

  for (const token of tokens) {
    const modifier = normalizeModifierToken(token);
    if (modifier) {
      modifiers.add(modifier);
      continue;
    }

    const key = normalizeKeyToken(token);
    if (!key) {
      return {
        valid: false,
        normalized: null,
        error: `Unsupported key token: ${token}`,
      };
    }

    if (keyToken) {
      return {
        valid: false,
        normalized: null,
        error: 'Shortcut must contain exactly one non-modifier key',
      };
    }

    keyToken = key;
  }

  if (!keyToken) {
    return {
      valid: false,
      normalized: null,
      error: 'Shortcut must include a non-modifier key',
    };
  }

  if (modifiers.size === 0) {
    return {
      valid: false,
      normalized: null,
      error: 'Shortcut must include at least one modifier',
    };
  }

  const orderedModifiers = MODIFIER_ORDER.filter((modifier) => modifiers.has(modifier));
  return {
    valid: true,
    normalized: [...orderedModifiers, keyToken].join('+'),
    error: null,
  };
}

export function normalizeGlobalShortcutAccelerator(accelerator: string): string | null {
  const result = validateGlobalShortcutAccelerator(accelerator);
  return result.valid ? result.normalized : null;
}

export function acceleratorsEqual(left: string, right: string): boolean {
  const normalizedLeft = normalizeGlobalShortcutAccelerator(left);
  const normalizedRight = normalizeGlobalShortcutAccelerator(right);
  return normalizedLeft !== null && normalizedLeft === normalizedRight;
}

export function keyBindingToAccelerator(binding: KeyBinding): string | null {
  const modifiers: string[] = [];
  if (binding.ctrl) modifiers.push('Control');
  if (binding.alt) modifiers.push('Alt');
  if (binding.shift) modifiers.push('Shift');
  if (binding.meta) modifiers.push('Command');

  const key = normalizeKeyToken(binding.key);
  if (!key) return null;
  if (modifiers.length === 0) return null;

  return normalizeGlobalShortcutAccelerator([...modifiers, key].join('+'));
}

function normalizeKeyboardEventKey(event: KeyboardEvent): string | null {
  const key = event.key;
  const code = event.code;

  if (code.startsWith('Key') && code.length === 4) {
    return code.slice(3).toUpperCase();
  }

  if (code.startsWith('Digit') && code.length === 6) {
    return code.slice(5);
  }

  if (/^F([1-9]|1[0-2])$/.test(key.toUpperCase())) {
    return key.toUpperCase();
  }

  switch (key) {
    case 'Escape':
    case 'Enter':
    case 'Tab':
    case 'Backspace':
    case 'Delete':
    case 'Insert':
    case 'Home':
    case 'End':
    case 'PageUp':
    case 'PageDown':
      return key;
    case 'ArrowLeft':
    case 'ArrowRight':
    case 'ArrowUp':
    case 'ArrowDown':
      return key;
    case ' ':
      return 'Space';
    case '+':
      return 'Plus';
    case '-':
      return 'Minus';
    default:
      return normalizeKeyToken(key);
  }
}

export function eventToGlobalShortcutAccelerator(event: KeyboardEvent): string | null {
  if (['Control', 'Meta', 'Shift', 'Alt'].includes(event.key)) {
    return null;
  }

  const key = normalizeKeyboardEventKey(event);
  if (!key) return null;

  const tokens: string[] = [];
  if (event.ctrlKey || event.metaKey) tokens.push('CommandOrControl');
  if (event.altKey) tokens.push('Alt');
  if (event.shiftKey) tokens.push('Shift');
  tokens.push(key);

  return normalizeGlobalShortcutAccelerator(tokens.join('+'));
}

export function formatGlobalShortcutAccelerator(accelerator: string): string {
  const normalized = normalizeGlobalShortcutAccelerator(accelerator);
  if (!normalized) return accelerator;

  return normalized
    .split('+')
    .map((token) => DISPLAY_TOKEN_MAP[token] ?? token)
    .join('+');
}

export function findConflictWithLocalKeybindings(
  accelerator: string,
  keybindings: Record<string, KeyBinding>,
): string | null {
  const normalizedAccelerator = normalizeGlobalShortcutAccelerator(accelerator);
  if (!normalizedAccelerator) return null;

  for (const [actionId, binding] of Object.entries(keybindings)) {
    const localAccelerator = keyBindingToAccelerator(binding);
    if (!localAccelerator) continue;
    if (normalizedAccelerator === localAccelerator) {
      return actionId;
    }
  }

  return null;
}

interface GlobalShortcutState {
  enabled: boolean;
  customBindings: Partial<Record<GlobalShortcutActionId, string>>;
  registrationErrors: Partial<Record<GlobalShortcutActionId, string>>;

  setEnabled: (enabled: boolean) => void;
  getBinding: (actionId: GlobalShortcutActionId) => string;
  getAllBindings: () => Record<GlobalShortcutActionId, string>;
  setBinding: (
    actionId: GlobalShortcutActionId,
    accelerator: string,
  ) => GlobalShortcutBindingUpdateResult;
  resetBinding: (actionId: GlobalShortcutActionId) => void;
  resetAllBindings: () => void;
  isCustom: (actionId: GlobalShortcutActionId) => boolean;
  findConflict: (
    accelerator: string,
    excludeActionId?: GlobalShortcutActionId,
  ) => GlobalShortcutActionId | null;
  setRegistrationError: (actionId: GlobalShortcutActionId, error: string) => void;
  clearRegistrationError: (actionId: GlobalShortcutActionId) => void;
  clearRegistrationErrors: () => void;
}

export const useGlobalShortcutStore = create<GlobalShortcutState>()(
  persist(
    (set, get) => ({
      enabled: DEFAULT_GLOBAL_SHORTCUT_ENABLED,
      customBindings: {},
      registrationErrors: {},

      setEnabled: (enabled) => set({ enabled }),

      getBinding: (actionId) => get().customBindings[actionId] ?? DEFAULT_GLOBAL_SHORTCUT_BINDINGS[actionId],

      getAllBindings: () => {
        const bindings = {} as Record<GlobalShortcutActionId, string>;
        for (const actionId of Object.keys(DEFAULT_GLOBAL_SHORTCUT_BINDINGS) as GlobalShortcutActionId[]) {
          bindings[actionId] = get().customBindings[actionId] ?? DEFAULT_GLOBAL_SHORTCUT_BINDINGS[actionId];
        }
        return bindings;
      },

      setBinding: (actionId, accelerator) => {
        const validation = validateGlobalShortcutAccelerator(accelerator);
        if (!validation.valid || !validation.normalized) {
          return {
            ok: false,
            normalized: null,
            error: validation.error,
            conflictWith: null,
          };
        }

        const conflict = get().findConflict(validation.normalized, actionId);
        if (conflict) {
          return {
            ok: false,
            normalized: validation.normalized,
            error: 'Shortcut already assigned to another global action',
            conflictWith: conflict,
          };
        }

        set((state) => {
          const nextErrors = { ...state.registrationErrors };
          delete nextErrors[actionId];
          return {
            customBindings: {
              ...state.customBindings,
              [actionId]: validation.normalized!,
            },
            registrationErrors: nextErrors,
          };
        });

        return {
          ok: true,
          normalized: validation.normalized,
          error: null,
          conflictWith: null,
        };
      },

      resetBinding: (actionId) =>
        set((state) => {
          const nextBindings = { ...state.customBindings };
          const nextErrors = { ...state.registrationErrors };
          delete nextBindings[actionId];
          delete nextErrors[actionId];
          return {
            customBindings: nextBindings,
            registrationErrors: nextErrors,
          };
        }),

      resetAllBindings: () => set({ customBindings: {}, registrationErrors: {} }),

      isCustom: (actionId) => actionId in get().customBindings,

      findConflict: (accelerator, excludeActionId) => {
        const normalized = normalizeGlobalShortcutAccelerator(accelerator);
        if (!normalized) return null;

        const bindings = get().getAllBindings();
        for (const actionId of Object.keys(bindings) as GlobalShortcutActionId[]) {
          if (actionId === excludeActionId) continue;
          const current = normalizeGlobalShortcutAccelerator(bindings[actionId]);
          if (current && current === normalized) {
            return actionId;
          }
        }
        return null;
      },

      setRegistrationError: (actionId, error) =>
        set((state) => ({
          registrationErrors: {
            ...state.registrationErrors,
            [actionId]: error,
          },
        })),

      clearRegistrationError: (actionId) =>
        set((state) => {
          const nextErrors = { ...state.registrationErrors };
          delete nextErrors[actionId];
          return { registrationErrors: nextErrors };
        }),

      clearRegistrationErrors: () => set({ registrationErrors: {} }),
    }),
    {
      name: 'starmap-global-shortcuts',
      storage: getZustandStorage(),
      version: 1,
      partialize: (state) => ({
        enabled: state.enabled,
        customBindings: state.customBindings,
      }),
    },
  ),
);
