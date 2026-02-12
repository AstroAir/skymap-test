'use client';

import { useEffect, RefObject } from 'react';
import { useMountStore } from '@/lib/stores';
import type { StellariumEngine } from '@/lib/core/types';

/**
 * Hook for syncing observer location from profile to Stellarium engine
 */
export function useObserverSync(stelRef: RefObject<StellariumEngine | null>) {
  const profileInfo = useMountStore((state) => state.profileInfo);

  useEffect(() => {
    if (!stelRef.current) return;
    const stel = stelRef.current;

    try {
      const lat = profileInfo.AstrometrySettings.Latitude || 0;
      const lon = profileInfo.AstrometrySettings.Longitude || 0;
      const elev = profileInfo.AstrometrySettings.Elevation || 0;

      stel.core.observer.latitude = lat * stel.D2R;
      stel.core.observer.longitude = lon * stel.D2R;
      stel.core.observer.elevation = elev;
    } catch (e) {
      void e;
    }
  }, [
    stelRef,
    profileInfo.AstrometrySettings.Latitude,
    profileInfo.AstrometrySettings.Longitude,
    profileInfo.AstrometrySettings.Elevation,
  ]);

  return { profileInfo };
}
