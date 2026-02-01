'use client';

import { memo } from 'react';
import { FOVOverlay } from '../overlays/fov-overlay';
import { SkyMarkers } from '../overlays/sky-markers';
import { SatelliteOverlay } from '../overlays/satellite-overlay';

import type { MosaicSettings, GridType } from '@/lib/stores';
import type { SkyMarker } from '@/lib/stores/marker-store';

interface OverlaysContainerProps {
  containerBounds: { width: number; height: number } | undefined;
  fovEnabled: boolean;
  sensorWidth: number;
  sensorHeight: number;
  focalLength: number;
  currentFov: number;
  rotationAngle: number;
  mosaic: MosaicSettings;
  gridType: GridType;
  onRotationChange: (angle: number) => void;
  onMarkerDoubleClick: (marker: SkyMarker) => void;
  onMarkerEdit: (marker: SkyMarker) => void;
  onMarkerNavigate: (marker: SkyMarker) => void;
}

export const OverlaysContainer = memo(function OverlaysContainer({
  containerBounds,
  fovEnabled,
  sensorWidth,
  sensorHeight,
  focalLength,
  currentFov,
  rotationAngle,
  mosaic,
  gridType,
  onRotationChange,
  onMarkerDoubleClick,
  onMarkerEdit,
  onMarkerNavigate,
}: OverlaysContainerProps) {
  return (
    <>
      {/* FOV Overlay */}
      <FOVOverlay
        enabled={fovEnabled}
        sensorWidth={sensorWidth}
        sensorHeight={sensorHeight}
        focalLength={focalLength}
        currentFov={currentFov}
        rotationAngle={rotationAngle}
        onRotationChange={onRotationChange}
        mosaic={mosaic}
        gridType={gridType}
      />

      {/* Sky Markers Overlay */}
      {containerBounds && (
        <SkyMarkers
          containerWidth={containerBounds.width}
          containerHeight={containerBounds.height}
          onMarkerDoubleClick={onMarkerDoubleClick}
          onMarkerEdit={onMarkerEdit}
          onMarkerNavigate={onMarkerNavigate}
        />
      )}

      {/* Satellite Overlay */}
      {containerBounds && (
        <SatelliteOverlay
          containerWidth={containerBounds.width}
          containerHeight={containerBounds.height}
        />
      )}
    </>
  );
});
OverlaysContainer.displayName = 'OverlaysContainer';
