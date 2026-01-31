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
import { PlateSolver } from '../plate-solving/plate-solver';
import { SkyAtlasPanel } from '../planning/sky-atlas-panel';
import { EquipmentManager } from '../management/equipment-manager';

import type { SelectedObjectData } from '@/lib/core/types';
import type { MosaicSettings, GridType } from '@/lib/stores';

interface ClickCoords {
  ra: number;
  dec: number;
  raStr: string;
  decStr: string;
}

interface MobileLayoutProps {
  stel: boolean;
  currentFov: number;
  selectedObject: SelectedObjectData | null;
  contextMenuCoords: ClickCoords | null;
  fovSimEnabled: boolean;
  sensorWidth: number;
  sensorHeight: number;
  focalLength: number;
  mosaic: MosaicSettings;
  gridType: GridType;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFovSliderChange: (fov: number) => void;
  onFovSimEnabledChange: (enabled: boolean) => void;
  onSensorWidthChange: (width: number) => void;
  onSensorHeightChange: (height: number) => void;
  onFocalLengthChange: (length: number) => void;
  onMosaicChange: (mosaic: MosaicSettings) => void;
  onGridTypeChange: (type: GridType) => void;
  onLocationChange: (lat: number, lon: number, alt: number) => void;
  onGoToCoordinates: (ra: number, dec: number) => void;
}

export const MobileLayout = memo(function MobileLayout({
  stel,
  currentFov,
  selectedObject,
  contextMenuCoords,
  fovSimEnabled,
  sensorWidth,
  sensorHeight,
  focalLength,
  mosaic,
  gridType,
  onZoomIn,
  onZoomOut,
  onFovSliderChange,
  onFovSimEnabledChange,
  onSensorWidthChange,
  onSensorHeightChange,
  onFocalLengthChange,
  onMosaicChange,
  onGridTypeChange,
  onLocationChange,
  onGoToCoordinates,
}: MobileLayoutProps) {
  // Build current selection data for ShotList and ObservationLog
  const currentSelection = selectedObject ? {
    name: selectedObject.names[0] || 'Unknown',
    ra: selectedObject.raDeg,
    dec: selectedObject.decDeg,
    raString: selectedObject.ra,
    decString: selectedObject.dec,
  } : null;

  const observationSelection = selectedObject ? {
    ...currentSelection!,
    type: selectedObject.type,
    constellation: selectedObject.constellation,
  } : null;

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
            onEnabledChange={onFovSimEnabledChange}
            sensorWidth={sensorWidth}
            sensorHeight={sensorHeight}
            focalLength={focalLength}
            onSensorWidthChange={onSensorWidthChange}
            onSensorHeightChange={onSensorHeightChange}
            onFocalLengthChange={onFocalLengthChange}
            mosaic={mosaic}
            onMosaicChange={onMosaicChange}
            gridType={gridType}
            onGridTypeChange={onGridTypeChange}
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
          {stel && <StellariumMount />}
          <PlateSolver onGoToCoordinates={onGoToCoordinates} />
          <SkyAtlasPanel />
          <EquipmentManager />
        </div>
      </div>
    </>
  );
});
MobileLayout.displayName = 'MobileLayout';
