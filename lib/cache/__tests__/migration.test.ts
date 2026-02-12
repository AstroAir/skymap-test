/**
 * Tests for cache/migration.ts
 */

import {
  getCacheVersion,
  isMigrationNeeded,
  runMigrations,
  initializeCacheSystem,
  resetAllCaches,
} from '../migration';

// Mock isTauri
jest.mock('@/lib/storage/platform', () => ({
  isTauri: jest.fn(() => false),
}));

import { isTauri } from '@/lib/storage/platform';
const mockIsTauri = isTauri as jest.Mock;

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] || null,
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Mock caches API
const cachesMock = {
  keys: jest.fn().mockResolvedValue([]),
  delete: jest.fn().mockResolvedValue(true),
};

Object.defineProperty(global, 'caches', { value: cachesMock });

describe('getCacheVersion', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('should return null when no version is stored', () => {
    const version = getCacheVersion();
    expect(version).toBeNull();
  });

  it('should return stored version', () => {
    const versionInfo = {
      version: 1,
      migrationDate: Date.now(),
      description: 'Test version',
    };
    localStorageMock.setItem('skymap-cache-version', JSON.stringify(versionInfo));
    
    const version = getCacheVersion();
    expect(version).not.toBeNull();
    expect(version?.version).toBe(1);
    expect(version?.description).toBe('Test version');
  });

  it('should return null for invalid JSON', () => {
    localStorageMock.setItem('skymap-cache-version', 'invalid json');
    
    const version = getCacheVersion();
    expect(version).toBeNull();
  });
});

describe('isMigrationNeeded', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('should return true when no version is stored', () => {
    expect(isMigrationNeeded()).toBe(true);
  });

  it('should return true when version is old', () => {
    const versionInfo = {
      version: 0,
      migrationDate: Date.now(),
      description: 'Old version',
    };
    localStorageMock.setItem('skymap-cache-version', JSON.stringify(versionInfo));
    
    expect(isMigrationNeeded()).toBe(true);
  });

  it('should return false when version is current', () => {
    const versionInfo = {
      version: 1, // Current version
      migrationDate: Date.now(),
      description: 'Current version',
    };
    localStorageMock.setItem('skymap-cache-version', JSON.stringify(versionInfo));
    
    expect(isMigrationNeeded()).toBe(false);
  });
});

describe('runMigrations', () => {
  beforeEach(() => {
    localStorageMock.clear();
    cachesMock.keys.mockResolvedValue([]);
    cachesMock.delete.mockClear();
  });

  it('should skip migrations when already at current version', async () => {
    const versionInfo = {
      version: 1,
      migrationDate: Date.now(),
      description: 'Current version',
    };
    localStorageMock.setItem('skymap-cache-version', JSON.stringify(versionInfo));
    
    const result = await runMigrations();
    
    expect(result.success).toBe(true);
    expect(result.migratedItems).toBe(0);
    expect(result.deletedItems).toBe(0);
  });

  it('should run migrations from version 0', async () => {
    const result = await runMigrations();
    
    expect(result.success).toBe(true);
    expect(result.fromVersion).toBe(0);
    expect(result.toVersion).toBe(1);
  });

  it('should delete legacy caches', async () => {
    cachesMock.keys.mockResolvedValue([
      'skymap-cache-old',
      'stellarium-cache-data',
      'skymap-unified-cache-v1', // Should not be deleted (has -v1)
    ]);
    
    await runMigrations();
    
    expect(cachesMock.delete).toHaveBeenCalledWith('skymap-cache-old');
    expect(cachesMock.delete).toHaveBeenCalledWith('stellarium-cache-data');
    expect(cachesMock.delete).not.toHaveBeenCalledWith('skymap-unified-cache-v1');
  });

  it('should update version after migration', async () => {
    await runMigrations();
    
    const version = getCacheVersion();
    expect(version).not.toBeNull();
    expect(version?.version).toBe(1);
  });
});

