/**
 * @jest-environment jsdom
 */

import { renderHook, act, waitFor } from '@testing-library/react';

const mockCheckForUpdate = jest.fn();
const mockDownloadUpdate = jest.fn();
const mockInstallUpdate = jest.fn();
const mockDownloadAndInstallUpdate = jest.fn();
const mockGetCurrentVersion = jest.fn();
const mockClearPendingUpdate = jest.fn();
const mockOnUpdateProgress = jest.fn();

jest.mock('../updater-api', () => ({
  checkForUpdate: () => mockCheckForUpdate(),
  downloadUpdate: () => mockDownloadUpdate(),
  installUpdate: () => mockInstallUpdate(),
  downloadAndInstallUpdate: () => mockDownloadAndInstallUpdate(),
  getCurrentVersion: () => mockGetCurrentVersion(),
  clearPendingUpdate: () => mockClearPendingUpdate(),
  onUpdateProgress: (callback: (status: unknown) => void) => mockOnUpdateProgress(callback),
  isUpdateAvailable: (status: { status: string }) => status.status === 'available',
  isUpdateReady: (status: { status: string }) => status.status === 'ready',
  isUpdateDownloading: (status: { status: string }) => status.status === 'downloading',
  isUpdateError: (status: { status: string }) => status.status === 'error',
}));

import { useUpdater, useAutoUpdater } from '../updater-hooks';

