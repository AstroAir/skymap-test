'use client';

import { memo, type ComponentProps } from 'react';
import { FOVOverlay } from '../overlays/fov-overlay';
import { SkyMarkers } from '../overlays/sky-markers';
import { SatelliteOverlay } from '../overlays/satellite-overlay';

import { useEquipmentStore, type MosaicSettings, type GridType } from '@/lib/stores';
import type { SkyMarker } from '@/lib/stores/marker-store';

/**
 * Wrapper that reads fovDisplay settings from equipment-store
 * and passes them as props to FOVOverlay.
 */
function FOVOverlayConnected(props: Omit<ComponentProps<typeof FOVOverlay>, 'frameColor' | 'frameStyle' | 'overlayOpacity'>) {
  const frameColor = useEquipmentStore((s) => s.fovDisplay.frameColor);
  const frameStyle = useEquipmentStore((s) => s.fovDisplay.frameStyle);
  const overlayOpacity = useEquipmentStore((s) => s.fovDisplay.overlayOpacity);

  return (
    <FOVOverlay
      {...props}
      frameColor={frameColor}
      frameStyle={frameStyle}
      overlayOpacity={overlayOpacity}
    />
  );
}

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
      <FOVOverlayConnected
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
