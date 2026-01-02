/**
 * Services module - External data integration
 * 
 * This module provides services for fetching and managing
 * external astronomical data sources.
 */

// HTTP fetch utility (smart Tauri/browser switching)
export {
  smartFetch,
  cancelRequest,
  cancelAllRequests,
  checkUrl,
  batchDownload,
  httpFetch,
} from './http-fetch';
export type {
  FetchOptions,
  FetchResponse,
  DownloadProgress,
} from './http-fetch';

// Astronomical events
export * from './astro-events';

// Satellite tracking
export * from './satellite';

// HiPS surveys
export * from './hips';

// Object information
export * from './object-info';
