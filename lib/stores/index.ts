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

// Theme customization store
export {
  useThemeStore,
  themePresets,
  type ThemeColors,
  type ThemePreset,
  type ThemeCustomization,
} from './theme-store';

// Favorites store
export {
  useFavoritesStore,
  FAVORITE_TAGS,
  type FavoriteObject,
  type FavoriteTag,
} from './favorites-store';

// Bookmarks store
export {
  useBookmarksStore,
  BOOKMARK_ICONS,
  BOOKMARK_COLORS,
  DEFAULT_BOOKMARKS,
  type ViewBookmark,
  type BookmarkIcon,
} from './bookmarks-store';

// Keybinding store
export {
  useKeybindingStore,
  DEFAULT_KEYBINDINGS,
  formatKeyBinding,
  eventToKeyBinding,
  type KeyBinding,
  type ShortcutActionId,
} from './keybinding-store';

// Search store (online/offline, favorites, cache)
export {
  useSearchStore,
  selectSearchSettings,
  selectFavorites,
  selectRecentSearches,
  selectSearchMode,
  selectOnlineStatus,
  favoriteToSearchResult,
  getAllFavoriteTags,
  type SearchFavorite,
  type RecentSearch,
  type SearchSourceConfig,
  type SearchMode as OnlineSearchMode,
  type SearchSettings,
} from './search-store';

// Event sources store
export {
  useEventSourcesStore,
  type EventSourceConfig,
} from './event-sources-store';

// Updater store
export {
  useUpdaterStore,
  selectIsChecking,
  selectIsDownloading,
  selectIsReady,
  selectHasUpdate,
  selectUpdateInfo,
  selectProgress,
  selectError,
  type UpdaterState,
  type UpdaterActions,
  type UpdaterStore,
} from './updater-store';
