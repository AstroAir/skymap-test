/**
 * Cache Compression Utilities
 * Provides compression/decompression for large cache entries
 */

// ============================================================================
// Types
// ============================================================================

import { createLogger } from '@/lib/logger';

const logger = createLogger('cache-compression');

export interface CompressedData {
  compressed: boolean;
  data: ArrayBuffer | Uint8Array;
  originalSize: number;
  compressedSize: number;
}

// ============================================================================
// Compression Detection
// ============================================================================

/**
 * Check if CompressionStream API is available (modern browsers)
 */
export function isCompressionSupported(): boolean {
  return typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined';
}

/**
 * Determine if data should be compressed based on size and type
 */
export function shouldCompress(data: ArrayBuffer | Uint8Array, contentType: string): boolean {
  // Only compress if:
  // 1. Compression is supported
  // 2. Data is larger than 1KB
  // 3. Content type is compressible (text, JSON, etc.)
  
  if (!isCompressionSupported()) return false;
  
  const size = data.byteLength;
  if (size < 1024) return false; // Too small to benefit
  
  const compressibleTypes = [
    'application/json',
    'text/',
    'application/xml',
    'application/javascript',
    'image/svg+xml',
  ];
  
  return compressibleTypes.some(type => contentType.includes(type));
}

// ============================================================================
// Compression Functions
// ============================================================================

/**
 * Compress data using gzip
 */
export async function compress(data: ArrayBuffer | Uint8Array): Promise<CompressedData> {
  if (!isCompressionSupported()) {
    return {
      compressed: false,
      data,
      originalSize: data.byteLength,
      compressedSize: data.byteLength,
    };
  }
  
  try {
    const originalSize = data.byteLength;
    const stream = new CompressionStream('gzip');
    const writer = stream.writable.getWriter();
    
    const inputData = data instanceof ArrayBuffer ? new Uint8Array(data) : data;
    writer.write(inputData as unknown as BufferSource);
    writer.close();
    
    const compressedChunks: Uint8Array[] = [];
    const reader = stream.readable.getReader();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      compressedChunks.push(value);
    }
    
    // Combine chunks
    const totalLength = compressedChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const compressedData = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of compressedChunks) {
      compressedData.set(chunk, offset);
      offset += chunk.length;
    }
    
    // Only use compressed version if it's actually smaller
    if (compressedData.length >= originalSize) {
      return {
        compressed: false,
        data,
        originalSize,
        compressedSize: originalSize,
      };
    }
    
    return {
      compressed: true,
      data: compressedData,
      originalSize,
      compressedSize: compressedData.length,
    };
  } catch (error) {
    logger.warn('Failed to compress', error);
    return {
      compressed: false,
      data,
      originalSize: data.byteLength,
      compressedSize: data.byteLength,
    };
  }
}

/**
 * Decompress gzip data
 */
export async function decompress(compressedData: ArrayBuffer | Uint8Array): Promise<Uint8Array> {
  if (!isCompressionSupported()) {
    return compressedData instanceof ArrayBuffer 
      ? new Uint8Array(compressedData) 
      : compressedData;
  }
  
  try {
    const stream = new DecompressionStream('gzip');
    const writer = stream.writable.getWriter();
    
    const inputData = compressedData instanceof ArrayBuffer 
      ? new Uint8Array(compressedData) 
      : compressedData;
    writer.write(inputData as unknown as BufferSource);
    writer.close();
    
    const decompressedChunks: Uint8Array[] = [];
    const reader = stream.readable.getReader();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      decompressedChunks.push(value);
    }
    
    // Combine chunks
    const totalLength = decompressedChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const decompressedData = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of decompressedChunks) {
      decompressedData.set(chunk, offset);
      offset += chunk.length;
    }
    
    return decompressedData;
  } catch (error) {
    logger.warn('Failed to decompress', error);
    // Return original data if decompression fails
    return compressedData instanceof ArrayBuffer 
      ? new Uint8Array(compressedData) 
      : compressedData;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate compression ratio
 */
export function getCompressionRatio(originalSize: number, compressedSize: number): number {
  if (originalSize === 0) return 1;
  return compressedSize / originalSize;
}

/**
 * Format compression savings for display
 */
export function formatCompressionSavings(originalSize: number, compressedSize: number): string {
  const savings = originalSize - compressedSize;
  const ratio = getCompressionRatio(originalSize, compressedSize);
  const percentSaved = ((1 - ratio) * 100).toFixed(1);
  
  if (savings <= 0) return 'No savings';
  
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  return `${formatSize(savings)} saved (${percentSaved}%)`;
}

const compressionUtils = {
  isSupported: isCompressionSupported,
  shouldCompress,
  compress,
  decompress,
  getCompressionRatio,
  formatCompressionSavings,
};

export default compressionUtils;