describe('updater-hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockGetCurrentVersion.mockResolvedValue('1.0.0');
    mockOnUpdateProgress.mockResolvedValue(jest.fn());
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('useUpdater', () => {
    it('should initialize with idle status', async () => {
      const { result } = renderHook(() => useUpdater());

      expect(result.current.status).toEqual({ status: 'idle' });
      expect(result.current.isChecking).toBe(false);
      expect(result.current.isDownloading).toBe(false);
      expect(result.current.isReady).toBe(false);
      expect(result.current.hasUpdate).toBe(false);
    });

    it('should fetch current version on mount', async () => {
      renderHook(() => useUpdater());

      await waitFor(() => {
        expect(mockGetCurrentVersion).toHaveBeenCalled();
      });
    });

    it('should set up update progress listener on mount', async () => {
      renderHook(() => useUpdater());

      await waitFor(() => {
        expect(mockOnUpdateProgress).toHaveBeenCalled();
      });
    });

    it('should update status when checking for updates', async () => {
      mockCheckForUpdate.mockResolvedValue({
        status: 'available',
        data: { version: '1.0.1', current_version: '1.0.0', date: null, body: null },
      });

      const { result } = renderHook(() => useUpdater());

      await act(async () => {
        await result.current.checkForUpdate();
      });

      expect(result.current.hasUpdate).toBe(true);
      expect(result.current.updateInfo).toEqual({
        version: '1.0.1',
        current_version: '1.0.0',
        date: null,
        body: null,
      });
    });

    it('should handle no update available', async () => {
      mockCheckForUpdate.mockResolvedValue({ status: 'not_available' });

      const { result } = renderHook(() => useUpdater());

      await act(async () => {
        await result.current.checkForUpdate();
      });

      expect(result.current.hasUpdate).toBe(false);
      expect(result.current.updateInfo).toBeNull();
    });

    it('should handle check error', async () => {
      mockCheckForUpdate.mockResolvedValue({
        status: 'error',
        data: 'Network error',
      });

      const { result } = renderHook(() => useUpdater());

      await act(async () => {
        await result.current.checkForUpdate();
      });

      expect(result.current.error).toBe('Network error');
    });

    it('should call onUpdateAvailable callback when update is found', async () => {
      const onUpdateAvailable = jest.fn();
      mockCheckForUpdate.mockResolvedValue({
        status: 'available',
        data: { version: '1.0.1', current_version: '1.0.0', date: null, body: null },
      });

      const { result } = renderHook(() => useUpdater({ onUpdateAvailable }));

      await act(async () => {
        await result.current.checkForUpdate();
      });

      expect(onUpdateAvailable).toHaveBeenCalledWith({
        version: '1.0.1',
        current_version: '1.0.0',
        date: null,
        body: null,
      });
    });

    it('should call onError callback when error occurs', async () => {
      const onError = jest.fn();
      mockCheckForUpdate.mockResolvedValue({
        status: 'error',
        data: 'Network error',
      });

      const { result } = renderHook(() => useUpdater({ onError }));

      await act(async () => {
        await result.current.checkForUpdate();
      });

      expect(onError).toHaveBeenCalledWith('Network error');
    });

    it('should download update when downloadUpdate is called', async () => {
      mockCheckForUpdate.mockResolvedValue({
        status: 'available',
        data: { version: '1.0.1', current_version: '1.0.0', date: null, body: null },
      });
      mockDownloadUpdate.mockResolvedValue({
        status: 'ready',
        data: { version: '1.0.1', current_version: '1.0.0', date: null, body: null },
      });

      const { result } = renderHook(() => useUpdater());

      await act(async () => {
        await result.current.checkForUpdate();
      });

      await act(async () => {
        await result.current.downloadUpdate();
      });

      expect(mockDownloadUpdate).toHaveBeenCalled();
      expect(result.current.isReady).toBe(true);
    });

    it('should not download if no update is available', async () => {
      mockCheckForUpdate.mockResolvedValue({ status: 'not_available' });

      const { result } = renderHook(() => useUpdater());

      await act(async () => {
        await result.current.checkForUpdate();
      });

      await act(async () => {
        await result.current.downloadUpdate();
      });

      expect(mockDownloadUpdate).not.toHaveBeenCalled();
    });

    it('should install update when installUpdate is called', async () => {
      mockCheckForUpdate.mockResolvedValue({
        status: 'available',
        data: { version: '1.0.1', current_version: '1.0.0', date: null, body: null },
      });
      mockDownloadUpdate.mockResolvedValue({
        status: 'ready',
        data: { version: '1.0.1', current_version: '1.0.0', date: null, body: null },
      });
      mockInstallUpdate.mockResolvedValue(undefined);

      const { result } = renderHook(() => useUpdater());

      await act(async () => {
        await result.current.checkForUpdate();
      });

      await act(async () => {
        await result.current.downloadUpdate();
      });

      await act(async () => {
        await result.current.installUpdate();
      });

      expect(mockInstallUpdate).toHaveBeenCalled();
    });

    it('should download and install when downloadAndInstall is called', async () => {
      mockCheckForUpdate.mockResolvedValue({
        status: 'available',
        data: { version: '1.0.1', current_version: '1.0.0', date: null, body: null },
      });
      mockDownloadAndInstallUpdate.mockResolvedValue(undefined);

      const { result } = renderHook(() => useUpdater());

      await act(async () => {
        await result.current.checkForUpdate();
      });

      await act(async () => {
        await result.current.downloadAndInstall();
      });

      expect(mockDownloadAndInstallUpdate).toHaveBeenCalled();
    });

    it('should dismiss update when dismissUpdate is called', async () => {
      mockCheckForUpdate.mockResolvedValue({
        status: 'available',
        data: { version: '1.0.1', current_version: '1.0.0', date: null, body: null },
      });

      const { result } = renderHook(() => useUpdater());

      await act(async () => {
        await result.current.checkForUpdate();
      });

      expect(result.current.hasUpdate).toBe(true);

      act(() => {
        result.current.dismissUpdate();
      });

      expect(mockClearPendingUpdate).toHaveBeenCalled();
      expect(result.current.status).toEqual({ status: 'idle' });
    });

    it('should return current version', async () => {
      const { result } = renderHook(() => useUpdater());

      await waitFor(() => {
        expect(result.current.currentVersion).toBe('1.0.0');
      });
    });
  });

  describe('useAutoUpdater', () => {
    it('should automatically check for updates on mount', async () => {
      mockCheckForUpdate.mockResolvedValue({ status: 'not_available' });

      renderHook(() => useAutoUpdater());

      // Advance timers to trigger the setTimeout(doCheck, 0)
      await act(async () => {
        jest.advanceTimersByTime(0);
      });

      await waitFor(() => {
        expect(mockCheckForUpdate).toHaveBeenCalled();
      });
    });

    it('should periodically check for updates based on checkInterval', async () => {
      mockCheckForUpdate.mockResolvedValue({ status: 'not_available' });
      const checkInterval = 60000; // 1 minute

      renderHook(() => useAutoUpdater({ checkInterval }));

      // Initial check
      await act(async () => {
        jest.advanceTimersByTime(0);
      });

      await waitFor(() => {
        expect(mockCheckForUpdate).toHaveBeenCalledTimes(1);
      });

      // Advance to next interval
      await act(async () => {
        jest.advanceTimersByTime(checkInterval);
      });

      await waitFor(() => {
        expect(mockCheckForUpdate).toHaveBeenCalledTimes(2);
      });
    });

    it('should clean up interval on unmount', async () => {
      mockCheckForUpdate.mockResolvedValue({ status: 'not_available' });
      const checkInterval = 60000;

      const { unmount } = renderHook(() => useAutoUpdater({ checkInterval }));

      await act(async () => {
        jest.advanceTimersByTime(0);
      });

      await waitFor(() => {
        expect(mockCheckForUpdate).toHaveBeenCalledTimes(1);
      });

      unmount();

      // Advance time after unmount - should not trigger more checks
      await act(async () => {
        jest.advanceTimersByTime(checkInterval * 2);
      });

      expect(mockCheckForUpdate).toHaveBeenCalledTimes(1);
    });
  });

  describe('progress tracking', () => {
    it('should return download progress when downloading', async () => {
      mockCheckForUpdate.mockResolvedValue({
        status: 'available',
        data: { version: '1.0.1', current_version: '1.0.0', date: null, body: null },
      });

      const { result } = renderHook(() => useUpdater());

      await act(async () => {
        await result.current.checkForUpdate();
      });

      // Simulate downloading state
      await act(async () => {
        // Manually set status to downloading to test progress
        mockDownloadUpdate.mockImplementation(async () => {
          return {
            status: 'downloading',
            data: { downloaded: 500000, total: 1000000, percent: 50 },
          };
        });
        await result.current.downloadUpdate();
      });

      // Note: In actual implementation, progress is tracked via events
      // This test verifies the initial download call works
      expect(mockDownloadUpdate).toHaveBeenCalled();
    });
  });
});
