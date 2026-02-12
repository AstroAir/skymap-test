import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getZustandStorage } from '@/lib/storage';
import { 
  offlineCacheManager, 
  STELLARIUM_LAYERS,
  type CacheStatus, 
  type DownloadProgress 
} from './cache-manager';
import { toast } from 'sonner';

interface OfflineState {
  // Status
  isOnline: boolean;
  isInitialized: boolean;
  
  // Cache status for each layer
  layerStatuses: CacheStatus[];
  
  // Download state
  isDownloading: boolean;
  currentDownloads: Record<string, DownloadProgress>;
  downloadQueue: string[];
  
  // Settings
  autoDownloadOnWifi: boolean;
  
  // Actions
  initialize: () => Promise<void>;
  refreshStatuses: () => Promise<void>;
  downloadLayer: (layerId: string, silent?: boolean) => Promise<boolean>;
  downloadAllLayers: (silent?: boolean) => Promise<void>;
  downloadSelectedLayers: (layerIds: string[], silent?: boolean) => Promise<void>;
  cancelDownload: (layerId: string) => void;
  cancelAllDownloads: () => void;
  clearLayer: (layerId: string) => Promise<boolean>;
  clearAllCache: () => Promise<boolean>;
  setAutoDownloadOnWifi: (enabled: boolean) => void;
  setOnlineStatus: (online: boolean) => void;
}

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set, get) => ({
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      isInitialized: false,
      layerStatuses: [],
      isDownloading: false,
      currentDownloads: {},
      downloadQueue: [],
      autoDownloadOnWifi: false,

      initialize: async () => {
        if (typeof window === 'undefined') return;
        
        // Set up online/offline listeners
        const handleOnline = () => {
          set({ isOnline: true });
          toast.success('Back online', { description: 'Network connection restored' });
        };
        
        const handleOffline = () => {
          set({ isOnline: false });
          toast.warning('Offline mode', { description: 'Using cached data' });
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Initial status check
        await get().refreshStatuses();
        set({ isInitialized: true, isOnline: navigator.onLine });
      },

      refreshStatuses: async () => {
        if (!offlineCacheManager.isAvailable()) {
          set({ layerStatuses: [] });
          return;
        }

        const statuses = await offlineCacheManager.getAllLayerStatus();
        set({ layerStatuses: statuses });
      },

      downloadLayer: async (layerId: string, silent = true) => {
        const state = get();
        const layer = STELLARIUM_LAYERS.find(l => l.id === layerId);
        
        if (!layer) {
          if (!silent) toast.error('Unknown layer');
          return false;
        }

        if (state.currentDownloads[layerId]) {
          if (!silent) toast.info('Already downloading', { description: layer.name });
          return false;
        }

        set((s) => ({
          isDownloading: true,
          currentDownloads: {
            ...s.currentDownloads,
            [layerId]: {
            layerId,
            totalFiles: layer.files.length,
            downloadedFiles: 0,
            totalBytes: layer.size,
            downloadedBytes: 0,
            status: 'pending',
          },
        },
        }));

        // Show download started toast (silent mode shows minimal UI)
        const toastId = silent 
          ? undefined 
          : toast.loading(`Downloading ${layer.name}...`, { duration: Infinity });

        try {
          const success = await offlineCacheManager.downloadLayer(
            layerId,
            (progress) => {
              set((s) => ({
                currentDownloads: {
                  ...s.currentDownloads,
                  [layerId]: progress,
                },
              }));
            }
          );

          // Remove from current downloads
          set((s) => {
            const { [layerId]: removed, ...rest } = s.currentDownloads;
            void removed;
            return {
              currentDownloads: rest,
              isDownloading: Object.keys(rest).length > 0,
            };
          });

          // Refresh statuses
          await get().refreshStatuses();

          // Show completion toast
          if (toastId) toast.dismiss(toastId);
          
          if (success) {
            toast.success(`${layer.name} downloaded`, {
              description: 'Available for offline use',
              duration: 3000,
            });
          } else {
            toast.error(`Failed to download ${layer.name}`);
          }

          return success;
        } catch (error) {
          if (toastId) toast.dismiss(toastId);
          toast.error(`Error downloading ${layer.name}`, {
            description: (error as Error).message,
          });
          
          set((s) => {
            const { [layerId]: removed, ...rest } = s.currentDownloads;
            void removed;
            return {
              currentDownloads: rest,
              isDownloading: Object.keys(rest).length > 0,
            };
          });
          
          return false;
        }
      },

      downloadAllLayers: async (silent = true) => {
        const layerIds = STELLARIUM_LAYERS.map(l => l.id);
        await get().downloadSelectedLayers(layerIds, silent);
      },

      downloadSelectedLayers: async (layerIds: string[]) => {
        const toastId = toast.loading('Downloading resource pack...', {
          description: `0/${layerIds.length} layers`,
          duration: Infinity,
        });

        let completed = 0;
        let failed = 0;

        for (const layerId of layerIds) {
          const layer = STELLARIUM_LAYERS.find(l => l.id === layerId);
          if (!layer) continue;

          toast.loading('Downloading resource pack...', {
            id: toastId,
            description: `${layer.name} (${completed}/${layerIds.length})`,
          });

          const success = await get().downloadLayer(layerId, true);
          if (success) {
            completed++;
          } else {
            failed++;
          }
        }

        toast.dismiss(toastId);

        if (failed === 0) {
          toast.success('Resource pack downloaded', {
            description: `${completed} layers ready for offline use`,
            duration: 5000,
          });
        } else if (completed > 0) {
          toast.warning('Partial download', {
            description: `${completed} succeeded, ${failed} failed`,
            duration: 5000,
          });
        } else {
          toast.error('Download failed', {
            description: 'Could not download resource pack',
          });
        }
      },

      cancelDownload: (layerId: string) => {
        offlineCacheManager.cancelDownload(layerId);
        
        set((s) => {
          const { [layerId]: removed, ...rest } = s.currentDownloads;
          void removed;
          return {
            currentDownloads: rest,
            isDownloading: Object.keys(rest).length > 0,
          };
        });

        toast.info('Download cancelled');
      },

      cancelAllDownloads: () => {
        offlineCacheManager.cancelAllDownloads();
        set({
          currentDownloads: {},
          isDownloading: false,
        });
        toast.info('All downloads cancelled');
      },

      clearLayer: async (layerId: string) => {
        const layer = STELLARIUM_LAYERS.find(l => l.id === layerId);
        const success = await offlineCacheManager.clearLayer(layerId);
        
        if (success) {
          await get().refreshStatuses();
          toast.success(`${layer?.name || layerId} cache cleared`);
        } else {
          toast.error('Failed to clear cache');
        }
        
        return success;
      },

      clearAllCache: async () => {
        const success = await offlineCacheManager.clearAllCache();
        
        if (success) {
          await get().refreshStatuses();
          toast.success('All cache cleared', {
            description: 'Offline data has been removed',
          });
        } else {
          toast.error('Failed to clear cache');
        }
        
        return success;
      },

      setAutoDownloadOnWifi: (enabled: boolean) => {
        set({ autoDownloadOnWifi: enabled });
      },

      setOnlineStatus: (online: boolean) => {
        set({ isOnline: online });
      },
    }),
    {
      name: 'skymap-offline',
      storage: getZustandStorage(),
      partialize: (state) => ({
        autoDownloadOnWifi: state.autoDownloadOnWifi,
      }),
    }
  )
);

// Re-export formatBytes from cache config to avoid duplication
export { formatBytes } from '@/lib/cache/config';

// Helper to get layer info
export function getLayerInfo(layerId: string) {
  return STELLARIUM_LAYERS.find(l => l.id === layerId);
}
