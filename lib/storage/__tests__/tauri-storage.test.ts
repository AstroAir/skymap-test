/**
 * Tests for tauri-storage.ts
 * TauriStorageAdapter using Rust backend
 */

import { TauriStorageAdapter } from '../tauri-storage';
import { invoke } from '@tauri-apps/api/core';
import { save, open } from '@tauri-apps/plugin-dialog';

const mockInvoke = invoke as jest.MockedFunction<typeof invoke>;
const mockSave = save as jest.MockedFunction<typeof save>;
const mockOpen = open as jest.MockedFunction<typeof open>;

// Mock Tauri APIs
jest.mock('@tauri-apps/api/core', () => ({
  invoke: jest.fn(),
}));

jest.mock('@tauri-apps/plugin-dialog', () => ({
  save: jest.fn(),
  open: jest.fn(),
}));

jest.mock('../platform', () => ({
  isTauri: jest.fn().mockReturnValue(false),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const platformMock = require('../platform') as { isTauri: jest.Mock };

describe('TauriStorageAdapter (non-Tauri environment)', () => {
  let adapter: TauriStorageAdapter;

  beforeEach(() => {
    platformMock.isTauri.mockReturnValue(false);
    adapter = new TauriStorageAdapter();
    jest.clearAllMocks();
    platformMock.isTauri.mockReturnValue(false);
  });

  it('should report as unavailable', () => {
    expect(adapter.isAvailable()).toBe(false);
  });

  it('should throw on saveStore', async () => {
    await expect(adapter.saveStore('test', '{}')).rejects.toThrow('Tauri is not available');
  });

  it('should return null on loadStore', async () => {
    const data = await adapter.loadStore('test');
    expect(data).toBeNull();
  });

  it('should return false on deleteStore', async () => {
    const result = await adapter.deleteStore('test');
    expect(result).toBe(false);
  });

  it('should return empty array on listStores', async () => {
    const stores = await adapter.listStores();
    expect(stores).toEqual([]);
  });

  it('should throw on exportAllData', async () => {
    await expect(adapter.exportAllData()).rejects.toThrow('Tauri is not available');
  });

  it('should throw on importAllData', async () => {
    await expect(adapter.importAllData()).rejects.toThrow('Tauri is not available');
  });

  it('should return empty stats', async () => {
    const stats = await adapter.getStorageStats();
    expect(stats.total_size).toBe(0);
    expect(stats.store_count).toBe(0);
    expect(stats.stores).toEqual([]);
    expect(stats.directory).toBe('');
  });

  it('should return empty data directory', async () => {
    const dir = await adapter.getDataDirectory();
    expect(dir).toBe('');
  });

  it('should return 0 on clearAllData', async () => {
    const count = await adapter.clearAllData();
    expect(count).toBe(0);
  });
});

describe('TauriStorageAdapter (Tauri environment)', () => {
  let adapter: TauriStorageAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    platformMock.isTauri.mockReturnValue(true);
    adapter = new TauriStorageAdapter();
  });

  afterEach(() => {
    platformMock.isTauri.mockReturnValue(false);
  });

  it('should report as available', () => {
    expect(adapter.isAvailable()).toBe(true);
  });

  // ---- saveStore ----
  it('should invoke save_store_data on saveStore', async () => {
    mockInvoke.mockResolvedValue(undefined);
    await adapter.saveStore('starmap-settings', '{"theme":"dark"}');
    expect(mockInvoke).toHaveBeenCalledWith('save_store_data', {
      storeName: 'starmap-settings',
      data: '{"theme":"dark"}',
    });
  });

  // ---- loadStore ----
  it('should invoke load_store_data on loadStore', async () => {
    mockInvoke.mockResolvedValue('{"theme":"dark"}');
    const result = await adapter.loadStore('starmap-settings');
    expect(result).toBe('{"theme":"dark"}');
    expect(mockInvoke).toHaveBeenCalledWith('load_store_data', {
      storeName: 'starmap-settings',
    });
  });

  it('should return null from loadStore when backend returns null', async () => {
    mockInvoke.mockResolvedValue(null);
    const result = await adapter.loadStore('nonexistent');
    expect(result).toBeNull();
  });

  // ---- deleteStore ----
  it('should invoke delete_store_data on deleteStore', async () => {
    mockInvoke.mockResolvedValue(true);
    const result = await adapter.deleteStore('starmap-settings');
    expect(result).toBe(true);
    expect(mockInvoke).toHaveBeenCalledWith('delete_store_data', {
      storeName: 'starmap-settings',
    });
  });

  it('should return false from deleteStore when store does not exist', async () => {
    mockInvoke.mockResolvedValue(false);
    const result = await adapter.deleteStore('nonexistent');
    expect(result).toBe(false);
  });

  // ---- listStores ----
  it('should invoke list_stores on listStores', async () => {
    mockInvoke.mockResolvedValue(['starmap-settings', 'starmap-markers']);
    const stores = await adapter.listStores();
    expect(stores).toEqual(['starmap-settings', 'starmap-markers']);
    expect(mockInvoke).toHaveBeenCalledWith('list_stores');
  });

  // ---- exportAllData ----
  it('should invoke export_all_data with provided path', async () => {
    mockInvoke.mockResolvedValue(undefined);
    await adapter.exportAllData('/tmp/backup.json');
    expect(mockInvoke).toHaveBeenCalledWith('export_all_data', {
      exportPath: '/tmp/backup.json',
    });
  });

  it('should open save dialog when no path provided', async () => {
    mockSave.mockResolvedValue('/user/chosen/path.json');
    mockInvoke.mockResolvedValue(undefined);
    await adapter.exportAllData();
    expect(mockSave).toHaveBeenCalled();
    expect(mockInvoke).toHaveBeenCalledWith('export_all_data', {
      exportPath: '/user/chosen/path.json',
    });
  });

  it('should throw when save dialog is cancelled', async () => {
    mockSave.mockResolvedValue(null);
    await expect(adapter.exportAllData()).rejects.toThrow('Export cancelled');
  });

  // ---- importAllData ----
  it('should invoke import_all_data with provided path', async () => {
    const importResult = {
      imported_count: 3,
      skipped_count: 0,
      errors: [],
      metadata: { version: '1.0', exported_at: '', app_version: '0.1.0', store_count: 3 },
    };
    mockInvoke.mockResolvedValue(importResult);
    const result = await adapter.importAllData('/tmp/backup.json');
    expect(result).toEqual(importResult);
    expect(mockInvoke).toHaveBeenCalledWith('import_all_data', {
      importPath: '/tmp/backup.json',
    });
  });

  it('should open file dialog when no path provided', async () => {
    const importResult = {
      imported_count: 1,
      skipped_count: 0,
      errors: [],
      metadata: { version: '1.0', exported_at: '', app_version: '0.1.0', store_count: 1 },
    };
    mockOpen.mockResolvedValue('/user/chosen/import.json');
    mockInvoke.mockResolvedValue(importResult);
    const result = await adapter.importAllData();
    expect(mockOpen).toHaveBeenCalled();
    expect(result).toEqual(importResult);
  });

  it('should throw when open dialog is cancelled', async () => {
    mockOpen.mockResolvedValue(null);
    await expect(adapter.importAllData()).rejects.toThrow('Import cancelled');
  });

  // ---- getStorageStats ----
  it('should invoke get_storage_stats', async () => {
    const stats = {
      total_size: 2048,
      store_count: 3,
      stores: [{ name: 'starmap-settings', size: 1024 }],
      directory: '/data/skymap',
    };
    mockInvoke.mockResolvedValue(stats);
    const result = await adapter.getStorageStats();
    expect(result).toEqual(stats);
    expect(mockInvoke).toHaveBeenCalledWith('get_storage_stats');
  });

  // ---- getDataDirectory ----
  it('should invoke get_data_directory', async () => {
    mockInvoke.mockResolvedValue('/home/user/.skymap/data');
    const dir = await adapter.getDataDirectory();
    expect(dir).toBe('/home/user/.skymap/data');
    expect(mockInvoke).toHaveBeenCalledWith('get_data_directory');
  });

  // ---- clearAllData ----
  it('should invoke clear_all_data', async () => {
    mockInvoke.mockResolvedValue(5);
    const count = await adapter.clearAllData();
    expect(count).toBe(5);
    expect(mockInvoke).toHaveBeenCalledWith('clear_all_data');
  });
});

describe('tauriStorageAdapter singleton', () => {
  it('should export a singleton instance', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('../tauri-storage') as { tauriStorageAdapter: TauriStorageAdapter };
    expect(mod.tauriStorageAdapter).toBeInstanceOf(TauriStorageAdapter);
  });
});
