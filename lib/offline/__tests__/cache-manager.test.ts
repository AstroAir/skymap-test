/**
 * @jest-environment jsdom
 */
import { STELLARIUM_LAYERS, offlineCacheManager } from '../cache-manager';

// Mock Cache API
const mockCache = {
  match: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  keys: jest.fn(() => Promise.resolve([])),
};

const mockCaches = {
  open: jest.fn(() => Promise.resolve(mockCache)),
  delete: jest.fn(() => Promise.resolve(true)),
  keys: jest.fn(() => Promise.resolve([])),
  has: jest.fn(() => Promise.resolve(false)),
  match: jest.fn(),
};

Object.defineProperty(global, 'caches', {
  value: mockCaches,
  writable: true,
});

// Mock navigator.storage
Object.defineProperty(navigator, 'storage', {
  value: {
    estimate: jest.fn(() => Promise.resolve({ usage: 0, quota: 1000000000 })),
  },
  writable: true,
});

describe('STELLARIUM_LAYERS', () => {
  it('contains core layer', () => {
    const coreLayer = STELLARIUM_LAYERS.find(l => l.id === 'core');
    expect(coreLayer).toBeDefined();
    expect(coreLayer?.name).toBe('Core Engine');
  });

  it('contains stars layer', () => {
    const starsLayer = STELLARIUM_LAYERS.find(l => l.id === 'stars');
    expect(starsLayer).toBeDefined();
    expect(starsLayer?.name).toBe('Star Catalog');
  });

  it('contains dso layer', () => {
    const dsoLayer = STELLARIUM_LAYERS.find(l => l.id === 'dso');
    expect(dsoLayer).toBeDefined();
    expect(dsoLayer?.name).toBe('Deep Sky Objects');
  });

  it('contains skycultures layer', () => {
    const skyculturesLayer = STELLARIUM_LAYERS.find(l => l.id === 'skycultures');
    expect(skyculturesLayer).toBeDefined();
    expect(skyculturesLayer?.name).toBe('Sky Cultures');
  });

  it('contains planets layer', () => {
    const planetsLayer = STELLARIUM_LAYERS.find(l => l.id === 'planets');
    expect(planetsLayer).toBeDefined();
    expect(planetsLayer?.name).toBe('Solar System');
  });

  it('all layers have required properties', () => {
    STELLARIUM_LAYERS.forEach(layer => {
      expect(layer).toHaveProperty('id');
      expect(layer).toHaveProperty('name');
      expect(layer).toHaveProperty('description');
      expect(layer).toHaveProperty('baseUrl');
      expect(layer).toHaveProperty('files');
      expect(layer).toHaveProperty('size');
      expect(layer).toHaveProperty('priority');
      expect(Array.isArray(layer.files)).toBe(true);
      expect(typeof layer.size).toBe('number');
      expect(typeof layer.priority).toBe('number');
    });
  });

  it('layers are sorted by priority', () => {
    for (let i = 1; i < STELLARIUM_LAYERS.length; i++) {
      expect(STELLARIUM_LAYERS[i].priority).toBeGreaterThanOrEqual(
        STELLARIUM_LAYERS[i - 1].priority
      );
    }
  });
});

describe('offlineCacheManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isAvailable', () => {
    it('returns true when caches API is available', () => {
      expect(offlineCacheManager.isAvailable()).toBe(true);
    });

    it('checks window.caches availability', () => {
      // The isAvailable method checks 'caches' in window
      // Since we mocked caches globally, it should return true
      expect(offlineCacheManager.isAvailable()).toBe(true);
    });
  });

  describe('getLayerStatus', () => {
    it('returns status for valid layer', async () => {
      const status = await offlineCacheManager.getLayerStatus('core');
      expect(status).toHaveProperty('layerId', 'core');
      expect(status).toHaveProperty('cached');
      expect(status).toHaveProperty('cachedFiles');
      expect(status).toHaveProperty('totalFiles');
    });

    it('returns empty status for invalid layer', async () => {
      const status = await offlineCacheManager.getLayerStatus('nonexistent');
      expect(status.layerId).toBe('nonexistent');
      expect(status.cached).toBe(false);
      expect(status.totalFiles).toBe(0);
    });
  });

  describe('getStorageInfo', () => {
    it('returns storage information', async () => {
      const info = await offlineCacheManager.getStorageInfo();
      expect(info).toHaveProperty('used');
      expect(info).toHaveProperty('quota');
      expect(info).toHaveProperty('available');
      expect(info).toHaveProperty('usagePercent');
    });
  });

  describe('getAllLayerStatus', () => {
    it('returns status for all layers', async () => {
      const statuses = await offlineCacheManager.getAllLayerStatus();
      expect(Array.isArray(statuses)).toBe(true);
      expect(statuses.length).toBe(STELLARIUM_LAYERS.length);
    });
  });
});
