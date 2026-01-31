/**
 * Unit tests for app-control-api.ts
 * Tests application control functionality including restart, quit, and reload
 */

import {
  isTauri,
  restartApp,
  quitApp,
  reloadWebview,
  isDevMode,
  closeWindow,
  minimizeWindow,
  toggleMaximizeWindow,
  isWindowMaximized,
} from '../app-control-api';

// Mock Tauri API
const mockInvoke = jest.fn();
jest.mock('@tauri-apps/api/core', () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}));

// Mock Tauri window API
const mockMinimize = jest.fn();
const mockClose = jest.fn();
const mockToggleMaximize = jest.fn();
const mockIsMaximized = jest.fn();

jest.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: () => ({
    minimize: mockMinimize,
    close: mockClose,
    toggleMaximize: mockToggleMaximize,
    isMaximized: mockIsMaximized,
  }),
}));

// Helper to set window for tests (avoids Object.defineProperty issues in JSDOM)
const setWindow = (value: unknown) => {
  (global as Record<string, unknown>).window = value;
};

describe('app-control-api', () => {
  // Store original window object
  const originalWindow = global.window;

  beforeEach(() => {
    jest.clearAllMocks();
    // Set up Tauri environment
    setWindow({
      ...originalWindow,
      __TAURI__: {},
      location: { reload: jest.fn(), hostname: 'localhost' } as unknown as Location,
    });
  });

  afterEach(() => {
    // Restore original window
    setWindow(originalWindow);
  });

  describe('isTauri', () => {
    it('should return true when __TAURI__ is present in window', () => {
      expect(isTauri()).toBe(true);
    });

    it('should return false when __TAURI__ is not present', () => {
      setWindow({ location: { hostname: 'localhost' } });
      expect(isTauri()).toBe(false);
    });

    it('should return false when window is undefined', () => {
      setWindow(undefined);
      expect(isTauri()).toBe(false);
    });
  });

  describe('restartApp', () => {
    it('should call invoke with restart_app command in Tauri environment', async () => {
      mockInvoke.mockResolvedValueOnce(undefined);

      await restartApp();

      expect(mockInvoke).toHaveBeenCalledWith('restart_app');
    });

    it('should not call invoke in non-Tauri environment', async () => {
      setWindow({ location: { hostname: 'localhost' } });

      await restartApp();

      expect(mockInvoke).not.toHaveBeenCalled();
    });

    it('should handle invoke errors gracefully', async () => {
      const error = new Error('Restart failed');
      mockInvoke.mockRejectedValueOnce(error);

      // Should not throw
      await expect(restartApp()).resolves.toBeUndefined();
    });
  });

  describe('quitApp', () => {
    it('should call invoke with quit_app command and default exit code', async () => {
      mockInvoke.mockResolvedValueOnce(undefined);

      await quitApp();

      expect(mockInvoke).toHaveBeenCalledWith('quit_app', { exitCode: undefined });
    });

    it('should call invoke with specified exit code', async () => {
      mockInvoke.mockResolvedValueOnce(undefined);

      await quitApp(1);

      expect(mockInvoke).toHaveBeenCalledWith('quit_app', { exitCode: 1 });
    });

    it('should not call invoke in non-Tauri environment', async () => {
      setWindow({ location: { hostname: 'localhost' } });

      await quitApp();

      expect(mockInvoke).not.toHaveBeenCalled();
    });
  });

  describe('reloadWebview', () => {
    it('should call invoke with reload_webview command in Tauri environment', async () => {
      mockInvoke.mockResolvedValueOnce(undefined);

      await reloadWebview();

      expect(mockInvoke).toHaveBeenCalledWith('reload_webview');
    });

    it('should reload window.location in non-Tauri environment', async () => {
      const reloadMock = jest.fn();
      setWindow({ location: { reload: reloadMock, hostname: 'localhost' } });

      await reloadWebview();

      expect(reloadMock).toHaveBeenCalled();
      expect(mockInvoke).not.toHaveBeenCalled();
    });
  });

  describe('isDevMode', () => {
    it('should call invoke with is_dev_mode command in Tauri environment', async () => {
      mockInvoke.mockResolvedValueOnce(true);

      const result = await isDevMode();

      expect(mockInvoke).toHaveBeenCalledWith('is_dev_mode');
      expect(result).toBe(true);
    });

    it('should return true for localhost in non-Tauri environment', async () => {
      setWindow({ location: { hostname: 'localhost' } });

      const result = await isDevMode();

      expect(result).toBe(true);
    });

    it('should return false for non-localhost in non-Tauri environment', async () => {
      setWindow({ location: { hostname: 'example.com' } });

      const result = await isDevMode();

      expect(result).toBe(false);
    });
  });

  describe('closeWindow', () => {
    it('should call window.close() in Tauri environment', async () => {
      mockClose.mockResolvedValueOnce(undefined);

      await closeWindow();

      expect(mockClose).toHaveBeenCalled();
    });

    it('should not call close in non-Tauri environment', async () => {
      setWindow({ location: { hostname: 'localhost' } });

      await closeWindow();

      expect(mockClose).not.toHaveBeenCalled();
    });
  });

  describe('minimizeWindow', () => {
    it('should call window.minimize() in Tauri environment', async () => {
      mockMinimize.mockResolvedValueOnce(undefined);

      await minimizeWindow();

      expect(mockMinimize).toHaveBeenCalled();
    });

    it('should not call minimize in non-Tauri environment', async () => {
      setWindow({ location: { hostname: 'localhost' } });

      await minimizeWindow();

      expect(mockMinimize).not.toHaveBeenCalled();
    });
  });

  describe('toggleMaximizeWindow', () => {
    it('should call window.toggleMaximize() in Tauri environment', async () => {
      mockToggleMaximize.mockResolvedValueOnce(undefined);

      await toggleMaximizeWindow();

      expect(mockToggleMaximize).toHaveBeenCalled();
    });

    it('should not call toggleMaximize in non-Tauri environment', async () => {
      setWindow({ location: { hostname: 'localhost' } });

      await toggleMaximizeWindow();

      expect(mockToggleMaximize).not.toHaveBeenCalled();
    });
  });

  describe('isWindowMaximized', () => {
    it('should return maximized state in Tauri environment', async () => {
      mockIsMaximized.mockResolvedValueOnce(true);

      const result = await isWindowMaximized();

      expect(mockIsMaximized).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false when window is not maximized', async () => {
      mockIsMaximized.mockResolvedValueOnce(false);

      const result = await isWindowMaximized();

      expect(result).toBe(false);
    });

    it('should return false in non-Tauri environment', async () => {
      setWindow({ location: { hostname: 'localhost' } });

      const result = await isWindowMaximized();

      expect(result).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle invoke errors for restartApp', async () => {
      mockInvoke.mockRejectedValueOnce(new Error('Restart failed'));

      // Should not throw, just log error
      await expect(restartApp()).resolves.toBeUndefined();
    });

    it('should handle invoke errors for quitApp', async () => {
      mockInvoke.mockRejectedValueOnce(new Error('Quit failed'));

      await expect(quitApp()).resolves.toBeUndefined();
    });

    it('should handle window API errors for closeWindow', async () => {
      mockClose.mockRejectedValueOnce(new Error('Close failed'));

      await expect(closeWindow()).resolves.toBeUndefined();
    });

    it('should handle window API errors for minimizeWindow', async () => {
      mockMinimize.mockRejectedValueOnce(new Error('Minimize failed'));

      await expect(minimizeWindow()).resolves.toBeUndefined();
    });

    it('should handle window API errors for toggleMaximizeWindow', async () => {
      mockToggleMaximize.mockRejectedValueOnce(new Error('Toggle failed'));

      await expect(toggleMaximizeWindow()).resolves.toBeUndefined();
    });

    it('should handle window API errors for isWindowMaximized', async () => {
      mockIsMaximized.mockRejectedValueOnce(new Error('Check failed'));

      const result = await isWindowMaximized();
      expect(result).toBe(false);
    });
  });
});
