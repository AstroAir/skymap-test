/**
 * Tests for tauri-storage.ts
 * TauriStorageAdapter using Rust backend
 */

import { TauriStorageAdapter } from '../tauri-storage';

// Mock Tauri APIs
jest.mock('@tauri-apps/api/core', () => ({
  invoke: jest.fn(),
}));

jest.mock('@tauri-apps/plugin-dialog', () => ({
  save: jest.fn(),
  open: jest.fn(),
}));

jest.mock('../platform', () => ({
  isTauri: () => false, // default to non-Tauri for safety
}));

describe('TauriStorageAdapter (non-Tauri environment)', () => {
  let adapter: TauriStorageAdapter;

  beforeEach(() => {
    adapter = new TauriStorageAdapter();
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
