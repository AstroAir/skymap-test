/**
 * @jest-environment jsdom
 */

// Mock isTauri
jest.mock('@/lib/storage/platform', () => ({
  isTauri: jest.fn(() => false),
}));

// Mock @tauri-apps/api/core
const mockInvoke = jest.fn();
jest.mock('@tauri-apps/api/core', () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}));

import { isTauri } from '@/lib/storage/platform';
import { pathConfigApi } from '../path-config-api';
import type { PathInfo, DirectoryValidation, MigrationResult } from '../path-config-api';

const mockIsTauri = isTauri as jest.Mock;

describe('pathConfigApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsTauri.mockReturnValue(true);
  });

  // --------------------------------------------------------------------------
  // isAvailable
  // --------------------------------------------------------------------------

  describe('isAvailable', () => {
    it('returns isTauri result', () => {
      mockIsTauri.mockReturnValue(true);
      expect(pathConfigApi.isAvailable()).toBe(true);

      mockIsTauri.mockReturnValue(false);
      expect(pathConfigApi.isAvailable()).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // getPathConfig
  // --------------------------------------------------------------------------

  describe('getPathConfig', () => {
    it('invokes get_path_config command', async () => {
      const expected: PathInfo = {
        data_dir: '/data',
        cache_dir: '/cache',
        default_data_dir: '/default',
        default_cache_dir: '/default',
        has_custom_data_dir: false,
        has_custom_cache_dir: false,
      };
      mockInvoke.mockResolvedValue(expected);

      const result = await pathConfigApi.getPathConfig();

      expect(mockInvoke).toHaveBeenCalledWith('get_path_config');
      expect(result).toEqual(expected);
    });

    it('throws when not in Tauri environment', async () => {
      mockIsTauri.mockReturnValue(false);

      await expect(pathConfigApi.getPathConfig()).rejects.toThrow(
        'Path config API is only available in desktop environment'
      );
    });
  });

  // --------------------------------------------------------------------------
  // setCustomDataDir
  // --------------------------------------------------------------------------

  describe('setCustomDataDir', () => {
    it('invokes set_custom_data_dir with path', async () => {
      mockInvoke.mockResolvedValue(undefined);

      await pathConfigApi.setCustomDataDir('/new/data');

      expect(mockInvoke).toHaveBeenCalledWith('set_custom_data_dir', { path: '/new/data' });
    });

    it('throws when not in Tauri environment', async () => {
      mockIsTauri.mockReturnValue(false);

      await expect(pathConfigApi.setCustomDataDir('/path')).rejects.toThrow(
        'Path config API is only available in desktop environment'
      );
    });
  });

  // --------------------------------------------------------------------------
  // setCustomCacheDir
  // --------------------------------------------------------------------------

  describe('setCustomCacheDir', () => {
    it('invokes set_custom_cache_dir with path', async () => {
      mockInvoke.mockResolvedValue(undefined);

      await pathConfigApi.setCustomCacheDir('/new/cache');

      expect(mockInvoke).toHaveBeenCalledWith('set_custom_cache_dir', { path: '/new/cache' });
    });
  });

  // --------------------------------------------------------------------------
  // migrateDataDir
  // --------------------------------------------------------------------------

  describe('migrateDataDir', () => {
    it('invokes migrate_data_dir with targetDir', async () => {
      const expected: MigrationResult = {
        success: true,
        files_copied: 10,
        bytes_copied: 5000,
        error: null,
      };
      mockInvoke.mockResolvedValue(expected);

      const result = await pathConfigApi.migrateDataDir('/target/data');

      expect(mockInvoke).toHaveBeenCalledWith('migrate_data_dir', { targetDir: '/target/data' });
      expect(result).toEqual(expected);
    });

    it('returns error result on failure', async () => {
      const expected: MigrationResult = {
        success: false,
        files_copied: 0,
        bytes_copied: 0,
        error: 'Permission denied',
      };
      mockInvoke.mockResolvedValue(expected);

      const result = await pathConfigApi.migrateDataDir('/restricted');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Permission denied');
    });
  });

  // --------------------------------------------------------------------------
  // migrateCacheDir
  // --------------------------------------------------------------------------

  describe('migrateCacheDir', () => {
    it('invokes migrate_cache_dir with targetDir', async () => {
      const expected: MigrationResult = {
        success: true,
        files_copied: 50,
        bytes_copied: 100000,
        error: null,
      };
      mockInvoke.mockResolvedValue(expected);

      const result = await pathConfigApi.migrateCacheDir('/target/cache');

      expect(mockInvoke).toHaveBeenCalledWith('migrate_cache_dir', { targetDir: '/target/cache' });
      expect(result).toEqual(expected);
    });
  });

  // --------------------------------------------------------------------------
  // resetPathsToDefault
  // --------------------------------------------------------------------------

  describe('resetPathsToDefault', () => {
    it('invokes reset_paths_to_default command', async () => {
      mockInvoke.mockResolvedValue(undefined);

      await pathConfigApi.resetPathsToDefault();

      expect(mockInvoke).toHaveBeenCalledWith('reset_paths_to_default');
    });
  });

  // --------------------------------------------------------------------------
  // validateDirectory
  // --------------------------------------------------------------------------

  describe('validateDirectory', () => {
    it('invokes validate_directory with path', async () => {
      const expected: DirectoryValidation = {
        valid: true,
        exists: true,
        writable: true,
        available_bytes: 1073741824,
        error: null,
      };
      mockInvoke.mockResolvedValue(expected);

      const result = await pathConfigApi.validateDirectory('/test/path');

      expect(mockInvoke).toHaveBeenCalledWith('validate_directory', { path: '/test/path' });
      expect(result).toEqual(expected);
    });

    it('returns invalid for non-writable directory', async () => {
      const expected: DirectoryValidation = {
        valid: false,
        exists: true,
        writable: false,
        available_bytes: null,
        error: 'Directory is not writable',
      };
      mockInvoke.mockResolvedValue(expected);

      const result = await pathConfigApi.validateDirectory('/readonly');

      expect(result.valid).toBe(false);
      expect(result.writable).toBe(false);
      expect(result.error).toBe('Directory is not writable');
    });

    it('returns invalid for empty path', async () => {
      const expected: DirectoryValidation = {
        valid: false,
        exists: false,
        writable: false,
        available_bytes: null,
        error: 'Path is empty',
      };
      mockInvoke.mockResolvedValue(expected);

      const result = await pathConfigApi.validateDirectory('');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Path is empty');
    });
  });

  // --------------------------------------------------------------------------
  // Type Exports
  // --------------------------------------------------------------------------

  describe('Type Exports', () => {
    it('PathInfo type is compatible', () => {
      const info: PathInfo = {
        data_dir: '/data',
        cache_dir: '/cache',
        default_data_dir: '/default',
        default_cache_dir: '/default',
        has_custom_data_dir: true,
        has_custom_cache_dir: false,
      };
      expect(info.has_custom_data_dir).toBe(true);
    });

    it('DirectoryValidation type is compatible', () => {
      const validation: DirectoryValidation = {
        valid: true,
        exists: true,
        writable: true,
        available_bytes: 1024,
        error: null,
      };
      expect(validation.valid).toBe(true);
    });

    it('MigrationResult type is compatible', () => {
      const result: MigrationResult = {
        success: true,
        files_copied: 10,
        bytes_copied: 5000,
        error: null,
      };
      expect(result.success).toBe(true);
    });
  });
});
