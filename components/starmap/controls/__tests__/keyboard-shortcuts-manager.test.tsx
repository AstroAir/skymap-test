/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render } from '@testing-library/react';
import { KeyboardShortcutsManager } from '../keyboard-shortcuts-manager';

const mockStel = {
  core: {
    time_speed: 1,
    observer: { utc: 59000 },
    fov: 1.0,
  },
};

// Mock keybinding store with actual defaults
jest.mock('@/lib/stores', () => {
  const actual = jest.requireActual('@/lib/stores/keybinding-store');
  return {
    ...jest.requireActual('@/lib/stores'),
    useStellariumStore: jest.fn((selector: (s: Record<string, unknown>) => unknown) =>
      selector({ stel: mockStel })
    ),
    useSettingsStore: jest.fn((selector: (s: Record<string, unknown>) => unknown) =>
      selector({
        skyEngine: 'stellarium',
        stellarium: {},
        toggleStellariumSetting: jest.fn(),
      })
    ),
    useEquipmentStore: jest.fn((selector: (s: Record<string, unknown>) => unknown) =>
      selector({
        fovDisplay: { enabled: false },
        setFOVEnabled: jest.fn(),
      })
    ),
    useKeybindingStore: jest.fn((selector: (s: Record<string, unknown>) => unknown) =>
      selector({
        getBinding: (id: string) => actual.DEFAULT_KEYBINDINGS[id],
        customBindings: {},
      })
    ),
    DEFAULT_KEYBINDINGS: actual.DEFAULT_KEYBINDINGS,
  };
});

// Mock keyboard shortcuts hook
jest.mock('@/lib/hooks', () => ({
  useKeyboardShortcuts: jest.fn(),
  useTimeControls: jest.fn(() => ({
    handlePauseTime: jest.fn(),
    handleSpeedUp: jest.fn(),
    handleSlowDown: jest.fn(),
    handleResetTime: jest.fn(),
  })),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { useKeyboardShortcuts: mockUseKeyboardShortcuts } = require('@/lib/hooks') as { useKeyboardShortcuts: jest.Mock };

describe('KeyboardShortcutsManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStel.core.time_speed = 1;
  });

  it('renders nothing (returns null)', () => {
    const { container } = render(<KeyboardShortcutsManager />);
    expect(container.innerHTML).toBe('');
  });

  it('calls useKeyboardShortcuts with shortcuts array', () => {
    render(<KeyboardShortcutsManager />);
    expect(mockUseKeyboardShortcuts).toHaveBeenCalledWith(
      expect.objectContaining({
        shortcuts: expect.any(Array),
        enabled: true,
      })
    );
  });

  it('includes zoom shortcuts when onZoomIn/onZoomOut provided', () => {
    const onZoomIn = jest.fn();
    const onZoomOut = jest.fn();
    render(<KeyboardShortcutsManager onZoomIn={onZoomIn} onZoomOut={onZoomOut} />);

    const call = mockUseKeyboardShortcuts.mock.calls[0][0];
    const shortcuts = call.shortcuts;
    
    const zoomInShortcut = shortcuts.find(
      (s: { key: string; action: () => void }) => s.key === '+'
    );
    const zoomOutShortcut = shortcuts.find(
      (s: { key: string; action: () => void }) => s.key === '-'
    );

    expect(zoomInShortcut).toBeDefined();
    expect(zoomOutShortcut).toBeDefined();
  });

  it('includes display toggle shortcuts', () => {
    render(<KeyboardShortcutsManager />);

    const call = mockUseKeyboardShortcuts.mock.calls[0][0];
    const shortcuts = call.shortcuts;
    const keys = shortcuts.map((s: { key: string }) => s.key);

    expect(keys).toContain('l'); // constellations (DEFAULT_KEYBINDINGS.TOGGLE_CONSTELLATIONS)
    expect(keys).toContain('g'); // grid
    expect(keys).toContain('d'); // DSO
    expect(keys).toContain('a'); // atmosphere
  });

  it('includes time control shortcuts', () => {
    render(<KeyboardShortcutsManager />);

    const call = mockUseKeyboardShortcuts.mock.calls[0][0];
    const shortcuts = call.shortcuts;
    const keys = shortcuts.map((s: { key: string }) => s.key);

    expect(keys).toContain(' '); // pause
    expect(keys).toContain(']'); // speed up
    expect(keys).toContain('['); // slow down
    expect(keys).toContain('t'); // reset time
  });

  it('disables shortcuts when enabled=false', () => {
    render(<KeyboardShortcutsManager enabled={false} />);

    const call = mockUseKeyboardShortcuts.mock.calls[0][0];
    expect(call.enabled).toBe(false);
  });
});

// ============================================================================
// Aladin engine compatibility
// ============================================================================

describe('KeyboardShortcutsManager (Aladin engine)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reconfigure mocks for Aladin mode
    const { useStellariumStore, useSettingsStore } = jest.requireMock('@/lib/stores');
    (useStellariumStore as jest.Mock).mockImplementation(
      (selector: (s: Record<string, unknown>) => unknown) => selector({ stel: null })
    );
    (useSettingsStore as jest.Mock).mockImplementation(
      (selector: (s: Record<string, unknown>) => unknown) =>
        selector({
          skyEngine: 'aladin',
          stellarium: {},
          toggleStellariumSetting: jest.fn(),
        })
    );
  });

  it('enables shortcuts when Aladin is active (stel=null)', () => {
    render(<KeyboardShortcutsManager />);

    const call = mockUseKeyboardShortcuts.mock.calls[0][0];
    expect(call.enabled).toBe(true);
  });

  it('excludes Stellarium-only display toggle shortcuts in Aladin mode', () => {
    render(<KeyboardShortcutsManager />);

    const call = mockUseKeyboardShortcuts.mock.calls[0][0];
    const keys = call.shortcuts.map((s: { key: string }) => s.key);

    // Stellarium-only display toggles should NOT be present
    expect(keys).not.toContain('l'); // constellations
    expect(keys).not.toContain('g'); // grid
    expect(keys).not.toContain('d'); // DSO
    expect(keys).not.toContain('a'); // atmosphere
  });

  it('excludes time control shortcuts in Aladin mode', () => {
    render(<KeyboardShortcutsManager />);

    const call = mockUseKeyboardShortcuts.mock.calls[0][0];
    const keys = call.shortcuts.map((s: { key: string }) => s.key);

    // Time controls should NOT be present
    expect(keys).not.toContain(' '); // pause
    expect(keys).not.toContain(']'); // speed up
    expect(keys).not.toContain('['); // slow down
    expect(keys).not.toContain('t'); // reset time
  });

  it('still includes universal shortcuts (zoom, search, FOV) in Aladin mode', () => {
    const onZoomIn = jest.fn();
    const onZoomOut = jest.fn();
    const onToggleSearch = jest.fn();

    render(
      <KeyboardShortcutsManager
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onToggleSearch={onToggleSearch}
      />
    );

    const call = mockUseKeyboardShortcuts.mock.calls[0][0];
    const keys = call.shortcuts.map((s: { key: string }) => s.key);

    expect(keys).toContain('+'); // zoom in
    expect(keys).toContain('-'); // zoom out
    expect(keys).toContain('f'); // FOV toggle
  });
});
