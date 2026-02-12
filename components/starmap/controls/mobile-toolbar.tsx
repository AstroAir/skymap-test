'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  Search,
  Camera,
  List,
  Compass,
  Sun,
  Star,
  MoreHorizontal,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { ZOOM_PRESETS } from '@/lib/core/constants/fov';
import { useEquipmentStore, useSettingsStore } from '@/lib/stores';
import { useTargetListStore } from '@/lib/stores/target-list-store';
import type { MobileToolbarProps, MobileZoomControlProps } from '@/types/starmap/controls';

export function MobileToolbar({
  onOpenSearch,
  onZoomIn,
  onZoomOut,
  onResetView,
  onZoomToFov,
  onOpenTargetList,
  currentFov = 60,
  children,
  className,
}: MobileToolbarProps) {
  const t = useTranslations();
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [zoomDrawerOpen, setZoomDrawerOpen] = useState(false);

  // Store state
  const fovEnabled = useEquipmentStore((state) => state.fovDisplay.enabled);
  const setFovEnabled = useEquipmentStore((state) => state.setFOVEnabled);
  const targets = useTargetListStore((state) => state.targets);
  const stellariumSettings = useSettingsStore((state) => state.stellarium);
  const toggleStellariumSetting = useSettingsStore((state) => state.toggleStellariumSetting);

  // Quick toggle handlers
  const handleToggleFOV = useCallback(() => {
    setFovEnabled(!fovEnabled);
  }, [fovEnabled, setFovEnabled]);

  const handleToggleConstellations = useCallback(() => {
    toggleStellariumSetting('constellationsLinesVisible');
  }, [toggleStellariumSetting]);

  const handleToggleGrid = useCallback(() => {
    toggleStellariumSetting('equatorialLinesVisible');
  }, [toggleStellariumSetting]);

  // Zoom presets from shared constants

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-40 sm:hidden",
      "bg-card/95 backdrop-blur-md border-t border-border/50",
      "safe-area-bottom",
      className
    )}>
      {/* Main toolbar */}
      <div className="flex items-center justify-around p-2 gap-1" role="toolbar" aria-label={t('mobileToolbar.toolbar')}>
        {/* Search */}
        <Button
          variant="ghost"
          size="icon"
          className="h-12 w-12 flex-col gap-0.5 text-foreground/80"
          onClick={onOpenSearch}
          aria-label={t('mobileToolbar.search')}
        >
          <Search className="h-5 w-5" />
          <span className="text-[9px]">{t('mobileToolbar.search')}</span>
        </Button>

        {/* Zoom Control */}
        <Drawer open={zoomDrawerOpen} onOpenChange={setZoomDrawerOpen}>
          <DrawerTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12 flex-col gap-0.5 text-foreground/80"
            >
              <ZoomIn className="h-5 w-5" />
              <span className="text-[9px] font-mono">{currentFov < 1 ? currentFov.toFixed(1) : Math.round(currentFov)}°</span>
            </Button>
          </DrawerTrigger>
          <DrawerContent className="max-h-[50vh]">
            <DrawerHeader className="pb-2">
              <DrawerTitle className="text-center">{t('mobileToolbar.zoomControl')}</DrawerTitle>
            </DrawerHeader>
            <div className="p-4 space-y-4">
              {/* Quick zoom buttons */}
              <div className="flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-14 w-14 rounded-full"
                  onClick={() => { onZoomOut?.(); }}
                  aria-label={t('zoom.zoomOut')}
                >
                  <ZoomOut className="h-6 w-6" />
                </Button>
                <div className="text-center px-4">
                  <div className="text-2xl font-mono font-bold">{currentFov < 1 ? currentFov.toFixed(2) : currentFov.toFixed(1)}°</div>
                  <div className="text-xs text-muted-foreground">{t('mobileToolbar.fieldOfView')}</div>
                </div>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-14 w-14 rounded-full"
                  onClick={() => { onZoomIn?.(); }}
                  aria-label={t('zoom.zoomIn')}
                >
                  <ZoomIn className="h-6 w-6" />
                </Button>
              </div>

              {/* Preset buttons */}
              <div className="grid grid-cols-3 gap-2">
                {ZOOM_PRESETS.map((preset) => (
                  <Button
                    key={preset.fov}
                    variant={Math.abs(currentFov - preset.fov) < 1 ? "default" : "outline"}
                    size="sm"
                    className="h-10"
                    onClick={() => {
                      onZoomToFov?.(preset.fov);
                      setZoomDrawerOpen(false);
                    }}
                  >
                    <span className="font-mono mr-1">{preset.fov}°</span>
                    <span className="text-xs text-muted-foreground">{t(`mobileToolbar.${preset.labelKey}`)}</span>
                  </Button>
                ))}
              </div>

              {/* Reset button */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => { onResetView?.(); setZoomDrawerOpen(false); }}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                {t('mobileToolbar.resetView')}
              </Button>
            </div>
          </DrawerContent>
        </Drawer>

        {/* FOV Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-12 w-12 flex-col gap-0.5",
            fovEnabled ? "text-primary" : "text-foreground/80"
          )}
          onClick={handleToggleFOV}
          aria-label={t('mobileToolbar.fov')}
          aria-pressed={fovEnabled}
        >
          <Camera className="h-5 w-5" />
          <span className="text-[9px]">{t('mobileToolbar.fov')}</span>
        </Button>

        {/* Target List */}
        <Button
          variant="ghost"
          size="icon"
          className="h-12 w-12 flex-col gap-0.5 text-foreground/80 relative"
          onClick={onOpenTargetList}
          aria-label={t('mobileToolbar.targets')}
        >
          <List className="h-5 w-5" />
          <span className="text-[9px]">{t('mobileToolbar.targets')}</span>
          {targets.length > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-0.5 -right-0.5 h-4 min-w-4 p-0 text-[9px] flex items-center justify-center"
            >
              {targets.length}
            </Badge>
          )}
        </Button>

        {/* More Menu */}
        <DropdownMenu open={moreMenuOpen} onOpenChange={setMoreMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12 flex-col gap-0.5 text-foreground/80"
            >
              <MoreHorizontal className="h-5 w-5" />
              <span className="text-[9px]">{t('mobileToolbar.more')}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="w-48 mb-2"
            sideOffset={8}
          >
            <DropdownMenuItem onClick={handleToggleConstellations}>
              <Star className={cn("h-4 w-4 mr-2", stellariumSettings.constellationsLinesVisible && "text-primary")} />
              {t('mobileToolbar.constellations')}
              <Switch checked={stellariumSettings.constellationsLinesVisible} className="ml-auto scale-75" tabIndex={-1} />
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleToggleGrid}>
              <Compass className={cn("h-4 w-4 mr-2", stellariumSettings.equatorialLinesVisible && "text-primary")} />
              {t('mobileToolbar.grid')}
              <Switch checked={stellariumSettings.equatorialLinesVisible} className="ml-auto scale-75" tabIndex={-1} />
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => toggleStellariumSetting('dsosVisible')}>
              <Eye className={cn("h-4 w-4 mr-2", stellariumSettings.dsosVisible && "text-primary")} />
              {t('mobileToolbar.deepSky')}
              <Switch checked={stellariumSettings.dsosVisible} className="ml-auto scale-75" tabIndex={-1} />
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toggleStellariumSetting('atmosphereVisible')}>
              <Sun className={cn("h-4 w-4 mr-2", stellariumSettings.atmosphereVisible && "text-primary")} />
              {t('mobileToolbar.atmosphere')}
              <Switch checked={stellariumSettings.atmosphereVisible} className="ml-auto scale-75" tabIndex={-1} />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Optional extra tools slot */}
      {children && (
        <div className="px-2 pb-2">
          {children}
        </div>
      )}
    </div>
  );
}

// Compact zoom control for inline use
export function MobileZoomControl({
  currentFov,
  onZoomIn,
  onZoomOut,
  className,
}: MobileZoomControlProps) {
  const t = useTranslations();
  return (
    <div className={cn(
      "flex items-center gap-1 bg-card/80 backdrop-blur-md rounded-lg border border-border/50 p-1",
      className
    )}>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onZoomOut}
        aria-label={t('zoom.zoomOut')}
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      <span className="text-xs font-mono min-w-[3rem] text-center">
        {currentFov < 1 ? currentFov.toFixed(2) : currentFov.toFixed(1)}°
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onZoomIn}
        aria-label={t('zoom.zoomIn')}
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
    </div>
  );
}
