/**
 * @jest-environment jsdom
 */
import { formatBytes, getLayerInfo, useOfflineStore } from '../offline-store';
import { STELLARIUM_LAYERS, offlineCacheManager } from '../cache-manager';
import { toast } from 'sonner';
import { act } from '@testing-library/react';

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
    loading: jest.fn(() => 'toast-id'),
    dismiss: jest.fn(),
  },
}));

// Mock cache-manager type for assertions
type _MockManager = {
  isAvailable: jest.Mock;
  getAllLayerStatus: jest.Mock;
  downloadLayer: jest.Mock;
  cancelDownload: jest.Mock;
  cancelAllDownloads: jest.Mock;
  clearLayer: jest.Mock;
  clearAllCache: jest.Mock;
};

jest.mock('../cache-manager', () => ({
  offlineCacheManager: {
    isAvailable: jest.fn(() => true),
    getAllLayerStatus: jest.fn(() => Promise.resolve([])),
    downloadLayer: jest.fn((_id: string, onProgress?: (p: unknown) => void) => {
      onProgress?.({ layerId: _id, status: 'completed', downloadedFiles: 1, totalFiles: 1, downloadedBytes: 100, totalBytes: 100 });
      return Promise.resolve(true);
    }),
    cancelDownload: jest.fn(),
    cancelAllDownloads: jest.fn(),
    clearLayer: jest.fn(() => Promise.resolve(true)),
    clearAllCache: jest.fn(() => Promise.resolve(true)),
  },
  STELLARIUM_LAYERS: [
    { id: 'core', name: 'Core Engine', files: ['a.js', 'b.wasm'], size: 1000, priority: 0 },
    { id: 'stars', name: 'Star Catalog', files: ['s.json'], size: 2000, priority: 1 },
  ],
}));

// Get the mocked module functions for assertions
const mockedManager = offlineCacheManager as unknown as _MockManager;

describe('formatBytes', () => {
  it('formats 0 bytes', () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  it('formats bytes', () => {
    expect(formatBytes(500)).toBe('500 B');
  });

  it('formats kilobytes', () => {
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
  });

  it('formats megabytes', () => {
    expect(formatBytes(1024 * 1024)).toBe('1 MB');
    expect(formatBytes(1.5 * 1024 * 1024)).toBe('1.5 MB');
  });

  it('formats gigabytes', () => {
    expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
    expect(formatBytes(2.5 * 1024 * 1024 * 1024)).toBe('2.5 GB');
  });

  it('is re-exported from cache config', () => {
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(1000)).toBe('1000 B');
  });
});

describe('getLayerInfo', () => {
  it('returns layer info for valid layer id', () => {
    const layer = getLayerInfo('core');
    expect(layer).toBeDefined();
    expect(layer?.id).toBe('core');
    expect(layer?.name).toBe('Core Engine');
  });

  it('returns undefined for invalid layer id', () => {
    const layer = getLayerInfo('nonexistent');
    expect(layer).toBeUndefined();
  });

  it('returns correct layer for stars', () => {
    const layer = getLayerInfo('stars');
    expect(layer).toBeDefined();
    expect(layer?.name).toBe('Star Catalog');
  });
});

describe('STELLARIUM_LAYERS', () => {
  it('is an array', () => {
    expect(Array.isArray(STELLARIUM_LAYERS)).toBe(true);
  });

  it('has at least one layer', () => {
    expect(STELLARIUM_LAYERS.length).toBeGreaterThan(0);
  });
});

