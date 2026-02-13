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
