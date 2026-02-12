'use client';

import React, { memo, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';

import { ZoomControls } from '../controls/zoom-controls';
import { FOVSimulator } from '../overlays/fov-simulator';
import { ExposureCalculator } from '../planning/exposure-calculator';
import { ShotList } from '../planning/shot-list';
import { ObservationLog } from '../planning/observation-log';
import { MarkerManager } from '../management/marker-manager';
import { LocationManager } from '../management/location-manager';
import { StellariumMount } from '../mount/stellarium-mount';
import { AstroSessionPanel } from '../planning/astro-session-panel';

import { useEquipmentStore } from '@/lib/stores';
import { buildSelectionData } from '@/lib/core/selection-utils';
import type { RightControlPanelProps } from '@/types/starmap/view';

export const RightControlPanel = memo(function RightControlPanel({
  stel,
  currentFov,
  selectedObject,
  showSessionPanel,
  contextMenuCoords,
  onZoomIn,
  onZoomOut,
  onFovSliderChange,
  onLocationChange,
}: RightControlPanelProps) {
  const t = useTranslations();
  const { currentSelection, observationSelection } = buildSelectionData(selectedObject);

  // Subscribe to equipment store directly — avoids prop drilling
  const fovSimEnabled = useEquipmentStore((s) => s.fovDisplay.enabled);
  const setFovSimEnabled = useEquipmentStore((s) => s.setFOVEnabled);
  const sensorWidth = useEquipmentStore((s) => s.sensorWidth);
  const sensorHeight = useEquipmentStore((s) => s.sensorHeight);
  const focalLength = useEquipmentStore((s) => s.focalLength);
  const mosaic = useEquipmentStore((s) => s.mosaic);
  const gridType = useEquipmentStore((s) => s.fovDisplay.gridType);
  const setSensorWidth = useEquipmentStore((s) => s.setSensorWidth);
  const setSensorHeight = useEquipmentStore((s) => s.setSensorHeight);
  const setFocalLength = useEquipmentStore((s) => s.setFocalLength);
  const setMosaic = useEquipmentStore((s) => s.setMosaic);
  const setGridType = useEquipmentStore((s) => s.setGridType);

  const [collapsed, setCollapsed] = useState(false);
  const toggleCollapsed = useCallback(() => setCollapsed(prev => !prev), []);

  return (
    <>
      {/* Right Side Controls - Desktop Only - Vertically Centered */}
      <div className="hidden sm:flex items-center absolute right-3 top-1/2 -translate-y-1/2 z-30 pointer-events-auto animate-fade-in">
        {/* Collapse Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 mr-1 bg-card/60 backdrop-blur-md border border-border/50 rounded-full shrink-0"
              onClick={toggleCollapsed}
              aria-label={collapsed ? t('sidePanel.expand') : t('sidePanel.collapse')}
            >
              {collapsed ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>{collapsed ? t('sidePanel.expand') : t('sidePanel.collapse')}</p>
          </TooltipContent>
        </Tooltip>

        {/* Panel Content - slides right when collapsed */}
        <div className={cn(
          "transition-all duration-300 ease-out",
          collapsed && "translate-x-[calc(100%+16px)] opacity-0 pointer-events-none"
        )}>
        <ScrollArea className="max-h-[calc(100vh-160px)] overscroll-contain">
        <div className="flex flex-col items-center gap-1.5 py-1.5 w-[52px]">
          {/* Zoom Controls */}
          <div className="bg-card/80 backdrop-blur-md rounded-lg border border-border/50 w-full" data-tour-id="zoom-controls">
            <ZoomControls
              fov={currentFov}
              onZoomIn={onZoomIn}
              onZoomOut={onZoomOut}
              onFovChange={onFovSliderChange}
            />
          </div>

          {/* Tool Buttons - Vertical */}
          <div className="flex flex-col items-center gap-0.5 bg-card/80 backdrop-blur-md rounded-lg border border-border/50 p-0.5 w-full">
            <MarkerManager initialCoords={contextMenuCoords} />
            <Tooltip>
              <TooltipTrigger asChild>
                <LocationManager
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-foreground/80 hover:text-foreground hover:bg-accent h-8 w-8"
                    >
                      <MapPin className="h-4 w-4" />
                    </Button>
                  }
                  onLocationChange={onLocationChange}
                />
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>{t('locations.title')}</p>
              </TooltipContent>
            </Tooltip>
            <div data-tour-id="fov-button">
              <FOVSimulator
                enabled={fovSimEnabled}
                onEnabledChange={setFovSimEnabled}
                sensorWidth={sensorWidth}
                sensorHeight={sensorHeight}
                focalLength={focalLength}
                onSensorWidthChange={setSensorWidth}
                onSensorHeightChange={setSensorHeight}
                onFocalLengthChange={setFocalLength}
                mosaic={mosaic}
                onMosaicChange={setMosaic}
                gridType={gridType}
                onGridTypeChange={setGridType}
              />
            </div>
            <ExposureCalculator focalLength={focalLength} />
            <div data-tour-id="shotlist-button">
              <ShotList currentSelection={currentSelection} />
            </div>
            <ObservationLog currentSelection={observationSelection} />
          </div>

          {/* Mount Controls */}
          {stel && (
            <div className="bg-card/80 backdrop-blur-md rounded-lg border border-border/50 w-full">
              <StellariumMount />
            </div>
          )}
        </div>
        </ScrollArea>
        </div>
      </div>

      {/* Floating Astro Session Panel - Show conditions for selected object */}
      {selectedObject && showSessionPanel && (
        <div className={cn(
          "hidden sm:block absolute top-20 pointer-events-auto animate-in fade-in slide-in-from-right-4 duration-300",
          collapsed ? "right-10" : "right-[72px]"
        )}>
          <ScrollArea className="max-h-[calc(100vh-180px)]">
          <div className="bg-card/90 backdrop-blur-md rounded-lg border border-border/50 p-3 w-[300px] shadow-lg">
            <AstroSessionPanel
              selectedRa={selectedObject.raDeg}
              selectedDec={selectedObject.decDeg}
              selectedName={selectedObject.names[0]}
            />
          </div>
          </ScrollArea>
        </div>
      )}
    </>
  );
});
RightControlPanel.displayName = 'RightControlPanel';
