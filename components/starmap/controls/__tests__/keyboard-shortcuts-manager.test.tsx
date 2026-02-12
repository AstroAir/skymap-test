/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render } from '@testing-library/react';
import { KeyboardShortcutsManager } from '../keyboard-shortcuts-manager';

// Mock stores
const mockStel = {
  core: {
    time_speed: 1,
    observer: { utc: 59000 },
    fov: 1.0,
  },
};

jest.mock('@/lib/stores', () => ({
  useStellariumStore: jest.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({ stel: mockStel })
  ),
  useSettingsStore: jest.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({
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
}));

// Mock keyboard shortcuts hook
jest.mock('@/lib/hooks', () => ({
  useKeyboardShortcuts: jest.fn(),
  useTimeControls: jest.fn(() => ({
    handlePauseTime: jest.fn(),
    handleSpeedUp: jest.fn(),
    handleSlowDown: jest.fn(),
    handleResetTime: jest.fn(),
  })),
  STARMAP_SHORTCUT_KEYS: {
    ZOOM_IN: '+',
    ZOOM_OUT: '-',
    RESET_VIEW: 'r',
    TOGGLE_SEARCH: 'f',
    TOGGLE_SESSION_PANEL: 's',
    TOGGLE_FOV: 'v',
    TOGGLE_CONSTELLATIONS: 'c',
    TOGGLE_GRID: 'g',
    TOGGLE_DSO: 'd',
    TOGGLE_ATMOSPHERE: 'a',
    PAUSE_TIME: ' ',
    SPEED_UP: ']',
    SLOW_DOWN: '[',
    RESET_TIME: 't',
    CLOSE_PANEL: 'Escape',
  },
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

    expect(keys).toContain('c'); // constellations
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
