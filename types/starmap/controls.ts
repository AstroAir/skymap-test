/**
 * Type definitions for starmap control components
 * Extracted from components/starmap/controls/ for architectural separation
 */

// ============================================================================
// KeyboardShortcutsManager
// ============================================================================

export interface KeyboardShortcutsManagerProps {
  onToggleSearch?: () => void;
  onToggleSessionPanel?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetView?: () => void;
  onClosePanel?: () => void;
  enabled?: boolean;
}

// ============================================================================
// MobileToolbar
// ============================================================================

export interface MobileToolbarProps {
  onOpenSearch?: () => void;
  onOpenMenu?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetView?: () => void;
  onToggleFOV?: () => void;
  onZoomToFov?: (fov: number) => void;
  onOpenTargetList?: () => void;
  currentFov?: number;
  children?: React.ReactNode;
  className?: string;
}

export interface MobileZoomControlProps {
  currentFov: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  className?: string;
}

// ============================================================================
// NavigationHistory
// ============================================================================

export interface NavigationHistoryProps {
  onNavigate?: (ra: number, dec: number, fov: number) => void;
  className?: string;
}

// ============================================================================
// QuickActionsPanel
// ============================================================================

export interface QuickActionsPanelProps {
  onZoomToFov?: (fov: number) => void;
  onResetView?: () => void;
  className?: string;
}

// ============================================================================
// SidePanel
// ============================================================================

export interface SidePanelProps {
  children?: React.ReactNode;
  className?: string;
  defaultCollapsed?: boolean;
}

export interface ToolButtonProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  badge?: number;
  onClick?: () => void;
  disabled?: boolean;
}

export interface ZoomSectionProps {
  currentFov: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFovChange?: (fov: number) => void;
}

export interface ToolSectionProps {
  children: React.ReactNode;
  title?: string;
}

// ============================================================================
// ViewBookmarks
// ============================================================================

export interface ViewBookmarksProps {
  currentRa: number;
  currentDec: number;
  currentFov: number;
  onNavigate?: (ra: number, dec: number, fov: number) => void;
  className?: string;
}

// ============================================================================
// ZoomControls
// ============================================================================

export interface ZoomControlsProps {
  fov: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFovChange: (fov: number) => void;
}

// ============================================================================
// Shared types
// ============================================================================

/** Celestial reference directions for quick navigation */
export type CelestialDirection = 'NCP' | 'SCP' | 'vernal' | 'autumnal' | 'zenith';

/** Observing conditions summary */
export interface ObservingConditions {
  moonPhaseName: string;
  moonIllumination: number;
  sunAltitude: number;
  isDark: boolean;
  isTwilight: boolean;
  isDay: boolean;
  twilight: {
    civilDusk?: Date;
    nauticalDusk?: Date;
    astronomicalDusk?: Date;
    civilDawn?: Date;
    nauticalDawn?: Date;
    astronomicalDawn?: Date;
  };
}
