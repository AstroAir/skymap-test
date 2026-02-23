/**
 * Tests for zustand-storage.ts
 * Unified Zustand persist storage adapter
 */

jest.mock('../platform', () => ({
  isTauri: () => false,
  isServer: () => false,
}));

import { createZustandStorage, getZustandStorage } from '../zustand-storage';

const mockGetItem = localStorage.getItem as jest.Mock;
const mockSetItem = localStorage.setItem as jest.Mock;
const mockRemoveItem = localStorage.removeItem as jest.Mock;

describe('createZustandStorage (web mode)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

  it('should call removeItem on localStorage', () => {
    mockRemoveItem.mockImplementation(() => {});
    const storage = createZustandStorage();
    storage.removeItem('test');
    expect(mockRemoveItem).toHaveBeenCalledWith('test');
  });
});

describe('getZustandStorage', () => {
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
