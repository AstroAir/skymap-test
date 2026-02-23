/**
 * Tests for plate-solving/image-utils.ts
 * Image processing constants and utilities
 */

import {
  DEFAULT_MAX_FILE_SIZE_MB,
  DEFAULT_ACCEPTED_FORMATS,
  FITS_EXTENSIONS,
  COMPRESSION_QUALITY,
  MAX_DIMENSION_FOR_PREVIEW,
} from '../image-utils';

describe('image-utils constants', () => {
  it('should have a reasonable max file size', () => {
    expect(DEFAULT_MAX_FILE_SIZE_MB).toBeGreaterThan(0);
    expect(DEFAULT_MAX_FILE_SIZE_MB).toBeLessThanOrEqual(100);
  });

  it('should accept common image formats', () => {
    expect(DEFAULT_ACCEPTED_FORMATS).toContain('image/jpeg');
    expect(DEFAULT_ACCEPTED_FORMATS).toContain('image/png');
  });

  it('should have FITS extensions', () => {
    expect(FITS_EXTENSIONS).toContain('.fits');
    expect(FITS_EXTENSIONS).toContain('.fit');
  });

  it('should have compression quality between 0 and 1', () => {
    expect(COMPRESSION_QUALITY).toBeGreaterThan(0);
    expect(COMPRESSION_QUALITY).toBeLessThanOrEqual(1);
  });

  it('should have max dimension for preview', () => {
    expect(MAX_DIMENSION_FOR_PREVIEW).toBeGreaterThan(0);
  });
});
