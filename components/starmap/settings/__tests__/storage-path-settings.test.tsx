/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

// Mock pathConfigApi
const mockGetPathConfig = jest.fn();
const mockSetCustomDataDir = jest.fn();
const mockSetCustomCacheDir = jest.fn();
const mockMigrateDataDir = jest.fn();
const mockMigrateCacheDir = jest.fn();
const mockResetPathsToDefault = jest.fn();
const mockValidateDirectory = jest.fn();

jest.mock('@/lib/tauri/path-config-api', () => ({
  pathConfigApi: {
    getPathConfig: (...args: unknown[]) => mockGetPathConfig(...args),
    setCustomDataDir: (...args: unknown[]) => mockSetCustomDataDir(...args),
    setCustomCacheDir: (...args: unknown[]) => mockSetCustomCacheDir(...args),
    migrateDataDir: (...args: unknown[]) => mockMigrateDataDir(...args),
    migrateCacheDir: (...args: unknown[]) => mockMigrateCacheDir(...args),
    resetPathsToDefault: (...args: unknown[]) => mockResetPathsToDefault(...args),
    validateDirectory: (...args: unknown[]) => mockValidateDirectory(...args),
    isAvailable: jest.fn(() => true),
  },
}));

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }),
}));

// Mock offline formatBytes
jest.mock('@/lib/offline', () => ({
  formatBytes: (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  },
}));

// Mock tauri dialog
jest.mock('@tauri-apps/plugin-dialog', () => ({
  open: jest.fn(),
}));

// Mock tauri core
jest.mock('@tauri-apps/api/core', () => ({
  invoke: jest.fn(),
}));

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    disabled,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children?: React.ReactNode }) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement> & { children: React.ReactNode }) => (
    <label {...props}>{children}</label>
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => (
    <span data-testid="badge">{children}</span>
  ),
}));

jest.mock('@/components/ui/progress', () => ({
  Progress: (props: Record<string, unknown>) => <div data-testid="progress" {...props} />,
}));

jest.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="alert-dialog">{children}</div>
  ),
  AlertDialogAction: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => (
    <button data-testid="alert-dialog-action" onClick={onClick}>
      {children}
    </button>
  ),
  AlertDialogCancel: ({ children }: { children: React.ReactNode }) => (
    <button data-testid="alert-dialog-cancel">{children}</button>
  ),
  AlertDialogContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="alert-dialog-content">{children}</div>
  ),
  AlertDialogDescription: ({ children }: { children: React.ReactNode }) => (
    <p data-testid="alert-dialog-description">{children}</p>
  ),
  AlertDialogFooter: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="alert-dialog-footer">{children}</div>
  ),
  AlertDialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="alert-dialog-header">{children}</div>
  ),
  AlertDialogTitle: ({ children }: { children: React.ReactNode }) => (
    <h2 data-testid="alert-dialog-title">{children}</h2>
  ),
  AlertDialogTrigger: ({
    children,
    asChild,
  }: {
    children: React.ReactNode;
    asChild?: boolean;
  }) => (asChild ? <>{children}</> : <div data-testid="alert-dialog-trigger">{children}</div>),
}));

jest.mock('@/components/ui/collapsible', () => ({
  Collapsible: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="collapsible">{children}</div>
  ),
  CollapsibleContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="collapsible-content">{children}</div>
  ),
  CollapsibleTrigger: ({
    children,
    asChild,
  }: {
    children: React.ReactNode;
    asChild?: boolean;
  }) => (asChild ? <>{children}</> : <div>{children}</div>),
}));

import { toast } from 'sonner';
import { StoragePathSettings } from '../storage-path-settings';

const defaultPathInfo = {
  data_dir: 'C:\\Users\\Test\\AppData\\Roaming\\com.skymap.desktop\\skymap',
  cache_dir: 'C:\\Users\\Test\\AppData\\Roaming\\com.skymap.desktop\\skymap',
  default_data_dir: 'C:\\Users\\Test\\AppData\\Roaming\\com.skymap.desktop\\skymap',
  default_cache_dir: 'C:\\Users\\Test\\AppData\\Roaming\\com.skymap.desktop\\skymap',
  has_custom_data_dir: false,
  has_custom_cache_dir: false,
};

