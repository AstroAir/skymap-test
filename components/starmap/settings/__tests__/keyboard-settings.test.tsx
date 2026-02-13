/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock zustand persist
jest.mock('zustand/middleware', () => ({
  persist: (config: unknown) => config,
}));

// Mock storage
jest.mock('@/lib/storage', () => ({
  getZustandStorage: () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  }),
}));

const mockSetBinding = jest.fn();
const mockResetBinding = jest.fn();
const mockResetAllBindings = jest.fn();
const mockIsCustom = jest.fn(() => false);
const mockFindConflict = jest.fn((): string | null => null);

jest.mock('@/lib/stores/keybinding-store', () => {
  const bindings: Record<string, { key: string; ctrl?: boolean }> = {
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
  return {
    useKeybindingStore: (selector: (state: unknown) => unknown) => {
      const state = {
        customBindings: {},
        getBinding: (id: string) => bindings[id] || { key: '?' },
        setBinding: mockSetBinding,
        resetBinding: mockResetBinding,
        resetAllBindings: mockResetAllBindings,
        isCustom: mockIsCustom,
        findConflict: mockFindConflict,
      };
      return selector ? selector(state) : state;
    },
    formatKeyBinding: (b: { key: string; ctrl?: boolean; shift?: boolean; alt?: boolean; meta?: boolean }) => {
      const parts: string[] = [];
      if (b.ctrl) parts.push('Ctrl');
      if (b.alt) parts.push('Alt');
      if (b.shift) parts.push('Shift');
      if (b.meta) parts.push('⌘');
      let key = b.key;
      if (key === ' ') key = 'Space';
      else if (key === 'Escape') key = 'Esc';
      else if (key.length === 1) key = key.toUpperCase();
      parts.push(key);
      return parts.join('+');
    },
    eventToKeyBinding: (e: KeyboardEvent) => {
      if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return null;
      return {
        key: e.key,
        ctrl: e.ctrlKey || undefined,
        shift: e.shiftKey || undefined,
        alt: e.altKey || undefined,
        meta: e.metaKey || undefined,
      };
    },
    DEFAULT_KEYBINDINGS: bindings,
  };
});

import { KeyboardSettings } from '../keyboard-settings';

describe('KeyboardSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsCustom.mockReturnValue(false);
    mockFindConflict.mockReturnValue(null);
  });

  it('renders without crashing', () => {
    const { container } = render(<KeyboardSettings />);
    expect(container).toBeInTheDocument();
  });

  it('renders title and description', () => {
    render(<KeyboardSettings />);
    expect(screen.getByText('settingsNew.keyboard.title')).toBeInTheDocument();
    expect(screen.getByText('settingsNew.keyboard.description')).toBeInTheDocument();
  });

  it('renders collapsible sections for shortcut categories', () => {
    render(<KeyboardSettings />);
    // 4 groups: navigation, toggles, timeControl, other
    expect(screen.getByText('settingsNew.keyboard.navigation')).toBeInTheDocument();
    expect(screen.getByText('settingsNew.keyboard.toggles')).toBeInTheDocument();
    expect(screen.getByText('settingsNew.keyboard.timeControl')).toBeInTheDocument();
    expect(screen.getByText('settingsNew.keyboard.other')).toBeInTheDocument();
  });

  it('renders formatted key bindings in the open navigation group', () => {
    render(<KeyboardSettings />);
    // Navigation group (idx=0) is open by default with: ZOOM_IN(+), ZOOM_OUT(-), RESET_VIEW(R)
    expect(screen.getByText('+')).toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument();
    expect(screen.getByText('R')).toBeInTheDocument();
  });

  it('renders action labels in navigation group', () => {
    render(<KeyboardSettings />);
    expect(screen.getByText('settingsNew.keyboard.zoomIn')).toBeInTheDocument();
    expect(screen.getByText('settingsNew.keyboard.zoomOut')).toBeInTheDocument();
    expect(screen.getByText('settingsNew.keyboard.resetView')).toBeInTheDocument();
  });

  it('does not render reset all button when no custom bindings', () => {
    render(<KeyboardSettings />);
    const buttons = screen.getAllByRole('button');
    const resetButtons = buttons.filter(b =>
      b.textContent?.includes('settingsNew.keyboard.resetAll')
    );
    expect(resetButtons.length).toBe(0);
  });

  it('enters recording mode when clicking a shortcut button', () => {
    render(<KeyboardSettings />);
    // Click the "+" button (ZOOM_IN keybinding in the open navigation group)
    const keyButton = screen.getByText('+');
    fireEvent.click(keyButton);
    // After clicking, the UI should show recording state
    expect(screen.getByText('settingsNew.keyboard.pressKey')).toBeInTheDocument();
  });

  it('records a new key binding on keydown', () => {
    render(<KeyboardSettings />);
    const keyButton = screen.getByText('+');
    fireEvent.click(keyButton);

    // Simulate pressing a new key via the button's onKeyDown
    fireEvent.keyDown(keyButton, { key: 'k', ctrlKey: false });

    expect(mockSetBinding).toHaveBeenCalledWith('ZOOM_IN', { key: 'k' });
  });

  it('exits recording mode on blur', () => {
    render(<KeyboardSettings />);
    const keyButton = screen.getByText('+');
    fireEvent.click(keyButton);
    expect(screen.getByText('settingsNew.keyboard.pressKey')).toBeInTheDocument();

    fireEvent.blur(keyButton);
    // After blur, recording should stop — "+" should reappear
    expect(screen.getByText('+')).toBeInTheDocument();
  });

  it('shows conflict warning when binding conflicts', () => {
    mockFindConflict.mockReturnValue('ZOOM_OUT');
    render(<KeyboardSettings />);
    const keyButton = screen.getByText('+');
    fireEvent.click(keyButton);

    // Simulate pressing a conflicting key
    fireEvent.keyDown(keyButton, { key: '-' });

    // Conflict should be detected, binding should NOT be set
    expect(mockFindConflict).toHaveBeenCalled();
    expect(mockSetBinding).not.toHaveBeenCalled();
  });

  it('renders separator elements between groups', () => {
    const { container } = render(<KeyboardSettings />);
    const separators = container.querySelectorAll('[data-slot="separator"]');
    // 3 separators between 4 groups
    expect(separators.length).toBe(3);
  });
});
