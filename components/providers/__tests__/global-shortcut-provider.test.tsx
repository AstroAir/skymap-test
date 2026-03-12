/**
 * @jest-environment jsdom
 */

import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { GlobalShortcutProvider } from '../global-shortcut-provider';
import { useGlobalShortcutStore, useMountStore, useOnboardingBridgeStore } from '@/lib/stores';
import type { GlobalShortcutEvent, GlobalShortcutHandler } from '@/lib/tauri/global-shortcut-api';
import { toast } from 'sonner';
import { mountApi } from '@/lib/tauri/mount-api';
import { globalShortcutApi } from '@/lib/tauri/global-shortcut-api';

const mockSetFocus = jest.fn();
const mockShow = jest.fn();
const mockIsMinimized = jest.fn(async () => false);
const mockUnminimize = jest.fn();

const shortcutHandlers: Record<string, GlobalShortcutHandler> = {};
let failingShortcut: string | null = null;

jest.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }),
}));

jest.mock('@tauri-apps/api/core', () => ({
  invoke: jest.fn(async () => null),
}));

jest.mock('@/lib/tauri/secret-vault-api', () => ({
  secretVaultApi: {
    isAvailable: jest.fn(() => true),
    getStatus: jest.fn(async () => ({
      available: true,
      mode: 'desktop',
      state: 'ready',
    })),
    getMapApiKey: jest.fn(async () => null),
    setMapApiKey: jest.fn(async () => undefined),
    deleteMapApiKey: jest.fn(async () => undefined),
    getPlateSolverApiKey: jest.fn(async () => null),
    setPlateSolverApiKey: jest.fn(async () => undefined),
    deletePlateSolverApiKey: jest.fn(async () => undefined),
    getEventSourceApiKey: jest.fn(async () => null),
    setEventSourceApiKey: jest.fn(async () => undefined),
    deleteEventSourceApiKey: jest.fn(async () => undefined),
  },
}));

jest.mock('@/lib/storage/platform', () => ({
  isTauri: jest.fn(() => true),
  isServer: jest.fn(() => false),
  isWeb: jest.fn(() => false),
  isMobile: jest.fn(() => false),
  isDesktop: jest.fn(() => true),
  getPlatform: jest.fn(() => 'tauri'),
  onlyInTauri: jest.fn(),
  onlyInWeb: jest.fn(),
}));

jest.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: () => ({
    isMinimized: mockIsMinimized,
    unminimize: mockUnminimize,
    show: mockShow,
    setFocus: mockSetFocus,
  }),
}));

jest.mock('@tauri-apps/api/core', () => ({
  invoke: jest.fn(async () => undefined),
}));

jest.mock('@/lib/tauri/global-shortcut-api', () => ({
  globalShortcutApi: {
    isAvailable: jest.fn(),
    listen: jest.fn(),
    unregisterAll: jest.fn(),
    register: jest.fn(),
    unregister: jest.fn(),
    isRegistered: jest.fn(),
  },
}));

jest.mock('@/lib/tauri/mount-api', () => ({
  mountApi: {
    abortSlew: jest.fn(async () => undefined),
  },
}));

