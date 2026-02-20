/**
 * @jest-environment jsdom
 */

jest.mock('@/lib/storage/platform', () => ({
  isTauri: jest.fn(() => true),
}));

const mockInvoke = jest.fn();
jest.mock('@tauri-apps/api/core', () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}));

import { isTauri } from '@/lib/storage/platform';
import { mapKeysApi } from '../map-keys-api';

const mockIsTauri = isTauri as jest.Mock;

describe('mapKeysApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsTauri.mockReturnValue(true);
  });

  it('saves key into secure storage', async () => {
    mockInvoke.mockResolvedValue(undefined);
    await mapKeysApi.save({
      id: 'google-1',
      provider: 'google',
      apiKey: 'secret',
      createdAt: new Date().toISOString(),
    });
    expect(mockInvoke).toHaveBeenCalledWith('save_map_api_key', expect.any(Object));
  });

  it('lists key metadata', async () => {
    mockInvoke.mockResolvedValue([{ id: 'google-1', provider: 'google', createdAt: '2025-01-01T00:00:00.000Z' }]);
    const result = await mapKeysApi.listMeta();
    expect(result).toHaveLength(1);
    expect(mockInvoke).toHaveBeenCalledWith('list_map_api_keys_meta');
  });

  it('gets key value', async () => {
    mockInvoke.mockResolvedValue('secret');
    const value = await mapKeysApi.get('google-1');
    expect(value).toBe('secret');
    expect(mockInvoke).toHaveBeenCalledWith('get_map_api_key', { keyId: 'google-1' });
  });

  it('deletes key', async () => {
    mockInvoke.mockResolvedValue(undefined);
    await mapKeysApi.remove('google-1');
    expect(mockInvoke).toHaveBeenCalledWith('delete_map_api_key', { keyId: 'google-1' });
  });

  it('sets active key', async () => {
    mockInvoke.mockResolvedValue(undefined);
    await mapKeysApi.setActive('google', 'google-1');
    expect(mockInvoke).toHaveBeenCalledWith('set_active_map_api_key', { provider: 'google', keyId: 'google-1' });
  });

  it('throws when tauri is unavailable', async () => {
    mockIsTauri.mockReturnValue(false);
    await expect(mapKeysApi.listMeta()).rejects.toThrow('Tauri API is only available in desktop environment');
  });
});

