/**
 * Tests for cache/compression.ts
 */

import {
  isCompressionSupported,
  shouldCompress,
  compress,
  decompress,
  getCompressionRatio,
  formatCompressionSavings,
} from '../compression';
import compressionUtils from '../compression';

// ============================================================================
// Mock stream helpers for jsdom (which lacks CompressionStream/DecompressionStream)
// ============================================================================

function createMockCompressionStream(shrink: boolean) {
  return function MockCompressionStream() {
    const chunks: Uint8Array[] = [];
    let closed = false;
    const self = {
      writable: {
        getWriter: () => ({
          write: (data: Uint8Array) => { chunks.push(new Uint8Array(data)); },
          close: () => { closed = true; },
        }),
      },
      readable: {
        getReader: () => {
          let read = false;
          return {
            read: async () => {
              if (read || !closed) return { done: true, value: undefined };
              read = true;
              const total = chunks.reduce((s, c) => s + c.length, 0);
              const combined = new Uint8Array(total);
              let off = 0;
              for (const c of chunks) { combined.set(c, off); off += c.length; }
              if (shrink) {
                // Return ~half the data to simulate compression
                return { done: false, value: combined.slice(0, Math.floor(total / 2)) };
              }
              // Return same-size data to simulate incompressible content
              return { done: false, value: combined };
            },
          };
        },
      },
    };
    return self;
  } as unknown as typeof CompressionStream;
}

function createMockDecompressionStream() {
  return function MockDecompressionStream() {
    const chunks: Uint8Array[] = [];
    let closed = false;
    return {
      writable: {
        getWriter: () => ({
          write: (data: Uint8Array) => { chunks.push(new Uint8Array(data)); },
          close: () => { closed = true; },
        }),
      },
      readable: {
        getReader: () => {
          let read = false;
          return {
            read: async () => {
              if (read || !closed) return { done: true, value: undefined };
              read = true;
              const total = chunks.reduce((s, c) => s + c.length, 0);
              const combined = new Uint8Array(total);
              let off = 0;
              for (const c of chunks) { combined.set(c, off); off += c.length; }
              return { done: false, value: combined };
            },
          };
        },
      },
    };
  } as unknown as typeof DecompressionStream;
}

function disableCompression() {
  // @ts-expect-error intentionally removing globals for testing
  delete globalThis.CompressionStream;
  // @ts-expect-error intentionally removing globals for testing
  delete globalThis.DecompressionStream;
}

function installMockStreams(shrink = true) {
  globalThis.CompressionStream = createMockCompressionStream(shrink);
  globalThis.DecompressionStream = createMockDecompressionStream();
}

afterEach(() => {
  disableCompression();
});

describe('isCompressionSupported', () => {
  it('should return true when CompressionStream and DecompressionStream exist', () => {
    installMockStreams();
    expect(isCompressionSupported()).toBe(true);
  });

  it('should return false when CompressionStream is undefined', () => {
    disableCompression();
    expect(isCompressionSupported()).toBe(false);
  });
});

describe('shouldCompress', () => {
  const smallData = new Uint8Array(100);
  const largeData = new Uint8Array(2000);

  it('should return false for small data even with compressible type', () => {
    expect(shouldCompress(smallData, 'application/json')).toBe(false);
  });

  it('should return false when compression is not supported', () => {
    disableCompression();
    expect(shouldCompress(largeData, 'application/json')).toBe(false);
  });

  it('should return true for all compressible content types when supported', () => {
    installMockStreams();
    expect(shouldCompress(largeData, 'application/json')).toBe(true);
    expect(shouldCompress(largeData, 'text/plain')).toBe(true);
    expect(shouldCompress(largeData, 'text/html')).toBe(true);
    expect(shouldCompress(largeData, 'application/xml')).toBe(true);
    expect(shouldCompress(largeData, 'application/javascript')).toBe(true);
    expect(shouldCompress(largeData, 'image/svg+xml')).toBe(true);
  });

  it('should return false for non-compressible types', () => {
    expect(shouldCompress(largeData, 'image/png')).toBe(false);
    expect(shouldCompress(largeData, 'image/jpeg')).toBe(false);
    expect(shouldCompress(largeData, 'application/octet-stream')).toBe(false);
  });

  it('should handle ArrayBuffer input', () => {
    installMockStreams();
    const buffer = new ArrayBuffer(2000);
    expect(shouldCompress(buffer, 'application/json')).toBe(true);
  });

  it('should return false for data below the 1KB threshold', () => {
    installMockStreams();
    const boundaryData = new Uint8Array(1023);
    expect(shouldCompress(boundaryData, 'application/json')).toBe(false);
  });
});

