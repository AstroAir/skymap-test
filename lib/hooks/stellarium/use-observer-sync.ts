'use client';

import { useEffect, useRef, RefObject } from 'react';
import { useMountStore } from '@/lib/stores';
import { useWebLocationStore } from '@/lib/stores/web-location-store';
import type { StellariumEngine } from '@/lib/core/types';

/**
 * Hook for syncing observer location from profile to Stellarium engine
 */
export function useObserverSync(stelRef: RefObject<StellariumEngine | null>) {
  const profileInfo = useMountStore((state) => state.profileInfo);
  const setProfileInfo = useMountStore((state) => state.setProfileInfo);
  const bootstrapped = useRef(false);

  // One-time bootstrap: if profileInfo is at default (0,0,0) but web-location-store
  // has a current location, restore it. Handles migration for existing users whose
  // profileInfo was not previously persisted.
  // We wait for Zustand persist rehydration via onRehydrateStorage before checking,
  // so we don't accidentally overwrite a persisted location with web-location-store.
  useEffect(() => {
    if (bootstrapped.current) return;

    // Wait for mount-store to finish rehydrating persisted state.
    // If persist middleware hasn't hydrated yet, the profileInfo is still the
    // in-memory default (0,0,0) and we'd incorrectly overwrite.
    const unsub = useMountStore.persist.onFinishHydration(() => {
      if (bootstrapped.current) return;
      bootstrapped.current = true;

      const hydrated = useMountStore.getState().profileInfo;
      const { Latitude, Longitude } = hydrated.AstrometrySettings;
      if (Latitude !== 0 || Longitude !== 0) return;

      const webLocations = useWebLocationStore.getState().locations;
      const current = webLocations.find((l) => l.is_current);
      if (current) {
        setProfileInfo({
          AstrometrySettings: {
            ...hydrated.AstrometrySettings,
            Latitude: current.latitude,
            Longitude: current.longitude,
            Elevation: current.altitude,
          },
        });
      }
    });

    // If already hydrated (synchronous storage), run immediately
    if (useMountStore.persist.hasHydrated()) {
      unsub();
      bootstrapped.current = true;

      const hydrated = useMountStore.getState().profileInfo;
      const { Latitude, Longitude } = hydrated.AstrometrySettings;
      if (Latitude !== 0 || Longitude !== 0) return;

      const webLocations = useWebLocationStore.getState().locations;
      const current = webLocations.find((l) => l.is_current);
      if (current) {
        setProfileInfo({
          AstrometrySettings: {
            ...hydrated.AstrometrySettings,
            Latitude: current.latitude,
            Longitude: current.longitude,
            Elevation: current.altitude,
          },
        });
      }
    }

    return unsub;
  }, [setProfileInfo]);

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
