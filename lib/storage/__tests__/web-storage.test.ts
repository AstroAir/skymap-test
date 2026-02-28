/**
 * Tests for web-storage.ts
 * WebStorageAdapter using localStorage
 *
 * Note: jest.setup.ts replaces window.localStorage with jest.fn() stubs,
 * so we mock their implementations to simulate real behaviour.
 */

import { WebStorageAdapter, readFileAsText } from '../web-storage';

const mockGetItem = localStorage.getItem as jest.Mock;
const mockSetItem = localStorage.setItem as jest.Mock;
const mockRemoveItem = localStorage.removeItem as jest.Mock;
const mockClear = localStorage.clear as jest.Mock;

// Helper: set up standard localStorage mock behavior
function setupLocalStorageMock() {
  mockSetItem.mockImplementation(() => {});
  mockRemoveItem.mockImplementation(() => {});
  mockClear.mockImplementation(() => {});
}

describe('WebStorageAdapter', () => {
  let adapter: WebStorageAdapter;

  beforeEach(() => {
    adapter = new WebStorageAdapter();
    jest.clearAllMocks();
    setupLocalStorageMock();
  });

  // ============================================================================
  // isAvailable
  // ============================================================================
  describe('isAvailable', () => {
    it('should return true when localStorage works', () => {
      expect(adapter.isAvailable()).toBe(true);
    });

    it('should return false when localStorage.setItem throws', () => {
      mockSetItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      expect(adapter.isAvailable()).toBe(false);
    });
  });

  // ============================================================================
  // saveStore
  // ============================================================================
  describe('saveStore', () => {
    it('should call setItem with storeName and data', async () => {
      await adapter.saveStore('starmap-test', '{"key":"value"}');
      expect(mockSetItem).toHaveBeenCalledWith('starmap-test', '{"key":"value"}');
    });

    it('should throw when localStorage is not available', async () => {
      mockSetItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      // isAvailable returns false, so saveStore should throw
      await expect(adapter.saveStore('test', 'data')).rejects.toThrow(
        'localStorage is not available'
      );
    });
  });

  // ============================================================================
  // loadStore
  // ============================================================================
  describe('loadStore', () => {
    it('should call getItem and return data', async () => {
      mockGetItem.mockReturnValue('{"a":1}');
      const data = await adapter.loadStore('starmap-test');
      expect(data).toBe('{"a":1}');
    });

    it('should return null when getItem returns null', async () => {
      mockGetItem.mockReturnValue(null);
      const data = await adapter.loadStore('nonexistent');
      expect(data).toBeNull();
    });

    it('should return null when localStorage is not available', async () => {
      mockSetItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      const data = await adapter.loadStore('test');
      expect(data).toBeNull();
    });
  });

  // ============================================================================
  // deleteStore
  // ============================================================================
  describe('deleteStore', () => {
    it('should return true and remove existing store', async () => {
      mockGetItem.mockReturnValue('data');
      const existed = await adapter.deleteStore('starmap-test');
      expect(existed).toBe(true);
      expect(mockRemoveItem).toHaveBeenCalledWith('starmap-test');
    });

    it('should return false when deleting non-existent store', async () => {
      mockGetItem.mockReturnValue(null);
      const existed = await adapter.deleteStore('nonexistent');
      expect(existed).toBe(false);
    });

    it('should return false when localStorage is not available', async () => {
      mockSetItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      const result = await adapter.deleteStore('test');
      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // listStores
  // ============================================================================
  describe('listStores', () => {
    it('should return only starmap-/skymap- prefixed keys', async () => {
      const storage = new Map<string, string>();
      storage.set('starmap-settings', '{}');
      storage.set('skymap-offline', '{}');
      storage.set('theme-customization', '{}');
      storage.set('unrelated-key', '{}');

      Object.defineProperty(localStorage, 'length', {
        value: storage.size,
        configurable: true,
      });
      const keys = Array.from(storage.keys());
      Object.defineProperty(localStorage, 'key', {
        value: jest.fn((i: number) => keys[i] ?? null),
        configurable: true,
      });

      const stores = await adapter.listStores();
      expect(stores).toContain('starmap-settings');
      expect(stores).toContain('skymap-offline');
      expect(stores).not.toContain('theme-customization');
      expect(stores).not.toContain('unrelated-key');
      expect(stores).toHaveLength(2);
    });

    it('should return empty array when localStorage is not available', async () => {
      mockSetItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      const stores = await adapter.listStores();
      expect(stores).toEqual([]);
    });
  });

  // ============================================================================
  // exportAllData
  // ============================================================================
  describe('exportAllData', () => {
    let originalCreateObjectURL: typeof URL.createObjectURL;
    let originalRevokeObjectURL: typeof URL.revokeObjectURL;

    beforeEach(() => {
      // URL.createObjectURL/revokeObjectURL don't exist in jsdom, define them
      originalCreateObjectURL = URL.createObjectURL;
      originalRevokeObjectURL = URL.revokeObjectURL;
      URL.createObjectURL = jest.fn().mockReturnValue('blob:mock');
      URL.revokeObjectURL = jest.fn();
    });

    afterEach(() => {
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
      jest.restoreAllMocks();
    });

    it('should trigger file download with correct data', async () => {
      const storageMap = new Map<string, string>();
      storageMap.set('starmap-settings', '{"theme":"dark"}');

      Object.defineProperty(localStorage, 'length', { value: 1, configurable: true });
      Object.defineProperty(localStorage, 'key', {
        value: jest.fn((i: number) => (i === 0 ? 'starmap-settings' : null)),
        configurable: true,
      });
      mockGetItem.mockImplementation((k: string) => storageMap.get(k) ?? null);

      const mockClick = jest.fn();
      const mockAnchor = { href: '', download: '', click: mockClick } as unknown as HTMLAnchorElement;
      const createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue(mockAnchor);
      jest.spyOn(document.body, 'appendChild').mockImplementation(() => mockAnchor);
      jest.spyOn(document.body, 'removeChild').mockImplementation(() => mockAnchor);

      await adapter.exportAllData();

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(mockClick).toHaveBeenCalled();
      expect(URL.createObjectURL).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock');
    });

    it('should handle non-JSON data in stores', async () => {
      Object.defineProperty(localStorage, 'length', { value: 1, configurable: true });
      Object.defineProperty(localStorage, 'key', {
        value: jest.fn((i: number) => (i === 0 ? 'starmap-raw' : null)),
        configurable: true,
      });
      mockGetItem.mockImplementation((k: string) =>
        k === 'starmap-raw' ? 'not-valid-json' : null
      );

      const mockClick = jest.fn();
      const mockAnchor = { href: '', download: '', click: mockClick } as unknown as HTMLAnchorElement;
      jest.spyOn(document, 'createElement').mockReturnValue(mockAnchor);
      jest.spyOn(document.body, 'appendChild').mockImplementation(() => mockAnchor);
      jest.spyOn(document.body, 'removeChild').mockImplementation(() => mockAnchor);

      // Should not throw even with invalid JSON data
      await expect(adapter.exportAllData()).resolves.toBeUndefined();
    });

    it('should throw when localStorage is not available', async () => {
      mockSetItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      await expect(adapter.exportAllData()).rejects.toThrow('localStorage is not available');
    });
  });

  // ============================================================================
  // importAllData
  // ============================================================================
  describe('importAllData', () => {
    it('should throw when no data provided', async () => {
      await expect(adapter.importAllData()).rejects.toThrow('No data provided');
    });

    it('should import object values as JSON strings', async () => {
      const exportData = JSON.stringify({
        metadata: {
          version: '1.0',
          exported_at: new Date().toISOString(),
          app_version: '0.1.0',
          store_count: 1,
        },
        stores: { 'starmap-settings': { theme: 'dark' } },
      });
      const result = await adapter.importAllData(exportData);
      expect(result.imported_count).toBe(1);
      expect(result.skipped_count).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(mockSetItem).toHaveBeenCalledWith(
        'starmap-settings',
        JSON.stringify({ theme: 'dark' })
      );
    });

    it('should import string values directly', async () => {
      const exportData = JSON.stringify({
        metadata: {
          version: '1.0',
          exported_at: '',
          app_version: '0.1.0',
          store_count: 1,
        },
        stores: { 'starmap-raw': 'raw-string-value' },
      });
      const result = await adapter.importAllData(exportData);
      expect(result.imported_count).toBe(1);
      expect(mockSetItem).toHaveBeenCalledWith('starmap-raw', 'raw-string-value');
    });

    it('should count errors when setItem throws', async () => {
      mockSetItem.mockImplementation((key: string) => {
        if (key === 'starmap-settings') throw new Error('QuotaExceeded');
        // Allow the isAvailable check
        if (key === '__storage_test__') return;
      });
      const exportData = JSON.stringify({
        metadata: {
          version: '1.0',
          exported_at: '',
          app_version: '0.1.0',
          store_count: 1,
        },
        stores: { 'starmap-settings': { theme: 'dark' } },
      });
      const result = await adapter.importAllData(exportData);
      expect(result.skipped_count).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('starmap-settings');
    });

    it('should throw when localStorage is not available', async () => {
      mockSetItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      await expect(adapter.importAllData('data')).rejects.toThrow(
        'localStorage is not available'
      );
    });

    it('should return metadata from import', async () => {
      const metadata = {
        version: '2.0',
        exported_at: '2024-06-15T12:00:00Z',
        app_version: '1.0.0',
        store_count: 2,
      };
      const exportData = JSON.stringify({
        metadata,
        stores: { 'starmap-settings': {} },
      });
      const result = await adapter.importAllData(exportData);
      expect(result.metadata).toEqual(metadata);
    });
  });

  // ============================================================================
  // getStorageStats
  // ============================================================================
  describe('getStorageStats', () => {
    it('should calculate total size from stores', async () => {
      Object.defineProperty(localStorage, 'length', { value: 1, configurable: true });
      Object.defineProperty(localStorage, 'key', {
        value: jest.fn((i: number) => (i === 0 ? 'starmap-settings' : null)),
        configurable: true,
      });
      mockGetItem.mockImplementation((k: string) =>
        k === 'starmap-settings' ? '{"theme":"dark"}' : null
      );

      const stats = await adapter.getStorageStats();
      expect(stats.store_count).toBe(1);
      expect(stats.total_size).toBeGreaterThan(0);
      expect(stats.stores).toHaveLength(1);
      expect(stats.stores[0].name).toBe('starmap-settings');
      expect(stats.directory).toBe('localStorage');
    });

    it('should return empty stats when localStorage is not available', async () => {
      mockSetItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      const stats = await adapter.getStorageStats();
      expect(stats.total_size).toBe(0);
      expect(stats.store_count).toBe(0);
      expect(stats.stores).toEqual([]);
      expect(stats.directory).toBe('localStorage');
    });

    it('should handle stores with empty data', async () => {
      Object.defineProperty(localStorage, 'length', { value: 1, configurable: true });
      Object.defineProperty(localStorage, 'key', {
        value: jest.fn((i: number) => (i === 0 ? 'starmap-empty' : null)),
        configurable: true,
      });
      mockGetItem.mockReturnValue('');

      const stats = await adapter.getStorageStats();
      expect(stats.store_count).toBe(1);
      expect(stats.stores[0].size).toBe(0);
    });
  });

  // ============================================================================
  // getDataDirectory
  // ============================================================================
  describe('getDataDirectory', () => {
    it('should return localStorage', async () => {
      const dir = await adapter.getDataDirectory();
      expect(dir).toBe('localStorage');
    });
  });

  // ============================================================================
  // clearAllData
  // ============================================================================
  describe('clearAllData', () => {
    it('should remove all listed stores and return count', async () => {
      Object.defineProperty(localStorage, 'length', { value: 2, configurable: true });
      Object.defineProperty(localStorage, 'key', {
        value: jest.fn((i: number) => {
          const keys = ['starmap-settings', 'skymap-offline'];
          return keys[i] ?? null;
        }),
        configurable: true,
      });

      const count = await adapter.clearAllData();
      expect(count).toBe(2);
      expect(mockRemoveItem).toHaveBeenCalledWith('starmap-settings');
      expect(mockRemoveItem).toHaveBeenCalledWith('skymap-offline');
    });

    it('should return 0 when no stores exist', async () => {
      Object.defineProperty(localStorage, 'length', { value: 0, configurable: true });
      const count = await adapter.clearAllData();
      expect(count).toBe(0);
    });

    it('should return 0 when localStorage is not available', async () => {
      mockSetItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      const count = await adapter.clearAllData();
      expect(count).toBe(0);
    });
  });
});

describe('webStorageAdapter singleton', () => {
  it('should export a singleton instance', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('../web-storage') as { webStorageAdapter: WebStorageAdapter };
    expect(mod.webStorageAdapter).toBeInstanceOf(WebStorageAdapter);
  });
});

describe('readFileAsText', () => {
  it('should read a file as text', async () => {
    const file = new File(['hello world'], 'test.txt', { type: 'text/plain' });
    const text = await readFileAsText(file);
    expect(text).toBe('hello world');
  });

  it('should handle empty files', async () => {
    const file = new File([''], 'empty.txt', { type: 'text/plain' });
    const text = await readFileAsText(file);
    expect(text).toBe('');
  });
});