describe('compress', () => {
  const createTestData = (size: number): Uint8Array => {
    const data = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
      data[i] = i % 256;
    }
    return data;
  };

  it('should return uncompressed result when CompressionStream is unavailable', async () => {
    disableCompression();
    const testData = createTestData(5000);
    const result = await compress(testData);
    expect(result.compressed).toBe(false);
    expect(result.data).toBe(testData);
    expect(result.originalSize).toBe(5000);
    expect(result.compressedSize).toBe(5000);
  });

  it('should compress data when CompressionStream is available (shrink mock)', async () => {
    installMockStreams(true);
    const testData = new Uint8Array(5000).fill(65);
    const result = await compress(testData);
    expect(result.originalSize).toBe(5000);
    expect(result.compressed).toBe(true);
    expect(result.compressedSize).toBeLessThan(result.originalSize);
  });

  it('should handle ArrayBuffer input with mock streams', async () => {
    installMockStreams(true);
    const buffer = new ArrayBuffer(2000);
    new Uint8Array(buffer).fill(42);
    const result = await compress(buffer);
    expect(result.originalSize).toBe(2000);
    expect(result.compressed).toBe(true);
  });

  it('should return uncompressed when compressed data is not smaller', async () => {
    // Install a non-shrink mock (output same size as input)
    installMockStreams(false);
    const testData = new Uint8Array(2000).fill(99);
    const result = await compress(testData);
    expect(result.originalSize).toBe(2000);
    expect(result.compressed).toBe(false);
    expect(result.compressedSize).toBe(result.originalSize);
  });

  it('should handle CompressionStream error gracefully', async () => {
    // Install a broken CompressionStream that throws on use
    const BrokenStream = function () {
      throw new Error('Broken stream');
    };
    globalThis.CompressionStream = BrokenStream as unknown as typeof CompressionStream;
    globalThis.DecompressionStream = BrokenStream as unknown as typeof DecompressionStream;

    const testData = createTestData(5000);
    const result = await compress(testData);
    expect(result.compressed).toBe(false);
    expect(result.originalSize).toBe(5000);
    expect(result.compressedSize).toBe(5000);
  });
});

describe('decompress', () => {
  it('should return original data when DecompressionStream is unavailable (Uint8Array)', async () => {
    disableCompression();
    const data = new Uint8Array([1, 2, 3, 4]);
    const result = await decompress(data);
    expect(result).toEqual(data);
  });

  it('should return Uint8Array when given ArrayBuffer and DecompressionStream is unavailable', async () => {
    disableCompression();
    const buffer = new ArrayBuffer(4);
    new Uint8Array(buffer).set([10, 20, 30, 40]);
    const result = await decompress(buffer);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(4);
    expect(result[0]).toBe(10);
  });

  it('should decompress data with mock DecompressionStream', async () => {
    installMockStreams();
    const data = new Uint8Array([10, 20, 30, 40, 50]);
    const result = await decompress(data);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(5);
    expect(result[0]).toBe(10);
  });

  it('should decompress ArrayBuffer input with mock DecompressionStream', async () => {
    installMockStreams();
    const buffer = new ArrayBuffer(4);
    new Uint8Array(buffer).set([1, 2, 3, 4]);
    const result = await decompress(buffer);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(4);
  });

  it('should handle DecompressionStream error gracefully (Uint8Array input)', async () => {
    const BrokenStream = function () {
      throw new Error('Broken stream');
    };
    globalThis.CompressionStream = BrokenStream as unknown as typeof CompressionStream;
    globalThis.DecompressionStream = BrokenStream as unknown as typeof DecompressionStream;

    const data = new Uint8Array([1, 2, 3]);
    const result = await decompress(data);
    expect(result).toEqual(data);
  });

  it('should handle DecompressionStream error gracefully (ArrayBuffer input)', async () => {
    const BrokenStream = function () {
      throw new Error('Broken stream');
    };
    globalThis.CompressionStream = BrokenStream as unknown as typeof CompressionStream;
    globalThis.DecompressionStream = BrokenStream as unknown as typeof DecompressionStream;

    const buffer = new ArrayBuffer(3);
    new Uint8Array(buffer).set([5, 6, 7]);
    const result = await decompress(buffer);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result[0]).toBe(5);
  });
});

describe('getCompressionRatio', () => {
  it('should calculate ratio correctly', () => {
    expect(getCompressionRatio(1000, 500)).toBe(0.5);
    expect(getCompressionRatio(1000, 250)).toBe(0.25);
    expect(getCompressionRatio(1000, 1000)).toBe(1);
  });

  it('should handle zero original size', () => {
    expect(getCompressionRatio(0, 0)).toBe(1);
  });
});

describe('formatCompressionSavings', () => {
  it('should format savings correctly in bytes', () => {
    const result = formatCompressionSavings(1000, 500);
    expect(result).toContain('500 B');
    expect(result).toContain('50');
  });

  it('should handle no savings', () => {
    expect(formatCompressionSavings(1000, 1000)).toBe('No savings');
  });

  it('should format KB-level savings', () => {
    const result = formatCompressionSavings(1024 * 1024, 512 * 1024);
    expect(result).toContain('KB');
  });

  it('should format MB-level savings', () => {
    const result = formatCompressionSavings(100 * 1024 * 1024, 50 * 1024 * 1024);
    expect(result).toContain('MB');
  });

  it('should handle case where compressed is larger', () => {
    expect(formatCompressionSavings(1000, 1100)).toBe('No savings');
  });
});

describe('compressionUtils default export', () => {
  it('should expose all utility functions', () => {
    expect(typeof compressionUtils.isSupported).toBe('function');
    expect(typeof compressionUtils.shouldCompress).toBe('function');
    expect(typeof compressionUtils.compress).toBe('function');
    expect(typeof compressionUtils.decompress).toBe('function');
    expect(typeof compressionUtils.getCompressionRatio).toBe('function');
    expect(typeof compressionUtils.formatCompressionSavings).toBe('function');
  });
});
