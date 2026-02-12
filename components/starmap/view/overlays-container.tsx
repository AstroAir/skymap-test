'use client';

import { memo, type ComponentProps } from 'react';
import { FOVOverlay } from '../overlays/fov-overlay';
import { SkyMarkers } from '../overlays/sky-markers';
import { SatelliteOverlay } from '../overlays/satellite-overlay';

import { useEquipmentStore } from '@/lib/stores';
import type { SkyMarker } from '@/lib/stores/marker-store';

/**
 * Wrapper that reads fovDisplay settings from equipment-store
 * and passes them as props to FOVOverlay.
 */
function FOVOverlayConnected(props: Omit<ComponentProps<typeof FOVOverlay>, 'frameColor' | 'frameStyle' | 'overlayOpacity' | 'pixelSize'>) {
  const frameColor = useEquipmentStore((s) => s.fovDisplay.frameColor);
  const frameStyle = useEquipmentStore((s) => s.fovDisplay.frameStyle);
  const overlayOpacity = useEquipmentStore((s) => s.fovDisplay.overlayOpacity);
  const pixelSize = useEquipmentStore((s) => s.pixelSize);

  return (
    <FOVOverlay
      {...props}
      frameColor={frameColor}
      frameStyle={frameStyle}
      overlayOpacity={overlayOpacity}
      pixelSize={pixelSize}
    />
  );
}

interface OverlaysContainerProps {
  containerBounds: { width: number; height: number } | undefined;
  currentFov: number;
  onRotationChange: (angle: number) => void;
  onMarkerDoubleClick: (marker: SkyMarker) => void;
  onMarkerEdit: (marker: SkyMarker) => void;
  onMarkerNavigate: (marker: SkyMarker) => void;
}

export const OverlaysContainer = memo(function OverlaysContainer({
  containerBounds,
  currentFov,
  onRotationChange,
  onMarkerDoubleClick,
  onMarkerEdit,
  onMarkerNavigate,
}: OverlaysContainerProps) {
  // Subscribe directly to equipment store — avoids prop drilling through orchestrator
  const fovEnabled = useEquipmentStore((s) => s.fovDisplay.enabled);
  const sensorWidth = useEquipmentStore((s) => s.sensorWidth);
  const sensorHeight = useEquipmentStore((s) => s.sensorHeight);
  const focalLength = useEquipmentStore((s) => s.focalLength);
  const rotationAngle = useEquipmentStore((s) => s.rotationAngle);
  const mosaic = useEquipmentStore((s) => s.mosaic);
  const gridType = useEquipmentStore((s) => s.fovDisplay.gridType);

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
