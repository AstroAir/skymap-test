/**
 * Tests for plate-solver-store.ts
 */

import { act, renderHook } from '@testing-library/react';
import {
  usePlateSolverStore,
  selectActiveSolver,
  selectIsLocalSolverAvailable,
  selectCanSolve,
} from '../plate-solver-store';
import type { SolverInfo } from '@/lib/tauri/plate-solver-api';

// Mock Tauri API
jest.mock('@tauri-apps/api/core', () => ({
  invoke: jest.fn(),
}));

// Mock the plate-solver-api module
jest.mock('@/lib/tauri/plate-solver-api', () => ({
  detectPlateSolvers: jest.fn(),
  loadSolverConfig: jest.fn(),
  saveSolverConfig: jest.fn(),
  getAvailableIndexes: jest.fn(),
  getInstalledIndexes: jest.fn(),
  DEFAULT_SOLVER_CONFIG: {
    solver_type: 'astap',
    executable_path: null,
    index_path: null,
    timeout_seconds: 120,
    downsample: 0,
    search_radius: 30.0,
    use_sip: true,
  },
}));

const mockDetectPlateSolvers = jest.requireMock('@/lib/tauri/plate-solver-api').detectPlateSolvers;
const mockLoadSolverConfig = jest.requireMock('@/lib/tauri/plate-solver-api').loadSolverConfig;
const mockSaveSolverConfig = jest.requireMock('@/lib/tauri/plate-solver-api').saveSolverConfig;

