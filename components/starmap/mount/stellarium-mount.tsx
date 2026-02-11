'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useStellariumStore, useMountStore } from '@/lib/stores';
import { degreesToHMS, degreesToDMS, raDecToAltAz } from '@/lib/astronomy/starmap-utils';
import { Telescope, RefreshCw, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { StellariumObject, StellariumLayer } from '@/lib/core/types';

const MOUNT_CIRCLE_COLOR: [number, number, number, number] = [0, 1, 0, 0.25];
const MOUNT_CIRCLE_BORDER: [number, number, number, number] = [1, 1, 1, 1];
const MOUNT_CIRCLE_SIZE: [number, number] = [0.03, 0.03];
const MOUNT_CIRCLE_HIDDEN_COLOR: [number, number, number, number] = [0, 0, 0, 0];
const MOUNT_CIRCLE_HIDDEN_SIZE: [number, number] = [0, 0];
const MOUNT_LAYER_Z = 7;

interface StellariumMountProps {
  compact?: boolean;
}

function MountPanel({ compact }: StellariumMountProps) {
  const t = useTranslations();
  const stel = useStellariumStore((state) => state.stel);
  const connected = useMountStore((state) => state.mountInfo.Connected);
  const coordinates = useMountStore((state) => state.mountInfo.Coordinates);
  const profileInfo = useMountStore((state) => state.profileInfo);

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

  // Disconnected state
  if (!connected) {
    if (compact) return null;
    return (
      <div className="flex flex-col gap-1 bg-black/80 backdrop-blur-sm rounded-lg p-2 border border-border">
        <div className="text-center px-2">
          <div className="flex items-center justify-center gap-1 text-muted-foreground">
            <WifiOff className="h-3 w-3" />
            <span className="text-xs font-medium">{t('mount.disconnected')}</span>
          </div>
        </div>
      </div>
    );
  }

  // Format coordinates for display
  const raDisplay = degreesToHMS(((raDegree % 360) + 360) % 360);
  const decDisplay = degreesToDMS(decDegree);

  const panel = (
    <div className="flex flex-col gap-2 bg-black/80 backdrop-blur-sm rounded-lg p-2 border border-border">
      {/* Mount Position Display */}
      <div className="text-center px-2">
        <div className="flex items-center justify-center gap-1 text-green-400 mb-1">
          <Telescope className="h-3 w-3" />
          <span className="text-xs font-medium">{t('mount.mount')}</span>
          <span className="text-[9px] text-muted-foreground ml-0.5">J2000</span>
        </div>
        <p className="text-xs font-mono text-foreground">{raDisplay}</p>
        <p className="text-xs font-mono text-foreground">{decDisplay}</p>
        {altAz && (
          <div className="mt-1 pt-1 border-t border-border/50">
            <p className="text-[10px] font-mono text-muted-foreground">
              {t('mount.altitude')}: {degreesToDMS(altAz.alt)}
            </p>
            <p className="text-[10px] font-mono text-muted-foreground">
              {t('mount.azimuth')}: {degreesToDMS(altAz.az)}
            </p>
          </div>
        )}
      </div>

      {/* Sync View Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent"
            onClick={syncViewToMount}
          >
            <Telescope className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>{t('mount.goToMountPosition')}</p>
        </TooltipContent>
      </Tooltip>

      {/* Auto-Sync Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 ${effectiveAutoSync ? 'text-primary bg-primary/20' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}
            onClick={toggleAutoSync}
          >
            <RefreshCw className={`h-4 w-4 ${effectiveAutoSync ? 'animate-spin' : ''}`} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>{effectiveAutoSync ? t('mount.disableAutoSync') : t('mount.enableAutoSync')}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );

  // Compact mode: popover trigger for mobile
  if (compact) {
    return (
      <Popover>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-green-400 hover:text-green-300 hover:bg-accent"
              >
                <Telescope className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>{t('mount.mount')}</p>
          </TooltipContent>
        </Tooltip>
        <PopoverContent side="top" align="center" className="w-auto p-0">
          {panel}
        </PopoverContent>
      </Popover>
    );
  }

  return panel;
}

export { MountPanel as StellariumMount };
