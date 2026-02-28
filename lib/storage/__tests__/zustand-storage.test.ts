/**
 * Tests for zustand-storage.ts
 * Unified Zustand persist storage adapter
 */

// Default: web mode
jest.mock('../platform', () => ({
  isTauri: jest.fn().mockReturnValue(false),
  isServer: jest.fn().mockReturnValue(false),
}));

jest.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }),
}));

jest.mock('@tauri-apps/api/core', () => ({
  invoke: jest.fn(),
}));

import { createZustandStorage, getZustandStorage } from '../zustand-storage';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const platformMock = require('../platform') as {
  isTauri: jest.Mock;
  isServer: jest.Mock;
};

const mockGetItem = localStorage.getItem as jest.Mock;
const mockSetItem = localStorage.setItem as jest.Mock;
const mockRemoveItem = localStorage.removeItem as jest.Mock;

// ============================================================================
// Web mode
// ============================================================================
describe('createZustandStorage (web mode)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    platformMock.isTauri.mockReturnValue(false);
    platformMock.isServer.mockReturnValue(false);
  });

  it('should return storage with getItem, setItem, removeItem', () => {
    const storage = createZustandStorage();
    expect(typeof storage.getItem).toBe('function');
    expect(typeof storage.setItem).toBe('function');
    expect(typeof storage.removeItem).toBe('function');
  });

  it('should persist and retrieve data via localStorage', () => {
    const store = new Map<string, string>();
    mockSetItem.mockImplementation((k: string, v: string) => store.set(k, v));
    mockGetItem.mockImplementation((k: string) => store.get(k) ?? null);

    const storage = createZustandStorage<{ count: number }>();
    const value = { state: { count: 42 }, version: 0 };
    storage.setItem('test-store', value);
    const retrieved = storage.getItem('test-store');
    expect(retrieved).toEqual(value);
  });

  it('should return null for non-existent key', () => {
    mockGetItem.mockReturnValue(null);
    const storage = createZustandStorage();
    expect(storage.getItem('nonexistent')).toBeNull();
  });

  it('should return null for invalid JSON in localStorage', () => {
    mockGetItem.mockReturnValue('not-valid-json{{{');
    const storage = createZustandStorage();
    expect(storage.getItem('bad-json')).toBeNull();
  });

  it('should call removeItem on localStorage', () => {
    mockRemoveItem.mockImplementation(() => {});
    const storage = createZustandStorage();
    storage.removeItem('test');
    expect(mockRemoveItem).toHaveBeenCalledWith('test');
  });

  it('should not throw when setItem fails', () => {
    mockSetItem.mockImplementation(() => {
      throw new Error('QuotaExceeded');
    });
    const storage = createZustandStorage<{ count: number }>();
    // Should not throw
    expect(() => {
      storage.setItem('test', { state: { count: 1 }, version: 0 });
    }).not.toThrow();
  });

  it('should not throw when removeItem fails', () => {
    mockRemoveItem.mockImplementation(() => {
      throw new Error('Error');
    });
    const storage = createZustandStorage();
    expect(() => {
      storage.removeItem('test');
    }).not.toThrow();
  });
});

// ============================================================================
// Server mode
// ============================================================================
describe('createZustandStorage (server mode)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    platformMock.isTauri.mockReturnValue(false);
    platformMock.isServer.mockReturnValue(true);
  });

  afterEach(() => {
    platformMock.isServer.mockReturnValue(false);
  });

  it('should return no-op storage', () => {
    const storage = createZustandStorage();
    expect(storage.getItem('test')).toBeNull();
  });

  it('setItem should be a no-op', () => {
    const storage = createZustandStorage();
    // Should not throw or do anything
    expect(() => {
      storage.setItem('test', { state: {}, version: 0 });
    }).not.toThrow();
  });

  it('removeItem should be a no-op', () => {
    const storage = createZustandStorage();
    expect(() => {
      storage.removeItem('test');
    }).not.toThrow();
  });
});

// ============================================================================
// Tauri mode
// ============================================================================
describe('createZustandStorage (Tauri mode)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    platformMock.isTauri.mockReturnValue(true);
    platformMock.isServer.mockReturnValue(false);
    // Mock localStorage for migration testing
    mockGetItem.mockReturnValue(null);
    mockSetItem.mockImplementation(() => {});
    mockRemoveItem.mockImplementation(() => {});
  });

  afterEach(() => {
    platformMock.isTauri.mockReturnValue(false);
  });

  it('should return storage with all methods', () => {
    const storage = createZustandStorage();
    expect(typeof storage.getItem).toBe('function');
    expect(typeof storage.setItem).toBe('function');
    expect(typeof storage.removeItem).toBe('function');
  });

  it('getItem should return null when no cache and no localStorage data', () => {
    const storage = createZustandStorage();
    const result = storage.getItem('nonexistent');
    expect(result).toBeNull();
  });

  it('getItem should migrate from localStorage when data exists', () => {
    const localData = JSON.stringify({ state: { theme: 'dark' }, version: 1 });
    mockGetItem.mockReturnValue(localData);

    const storage = createZustandStorage<{ theme: string }>();
    const result = storage.getItem('starmap-settings');

    expect(result).toEqual({ state: { theme: 'dark' }, version: 1 });
    // Should remove from localStorage after migration
    expect(mockRemoveItem).toHaveBeenCalledWith('starmap-settings');
  });

  it('setItem should update cache immediately', () => {
    jest.useFakeTimers();
    const storage = createZustandStorage<{ count: number }>();
    const value = { state: { count: 42 }, version: 0 };

    storage.setItem('test-store', value);

    // Should be readable from cache immediately
    const retrieved = storage.getItem('test-store');
    expect(retrieved).toEqual(value);

    jest.useRealTimers();
  });

  it('removeItem should clear from cache', () => {
    jest.useFakeTimers();
    const storage = createZustandStorage<{ count: number }>();

    // Set then remove
    storage.setItem('test-store', { state: { count: 1 }, version: 0 });
    storage.removeItem('test-store');

    // localStorage migration returns null since we've set mockGetItem to return null
    const result = storage.getItem('test-store');
    expect(result).toBeNull();

    jest.useRealTimers();
  });

  it('getItem should handle invalid JSON in localStorage gracefully', () => {
    mockGetItem.mockReturnValue('not-valid-json');
    const storage = createZustandStorage();
    // Should not throw, should return null
    const result = storage.getItem('bad-json');
    expect(result).toBeNull();
  });
});

// ============================================================================
// getZustandStorage
// ============================================================================
describe('getZustandStorage', () => {
  beforeEach(() => {
    platformMock.isTauri.mockReturnValue(false);
    platformMock.isServer.mockReturnValue(false);
  });

  it('should return a cached storage instance', () => {
    const s1 = getZustandStorage();
    const s2 = getZustandStorage();
    expect(s1).toBe(s2);
  });

  it('should have all required methods', () => {
    const storage = getZustandStorage();
    expect(typeof storage.getItem).toBe('function');
    expect(typeof storage.setItem).toBe('function');
    expect(typeof storage.removeItem).toBe('function');
  });
});