jest.mock('sonner', () => ({
  toast: {
    warning: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const toastWarning = toast.warning as jest.Mock;
const mockAbortSlew = mountApi.abortSlew as jest.Mock;
const mockIsAvailable = globalShortcutApi.isAvailable as jest.Mock;
const mockListen = globalShortcutApi.listen as jest.Mock;
const mockUnregisterAll = globalShortcutApi.unregisterAll as jest.Mock;

describe('GlobalShortcutProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    failingShortcut = null;
    for (const key of Object.keys(shortcutHandlers)) {
      delete shortcutHandlers[key];
    }
    mockIsAvailable.mockReturnValue(true);
    mockUnregisterAll.mockResolvedValue(true);
    mockListen.mockImplementation(async (shortcut: string, handler: GlobalShortcutHandler) => {
      if (failingShortcut && shortcut === failingShortcut) {
        throw new Error('shortcut already taken');
      }
      shortcutHandlers[shortcut] = handler;
      return true;
    });
    mockAbortSlew.mockResolvedValue(undefined);

    act(() => {
      useGlobalShortcutStore.getState().resetAllBindings();
      useGlobalShortcutStore.getState().clearRegistrationErrors();
      useGlobalShortcutStore.getState().setEnabled(false);
      useOnboardingBridgeStore.setState({
        openSearchRequestId: 0,
        toggleSearchRequestId: 0,
        toggleSessionPanelRequestId: 0,
      });
      useMountStore.setState((state) => ({
        mountInfo: {
          ...state.mountInfo,
          Connected: false,
        },
      }));
    });
  });

  it('registers shortcuts on startup when enabled', async () => {
    act(() => {
      useGlobalShortcutStore.getState().setEnabled(true);
    });

    render(<GlobalShortcutProvider />);

    await waitFor(() => {
      expect(mockUnregisterAll).toHaveBeenCalled();
      expect(mockListen).toHaveBeenCalledTimes(4);
    });
  });

  it('reapplies registrations after rebinding', async () => {
    act(() => {
      useGlobalShortcutStore.getState().setEnabled(true);
    });
    render(<GlobalShortcutProvider />);

    await waitFor(() => {
      expect(mockListen).toHaveBeenCalledTimes(4);
    });

    act(() => {
      useGlobalShortcutStore.getState().setBinding('TOGGLE_SEARCH', 'Ctrl+Shift+K');
    });

    await waitFor(() => {
      expect(mockUnregisterAll).toHaveBeenCalledTimes(2);
      expect(mockListen).toHaveBeenCalledWith(
        'Control+Shift+K',
        expect.any(Function),
      );
    });
  });

  it('unregisters all shortcuts when disabled', async () => {
    act(() => {
      useGlobalShortcutStore.getState().setEnabled(true);
    });
    render(<GlobalShortcutProvider />);

    await waitFor(() => {
      expect(mockUnregisterAll).toHaveBeenCalledTimes(1);
    });

    act(() => {
      useGlobalShortcutStore.getState().setEnabled(false);
    });

    await waitFor(() => {
      expect(mockUnregisterAll).toHaveBeenCalledTimes(2);
    });
  });

  it('marks registration failures and clears after successful rebind', async () => {
    failingShortcut = 'CommandOrControl+Shift+F';
    act(() => {
      useGlobalShortcutStore.getState().setEnabled(true);
    });
    render(<GlobalShortcutProvider />);

    await waitFor(() => {
      expect(useGlobalShortcutStore.getState().registrationErrors.TOGGLE_SEARCH).toBe('shortcut already taken');
    });

    failingShortcut = null;
    act(() => {
      useGlobalShortcutStore.getState().setBinding('TOGGLE_SEARCH', 'Ctrl+Shift+K');
    });

    await waitFor(() => {
      expect(useGlobalShortcutStore.getState().registrationErrors.TOGGLE_SEARCH).toBeUndefined();
      expect(mockListen).toHaveBeenCalledWith('Control+Shift+K', expect.any(Function));
    });
  });

  it('dispatches mapped actions and guards mount abort when disconnected', async () => {
    act(() => {
      useGlobalShortcutStore.getState().setEnabled(true);
    });
    render(<GlobalShortcutProvider />);

    await waitFor(() => {
      expect(mockListen).toHaveBeenCalledTimes(4);
    });

    const emitPressed = (shortcut: string) =>
      shortcutHandlers[shortcut]({
        shortcut,
        id: 1,
        state: 'Pressed',
      } as GlobalShortcutEvent);

    act(() => {
      emitPressed('CommandOrControl+Shift+F');
      emitPressed('CommandOrControl+Shift+P');
      emitPressed('CommandOrControl+Shift+Space');
      emitPressed('CommandOrControl+Alt+Shift+X');
    });

    expect(useOnboardingBridgeStore.getState().toggleSearchRequestId).toBe(1);
    expect(useOnboardingBridgeStore.getState().toggleSessionPanelRequestId).toBe(1);
    await waitFor(() => {
      expect(mockShow).toHaveBeenCalled();
      expect(mockSetFocus).toHaveBeenCalled();
    });
    expect(mockAbortSlew).not.toHaveBeenCalled();
    expect(toastWarning).toHaveBeenCalled();
  });
});
