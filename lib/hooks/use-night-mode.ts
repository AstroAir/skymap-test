/**
 * Night Mode Effect Hook
 * 
 * Manages the night mode CSS class on document.documentElement.
 * Extracted from night-mode-toggle component.
 */

import { useEffect } from 'react';

/**
 * Hook to apply/remove night mode CSS class on the document root.
 * @param enabled - Whether night mode is active
 */
export function useNightModeEffect(enabled: boolean): void {
  useEffect(() => {
    if (enabled) {
      document.documentElement.classList.add('night-mode');
    } else {
      document.documentElement.classList.remove('night-mode');
    }
  }, [enabled]);
}
