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
    restoreWindowState().catch(console.error);

    // Save state periodically (every 30 seconds)
    const interval = setInterval(() => {
      saveWindowState().catch(console.error);
    }, 30000);

    // Save state before unload
    const handleBeforeUnload = () => {
      if (!savedRef.current) {
        savedRef.current = true;
        saveWindowState().catch(console.error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Save on unmount
      if (!savedRef.current) {
        savedRef.current = true;
        saveWindowState().catch(console.error);
      }
    };
  }, []);
}

export default useWindowState;
