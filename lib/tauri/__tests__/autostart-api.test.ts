/**
 * @jest-environment jsdom
 */

import { autostartApi, setAutostartPluginLoader } from '../autostart-api';
import { isTauri } from '@/lib/storage/platform';

jest.mock('@/lib/storage/platform', () => ({
  isTauri: jest.fn(() => true),
}));

describe('autostartApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (isTauri as jest.Mock).mockReturnValue(true);
    setAutostartPluginLoader(async () => null);
  });

  it('returns controlled fallback results outside Tauri', async () => {
    (isTauri as jest.Mock).mockReturnValue(false);

    expect(autostartApi.isAvailable()).toBe(false);
    await expect(autostartApi.isEnabled()).resolves.toBe(false);
    await expect(autostartApi.enable()).resolves.toBe(false);
    await expect(autostartApi.disable()).resolves.toBe(false);
  });

  it('reads enabled state from the plugin in Tauri', async () => {
    const mockIsEnabled = jest.fn(async () => true);
    setAutostartPluginLoader(async () => ({
      isEnabled: mockIsEnabled,
    } as never));

    await expect(autostartApi.isEnabled()).resolves.toBe(true);
    expect(mockIsEnabled).toHaveBeenCalledTimes(1);
  });

  it('routes enable and disable through the plugin in Tauri', async () => {
    const mockEnable = jest.fn(async () => undefined);
    const mockDisable = jest.fn(async () => undefined);
    setAutostartPluginLoader(async () => ({
      enable: mockEnable,
      disable: mockDisable,
      isEnabled: jest.fn(async () => false),
    } as never));

    await expect(autostartApi.enable()).resolves.toBe(true);
    await expect(autostartApi.disable()).resolves.toBe(true);
    expect(mockEnable).toHaveBeenCalledTimes(1);
    expect(mockDisable).toHaveBeenCalledTimes(1);
  });
});
