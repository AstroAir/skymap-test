/**
 * Tauri API wrapper for path configuration management
 * Allows users to customize data and cache storage directories
 * Only available in Tauri desktop environment
 */

import { isTauri } from '@/lib/storage/platform';

// Lazy import to avoid errors in web environment
async function getInvoke() {
  if (!isTauri()) {
    throw new Error('Path config API is only available in desktop environment');
  }
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke;
}

// ============================================================================
// Types
// ============================================================================

export interface PathInfo {
  /** Current effective data directory */
  data_dir: string;
  /** Current effective cache directory */
  cache_dir: string;
  /** Default data directory (for reference) */
  default_data_dir: string;
  /** Default cache directory (for reference) */
  default_cache_dir: string;
  /** Whether a custom data directory is set */
  has_custom_data_dir: boolean;
  /** Whether a custom cache directory is set */
  has_custom_cache_dir: boolean;
}

export interface DirectoryValidation {
  valid: boolean;
  exists: boolean;
  writable: boolean;
  available_bytes: number | null;
  error: string | null;
}

export interface MigrationResult {
  success: boolean;
  files_copied: number;
  bytes_copied: number;
  error: string | null;
}

// ============================================================================
// Path Config API
// ============================================================================

export const pathConfigApi = {
  /**
   * Get current path configuration
   */
  async getPathConfig(): Promise<PathInfo> {
    const invoke = await getInvoke();
    return invoke('get_path_config');
  },

  /**
   * Set custom data directory (does not migrate existing data)
   */
  async setCustomDataDir(path: string): Promise<void> {
    const invoke = await getInvoke();
    return invoke('set_custom_data_dir', { path });
  },

  /**
   * Set custom cache directory (does not migrate existing cache)
   */
  async setCustomCacheDir(path: string): Promise<void> {
    const invoke = await getInvoke();
    return invoke('set_custom_cache_dir', { path });
  },

  /**
   * Migrate data to a new directory
   */
  async migrateDataDir(targetDir: string): Promise<MigrationResult> {
    const invoke = await getInvoke();
    return invoke('migrate_data_dir', { targetDir });
  },

  /**
   * Migrate cache to a new directory
   */
  async migrateCacheDir(targetDir: string): Promise<MigrationResult> {
    const invoke = await getInvoke();
    return invoke('migrate_cache_dir', { targetDir });
  },

  /**
   * Reset all paths to default
   */
  async resetPathsToDefault(): Promise<void> {
    const invoke = await getInvoke();
    return invoke('reset_paths_to_default');
  },

  /**
   * Validate a directory path
   */
  async validateDirectory(path: string): Promise<DirectoryValidation> {
    const invoke = await getInvoke();
    return invoke('validate_directory', { path });
  },

  /** Check if path config API is available */
  isAvailable: isTauri,
};

export default pathConfigApi;
