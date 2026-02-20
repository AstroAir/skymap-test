'use client';

import { memo, type ComponentProps } from 'react';
import { FOVOverlay } from '../overlays/fov-overlay';
import { OcularOverlay } from '../overlays/ocular-overlay';
import { SkyMarkers } from '../overlays/sky-markers';
import { SatelliteOverlay } from '../overlays/satellite-overlay';

import { useEquipmentStore } from '@/lib/stores';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { useEquipmentFOVRead } from '@/lib/hooks/use-equipment-fov-props';
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
  // Equipment FOV read props — shared hook avoids duplicating selectors
  const { fovSimEnabled: fovEnabled, sensorWidth, sensorHeight, focalLength, mosaic, gridType } = useEquipmentFOVRead();
  const rotationAngle = useEquipmentStore((s) => s.rotationAngle);
  const ocularDisplay = useEquipmentStore((s) => s.ocularDisplay);
  const skyEngine = useSettingsStore((s) => s.skyEngine);

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

      <OcularOverlay
        enabled={ocularDisplay.enabled}
        tfov={ocularDisplay.appliedFov}
        currentFov={currentFov}
        opacity={ocularDisplay.opacity}
        showCrosshair={ocularDisplay.showCrosshair}
      />

      {/* Sky Markers Overlay */}
      {containerBounds && (
        <SkyMarkers
          containerWidth={containerBounds.width}
          containerHeight={containerBounds.height}
          interactionOnly={skyEngine === 'aladin'}
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
