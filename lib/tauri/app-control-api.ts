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

/**
 * Check if the current window is fullscreen
 */
export async function isWindowFullscreen(): Promise<boolean> {
  if (!isTauri()) {
    return !!document.fullscreenElement;
  }
  const { getCurrentWindow } = await import('@tauri-apps/api/window');
  const appWindow = getCurrentWindow();
  return await appWindow.isFullscreen();
}

/**
 * Set window always on top
 */
export async function setAlwaysOnTop(alwaysOnTop: boolean): Promise<void> {
  if (!isTauri()) {
    console.warn('setAlwaysOnTop is only available in Tauri environment');
    return;
  }
  const { getCurrentWindow } = await import('@tauri-apps/api/window');
  const appWindow = getCurrentWindow();
  await appWindow.setAlwaysOnTop(alwaysOnTop);
}

/**
 * Check if window is always on top
 */
export async function isAlwaysOnTop(): Promise<boolean> {
  if (!isTauri()) {
    return false;
  }
  const { getCurrentWindow } = await import('@tauri-apps/api/window');
  const appWindow = getCurrentWindow();
  return await appWindow.isAlwaysOnTop();
}

/**
 * Set window size
 */
export async function setWindowSize(width: number, height: number): Promise<void> {
  if (!isTauri()) {
    console.warn('setWindowSize is only available in Tauri environment');
    return;
  }
  const { getCurrentWindow } = await import('@tauri-apps/api/window');
  const { LogicalSize } = await import('@tauri-apps/api/dpi');
  const appWindow = getCurrentWindow();
  await appWindow.setSize(new LogicalSize(width, height));
}

/**
 * Get window size
 */
export async function getWindowSize(): Promise<{ width: number; height: number }> {
  if (!isTauri()) {
    return { width: window.innerWidth, height: window.innerHeight };
  }
  const { getCurrentWindow } = await import('@tauri-apps/api/window');
  const appWindow = getCurrentWindow();
  const size = await appWindow.innerSize();
  return { width: size.width, height: size.height };
}

/**
 * Get window position
 */
export async function getWindowPosition(): Promise<{ x: number; y: number }> {
  if (!isTauri()) {
    return { x: window.screenX, y: window.screenY };
  }
  const { getCurrentWindow } = await import('@tauri-apps/api/window');
  const appWindow = getCurrentWindow();
  const position = await appWindow.outerPosition();
  return { x: position.x, y: position.y };
}

/**
 * Set window position
 */
export async function setWindowPosition(x: number, y: number): Promise<void> {
  if (!isTauri()) {
    console.warn('setWindowPosition is only available in Tauri environment');
    return;
  }
  const { getCurrentWindow } = await import('@tauri-apps/api/window');
  const { LogicalPosition } = await import('@tauri-apps/api/dpi');
  const appWindow = getCurrentWindow();
  await appWindow.setPosition(new LogicalPosition(x, y));
}

/**
 * Center the window on screen
 */
export async function centerWindow(): Promise<void> {
  if (!isTauri()) {
    console.warn('centerWindow is only available in Tauri environment');
    return;
  }
  const { getCurrentWindow } = await import('@tauri-apps/api/window');
  const appWindow = getCurrentWindow();
  await appWindow.center();
}

/**
 * Window state interface for persistence
 */
export interface WindowState {
  width: number;
  height: number;
  x: number;
  y: number;
  isMaximized: boolean;
  isFullscreen: boolean;
  isAlwaysOnTop: boolean;
}

/**
 * Get complete window state
 */
export async function getWindowState(): Promise<WindowState> {
  const size = await getWindowSize();
  const position = await getWindowPosition();
  const maximized = await isWindowMaximized();
  const fullscreen = await isWindowFullscreen();
  const alwaysOnTop = await isAlwaysOnTop();
  
  return {
    width: size.width,
    height: size.height,
    x: position.x,
    y: position.y,
    isMaximized: maximized,
    isFullscreen: fullscreen,
    isAlwaysOnTop: alwaysOnTop,
  };
}

/**
 * Save window state to localStorage
 */
export async function saveWindowState(): Promise<void> {
  try {
    const state = await getWindowState();
    localStorage.setItem('skymap-window-state', JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save window state:', error);
  }
}

/**
 * Load and restore window state from localStorage
 */
export async function restoreWindowState(): Promise<void> {
  if (!isTauri()) return;
  
  try {
    const savedState = localStorage.getItem('skymap-window-state');
    if (!savedState) return;
    
    const state: WindowState = JSON.parse(savedState);
    
    // Restore position and size if not maximized/fullscreen
    if (!state.isMaximized && !state.isFullscreen) {
      await setWindowPosition(state.x, state.y);
      await setWindowSize(state.width, state.height);
    }
    
    // Restore maximized state
    if (state.isMaximized) {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const appWindow = getCurrentWindow();
      await appWindow.maximize();
    }
    
    // Restore always on top
    if (state.isAlwaysOnTop) {
      await setAlwaysOnTop(true);
    }
  } catch (error) {
    console.error('Failed to restore window state:', error);
  }
}

/**
 * Set window opacity (transparency)
 */
export async function setWindowOpacity(opacity: number): Promise<void> {
  if (!isTauri()) {
    document.body.style.opacity = String(opacity);
    return;
  }
  // Note: Window opacity requires platform-specific support
  console.warn('Window opacity is not fully supported on all platforms');
}

/**
 * Get available monitors info
 */
export async function getMonitors(): Promise<Array<{ name: string | null; size: { width: number; height: number }; position: { x: number; y: number } }>> {
  if (!isTauri()) {
    return [{
      name: 'Primary',
      size: { width: window.screen.width, height: window.screen.height },
      position: { x: 0, y: 0 }
    }];
  }
  const { availableMonitors } = await import('@tauri-apps/api/window');
  const monitors = await availableMonitors();
  return monitors.map(m => ({
    name: m.name,
    size: { width: m.size.width, height: m.size.height },
    position: { x: m.position.x, y: m.position.y }
  }));
}
