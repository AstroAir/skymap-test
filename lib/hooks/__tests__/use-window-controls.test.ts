/**
 * Tests for use-window-controls.ts
 * Window state and control actions
 */

import { renderHook } from '@testing-library/react';
import { useWindowControls } from '../use-window-controls';

jest.mock('@/lib/tauri/app-control-api', () => ({
  closeWindow: jest.fn(),
  minimizeWindow: jest.fn(),
  toggleMaximizeWindow: jest.fn(),
  isWindowMaximized: jest.fn(() => Promise.resolve(false)),
  toggleFullscreen: jest.fn(),
  restartApp: jest.fn(),
  quitApp: jest.fn(),
  reloadWebview: jest.fn(),
  isTauri: () => false,
  setAlwaysOnTop: jest.fn(),
  isAlwaysOnTop: jest.fn(() => Promise.resolve(false)),
  saveWindowState: jest.fn(() => Promise.resolve()),
  centerWindow: jest.fn(),
}));

describe('useWindowControls', () => {
  it('should return initial state for non-Tauri env', () => {
    const { result } = renderHook(() => useWindowControls());
    expect(result.current.isTauriEnv).toBe(false);
    expect(result.current.isMaximized).toBe(false);
    expect(result.current.isFullscreen).toBe(false);
    expect(result.current.isPinned).toBe(false);
  });

  it('should provide all action handlers', () => {
    const { result } = renderHook(() => useWindowControls());
    expect(typeof result.current.handleMinimize).toBe('function');
    expect(typeof result.current.handleMaximize).toBe('function');
    expect(typeof result.current.handleClose).toBe('function');
    expect(typeof result.current.handleCloseWithSave).toBe('function');
    expect(typeof result.current.handleRestart).toBe('function');
    expect(typeof result.current.handleQuit).toBe('function');
    expect(typeof result.current.handleQuitWithSave).toBe('function');
    expect(typeof result.current.handleReload).toBe('function');
    expect(typeof result.current.handleToggleFullscreen).toBe('function');
    expect(typeof result.current.handleTogglePin).toBe('function');
    expect(typeof result.current.handleCenterWindow).toBe('function');
    expect(typeof result.current.handleWebReload).toBe('function');
  });
});