describe('usePlateSolverStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    usePlateSolverStore.setState({
      detectedSolvers: [],
      isDetecting: false,
      detectionError: null,
      config: {
        solver_type: 'astap',
        executable_path: null,
        index_path: null,
        timeout_seconds: 120,
        downsample: 0,
        search_radius: 30.0,
        use_sip: true,
        astap_database: null,
        astap_max_stars: 500,
        astap_tolerance: 0.007,
        astap_speed_mode: 'auto',
        astap_min_star_size: 1.5,
        astap_equalise_background: false,
        astrometry_scale_low: null,
        astrometry_scale_high: null,
        astrometry_scale_units: 'deg_width',
        astrometry_depth: null,
        astrometry_no_plots: true,
        astrometry_no_verify: false,
        astrometry_crpix_center: true,
        keep_wcs_file: true,
        auto_hints: true,
        retry_on_failure: false,
        max_retries: 2,
      },
      onlineApiKey: '',
      solveStatus: 'idle',
      solveProgress: 0,
      solveMessage: '',
      lastResult: null,
      availableIndexes: [],
      installedIndexes: [],
      isLoadingIndexes: false,
      downloadingIndexes: new Map(),
    });
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => usePlateSolverStore());

      expect(result.current.detectedSolvers).toEqual([]);
      expect(result.current.isDetecting).toBe(false);
      expect(result.current.detectionError).toBeNull();
      expect(result.current.config.solver_type).toBe('astap');
      expect(result.current.onlineApiKey).toBe('');
      expect(result.current.solveStatus).toBe('idle');
    });
  });

  describe('setConfig', () => {
    it('should update config partially', () => {
      const { result } = renderHook(() => usePlateSolverStore());

      act(() => {
        result.current.setConfig({ timeout_seconds: 180 });
      });

      expect(result.current.config.timeout_seconds).toBe(180);
      expect(result.current.config.solver_type).toBe('astap'); // unchanged
    });

    it('should update solver type', () => {
      const { result } = renderHook(() => usePlateSolverStore());

      act(() => {
        result.current.setConfig({ solver_type: 'astrometry_net' });
      });

      expect(result.current.config.solver_type).toBe('astrometry_net');
    });
  });

  describe('setOnlineApiKey', () => {
    it('should update API key', () => {
      const { result } = renderHook(() => usePlateSolverStore());

      act(() => {
        result.current.setOnlineApiKey('test-api-key');
      });

      expect(result.current.onlineApiKey).toBe('test-api-key');
    });
  });

  describe('setSolveStatus', () => {
    it('should update solve status', () => {
      const { result } = renderHook(() => usePlateSolverStore());

      act(() => {
        result.current.setSolveStatus('solving', 'Processing...', 50);
      });

      expect(result.current.solveStatus).toBe('solving');
      expect(result.current.solveMessage).toBe('Processing...');
      expect(result.current.solveProgress).toBe(50);
    });
  });

  describe('reset', () => {
    it('should reset solve state', () => {
      const { result } = renderHook(() => usePlateSolverStore());

      // Set some state first
      act(() => {
        result.current.setSolveStatus('success', 'Done', 100);
        result.current.setLastResult({
          success: true,
          ra: 180,
          dec: 45,
          ra_hms: '12h00m00s',
          dec_dms: '+45°00\'00"',
          position_angle: 0,
          pixel_scale: 1,
          fov_width: 2,
          fov_height: 1.5,
          flipped: false,
          solver_name: 'ASTAP',
          solve_time_ms: 5000,
          error_message: null,
          wcs_file: null,
        });
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.solveStatus).toBe('idle');
      expect(result.current.solveProgress).toBe(0);
      expect(result.current.solveMessage).toBe('');
      expect(result.current.lastResult).toBeNull();
    });
  });

  describe('detectSolvers', () => {
    it('should detect solvers successfully', async () => {
      const mockSolvers: SolverInfo[] = [
        {
          solver_type: 'astap',
          name: 'ASTAP',
          version: '1.0',
          executable_path: '/path/to/astap',
          is_available: true,
          index_path: '/path/to/indexes',
          installed_indexes: [],
        },
      ];
      mockDetectPlateSolvers.mockResolvedValueOnce(mockSolvers);

      const { result } = renderHook(() => usePlateSolverStore());

      await act(async () => {
        await result.current.detectSolvers();
      });

      expect(result.current.detectedSolvers).toEqual(mockSolvers);
      expect(result.current.isDetecting).toBe(false);
      expect(result.current.detectionError).toBeNull();
    });

    it('should handle detection error', async () => {
      mockDetectPlateSolvers.mockRejectedValueOnce(new Error('Detection failed'));

      const { result } = renderHook(() => usePlateSolverStore());

      await act(async () => {
        await result.current.detectSolvers();
      });

      expect(result.current.detectedSolvers).toEqual([]);
      expect(result.current.isDetecting).toBe(false);
      expect(result.current.detectionError).toBe('Detection failed');
    });
  });

  describe('saveConfig', () => {
    it('should save config', async () => {
      mockSaveSolverConfig.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => usePlateSolverStore());

      await act(async () => {
        await result.current.saveConfig();
      });

      expect(mockSaveSolverConfig).toHaveBeenCalledWith(result.current.config);
    });
  });

  describe('loadConfig', () => {
    it('should load config successfully', async () => {
      const mockConfig = {
        solver_type: 'astrometry_net' as const,
        executable_path: '/custom/path',
        index_path: '/index/path',
        timeout_seconds: 200,
        downsample: 2,
        search_radius: 45.0,
        use_sip: false,
      };
      mockLoadSolverConfig.mockResolvedValueOnce(mockConfig);

      const { result } = renderHook(() => usePlateSolverStore());

      await act(async () => {
        await result.current.loadConfig();
      });

      expect(result.current.config).toEqual(mockConfig);
    });

    it('should use default config on load error', async () => {
      mockLoadSolverConfig.mockRejectedValueOnce(new Error('Load failed'));

      const { result } = renderHook(() => usePlateSolverStore());

      await act(async () => {
        await result.current.loadConfig();
      });

      expect(result.current.config.solver_type).toBe('astap');
    });
  });
});

