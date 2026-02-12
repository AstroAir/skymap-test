/**
 * Window Controls Hook
 * 
 * Shared hook for window state management and control actions.
 * Eliminates duplication across app-control-menu, titlebar, and window-controls components.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { createLogger } from '@/lib/logger';
import {
  closeWindow,
  minimizeWindow,
  toggleMaximizeWindow,
  isWindowMaximized,
  toggleFullscreen,
  restartApp,
  quitApp,
  reloadWebview,
  isTauri,
  setAlwaysOnTop,
  isAlwaysOnTop,
  saveWindowState,
  centerWindow,
} from '@/lib/tauri/app-control-api';

const logger = createLogger('use-window-controls');

export interface WindowControlsState {
  isTauriEnv: boolean;
  isMaximized: boolean;
  isFullscreen: boolean;
  isPinned: boolean;
}

export interface WindowControlsActions {
  handleMinimize: () => Promise<void>;
  handleMaximize: () => Promise<void>;
  handleClose: () => Promise<void>;
  handleCloseWithSave: () => Promise<void>;
  handleRestart: () => Promise<void>;
  handleQuit: () => Promise<void>;
  handleQuitWithSave: () => Promise<void>;
  handleReload: () => Promise<void>;
  handleToggleFullscreen: () => Promise<void>;
  handleTogglePin: () => Promise<void>;
  handleCenterWindow: () => Promise<void>;
  handleWebReload: () => void;
}

export type UseWindowControlsReturn = WindowControlsState & WindowControlsActions;

/**
 * Hook to manage Tauri window controls and state.
 * Tracks isTauriEnv, isMaximized, isFullscreen, isPinned states
 * and provides handler functions for all window operations.
 */
export function useWindowControls(): UseWindowControlsReturn {
  const [isTauriEnv, setIsTauriEnv] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const isPinnedRef = useRef(false);
  useEffect(() => { isPinnedRef.current = isPinned; }, [isPinned]);

  // Check Tauri environment and initial window state
  useEffect(() => {
    const checkTauri = async () => {
      if (isTauri()) {
        setIsTauriEnv(true);
        try {
          const maximized = await isWindowMaximized();
          setIsMaximized(maximized);
          const pinned = await isAlwaysOnTop();
          setIsPinned(pinned);
        } catch (error) {
          logger.error('Failed to get window state', error);
        }
      }
    };
    checkTauri();

    // Check fullscreen state for web environment
    const checkFullscreen = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', checkFullscreen);
    checkFullscreen();

    return () => {
      document.removeEventListener('fullscreenchange', checkFullscreen);
    };
  }, []);

  // Track maximize state on resize
  useEffect(() => {
    if (!isTauriEnv) return;

    const handleResize = async () => {
      try {
        const maximized = await isWindowMaximized();
        setIsMaximized(maximized);
      } catch (error) {
        logger.error('Failed to check maximized state', error);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isTauriEnv]);

  const handleMinimize = useCallback(async () => {
    try {
      await minimizeWindow();
    } catch (error) {
      logger.error('Failed to minimize', error);
    }
  }, []);

  const handleMaximize = useCallback(async () => {
    try {
      await toggleMaximizeWindow();
      setIsMaximized((prev) => !prev);
    } catch (error) {
      logger.error('Failed to toggle maximize', error);
    }
  }, []);

  const handleClose = useCallback(async () => {
    try {
      await closeWindow();
    } catch (error) {
      logger.error('Failed to close', error);
    }
  }, []);

  const handleCloseWithSave = useCallback(async () => {
    try {
      await saveWindowState();
      await closeWindow();
    } catch (error) {
      logger.error('Failed to close', error);
    }
  }, []);

  const handleRestart = useCallback(async () => {
    try {
      await restartApp();
    } catch (error) {
      logger.error('Failed to restart', error);
    }
  }, []);

  const handleQuit = useCallback(async () => {
    try {
      await quitApp();
    } catch (error) {
      logger.error('Failed to quit', error);
    }
  }, []);

  const handleQuitWithSave = useCallback(async () => {
    try {
      await saveWindowState();
      await quitApp();
    } catch (error) {
      logger.error('Failed to quit', error);
    }
  }, []);

  const handleTogglePin = useCallback(async () => {
    try {
      const newPinned = !isPinnedRef.current;
      await setAlwaysOnTop(newPinned);
      setIsPinned(newPinned);
    } catch (error) {
      logger.error('Failed to toggle always on top', error);
    }
  }, []);

  const handleCenterWindow = useCallback(async () => {
    try {
      await centerWindow();
    } catch (error) {
      logger.error('Failed to center window', error);
    }
  }, []);

  const handleReload = useCallback(async () => {
    try {
      await reloadWebview();
    } catch (error) {
      logger.error('Failed to reload', error);
    }
  }, []);

  const handleToggleFullscreen = useCallback(async () => {
    try {
      await toggleFullscreen();
      setIsFullscreen((prev) => !prev);
    } catch (error) {
      logger.error('Failed to toggle fullscreen', error);
    }
  }, []);

  const handleWebReload = useCallback(() => {
    window.location.reload();
  }, []);

  return {
    isTauriEnv,
    isMaximized,
    isFullscreen,
    isPinned,
    handleMinimize,
    handleMaximize,
    handleClose,
    handleCloseWithSave,
    handleRestart,
    handleQuit,
    handleQuitWithSave,
    handleReload,
    handleToggleFullscreen,
    handleTogglePin,
    handleCenterWindow,
    handleWebReload,
  };
}
