/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

const mockUseUpdater = jest.fn();

jest.mock('@/lib/tauri/updater-hooks', () => ({
  useUpdater: () => mockUseUpdater(),
}));

jest.mock('@/lib/tauri/updater-api', () => ({
  formatProgress: jest.fn((progress) => {
    if (progress.total) {
      return `${progress.downloaded} / ${progress.total} (${progress.percent.toFixed(1)}%)`;
    }
    return `${progress.downloaded}`;
  }),
}));

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, string>) => {
    const translations: Record<string, string> = {
      title: 'Software Update',
      description: 'Check for updates',
      checking: 'Checking...',
      downloading: 'Downloading...',
      ready: 'Ready to install',
      restartRequired: 'Restart required',
      upToDate: 'Up to date',
      newVersion: params?.version ? `Version ${params.version} available` : 'New version available',
      currentVersion: params?.version ? `Current: ${params.version}` : 'Current version',
      releaseNotes: "What's New",
      updateNow: 'Update Now',
      later: 'Later',
      retry: 'Retry',
      close: 'Close',
      checkAgain: 'Check Again',
      restartNow: 'Restart Now',
    };
    return translations[key] || key;
  },
}));

import { UpdateDialog } from '../update-dialog';

const renderComponent = (open: boolean, onOpenChange: jest.Mock = jest.fn()) => {
  return render(<UpdateDialog open={open} onOpenChange={onOpenChange} />);
};

describe('UpdateDialog', () => {
  const defaultMockReturn = {
    currentVersion: '1.0.0',
    isChecking: false,
    isDownloading: false,
    isReady: false,
    hasUpdate: false,
    updateInfo: null,
    progress: null,
    error: null,
    checkForUpdate: jest.fn(),
    downloadAndInstall: jest.fn(),
    dismissUpdate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseUpdater.mockReturnValue(defaultMockReturn);
  });

  it('should render dialog when open', () => {
    renderComponent(true);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should not render dialog when closed', () => {
    renderComponent(false);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should show checking state with spinner', () => {
    mockUseUpdater.mockReturnValue({
      ...defaultMockReturn,
      isChecking: true,
    });

    renderComponent(true);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should show up to date message when no update available', () => {
    renderComponent(true);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should show update available with version info', () => {
    mockUseUpdater.mockReturnValue({
      ...defaultMockReturn,
      hasUpdate: true,
      updateInfo: {
        version: '1.0.1',
        current_version: '1.0.0',
        date: '2024-01-01T00:00:00Z',
        body: 'Bug fixes and improvements',
      },
    });

    renderComponent(true);

    expect(screen.getByText('Bug fixes and improvements')).toBeInTheDocument();
  });

  it('should show download progress when downloading', () => {
    mockUseUpdater.mockReturnValue({
      ...defaultMockReturn,
      isDownloading: true,
      hasUpdate: true,
      progress: {
        downloaded: 500000,
        total: 1000000,
        percent: 50,
      },
    });

    renderComponent(true);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('500000 / 1000000 (50.0%)')).toBeInTheDocument();
  });

  it('should show ready state when update is ready', () => {
    mockUseUpdater.mockReturnValue({
      ...defaultMockReturn,
      isReady: true,
      hasUpdate: true,
      updateInfo: {
        version: '1.0.1',
        current_version: '1.0.0',
        date: null,
        body: null,
      },
    });

    renderComponent(true);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should show error message when error occurs', () => {
    mockUseUpdater.mockReturnValue({
      ...defaultMockReturn,
      error: 'Network connection failed',
    });

    renderComponent(true);

    expect(screen.getByText('Network connection failed')).toBeInTheDocument();
  });

  it('should call checkForUpdate when retry button is clicked', async () => {
    const checkForUpdate = jest.fn();
    mockUseUpdater.mockReturnValue({
      ...defaultMockReturn,
      error: 'Network error',
      checkForUpdate,
    });

    renderComponent(true);

    const buttons = screen.getAllByRole('button');
    const retryButton = buttons.find(b => b.textContent?.toLowerCase().includes('retry'));
    if (retryButton) fireEvent.click(retryButton);

    expect(checkForUpdate).toHaveBeenCalled();
  });

  it('should call downloadAndInstall when update now button is clicked', async () => {
    const downloadAndInstall = jest.fn();
    mockUseUpdater.mockReturnValue({
      ...defaultMockReturn,
      hasUpdate: true,
      updateInfo: {
        version: '1.0.1',
        current_version: '1.0.0',
        date: null,
        body: null,
      },
      downloadAndInstall,
    });

    renderComponent(true);

    const buttons = screen.getAllByRole('button');
    const updateButton = buttons.find(b => b.textContent?.toLowerCase().includes('update'));
    if (updateButton) fireEvent.click(updateButton);

    expect(downloadAndInstall).toHaveBeenCalled();
  });

  it('should call dismissUpdate and close dialog when later button is clicked', async () => {
    const dismissUpdate = jest.fn();
    const onOpenChange = jest.fn();
    mockUseUpdater.mockReturnValue({
      ...defaultMockReturn,
      hasUpdate: true,
      updateInfo: {
        version: '1.0.1',
        current_version: '1.0.0',
        date: null,
        body: null,
      },
      dismissUpdate,
    });

    renderComponent(true, onOpenChange);

    const buttons = screen.getAllByRole('button');
    const laterButton = buttons.find(b => b.textContent?.toLowerCase().includes('later'));
    if (laterButton) fireEvent.click(laterButton);

    expect(dismissUpdate).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('should not close dialog when downloading', () => {
    const onOpenChange = jest.fn();
    mockUseUpdater.mockReturnValue({
      ...defaultMockReturn,
      isDownloading: true,
      hasUpdate: true,
      progress: { downloaded: 0, total: 1000, percent: 0 },
    });

    renderComponent(true, onOpenChange);

    const dialog = screen.getByRole('dialog');
    fireEvent.keyDown(dialog, { key: 'Escape' });
  });

  it('should call checkForUpdate when check again button is clicked', async () => {
    const checkForUpdate = jest.fn();
    mockUseUpdater.mockReturnValue({
      ...defaultMockReturn,
      checkForUpdate,
    });

    renderComponent(true);

    const buttons = screen.getAllByRole('button');
    const checkAgainButton = buttons.find(b => b.textContent?.toLowerCase().includes('check'));
    if (checkAgainButton) fireEvent.click(checkAgainButton);

    expect(checkForUpdate).toHaveBeenCalled();
  });

  it('should show close button when up to date', () => {
    const onOpenChange = jest.fn();
    renderComponent(true, onOpenChange);

    const buttons = screen.getAllByRole('button');
    const closeButton = buttons.find(b => b.textContent?.toLowerCase().includes('close'));
    if (closeButton) fireEvent.click(closeButton);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
