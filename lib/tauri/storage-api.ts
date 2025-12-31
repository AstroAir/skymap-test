/**
 * Tauri API wrapper for storage operations
 * Only available in Tauri desktop environment
 */

import { isTauri } from '@/lib/storage/platform';
import type { ImportResult, StorageStats } from './types';

// Lazy import to avoid errors in web environment
async function getInvoke() {
  if (!isTauri()) {
    throw new Error(
      'Tauri storage API is only available in the desktop environment. ' +
      'Please ensure you are running this application as a Tauri desktop app. ' +
      'If you need to run in a browser, use the web storage fallback instead.'
    );
  }
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke;
}

// ============================================================================
// Storage API
// ============================================================================

export const storageApi = {
  /**
   * Save data to a store
   */
  async saveStoreData(storeName: string, data: string): Promise<void> {
    const invoke = await getInvoke();
    return invoke('save_store_data', { storeName, data });
  },

  /**
   * Load data from a store
   */
  async loadStoreData(storeName: string): Promise<string | null> {
    const invoke = await getInvoke();
    return invoke('load_store_data', { storeName });
  },

  /**
   * Delete a store
   */
  async deleteStoreData(storeName: string): Promise<boolean> {
    const invoke = await getInvoke();
    return invoke('delete_store_data', { storeName });
  },

  /**
   * List all available stores
   */
  async listStores(): Promise<string[]> {
    const invoke = await getInvoke();
    return invoke('list_stores');
  },

  /**
   * Export all data to a file
   */
  async exportAllData(exportPath: string): Promise<void> {
    const invoke = await getInvoke();
    return invoke('export_all_data', { exportPath });
  },

  /**
   * Import all data from a file
   */
  async importAllData(importPath: string): Promise<ImportResult> {
    const invoke = await getInvoke();
    return invoke('import_all_data', { importPath });
  },

  /**
   * Get the data directory path
   */
  async getDataDirectory(): Promise<string> {
    const invoke = await getInvoke();
    return invoke('get_data_directory');
  },

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<StorageStats> {
    const invoke = await getInvoke();
    return invoke('get_storage_stats');
  },

  /**
   * Clear all stored data
   */
  async clearAllData(): Promise<number> {
    const invoke = await getInvoke();
    return invoke('clear_all_data');
  },

  /** Check if storage API is available */
  isAvailable: isTauri,
};

export default storageApi;
