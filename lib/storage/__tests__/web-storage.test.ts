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

describe('WebStorageAdapter', () => {
  let adapter: WebStorageAdapter;

  beforeEach(() => {
    adapter = new WebStorageAdapter();
    jest.clearAllMocks();
  });

  it('should report availability (localStorage mock is present)', () => {
    // isAvailable does a set/get/remove cycle; mocks don't throw → returns true
    mockSetItem.mockImplementation(() => {});
    mockRemoveItem.mockImplementation(() => {});
    expect(adapter.isAvailable()).toBe(true);
  });

  it('should call setItem on saveStore', async () => {
    mockSetItem.mockImplementation(() => {});
    mockRemoveItem.mockImplementation(() => {});
    await adapter.saveStore('starmap-test', '{"key":"value"}');
    expect(mockSetItem).toHaveBeenCalledWith('starmap-test', '{"key":"value"}');
  });

  it('should call getItem on loadStore', async () => {
    mockSetItem.mockImplementation(() => {});
    mockRemoveItem.mockImplementation(() => {});
    mockGetItem.mockReturnValue('{"a":1}');
    const data = await adapter.loadStore('starmap-test');
    expect(data).toBe('{"a":1}');
  });

  it('should return null from loadStore when getItem returns null', async () => {
    mockSetItem.mockImplementation(() => {});
    mockRemoveItem.mockImplementation(() => {});
    mockGetItem.mockReturnValue(null);
    const data = await adapter.loadStore('nonexistent');
    expect(data).toBeNull();
  });

  it('should delete a store', async () => {
    mockSetItem.mockImplementation(() => {});
    mockRemoveItem.mockImplementation(() => {});
    mockGetItem.mockReturnValue('data');
    const existed = await adapter.deleteStore('starmap-test');
    expect(existed).toBe(true);
    expect(mockRemoveItem).toHaveBeenCalledWith('starmap-test');
  });

  it('should return false when deleting non-existent store', async () => {
    mockSetItem.mockImplementation(() => {});
    mockRemoveItem.mockImplementation(() => {});
    mockGetItem.mockReturnValue(null);
    const existed = await adapter.deleteStore('nonexistent');
    expect(existed).toBe(false);
  });

  it('should throw on import without data', async () => {
    mockSetItem.mockImplementation(() => {});
    mockRemoveItem.mockImplementation(() => {});
    await expect(adapter.importAllData()).rejects.toThrow('No data provided');
  });

  it('should import data and return counts', async () => {
    mockSetItem.mockImplementation(() => {});
    mockRemoveItem.mockImplementation(() => {});
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
  });

  it('should get data directory', async () => {
    mockSetItem.mockImplementation(() => {});
    mockRemoveItem.mockImplementation(() => {});
    const dir = await adapter.getDataDirectory();
    expect(dir).toBe('localStorage');
  });
});

describe('readFileAsText', () => {
  it('should read a file as text', async () => {
    const file = new File(['hello world'], 'test.txt', { type: 'text/plain' });
    const text = await readFileAsText(file);
    expect(text).toBe('hello world');
  });
});