describe('selectors', () => {
  beforeEach(() => {
    usePlateSolverStore.setState({
      detectedSolvers: [],
      config: {
        solver_type: 'astap',
        executable_path: null,
        index_path: null,
        timeout_seconds: 120,
        downsample: 0,
        search_radius: 30.0,
        use_sip: true,
        astap_database: null,
        astap_max_stars: 500,
        astap_tolerance: 0.007,
        astap_speed_mode: 'auto',
        astap_min_star_size: 1.5,
        astap_equalise_background: false,
        astrometry_scale_low: null,
        astrometry_scale_high: null,
        astrometry_scale_units: 'deg_width',
        astrometry_depth: null,
        astrometry_no_plots: true,
        astrometry_no_verify: false,
        astrometry_crpix_center: true,
        keep_wcs_file: true,
        auto_hints: true,
        retry_on_failure: false,
        max_retries: 2,
      },
      onlineApiKey: '',
    });
  });

  describe('selectActiveSolver', () => {
    it('should return undefined when no solvers detected', () => {
      const state = usePlateSolverStore.getState();
      expect(selectActiveSolver(state)).toBeUndefined();
    });

    it('should return matching solver', () => {
      const mockSolver: SolverInfo = {
        solver_type: 'astap',
        name: 'ASTAP',
        version: '1.0',
        executable_path: '/path/to/astap',
        is_available: true,
        index_path: '/path/to/indexes',
        installed_indexes: [],
      };

      usePlateSolverStore.setState({ detectedSolvers: [mockSolver] });

      const state = usePlateSolverStore.getState();
      expect(selectActiveSolver(state)).toEqual(mockSolver);
    });
  });

  describe('selectIsLocalSolverAvailable', () => {
    it('should return false when no solver detected', () => {
      const state = usePlateSolverStore.getState();
      expect(selectIsLocalSolverAvailable(state)).toBe(false);
    });

    it('should return true when solver is available', () => {
      const mockSolver: SolverInfo = {
        solver_type: 'astap',
        name: 'ASTAP',
        version: '1.0',
        executable_path: '/path/to/astap',
        is_available: true,
        index_path: '/path/to/indexes',
        installed_indexes: [
          { name: 'D50', file_name: 'D50', path: '/path/to/D50', size_bytes: 500000000, scale_range: { min_arcmin: 18, max_arcmin: 600 }, description: 'Large database' },
        ],
      };

      usePlateSolverStore.setState({ detectedSolvers: [mockSolver] });

      const state = usePlateSolverStore.getState();
      expect(selectIsLocalSolverAvailable(state)).toBe(true);
    });

    it('should return false when solver is not available', () => {
      const mockSolver: SolverInfo = {
        solver_type: 'astap',
        name: 'ASTAP',
        version: null,
        executable_path: '',
        is_available: false,
        index_path: null,
        installed_indexes: [],
      };

      usePlateSolverStore.setState({ detectedSolvers: [mockSolver] });

      const state = usePlateSolverStore.getState();
      expect(selectIsLocalSolverAvailable(state)).toBe(false);
    });

    it('should return true for online solver', () => {
      const mockSolver: SolverInfo = {
        solver_type: 'astrometry_net_online',
        name: 'Astrometry.net (Online)',
        version: 'nova.astrometry.net',
        executable_path: '',
        is_available: true,
        index_path: null,
        installed_indexes: [],
      };

      usePlateSolverStore.setState({
        detectedSolvers: [mockSolver],
        config: { ...usePlateSolverStore.getState().config, solver_type: 'astrometry_net_online' },
      });

      const state = usePlateSolverStore.getState();
      expect(selectIsLocalSolverAvailable(state)).toBe(true);
    });
  });

  describe('selectCanSolve', () => {
    it('should return false for local solver without indexes', () => {
      const mockSolver: SolverInfo = {
        solver_type: 'astap',
        name: 'ASTAP',
        version: '1.0',
        executable_path: '/path/to/astap',
        is_available: true,
        index_path: '/path/to/indexes',
        installed_indexes: [],
      };

      usePlateSolverStore.setState({ detectedSolvers: [mockSolver] });

      const state = usePlateSolverStore.getState();
      expect(selectCanSolve(state)).toBe(false);
    });

    it('should return true for local solver with indexes', () => {
      const mockSolver: SolverInfo = {
        solver_type: 'astap',
        name: 'ASTAP',
        version: '1.0',
        executable_path: '/path/to/astap',
        is_available: true,
        index_path: '/path/to/indexes',
        installed_indexes: [
          {
            name: 'D50',
            file_name: 'D50',
            path: '/path/to/D50',
            size_bytes: 500000000,
            scale_range: null,
            description: null,
          },
        ],
      };

      usePlateSolverStore.setState({ detectedSolvers: [mockSolver] });

      const state = usePlateSolverStore.getState();
      expect(selectCanSolve(state)).toBe(true);
    });

    it('should return false for online solver without API key', () => {
      usePlateSolverStore.setState({
        config: { ...usePlateSolverStore.getState().config, solver_type: 'astrometry_net_online' },
        onlineApiKey: '',
      });

      const state = usePlateSolverStore.getState();
      expect(selectCanSolve(state)).toBe(false);
    });

    it('should return true for online solver with API key', () => {
      usePlateSolverStore.setState({
        config: { ...usePlateSolverStore.getState().config, solver_type: 'astrometry_net_online' },
        onlineApiKey: 'test-api-key',
      });

      const state = usePlateSolverStore.getState();
      expect(selectCanSolve(state)).toBe(true);
    });
  });
});
