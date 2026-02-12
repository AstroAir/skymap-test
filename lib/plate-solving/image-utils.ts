/**
 * Image Processing Utilities for Plate Solving
 *
 * Constants, validation, dimension extraction, and compression helpers
 * extracted from components/starmap/plate-solving/image-capture.tsx
 */

// ============================================================================
// Constants
// ============================================================================

export const DEFAULT_MAX_FILE_SIZE_MB = 50;
export const DEFAULT_ACCEPTED_FORMATS = ['image/jpeg', 'image/png', 'image/webp', 'image/tiff'];
export const FITS_EXTENSIONS = ['.fits', '.fit', '.fts'];
export const COMPRESSION_QUALITY = 0.85;
export const MAX_DIMENSION_FOR_PREVIEW = 4096;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get image dimensions from a File object
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      reject(new Error('Failed to load image'));
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Compress an image file by resizing and re-encoding as JPEG
 */
export async function compressImage(
  file: File,
  maxDimension: number,
  quality: number
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        'image/jpeg',
        quality
      );

      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      reject(new Error('Failed to load image for compression'));
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  });
}