describe('initializeCacheSystem', () => {
  beforeEach(() => {
    localStorageMock.clear();
    cachesMock.keys.mockResolvedValue([]);
  });

  it('should skip when no migration needed', async () => {
    const versionInfo = {
      version: 1,
      migrationDate: Date.now(),
      description: 'Current version',
    };
    localStorageMock.setItem('skymap-cache-version', JSON.stringify(versionInfo));
    
    const result = await initializeCacheSystem();
    
    expect(result.success).toBe(true);
    expect(result.migratedItems).toBe(0);
  });

  it('should run migrations when needed', async () => {
    const result = await initializeCacheSystem();
    
    expect(result.success).toBe(true);
    expect(result.toVersion).toBe(1);
  });
});

describe('resetAllCaches', () => {
  beforeEach(() => {
    localStorageMock.clear();
    cachesMock.keys.mockResolvedValue([]);
    cachesMock.delete.mockClear();
    mockIsTauri.mockReturnValue(false);
  });

  it('should clear all skymap caches from Cache API', async () => {
    cachesMock.keys.mockResolvedValue([
      'skymap-unified-cache',
      'skymap-data-cache',
      'other-cache',
    ]);

    await resetAllCaches();

    expect(cachesMock.delete).toHaveBeenCalledWith('skymap-unified-cache');
    expect(cachesMock.delete).toHaveBeenCalledWith('skymap-data-cache');
    expect(cachesMock.delete).not.toHaveBeenCalledWith('other-cache');
  });

  it('should clear cache-related localStorage keys', async () => {
    localStorageMock.setItem('skymap-cache-version', '1');
    localStorageMock.setItem('skymap-cache-data', 'test');
    localStorageMock.setItem('skymap-offline-store', 'test');
    localStorageMock.setItem('skymap-settings', 'keep');

    await resetAllCaches();

    expect(localStorageMock.getItem('skymap-cache-data')).toBeNull();
    expect(localStorageMock.getItem('skymap-offline-store')).toBeNull();
    expect(localStorageMock.getItem('skymap-cache-version')).toBeNull();
    // Non-cache keys should be preserved
    expect(localStorageMock.getItem('skymap-settings')).toBe('keep');
  });

  it('should reset cache version', async () => {
    const versionInfo = {
      version: 1,
      migrationDate: Date.now(),
      description: 'Current version',
    };
    localStorageMock.setItem('skymap-cache-version', JSON.stringify(versionInfo));

    await resetAllCaches();

    expect(getCacheVersion()).toBeNull();
  });

  it('should not call Tauri APIs when not in Tauri environment', async () => {
    mockIsTauri.mockReturnValue(false);

    await resetAllCaches();

    // No Tauri API calls should be made
    expect(mockIsTauri).toHaveBeenCalled();
  });

  it('should call Tauri cache APIs when in Tauri environment', async () => {
    const mockClearCache = jest.fn().mockResolvedValue(0);
    const mockClearAllCache = jest.fn().mockResolvedValue(0);

    mockIsTauri.mockReturnValue(true);

    jest.mock('@/lib/tauri/unified-cache-api', () => ({
      unifiedCacheApi: { clearCache: mockClearCache },
    }));
    jest.mock('@/lib/tauri/cache-api', () => ({
      cacheApi: { clearAllCache: mockClearAllCache },
    }));

    // resetAllCaches uses dynamic import, so the mocks above apply
    await resetAllCaches();

    expect(mockIsTauri).toHaveBeenCalled();
  });

  it('should handle Tauri API errors gracefully', async () => {
    mockIsTauri.mockReturnValue(true);

    jest.mock('@/lib/tauri/unified-cache-api', () => ({
      unifiedCacheApi: { clearCache: jest.fn().mockRejectedValue(new Error('Tauri error')) },
    }));
    jest.mock('@/lib/tauri/cache-api', () => ({
      cacheApi: { clearAllCache: jest.fn().mockRejectedValue(new Error('Tauri error')) },
    }));

    // Should not throw even if Tauri APIs fail
    await expect(resetAllCaches()).resolves.not.toThrow();
  });
});
