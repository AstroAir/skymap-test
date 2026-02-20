'use client';

import { memo, useState, useCallback, useMemo } from 'react';
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
import { useAladinStore, useEquipmentStore, useMountStore, useSettingsStore, useStellariumStore } from '@/lib/stores';
import { useTargetListStore } from '@/lib/stores/target-list-store';
import { useObservingConditions } from '@/lib/hooks/use-observing-conditions';
import { getCelestialReferencePoint } from '@/lib/astronomy/navigation';
import { ZOOM_PRESETS } from '@/lib/core/constants/fov';
import type { QuickActionsPanelProps, CelestialDirection } from '@/types/starmap/controls';

const CELESTIAL_DIRECTIONS = [
  { key: 'NCP' as CelestialDirection, labelKey: 'ncp', tooltipKey: 'ncpTooltip' },
  { key: 'SCP' as CelestialDirection, labelKey: 'scp', tooltipKey: 'scpTooltip' },
  { key: 'vernal' as CelestialDirection, labelKey: 'vernal', tooltipKey: 'vernalTooltip' },
  { key: 'autumnal' as CelestialDirection, labelKey: 'autumnal', tooltipKey: 'autumnalTooltip' },
  { key: 'zenith' as CelestialDirection, labelKey: 'zenith', tooltipKey: 'zenithTooltip', icon: true },
] as const;

export const QuickActionsPanel = memo(function QuickActionsPanel({
  onZoomToFov,
  onResetView,
  className,
}: QuickActionsPanelProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(true);

  // Store state
  const profileInfo = useMountStore((state) => state.profileInfo);
  const fovEnabled = useEquipmentStore((state) => state.fovDisplay.enabled);
  const setFovEnabled = useEquipmentStore((state) => state.setFOVEnabled);
  const skyEngine = useSettingsStore((state) => state.skyEngine);
  const setSkyEngine = useSettingsStore((state) => state.setSkyEngine);
  const stellariumSettings = useSettingsStore((state) => state.stellarium);
  const toggleStellariumSetting = useSettingsStore((state) => state.toggleStellariumSetting);
  const catalogLayers = useAladinStore((state) => state.catalogLayers);
  const toggleCatalogLayer = useAladinStore((state) => state.toggleCatalogLayer);
  const mocLayers = useAladinStore((state) => state.mocLayers);
  const toggleMocLayer = useAladinStore((state) => state.toggleMocLayer);
  const overlayLayers = useAladinStore((state) => state.imageOverlayLayers);
  const toggleImageOverlayLayer = useAladinStore((state) => state.toggleImageOverlayLayer);
  const updateImageOverlayLayer = useAladinStore((state) => state.updateImageOverlayLayer);
  const fitsLayers = useAladinStore((state) => state.fitsLayers);
  const toggleFitsLayer = useAladinStore((state) => state.toggleFitsLayer);
  const targets = useTargetListStore((state) => state.targets);
  const activeTargetId = useTargetListStore((state) => state.activeTargetId);
  const setViewDirection = useStellariumStore((state) => state.setViewDirection);
  const isStellarium = skyEngine === 'stellarium';

  const latitude = profileInfo.AstrometrySettings.Latitude || 0;
  const longitude = profileInfo.AstrometrySettings.Longitude || 0;

  // Calculate astronomical conditions (extracted to reusable hook)
  const conditions = useObservingConditions(latitude, longitude, { enabled: open });

  // Get active target
  const activeTarget = useMemo(() => {
    if (!activeTargetId) return null;
    return targets.find(t => t.id === activeTargetId) || null;
  }, [targets, activeTargetId]);

  // Quick navigation to celestial reference points (extracted to lib/astronomy/navigation)
  const navigateToDirection = useCallback((direction: CelestialDirection) => {
    if (!setViewDirection) return;
    const point = getCelestialReferencePoint(direction, latitude, longitude);
    setViewDirection(point.ra, point.dec);
  }, [setViewDirection, latitude, longitude]);

  // Navigate to active target
  const navigateToActiveTarget = useCallback(() => {
    if (!activeTarget || !setViewDirection) return;
    setViewDirection(activeTarget.ra, activeTarget.dec);
  }, [activeTarget, setViewDirection]);

  const adjustPrimaryOverlayOpacity = useCallback((delta: number) => {
    const layer = overlayLayers[0];
    if (!layer) return;
    const next = Math.max(0, Math.min(1, layer.opacity + delta));
    updateImageOverlayLayer(layer.id, { opacity: next });
  }, [overlayLayers, updateImageOverlayLayer]);

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
                    {CELESTIAL_DIRECTIONS.map((dir) => (
                      <Tooltip key={dir.key}>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => navigateToDirection(dir.key)}
                          >
                            {'icon' in dir ? <ChevronUp className="h-3 w-3" /> : t(`quickActions.${dir.labelKey}`)}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p>{t(`quickActions.${dir.tooltipKey}`)}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
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
                  {isStellarium ? (
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
                  ) : (
                    <div className="grid grid-cols-2 gap-1.5">
                      {catalogLayers.map((layer) => (
                        <Button
                          key={layer.id}
                          variant={layer.enabled ? "default" : "outline"}
                          size="sm"
                          className="h-8 text-xs justify-start"
                          onClick={() => toggleCatalogLayer(layer.id)}
                        >
                          <Layers className="h-3 w-3 mr-1.5" />
                          {layer.name}
                        </Button>
                      ))}
                      {mocLayers.map((layer) => (
                        <Button
                          key={layer.id}
                          variant={layer.visible ? "default" : "outline"}
                          size="sm"
                          className="h-8 text-xs justify-start"
                          onClick={() => toggleMocLayer(layer.id)}
                        >
                          <Grid3X3 className="h-3 w-3 mr-1.5" />
                          {layer.name}
                        </Button>
                      ))}
                      {overlayLayers.map((layer) => (
                        <Button
                          key={layer.id}
                          variant={layer.enabled ? "default" : "outline"}
                          size="sm"
                          className="h-8 text-xs justify-start"
                          onClick={() => toggleImageOverlayLayer(layer.id)}
                        >
                          <Camera className="h-3 w-3 mr-1.5" />
                          {layer.name}
                        </Button>
                      ))}
                      {fitsLayers.map((layer) => (
                        <Button
                          key={layer.id}
                          variant={layer.enabled ? "default" : "outline"}
                          size="sm"
                          className="h-8 text-xs justify-start"
                          onClick={() => toggleFitsLayer(layer.id)}
                        >
                          <Camera className="h-3 w-3 mr-1.5" />
                          {layer.name}
                        </Button>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs justify-start"
                        onClick={() => adjustPrimaryOverlayOpacity(-0.1)}
                        disabled={overlayLayers.length === 0}
                      >
                        <Camera className="h-3 w-3 mr-1.5" />
                        {t('settings.aladinOverlayOpacity')} -10%
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs justify-start"
                        onClick={() => adjustPrimaryOverlayOpacity(0.1)}
                        disabled={overlayLayers.length === 0}
                      >
                        <Camera className="h-3 w-3 mr-1.5" />
                        {t('settings.aladinOverlayOpacity')} +10%
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs justify-start"
                        onClick={() => setSkyEngine('stellarium')}
                      >
                        <RotateCcw className="h-3 w-3 mr-1.5" />
                        {t('settings.switchToStellarium')}
                      </Button>
                    </div>
                  )}
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
});
QuickActionsPanel.displayName = 'QuickActionsPanel';
