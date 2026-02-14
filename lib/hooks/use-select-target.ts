'use client';

import { useCallback } from 'react';
import { useStellariumStore } from '@/lib/stores';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { rad2deg } from '@/lib/astronomy/starmap-utils';
import type { SearchResultItem } from '@/lib/core/types';
import { createLogger } from '@/lib/logger';

const logger = createLogger('use-select-target');

/**
 * Shared hook for navigating to a celestial target.
 * Supports both Stellarium and Aladin Lite engines.
 * Used by StellariumSearch and AdvancedSearchDialog to avoid code duplication.
 */
export function useSelectTarget(callbacks?: {
  onSelect?: (item: SearchResultItem) => void;
  addRecentSearch?: (name: string) => void;
}) {
  const stel = useStellariumStore((state) => state.stel);
  const aladin = useStellariumStore((state) => state.aladin);
  const setViewDirection = useStellariumStore((state) => state.setViewDirection);
  const skyEngine = useSettingsStore((state) => state.skyEngine);

  // Destructure callbacks to avoid dependency on the (likely unstable) object reference
  const onSelect = callbacks?.onSelect;
  const addRecentSearch = callbacks?.addRecentSearch;

  const selectTarget = useCallback(async (item: SearchResultItem) => {
    // ========================================================================
    // Aladin Lite engine path
    // ========================================================================
    if (skyEngine === 'aladin') {
      try {
        const ra = item.RA;
        const dec = item.Dec;

        if (ra !== undefined && dec !== undefined) {
          // Navigate by coordinates
          if (setViewDirection) {
            setViewDirection(ra, dec);
          }
        } else if (aladin && item.Name) {
          // Try named object resolution via Aladin's Sesame resolver
          if (typeof aladin.gotoObject === 'function') {
            aladin.gotoObject(item.Name, {
              success: () => {
                if (typeof aladin.adjustFovForObject === 'function') {
                  aladin.adjustFovForObject(item.Name);
                }
              },
              error: () => {
                logger.warn(`Aladin could not resolve object: ${item.Name}`);
              },
            });
          }
        }

        addRecentSearch?.(item.Name);
        onSelect?.(item);
      } catch (error) {
        logger.error('Error selecting target (Aladin)', error);
      }
      return;
    }

    // ========================================================================
    // Stellarium engine path
    // ========================================================================
    if (!stel) return;

    try {
      // Handle Stellarium objects (Comets, Planets)
      if (item.StellariumObj) {
        Object.assign(stel.core, { selection: item.StellariumObj });
        stel.pointAndLock(item.StellariumObj);
        addRecentSearch?.(item.Name);
        onSelect?.(item);
        return;
      }

      // Handle legacy Planets without StellariumObj
      let ra: number | undefined = item.RA;
      let dec: number | undefined = item.Dec;
      
      if (item.Type && (item.Type === 'Planet' || item.Type === 'Star' || item.Type === 'Moon')) {
        const planetInfo = stel.getObj(`NAME ${item.Name}`)?.getInfo('pvo', stel.observer) as number[][] | undefined;
        if (planetInfo) {
          const cirs = stel.convertFrame(stel.observer, 'ICRF', 'CIRS', planetInfo[0]);
          ra = rad2deg(stel.anp(stel.c2s(cirs)[0]));
          dec = rad2deg(stel.anpm(stel.c2s(cirs)[1]));
        }
      }

      // Handle coordinate-based objects
      if (ra !== undefined && dec !== undefined) {
        const ra_rad = ra * stel.D2R;
        const dec_rad = dec * stel.D2R;
        const icrfVec = stel.s2c(ra_rad, dec_rad);
        const observedVec = stel.convertFrame(stel.observer, 'ICRF', 'CIRS', icrfVec);

        const targetCircle = stel.createObj('circle', {
          id: 'targetCircle',
          pos: observedVec,
          color: [0, 0, 0, 0.1],
          size: [0.05, 0.05],
        });

        targetCircle.pos = observedVec;
        targetCircle.update();
        Object.assign(stel.core, { selection: targetCircle });
        stel.pointAndLock(targetCircle);
      }

      addRecentSearch?.(item.Name);
      onSelect?.(item);
    } catch (error) {
      logger.error('Error selecting target', error);
    }
  }, [stel, aladin, setViewDirection, skyEngine, onSelect, addRecentSearch]);

  return selectTarget;
}
