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
  getImageDimensions,
  compressImage,
} from '../image-utils';

// Mock URL.createObjectURL / revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = jest.fn();

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

describe('getImageDimensions', () => {
  let origImage: typeof global.Image;

  beforeEach(() => {
    origImage = global.Image;
  });

  afterEach(() => {
    global.Image = origImage;
  });

  it('should resolve with image dimensions on load', async () => {
    const MockImage = class {
      naturalWidth = 1920;
      naturalHeight = 1080;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_: string) {
        setTimeout(() => this.onload?.(), 0);
      }
    };
    global.Image = MockImage as unknown as typeof Image;

    const file = new File(['data'], 'test.jpg', { type: 'image/jpeg' });
    const dims = await getImageDimensions(file);
    expect(dims).toEqual({ width: 1920, height: 1080 });
  });

  it('should reject on image load error', async () => {
    const MockImage = class {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_: string) {
        setTimeout(() => this.onerror?.(), 0);
      }
    };
    global.Image = MockImage as unknown as typeof Image;

    const file = new File(['data'], 'bad.jpg', { type: 'image/jpeg' });
    await expect(getImageDimensions(file)).rejects.toThrow('Failed to load image');
  });
});

describe('compressImage', () => {
  let origImage: typeof global.Image;
  let origCreateElement: typeof document.createElement;

  beforeEach(() => {
    origImage = global.Image;
    origCreateElement = document.createElement;
  });

  afterEach(() => {
    global.Image = origImage;
    document.createElement = origCreateElement;
  });

  it('should compress and return a new File when image is within maxDimension', async () => {
    const MockImage = class {
      width = 800;
      height = 600;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_: string) {
        setTimeout(() => this.onload?.(), 0);
      }
    };
    global.Image = MockImage as unknown as typeof Image;

    const mockBlob = new Blob(['compressed'], { type: 'image/jpeg' });
    const mockCtx = {
      drawImage: jest.fn(),
    };
    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: jest.fn(() => mockCtx),
      toBlob: jest.fn((cb: (blob: Blob | null) => void) => {
        cb(mockBlob);
      }),
    };
    document.createElement = jest.fn((tag: string) => {
      if (tag === 'canvas') return mockCanvas as unknown as HTMLCanvasElement;
      return origCreateElement.call(document, tag);
    }) as unknown as typeof document.createElement;

    const file = new File(['original'], 'test.jpg', { type: 'image/jpeg' });
    const result = await compressImage(file, 4096, 0.85);

    expect(result).toBeInstanceOf(File);
    expect(result.type).toBe('image/jpeg');
    expect(mockCtx.drawImage).toHaveBeenCalled();
  });

  it('should resize when image exceeds maxDimension', async () => {
    const MockImage = class {
      width = 8000;
      height = 6000;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_: string) {
        setTimeout(() => this.onload?.(), 0);
      }
    };
    global.Image = MockImage as unknown as typeof Image;

    const mockBlob = new Blob(['compressed'], { type: 'image/jpeg' });
    const mockCtx = { drawImage: jest.fn() };
    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: jest.fn(() => mockCtx),
      toBlob: jest.fn((cb: (blob: Blob | null) => void) => {
        cb(mockBlob);
      }),
    };
    document.createElement = jest.fn((tag: string) => {
      if (tag === 'canvas') return mockCanvas as unknown as HTMLCanvasElement;
      return origCreateElement.call(document, tag);
    }) as unknown as typeof document.createElement;

    const file = new File(['original'], 'test.jpg', { type: 'image/jpeg' });
    const result = await compressImage(file, 2000, 0.85);

    expect(result).toBeInstanceOf(File);
    // Canvas should be resized
    expect(mockCanvas.width).toBeLessThanOrEqual(2000);
    expect(mockCanvas.height).toBeLessThanOrEqual(2000);
  });

  it('should reject when canvas context is null', async () => {
    const MockImage = class {
      width = 100;
      height = 100;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_: string) {
        setTimeout(() => this.onload?.(), 0);
      }
    };
    global.Image = MockImage as unknown as typeof Image;

    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: jest.fn(() => null),
      toBlob: jest.fn(),
    };
    document.createElement = jest.fn((tag: string) => {
      if (tag === 'canvas') return mockCanvas as unknown as HTMLCanvasElement;
      return origCreateElement.call(document, tag);
    }) as unknown as typeof document.createElement;

    const file = new File(['data'], 'test.jpg', { type: 'image/jpeg' });
    await expect(compressImage(file, 4096, 0.85)).rejects.toThrow('Failed to get canvas context');
  });

  it('should reject when toBlob returns null', async () => {
    const MockImage = class {
      width = 100;
      height = 100;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_: string) {
        setTimeout(() => this.onload?.(), 0);
      }
    };
    global.Image = MockImage as unknown as typeof Image;

    const mockCtx = { drawImage: jest.fn() };
    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: jest.fn(() => mockCtx),
      toBlob: jest.fn((cb: (blob: Blob | null) => void) => {
        cb(null);
      }),
    };
    document.createElement = jest.fn((tag: string) => {
      if (tag === 'canvas') return mockCanvas as unknown as HTMLCanvasElement;
      return origCreateElement.call(document, tag);
    }) as unknown as typeof document.createElement;

    const file = new File(['data'], 'test.jpg', { type: 'image/jpeg' });
    await expect(compressImage(file, 4096, 0.85)).rejects.toThrow('Failed to compress image');
  });

  it('should reject on image load error', async () => {
    const MockImage = class {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_: string) {
        setTimeout(() => this.onerror?.(), 0);
      }
    };
    global.Image = MockImage as unknown as typeof Image;

    const file = new File(['data'], 'bad.jpg', { type: 'image/jpeg' });
    await expect(compressImage(file, 4096, 0.85)).rejects.toThrow('Failed to load image for compression');
  });
});
