/**
 * Tests for cache/migration.ts
 */

import {
  getCacheVersion,
  isMigrationNeeded,
  runMigrations,
  initializeCacheSystem,
} from '../migration';

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
