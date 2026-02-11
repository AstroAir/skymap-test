'use client';

import React, { memo } from 'react';
import { useTranslations } from 'next-intl';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
import type { SelectedObjectData, ClickCoords } from '@/lib/core/types';
import { buildSelectionData } from './selection-utils';

interface RightControlPanelProps {
  stel: boolean;
  currentFov: number;
  selectedObject: SelectedObjectData | null;
  showSessionPanel: boolean;
  contextMenuCoords: ClickCoords | null;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFovSliderChange: (fov: number) => void;
  onLocationChange: (lat: number, lon: number, alt: number) => void;
}

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

  return (
    <>
      {/* Right Side Controls - Desktop Only - Vertically Centered */}
      <div className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 flex-col items-center gap-2 pointer-events-auto animate-slide-in-right max-h-[calc(100vh-160px)] overflow-y-auto scrollbar-hide py-2 overscroll-contain">
        {/* Zoom Controls */}
        <div className="bg-card/80 backdrop-blur-md rounded-lg border border-border/50 w-[72px]" data-tour-id="zoom-controls">
          <ZoomControls
            fov={currentFov}
            onZoomIn={onZoomIn}
            onZoomOut={onZoomOut}
            onFovChange={onFovSliderChange}
          />
        </div>

        {/* Tool Buttons - Vertical */}
        <div className="flex flex-col items-center gap-1 bg-card/80 backdrop-blur-md rounded-lg border border-border/50 p-1 w-[72px]">
          <MarkerManager initialCoords={contextMenuCoords} />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <LocationManager
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-foreground/80 hover:text-foreground hover:bg-accent h-9 w-9"
                    >
                      <MapPin className="h-4 w-4" />
                    </Button>
                  }
                  onLocationChange={onLocationChange}
                />
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>{t('locations.title') || 'Observation Locations'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
          <div className="bg-card/80 backdrop-blur-md rounded-lg border border-border/50">
            <StellariumMount />
          </div>
        )}
      </div>

      {/* Floating Astro Session Panel - Show conditions for selected object */}
      {selectedObject && showSessionPanel && (
        <div className="hidden sm:block absolute right-[90px] top-20 pointer-events-auto animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="bg-card/90 backdrop-blur-md rounded-lg border border-border/50 p-3 w-[300px] max-h-[calc(100vh-180px)] overflow-y-auto scrollbar-hide shadow-lg">
            <AstroSessionPanel
              selectedRa={selectedObject.raDeg}
              selectedDec={selectedObject.decDeg}
              selectedName={selectedObject.names[0]}
            />
          </div>
        </div>
      )}
    </>
  );
});
RightControlPanel.displayName = 'RightControlPanel';
