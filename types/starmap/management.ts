/**
 * Type definitions for starmap management components
 * Extracted from components/starmap/management/ for architectural separation
 */

import type { MarkerIcon, SkyMarker } from '@/lib/stores';

// ============================================================================
// DataManager
// ============================================================================

export interface DataManagerProps {
  trigger?: React.ReactNode;
}

// ============================================================================
// EquipmentManager
// ============================================================================

/** Normalized telescope for unified rendering across Tauri/Web environments */
export interface NormalizedTelescope {
  id: string;
  name: string;
  aperture: number;
  focalLength: number;
  focalRatio: number;
  isDefault: boolean;
}

/** Normalized camera for unified rendering across Tauri/Web environments */
export interface NormalizedCamera {
  id: string;
  name: string;
  sensorWidth: number;
  sensorHeight: number;
  isDefault: boolean;
}

export interface EquipmentManagerProps {
  trigger?: React.ReactNode;
}

// ============================================================================
// LocationManager
// ============================================================================

export interface WebLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  altitude: number;
  bortle_class?: number;
  is_default: boolean;
  is_current: boolean;
}

export interface LocationManagerProps {
  trigger?: React.ReactNode;
  onLocationChange?: (lat: number, lon: number, alt: number) => void;
}

// ============================================================================
// MarkerManager
// ============================================================================

export interface MarkerFormData {
  name: string;
  description: string;
  color: string;
  icon: MarkerIcon;
  group: string;
  ra: number;
  dec: number;
  raString: string;
  decString: string;
}

export interface MarkerManagerProps {
  /** Initial coordinates from context menu */
  initialCoords?: { ra: number; dec: number; raStr: string; decStr: string } | null;
  /** Callback when a marker is selected for navigation */
  onNavigateToMarker?: (marker: SkyMarker) => void;
}
