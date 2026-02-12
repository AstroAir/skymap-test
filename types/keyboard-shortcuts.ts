/**
 * Keyboard Shortcuts - Type Definitions
 *
 * Types for keyboard shortcut display in the shortcuts dialog.
 */

export interface ShortcutItem {
  key: string;
  descriptionKey: string;
  modifier?: string;
  /** Links this display item to a customizable action in the keybinding store */
  actionId?: string;
}

export interface ShortcutGroupDefinition {
  titleKey: string;
  iconName: string;
  shortcuts: ShortcutItem[];
}

export interface KeyboardShortcutsDialogProps {
  trigger?: React.ReactNode;
}
