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

// Object information service
export {
  getObjectDetailedInfo,
  enhanceObjectInfo,
  getCachedObjectInfo,
  updateCachedObjectInfo,
  clearObjectInfoCache,
  getConstellation,
  parseObjectType,
  formatAngularSize,
  getObjectDescription,
  getDSSImageUrl,
  getSkyViewImageUrl,
  getAladinPreviewUrl,
  getSimbadUrl,
  getWikipediaUrl,
  generateObjectImages,
} from './object-info-service';
export type { ObjectDetailedInfo, ObjectImage } from './object-info-service';

// Clipboard service
export * from './clipboard-service';

// AR optimization packs
export * from './ar-optimization-pack-service';
