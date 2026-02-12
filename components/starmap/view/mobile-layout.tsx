'use client';

import { memo } from 'react';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { ZoomControls } from '../controls/zoom-controls';
import { FOVSimulator } from '../overlays/fov-simulator';
import { ExposureCalculator } from '../planning/exposure-calculator';
import { ShotList } from '../planning/shot-list';
import { ObservationLog } from '../planning/observation-log';
import { MarkerManager } from '../management/marker-manager';
import { LocationManager } from '../management/location-manager';
import { StellariumMount } from '../mount/stellarium-mount';
import { PlateSolverUnified } from '../plate-solving/plate-solver-unified';
import { SkyAtlasPanel } from '../planning/sky-atlas-panel';
import { EquipmentManager } from '../management/equipment-manager';

import { useEquipmentStore } from '@/lib/stores';
import { buildSelectionData } from '@/lib/core/selection-utils';
import type { MobileLayoutProps } from '@/types/starmap/view';

export const MobileLayout = memo(function MobileLayout({
  stel,
  currentFov,
  selectedObject,
  contextMenuCoords,
  onZoomIn,
  onZoomOut,
  onFovSliderChange,
  onLocationChange,
  onGoToCoordinates,
}: MobileLayoutProps) {
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
      {/* Mobile Controls - Bottom Right Corner */}
      <div className="sm:hidden absolute right-2 bottom-16 flex flex-col items-center gap-1 pointer-events-auto animate-slide-in-right">
        {/* Compact Zoom */}
        <div className="bg-card/80 backdrop-blur-md rounded-lg border border-border/50">
          <ZoomControls
            fov={currentFov}
            onZoomIn={onZoomIn}
            onZoomOut={onZoomOut}
            onFovChange={onFovSliderChange}
          />
        </div>
      </div>

      {/* Mobile Bottom Tools Bar - Simplified and organized */}
      <div className="sm:hidden absolute bottom-16 left-2 right-16 flex items-center gap-0.5 bg-card/90 backdrop-blur-md rounded-lg border border-border/50 p-1 pointer-events-auto overflow-x-auto scrollbar-hide animate-slide-in-left">
        {/* Primary Tools */}
        <div className="flex items-center gap-0.5 shrink-0">
          <MarkerManager initialCoords={contextMenuCoords} />
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
        </div>
        
        {/* Divider */}
        <div className="w-px h-6 bg-border/50 mx-0.5 shrink-0" />
        
        {/* Imaging Tools */}
        <div className="flex items-center gap-0.5 shrink-0">
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
          <ExposureCalculator focalLength={focalLength} />
        </div>
        
        {/* Divider */}
        <div className="w-px h-6 bg-border/50 mx-0.5 shrink-0" />
        
        {/* Planning Tools */}
        <div className="flex items-center gap-0.5 shrink-0">
          <ShotList currentSelection={currentSelection} />
          <ObservationLog currentSelection={observationSelection} />
        </div>
        
        {/* Divider */}
        <div className="w-px h-6 bg-border/50 mx-0.5 shrink-0" />
        
        {/* Mount & Advanced */}
        <div className="flex items-center gap-0.5 shrink-0">
          {stel && <StellariumMount compact />}
          <PlateSolverUnified onGoToCoordinates={onGoToCoordinates} />
          <SkyAtlasPanel />
          <EquipmentManager />
        </div>
      </div>
    </>
  );
});
MobileLayout.displayName = 'MobileLayout';
