'use client';

import { useEffect, useRef, RefObject } from 'react';
import { useSettingsStore, useStellariumStore } from '@/lib/stores';
import { SETTINGS_DEBOUNCE_MS } from '@/lib/core/constants/stellarium-canvas';
import type { StellariumEngine } from '@/lib/core/types';

/**
 * Hook for syncing Stellarium settings with debouncing
 */
export function useSettingsSync(
  stelRef: RefObject<StellariumEngine | null>,
  engineReady: boolean
) {
  const settingsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stellariumSettings = useSettingsStore((state) => state.stellarium);
  const updateStellariumCore = useStellariumStore((state) => state.updateStellariumCore);

  // Apply settings changes to Stellarium core with debouncing
  useEffect(() => {
    // Only apply settings after engine is ready (initial settings already applied)
    if (!engineReady || !stelRef.current) return;
    
    // Clear any pending update
    if (settingsTimeoutRef.current) {
      clearTimeout(settingsTimeoutRef.current);
    }
    
    // Debounce settings updates to prevent stuttering
    settingsTimeoutRef.current = setTimeout(() => {
      if (stelRef.current) {
        updateStellariumCore(stellariumSettings);
      }
    }, SETTINGS_DEBOUNCE_MS);
    
    return () => {
      if (settingsTimeoutRef.current) {
        clearTimeout(settingsTimeoutRef.current);
      }
    };
  }, [stelRef, stellariumSettings, updateStellariumCore, engineReady]);

  return { stellariumSettings, settingsTimeoutRef };
}
