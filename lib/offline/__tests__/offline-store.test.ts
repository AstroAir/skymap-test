/**
 * @jest-environment jsdom
 */
import { formatBytes, getLayerInfo } from '../offline-store';
import { STELLARIUM_LAYERS } from '../cache-manager';

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

// Mock cache-manager
jest.mock('../cache-manager', () => ({
  offlineCacheManager: {
    isAvailable: jest.fn(() => true),
    getAllLayerStatus: jest.fn(() => Promise.resolve([])),
    downloadLayer: jest.fn(() => Promise.resolve(true)),
    cancelDownload: jest.fn(),
    cancelAllDownloads: jest.fn(),
    clearLayer: jest.fn(() => Promise.resolve(true)),
    clearAllCache: jest.fn(() => Promise.resolve(true)),
  },
  STELLARIUM_LAYERS: [
    { id: 'core', name: 'Core Engine', files: [], size: 1000, priority: 0 },
    { id: 'stars', name: 'Star Catalog', files: [], size: 2000, priority: 1 },
  ],
}));

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
