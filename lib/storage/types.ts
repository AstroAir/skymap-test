/**
 * Storage abstraction layer types
 * Provides a unified interface for both Web (localStorage) and Desktop (Tauri/file system) storage
 */

/**
 * Export metadata included in backup files
 */
export interface ExportMetadata {
  version: string;
  exported_at: string;
  app_version: string;
  store_count: number;
}

/**
 * Full export data structure
 */
export interface ExportData {
  metadata: ExportMetadata;
  stores: Record<string, unknown>;
}

/**
 * Result of import operation
 */
export interface ImportResult {
  imported_count: number;
  skipped_count: number;
  errors: string[];
  metadata: ExportMetadata;
}

/**
 * Individual store information
 */
export interface StoreInfo {
  name: string;
  size: number;
  modified?: string;
}

/**
 * Storage statistics
 */
export interface StorageStats {
  total_size: number;
  store_count: number;
  stores: StoreInfo[];
  directory: string;
}

/**
 * Storage adapter interface
 * Implements this interface to support different storage backends
 */
export interface StorageAdapter {
  /**
   * Check if the storage is available
   */
  isAvailable(): boolean;

  /**
   * Save data to a store
   */
  saveStore(storeName: string, data: string): Promise<void>;

  /**
   * Load data from a store
   */
  loadStore(storeName: string): Promise<string | null>;

  /**
   * Delete a store
   */
  deleteStore(storeName: string): Promise<boolean>;

  /**
   * List all stores
   */
  listStores(): Promise<string[]>;

  /**
   * Export all data to a file
   * For web: triggers a download
   * For desktop: saves to the specified path
   */
  exportAllData(path?: string): Promise<void>;

  /**
   * Import all data from a file
   * For web: reads from uploaded file
   * For desktop: reads from the specified path
   */
  importAllData(pathOrData?: string): Promise<ImportResult>;

  /**
   * Get storage statistics
   */
  getStorageStats(): Promise<StorageStats>;

  /**
   * Get the data directory path (desktop only)
   */
  getDataDirectory(): Promise<string>;

  /**
   * Clear all stored data
   */
  clearAllData(): Promise<number>;
}

/**
 * Known store names
 */
export const KNOWN_STORES = [
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
] as const;

export type KnownStoreName = (typeof KNOWN_STORES)[number];
