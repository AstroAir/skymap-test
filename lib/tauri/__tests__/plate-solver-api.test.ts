/**
 * Tests for plate-solver-api.ts
 */

import {
  formatFileSize,
  getSolverDisplayName,
  isLocalSolver,
  convertToLegacyResult,
  DEFAULT_SOLVER_CONFIG,
} from '../plate-solver-api';
import type { SolveResult, SolverType } from '../plate-solver-api';

// Mock Tauri invoke
jest.mock('@tauri-apps/api/core', () => ({
  invoke: jest.fn(),
}));

describe('plate-solver-api', () => {
  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(500)).toBe('500 B');
    });

    it('should format kilobytes correctly', () => {
      expect(formatFileSize(1024)).toBe('1.0 KB');
      expect(formatFileSize(2048)).toBe('2.0 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });

    it('should format megabytes correctly', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
      expect(formatFileSize(50 * 1024 * 1024)).toBe('50.0 MB');
      expect(formatFileSize(512 * 1024 * 1024)).toBe('512.0 MB');
    });

    it('should format gigabytes correctly', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.00 GB');
      expect(formatFileSize(2.5 * 1024 * 1024 * 1024)).toBe('2.50 GB');
    });

    it('should handle zero bytes', () => {
      expect(formatFileSize(0)).toBe('0 B');
    });
  });

  describe('getSolverDisplayName', () => {
    it('should return correct name for ASTAP', () => {
      expect(getSolverDisplayName('astap')).toBe('ASTAP');
    });

    it('should return correct name for local Astrometry.net', () => {
      expect(getSolverDisplayName('astrometry_net')).toBe('Astrometry.net (Local)');
    });

    it('should return correct name for online Astrometry.net', () => {
      expect(getSolverDisplayName('astrometry_net_online')).toBe('Astrometry.net (Online)');
    });

    it('should return the type itself for unknown types', () => {
      expect(getSolverDisplayName('unknown' as SolverType)).toBe('unknown');
    });
  });

  describe('isLocalSolver', () => {
    it('should return true for ASTAP', () => {
      expect(isLocalSolver('astap')).toBe(true);
    });

    it('should return true for local Astrometry.net', () => {
      expect(isLocalSolver('astrometry_net')).toBe(true);
    });

    it('should return false for online Astrometry.net', () => {
      expect(isLocalSolver('astrometry_net_online')).toBe(false);
    });
  });

  describe('convertToLegacyResult', () => {
    it('should convert successful result correctly', () => {
      const solveResult: SolveResult = {
        success: true,
        ra: 180.5,
        dec: 45.25,
        ra_hms: '12h02m00s',
        dec_dms: '+45°15\'00"',
        position_angle: 15.5,
        pixel_scale: 1.25,
        fov_width: 2.5,
        fov_height: 1.8,
        flipped: false,
        solver_name: 'ASTAP',
        solve_time_ms: 5000,
        error_message: null,
        wcs_file: '/path/to/file.wcs',
      };

      const legacy = convertToLegacyResult(solveResult);

      expect(legacy.success).toBe(true);
      expect(legacy.coordinates).toEqual({
        ra: 180.5,
        dec: 45.25,
        raHMS: '12h02m00s',
        decDMS: '+45°15\'00"',
      });
      expect(legacy.positionAngle).toBe(15.5);
      expect(legacy.pixelScale).toBe(1.25);
      expect(legacy.fov).toEqual({ width: 2.5, height: 1.8 });
      expect(legacy.flipped).toBe(false);
      expect(legacy.solverName).toBe('ASTAP');
      expect(legacy.solveTime).toBe(5000);
      expect(legacy.errorMessage).toBeUndefined();
    });

    it('should convert failed result correctly', () => {
      const solveResult: SolveResult = {
        success: false,
        ra: null,
        dec: null,
        ra_hms: null,
        dec_dms: null,
        position_angle: null,
        pixel_scale: null,
        fov_width: null,
        fov_height: null,
        flipped: null,
        solver_name: 'ASTAP',
        solve_time_ms: 1000,
        error_message: 'Not enough stars detected',
        wcs_file: null,
      };

      const legacy = convertToLegacyResult(solveResult);

      expect(legacy.success).toBe(false);
      expect(legacy.coordinates).toBeNull();
      expect(legacy.positionAngle).toBe(0);
      expect(legacy.pixelScale).toBe(0);
      expect(legacy.fov).toEqual({ width: 0, height: 0 });
      expect(legacy.flipped).toBe(false);
      expect(legacy.solverName).toBe('ASTAP');
      expect(legacy.solveTime).toBe(1000);
      expect(legacy.errorMessage).toBe('Not enough stars detected');
    });

    it('should handle null values in successful result', () => {
      const solveResult: SolveResult = {
        success: true,
        ra: 100.0,
        dec: -20.0,
        ra_hms: null,
        dec_dms: null,
        position_angle: null,
        pixel_scale: null,
        fov_width: null,
        fov_height: null,
        flipped: null,
        solver_name: 'Test',
        solve_time_ms: 0,
        error_message: null,
        wcs_file: null,
      };

      const legacy = convertToLegacyResult(solveResult);

      expect(legacy.success).toBe(true);
      expect(legacy.coordinates).toEqual({
        ra: 100.0,
        dec: -20.0,
        raHMS: '',
        decDMS: '',
      });
    });
  });

  describe('DEFAULT_SOLVER_CONFIG', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_SOLVER_CONFIG.solver_type).toBe('astap');
      expect(DEFAULT_SOLVER_CONFIG.executable_path).toBeNull();
      expect(DEFAULT_SOLVER_CONFIG.index_path).toBeNull();
      expect(DEFAULT_SOLVER_CONFIG.timeout_seconds).toBe(120);
      expect(DEFAULT_SOLVER_CONFIG.downsample).toBe(0);
      expect(DEFAULT_SOLVER_CONFIG.search_radius).toBe(30.0);
      expect(DEFAULT_SOLVER_CONFIG.use_sip).toBe(true);
    });

    it('should have correct ASTAP default values', () => {
      expect(DEFAULT_SOLVER_CONFIG.astap_database).toBeNull();
      expect(DEFAULT_SOLVER_CONFIG.astap_max_stars).toBe(500);
      expect(DEFAULT_SOLVER_CONFIG.astap_tolerance).toBe(0.007);
      expect(DEFAULT_SOLVER_CONFIG.astap_speed_mode).toBe('auto');
      expect(DEFAULT_SOLVER_CONFIG.astap_min_star_size).toBe(1.5);
      expect(DEFAULT_SOLVER_CONFIG.astap_equalise_background).toBe(false);
    });

    it('should have correct Astrometry.net default values', () => {
      expect(DEFAULT_SOLVER_CONFIG.astrometry_scale_low).toBeNull();
      expect(DEFAULT_SOLVER_CONFIG.astrometry_scale_high).toBeNull();
      expect(DEFAULT_SOLVER_CONFIG.astrometry_scale_units).toBe('deg_width');
      expect(DEFAULT_SOLVER_CONFIG.astrometry_depth).toBeNull();
      expect(DEFAULT_SOLVER_CONFIG.astrometry_no_plots).toBe(true);
      expect(DEFAULT_SOLVER_CONFIG.astrometry_no_verify).toBe(false);
      expect(DEFAULT_SOLVER_CONFIG.astrometry_crpix_center).toBe(true);
    });

    it('should have correct general default values', () => {
      expect(DEFAULT_SOLVER_CONFIG.keep_wcs_file).toBe(true);
      expect(DEFAULT_SOLVER_CONFIG.auto_hints).toBe(true);
      expect(DEFAULT_SOLVER_CONFIG.retry_on_failure).toBe(false);
      expect(DEFAULT_SOLVER_CONFIG.max_retries).toBe(2);
    });
  });
});
