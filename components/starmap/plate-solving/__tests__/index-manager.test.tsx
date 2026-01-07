/**
 * Tests for index-manager.tsx
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IndexManager } from '../index-manager';
import { usePlateSolverStore } from '@/lib/stores/plate-solver-store';
import { NextIntlClientProvider } from 'next-intl';

// Mock next-intl messages
const messages = {
  plateSolving: {
    manageIndexes: 'Manage Indexes',
    indexManager: 'Index Manager',
    indexManagerDesc: 'Manage star database index files',
    installed: 'Installed',
    available: 'Available',
    noIndexesInstalled: 'No index files installed',
    downloadIndexes: 'Download Indexes',
    totalSize: 'Total size',
    files: 'files',
    astapIndexHint: 'ASTAP uses star databases. D50 is recommended.',
    astrometryIndexHint: 'Download indexes matching your image scale.',
    astapWebsite: 'ASTAP Website',
    astrometryIndexes: 'Astrometry.net Index Files',
    deleteIndex: 'Delete Index',
    deleteIndexConfirm: 'Are you sure you want to delete this index?',
    recommended: 'Recommended',
    complete: 'Complete',
    error: 'Error',
  },
  common: {
    cancel: 'Cancel',
    delete: 'Delete',
    download: 'Download',
  },
};

// Mock Tauri API
jest.mock('@tauri-apps/api/core', () => ({
  invoke: jest.fn(),
}));

// Mock plate-solver-api
jest.mock('@/lib/tauri/plate-solver-api', () => ({
  formatFileSize: jest.fn((bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }),
  getSolverDisplayName: jest.fn((type) => {
    if (type === 'astap') return 'ASTAP';
    if (type === 'astrometry_net') return 'Astrometry.net (Local)';
    return type;
  }),
  getAvailableIndexes: jest.fn(),
  getInstalledIndexes: jest.fn(),
  deleteIndex: jest.fn(),
  detectPlateSolvers: jest.fn(),
  loadSolverConfig: jest.fn(),
  saveSolverConfig: jest.fn(),
  DEFAULT_SOLVER_CONFIG: {
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
}));

const mockGetAvailableIndexes = jest.requireMock('@/lib/tauri/plate-solver-api').getAvailableIndexes;
const mockGetInstalledIndexes = jest.requireMock('@/lib/tauri/plate-solver-api').getInstalledIndexes;
const _mockDeleteIndex = jest.requireMock('@/lib/tauri/plate-solver-api').deleteIndex;

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
};


describe('IndexManager', () => {
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
          installed_indexes: [],
        },
      ],
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
    });

    // Setup default mocks
    mockGetInstalledIndexes.mockResolvedValue([]);
    mockGetAvailableIndexes.mockResolvedValue([
      {
        name: 'D50',
        file_name: 'd50_star_database.zip',
        download_url: 'https://example.com/d50.zip',
        size_bytes: 500 * 1024 * 1024,
        scale_range: { min_arcmin: 18, max_arcmin: 600 },
        description: 'Large database - FOV > 0.3°',
        solver_type: 'astap',
      },
    ]);

    jest.clearAllMocks();
  });

  it('should not render for online solver', () => {
    usePlateSolverStore.setState({
      ...usePlateSolverStore.getState(),
      config: {
        ...usePlateSolverStore.getState().config,
        solver_type: 'astrometry_net_online',
      },
    });

    const { container } = renderWithProviders(<IndexManager />);
    expect(container.firstChild).toBeNull();
  });

  it('should render trigger button', () => {
    renderWithProviders(<IndexManager />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should render custom trigger', () => {
    renderWithProviders(
      <IndexManager trigger={<button>Custom Trigger</button>} />
    );
    expect(screen.getByText('Custom Trigger')).toBeInTheDocument();
  });

  it('should open dialog when trigger clicked', async () => {
    renderWithProviders(<IndexManager />);

    const triggerButton = screen.getByRole('button');
    fireEvent.click(triggerButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('should show installed and available tabs', async () => {
    renderWithProviders(<IndexManager />);

    const triggerButton = screen.getByRole('button');
    fireEvent.click(triggerButton);

    await waitFor(() => {
      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('should load indexes when dialog opens', async () => {
    renderWithProviders(<IndexManager />);

    const triggerButton = screen.getByRole('button');
    fireEvent.click(triggerButton);

    await waitFor(() => {
      expect(mockGetInstalledIndexes).toHaveBeenCalledWith('astap', undefined);
      expect(mockGetAvailableIndexes).toHaveBeenCalledWith('astap');
    });
  });

  it('should show empty state when no indexes installed', async () => {
    mockGetInstalledIndexes.mockResolvedValueOnce([]);

    renderWithProviders(<IndexManager />);

    const triggerButton = screen.getByRole('button');
    fireEvent.click(triggerButton);

    await waitFor(() => {
      // Look for empty state indicator
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('should display installed indexes', async () => {
    mockGetInstalledIndexes.mockResolvedValueOnce([
      {
        name: 'D50',
        file_name: 'D50',
        path: '/path/to/D50',
        size_bytes: 500 * 1024 * 1024,
        scale_range: { min_arcmin: 18, max_arcmin: 600 },
        description: 'Large database',
      },
    ]);

    renderWithProviders(<IndexManager />);

    const triggerButton = screen.getByRole('button');
    fireEvent.click(triggerButton);

    await waitFor(() => {
      expect(screen.getByText('D50')).toBeInTheDocument();
    });
  });

  it('should show available indexes in available tab', async () => {
    renderWithProviders(<IndexManager />);

    const triggerButton = screen.getByRole('button');
    fireEvent.click(triggerButton);

    await waitFor(() => {
      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBeGreaterThanOrEqual(2);
    });

    const tabs = screen.getAllByRole('tab');
    fireEvent.click(tabs[1]); // Available tab

    await waitFor(() => {
      expect(screen.getByText('D50')).toBeInTheDocument();
    });
  });

  it('should show download link for available indexes', async () => {
    renderWithProviders(<IndexManager />);

    const triggerButton = screen.getByRole('button');
    fireEvent.click(triggerButton);

    await waitFor(() => {
      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBeGreaterThanOrEqual(2);
    });

    const tabs = screen.getAllByRole('tab');
    fireEvent.click(tabs[1]);

    await waitFor(() => {
      const links = screen.getAllByRole('link');
      const downloadLink = links.find(link => link.getAttribute('href')?.includes('example.com'));
      expect(downloadLink).toBeDefined();
    });
  });

  it('should show delete confirmation dialog', async () => {
    mockGetInstalledIndexes.mockResolvedValueOnce([
      {
        name: 'D50',
        file_name: 'D50',
        path: '/path/to/D50',
        size_bytes: 500 * 1024 * 1024,
        scale_range: null,
        description: null,
      },
    ]);

    renderWithProviders(<IndexManager />);

    const triggerButton = screen.getByRole('button');
    fireEvent.click(triggerButton);

    await waitFor(() => {
      expect(screen.getByText('D50')).toBeInTheDocument();
    });
  });

  it('should show total size for installed indexes', async () => {
    mockGetInstalledIndexes.mockResolvedValueOnce([
      {
        name: 'D50',
        file_name: 'D50',
        path: '/path/to/D50',
        size_bytes: 500 * 1024 * 1024,
        scale_range: null,
        description: null,
      },
      {
        name: 'D20',
        file_name: 'D20',
        path: '/path/to/D20',
        size_bytes: 200 * 1024 * 1024,
        scale_range: null,
        description: null,
      },
    ]);

    renderWithProviders(<IndexManager />);

    const triggerButton = screen.getByRole('button');
    fireEvent.click(triggerButton);

    await waitFor(() => {
      expect(screen.getByText('D50')).toBeInTheDocument();
      expect(screen.getByText('D20')).toBeInTheDocument();
    });
  });

  it('should show hint for ASTAP indexes', async () => {
    renderWithProviders(<IndexManager solverType="astap" />);

    const triggerButton = screen.getByRole('button');
    fireEvent.click(triggerButton);

    await waitFor(() => {
      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBeGreaterThanOrEqual(2);
    });

    const tabs = screen.getAllByRole('tab');
    fireEvent.click(tabs[1]);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('should show external link to ASTAP website', async () => {
    renderWithProviders(<IndexManager solverType="astap" />);

    const triggerButton = screen.getByRole('button');
    fireEvent.click(triggerButton);

    await waitFor(() => {
      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBeGreaterThanOrEqual(2);
    });

    const tabs = screen.getAllByRole('tab');
    fireEvent.click(tabs[1]);

    await waitFor(() => {
      const links = screen.getAllByRole('link');
      const astapLink = links.find(link => link.getAttribute('href')?.includes('hnsky.org'));
      expect(astapLink).toBeDefined();
    });
  });

  it('should use provided solverType prop', async () => {
    renderWithProviders(<IndexManager solverType="astrometry_net" />);

    const triggerButton = screen.getByRole('button');
    fireEvent.click(triggerButton);

    await waitFor(() => {
      expect(mockGetInstalledIndexes).toHaveBeenCalledWith('astrometry_net', undefined);
      expect(mockGetAvailableIndexes).toHaveBeenCalledWith('astrometry_net');
    });
  });
});
