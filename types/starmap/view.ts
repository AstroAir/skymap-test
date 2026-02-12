/**
 * Type definitions for starmap view components
 * Extracted from components/starmap/view/ for architectural separation
 */

import type { SelectedObjectData, ClickCoords } from '@/lib/core/types';
import type { StellariumSettings as FullStellariumSettings } from '@/lib/core/types/stellarium';
import type { MosaicSettings, GridType } from '@/lib/stores';
import type { SkyMarker } from '@/lib/stores/marker-store';

// ============================================================================
// Selection Types (shared between RightControlPanel and MobileLayout)
// ============================================================================

export interface CurrentSelection {
  name: string;
  ra: number;
  dec: number;
  raString: string;
  decString: string;
}

export interface ObservationSelection extends CurrentSelection {
  type?: string;
  constellation?: string;
}

// ============================================================================
// TopToolbar
// ============================================================================

export interface TopToolbarProps {
  stel: boolean;
  isSearchOpen: boolean;
  showSessionPanel: boolean;
  viewCenterRaDec: { ra: number; dec: number };
  currentFov: number;
  onToggleSearch: () => void;
  onToggleSessionPanel: () => void;
  onResetView: () => void;
  onCloseStarmapClick: () => void;
  onSetFov: (fov: number) => void;
  onNavigate: (ra: number, dec: number, fov: number) => void;
  onGoToCoordinates: (ra: number, dec: number) => void;
}

// ============================================================================
// CanvasContextMenu
// ============================================================================

/**
 * Subset of StellariumSettings used by the context menu display toggles
 */
export type ContextMenuStellariumSettings = Pick<FullStellariumSettings,
  'constellationsLinesVisible' | 'equatorialLinesVisible' | 'azimuthalLinesVisible' |
  'dsosVisible' | 'surveyEnabled' | 'atmosphereVisible'
>;

export interface CanvasContextMenuProps {
  open: boolean;
  position: { x: number; y: number };
  coords: ClickCoords | null;
  selectedObject: SelectedObjectData | null;
  mountConnected: boolean;
  fovSimEnabled: boolean;
  mosaic: MosaicSettings;
  stellariumSettings: ContextMenuStellariumSettings;
  onOpenChange: (open: boolean) => void;
  onAddToTargetList: () => void;
  onNavigateToCoords: () => void;
  onOpenGoToDialog: () => void;
  onSetPendingMarkerCoords: (coords: { ra: number; dec: number; raString: string; decString: string }) => void;
  onSetFramingCoordinates: (data: { ra: number; dec: number; raString: string; decString: string; name: string }) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onSetFov: (fov: number) => void;
  onSetFovSimEnabled: (enabled: boolean) => void;
  onSetRotationAngle: (angle: number) => void;
  onSetMosaic: (mosaic: MosaicSettings) => void;
  onToggleStellariumSetting: (key: keyof ContextMenuStellariumSettings) => void;
  onToggleSearch: () => void;
  onResetView: () => void;
}

// ============================================================================
// BottomStatusBar
// ============================================================================

export interface BottomStatusBarProps {
  currentFov: number;
}

// ============================================================================
// RightControlPanel
// ============================================================================

export interface RightControlPanelProps {
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

// ============================================================================
// MobileLayout
// ============================================================================

export interface MobileLayoutProps {
  stel: boolean;
  currentFov: number;
  selectedObject: SelectedObjectData | null;
  contextMenuCoords: ClickCoords | null;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFovSliderChange: (fov: number) => void;
  onLocationChange: (lat: number, lon: number, alt: number) => void;
  onGoToCoordinates: (ra: number, dec: number) => void;
}

// ============================================================================
// OverlaysContainer
// ============================================================================

export interface OverlaysContainerProps {
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

// ============================================================================
// GoToCoordinatesDialog
// ============================================================================

export interface GoToCoordinatesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (ra: number, dec: number) => void;
}

// ============================================================================
// CloseConfirmDialog
// ============================================================================

export interface CloseConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (dontShowAgain: boolean) => void;
}

// ============================================================================
// SearchPanel
// ============================================================================

export interface SearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: () => void;
}
