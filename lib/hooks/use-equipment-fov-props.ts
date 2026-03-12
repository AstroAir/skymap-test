import { useEquipmentStore } from '@/lib/stores';
import type { MosaicSettings, GridType } from '@/lib/stores/equipment-store';

/**
 * Shared hook for FOV-related equipment store subscriptions.
 * Used by RightControlPanel, MobileLayout, OverlaysContainer, and CanvasContextMenu
 * to avoid duplicating 12+ individual store selectors.
 */

export interface EquipmentFOVReadProps {
  fovSimEnabled: boolean;
  sensorWidth: number;
  sensorHeight: number;
  focalLength: number;
  pixelSize: number;
  rotationAngle: number;
  mosaic: MosaicSettings;
  gridType: GridType;
}

export interface EquipmentFOVWriteProps {
  setFovSimEnabled: (enabled: boolean) => void;
  setSensorWidth: (width: number) => void;
  setSensorHeight: (height: number) => void;
  setFocalLength: (length: number) => void;
  setPixelSize: (size: number) => void;
  setMosaic: (mosaic: MosaicSettings) => void;
  setGridType: (type: GridType) => void;
  setRotationAngle: (angle: number) => void;
}

export type EquipmentFOVProps = EquipmentFOVReadProps & EquipmentFOVWriteProps;

/** Read-only FOV equipment values (for display-only components like OverlaysContainer) */
export function useEquipmentFOVRead(): EquipmentFOVReadProps {
  const fovSimEnabled = useEquipmentStore((s) => s.fovDisplay.enabled);
  const sensorWidth = useEquipmentStore((s) => s.sensorWidth);
  const sensorHeight = useEquipmentStore((s) => s.sensorHeight);
  const focalLength = useEquipmentStore((s) => s.focalLength);
  const pixelSize = useEquipmentStore((s) => s.pixelSize);
  const rotationAngle = useEquipmentStore((s) => s.rotationAngle);
  const mosaic = useEquipmentStore((s) => s.mosaic);
  const gridType = useEquipmentStore((s) => s.fovDisplay.gridType);

  return { fovSimEnabled, sensorWidth, sensorHeight, focalLength, pixelSize, rotationAngle, mosaic, gridType };
}

/** Full read+write FOV equipment values (for interactive components like FOVSimulator settings) */
export function useEquipmentFOVProps(): EquipmentFOVProps {
  const read = useEquipmentFOVRead();

  const setFovSimEnabled = useEquipmentStore((s) => s.setFOVEnabled);
  const setSensorWidth = useEquipmentStore((s) => s.setSensorWidth);
  const setSensorHeight = useEquipmentStore((s) => s.setSensorHeight);
  const setFocalLength = useEquipmentStore((s) => s.setFocalLength);
  const setPixelSize = useEquipmentStore((s) => s.setPixelSize);
  const setMosaic = useEquipmentStore((s) => s.setMosaic);
  const setGridType = useEquipmentStore((s) => s.setGridType);
  const setRotationAngle = useEquipmentStore((s) => s.setRotationAngle);

  return {
    ...read,
    setFovSimEnabled,
    setSensorWidth,
    setSensorHeight,
    setFocalLength,
    setPixelSize,
    setMosaic,
    setGridType,
    setRotationAngle,
  };
}
