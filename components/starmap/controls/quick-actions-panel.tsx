'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Zap,
  Target,
  Camera,
  Eye,
  MapPin,
  Compass,
  Star,
  Moon,
  Sun,
  Navigation,
  Layers,
  Grid3X3,
  RotateCcw,
  ZoomIn,
  ChevronUp,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useMountStore, useEquipmentStore, useSettingsStore, useStellariumStore } from '@/lib/stores';
import { useTargetListStore } from '@/lib/stores/target-list-store';
import {
  getMoonPhase,
  getMoonPhaseName,
  getMoonIllumination,
  getSunPosition,
  calculateTwilightTimes,
} from '@/lib/astronomy/astro-utils';
import { raDecToAltAz, getLST } from '@/lib/astronomy/starmap-utils';
import { ZOOM_PRESETS } from '@/components/starmap/canvas/constants';

interface QuickActionsPanelProps {
  onZoomToFov?: (fov: number) => void;
  onResetView?: () => void;
  className?: string;
}

export function QuickActionsPanel({
  onZoomToFov,
  onResetView,
  className,
}: QuickActionsPanelProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(true);
  
  // Refresh trigger for astronomical conditions (only when popover is open)
  const [refreshTick, setRefreshTick] = useState(0);
  
  useEffect(() => {
    if (!open) return;
    setRefreshTick(prev => prev + 1);
    const interval = setInterval(() => {
      setRefreshTick(prev => prev + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, [open]);

  // Store state
  const profileInfo = useMountStore((state) => state.profileInfo);
  const fovEnabled = useEquipmentStore((state) => state.fovDisplay.enabled);
  const setFovEnabled = useEquipmentStore((state) => state.setFOVEnabled);
  const stellariumSettings = useSettingsStore((state) => state.stellarium);
  const toggleStellariumSetting = useSettingsStore((state) => state.toggleStellariumSetting);
  const targets = useTargetListStore((state) => state.targets);
  const activeTargetId = useTargetListStore((state) => state.activeTargetId);
  const setViewDirection = useStellariumStore((state) => state.setViewDirection);

  const latitude = profileInfo.AstrometrySettings.Latitude || 0;
  const longitude = profileInfo.AstrometrySettings.Longitude || 0;

  // Calculate astronomical conditions (refreshes every 60 seconds via refreshTick)
  const conditions = useMemo(() => {
    const moonPhase = getMoonPhase();
    const moonPhaseName = getMoonPhaseName(moonPhase);
    const moonIllumination = getMoonIllumination(moonPhase);
    const sunPos = getSunPosition();
    const sunAltAz = raDecToAltAz(sunPos.ra, sunPos.dec, latitude, longitude);
    const twilight = calculateTwilightTimes(latitude, longitude, new Date());

    const isDark = sunAltAz.altitude < -18;
    const isTwilight = sunAltAz.altitude >= -18 && sunAltAz.altitude < 0;
    const isDay = sunAltAz.altitude >= 0;

    return {
      moonPhaseName,
      moonIllumination: Math.round(moonIllumination),
      sunAltitude: sunAltAz.altitude,
      isDark,
      isTwilight,
      isDay,
      twilight,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude, refreshTick]);

  // Get active target
  const activeTarget = useMemo(() => {
    if (!activeTargetId) return null;
    return targets.find(t => t.id === activeTargetId) || null;
  }, [targets, activeTargetId]);

  // Quick navigation to celestial reference points
  // Uses well-defined astronomical coordinates:
  // - NCP (North Celestial Pole): RA=0h, Dec=+90°
  // - SCP (South Celestial Pole): RA=0h, Dec=-90°
  // - Vernal Equinox (春分点): RA=0h, Dec=0°
  // - Autumnal Equinox (秋分点): RA=12h (180°), Dec=0°
  // - Zenith: calculated from observer's latitude (Dec = latitude, RA from LST)
  const navigateToDirection = useCallback((direction: 'NCP' | 'SCP' | 'vernal' | 'autumnal' | 'zenith') => {
    if (!setViewDirection) return;
    
    switch (direction) {
      case 'NCP': // North Celestial Pole
        setViewDirection(0, 90);
        break;
      case 'SCP': // South Celestial Pole
        setViewDirection(0, -90);
        break;
      case 'vernal': // Vernal Equinox (RA=0h)
        setViewDirection(0, 0);
        break;
      case 'autumnal': // Autumnal Equinox (RA=12h = 180°)
        setViewDirection(180, 0);
        break;
      case 'zenith': // Zenith (Dec = latitude, RA = LST)
        setViewDirection(getLST(longitude), latitude);
        break;
    }
  }, [setViewDirection, latitude, longitude]);

  // Navigate to active target
  const navigateToActiveTarget = useCallback(() => {
    if (!activeTarget || !setViewDirection) return;
    setViewDirection(activeTarget.ra, activeTarget.dec);
  }, [activeTarget, setViewDirection]);

  // Quick zoom presets (from shared constants)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-9 w-9 backdrop-blur-md border border-border/50 touch-target toolbar-btn",
                open
                  ? "bg-primary/20 text-primary border-primary/50"
                  : "bg-card/60 text-foreground/80 hover:text-foreground hover:bg-accent",
                className
              )}
              data-tour-id="quick-actions"
            >
              <Zap className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{t('quickActions.title')}</p>
        </TooltipContent>
      </Tooltip>

      <PopoverContent 
        className="w-72 sm:w-80 p-0 bg-card/95 backdrop-blur-md border-border animate-in fade-in zoom-in-95 slide-in-from-top-2"
        align="end"
        sideOffset={8}
      >
        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              {t('quickActions.title')}
            </h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          </div>
        </div>

        <ScrollArea className="max-h-[60vh]">
          <div className="p-3 space-y-4">
            {/* Current Conditions Summary */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                {conditions.isDark ? (
                  <Moon className="h-4 w-4 text-blue-400" />
                ) : conditions.isTwilight ? (
                  <Sun className="h-4 w-4 text-orange-400" />
                ) : (
                  <Sun className="h-4 w-4 text-yellow-400" />
                )}
                <span className="text-xs">
                  {conditions.isDark 
                    ? t('quickActions.darkSky') 
                    : conditions.isTwilight 
                      ? t('quickActions.twilight') 
                      : t('quickActions.daylight')}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Moon className="h-3 w-3" />
                <span>{conditions.moonIllumination}%</span>
              </div>
            </div>

            {/* Active Target Quick Access */}
            {activeTarget && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  {t('quickActions.activeTarget')}
                </h4>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start h-9 text-xs"
                  onClick={navigateToActiveTarget}
                >
                  <Star className="h-3 w-3 mr-2 text-primary" />
                  <span className="truncate flex-1 text-left">{activeTarget.name}</span>
                  <Navigation className="h-3 w-3 ml-2 text-muted-foreground" />
                </Button>
              </div>
            )}

            {expanded && (
              <>
                {/* Quick Navigation */}
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Compass className="h-3 w-3" />
                    {t('quickActions.navigation')}
                  </h4>
                  <div className="grid grid-cols-5 gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => navigateToDirection('NCP')}
                        >
                          {t('quickActions.ncp')}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>{t('quickActions.ncpTooltip')}</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => navigateToDirection('SCP')}
                        >
                          {t('quickActions.scp')}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>{t('quickActions.scpTooltip')}</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => navigateToDirection('vernal')}
                        >
                          {t('quickActions.vernal')}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>{t('quickActions.vernalTooltip')}</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => navigateToDirection('autumnal')}
                        >
                          {t('quickActions.autumnal')}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>{t('quickActions.autumnalTooltip')}</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => navigateToDirection('zenith')}
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>{t('quickActions.zenithTooltip')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                <Separator />

                {/* Quick Zoom */}
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <ZoomIn className="h-3 w-3" />
                    {t('quickActions.quickZoom')}
                  </h4>
                  <div className="grid grid-cols-6 gap-1">
                    {ZOOM_PRESETS.map((preset) => (
                      <Button
                        key={preset.fov}
                        variant="outline"
                        size="sm"
                        className="h-7 text-[10px] px-1"
                        onClick={() => onZoomToFov?.(preset.fov)}
                      >
                        {preset.fov}°
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Display Toggles */}
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {t('quickActions.display')}
                  </h4>
                  <div className="grid grid-cols-2 gap-1.5">
                    <Button
                      variant={stellariumSettings.constellationsLinesVisible ? "default" : "outline"}
                      size="sm"
                      className="h-8 text-xs justify-start"
                      onClick={() => toggleStellariumSetting('constellationsLinesVisible')}
                    >
                      <Sparkles className="h-3 w-3 mr-1.5" />
                      {t('quickActions.constellations')}
                    </Button>
                    <Button
                      variant={stellariumSettings.equatorialLinesVisible ? "default" : "outline"}
                      size="sm"
                      className="h-8 text-xs justify-start"
                      onClick={() => toggleStellariumSetting('equatorialLinesVisible')}
                    >
                      <Grid3X3 className="h-3 w-3 mr-1.5" />
                      {t('quickActions.eqGrid')}
                    </Button>
                    <Button
                      variant={stellariumSettings.azimuthalLinesVisible ? "default" : "outline"}
                      size="sm"
                      className="h-8 text-xs justify-start"
                      onClick={() => toggleStellariumSetting('azimuthalLinesVisible')}
                    >
                      <Compass className="h-3 w-3 mr-1.5" />
                      {t('quickActions.azGrid')}
                    </Button>
                    <Button
                      variant={fovEnabled ? "default" : "outline"}
                      size="sm"
                      className="h-8 text-xs justify-start"
                      onClick={() => setFovEnabled(!fovEnabled)}
                    >
                      <Camera className="h-3 w-3 mr-1.5" />
                      {t('quickActions.fovOverlay')}
                    </Button>
                    <Button
                      variant={stellariumSettings.dsosVisible ? "default" : "outline"}
                      size="sm"
                      className="h-8 text-xs justify-start"
                      onClick={() => toggleStellariumSetting('dsosVisible')}
                    >
                      <Layers className="h-3 w-3 mr-1.5" />
                      {t('quickActions.dsos')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs justify-start"
                      onClick={onResetView}
                    >
                      <RotateCcw className="h-3 w-3 mr-1.5" />
                      {t('quickActions.reset')}
                    </Button>
                  </div>
                </div>

                {/* Target List Summary */}
                {targets.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {t('quickActions.targetList')}
                      </h4>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <span className="text-xs">{t('quickActions.totalTargets')}</span>
                        <Badge variant="secondary" className="text-xs">
                          {targets.length}
                        </Badge>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
