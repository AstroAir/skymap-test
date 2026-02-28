/**
 * Tests for storage/types.ts
 * Storage type definitions and constants
 */

import { KNOWN_STORES } from '../types';
import type {
  ExportMetadata,
  ExportData,
  ImportResult,
  StoreInfo,
  StorageStats,
  StorageAdapter,
  KnownStoreName,
} from '../types';

describe('KNOWN_STORES', () => {
  it('should be a non-empty array', () => {
    expect(KNOWN_STORES.length).toBeGreaterThan(0);
  });

  it('should contain exactly 10 entries', () => {
    expect(KNOWN_STORES.length).toBe(10);
  });

  it('should contain all expected store names', () => {
    const expected = [
      'starmap-target-list',
      'starmap-markers',
      'starmap-settings',
      'starmap-equipment',
      'starmap-feedback',
      'theme-customization',
      'starmap-onboarding',
      'starmap-daily-knowledge',
      'skymap-offline',
      'skymap-locale',
    ];
    for (const name of expected) {
      expect(KNOWN_STORES).toContain(name);
    }
  });

  it('should have unique entries', () => {
    const unique = new Set(KNOWN_STORES);
    expect(unique.size).toBe(KNOWN_STORES.length);
  });

  it('all entries should use starmap-/skymap-/theme- prefix', () => {
    for (const name of KNOWN_STORES) {
      expect(
        name.startsWith('starmap-') ||
          name.startsWith('skymap-') ||
          name.startsWith('theme-')
      ).toBe(true);
    }
  });
});

describe('Type interfaces (compile-time checks)', () => {
  it('ExportMetadata should be assignable', () => {
    const meta: ExportMetadata = {
      version: '1.0',
      exported_at: '2024-01-01',
      app_version: '0.1.0',
      store_count: 1,
    };
    expect(meta.version).toBe('1.0');
    expect(meta.store_count).toBe(1);
  });

  it('ExportData should be assignable', () => {
    const data: ExportData = {
      metadata: {
        version: '1.0',
        exported_at: '',
        app_version: '0.1.0',
        store_count: 0,
      },
      stores: { 'starmap-settings': { theme: 'dark' } },
    };
    expect(data.stores).toHaveProperty('starmap-settings');
  });

  it('ImportResult should be assignable', () => {
    const result: ImportResult = {
      imported_count: 5,
      skipped_count: 1,
      errors: ['some error'],
      metadata: {
        version: '1.0',
        exported_at: '',
        app_version: '0.1.0',
        store_count: 6,
      },
    };
    expect(result.imported_count).toBe(5);
    expect(result.errors).toHaveLength(1);
  });

  it('StoreInfo should be assignable with optional modified', () => {
    const info: StoreInfo = { name: 'test', size: 100 };
    expect(info.modified).toBeUndefined();
    const info2: StoreInfo = { name: 'test', size: 100, modified: '2024-01-01' };
    expect(info2.modified).toBe('2024-01-01');
  });

  it('StorageStats should be assignable', () => {
    const stats: StorageStats = {
      total_size: 1024,
      store_count: 2,
      stores: [{ name: 'a', size: 512 }],
      directory: '/data',
    };
    expect(stats.total_size).toBe(1024);
  });

  it('StorageAdapter interface should define all required methods', () => {
    const adapter: StorageAdapter = {
      isAvailable: () => true,
      saveStore: async () => {},
      loadStore: async () => null,
      deleteStore: async () => false,
      listStores: async () => [],
      exportAllData: async () => {},
      importAllData: async () => ({
        imported_count: 0,
        skipped_count: 0,
        errors: [],
        metadata: { version: '1', exported_at: '', app_version: '', store_count: 0 },
      }),
      getStorageStats: async () => ({
        total_size: 0,
        store_count: 0,
        stores: [],
        directory: '',
      }),
      getDataDirectory: async () => '',
      clearAllData: async () => 0,
    };
    expect(adapter.isAvailable()).toBe(true);
  });

  it('KnownStoreName type should be valid', () => {
    const name: KnownStoreName = 'starmap-settings';
    expect(KNOWN_STORES).toContain(name);
  });
});
