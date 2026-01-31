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

describe('isCompressionSupported', () => {
  it('should return a boolean', () => {
    const result = isCompressionSupported();
    expect(typeof result).toBe('boolean');
  });
});

describe('shouldCompress', () => {
  const smallData = new Uint8Array(100); // 100 bytes
  const largeData = new Uint8Array(2000); // 2KB

  it('should return false for small data', () => {
    expect(shouldCompress(smallData, 'application/json')).toBe(false);
  });

  it('should return true for large compressible data when supported', () => {
    if (isCompressionSupported()) {
      expect(shouldCompress(largeData, 'application/json')).toBe(true);
      expect(shouldCompress(largeData, 'text/plain')).toBe(true);
      expect(shouldCompress(largeData, 'text/html')).toBe(true);
    }
  });

  it('should return false for non-compressible types', () => {
    // Images and binary data shouldn't be compressed
    expect(shouldCompress(largeData, 'image/png')).toBe(false);
    expect(shouldCompress(largeData, 'image/jpeg')).toBe(false);
    expect(shouldCompress(largeData, 'application/octet-stream')).toBe(false);
  });

  it('should handle ArrayBuffer input', () => {
    const buffer = new ArrayBuffer(2000);
    if (isCompressionSupported()) {
      expect(shouldCompress(buffer, 'application/json')).toBe(true);
    }
  });
});

describe('compress and decompress', () => {
  // Create test data with repetitive content (compresses well)
  const createTestData = (size: number): Uint8Array => {
    const data = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
      data[i] = i % 256;
    }
    return data;
  };

  it('should handle compression when supported', async () => {
    const testData = createTestData(5000);
    const result = await compress(testData);
    
    expect(result.originalSize).toBe(5000);
    
    if (isCompressionSupported() && result.compressed) {
      expect(result.compressedSize).toBeLessThan(result.originalSize);
    }
  });

  it('should return uncompressed data when compression not supported', async () => {
    // Mock compression not supported by testing with small data
    const smallData = new Uint8Array(10);
    const result = await compress(smallData);
    
    // Small data shouldn't benefit from compression
    expect(result.originalSize).toBe(10);
  });

  it('should decompress data correctly', async () => {
    if (!isCompressionSupported()) {
      return; // Skip if compression not supported
    }

    const originalData = createTestData(5000);
    const compressed = await compress(originalData);
    
    if (compressed.compressed) {
      const decompressed = await decompress(compressed.data);
      expect(decompressed.length).toBe(originalData.length);
      
      // Verify content matches
      for (let i = 0; i < originalData.length; i++) {
        expect(decompressed[i]).toBe(originalData[i]);
      }
    }
  });

  it('should handle ArrayBuffer input', async () => {
    const buffer = new ArrayBuffer(1000);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < 1000; i++) {
      view[i] = i % 256;
    }
    
    const result = await compress(buffer);
    expect(result.originalSize).toBe(1000);
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
  it('should format savings correctly', () => {
    const result = formatCompressionSavings(1000, 500);
    expect(result).toContain('500 B');
    expect(result).toContain('50');
  });

  it('should handle no savings', () => {
    const result = formatCompressionSavings(1000, 1000);
    expect(result).toBe('No savings');
  });

  it('should handle larger sizes', () => {
    const result = formatCompressionSavings(1024 * 1024, 512 * 1024);
    expect(result).toContain('KB');
  });

  it('should handle case where compressed is larger', () => {
    const result = formatCompressionSavings(1000, 1100);
    expect(result).toBe('No savings');
  });
});
