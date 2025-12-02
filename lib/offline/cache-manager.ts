/**
 * Offline Cache Manager for Stellarium data layers
 * Uses Cache Storage API for offline support
 */

export interface LayerConfig {
  id: string;
  name: string;
  description: string;
  baseUrl: string;
  files: string[];
  size: number; // Estimated size in bytes
  priority: number; // Lower = higher priority
}

export interface DownloadProgress {
  layerId: string;
  totalFiles: number;
  downloadedFiles: number;
  totalBytes: number;
  downloadedBytes: number;
  status: 'pending' | 'downloading' | 'completed' | 'error';
  error?: string;
}

export interface CacheStatus {
  layerId: string;
  cached: boolean;
  cachedFiles: number;
  totalFiles: number;
  cachedBytes: number;
  totalBytes: number;
  lastUpdated?: Date;
}

// Define available layers with their resources
export const STELLARIUM_LAYERS: LayerConfig[] = [
  {
    id: 'core',
    name: 'Core Engine',
    description: 'WebAssembly engine and core scripts',
    baseUrl: '/stellarium-js/',
    files: [
      'stellarium-web-engine.js',
      'stellarium-web-engine.wasm',
    ],
    size: 15 * 1024 * 1024, // ~15MB
    priority: 0,
  },
  {
    id: 'stars',
    name: 'Star Catalog',
    description: 'Basic star catalog data',
    baseUrl: '/stellarium-data/stars/',
    files: [
      'info.json',
      'stars_0.json',
      'stars_1.json',
      'stars_2.json',
    ],
    size: 5 * 1024 * 1024, // ~5MB
    priority: 1,
  },
  {
    id: 'dso',
    name: 'Deep Sky Objects',
    description: 'Galaxies, nebulae, and clusters',
    baseUrl: '/stellarium-data/dso/',
    files: [
      'info.json',
      'dso.json',
    ],
    size: 2 * 1024 * 1024, // ~2MB
    priority: 2,
  },
  {
    id: 'skycultures',
    name: 'Sky Cultures',
    description: 'Constellation lines and names',
    baseUrl: '/stellarium-data/skycultures/western/',
    files: [
      'info.json',
      'constellations.json',
      'star_names.json',
    ],
    size: 500 * 1024, // ~500KB
    priority: 3,
  },
  {
    id: 'planets',
    name: 'Solar System',
    description: 'Planet textures and orbital data',
    baseUrl: '/stellarium-data/surveys/sso/',
    files: [
      'info.json',
      'moon/info.json',
      'sun/info.json',
      'mercury/info.json',
      'venus/info.json',
      'mars/info.json',
      'jupiter/info.json',
      'saturn/info.json',
    ],
    size: 10 * 1024 * 1024, // ~10MB
    priority: 4,
  },
  {
    id: 'dss',
    name: 'DSS Survey',
    description: 'Digital Sky Survey images (basic tiles)',
    baseUrl: '/stellarium-data/surveys/dss/',
    files: [
      'info.json',
      'properties',
    ],
    size: 1 * 1024 * 1024, // ~1MB (just metadata, tiles loaded on demand)
    priority: 5,
  },
  {
    id: 'milkyway',
    name: 'Milky Way',
    description: 'Milky Way panorama',
    baseUrl: '/stellarium-data/surveys/milkyway/',
    files: [
      'info.json',
      'properties',
    ],
    size: 5 * 1024 * 1024, // ~5MB
    priority: 6,
  },
  {
    id: 'comets',
    name: 'Comets & Asteroids',
    description: 'Minor body orbital elements',
    baseUrl: '/stellarium-data/',
    files: [
      'CometEls.txt',
      'mpcorb.dat',
    ],
    size: 20 * 1024 * 1024, // ~20MB
    priority: 7,
  },
];

const CACHE_NAME_PREFIX = 'skymap-offline-';
const CACHE_VERSION = 'v1';

class OfflineCacheManager {
  private downloadAbortControllers: Map<string, AbortController> = new Map();

  /**
   * Get the cache name for a layer
   */
  private getCacheName(layerId: string): string {
    return `${CACHE_NAME_PREFIX}${layerId}-${CACHE_VERSION}`;
  }

  /**
   * Check if Cache API is available
   */
  isAvailable(): boolean {
    return 'caches' in window;
  }

  /**
   * Get cache status for a specific layer
   */
  async getLayerStatus(layerId: string): Promise<CacheStatus> {
    const layer = STELLARIUM_LAYERS.find(l => l.id === layerId);
    if (!layer) {
      return {
        layerId,
        cached: false,
        cachedFiles: 0,
        totalFiles: 0,
        cachedBytes: 0,
        totalBytes: 0,
      };
    }

    if (!this.isAvailable()) {
      return {
        layerId,
        cached: false,
        cachedFiles: 0,
        totalFiles: layer.files.length,
        cachedBytes: 0,
        totalBytes: layer.size,
      };
    }

    try {
      const cache = await caches.open(this.getCacheName(layerId));
      const keys = await cache.keys();
      const cachedFiles = keys.length;
      
      // Estimate cached bytes based on proportion of files
      const cachedBytes = Math.round((cachedFiles / layer.files.length) * layer.size);

      return {
        layerId,
        cached: cachedFiles >= layer.files.length,
        cachedFiles,
        totalFiles: layer.files.length,
        cachedBytes,
        totalBytes: layer.size,
        lastUpdated: cachedFiles > 0 ? new Date() : undefined,
      };
    } catch (error) {
      console.error(`Error getting cache status for ${layerId}:`, error);
      return {
        layerId,
        cached: false,
        cachedFiles: 0,
        totalFiles: layer.files.length,
        cachedBytes: 0,
        totalBytes: layer.size,
      };
    }
  }

