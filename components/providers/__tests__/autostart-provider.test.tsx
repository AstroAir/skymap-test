/**
 * @jest-environment jsdom
 */

import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { AutostartProvider } from '../autostart-provider';
import { useSettingsStore, useAutostartStore } from '@/lib/stores';
import { autostartApi } from '@/lib/tauri/autostart-api';

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

jest.mock('@/lib/tauri/autostart-api', () => ({
  autostartApi: {
    isAvailable: jest.fn(() => true),
    isEnabled: jest.fn(async () => false),
    enable: jest.fn(async () => true),
    disable: jest.fn(async () => true),
  },
}));

describe('AutostartProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      useSettingsStore.setState({
        preferences: {
          ...useSettingsStore.getState().preferences,
          launchOnStartup: false,
        },
      });
      useAutostartStore.getState().reset();
    });
    (autostartApi.isAvailable as jest.Mock).mockReturnValue(true);
    (autostartApi.isEnabled as jest.Mock).mockResolvedValue(false);
    (autostartApi.enable as jest.Mock).mockResolvedValue(true);
    (autostartApi.disable as jest.Mock).mockResolvedValue(true);
  });

  it('loads confirmed autostart status on startup', async () => {
    render(<AutostartProvider />);

    await waitFor(() => {
      expect(useAutostartStore.getState().supported).toBe(true);
      expect(useAutostartStore.getState().loading).toBe(false);
      expect(useAutostartStore.getState().actualEnabled).toBe(false);
      expect(useAutostartStore.getState().error).toBeNull();
    });
  });

  it('preserves existing system autostart entries during the first sync', async () => {
    (autostartApi.isEnabled as jest.Mock).mockResolvedValue(true);

    render(<AutostartProvider />);

    await waitFor(() => {
      expect(autostartApi.disable).not.toHaveBeenCalled();
      expect(useAutostartStore.getState().actualEnabled).toBe(true);
      expect(useSettingsStore.getState().preferences.launchOnStartup).toBe(true);
    });
  });

  it('enables autostart when saved preference is true and runtime state is false', async () => {
    act(() => {
      useSettingsStore.getState().setPreference('launchOnStartup', true);
    });

    render(<AutostartProvider />);

    await waitFor(() => {
      expect(autostartApi.enable).toHaveBeenCalledTimes(1);
      expect(useAutostartStore.getState().actualEnabled).toBe(true);
      expect(useSettingsStore.getState().preferences.launchOnStartup).toBe(true);
    });
  });

  it('reverts the saved preference and records an error when sync fails', async () => {
    (autostartApi.enable as jest.Mock).mockRejectedValue(new Error('permission denied'));

    act(() => {
      useSettingsStore.getState().setPreference('launchOnStartup', true);
    });

    render(<AutostartProvider />);

    await waitFor(() => {
      expect(useSettingsStore.getState().preferences.launchOnStartup).toBe(false);
      expect(useAutostartStore.getState().actualEnabled).toBe(false);
      expect(useAutostartStore.getState().error).toContain('permission denied');
    });
  });
});
