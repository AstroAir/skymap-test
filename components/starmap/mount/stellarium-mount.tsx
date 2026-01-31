'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useStellariumStore, useMountStore } from '@/lib/stores';
import { degreesToHMS, degreesToDMS } from '@/lib/astronomy/starmap-utils';
import { Telescope, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { StellariumObject, StellariumLayer } from '@/lib/core/types';

export function StellariumMount() {
  const t = useTranslations();
  const stel = useStellariumStore((state) => state.stel);
  const mountInfo = useMountStore((state) => state.mountInfo);

  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);

  // Use mount coordinates directly from store
  const raDegree = mountInfo.Coordinates.RADegrees;
  const decDegree = mountInfo.Coordinates.Dec;

  const mountLayerRef = useRef<StellariumLayer | null>(null);
  const mountCircleRef = useRef<StellariumObject | null>(null);
  const mountAddedRef = useRef(false);
  const lastStelRef = useRef<typeof stel>(null);

  useEffect(() => {
    if (lastStelRef.current !== stel) {
      mountLayerRef.current = null;
      mountCircleRef.current = null;
      mountAddedRef.current = false;
      lastStelRef.current = stel;
    }
  }, [stel]);

  useEffect(() => {
    if (!mountInfo.Connected) {
      const timeoutId = setTimeout(() => {
        setAutoSyncEnabled(false);
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [mountInfo.Connected]);

  // Update circle position
  const updateCirclePos = useCallback((ra_deg: number, dec_deg: number) => {
    if (!stel || !mountCircleRef.current) return;

    const ra_rad = ra_deg * stel.D2R;
    const dec_rad = dec_deg * stel.D2R;
    const icrfVec = stel.s2c(ra_rad, dec_rad);
    const observedVec = stel.convertFrame(stel.observer, 'JNOW', 'MOUNT', icrfVec);

    mountCircleRef.current.pos = observedVec;
    mountCircleRef.current.color = [0, 1, 0, 0.25];
    mountCircleRef.current.border_color = [1, 1, 1, 1];
    mountCircleRef.current.size = [0.03, 0.03];
    mountCircleRef.current.frame = 'MOUNT';
    mountCircleRef.current.label = 'MOUNT';
    mountCircleRef.current.update();
  }, [stel]);

  // Initialize mount layer and circle
  useEffect(() => {
    if (!stel || !mountInfo.Connected) return;

    if (!mountLayerRef.current) {
      mountLayerRef.current = stel.createLayer({ id: 'mountLayer', z: 7, visible: true });
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
  }, [stel, mountInfo.Connected]);

  // Watch for mount coordinate changes
  useEffect(() => {
    if (!stel || !mountCircleRef.current) return;

    if (!mountInfo.Connected) {
      mountCircleRef.current.color = [0, 0, 0, 0];
      mountCircleRef.current.border_color = [0, 0, 0, 0];
      mountCircleRef.current.size = [0, 0];
      mountCircleRef.current.update();
      return;
    }

    updateCirclePos(raDegree, decDegree);

    // Auto-sync view if enabled
    if (autoSyncEnabled) {
      stel.pointAndLock(mountCircleRef.current);
    }
  }, [stel, mountInfo.Connected, raDegree, decDegree, autoSyncEnabled, updateCirclePos]);

  // Toggle auto-sync
  const toggleAutoSync = () => {
    setAutoSyncEnabled((prev) => !prev);
  };

  // Sync view to mount
  const syncViewToMount = () => {
    if (stel && mountInfo.Connected && mountCircleRef.current) {
      stel.pointAndLock(mountCircleRef.current);
    }
  };

  if (!mountInfo.Connected) return null;

  // Format coordinates for display
  const raDisplay = degreesToHMS(((raDegree % 360) + 360) % 360);
  const decDisplay = degreesToDMS(decDegree);

  return (
    <div className="flex flex-col gap-2 bg-black/80 backdrop-blur-sm rounded-lg p-2 border border-border">
      {/* Mount Position Display */}
      <div className="text-center px-2">
        <div className="flex items-center justify-center gap-1 text-green-400 mb-1">
          <Telescope className="h-3 w-3" />
          <span className="text-xs font-medium">{t('mount.mount')}</span>
        </div>
        <p className="text-xs font-mono text-foreground">{raDisplay}</p>
        <p className="text-xs font-mono text-foreground">{decDisplay}</p>
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
            className={`h-8 w-8 ${autoSyncEnabled ? 'text-primary bg-primary/20' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}
            onClick={toggleAutoSync}
          >
            <RefreshCw className={`h-4 w-4 ${autoSyncEnabled ? 'animate-spin' : ''}`} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>{autoSyncEnabled ? t('mount.disableAutoSync') : t('mount.enableAutoSync')}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}