const customPathInfo = {
  data_dir: 'D:\\SkyMapData',
  cache_dir: 'E:\\SkyMapCache',
  default_data_dir: 'C:\\Users\\Test\\AppData\\Roaming\\com.skymap.desktop\\skymap',
  default_cache_dir: 'C:\\Users\\Test\\AppData\\Roaming\\com.skymap.desktop\\skymap',
  has_custom_data_dir: true,
  has_custom_cache_dir: true,
};

describe('StoragePathSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPathConfig.mockResolvedValue(defaultPathInfo);
    mockValidateDirectory.mockResolvedValue({
      valid: true,
      exists: true,
      writable: true,
      available_bytes: 1024 * 1024 * 1024,
      error: null,
    });
    mockMigrateDataDir.mockResolvedValue({
      success: true,
      files_copied: 5,
      bytes_copied: 2048,
      error: null,
    });
    mockMigrateCacheDir.mockResolvedValue({
      success: true,
      files_copied: 100,
      bytes_copied: 50000,
      error: null,
    });
    mockResetPathsToDefault.mockResolvedValue(undefined);
  });

  // --------------------------------------------------------------------------
  // Rendering
  // --------------------------------------------------------------------------

  describe('Rendering', () => {
    it('renders the component', async () => {
      await act(async () => {
        render(<StoragePathSettings />);
      });

      await waitFor(() => {
        expect(screen.getByText('storagePaths.title')).toBeInTheDocument();
      });
    });

    it('shows loading state initially', () => {
      // Don't resolve the promise yet
      mockGetPathConfig.mockReturnValue(new Promise(() => {}));

      render(<StoragePathSettings />);
      expect(screen.getByText('common.loading')).toBeInTheDocument();
    });

    it('displays data directory path after loading', async () => {
      await act(async () => {
        render(<StoragePathSettings />);
      });

      await waitFor(() => {
        expect(screen.getByText('storagePaths.dataDirectory')).toBeInTheDocument();
      });

      // Path is rendered in a truncated <p> element
      const pathElements = screen.getAllByText(/com\.skymap\.desktop/);
      expect(pathElements.length).toBeGreaterThan(0);
    });

    it('displays cache directory path after loading', async () => {
      await act(async () => {
        render(<StoragePathSettings />);
      });

      await waitFor(() => {
        expect(screen.getByText('storagePaths.cacheDirectory')).toBeInTheDocument();
      });
    });

    it('shows change buttons for both directories', async () => {
      await act(async () => {
        render(<StoragePathSettings />);
      });

      await waitFor(() => {
        const changeButtons = screen.getAllByText('storagePaths.changePath');
        expect(changeButtons).toHaveLength(2);
      });
    });

    it('shows description info text', async () => {
      await act(async () => {
        render(<StoragePathSettings />);
      });

      await waitFor(() => {
        expect(screen.getByText('storagePaths.description')).toBeInTheDocument();
      });
    });
  });

  // --------------------------------------------------------------------------
  // Custom Paths UI
  // --------------------------------------------------------------------------

  describe('Custom Paths UI', () => {
    it('shows custom badge when custom data dir is set', async () => {
      mockGetPathConfig.mockResolvedValue(customPathInfo);

      await act(async () => {
        render(<StoragePathSettings />);
      });

      await waitFor(() => {
        const badges = screen.getAllByTestId('badge');
        expect(badges.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('shows default path reference when custom path is set', async () => {
      mockGetPathConfig.mockResolvedValue(customPathInfo);

      await act(async () => {
        render(<StoragePathSettings />);
      });

      await waitFor(() => {
        expect(screen.getByText(customPathInfo.data_dir)).toBeInTheDocument();
      });
    });

    it('shows reset button when custom paths are set', async () => {
      mockGetPathConfig.mockResolvedValue(customPathInfo);

      await act(async () => {
        render(<StoragePathSettings />);
      });

      await waitFor(() => {
        expect(screen.getByText('storagePaths.dataDirectory')).toBeInTheDocument();
      });

      // Reset button appears because both custom dirs are set (text appears in button + alert dialog action)
      expect(screen.getAllByText('storagePaths.resetToDefault').length).toBeGreaterThanOrEqual(1);
    });

    it('does not show reset button when using default paths', async () => {
      await act(async () => {
        render(<StoragePathSettings />);
      });

      await waitFor(() => {
        expect(screen.getByText('storagePaths.dataDirectory')).toBeInTheDocument();
      });

      expect(screen.queryByText('storagePaths.resetToDefault')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Reset to Default
  // --------------------------------------------------------------------------

  describe('Reset to Default', () => {
    it('calls resetPathsToDefault when confirmed', async () => {
      mockGetPathConfig.mockResolvedValue(customPathInfo);

      await act(async () => {
        render(<StoragePathSettings />);
      });

      await waitFor(() => {
        expect(screen.getByText('storagePaths.dataDirectory')).toBeInTheDocument();
      });

      // Click the confirm action in alert dialog
      const actionButton = screen.getByTestId('alert-dialog-action');
      await act(async () => {
        fireEvent.click(actionButton);
      });

      await waitFor(() => {
        expect(mockResetPathsToDefault).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith('storagePaths.pathResetSuccess');
      });
    });

    it('shows restart required toast after reset', async () => {
      mockGetPathConfig.mockResolvedValue(customPathInfo);

      await act(async () => {
        render(<StoragePathSettings />);
      });

      await waitFor(() => {
        expect(screen.getByText('storagePaths.dataDirectory')).toBeInTheDocument();
      });

      const actionButton = screen.getByTestId('alert-dialog-action');
      await act(async () => {
        fireEvent.click(actionButton);
      });

      await waitFor(() => {
        expect(toast.info).toHaveBeenCalledWith(
          'storagePaths.restartRequired',
          expect.objectContaining({ duration: 8000 })
        );
      });
    });

    it('reloads path info after reset', async () => {
      mockGetPathConfig
        .mockResolvedValueOnce(customPathInfo)
        .mockResolvedValueOnce(defaultPathInfo);

      await act(async () => {
        render(<StoragePathSettings />);
      });

      await waitFor(() => {
        expect(screen.getByText('storagePaths.dataDirectory')).toBeInTheDocument();
      });

      const actionButton = screen.getByTestId('alert-dialog-action');
      await act(async () => {
        fireEvent.click(actionButton);
      });

      await waitFor(() => {
        // Should have been called twice: initial load + after reset
        expect(mockGetPathConfig).toHaveBeenCalledTimes(2);
      });
    });

    it('shows error toast on reset failure', async () => {
      mockGetPathConfig.mockResolvedValue(customPathInfo);
      mockResetPathsToDefault.mockRejectedValue(new Error('Reset failed'));

      await act(async () => {
        render(<StoragePathSettings />);
      });

      await waitFor(() => {
        expect(screen.getByText('storagePaths.dataDirectory')).toBeInTheDocument();
      });

      const actionButton = screen.getByTestId('alert-dialog-action');
      await act(async () => {
        fireEvent.click(actionButton);
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('storagePaths.resetError');
      });
    });
  });

  // --------------------------------------------------------------------------
  // Error Handling
  // --------------------------------------------------------------------------

  describe('Error Handling', () => {
    it('handles getPathConfig failure gracefully', async () => {
      mockGetPathConfig.mockRejectedValue(new Error('Config load failed'));

      await act(async () => {
        render(<StoragePathSettings />);
      });

      // Should still render the section (with loading state resolved)
      await waitFor(() => {
        expect(screen.getByText('storagePaths.title')).toBeInTheDocument();
      });
    });

    it('handles migration failure gracefully', async () => {
      mockMigrateDataDir.mockResolvedValue({
        success: false,
        files_copied: 0,
        bytes_copied: 0,
        error: 'Permission denied',
      });

      await act(async () => {
        render(<StoragePathSettings />);
      });

      await waitFor(() => {
        expect(screen.getByText('storagePaths.dataDirectory')).toBeInTheDocument();
      });
    });
  });

  // --------------------------------------------------------------------------
  // API Integration
  // --------------------------------------------------------------------------

  describe('API Integration', () => {
    it('calls getPathConfig on mount', async () => {
      await act(async () => {
        render(<StoragePathSettings />);
      });

      await waitFor(() => {
        expect(mockGetPathConfig).toHaveBeenCalledTimes(1);
      });
    });

    it('renders both directory sections', async () => {
      await act(async () => {
        render(<StoragePathSettings />);
      });

      await waitFor(() => {
        expect(screen.getByText('storagePaths.dataDirectory')).toBeInTheDocument();
        expect(screen.getByText('storagePaths.cacheDirectory')).toBeInTheDocument();
      });
    });
  });
});