describe('useOfflineStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state
    useOfflineStore.setState({
      isOnline: true,
      isInitialized: false,
      layerStatuses: [],
      isDownloading: false,
      currentDownloads: {},
      downloadQueue: [],
      autoDownloadOnWifi: false,
    });
    // Reset mocks to defaults
    mockedManager.isAvailable.mockReturnValue(true);
    mockedManager.getAllLayerStatus.mockResolvedValue([]);
    mockedManager.downloadLayer.mockImplementation((_id: string, onProgress?: (p: unknown) => void) => {
      onProgress?.({ layerId: _id, status: 'completed', downloadedFiles: 1, totalFiles: 1, downloadedBytes: 100, totalBytes: 100 });
      return Promise.resolve(true);
    });
    mockedManager.clearLayer.mockResolvedValue(true);
    mockedManager.clearAllCache.mockResolvedValue(true);
  });

  describe('setOnlineStatus', () => {
    it('sets online status', () => {
      const store = useOfflineStore.getState();
      store.setOnlineStatus(false);
      expect(useOfflineStore.getState().isOnline).toBe(false);
      store.setOnlineStatus(true);
      expect(useOfflineStore.getState().isOnline).toBe(true);
    });
  });

  describe('setAutoDownloadOnWifi', () => {
    it('sets autoDownloadOnWifi', () => {
      const store = useOfflineStore.getState();
      store.setAutoDownloadOnWifi(true);
      expect(useOfflineStore.getState().autoDownloadOnWifi).toBe(true);
      store.setAutoDownloadOnWifi(false);
      expect(useOfflineStore.getState().autoDownloadOnWifi).toBe(false);
    });
  });

  describe('refreshStatuses', () => {
    it('fetches and sets layer statuses when cache is available', async () => {
      const mockStatuses = [
        { layerId: 'core', cached: true, cachedFiles: 2, totalFiles: 2, cachedBytes: 1000, totalBytes: 1000, isComplete: true },
      ];
      mockedManager.getAllLayerStatus.mockResolvedValue(mockStatuses);

      await act(async () => {
        await useOfflineStore.getState().refreshStatuses();
      });

      expect(useOfflineStore.getState().layerStatuses).toEqual(mockStatuses);
    });

    it('sets empty statuses when cache is not available', async () => {
      mockedManager.isAvailable.mockReturnValue(false);

      await act(async () => {
        await useOfflineStore.getState().refreshStatuses();
      });

      expect(useOfflineStore.getState().layerStatuses).toEqual([]);
    });
  });

  describe('downloadLayer', () => {
    it('downloads a layer successfully with non-silent mode', async () => {
      let result: boolean = false;
      await act(async () => {
        result = await useOfflineStore.getState().downloadLayer('core', false);
      });

      expect(result).toBe(true);
      expect(mockedManager.downloadLayer).toHaveBeenCalledWith('core', expect.any(Function));
      expect(toast.success).toHaveBeenCalled();
    });

    it('downloads a layer successfully in silent mode', async () => {
      let result: boolean = false;
      await act(async () => {
        result = await useOfflineStore.getState().downloadLayer('core', true);
      });

      expect(result).toBe(true);
      expect(mockedManager.downloadLayer).toHaveBeenCalled();
    });

    it('returns false for unknown layer', async () => {
      let result: boolean = true;
      await act(async () => {
        result = await useOfflineStore.getState().downloadLayer('nonexistent', false);
      });

      expect(result).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('Unknown layer');
    });

    it('returns false if already downloading', async () => {
      useOfflineStore.setState({
        currentDownloads: {
          core: { layerId: 'core', status: 'downloading', totalFiles: 2, downloadedFiles: 0, totalBytes: 1000, downloadedBytes: 0 },
        },
      });

      let result: boolean = true;
      await act(async () => {
        result = await useOfflineStore.getState().downloadLayer('core', false);
      });

      expect(result).toBe(false);
      expect(toast.info).toHaveBeenCalled();
    });

    it('handles download failure', async () => {
      mockedManager.downloadLayer.mockImplementation((_id: string, onProgress?: (p: unknown) => void) => {
        onProgress?.({ layerId: _id, status: 'error', downloadedFiles: 0, totalFiles: 1, downloadedBytes: 0, totalBytes: 100, error: 'fail' });
        return Promise.resolve(false);
      });

      let result: boolean = true;
      await act(async () => {
        result = await useOfflineStore.getState().downloadLayer('core', false);
      });

      expect(result).toBe(false);
      expect(toast.error).toHaveBeenCalled();
    });

    it('handles download exception', async () => {
      mockedManager.downloadLayer.mockRejectedValue(new Error('network error'));

      let result: boolean = true;
      await act(async () => {
        result = await useOfflineStore.getState().downloadLayer('core', false);
      });

      expect(result).toBe(false);
      expect(toast.error).toHaveBeenCalled();
      // currentDownloads should be cleaned up
      expect(useOfflineStore.getState().currentDownloads).not.toHaveProperty('core');
    });
  });

  describe('downloadAllLayers', () => {
    it('downloads all layers', async () => {
      await act(async () => {
        await useOfflineStore.getState().downloadAllLayers(true);
      });

      expect(mockedManager.downloadLayer).toHaveBeenCalledTimes(STELLARIUM_LAYERS.length);
    });
  });

  describe('downloadSelectedLayers', () => {
    it('downloads selected layers and shows success', async () => {
      await act(async () => {
        await useOfflineStore.getState().downloadSelectedLayers(['core', 'stars']);
      });

      expect(mockedManager.downloadLayer).toHaveBeenCalledTimes(2);
      expect(toast.dismiss).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalled();
    });

    it('shows warning for partial failure', async () => {
      mockedManager.downloadLayer
        .mockImplementationOnce((_id: string, onProgress?: (p: unknown) => void) => {
          onProgress?.({ layerId: _id, status: 'completed' });
          return Promise.resolve(true);
        })
        .mockImplementationOnce((_id: string, onProgress?: (p: unknown) => void) => {
          onProgress?.({ layerId: _id, status: 'error' });
          return Promise.resolve(false);
        });

      await act(async () => {
        await useOfflineStore.getState().downloadSelectedLayers(['core', 'stars']);
      });

      expect(toast.warning).toHaveBeenCalled();
    });

    it('shows error when all layers fail', async () => {
      mockedManager.downloadLayer.mockImplementation((_id: string, onProgress?: (p: unknown) => void) => {
        onProgress?.({ layerId: _id, status: 'error' });
        return Promise.resolve(false);
      });

      await act(async () => {
        await useOfflineStore.getState().downloadSelectedLayers(['core', 'stars']);
      });

      expect(toast.error).toHaveBeenCalled();
    });

    it('skips unknown layers', async () => {
      await act(async () => {
        await useOfflineStore.getState().downloadSelectedLayers(['nonexistent']);
      });

      // Should still dismiss the toast
      expect(toast.dismiss).toHaveBeenCalled();
    });
  });

  describe('cancelDownload', () => {
    it('cancels a download and updates state', () => {
      useOfflineStore.setState({
        isDownloading: true,
        currentDownloads: {
          core: { layerId: 'core', status: 'downloading', totalFiles: 2, downloadedFiles: 0, totalBytes: 1000, downloadedBytes: 0 },
        },
      });

      act(() => {
        useOfflineStore.getState().cancelDownload('core');
      });

      expect(mockedManager.cancelDownload).toHaveBeenCalledWith('core');
      expect(useOfflineStore.getState().currentDownloads).not.toHaveProperty('core');
      expect(useOfflineStore.getState().isDownloading).toBe(false);
      expect(toast.info).toHaveBeenCalledWith('Download cancelled');
    });
  });

  describe('cancelAllDownloads', () => {
    it('cancels all downloads and resets state', () => {
      useOfflineStore.setState({
        isDownloading: true,
        currentDownloads: {
          core: { layerId: 'core', status: 'downloading', totalFiles: 2, downloadedFiles: 0, totalBytes: 1000, downloadedBytes: 0 },
          stars: { layerId: 'stars', status: 'downloading', totalFiles: 1, downloadedFiles: 0, totalBytes: 2000, downloadedBytes: 0 },
        },
      });

      act(() => {
        useOfflineStore.getState().cancelAllDownloads();
      });

      expect(mockedManager.cancelAllDownloads).toHaveBeenCalled();
      expect(useOfflineStore.getState().currentDownloads).toEqual({});
      expect(useOfflineStore.getState().isDownloading).toBe(false);
      expect(toast.info).toHaveBeenCalledWith('All downloads cancelled');
    });
  });

  describe('clearLayer', () => {
    it('clears layer cache and refreshes statuses', async () => {
      let result: boolean = false;
      await act(async () => {
        result = await useOfflineStore.getState().clearLayer('core');
      });

      expect(result).toBe(true);
      expect(mockedManager.clearLayer).toHaveBeenCalledWith('core');
      expect(toast.success).toHaveBeenCalled();
    });

    it('shows error when clear fails', async () => {
      mockedManager.clearLayer.mockResolvedValue(false);

      let result: boolean = true;
      await act(async () => {
        result = await useOfflineStore.getState().clearLayer('core');
      });

      expect(result).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('Failed to clear cache');
    });
  });

  describe('clearAllCache', () => {
    it('clears all cache and refreshes statuses', async () => {
      let result: boolean = false;
      await act(async () => {
        result = await useOfflineStore.getState().clearAllCache();
      });

      expect(result).toBe(true);
      expect(mockedManager.clearAllCache).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalled();
    });

    it('shows error when clear fails', async () => {
      mockedManager.clearAllCache.mockResolvedValue(false);

      let result: boolean = true;
      await act(async () => {
        result = await useOfflineStore.getState().clearAllCache();
      });

      expect(result).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('Failed to clear cache');
    });
  });

  describe('initialize', () => {
    it('initializes the store with online/offline listeners', async () => {
      const addEventSpy = jest.spyOn(window, 'addEventListener');

      await act(async () => {
        await useOfflineStore.getState().initialize();
      });

      expect(useOfflineStore.getState().isInitialized).toBe(true);
      expect(addEventSpy).toHaveBeenCalledWith('online', expect.any(Function));
      expect(addEventSpy).toHaveBeenCalledWith('offline', expect.any(Function));

      addEventSpy.mockRestore();
    });
  });
});
