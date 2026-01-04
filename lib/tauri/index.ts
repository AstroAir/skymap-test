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
