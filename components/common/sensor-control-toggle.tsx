'use client';

import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { Compass, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useSettingsStore, useStellariumStore } from '@/lib/stores';
import { useDeviceOrientation, type SkyDirection } from '@/lib/hooks/use-device-orientation';
import { cn } from '@/lib/utils';

// Hook to safely check if we're on the client
const emptySubscribe = () => () => {};
function useIsClient() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

interface SensorControlToggleProps {
  className?: string;
}

export function SensorControlToggle({ className }: SensorControlToggleProps) {
  const t = useTranslations();
  const sensorControl = useSettingsStore((state) => state.stellarium.sensorControl);
  const toggleStellariumSetting = useSettingsStore((state) => state.toggleStellariumSetting);
  const setViewDirection = useStellariumStore((state) => state.setViewDirection);
  const stel = useStellariumStore((state) => state.stel);
  
  // Track if component is on client to avoid hydration mismatch
  const isClient = useIsClient();

  // Handle orientation change - update view direction
  const handleOrientationChange = useCallback((direction: SkyDirection) => {
    if (!stel || !setViewDirection) return;
    
    // Convert azimuth/altitude to RA/Dec
    // This is a simplified conversion - for accurate results we need observer location and time
    try {
      const observer = stel.core.observer;
      const azRad = direction.azimuth * stel.D2R;
      const altRad = direction.altitude * stel.D2R;
      
      // Convert horizontal to equatorial coordinates
      // Using Stellarium's coordinate conversion
      const altazVec = stel.s2c(azRad, altRad);
      const icrfVec = stel.convertFrame(observer, 'OBSERVED', 'ICRF', altazVec);
      const spherical = stel.c2s(icrfVec);
      
      const raDeg = stel.anp(spherical[0]) * stel.R2D;
      const decDeg = spherical[1] * stel.R2D;
      
      setViewDirection(raDeg, decDeg);
    } catch {
      // Ignore conversion errors
    }
  }, [stel, setViewDirection]);

  const {
    isSupported,
    isPermissionGranted,
    requestPermission,
    error,
  } = useDeviceOrientation({
    enabled: sensorControl && isClient,
    smoothingFactor: 0.2,
    onOrientationChange: handleOrientationChange,
  });

  // Handle toggle click
  const handleToggle = useCallback(async () => {
    if (!sensorControl) {
      // Turning on - check permission first
      if (!isPermissionGranted) {
        const granted = await requestPermission();
        if (!granted) return;
      }
    }
    toggleStellariumSetting('sensorControl');
  }, [sensorControl, isPermissionGranted, requestPermission, toggleStellariumSetting]);

  // Auto-disable if not supported (only after client render)
  useEffect(() => {
    if (isClient && sensorControl && !isSupported) {
      toggleStellariumSetting('sensorControl');
    }
  }, [isClient, sensorControl, isSupported, toggleStellariumSetting]);

  // Don't render until client to avoid hydration mismatch
  // After client render, don't render if not supported
  if (!isClient) {
    return null;
  }
  
  if (!isSupported) {
    return null;
  }

  const getTooltipText = () => {
    if (error) return error;
    if (!isPermissionGranted) return t('settings.sensorControlPermission');
    return sensorControl ? t('settings.sensorControlDisable') : t('settings.sensorControlEnable');
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-10 w-10 backdrop-blur-sm transition-colors',
            sensorControl
              ? 'bg-primary/30 text-primary hover:bg-primary/40'
              : 'bg-background/60 text-foreground hover:bg-background/80',
            className
          )}
          onClick={handleToggle}
        >
          {sensorControl ? (
            <Compass className="h-5 w-5 animate-pulse" />
          ) : (
            <Smartphone className="h-5 w-5" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>{getTooltipText()}</p>
      </TooltipContent>
    </Tooltip>
  );
}
