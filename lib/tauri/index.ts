/**
 * Tauri module exports
 * Provides TypeScript types and API wrappers for Rust backend
 */

export * from './types';
export * from './api';
export * from './hooks';
export * from './astronomy-api';
export * from './cache-api';
export * from './events-api';
export * from './target-list-api';
export * from './markers-api';
export { storageApi } from './storage-api';
export { unifiedCacheApi } from './unified-cache-api';
export { tauriApi as default } from './api';

// Re-export individual APIs for convenience
export { astronomyApi } from './astronomy-api';
export { cacheApi } from './cache-api';
export { eventsApi } from './events-api';
export { targetListApi } from './target-list-api';
export { markersApi } from './markers-api';
export { TauriSyncProvider } from './TauriSyncProvider';

// HTTP Client API
export { httpApi } from './http-api';
export type {
  HttpClientConfig,
  RequestConfig,
  HttpResponse,
  DownloadProgress,
  BatchDownloadResult,
  BatchItemResult,
} from './http-api';
export {
  responseToString,
  responseToJson,
  responseToBytes,
  responseToBlob,
  generateRequestId,
  fetchJson,
  fetchText,
  fetchBytes,
  downloadWithProgress,
  postJson,
} from './http-api';

// Geolocation API (mobile only)
export { geolocationApi } from './geolocation-api';
export type { 
  Position, 
  PositionOptions, 
  PermissionState, 
  PermissionStatus, 
  WatchId 
} from './geolocation-api';

// Updater API (desktop only)
export * from './updater-api';
export type {
  UpdateInfo,
  UpdateProgress,
  UpdateStatus,
  UpdateCheckOptions,
} from './updater-api';

// Updater Hooks
export { useUpdater, useAutoUpdater } from './updater-hooks';
export type { UseUpdaterOptions, UseUpdaterReturn } from './updater-hooks';

// App Control API (desktop only)
export {
  isTauri,
  restartApp,
  quitApp,
  reloadWebview,
  isDevMode,
  closeWindow,
  minimizeWindow,
  toggleMaximizeWindow,
  isWindowMaximized,
} from './app-control-api';

// Mount API (desktop only)
export { mountApi } from './mount-api';
export type {
  MountState as TauriMountState,
  MountCapabilities as TauriMountCapabilities,
  ConnectionConfig as TauriConnectionConfig,
  TrackingRate as TauriTrackingRate,
  PierSide as TauriPierSide,
  MountAxis as TauriMountAxis,
  DiscoveredDevice,
  SlewRatePreset,
} from './mount-api';
export { SLEW_RATE_PRESETS, DEFAULT_CONNECTION_CONFIG } from './mount-api';

// Path Config API (desktop only)
export { pathConfigApi } from './path-config-api';
export type {
  PathInfo,
  DirectoryValidation,
  MigrationResult,
} from './path-config-api';

// Plate Solver API (desktop only)
export { plateSolverApi } from './plate-solver-api';
export type {
  SolverType,
  SolverInfo,
  SolverConfig,
  SolveParameters,
  SolveResult,
  IndexInfo,
  ScaleRange,
  DownloadableIndex,
  DownloadProgress as IndexDownloadProgress,
} from './plate-solver-api';
export {
  detectPlateSolvers,
  getSolverInfo,
  validateSolverPath,
  solveImageLocal,
  getAvailableIndexes,
  getInstalledIndexes,
  deleteIndex,
  getRecommendedIndexes,
  getDefaultIndexPath,
  saveSolverConfig,
  loadSolverConfig,
  formatFileSize,
  getSolverDisplayName,
  isLocalSolver,
  convertToLegacyResult,
  DEFAULT_SOLVER_CONFIG,
  // Legacy API
  plateSolve,
  getSolverIndexes,
  getDownloadableIndexes,
  downloadIndex,
} from './plate-solver-api';
export type {
  LegacySolverType,
  LegacyPlateSolverConfig,
  LegacyPlateSolveResult,
  LegacyAstrometryIndex,
  LegacyDownloadableIndex,
} from './plate-solver-api';
