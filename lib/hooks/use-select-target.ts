'use client';

import { useCallback } from 'react';
import { useStellariumStore } from '@/lib/stores';
import { rad2deg } from '@/lib/astronomy/starmap-utils';
import type { SearchResultItem } from '@/lib/core/types';
import { createLogger } from '@/lib/logger';

const logger = createLogger('use-select-target');

/**
 * Shared hook for navigating to a celestial target in Stellarium.
 * Used by StellariumSearch and AdvancedSearchDialog to avoid code duplication.
 */
export function useSelectTarget(callbacks?: {
  onSelect?: (item: SearchResultItem) => void;
  addRecentSearch?: (name: string) => void;
}) {
  const stel = useStellariumStore((state) => state.stel);

  const selectTarget = useCallback(async (item: SearchResultItem) => {
    if (!stel) return;

    try {
      // Handle Stellarium objects (Comets, Planets)
      if (item.StellariumObj) {
        Object.assign(stel.core, { selection: item.StellariumObj });
        stel.pointAndLock(item.StellariumObj);
        callbacks?.addRecentSearch?.(item.Name);
        callbacks?.onSelect?.(item);
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

      callbacks?.addRecentSearch?.(item.Name);
      callbacks?.onSelect?.(item);
    } catch (error) {
      logger.error('Error selecting target', error);
    }
  }, [stel, callbacks]);

  return selectTarget;
}
