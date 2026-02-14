/**
 * Tests for index-manager.tsx
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IndexManager } from '../index-manager';
import { usePlateSolverStore } from '@/lib/stores/plate-solver-store';

// Mock next-intl — return key as text
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

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

// Mock Tauri event listener and path
jest.mock('@tauri-apps/api/event', () => ({
  listen: jest.fn(() => Promise.resolve(jest.fn())),
}));

jest.mock('@tauri-apps/api/path', () => ({
  join: jest.fn((...args: string[]) => args.join('/')),
}));

// Mock isTauri
jest.mock('@/lib/tauri/app-control-api', () => ({
  isTauri: jest.fn(() => false),
}));

// Mock Dialog — simulate open/close behavior so useEffect(open) fires
let dialogOnOpenChange: ((open: boolean) => void) | undefined;

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, onOpenChange }: { children: React.ReactNode; open?: boolean; onOpenChange?: (open: boolean) => void }) => {
    dialogOnOpenChange = onOpenChange;
    return <div data-testid="dialog">{children}</div>;
  },
  DialogContent: ({ children }: { children: React.ReactNode; className?: string }) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode; className?: string }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode; className?: string; id?: string }) => <h2>{children}</h2>,
  DialogTrigger: ({ children }: { children: React.ReactNode; asChild?: boolean }) => (
    <div data-testid="dialog-trigger" onClick={() => dialogOnOpenChange?.(true)}>{children}</div>
  ),
  DialogDescription: ({ children }: { children: React.ReactNode; className?: string }) => <p>{children}</p>,
}));

// Mock AlertDialog
jest.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogTrigger: ({ children }: { children: React.ReactNode; asChild?: boolean }) => <div>{children}</div>,
  AlertDialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: { children: React.ReactNode }) => <h3>{children}</h3>,
  AlertDialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  AlertDialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogCancel: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  AlertDialogAction: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => <button onClick={onClick}>{children}</button>,
}));

// Track active tab for mock Tabs
let activeTab = 'installed';
let tabsOnValueChange: ((v: string) => void) | undefined;

jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, value, onValueChange, defaultValue }: { children: React.ReactNode; value?: string; onValueChange?: (v: string) => void; defaultValue?: string; className?: string }) => {
    activeTab = value ?? defaultValue ?? 'installed';
    tabsOnValueChange = onValueChange;
    return <div data-testid="tabs">{children}</div>;
  },
  TabsList: ({ children }: { children: React.ReactNode; className?: string }) => <div data-testid="tabs-list" role="tablist">{children}</div>,
  TabsTrigger: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <button role="tab" data-testid={`tab-${value}`} onClick={() => tabsOnValueChange?.(value)}>{children}</button>
  ),
  TabsContent: ({ children, value }: { children: React.ReactNode; value: string; className?: string }) => (
    activeTab === value ? <div data-testid={`tab-content-${value}`}>{children}</div> : null
  ),
}));

// Mock ScrollArea (just renders children)
jest.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: { children: React.ReactNode; className?: string }) => <div>{children}</div>,
}));

// Mock Tooltip (just renders children)
jest.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode; asChild?: boolean }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

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

    jest.clearAllMocks();

    // Setup default mocks (after clearAllMocks so they persist)
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
  });

  beforeEach(() => {
    activeTab = 'installed';
  });

  it('should not render for online solver', () => {
    usePlateSolverStore.setState({
      ...usePlateSolverStore.getState(),
      config: {
        ...usePlateSolverStore.getState().config,
        solver_type: 'astrometry_net_online',
      },
    });

    const { container } = render(<IndexManager />);
    expect(container.firstChild).toBeNull();
  });

  it('should render trigger button', () => {
    render(<IndexManager />);
    expect(screen.getByText('plateSolving.manageIndexes')).toBeInTheDocument();
  });

  it('should render custom trigger', () => {
    render(
      <IndexManager trigger={<button>Custom Trigger</button>} />
    );
    expect(screen.getByText('Custom Trigger')).toBeInTheDocument();
  });

  it('should show installed and available tabs', () => {
    render(<IndexManager />);

    expect(screen.getByTestId('tab-installed')).toBeInTheDocument();
    expect(screen.getByTestId('tab-available')).toBeInTheDocument();
  });

  it('should load indexes when dialog opens', async () => {
    render(<IndexManager />);

    // Click trigger to open dialog and fire loadIndexes
    const trigger = screen.getByTestId('dialog-trigger');
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(mockGetInstalledIndexes).toHaveBeenCalledWith('astap', undefined);
      expect(mockGetAvailableIndexes).toHaveBeenCalledWith('astap');
    });
  });

  it('should show empty state when no indexes installed', async () => {

    render(<IndexManager />);

    const trigger = screen.getByTestId('dialog-trigger');
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('plateSolving.noIndexesInstalled')).toBeInTheDocument();
    });
  });

  it('should display installed indexes', async () => {
    mockGetInstalledIndexes.mockResolvedValue([
      {
        name: 'D50',
        file_name: 'D50',
        path: '/path/to/D50',
        size_bytes: 500 * 1024 * 1024,
        scale_range: { min_arcmin: 18, max_arcmin: 600 },
        description: 'Large database',
      },
    ]);

    render(<IndexManager />);

    const trigger = screen.getByTestId('dialog-trigger');
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('D50')).toBeInTheDocument();
    });
  });

  it('should show available indexes in available tab', async () => {
    render(<IndexManager />);

    const trigger = screen.getByTestId('dialog-trigger');
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(mockGetAvailableIndexes).toHaveBeenCalled();
    });

    // Switch to available tab
    const availableTab = screen.getByTestId('tab-available');
    fireEvent.click(availableTab);

    await waitFor(() => {
      expect(screen.getByText('D50')).toBeInTheDocument();
    });
  });

  it('should show ASTAP hint in available tab', async () => {
    render(<IndexManager solverType="astap" />);

    const trigger = screen.getByTestId('dialog-trigger');
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(mockGetAvailableIndexes).toHaveBeenCalled();
    });

    const availableTab = screen.getByTestId('tab-available');
    fireEvent.click(availableTab);

    await waitFor(() => {
      expect(screen.getByText('plateSolving.astapIndexHint')).toBeInTheDocument();
    });
  });

  it('should show external link to ASTAP website in available tab', async () => {
    render(<IndexManager solverType="astap" />);

    const trigger = screen.getByTestId('dialog-trigger');
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(mockGetAvailableIndexes).toHaveBeenCalled();
    });

    const availableTab = screen.getByTestId('tab-available');
    fireEvent.click(availableTab);

    await waitFor(() => {
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://www.hnsky.org/astap.htm');
    });
  });

  it('should show total size for installed indexes', async () => {
    mockGetInstalledIndexes.mockResolvedValue([
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

    render(<IndexManager />);

    const trigger = screen.getByTestId('dialog-trigger');
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('D50')).toBeInTheDocument();
      expect(screen.getByText('D20')).toBeInTheDocument();
    });
  });

  it('should use provided solverType prop', async () => {
    render(<IndexManager solverType="astrometry_net" />);

    const trigger = screen.getByTestId('dialog-trigger');
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(mockGetInstalledIndexes).toHaveBeenCalledWith('astrometry_net', undefined);
      expect(mockGetAvailableIndexes).toHaveBeenCalledWith('astrometry_net');
    });
  });
});
