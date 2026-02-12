'use client';

import { memo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  Copy,
  Crosshair,
  MapPin,
  Plus,
  Target,
  Compass,
  ZoomIn,
  ZoomOut,
  Camera,
  RotateCw,
  Grid3X3,
  Settings,
  Search,
  RotateCcw,
  Navigation,
} from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuShortcut,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { useStellariumStore } from '@/lib/stores';
import { degreesToHMS, degreesToDMS, rad2deg } from '@/lib/astronomy/starmap-utils';
import type { CanvasContextMenuProps } from '@/types/starmap/view';

export const CanvasContextMenu = memo(function CanvasContextMenu({
  open,
  position,
  coords,
  selectedObject,
  mountConnected,
  fovSimEnabled,
  mosaic,
  stellariumSettings,
  onOpenChange,
  onAddToTargetList,
  onNavigateToCoords,
  onOpenGoToDialog,
  onSetPendingMarkerCoords,
  onSetFramingCoordinates,
  onZoomIn,
  onZoomOut,
  onSetFov,
  onSetFovSimEnabled,
  onSetRotationAngle,
  onSetMosaic,
  onToggleStellariumSetting,
  onToggleSearch,
  onResetView,
}: CanvasContextMenuProps) {
  const t = useTranslations();

  // Copy view center coordinates
  const handleCopyViewCenter = useCallback(() => {
    const getCurrentViewDirection = useStellariumStore.getState().getCurrentViewDirection;
    if (getCurrentViewDirection) {
      const dir = getCurrentViewDirection();
      const ra = rad2deg(dir.ra);
      const dec = rad2deg(dir.dec);
      const raStr = degreesToHMS(((ra % 360) + 360) % 360);
      const decStr = degreesToDMS(dec);
      navigator.clipboard.writeText(`${raStr} ${decStr}`);
    }
    onOpenChange(false);
  }, [onOpenChange]);

  // Copy click position
  const handleCopyClickPosition = useCallback(() => {
    if (coords) {
      navigator.clipboard.writeText(`${coords.raStr} ${coords.decStr}`);
    }
    onOpenChange(false);
  }, [coords, onOpenChange]);

  // Copy object coordinates
  const handleCopyObjectCoordinates = useCallback(() => {
    if (selectedObject) {
      navigator.clipboard.writeText(`${selectedObject.ra} ${selectedObject.dec}`);
    }
    onOpenChange(false);
  }, [selectedObject, onOpenChange]);

  // Slew to object
  const handleSlewToObject = useCallback(() => {
    if (selectedObject) {
      onSetFramingCoordinates({
        ra: selectedObject.raDeg,
        dec: selectedObject.decDeg,
        raString: selectedObject.ra,
        decString: selectedObject.dec,
        name: selectedObject.names[0] || '',
      });
    }
    onOpenChange(false);
  }, [selectedObject, onSetFramingCoordinates, onOpenChange]);

  // Add marker here
  const handleAddMarkerHere = useCallback(() => {
    if (coords) {
      onSetPendingMarkerCoords({
        ra: coords.ra,
        dec: coords.dec,
        raString: coords.raStr,
        decString: coords.decStr,
      });
    }
    onOpenChange(false);
  }, [coords, onSetPendingMarkerCoords, onOpenChange]);

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      {/* Invisible trigger positioned at click location */}
      <DropdownMenuTrigger asChild>
        <div
          className="fixed w-0 h-0 pointer-events-none"
          style={{
            left: position.x,
            top: position.y,
          }}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-64 bg-card border-border"
        align="start"
      >
        {/* Click Position Info */}
        {coords && (
          <>
            <div className="px-2 py-1.5 text-xs text-muted-foreground">
              <div className="font-medium text-foreground mb-1">{t('coordinates.clickPosition')}</div>
              <div className="font-mono">{t('coordinates.ra')}: {coords.raStr}</div>
              <div className="font-mono">{t('coordinates.dec')}: {coords.decStr}</div>
            </div>
            <DropdownMenuSeparator className="bg-border" />
          </>
        )}

        {/* Selected Object Actions */}
        {selectedObject && (
          <>
            <div className="px-2 py-1.5 text-xs">
              <div className="font-medium text-primary truncate">{selectedObject.names[0]}</div>
            </div>
            <DropdownMenuItem
              onClick={handleCopyObjectCoordinates}
              className="text-foreground"
            >
              <Copy className="h-4 w-4 mr-2" />
              {t('coordinates.copyObjectCoordinates')}
              <DropdownMenuShortcut>Ctrl+C</DropdownMenuShortcut>
            </DropdownMenuItem>
            {mountConnected && (
              <DropdownMenuItem
                onClick={handleSlewToObject}
                className="text-foreground"
              >
                <Navigation className="h-4 w-4 mr-2" />
                {t('actions.slewToObject')}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator className="bg-border" />
          </>
        )}

        {/* Add to Target List */}
        <DropdownMenuItem
          onClick={() => {
            onAddToTargetList();
            onOpenChange(false);
          }}
          disabled={!coords && !selectedObject}
          className="text-foreground"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('actions.addToTargetList')}
        </DropdownMenuItem>

        {/* Add Marker Here */}
        {coords && (
          <DropdownMenuItem
            onClick={handleAddMarkerHere}
            className="text-foreground"
          >
            <MapPin className="h-4 w-4 mr-2" />
            {t('markers.addMarkerHere')}
          </DropdownMenuItem>
        )}

        {/* Center View on Click */}
        {coords && (
          <DropdownMenuItem
            onClick={() => {
              onNavigateToCoords();
              onOpenChange(false);
            }}
            className="text-foreground"
          >
            <Target className="h-4 w-4 mr-2" />
            {t('actions.centerViewHere')}
          </DropdownMenuItem>
        )}

        {/* Go to Coordinates */}
        <DropdownMenuItem
          onClick={onOpenGoToDialog}
          className="text-foreground"
        >
          <Compass className="h-4 w-4 mr-2" />
          {t('coordinates.goToCoordinates')}
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-border" />

        {/* Zoom Controls */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="text-foreground">
            <ZoomIn className="h-4 w-4 mr-2" />
            {t('zoom.zoom')}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="bg-card border-border">
            <DropdownMenuItem onClick={() => { onZoomIn(); onOpenChange(false); }} className="text-foreground">
              <ZoomIn className="h-4 w-4 mr-2" />
              {t('zoom.zoomIn')}
              <DropdownMenuShortcut>+</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { onZoomOut(); onOpenChange(false); }} className="text-foreground">
              <ZoomOut className="h-4 w-4 mr-2" />
              {t('zoom.zoomOut')}
              <DropdownMenuShortcut>-</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem onClick={() => { onSetFov(1); onOpenChange(false); }} className="text-foreground">
              {t('zoom.fovPreset', { value: 1 })}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { onSetFov(5); onOpenChange(false); }} className="text-foreground">
              {t('zoom.fovPreset', { value: 5 })}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { onSetFov(15); onOpenChange(false); }} className="text-foreground">
              {t('zoom.fovPreset', { value: 15 })}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { onSetFov(30); onOpenChange(false); }} className="text-foreground">
              {t('zoom.fovPreset', { value: 30 })}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { onSetFov(60); onOpenChange(false); }} className="text-foreground">
              {t('zoom.fovPreset', { value: 60 })} ({t('zoom.default')})
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { onSetFov(90); onOpenChange(false); }} className="text-foreground">
              {t('zoom.fovPreset', { value: 90 })}
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* FOV Overlay */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="text-foreground">
            <Camera className="h-4 w-4 mr-2" />
            {t('fov.fovOverlay')}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="bg-card border-border">
            <DropdownMenuCheckboxItem
              checked={fovSimEnabled}
              onCheckedChange={onSetFovSimEnabled}
              className="text-foreground"
            >
              {t('fov.showFovOverlay')}
            </DropdownMenuCheckboxItem>
            {fovSimEnabled && (
              <>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem
                  onClick={() => { onSetRotationAngle(0); onOpenChange(false); }}
                  className="text-foreground"
                >
                  <RotateCw className="h-4 w-4 mr-2" />
                  {t('fov.resetRotation')}
                </DropdownMenuItem>
                <DropdownMenuCheckboxItem
                  checked={mosaic.enabled}
                  onCheckedChange={(checked: boolean) => onSetMosaic({ ...mosaic, enabled: checked })}
                  className="text-foreground"
                >
                  <Grid3X3 className="h-4 w-4 mr-2" />
                  {t('fov.enableMosaic')}
                </DropdownMenuCheckboxItem>
              </>
            )}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator className="bg-border" />

        {/* Display Settings */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="text-foreground">
            <Settings className="h-4 w-4 mr-2" />
            {t('settings.display')}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="bg-card border-border w-48">
            <DropdownMenuCheckboxItem
              checked={stellariumSettings.constellationsLinesVisible}
              onCheckedChange={() => onToggleStellariumSetting('constellationsLinesVisible')}
              className="text-foreground"
            >
              {t('settings.constellationLines')}
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={stellariumSettings.equatorialLinesVisible}
              onCheckedChange={() => onToggleStellariumSetting('equatorialLinesVisible')}
              className="text-foreground"
            >
              {t('settings.equatorialGrid')}
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={stellariumSettings.azimuthalLinesVisible}
              onCheckedChange={() => onToggleStellariumSetting('azimuthalLinesVisible')}
              className="text-foreground"
            >
              {t('settings.azimuthalGrid')}
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={stellariumSettings.dsosVisible}
              onCheckedChange={() => onToggleStellariumSetting('dsosVisible')}
              className="text-foreground"
            >
              {t('settings.deepSkyObjects')}
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuCheckboxItem
              checked={stellariumSettings.surveyEnabled}
              onCheckedChange={() => onToggleStellariumSetting('surveyEnabled')}
              className="text-foreground"
            >
              {t('settings.skySurveys')}
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={stellariumSettings.atmosphereVisible}
              onCheckedChange={() => onToggleStellariumSetting('atmosphereVisible')}
              className="text-foreground"
            >
              {t('settings.atmosphere')}
            </DropdownMenuCheckboxItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator className="bg-border" />

        {/* Coordinates */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="text-foreground">
            <MapPin className="h-4 w-4 mr-2" />
            {t('coordinates.coordinates')}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="bg-card border-border">
            {coords && (
              <DropdownMenuItem
                onClick={handleCopyClickPosition}
                className="text-foreground"
              >
                <Copy className="h-4 w-4 mr-2" />
                {t('coordinates.copyClickPosition')}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={handleCopyViewCenter}
              className="text-foreground"
            >
              <Crosshair className="h-4 w-4 mr-2" />
              {t('coordinates.copyViewCenter')}
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator className="bg-border" />

        {/* Search */}
        <DropdownMenuItem
          onClick={() => {
            onToggleSearch();
            onOpenChange(false);
          }}
          className="text-foreground"
        >
          <Search className="h-4 w-4 mr-2" />
          {t('starmap.searchObjects')}
          <DropdownMenuShortcut>Ctrl+F</DropdownMenuShortcut>
        </DropdownMenuItem>

        {/* Reset View */}
        <DropdownMenuItem onClick={() => { onResetView(); onOpenChange(false); }} className="text-foreground">
          <RotateCcw className="h-4 w-4 mr-2" />
          {t('starmap.resetView')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
CanvasContextMenu.displayName = 'CanvasContextMenu';
