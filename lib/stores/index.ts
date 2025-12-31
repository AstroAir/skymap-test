/**
 * Zustand Stores - Centralized state management
 * 
 * Usage:
 * ```typescript
 * import { useStellariumStore, useSettingsStore } from '@/lib/stores';
 * ```
 */

// Core stores
export { useStellariumStore } from './stellarium-store';
export { useSettingsStore } from './settings-store';
export { useFramingStore } from './framing-store';
export { useMountStore } from './mount-store';

// Target and marker stores
export { 
  useTargetListStore, 
  type TargetItem,
  type TargetInput,
  type ObservableWindow,
} from './target-list-store';

export { 
  useMarkerStore, 
  type SkyMarker, 
  type MarkerIcon, 
  type MarkerInput,
  type PendingMarkerCoords, 
  MARKER_COLORS, 
  MARKER_ICONS 
} from './marker-store';

// Satellite store
export { 
  useSatelliteStore, 
  type TrackedSatellite 
} from './satellite-store';

// Equipment store with presets and helpers
export {
  useEquipmentStore,
  BUILTIN_CAMERA_PRESETS,
  BUILTIN_TELESCOPE_PRESETS,
  getAllCameras,
  getAllTelescopes,
  findCameraById,
  findTelescopeById,
  type CameraPreset,
  type TelescopePreset,
  type MosaicSettings,
  type GridType,
  type BinningType,
  type TrackingType,
  type TargetType,
  type FOVDisplaySettings,
  type ExposureDefaults,
} from './equipment-store';

// Onboarding store
export {
  useOnboardingStore,
  TOUR_STEPS,
  type TourStep,
} from './onboarding-store';

// Setup wizard store
export {
  useSetupWizardStore,
  SETUP_WIZARD_STEPS,
  type SetupWizardStep,
} from './setup-wizard-store';
