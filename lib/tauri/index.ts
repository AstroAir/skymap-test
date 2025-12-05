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
export { tauriApi as default } from './api';

// Re-export individual APIs for convenience
export { astronomyApi } from './astronomy-api';
export { cacheApi } from './cache-api';
export { eventsApi } from './events-api';
export { targetListApi } from './target-list-api';
export { markersApi } from './markers-api';
export { TauriSyncProvider } from './TauriSyncProvider';
