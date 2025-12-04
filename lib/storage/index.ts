/**
 * Storage abstraction layer
 * Automatically selects the appropriate storage adapter based on the platform
 */

export * from './types';
export * from './platform';
export { webStorageAdapter, readFileAsText } from './web-storage';
export { tauriStorageAdapter } from './tauri-storage';
export { createZustandStorage, getZustandStorage } from './zustand-storage';

import type { StorageAdapter, ImportResult, StorageStats } from './types';
import { isTauri, isServer } from './platform';
import { webStorageAdapter } from './web-storage';
import { tauriStorageAdapter } from './tauri-storage';

/**
 * Get the appropriate storage adapter for the current platform
 */
export function getStorageAdapter(): StorageAdapter {
  if (isServer()) {
    // Return a no-op adapter for SSR
    return {
      isAvailable: () => false,
      saveStore: async () => {},
      loadStore: async () => null,
      deleteStore: async () => false,
      listStores: async () => [],
      exportAllData: async () => {},
      importAllData: async () => ({
        imported_count: 0,
        skipped_count: 0,
        errors: ['Not available on server'],
        metadata: {
          version: '0',
          exported_at: '',
          app_version: '',
          store_count: 0,
        },
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
  }

  if (isTauri()) {
    return tauriStorageAdapter;
  }

  return webStorageAdapter;
}

/**
 * Unified storage API that automatically uses the correct adapter
 */
export const storage = {
  /**
   * Check if storage is available
   */
  isAvailable(): boolean {
    return getStorageAdapter().isAvailable();
  },

  /**
   * Save store data
   */
  async saveStore(storeName: string, data: string): Promise<void> {
    return getStorageAdapter().saveStore(storeName, data);
  },

  /**
   * Load store data
   */
  async loadStore(storeName: string): Promise<string | null> {
    return getStorageAdapter().loadStore(storeName);
  },

  /**
   * Delete store data
   */
  async deleteStore(storeName: string): Promise<boolean> {
    return getStorageAdapter().deleteStore(storeName);
  },

  /**
   * List all stores
   */
  async listStores(): Promise<string[]> {
    return getStorageAdapter().listStores();
  },

  /**
   * Export all data
   */
  async exportAllData(path?: string): Promise<void> {
    return getStorageAdapter().exportAllData(path);
  },

  /**
   * Import all data
   */
  async importAllData(pathOrData?: string): Promise<ImportResult> {
    return getStorageAdapter().importAllData(pathOrData);
  },

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<StorageStats> {
    return getStorageAdapter().getStorageStats();
  },

  /**
   * Get data directory
   */
  async getDataDirectory(): Promise<string> {
    return getStorageAdapter().getDataDirectory();
  },

  /**
   * Clear all data
   */
  async clearAllData(): Promise<number> {
    return getStorageAdapter().clearAllData();
  },
};
