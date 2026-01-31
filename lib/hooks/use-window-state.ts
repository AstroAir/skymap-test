/**
 * Window State Management Hook
 * 
 * Handles window state persistence and restoration for Tauri desktop app.
 */

import { useEffect, useRef } from 'react';
import {
  isTauri,
  saveWindowState,
  restoreWindowState,
} from '@/lib/tauri/app-control-api';
import { createLogger } from '@/lib/logger';

const logger = createLogger('use-window-state');

/**
 * Hook to manage window state persistence
 * - Restores window position/size on mount
 * - Saves window state periodically and before unload
 */
export function useWindowState() {
  const savedRef = useRef(false);

  useEffect(() => {
    if (!isTauri()) return;

    // Restore window state on mount
    restoreWindowState().catch(err => logger.error('Failed to restore window state', err));

    // Save state periodically (every 30 seconds)
    const interval = setInterval(() => {
      saveWindowState().catch(err => logger.error('Failed to save window state', err));
    }, 30000);

    // Save state before unload
    const handleBeforeUnload = () => {
      if (!savedRef.current) {
        savedRef.current = true;
        saveWindowState().catch(err => logger.error('Failed to save window state', err));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Save on unmount
      if (!savedRef.current) {
        savedRef.current = true;
        saveWindowState().catch(err => logger.error('Failed to save window state', err));
      }
    };
  }, []);
}

export default useWindowState;
