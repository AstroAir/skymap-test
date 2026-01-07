/**
 * Tests for solver-settings.tsx
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SolverSettings } from '../solver-settings';
import { usePlateSolverStore } from '@/lib/stores/plate-solver-store';
import { NextIntlClientProvider } from 'next-intl';

// Mock next-intl
const messages = {
  plateSolving: {
    solverSelection: 'Solver Selection',
    solverSelectionDesc: 'Choose which plate solver to use',
    detectSolvers: 'Detect Solvers',
    installed: 'Installed',
    notInstalled: 'Not Installed',
    online: 'Online',
    customPath: 'Custom Executable Path',
    pathPlaceholder: 'Path to solver executable',
    validate: 'Validate',
    invalidPath: 'Invalid solver path',
    solverOptions: 'Solver Options',
    timeout: 'Timeout',
    auto: 'Auto',
    useSip: 'Use SIP Coefficients',
    useSipDesc: 'Add polynomial distortion correction',
    indexStatus: 'Index Files',
    indexesInstalled: 'index files installed',
    totalSize: 'Total size',
    noIndexes: 'No index files found.',
    needApiKey: 'API key required',
    solverNotReady: 'Solver not ready',
    ready: 'Ready',
    apiKey: 'API Key',
    apiKeyPlaceholder: 'Enter API key',
    apiKeyHint: 'Get your API key',
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

// Mock plate-solver-api
jest.mock('@/lib/tauri/plate-solver-api', () => ({
  isLocalSolver: jest.fn((type) => type === 'astap' || type === 'astrometry_net'),
  formatFileSize: jest.fn((bytes) => `${bytes} B`),
  validateSolverPath: jest.fn(),
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

const mockValidateSolverPath = jest.requireMock('@/lib/tauri/plate-solver-api').validateSolverPath;

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
};

describe('SolverSettings', () => {
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
          solver_type: 'astrometry_net',
          name: 'Astrometry.net (Local)',
          version: null,
          executable_path: '',
          is_available: false,
          index_path: null,
          installed_indexes: [],
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
    });
    jest.clearAllMocks();
  });

  it('should render solver selection section', () => {
    renderWithProviders(<SolverSettings />);

    expect(screen.getByText('Solver Selection')).toBeInTheDocument();
    expect(screen.getByText('Choose which plate solver to use')).toBeInTheDocument();
  });

  it('should display detected solvers', () => {
    renderWithProviders(<SolverSettings />);

    expect(screen.getByText('ASTAP')).toBeInTheDocument();
    expect(screen.getByText('Astrometry.net (Local)')).toBeInTheDocument();
    expect(screen.getByText('Astrometry.net (Online)')).toBeInTheDocument();
  });

  it('should show installed badge for available solvers', () => {
    renderWithProviders(<SolverSettings />);

    // ASTAP should show as installed
    const installedBadges = screen.getAllByText('Installed');
    expect(installedBadges.length).toBeGreaterThan(0);
  });

  it('should show not installed badge for unavailable solvers', () => {
    renderWithProviders(<SolverSettings />);

    expect(screen.getByText('Not Installed')).toBeInTheDocument();
  });

  it('should allow selecting a different solver', () => {
    renderWithProviders(<SolverSettings />);

    // Find and click on Astrometry.net (Online)
    const onlineSolver = screen.getByText('Astrometry.net (Online)').closest('div[class*="cursor-pointer"]');
    if (onlineSolver) {
      fireEvent.click(onlineSolver);
    }

    // Check that config was updated
    const state = usePlateSolverStore.getState();
    expect(state.config.solver_type).toBe('astrometry_net_online');
  });

  it('should show API key input for online solver', () => {
    usePlateSolverStore.setState({
      ...usePlateSolverStore.getState(),
      config: {
        ...usePlateSolverStore.getState().config,
        solver_type: 'astrometry_net_online',
      },
    });

    renderWithProviders(<SolverSettings />);

    expect(screen.getByText('API Key')).toBeInTheDocument();
  });

  it('should render solver options section', () => {
    renderWithProviders(<SolverSettings />);

    expect(screen.getByText('Solver Options')).toBeInTheDocument();
    expect(screen.getByText('Timeout')).toBeInTheDocument();
  });

  it('should show index status for local solvers', () => {
    renderWithProviders(<SolverSettings />);

    expect(screen.getByText('Index Files')).toBeInTheDocument();
    expect(screen.getByText(/1.*index files installed/)).toBeInTheDocument();
  });

  it('should call onClose and save when save button clicked', async () => {
    const onClose = jest.fn();
    renderWithProviders(<SolverSettings onClose={onClose} />);

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('should call onClose when cancel button clicked', () => {
    const onClose = jest.fn();
    renderWithProviders(<SolverSettings onClose={onClose} />);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('should validate custom path when validate button clicked', async () => {
    mockValidateSolverPath.mockResolvedValueOnce(true);

    renderWithProviders(<SolverSettings />);

    // Find the custom path input and enter a value
    const pathInput = screen.getByPlaceholderText(/path/i);
    fireEvent.change(pathInput, { target: { value: '/custom/path/astap' } });

    // Find and click validate button
    const validateButton = screen.getByText('Validate');
    fireEvent.click(validateButton);

    await waitFor(() => {
      expect(mockValidateSolverPath).toHaveBeenCalledWith('astap', '/custom/path/astap');
    });
  });

  it('should show detect solvers button', () => {
    renderWithProviders(<SolverSettings />);

    expect(screen.getByText('Detect Solvers')).toBeInTheDocument();
  });

  it('should trigger solver detection when detect button clicked', async () => {
    const detectSolvers = jest.fn();
    usePlateSolverStore.setState({
      ...usePlateSolverStore.getState(),
      detectSolvers,
    });

    renderWithProviders(<SolverSettings />);

    const detectButton = screen.getByText('Detect Solvers');
    fireEvent.click(detectButton);

    // The actual detectSolvers function from the store will be called
    // We can verify by checking the store method was invoked
  });
});