  /**
   * Get cache status for all layers
   */
  async getAllLayerStatus(): Promise<CacheStatus[]> {
    const statuses = await Promise.all(
      STELLARIUM_LAYERS.map(layer => this.getLayerStatus(layer.id))
    );
    return statuses;
  }

  /**
   * Download and cache a specific layer
   */
  async downloadLayer(
    layerId: string,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<boolean> {
    const layer = STELLARIUM_LAYERS.find(l => l.id === layerId);
    if (!layer) {
      throw new Error(`Unknown layer: ${layerId}`);
    }

    if (!this.isAvailable()) {
      throw new Error('Cache API not available');
    }

    const abortController = new AbortController();
    this.downloadAbortControllers.set(layerId, abortController);

    const progress: DownloadProgress = {
      layerId,
      totalFiles: layer.files.length,
      downloadedFiles: 0,
      totalBytes: layer.size,
      downloadedBytes: 0,
      status: 'downloading',
    };

    onProgress?.(progress);

    try {
      const cache = await caches.open(this.getCacheName(layerId));

      for (const file of layer.files) {
        if (abortController.signal.aborted) {
          progress.status = 'error';
          progress.error = 'Download cancelled';
          onProgress?.(progress);
          return false;
        }

        const url = layer.baseUrl + file;
        
        try {
          const response = await fetch(url, {
            signal: abortController.signal,
          });

          if (!response.ok) {
            console.warn(`Failed to fetch ${url}: ${response.status}`);
            continue;
          }

          // Clone the response before caching
          await cache.put(url, response.clone());

          progress.downloadedFiles++;
          progress.downloadedBytes = Math.round(
            (progress.downloadedFiles / progress.totalFiles) * progress.totalBytes
          );
          onProgress?.(progress);
        } catch (fetchError) {
          if ((fetchError as Error).name === 'AbortError') {
            progress.status = 'error';
            progress.error = 'Download cancelled';
            onProgress?.(progress);
            return false;
          }
          console.warn(`Error fetching ${url}:`, fetchError);
        }
      }

      progress.status = 'completed';
      onProgress?.(progress);
      
      this.downloadAbortControllers.delete(layerId);
      return true;
    } catch (error) {
      progress.status = 'error';
      progress.error = (error as Error).message;
      onProgress?.(progress);
      this.downloadAbortControllers.delete(layerId);
      return false;
    }
  }

  /**
   * Download multiple layers
   */
  async downloadLayers(
    layerIds: string[],
    onProgress?: (layerId: string, progress: DownloadProgress) => void
  ): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();

    // Sort by priority
    const sortedIds = [...layerIds].sort((a, b) => {
      const layerA = STELLARIUM_LAYERS.find(l => l.id === a);
      const layerB = STELLARIUM_LAYERS.find(l => l.id === b);
      return (layerA?.priority ?? 999) - (layerB?.priority ?? 999);
    });

    for (const layerId of sortedIds) {
      const success = await this.downloadLayer(layerId, (progress) => {
        onProgress?.(layerId, progress);
      });
      results.set(layerId, success);
    }

    return results;
  }

  /**
   * Download all available layers
   */
  async downloadAllLayers(
    onProgress?: (layerId: string, progress: DownloadProgress) => void
  ): Promise<Map<string, boolean>> {
    const allLayerIds = STELLARIUM_LAYERS.map(l => l.id);
    return this.downloadLayers(allLayerIds, onProgress);
  }

  /**
   * Cancel an ongoing download
   */
  cancelDownload(layerId: string): void {
    const controller = this.downloadAbortControllers.get(layerId);
    if (controller) {
      controller.abort();
      this.downloadAbortControllers.delete(layerId);
    }
  }

  /**
   * Cancel all ongoing downloads
   */
  cancelAllDownloads(): void {
    for (const [layerId, controller] of this.downloadAbortControllers) {
      controller.abort();
      this.downloadAbortControllers.delete(layerId);
    }
  }

  /**
   * Clear cache for a specific layer
   */
  async clearLayer(layerId: string): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      const deleted = await caches.delete(this.getCacheName(layerId));
      return deleted;
    } catch (error) {
      console.error(`Error clearing cache for ${layerId}:`, error);
      return false;
    }
  }

  /**
   * Clear all cached data
   */
  async clearAllCache(): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      const cacheNames = await caches.keys();
      const skymapCaches = cacheNames.filter(name => 
        name.startsWith(CACHE_NAME_PREFIX)
      );

      await Promise.all(skymapCaches.map(name => caches.delete(name)));
      return true;
    } catch (error) {
      console.error('Error clearing all caches:', error);
      return false;
    }
  }

  /**
   * Get total cache size estimate
   */
  async getTotalCacheSize(): Promise<number> {
    if (!this.isAvailable()) return 0;

    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return estimate.usage || 0;
      }
      return 0;
    } catch {
      return 0;
    }
  }

  /**
   * Check if we're online
   */
  isOnline(): boolean {
    return navigator.onLine;
  }

  /**
   * Get a cached response or fetch from network
   */
  async getResource(url: string): Promise<Response | null> {
    if (!this.isAvailable()) {
      return fetch(url);
    }

    // Try to find in any cache
    const cacheNames = await caches.keys();
    const skymapCaches = cacheNames.filter(name => 
      name.startsWith(CACHE_NAME_PREFIX)
    );

    for (const cacheName of skymapCaches) {
      const cache = await caches.open(cacheName);
      const response = await cache.match(url);
      if (response) {
        return response;
      }
    }

    // Not in cache, try network
    if (this.isOnline()) {
      try {
        return await fetch(url);
      } catch {
        return null;
      }
    }

    return null;
  }
}

// Singleton instance
export const offlineCacheManager = new OfflineCacheManager();
