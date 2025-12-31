/**
 * Unit tests for storage-api.ts
 */

import { storageApi } from '../storage-api';
import type { StorageStats, ImportResult } from '../types';

// Mock the platform detection
jest.mock('@/lib/storage/platform', () => ({
  isTauri: jest.fn(() => true)
}));

// Mock Tauri API
const mockInvoke = jest.fn();
jest.mock('@tauri-apps/api/core', () => ({
  invoke: mockInvoke
}));

describe('storageApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveStoreData', () => {
    it('should save store data successfully', async () => {
      mockInvoke.mockResolvedValueOnce(undefined);

      await storageApi.saveStoreData('test-store', 'test-data');

      expect(mockInvoke).toHaveBeenCalledWith('save_store_data', {
        storeName: 'test-store',
        data: 'test-data'
      });
    });

    it('should throw error when invoke fails', async () => {
      const error = new Error('Save failed');
      mockInvoke.mockRejectedValueOnce(error);

      await expect(storageApi.saveStoreData('test-store', 'test-data'))
        .rejects.toThrow('Save failed');
    });
  });

  describe('loadStoreData', () => {
    it('should load store data successfully', async () => {
      const testData = 'loaded-data';
      mockInvoke.mockResolvedValueOnce(testData);

      const result = await storageApi.loadStoreData('test-store');

      expect(result).toBe(testData);
      expect(mockInvoke).toHaveBeenCalledWith('load_store_data', {
        storeName: 'test-store'
      });
    });

    it('should return null when store does not exist', async () => {
      mockInvoke.mockResolvedValueOnce(null);

      const result = await storageApi.loadStoreData('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('deleteStoreData', () => {
    it('should delete store successfully', async () => {
      mockInvoke.mockResolvedValueOnce(true);

      const result = await storageApi.deleteStoreData('test-store');

      expect(result).toBe(true);
      expect(mockInvoke).toHaveBeenCalledWith('delete_store_data', {
        storeName: 'test-store'
      });
    });

    it('should return false when store does not exist', async () => {
      mockInvoke.mockResolvedValueOnce(false);

      const result = await storageApi.deleteStoreData('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('listStores', () => {
    it('should list all stores', async () => {
      const stores = ['store1', 'store2', 'store3'];
      mockInvoke.mockResolvedValueOnce(stores);

      const result = await storageApi.listStores();

      expect(result).toEqual(stores);
      expect(mockInvoke).toHaveBeenCalledWith('list_stores');
    });

    it('should return empty array when no stores exist', async () => {
      mockInvoke.mockResolvedValueOnce([]);

      const result = await storageApi.listStores();

      expect(result).toEqual([]);
    });
  });

  describe('exportAllData', () => {
    it('should export all data to specified path', async () => {
      mockInvoke.mockResolvedValueOnce(undefined);

      await storageApi.exportAllData('/path/to/export.json');

      expect(mockInvoke).toHaveBeenCalledWith('export_all_data', {
        exportPath: '/path/to/export.json'
      });
    });
  });

  describe('importAllData', () => {
    it('should import all data successfully', async () => {
      const importResult: ImportResult = {
        imported_count: 5,
        skipped_count: 2,
        errors: [],
        metadata: {
          version: '1.0.0',
          exported_at: '2025-12-25T12:00:00Z',
          app_version: '1.0.0',
          store_count: 7
        }
      };
      mockInvoke.mockResolvedValueOnce(importResult);

      const result = await storageApi.importAllData('/path/to/import.json');

      expect(result).toEqual(importResult);
      expect(mockInvoke).toHaveBeenCalledWith('import_all_data', {
        importPath: '/path/to/import.json'
      });
    });

    it('should handle import with errors', async () => {
      const importResult: ImportResult = {
        imported_count: 3,
        skipped_count: 1,
        errors: ['Failed to import store1'],
        metadata: {
          version: '1.0.0',
          exported_at: '2025-12-25T12:00:00Z',
          app_version: '1.0.0',
          store_count: 4
        }
      };
      mockInvoke.mockResolvedValueOnce(importResult);

      const result = await storageApi.importAllData('/path/to/import.json');

      expect(result.errors).toHaveLength(1);
      expect(result.imported_count).toBe(3);
    });
  });

  describe('getDataDirectory', () => {
    it('should return data directory path', async () => {
      const dataDir = '/home/user/.local/share/skymap';
      mockInvoke.mockResolvedValueOnce(dataDir);

      const result = await storageApi.getDataDirectory();

      expect(result).toBe(dataDir);
      expect(mockInvoke).toHaveBeenCalledWith('get_data_directory');
    });
  });

  describe('getStorageStats', () => {
    it('should return storage statistics', async () => {
      const stats: StorageStats = {
        total_size: 1024000,
        store_count: 5,
        stores: [
          { name: 'store1', size: 512000, modified: '2025-12-25T12:00:00Z' },
          { name: 'store2', size: 256000, modified: '2025-12-25T11:00:00Z' }
        ],
        directory: '/home/user/.local/share/skymap'
      };
      mockInvoke.mockResolvedValueOnce(stats);

      const result = await storageApi.getStorageStats();

      expect(result).toEqual(stats);
      expect(result.store_count).toBe(5);
      expect(result.total_size).toBe(1024000);
    });
  });

  describe('clearAllData', () => {
    it('should clear all data and return count', async () => {
      mockInvoke.mockResolvedValueOnce(5);

      const result = await storageApi.clearAllData();

      expect(result).toBe(5);
      expect(mockInvoke).toHaveBeenCalledWith('clear_all_data');
    });

    it('should return 0 when no data to clear', async () => {
      mockInvoke.mockResolvedValueOnce(0);

      const result = await storageApi.clearAllData();

      expect(result).toBe(0);
    });
  });

  describe('isAvailable', () => {
    it('should return true when Tauri is available', () => {
      expect(storageApi.isAvailable()).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('Network request failed');
      mockInvoke.mockRejectedValueOnce(networkError);

      await expect(storageApi.loadStoreData('test-store'))
        .rejects.toThrow('Network request failed');
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Request timed out');
      mockInvoke.mockRejectedValueOnce(timeoutError);

      await expect(storageApi.getStorageStats())
        .rejects.toThrow('Request timed out');
    });
  });
});
