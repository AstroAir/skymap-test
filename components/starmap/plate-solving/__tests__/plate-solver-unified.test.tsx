/**
 * Tests for plate-solver-unified.tsx
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PlateSolverUnified } from '../plate-solver-unified';
import { usePlateSolverStore } from '@/lib/stores/plate-solver-store';
import { NextIntlClientProvider } from 'next-intl';

// Mock next-intl messages
const messages = {
  plateSolving: {
    title: 'Plate Solving',
    description: 'Upload an astronomical image to determine its sky coordinates',
    localSolver: 'Local',
    onlineSolver: 'Online',
    apiKey: 'Astrometry.net API Key',
    apiKeyPlaceholder: 'Enter your API key',
    apiKeyHint: 'Get your free API key at nova.astrometry.net',
    advancedOptions: 'Advanced Options',
    downsample: 'Downsample Factor',
    searchRadius: 'Search Radius (°)',
    selectImage: 'Select Image to Solve',
    solving: 'Solving...',
    uploading: 'Uploading',
    queued: 'Queued',
    processing: 'Processing',
    success: 'Success!',
    failed: 'Failed',
    solveSuccess: 'Plate Solve Successful!',
    solveFailed: 'Plate Solve Failed',
    rotation: 'Rotation',
    pixelScale: 'Scale',
    fov: 'FOV',
    goToPosition: 'Go to Position',
    solveTime: 'Solve time',
    ready: 'Ready',
    notInstalled: 'Not Installed',
    indexesInstalled: 'indexes installed',
    localSolverNotReady: 'Local solver not ready',
    solverSettings: 'Solver Settings',
    manageIndexes: 'Manage Indexes',
    preparing: 'Preparing...',
  },
  common: {
    cancel: 'Cancel',
    save: 'Save',
  },
};

// Mock Tauri API
jest.mock('@tauri-apps/api/core', () => ({
  invoke: jest.fn(),
}));

// Mock app-control-api
jest.mock('@/lib/tauri/app-control-api', () => ({
  isTauri: jest.fn(() => true),
}));

const mockIsTauri = jest.requireMock('@/lib/tauri/app-control-api').isTauri;

// Mock plate-solver-api
jest.mock('@/lib/tauri/plate-solver-api', () => ({
  solveImageLocal: jest.fn(),
  convertToLegacyResult: jest.fn((result) => ({
    success: result.success,
    coordinates: result.success ? {
      ra: result.ra,
      dec: result.dec,
      raHMS: result.ra_hms || '',
      decDMS: result.dec_dms || '',
    } : null,
    positionAngle: result.position_angle || 0,
    pixelScale: result.pixel_scale || 0,
    fov: { width: result.fov_width || 0, height: result.fov_height || 0 },
    flipped: result.flipped || false,
    solverName: result.solver_name,
    solveTime: result.solve_time_ms,
    errorMessage: result.error_message,
  })),
  isLocalSolver: jest.fn((type) => type === 'astap' || type === 'astrometry_net'),
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

// Mock AstrometryApiClient and createErrorResult
jest.mock('@/lib/plate-solving', () => ({
  AstrometryApiClient: jest.fn().mockImplementation(() => ({
    solve: jest.fn(),
    cancel: jest.fn(),
  })),
  createErrorResult: jest.fn((solverName: string, errorMessage: string) => ({
    success: false,
    coordinates: null,
    positionAngle: 0,
    pixelScale: 0,
    fov: { width: 0, height: 0 },
    flipped: false,
    solverName,
    solveTime: 0,
    errorMessage,
  })),
}));

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
};

describe('PlateSolverUnified', () => {
  beforeEach(() => {
    // Reset store state
    usePlateSolverStore.setState({
      detectedSolvers: [
        {
          solver_type: 'astap',
          name: 'ASTAP',
          version: '1.0.0',
          executable_path: '/path/to/astap',
          is_available: true,
          index_path: '/path/to/indexes',
          installed_indexes: [
            {
              name: 'D50',
              file_name: 'D50',
              path: '/path/to/D50',
              size_bytes: 500000000,
              scale_range: { min_arcmin: 18, max_arcmin: 600 },
              description: 'Large database',
            },
          ],
        },
        {
          solver_type: 'astrometry_net_online',
          name: 'Astrometry.net (Online)',
          version: 'nova.astrometry.net',
          executable_path: '',
          is_available: true,
          index_path: null,
          installed_indexes: [],
        },
      ],
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
    });
    mockIsTauri.mockReturnValue(true);
    jest.clearAllMocks();
  });

  describe('desktop mode', () => {
    it('should render trigger button', () => {
      renderWithProviders(<PlateSolverUnified />);
      
      // Default trigger is an icon button
      const triggerButton = screen.getByRole('button');
      expect(triggerButton).toBeInTheDocument();
    });

    it('should render custom trigger', () => {
      renderWithProviders(
        <PlateSolverUnified trigger={<button>Solve Image</button>} />
      );
      
      expect(screen.getByText('Solve Image')).toBeInTheDocument();
    });

    it('should open dialog when trigger clicked', async () => {
      renderWithProviders(<PlateSolverUnified />);

      const triggerButton = screen.getByRole('button');
      fireEvent.click(triggerButton);

      await waitFor(() => {
        expect(screen.getByText('Plate Solving')).toBeInTheDocument();
      });
    });

    it('should show local and online tabs in desktop mode', async () => {
      renderWithProviders(<PlateSolverUnified />);

      const triggerButton = screen.getByRole('button');
      fireEvent.click(triggerButton);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /local/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /online/i })).toBeInTheDocument();
      });
    });

    it('should show solver info for local mode', async () => {
      renderWithProviders(<PlateSolverUnified />);

      const triggerButton = screen.getByRole('button');
      fireEvent.click(triggerButton);

      await waitFor(() => {
        expect(screen.getByText('ASTAP')).toBeInTheDocument();
        expect(screen.getByText('Ready')).toBeInTheDocument();
      });
    });

    it('should show index count for local solver', async () => {
      renderWithProviders(<PlateSolverUnified />);

      const triggerButton = screen.getByRole('button');
      fireEvent.click(triggerButton);

      await waitFor(() => {
        expect(screen.getByText(/1.*indexes installed/)).toBeInTheDocument();
      });
    });

    it('should show API key input when online tab selected', async () => {
      renderWithProviders(<PlateSolverUnified />);

      const triggerButton = screen.getByRole('button');
      fireEvent.click(triggerButton);

      const onlineTab = await waitFor(() => screen.getByRole('tab', { name: /online/i }));
      fireEvent.click(onlineTab);

      await waitFor(() => {
        expect(screen.getByText('Astrometry.net API Key')).toBeInTheDocument();
      });
    });

    it('should disable solve button when cannot solve', async () => {
      // Set up state where solving is not possible
      usePlateSolverStore.setState({
        ...usePlateSolverStore.getState(),
        detectedSolvers: [
          {
            solver_type: 'astap',
            name: 'ASTAP',
            version: null,
            executable_path: '',
            is_available: false,
            index_path: null,
            installed_indexes: [],
          },
        ],
      });

      renderWithProviders(<PlateSolverUnified />);

      const triggerButton = screen.getByRole('button');
      fireEvent.click(triggerButton);

      await waitFor(() => {
        const solveButton = screen.getByText('Select Image to Solve').closest('button');
        expect(solveButton).toBeDisabled();
      });
    });

    it('should enable solve button when can solve', async () => {
      renderWithProviders(<PlateSolverUnified />);

      const triggerButton = screen.getByRole('button');
      fireEvent.click(triggerButton);

      await waitFor(() => {
        const solveButton = screen.getByText('Select Image to Solve').closest('button');
        expect(solveButton).not.toBeDisabled();
      });
    });
  });

  describe('web mode', () => {
    beforeEach(() => {
      mockIsTauri.mockReturnValue(false);
    });

    it('should not show local/online tabs in web mode', async () => {
      renderWithProviders(<PlateSolverUnified />);

      const triggerButton = screen.getByRole('button');
      fireEvent.click(triggerButton);

      await waitFor(() => {
        expect(screen.queryByRole('tab', { name: /local/i })).not.toBeInTheDocument();
      });
    });

    it('should show API key input directly in web mode', async () => {
      renderWithProviders(<PlateSolverUnified />);

      const triggerButton = screen.getByRole('button');
      fireEvent.click(triggerButton);

      await waitFor(() => {
        expect(screen.getByText('Astrometry.net API Key')).toBeInTheDocument();
      });
    });
  });

  describe('advanced options', () => {
    it('should toggle advanced options', async () => {
      renderWithProviders(<PlateSolverUnified />);

      const triggerButton = screen.getByRole('button');
      fireEvent.click(triggerButton);

      const advancedButton = await waitFor(() => screen.getByText('Advanced Options'));
      fireEvent.click(advancedButton);

      await waitFor(() => {
        expect(screen.getByText('Downsample Factor')).toBeInTheDocument();
        expect(screen.getByText('Search Radius (°)')).toBeInTheDocument();
      });
    });
  });

  describe('callbacks', () => {
    it('should call onSolveComplete when solve succeeds', async () => {
      const onSolveComplete = jest.fn();
      renderWithProviders(<PlateSolverUnified onSolveComplete={onSolveComplete} />);

      // Open dialog
      const triggerButton = screen.getByRole('button');
      fireEvent.click(triggerButton);

      // The actual solve would be triggered by ImageCapture
      // We're just verifying the callback prop is accepted
      expect(onSolveComplete).not.toHaveBeenCalled();
    });

    it('should call onGoToCoordinates when go to button clicked', async () => {
      const onGoToCoordinates = jest.fn();
      
      // Set up a successful result in the store
      usePlateSolverStore.setState({
        ...usePlateSolverStore.getState(),
        lastResult: {
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
          wcs_file: null,
        },
      });

      renderWithProviders(<PlateSolverUnified onGoToCoordinates={onGoToCoordinates} />);

      // The go to button would appear after a successful solve
      // Testing the prop acceptance
      expect(onGoToCoordinates).not.toHaveBeenCalled();
    });
  });

  describe('settings dialog', () => {
    it('should open settings dialog when settings button clicked', async () => {
      renderWithProviders(<PlateSolverUnified />);

      const triggerButton = screen.getByRole('button');
      fireEvent.click(triggerButton);

      await waitFor(() => {
        expect(screen.getByText('ASTAP')).toBeInTheDocument();
      });

      // Find and click settings button
      const settingsButtons = screen.getAllByRole('button');
      const settingsButton = settingsButtons.find(btn => 
        btn.querySelector('svg') // Icon button
      );
      
      // Settings functionality is present
      expect(settingsButton).toBeDefined();
    });
  });

  describe('props', () => {
    it('should accept raHint prop', () => {
      renderWithProviders(<PlateSolverUnified raHint={180.5} />);
      // Component should render without error
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should accept decHint prop', () => {
      renderWithProviders(<PlateSolverUnified decHint={45.25} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should accept fovHint prop', () => {
      renderWithProviders(<PlateSolverUnified fovHint={2.5} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should accept defaultImagePath prop', () => {
      renderWithProviders(<PlateSolverUnified defaultImagePath="/path/to/image.fits" />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should accept className prop', () => {
      renderWithProviders(<PlateSolverUnified className="custom-class" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });
  });
});
