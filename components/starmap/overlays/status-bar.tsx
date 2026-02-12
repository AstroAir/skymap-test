'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  Moon,
  Sun,
  Wifi,
  WifiOff,
  Clock,
  MapPin,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useMountStore, useStellariumStore } from '@/lib/stores';
import { formatTimeShort } from '@/lib/astronomy/astro-utils';
import { rad2deg, degreesToHMS } from '@/lib/astronomy/starmap-utils';
import { calculateAstroConditions, getSkyQualityColor } from '@/lib/astronomy/sky-quality';
import type { StatusBarProps } from '@/types/starmap/overlays';

// View Center Display sub-component
function ViewCenterDisplay() {
  const t = useTranslations();
  const getCurrentViewDirection = useStellariumStore((state) => state.getCurrentViewDirection);
  const [viewCenter, setViewCenter] = useState<{ ra: string; dec: string; alt: string; az: string } | null>(null);

  useEffect(() => {
    const updateViewCenter = () => {
      if (getCurrentViewDirection) {
        try {
          const dir = getCurrentViewDirection();
          const raDeg = rad2deg(dir.ra);
          const decDeg = rad2deg(dir.dec);
          const altDeg = rad2deg(dir.alt);
          const azDeg = rad2deg(dir.az);
          
          setViewCenter({
            ra: degreesToHMS(((raDeg % 360) + 360) % 360),
            dec: `${decDeg >= 0 ? '+' : ''}${decDeg.toFixed(1)}°`,
            alt: `${altDeg.toFixed(1)}°`,
            az: `${(((azDeg % 360) + 360) % 360).toFixed(1)}°`,
          });
        } catch {
          // Ignore errors during initialization
        }
      }
    };

    updateViewCenter();
    const interval = setInterval(updateViewCenter, 1000);
    return () => clearInterval(interval);
  }, [getCurrentViewDirection]);

  if (!viewCenter) return null;

  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <span className="hidden sm:inline text-[10px]">
        {t('coordinates.ra')}: <span className="text-foreground font-mono">{viewCenter.ra}</span>
      </span>
      <span className="hidden sm:inline text-[10px]">
        {t('coordinates.dec')}: <span className="text-foreground font-mono">{viewCenter.dec}</span>
      </span>
      <span className="hidden md:inline text-[10px]">
        {t('coordinates.alt')}: <span className={cn(
          "font-mono",
          parseFloat(viewCenter.alt) > 30 ? "text-green-400" : 
          parseFloat(viewCenter.alt) > 0 ? "text-yellow-400" : "text-red-400"
        )}>{viewCenter.alt}</span>
      </span>
      <span className="hidden md:inline text-[10px]">
        {t('coordinates.az')}: <span className="text-foreground font-mono">{viewCenter.az}</span>
      </span>
    </div>
  );
}

// Astronomical conditions popup
function AstroConditionsPopup() {
  const t = useTranslations();
  const profileInfo = useMountStore((state) => state.profileInfo);
  const latitude = profileInfo.AstrometrySettings.Latitude || 0;
  const longitude = profileInfo.AstrometrySettings.Longitude || 0;

  const conditions = useMemo(() =>
    calculateAstroConditions(latitude, longitude),
    [latitude, longitude]
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 px-2 text-[10px] gap-1 hover:bg-accent"
        >
          <Moon className="h-3 w-3" />
          <span>{conditions.moonIllumination}%</span>
          <span className={cn("hidden sm:inline", getSkyQualityColor(conditions.skyQuality))}>
            • {t(`statusBar.sky.${conditions.skyQuality}`)}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="center" sideOffset={8}>
        <div className="space-y-3">
          <h4 className="text-sm font-medium">{t('statusBar.conditions')}</h4>
          
          {/* Moon Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Moon className="h-4 w-4 text-yellow-200" />
              <span className="text-xs">{conditions.moonPhaseName}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {conditions.moonIllumination}% • Alt: {conditions.moonAltitude.toFixed(0)}°
            </div>
          </div>

          {/* Sun Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sun className={cn(
                "h-4 w-4",
                conditions.sunAltitude > 0 ? "text-yellow-400" : "text-orange-400"
              )} />
              <span className="text-xs">
                {conditions.sunAltitude > 0 ? t('statusBar.daylight') : 
                 conditions.isTwilight ? t('statusBar.twilight') : t('statusBar.night')}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              Alt: {conditions.sunAltitude.toFixed(0)}°
            </div>
          </div>

          <Separator />

          {/* Twilight Times */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">{t('tonight.sunset')}: </span>
              <span className="font-mono">{formatTimeShort(conditions.twilight.sunset)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">{t('tonight.sunrise')}: </span>
              <span className="font-mono">{formatTimeShort(conditions.twilight.sunrise)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">{t('tonight.astronomicalDusk')}: </span>
              <span className="font-mono">{formatTimeShort(conditions.twilight.astronomicalDusk)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">{t('tonight.astronomicalDawn')}: </span>
              <span className="font-mono">{formatTimeShort(conditions.twilight.astronomicalDawn)}</span>
            </div>
          </div>

          <Separator />

          {/* LST */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{t('session.lst')}</span>
            <span className="font-mono">{conditions.lstString}</span>
          </div>

          {/* Sky Quality */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{t('statusBar.skyQuality')}</span>
            <span className={cn("capitalize", getSkyQualityColor(conditions.skyQuality))}>
              {t(`statusBar.sky.${conditions.skyQuality}`)}
            </span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Location & Time Display
function LocationTimeDisplay() {
  const t = useTranslations();
  const profileInfo = useMountStore((state) => state.profileInfo);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };

    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    updateTime();
    updateOnlineStatus();
    
    const interval = setInterval(updateTime, 1000);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const lat = profileInfo.AstrometrySettings.Latitude || 0;
  const lon = profileInfo.AstrometrySettings.Longitude || 0;

  return (
    <div className="flex items-center gap-2 text-[10px]">
      {/* Online Status */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "flex items-center gap-1",
            isOnline ? "text-green-400" : "text-red-400"
          )}>
            {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {isOnline ? t('system.connectionOnline') : t('system.connectionOffline')}
        </TooltipContent>
      </Tooltip>

      {/* Location */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="hidden md:flex items-center gap-1 text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span className="font-mono">{lat.toFixed(2)}°, {lon.toFixed(2)}°</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>{t('session.location')}</TooltipContent>
      </Tooltip>

      {/* Time */}
      <div className="flex items-center gap-1">
        <Clock className="h-3 w-3 text-muted-foreground" />
        <span className="font-mono text-foreground">{currentTime}</span>
      </div>
    </div>
  );
}

export function StatusBar({ currentFov, className }: StatusBarProps) {
  const t = useTranslations();

  return (
    <div className={cn(
      "absolute bottom-0 left-0 right-0 pointer-events-none safe-area-bottom z-30",
      className
    )}>
      <div className="bg-card/90 backdrop-blur-md border-t border-border/50 pointer-events-auto">
        {/* Main status bar */}
        <div className="px-2 sm:px-4 py-1.5 flex items-center justify-between gap-2">
          {/* Left: View coordinates */}
          <ViewCenterDisplay />

          {/* Center: FOV */}
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Eye className="h-3 w-3" />
                  <span className="font-mono text-foreground">
                    {currentFov < 1 ? currentFov.toFixed(2) : currentFov.toFixed(1)}°
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>{t('zoom.fov')}</TooltipContent>
            </Tooltip>

            {/* Astro Conditions */}
            <AstroConditionsPopup />
          </div>

          {/* Right: Location & Time */}
          <LocationTimeDisplay />
        </div>
      </div>
    </div>
  );
}
