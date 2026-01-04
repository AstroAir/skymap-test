/**
 * App Control API
 *
 * Provides functions to control the application lifecycle including
 * restart, quit, and reload functionality.
 */

import { invoke } from '@tauri-apps/api/core';

/**
 * Check if running in Tauri environment
 */
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

/**
 * Restart the application
 *
 * This will save window state before restarting to preserve
 * window position and size across restarts.
 */
export async function restartApp(): Promise<void> {
  if (!isTauri()) {
    console.warn('restartApp is only available in Tauri environment');
    return;
  }
  await invoke('restart_app');
}

/**
 * Quit the application gracefully
 *
 * This will save window state before quitting.
 *
 * @param exitCode - Optional exit code (defaults to 0)
 */
export async function quitApp(exitCode?: number): Promise<void> {
  if (!isTauri()) {
    console.warn('quitApp is only available in Tauri environment');
    return;
  }
  await invoke('quit_app', { exitCode });
}

/**
 * Reload the webview (soft restart - just refreshes the frontend)
 *
 * This does not restart the Tauri backend, only reloads the webview.
 */
export async function reloadWebview(): Promise<void> {
  if (!isTauri()) {
    // In browser, just reload the page
    window.location.reload();
    return;
  }
  await invoke('reload_webview');
}

/**
 * Check if running in development mode
 */
export async function isDevMode(): Promise<boolean> {
  if (!isTauri()) {
    // In browser, assume development if localhost
    return window.location.hostname === 'localhost';
  }
  return await invoke<boolean>('is_dev_mode');
}

/**
 * Close the current window
 *
 * This uses the Tauri window API to close the current window.
 */
export async function closeWindow(): Promise<void> {
  if (!isTauri()) {
    console.warn('closeWindow is only available in Tauri environment');
    return;
  }
  const { getCurrentWindow } = await import('@tauri-apps/api/window');
  const appWindow = getCurrentWindow();
  await appWindow.close();
}

/**
 * Minimize the current window
 */
export async function minimizeWindow(): Promise<void> {
  if (!isTauri()) {
    console.warn('minimizeWindow is only available in Tauri environment');
    return;
  }
  const { getCurrentWindow } = await import('@tauri-apps/api/window');
  const appWindow = getCurrentWindow();
  await appWindow.minimize();
}

/**
 * Toggle maximize state of the current window
 */
export async function toggleMaximizeWindow(): Promise<void> {
  if (!isTauri()) {
    console.warn('toggleMaximizeWindow is only available in Tauri environment');
    return;
  }
  const { getCurrentWindow } = await import('@tauri-apps/api/window');
  const appWindow = getCurrentWindow();
  await appWindow.toggleMaximize();
}

/**
 * Toggle fullscreen state of the current window
 */
export async function toggleFullscreen(): Promise<void> {
  if (!isTauri()) {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
    return;
  }
  const { getCurrentWindow } = await import('@tauri-apps/api/window');
  const appWindow = getCurrentWindow();
  const isFullscreen = await appWindow.isFullscreen();
  await appWindow.setFullscreen(!isFullscreen);
}

/**
 * Check if the current window is maximized
 */
export async function isWindowMaximized(): Promise<boolean> {
  if (!isTauri()) {
    return false;
  }
  const { getCurrentWindow } = await import('@tauri-apps/api/window');
  const appWindow = getCurrentWindow();
  return await appWindow.isMaximized();
}
