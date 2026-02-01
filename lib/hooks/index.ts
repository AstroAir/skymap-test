/**
 * React Hooks - Custom hooks for the application
 * 
 * Usage:
 * ```typescript
 * import { useGeolocation, useObjectSearch } from '@/lib/hooks';
 * ```
 */

// Device and location hooks
export { 
  useGeolocation,
  getLocationWithFallback,
  type GeolocationState,
  type UseGeolocationOptions,
  type UseGeolocationReturn,
} from './use-geolocation';

export { useOrientation } from './use-orientation';

export { 
  useDeviceOrientation,
  type DeviceOrientation,
  type SkyDirection,
} from './use-device-orientation';

export { useCacheInit } from './use-cache-init';

// Search and object hooks
export { 
  useObjectSearch,
  getDetailedMatch,
  type ObjectType,
  type SortOption,
  type SearchMode,
} from './use-object-search';

export {
  useOnlineSearch,
  type OnlineSearchResultItem,
  type OnlineObjectType,
  type OnlineSortOption,
  type OnlineSearchFilters,
  type OnlineSearchStats,
  type UseOnlineSearchReturn,
} from './use-online-search';

export { 
  useCelestialName,
  useCelestialNames,
  useCelestialNameWithOriginal,
  useSkyCultureLanguage,
  getCelestialNameTranslation,
} from './use-celestial-name';

// Planning hooks
export { 
  useTonightRecommendations,
  type RecommendedTarget,
  type TonightConditions,
  type TwilightInfo,
} from './use-tonight-recommendations';

export { 
  useTargetPlanner,
  type TargetVisibility,
  type SessionPlan,
  type SessionConflict,
  type TargetScheduleSlot,
} from './use-target-planner';

// HTTP client hook (Tauri integration)
export {
  useHttpClient,
  useFetch,
  type UseHttpClientOptions,
  type UseHttpClientReturn,
  type HttpRequestState,
} from './use-http-client';

// Animation and performance hooks
export {
  useAnimationFrame,
  useThrottledUpdate,
  useGlobalAnimationLoop,
  globalAnimationLoop,
  AnimationLoopManager,
  type AnimationFrameOptions,
} from './use-animation-frame';

// Coordinate projection hooks (for overlays)
export {
  useCoordinateProjection,
  useBatchProjection,
  createCoordinateProjector,
  type ScreenPosition,
  type CelestialCoordinate,
  type ProjectedItem,
  type UseCoordinateProjectionOptions,
  type UseCoordinateProjectionReturn,
  type UseBatchProjectionOptions,
} from './use-coordinate-projection';

// Keyboard shortcuts
export {
  useKeyboardShortcuts,
  formatShortcut,
  STARMAP_SHORTCUT_KEYS,
  type KeyboardShortcut,
  type UseKeyboardShortcutsOptions,
} from './use-keyboard-shortcuts';

// Navigation history
export {
  useNavigationHistory,
  useNavigationHistoryStore,
  formatNavigationPoint,
  formatTimestamp,
  type NavigationPoint,
} from './use-navigation-history';

// Window state management (Tauri desktop)
export { useWindowState } from './use-window-state';
