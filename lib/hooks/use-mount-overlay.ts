'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useStellariumStore, useMountStore } from '@/lib/stores';
import { raDecToAltAz } from '@/lib/astronomy/starmap-utils';
import {
  MOUNT_CIRCLE_COLOR,
  MOUNT_CIRCLE_BORDER,
  MOUNT_CIRCLE_SIZE,
  MOUNT_CIRCLE_HIDDEN_COLOR,
  MOUNT_CIRCLE_HIDDEN_SIZE,
  MOUNT_LAYER_Z,
} from '@/lib/core/constants/mount';
import type { StellariumObject, StellariumLayer } from '@/lib/core/types';

export interface UseMountOverlayReturn {
  connected: boolean;
  raDegree: number;
  decDegree: number;
  effectiveAutoSync: boolean;
  toggleAutoSync: () => void;
  syncViewToMount: () => void;
  altAz: { alt: number; az: number } | null;
  tracking: boolean;
  slewing: boolean;
  parked: boolean;
  pierSide: 'east' | 'west' | 'unknown' | undefined;
}

/**
 * Custom hook that manages the mount position overlay on the Stellarium canvas.
 *
 * Responsibilities:
 * - Creates and manages the mount circle layer/object in Stellarium
 * - Updates circle position when mount coordinates change
 * - Handles auto-sync (lock view to mount position)
 * - Computes Alt/Az from RA/Dec using observer location
 * - Cleans up overlay objects on unmount or stel instance change
 */
export function useMountOverlay(): UseMountOverlayReturn {
  const stel = useStellariumStore((state) => state.stel);
  const connected = useMountStore((state) => state.mountInfo.Connected);
  const coordinates = useMountStore((state) => state.mountInfo.Coordinates);
  const profileInfo = useMountStore((state) => state.profileInfo);
  const tracking = useMountStore((state) => state.mountInfo.Tracking ?? false);
  const slewing = useMountStore((state) => state.mountInfo.Slewing ?? false);
  const parked = useMountStore((state) => state.mountInfo.Parked ?? false);
  const pierSide = useMountStore((state) => state.mountInfo.PierSide);

  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);

  const raDegree = coordinates.RADegrees;
  const decDegree = coordinates.Dec;

  const mountLayerRef = useRef<StellariumLayer | null>(null);
  const mountCircleRef = useRef<StellariumObject | null>(null);
  const mountAddedRef = useRef(false);
  const lastStelRef = useRef<typeof stel>(null);

  // Cleanup helper: hide the circle object
  const hideCircle = useCallback((circle: StellariumObject | null) => {
    if (!circle) return;
    circle.color = MOUNT_CIRCLE_HIDDEN_COLOR;
    circle.border_color = MOUNT_CIRCLE_HIDDEN_COLOR;
    circle.size = MOUNT_CIRCLE_HIDDEN_SIZE;
    circle.update();
  }, []);

  // Handle stel instance changes — cleanup old objects first
  useEffect(() => {
    if (lastStelRef.current !== stel) {
      hideCircle(mountCircleRef.current);
      mountLayerRef.current = null;
      mountCircleRef.current = null;
      mountAddedRef.current = false;
      lastStelRef.current = stel;
    }
  }, [stel, hideCircle]);

  const effectiveAutoSync = autoSyncEnabled && connected;

  // Update circle position
  const updateCirclePos = useCallback((ra_deg: number, dec_deg: number) => {
    if (!stel || !mountCircleRef.current) return;

    const ra_rad = ra_deg * stel.D2R;
    const dec_rad = dec_deg * stel.D2R;
    const icrfVec = stel.s2c(ra_rad, dec_rad);
    const observedVec = stel.convertFrame(stel.observer, 'JNOW', 'MOUNT', icrfVec);

    mountCircleRef.current.pos = observedVec;
    mountCircleRef.current.color = MOUNT_CIRCLE_COLOR;
    mountCircleRef.current.border_color = MOUNT_CIRCLE_BORDER;
    mountCircleRef.current.size = MOUNT_CIRCLE_SIZE;
    mountCircleRef.current.frame = 'MOUNT';
    mountCircleRef.current.label = 'MOUNT';
    mountCircleRef.current.update();
  }, [stel]);

  // Initialize mount layer and circle, with cleanup on unmount
  useEffect(() => {
    if (!stel || !connected) return;

    if (!mountLayerRef.current) {
      mountLayerRef.current = stel.createLayer({ id: 'mountLayer', z: MOUNT_LAYER_Z, visible: true });
      mountAddedRef.current = false;
    }

    if (!mountCircleRef.current) {
      const existing = stel.getObj('mountCircle');
      mountCircleRef.current = existing ?? stel.createObj('circle', {
        id: 'mountCircle',
        model_data: {},
      });
      mountCircleRef.current.update();
    }

    if (mountLayerRef.current && mountCircleRef.current && !mountAddedRef.current) {
      mountLayerRef.current.add(mountCircleRef.current);
      mountAddedRef.current = true;
    }

    return () => {
      if (mountCircleRef.current) {
        mountCircleRef.current.color = MOUNT_CIRCLE_HIDDEN_COLOR;
        mountCircleRef.current.border_color = MOUNT_CIRCLE_HIDDEN_COLOR;
        mountCircleRef.current.size = MOUNT_CIRCLE_HIDDEN_SIZE;
        mountCircleRef.current.update();
      }
    };
  }, [stel, connected]);

  // Watch for mount coordinate changes
  useEffect(() => {
    if (!stel || !mountCircleRef.current) return;

    if (!connected) {
      hideCircle(mountCircleRef.current);
      return;
    }

    updateCirclePos(raDegree, decDegree);

    if (effectiveAutoSync) {
      stel.pointAndLock(mountCircleRef.current);
    }
  }, [stel, connected, raDegree, decDegree, effectiveAutoSync, updateCirclePos, hideCircle]);

  // Toggle auto-sync
  const toggleAutoSync = useCallback(() => {
    setAutoSyncEnabled((prev) => !prev);
  }, []);

  // Sync view to mount
  const syncViewToMount = useCallback(() => {
    if (stel && connected && mountCircleRef.current) {
      stel.pointAndLock(mountCircleRef.current);
    }
  }, [stel, connected]);

  // Compute Alt/Az from RA/Dec using observer location
  const altAz = useMemo(() => {
    if (!connected) return null;
    const lat = profileInfo.AstrometrySettings.Latitude;
    const lon = profileInfo.AstrometrySettings.Longitude;
    if (lat === 0 && lon === 0) return null;
    const result = raDecToAltAz(raDegree, decDegree, lat, lon);
    return { alt: result.altitude, az: result.azimuth };
  }, [connected, raDegree, decDegree, profileInfo.AstrometrySettings.Latitude, profileInfo.AstrometrySettings.Longitude]);

  return {
    connected,
    raDegree,
    decDegree,
    effectiveAutoSync,
    toggleAutoSync,
    syncViewToMount,
    altAz,
    tracking,
    slewing,
    parked,
    pierSide,
  };
}
