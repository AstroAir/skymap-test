/**
 * @jest-environment jsdom
 */

import {
  parseFITSHeader,
  readFITSPixelData,
  parseXISFHeader,
  formatRA,
  formatDec,
  formatPixelScale,
  formatExposure,
  isFITSFile,
  isXISFFile,
  validateFITSFile,
  generatePreviewImageData,
} from '../fits-parser';
import type { FITSPixelData } from '../fits-parser';

// Polyfill ImageData for jsdom (not available by default)
if (typeof globalThis.ImageData === 'undefined') {
  (globalThis as Record<string, unknown>).ImageData = class ImageData {
    width: number;
    height: number;
    data: Uint8ClampedArray;
    constructor(sw: number, sh: number) {
      this.width = sw;
      this.height = sh;
      this.data = new Uint8ClampedArray(sw * sh * 4);
    }
  };
}

// ============================================================================
// Mock FITS Header Data
// ============================================================================

function createFITSHeaderBlock(cards: string[]): ArrayBuffer {
  const CARD_SIZE = 80;
  const BLOCK_SIZE = 2880;
  
  // Pad cards to 80 characters each
  const paddedCards = cards.map(card => card.padEnd(CARD_SIZE, ' '));
  
  // Add END card
  paddedCards.push('END'.padEnd(CARD_SIZE, ' '));
  
  // Calculate total size and pad to block boundary
  const totalCards = paddedCards.length;
  const blocksNeeded = Math.ceil((totalCards * CARD_SIZE) / BLOCK_SIZE);
  const totalSize = blocksNeeded * BLOCK_SIZE;
  
  const buffer = new ArrayBuffer(totalSize);
  const view = new Uint8Array(buffer);
  
  paddedCards.forEach((card, index) => {
    for (let i = 0; i < CARD_SIZE; i++) {
      view[index * CARD_SIZE + i] = card.charCodeAt(i);
    }
  });
  
  return buffer;
}

function createMockFITSFile(cards: string[], filename = 'test.fits'): File {
  const buffer = createFITSHeaderBlock(cards);
  return new File([buffer], filename, { type: '' });
}

// ============================================================================
// Test Data
// ============================================================================

const basicImageHeader = [
  "SIMPLE  =                    T / file does conform to FITS standard",
  "BITPIX  =                   16 / number of bits per data pixel",
  "NAXIS   =                    2 / number of data axes",
  "NAXIS1  =                 4096 / length of data axis 1",
  "NAXIS2  =                 4096 / length of data axis 2",
  "BZERO   =                32768 / offset data range to that of unsigned short",
  "BSCALE  =                    1 / default scaling factor",
];

const wcsHeader = [
  ...basicImageHeader,
  "CRPIX1  =               2048.5 / Reference pixel X",
  "CRPIX2  =               2048.5 / Reference pixel Y",
  "CRVAL1  =          83.63308333 / Reference RA (degrees)",
  "CRVAL2  =          -5.39194444 / Reference Dec (degrees)",
  "CD1_1   =     -0.0002777777778 / CD matrix element",
  "CD1_2   =                    0 / CD matrix element",
  "CD2_1   =                    0 / CD matrix element",
  "CD2_2   =      0.0002777777778 / CD matrix element",
  "CTYPE1  = 'RA---TAN'           / Projection type",
  "CTYPE2  = 'DEC--TAN'           / Projection type",
];

const observationHeader = [
  ...basicImageHeader,
  "OBJECT  = 'M42 Orion Nebula'   / Target name",
  "TELESCOP= 'Takahashi FSQ-106'  / Telescope",
  "INSTRUME= 'ZWO ASI2600MM Pro'  / Camera",
  "OBSERVER= 'John Doe'           / Observer name",
  "DATE-OBS= '2024-01-15T22:30:45'/ Observation date",
  "EXPTIME =                  300 / Exposure time in seconds",
  "FILTER  = 'Ha'                 / Filter used",
  "AIRMASS =                1.234 / Airmass",
  "CCD-TEMP=                  -10 / CCD temperature",
  "GAIN    =                  100 / Gain setting",
];

const fullHeader = [
  ...wcsHeader.slice(0, -2), // Remove CTYPE entries
  "CTYPE1  = 'RA---TAN'           / Projection type",
  "CTYPE2  = 'DEC--TAN'           / Projection type",
  "OBJECT  = 'NGC 7000'           / North America Nebula",
  "TELESCOP= 'Celestron EdgeHD 8' / Telescope",
  "INSTRUME= 'ASI533MC Pro'       / Camera",
  "DATE-OBS= '2024-06-20T01:15:30'/ Observation date",
  "EXPTIME =                  180 / Exposure time",
  "FILTER  = 'L'                  / Luminance filter",
];

// ============================================================================
// Tests
// ============================================================================

describe('FITS Parser', () => {
  describe('parseFITSHeader', () => {
    it('parses basic image header', async () => {
      const file = createMockFITSFile(basicImageHeader);
      const result = await parseFITSHeader(file);
      
      expect(result.header).toBeDefined();
      expect(result.header['SIMPLE']).toBe(true);
      expect(result.header['BITPIX']).toBe(16);
      expect(result.header['NAXIS']).toBe(2);
      expect(result.header['NAXIS1']).toBe(4096);
      expect(result.header['NAXIS2']).toBe(4096);
    });

    it('extracts image info from header', async () => {
      const file = createMockFITSFile(basicImageHeader);
      const result = await parseFITSHeader(file);
      
      expect(result.image).toBeDefined();
      expect(result.image?.width).toBe(4096);
      expect(result.image?.height).toBe(4096);
      expect(result.image?.bitpix).toBe(16);
      expect(result.image?.naxis).toBe(2);
    });

    it('parses WCS coordinates', async () => {
      const file = createMockFITSFile(wcsHeader);
      const result = await parseFITSHeader(file);
      
      expect(result.wcs).toBeDefined();
      expect(result.wcs?.referencePixel.x).toBeCloseTo(2048.5);
      expect(result.wcs?.referencePixel.y).toBeCloseTo(2048.5);
      expect(result.wcs?.referenceCoordinates.ra).toBeCloseTo(83.633, 2);
      expect(result.wcs?.referenceCoordinates.dec).toBeCloseTo(-5.392, 2);
    });

    it('calculates pixel scale from CD matrix', async () => {
      const file = createMockFITSFile(wcsHeader);
      const result = await parseFITSHeader(file);
      
      expect(result.wcs?.pixelScale).toBeDefined();
      // CD1_1 = -0.0002777... degrees = 1 arcsec/pixel
      expect(result.wcs?.pixelScale).toBeCloseTo(1.0, 1);
    });

    it('extracts projection type from CTYPE', async () => {
      const file = createMockFITSFile(wcsHeader);
      const result = await parseFITSHeader(file);
      
      expect(result.wcs?.projectionType).toBe('TAN');
    });

    it('parses observation info', async () => {
      const file = createMockFITSFile(observationHeader);
      const result = await parseFITSHeader(file);
      
      expect(result.observation).toBeDefined();
      expect(result.observation?.object).toBe('M42 Orion Nebula');
      expect(result.observation?.telescope).toBe('Takahashi FSQ-106');
      expect(result.observation?.instrument).toBe('ZWO ASI2600MM Pro');
      expect(result.observation?.observer).toBe('John Doe');
      expect(result.observation?.exptime).toBe(300);
      expect(result.observation?.filter).toBe('Ha');
    });

    it('parses date observation', async () => {
      const file = createMockFITSFile(observationHeader);
      const result = await parseFITSHeader(file);
      
      expect(result.observation?.dateObs).toBe('2024-01-15T22:30:45');
    });

    it('handles full header with all fields', async () => {
      const file = createMockFITSFile(fullHeader);
      const result = await parseFITSHeader(file);
      
      expect(result.image).toBeDefined();
      expect(result.wcs).toBeDefined();
      expect(result.observation).toBeDefined();
      expect(result.observation?.object).toBe('NGC 7000');
    });

    it('returns raw cards', async () => {
      const file = createMockFITSFile(basicImageHeader);
      const result = await parseFITSHeader(file);
      
      expect(result.rawCards).toBeDefined();
      expect(result.rawCards.length).toBeGreaterThan(0);
    });

    it('handles missing WCS gracefully', async () => {
      const file = createMockFITSFile(basicImageHeader);
      const result = await parseFITSHeader(file);
      
      expect(result.wcs).toBeUndefined();
    });

    it('handles empty observation info', async () => {
      const file = createMockFITSFile(basicImageHeader);
      const result = await parseFITSHeader(file);
      
      expect(result.observation).toBeDefined();
      expect(result.observation?.object).toBeUndefined();
      expect(result.observation?.exptime).toBeUndefined();
    });
  });

  describe('formatRA', () => {
    it('formats RA in degrees to HMS', () => {
      // Orion Nebula: RA ~5h 34m
      const result = formatRA(83.633);
      expect(result).toMatch(/05h 34m/);
    });

    it('formats zero RA', () => {
      const result = formatRA(0);
      expect(result).toMatch(/00h 00m/);
    });

    it('formats RA near 360 degrees', () => {
      const result = formatRA(359.5);
      expect(result).toMatch(/23h 5[78]m/);
    });
  });

  describe('formatDec', () => {
    it('formats positive Dec to DMS', () => {
      const result = formatDec(41.269);
      expect(result).toMatch(/\+41°/);
    });

    it('formats negative Dec to DMS', () => {
      const result = formatDec(-5.392);
      expect(result).toMatch(/-05°/);
    });

    it('formats zero Dec', () => {
      const result = formatDec(0);
      expect(result).toMatch(/\+00°/);
    });
  });

  describe('formatPixelScale', () => {
    it('formats sub-arcsecond scale in milliarcseconds', () => {
      const result = formatPixelScale(0.5);
      expect(result).toContain('mas/px');
    });

    it('formats arcsecond scale', () => {
      const result = formatPixelScale(2.5);
      expect(result).toContain('"/px');
    });

    it('formats 1 arcsec scale', () => {
      const result = formatPixelScale(1.0);
      expect(result).toBe('1.00"/px');
    });
  });

  describe('formatExposure', () => {
    it('formats short exposures in seconds', () => {
      const result = formatExposure(30);
      expect(result).toBe('30.0s');
    });

    it('formats long exposures in minutes and seconds', () => {
      const result = formatExposure(300);
      expect(result).toBe('5m 0s');
    });

    it('formats mixed time', () => {
      const result = formatExposure(125);
      expect(result).toBe('2m 5s');
    });
  });

  describe('isFITSFile', () => {
    it('detects .fits extension', () => {
      const file = new File([''], 'image.fits');
      expect(isFITSFile(file)).toBe(true);
    });

    it('detects .fit extension', () => {
      const file = new File([''], 'image.fit');
      expect(isFITSFile(file)).toBe(true);
    });

    it('detects .fts extension', () => {
      const file = new File([''], 'image.fts');
      expect(isFITSFile(file)).toBe(true);
    });

    it('detects uppercase extensions', () => {
      const file = new File([''], 'IMAGE.FITS');
      expect(isFITSFile(file)).toBe(true);
    });

    it('rejects non-FITS files', () => {
      const file = new File([''], 'image.jpg');
      expect(isFITSFile(file)).toBe(false);
    });

    it('rejects similar extensions', () => {
      const file = new File([''], 'data.fitness');
      expect(isFITSFile(file)).toBe(false);
    });
  });

  describe('validateFITSFile', () => {
    it('validates file with SIMPLE keyword', async () => {
      const content = 'SIMPLE  =                    T';
      const file = new File([content], 'test.fits');
      
      const result = await validateFITSFile(file);
      expect(result).toBe(true);
    });

    it('rejects file without SIMPLE keyword', async () => {
      const content = 'NOT A FITS FILE';
      const file = new File([content], 'test.fits');
      
      const result = await validateFITSFile(file);
      expect(result).toBe(false);
    });

    it('validates proper FITS header block', async () => {
      const file = createMockFITSFile(basicImageHeader);
      
      const result = await validateFITSFile(file);
      expect(result).toBe(true);
    });
  });

  describe('Header Card Parsing', () => {
    it('parses boolean TRUE value', async () => {
      const cards = ["SIMPLE  =                    T / conforming"];
      const file = createMockFITSFile(cards);
      const result = await parseFITSHeader(file);
      
      expect(result.header['SIMPLE']).toBe(true);
    });

    it('parses boolean FALSE value', async () => {
      const cards = ["EXTEND  =                    F / no extensions"];
      const file = createMockFITSFile(cards);
      const result = await parseFITSHeader(file);
      
      expect(result.header['EXTEND']).toBe(false);
    });

    it('parses integer value', async () => {
      const cards = ["BITPIX  =                   32 / bits per pixel"];
      const file = createMockFITSFile(cards);
      const result = await parseFITSHeader(file);
      
      expect(result.header['BITPIX']).toBe(32);
    });

    it('parses floating point value', async () => {
      const cards = ["EXPTIME =               123.45 / exposure time"];
      const file = createMockFITSFile(cards);
      const result = await parseFITSHeader(file);
      
      expect(result.header['EXPTIME']).toBeCloseTo(123.45);
    });

    it('parses string value', async () => {
      const cards = ["OBJECT  = 'Test Object'        / target name"];
      const file = createMockFITSFile(cards);
      const result = await parseFITSHeader(file);
      
      expect(result.header['OBJECT']).toBe('Test Object');
    });

    it('handles string with embedded quotes', async () => {
      const cards = ["COMMENT = 'Value with comment' / end"];
      const file = createMockFITSFile(cards);
      const result = await parseFITSHeader(file);
      
      expect(result.header['COMMENT']).toBe('Value with comment');
    });

    it('parses negative numbers', async () => {
      const cards = ["CCD-TEMP=                  -20 / temperature"];
      const file = createMockFITSFile(cards);
      const result = await parseFITSHeader(file);
      
      expect(result.header['CCD-TEMP']).toBe(-20);
    });

    it('parses scientific notation', async () => {
      const cards = ["CD1_1   =          1.234E-04   / scale"];
      const file = createMockFITSFile(cards);
      const result = await parseFITSHeader(file);
      
      expect(result.header['CD1_1']).toBeCloseTo(0.0001234);
    });
  });

  describe('Telescope Info Extraction', () => {
    it('extracts telescope focal length and aperture', async () => {
      const cards = [
        ...basicImageHeader,
        "FOCALLEN=                  530 / Focal length in mm",
        "APTDIA  =                  200 / Aperture diameter in mm",
      ];
      const file = createMockFITSFile(cards);
      const result = await parseFITSHeader(file);

      expect(result.telescope).toBeDefined();
      expect(result.telescope?.focalLength).toBe(530);
      expect(result.telescope?.aperture).toBe(200);
      expect(result.telescope?.focalRatio).toBeCloseTo(2.65, 1);
    });

    it('returns undefined telescope info when no telescope headers', async () => {
      const file = createMockFITSFile(basicImageHeader);
      const result = await parseFITSHeader(file);
      expect(result.telescope).toBeUndefined();
    });
  });

  describe('Camera Info Extraction', () => {
    it('extracts camera pixel size and binning', async () => {
      const cards = [
        ...basicImageHeader,
        "XPIXSZ  =                3.76 / Pixel size X in microns",
        "YPIXSZ  =                3.76 / Pixel size Y in microns",
        "XBINNING=                    1 / X binning",
        "YBINNING=                    1 / Y binning",
        "BAYERPAT= 'RGGB'              / Bayer pattern",
      ];
      const file = createMockFITSFile(cards);
      const result = await parseFITSHeader(file);

      expect(result.camera).toBeDefined();
      expect(result.camera?.pixelSizeX).toBeCloseTo(3.76);
      expect(result.camera?.pixelSizeY).toBeCloseTo(3.76);
      expect(result.camera?.binningX).toBe(1);
      expect(result.camera?.bayerPattern).toBe('RGGB');
    });
  });

  describe('Site Info Extraction', () => {
    it('extracts observation site coordinates', async () => {
      const cards = [
        ...basicImageHeader,
        "SITELAT =              40.748 / Site latitude",
        "SITELONG=             -73.985 / Site longitude",
        "SITEELEV=                  10 / Site elevation in meters",
      ];
      const file = createMockFITSFile(cards);
      const result = await parseFITSHeader(file);

      expect(result.site).toBeDefined();
      expect(result.site?.latitude).toBeCloseTo(40.748);
      expect(result.site?.longitude).toBeCloseTo(-73.985);
      expect(result.site?.elevation).toBe(10);
    });
  });

  describe('Processing Info Extraction', () => {
    it('extracts processing software and calibration status', async () => {
      const cards = [
        ...basicImageHeader,
        "SWCREATE= 'PixInsight'        / Software",
        "STACKCNT=                   50 / Number of stacked frames",
        "CALSTAT = 'BDF'               / Calibration status",
      ];
      const file = createMockFITSFile(cards);
      const result = await parseFITSHeader(file);

      expect(result.processing).toBeDefined();
      expect(result.processing?.software).toBe('PixInsight');
      expect(result.processing?.stackCount).toBe(50);
      expect(result.processing?.darkApplied).toBe(true);
      expect(result.processing?.flatApplied).toBe(true);
      expect(result.processing?.biasApplied).toBe(true);
    });
  });

  describe('SIP Coefficients Extraction', () => {
    it('extracts SIP polynomial coefficients', async () => {
      const cards = [
        ...wcsHeader,
        "A_ORDER =                    2 / SIP polynomial order",
        "B_ORDER =                    2 / SIP polynomial order",
        "A_2_0   =          1.234E-07   / SIP coefficient",
        "A_0_2   =          2.345E-07   / SIP coefficient",
        "B_2_0   =         -1.234E-07   / SIP coefficient",
        "B_0_2   =          1.111E-07   / SIP coefficient",
      ];
      const file = createMockFITSFile(cards);
      const result = await parseFITSHeader(file);

      expect(result.sip).toBeDefined();
      expect(result.sip?.aOrder).toBe(2);
      expect(result.sip?.bOrder).toBe(2);
      expect(result.sip?.a['A_2_0']).toBeCloseTo(1.234e-7);
      expect(result.sip?.a['A_0_2']).toBeCloseTo(2.345e-7);
      expect(result.sip?.b['B_2_0']).toBeCloseTo(-1.234e-7);
    });

    it('returns undefined SIP when no SIP headers', async () => {
      const file = createMockFITSFile(wcsHeader);
      const result = await parseFITSHeader(file);
      expect(result.sip).toBeUndefined();
    });
  });

  describe('XISF Detection', () => {
    it('detects .xisf files', () => {
      const file = new File([''], 'image.xisf');
      expect(isXISFFile(file)).toBe(true);
      expect(isFITSFile(file)).toBe(true);
    });

    it('rejects non-xisf files', () => {
      const file = new File([''], 'image.fits');
      expect(isXISFFile(file)).toBe(false);
    });
  });

  describe('generatePreviewImageData', () => {
    const makePixelData = (data: number[]): FITSPixelData => ({
      width: 2,
      height: 2,
      bitpix: -32,
      data: new Float64Array(data),
      min: Math.min(...data),
      max: Math.max(...data),
      mean: data.reduce((a, b) => a + b, 0) / data.length,
    });

    it('generates ImageData from pixel data with linear stretch', () => {
      const pixelData: FITSPixelData = {
        width: 4,
        height: 4,
        bitpix: -32,
        data: new Float64Array([
          0, 100, 200, 300,
          400, 500, 600, 700,
          800, 900, 1000, 1100,
          1200, 1300, 1400, 1500,
        ]),
        min: 0,
        max: 1500,
        mean: 750,
      };

      const imageData = generatePreviewImageData(pixelData, 'linear', 0, 1);

      expect(imageData.width).toBe(4);
      expect(imageData.height).toBe(4);
      expect(imageData.data.length).toBe(4 * 4 * 4); // RGBA
      // First pixel should be ~0 (black)
      expect(imageData.data[0]).toBe(0);
      // Alpha should always be 255
      expect(imageData.data[3]).toBe(255);
    });

    it('generates ImageData with asinh stretch', () => {
      const pixelData: FITSPixelData = {
        width: 2,
        height: 2,
        bitpix: 16,
        data: new Float64Array([0, 500, 1000, 1500]),
        min: 0,
        max: 1500,
        mean: 750,
      };

      const imageData = generatePreviewImageData(pixelData, 'asinh', 0, 1);
      expect(imageData.width).toBe(2);
      expect(imageData.height).toBe(2);
      // All alpha channels should be 255
      expect(imageData.data[3]).toBe(255);
      expect(imageData.data[7]).toBe(255);
    });

    it('generates ImageData with log stretch', () => {
      const pd = makePixelData([0, 500, 1000, 1500]);
      const imageData = generatePreviewImageData(pd, 'log', 0, 1);
      expect(imageData.width).toBe(2);
      expect(imageData.data[3]).toBe(255);
    });

    it('generates ImageData with sqrt stretch', () => {
      const pd = makePixelData([0, 500, 1000, 1500]);
      const imageData = generatePreviewImageData(pd, 'sqrt', 0, 1);
      expect(imageData.width).toBe(2);
      expect(imageData.data[3]).toBe(255);
    });

    it('uses default asinh stretch when no mode specified', () => {
      const pd = makePixelData([0, 500, 1000, 1500]);
      const imageData = generatePreviewImageData(pd);
      expect(imageData.width).toBe(2);
      expect(imageData.data.length).toBe(2 * 2 * 4);
    });
  });

  describe('CONTINUE card parsing', () => {
    it('appends CONTINUE card value to previous key', async () => {
      const cards = [
        "LONGKEY = 'This is the start of a very long string value '",
        "CONTINUE  'and this is the continuation'",
      ];
      const file = createMockFITSFile(cards);
      const result = await parseFITSHeader(file);

      expect(result.header['LONGKEY']).toContain('This is the start');
      expect(result.header['LONGKEY']).toContain('and this is the continuation');
    });
  });

  describe('HIERARCH keyword parsing', () => {
    it('parses HIERARCH keyword with numeric value', async () => {
      const cards = [
        "HIERARCH ESO.DET.CHIP.GAIN = 2.5 / detector gain",
      ];
      const file = createMockFITSFile(cards);
      const result = await parseFITSHeader(file);

      expect(result.header['ESO.DET.CHIP.GAIN']).toBeCloseTo(2.5);
    });

    it('parses HIERARCH keyword with string value', async () => {
      const cards = [
        "HIERARCH MY.CUSTOM.KEY = 'hello world' / comment",
      ];
      const file = createMockFITSFile(cards);
      const result = await parseFITSHeader(file);

      expect(result.header['MY.CUSTOM.KEY']).toBe('hello world');
    });
  });

  describe('WCS from CDELT (legacy) extraction', () => {
    it('extracts WCS from CDELT without CROTA', async () => {
      const cards = [
        ...basicImageHeader,
        "CRPIX1  =                512.0 / Reference pixel X",
        "CRPIX2  =                512.0 / Reference pixel Y",
        "CRVAL1  =              180.000 / Reference RA",
        "CRVAL2  =               45.000 / Reference Dec",
        "CDELT1  =            0.0002778 / X scale deg/pix",
        "CDELT2  =            0.0002778 / Y scale deg/pix",
      ];
      const file = createMockFITSFile(cards);
      const result = await parseFITSHeader(file);

      expect(result.wcs).toBeDefined();
      expect(result.wcs?.pixelScale).toBeGreaterThan(0);
      expect(result.wcs?.rotation).toBeCloseTo(0, 3);
    });

    it('extracts WCS with CROTA2 rotation', async () => {
      const cards = [
        ...basicImageHeader,
        "CRPIX1  =                512.0 / Reference pixel X",
        "CRPIX2  =                512.0 / Reference pixel Y",
        "CRVAL1  =              180.000 / Reference RA",
        "CRVAL2  =               45.000 / Reference Dec",
        "CDELT1  =           -0.0002778 / X scale deg/pix",
        "CDELT2  =            0.0002778 / Y scale deg/pix",
        "CROTA2  =                 30.0 / Rotation angle",
      ];
      const file = createMockFITSFile(cards);
      const result = await parseFITSHeader(file);

      expect(result.wcs).toBeDefined();
      expect(result.wcs?.cdMatrix).toBeDefined();
    });
  });

  describe('readFITSPixelData', () => {
    function createFITSWithPixels(bitpix: number, pixelValues: number[]): File {
      const CARD_SIZE = 80;
      const BLOCK_SIZE = 2880;

      const cards = [
        `SIMPLE  =                    T / conforming`,
        `BITPIX  =                  ${String(bitpix).padStart(3)} / bits per pixel`,
        `NAXIS   =                    2 / number of axes`,
        `NAXIS1  =                    2 / width`,
        `NAXIS2  =                    2 / height`,
        `BZERO   =                    0 / zero offset`,
        `BSCALE  =                    1 / scale factor`,
      ];

      const paddedCards = cards.map(c => c.padEnd(CARD_SIZE, ' '));
      paddedCards.push('END'.padEnd(CARD_SIZE, ' '));

      const totalCards = paddedCards.length;
      const headerBlocks = Math.ceil((totalCards * CARD_SIZE) / BLOCK_SIZE);
      const headerSize = headerBlocks * BLOCK_SIZE;

      const bytesPerPixel = Math.abs(bitpix) / 8;
      const dataSize = pixelValues.length * bytesPerPixel;
      const totalSize = headerSize + dataSize;

      const buffer = new ArrayBuffer(totalSize);
      const headerView = new Uint8Array(buffer);

      paddedCards.forEach((card, index) => {
        for (let i = 0; i < CARD_SIZE; i++) {
          headerView[index * CARD_SIZE + i] = card.charCodeAt(i);
        }
      });

      const dataView = new DataView(buffer, headerSize);
      for (let i = 0; i < pixelValues.length; i++) {
        const offset = i * bytesPerPixel;
        switch (bitpix) {
          case 8: dataView.setUint8(offset, pixelValues[i]); break;
          case 16: dataView.setInt16(offset, pixelValues[i], false); break;
          case 32: dataView.setInt32(offset, pixelValues[i], false); break;
          case -32: dataView.setFloat32(offset, pixelValues[i], false); break;
          case -64: dataView.setFloat64(offset, pixelValues[i], false); break;
        }
      }

      return new File([buffer], 'test.fits');
    }

    it('reads 16-bit integer pixel data', async () => {
      const file = createFITSWithPixels(16, [100, 200, 300, 400]);
      const result = await readFITSPixelData(file);

      expect(result).not.toBeNull();
      expect(result!.width).toBe(2);
      expect(result!.height).toBe(2);
      expect(result!.bitpix).toBe(16);
      expect(result!.data[0]).toBe(100);
      expect(result!.data[3]).toBe(400);
      expect(result!.min).toBe(100);
      expect(result!.max).toBe(400);
    });

    it('reads 8-bit unsigned pixel data', async () => {
      const file = createFITSWithPixels(8, [0, 128, 200, 255]);
      const result = await readFITSPixelData(file);

      expect(result).not.toBeNull();
      expect(result!.data[0]).toBe(0);
      expect(result!.data[3]).toBe(255);
    });

    it('reads 32-bit float pixel data', async () => {
      const file = createFITSWithPixels(-32, [1.5, 2.5, 3.5, 4.5]);
      const result = await readFITSPixelData(file);

      expect(result).not.toBeNull();
      expect(result!.data[0]).toBeCloseTo(1.5, 4);
      expect(result!.data[3]).toBeCloseTo(4.5, 4);
    });

    it('reads 64-bit float pixel data', async () => {
      const file = createFITSWithPixels(-64, [1.123456789, 2.987654321, 3.0, 4.0]);
      const result = await readFITSPixelData(file);

      expect(result).not.toBeNull();
      expect(result!.data[0]).toBeCloseTo(1.123456789, 6);
    });

    it('returns null for non-FITS content', async () => {
      const file = new File(['not a fits file'], 'bad.fits');
      const result = await readFITSPixelData(file);
      expect(result).toBeNull();
    });

    it('returns null for NAXIS < 2', async () => {
      const CARD_SIZE = 80;
      const BLOCK_SIZE = 2880;
      const cards = [
        "SIMPLE  =                    T",
        "BITPIX  =                   16",
        "NAXIS   =                    1",
        "NAXIS1  =                  100",
      ];
      const paddedCards = cards.map(c => c.padEnd(CARD_SIZE, ' '));
      paddedCards.push('END'.padEnd(CARD_SIZE, ' '));
      const totalSize = Math.ceil((paddedCards.length * CARD_SIZE) / BLOCK_SIZE) * BLOCK_SIZE;
      const buffer = new ArrayBuffer(totalSize);
      const view = new Uint8Array(buffer);
      paddedCards.forEach((card, index) => {
        for (let i = 0; i < CARD_SIZE; i++) {
          view[index * CARD_SIZE + i] = card.charCodeAt(i);
        }
      });
      const file = new File([buffer], 'test.fits');
      const result = await readFITSPixelData(file);
      expect(result).toBeNull();
    });
  });

  describe('parseXISFHeader', () => {
    it('parses XISF header with FITSKeyword elements', async () => {
      const xml = `<?xml version="1.0"?>
<xisf version="1.0">
  <Image Geometry="2048:2048:1" sampleFormat="Float32">
    <FITSKeyword name="OBJECT" value="'M42'" comment="target" />
    <FITSKeyword name="EXPTIME" value="300" comment="exposure" />
    <FITSKeyword name="NAXIS" value="2" comment="axes" />
    <FITSKeyword name="CRPIX1" value="1024" comment="ref pixel" />
    <FITSKeyword name="CRPIX2" value="1024" comment="ref pixel" />
    <FITSKeyword name="CRVAL1" value="83.633" comment="ref RA" />
    <FITSKeyword name="CRVAL2" value="-5.392" comment="ref Dec" />
    <FITSKeyword name="CD1_1" value="-0.0002778" comment="cd" />
    <FITSKeyword name="CD1_2" value="0" comment="cd" />
    <FITSKeyword name="CD2_1" value="0" comment="cd" />
    <FITSKeyword name="CD2_2" value="0.0002778" comment="cd" />
    <FITSKeyword name="SIMPLE" value="T" comment="conforming" />
    <FITSKeyword name="EXTEND" value="F" comment="no ext" />
  </Image>
</xisf>`;
      const file = new File([xml], 'test.xisf');
      const result = await parseXISFHeader(file);

      expect(result).not.toBeNull();
      expect(result!.header['OBJECT']).toBe('M42');
      expect(result!.header['EXPTIME']).toBe(300);
      expect(result!.header['SIMPLE']).toBe(true);
      expect(result!.header['EXTEND']).toBe(false);
      expect(result!.image).toBeDefined();
      expect(result!.image?.width).toBe(2048);
      expect(result!.image?.height).toBe(2048);
      expect(result!.image?.bitpix).toBe(-32);
      expect(result!.wcs).toBeDefined();
    });

    it('returns null for empty XML without FITSKeyword elements', async () => {
      const xml = `<?xml version="1.0"?><xisf></xisf>`;
      const file = new File([xml], 'empty.xisf');
      const result = await parseXISFHeader(file);
      expect(result).toBeNull();
    });

    it('returns null on invalid content', async () => {
      const file = new File([new ArrayBuffer(100)], 'bad.xisf');
      const result = await parseXISFHeader(file);
      // May parse with empty header → null
      expect(result).toBeNull();
    });

    it('parses different sampleFormat types', async () => {
      const formats = [
        { fmt: 'Float64', expected: -64 },
        { fmt: 'UInt16', expected: 16 },
        { fmt: 'UInt8', expected: 8 },
        { fmt: 'UInt32', expected: 32 },
      ];

      for (const { fmt, expected } of formats) {
        const xml = `<xisf><Image Geometry="100:100:1" sampleFormat="${fmt}"><FITSKeyword name="NAXIS" value="2" comment="" /></Image></xisf>`;
        const file = new File([xml], 'test.xisf');
        const result = await parseXISFHeader(file);
        expect(result).not.toBeNull();
        expect(result!.header['BITPIX']).toBe(expected);
      }
    });
  });

  describe('Alternative header keywords', () => {
    it('uses DATE_OBS alternative for date', async () => {
      const cards = [
        ...basicImageHeader,
        "DATE_OBS= '2024-03-15T10:00:00'/ Observation date",
      ];
      const file = createMockFITSFile(cards);
      const result = await parseFITSHeader(file);
      expect(result.observation?.dateObs).toBe('2024-03-15T10:00:00');
    });

    it('uses EXPOSURE alternative for exposure time', async () => {
      const cards = [
        ...basicImageHeader,
        "EXPOSURE=                  120 / Exposure time",
      ];
      const file = createMockFITSFile(cards);
      const result = await parseFITSHeader(file);
      expect(result.observation?.exptime).toBe(120);
    });

    it('uses EGAIN alternative for gain', async () => {
      const cards = [
        ...basicImageHeader,
        "EGAIN   =                 1.23 / Electrons per ADU",
      ];
      const file = createMockFITSFile(cards);
      const result = await parseFITSHeader(file);
      expect(result.observation?.gain).toBeCloseTo(1.23);
    });

    it('uses CCDTEMP alternative for temperature', async () => {
      const cards = [
        ...basicImageHeader,
        "CCDTEMP =                  -15 / CCD temperature",
      ];
      const file = createMockFITSFile(cards);
      const result = await parseFITSHeader(file);
      expect(result.observation?.ccdTemp).toBe(-15);
    });

    it('uses LAT-OBS/LONG-OBS/ALT-OBS for site info', async () => {
      const cards = [
        ...basicImageHeader,
        "LAT-OBS =               35.123 / Latitude",
        "LONG-OBS=             -120.456 / Longitude",
        "ALT-OBS =                 1200 / Altitude",
      ];
      const file = createMockFITSFile(cards);
      const result = await parseFITSHeader(file);
      expect(result.site?.latitude).toBeCloseTo(35.123);
      expect(result.site?.longitude).toBeCloseTo(-120.456);
      expect(result.site?.elevation).toBe(1200);
    });

    it('uses FLENGTH alternative for focal length', async () => {
      const cards = [
        ...basicImageHeader,
        "FLENGTH =                  600 / Focal length",
      ];
      const file = createMockFITSFile(cards);
      const result = await parseFITSHeader(file);
      expect(result.telescope?.focalLength).toBe(600);
    });

    it('uses PIXSIZE1/PIXSIZE2 alternative for pixel size', async () => {
      const cards = [
        ...basicImageHeader,
        "PIXSIZE1=                 4.63 / Pixel size X",
        "PIXSIZE2=                 4.63 / Pixel size Y",
      ];
      const file = createMockFITSFile(cards);
      const result = await parseFITSHeader(file);
      expect(result.camera?.pixelSizeX).toBeCloseTo(4.63);
    });

    it('uses CREATOR alternative for processing software', async () => {
      const cards = [
        ...basicImageHeader,
        "CREATOR = 'AstroPixelProcessor' / Software",
      ];
      const file = createMockFITSFile(cards);
      const result = await parseFITSHeader(file);
      expect(result.processing?.software).toBe('AstroPixelProcessor');
    });

    it('uses OBSLAT/OBSLON/OBSALT for site info', async () => {
      const cards = [
        ...basicImageHeader,
        "OBSLAT  =               40.000 / Observatory latitude",
        "OBSLON  =              -74.000 / Observatory longitude",
        "OBSALT  =                  500 / Observatory altitude",
      ];
      const file = createMockFITSFile(cards);
      const result = await parseFITSHeader(file);
      expect(result.site?.latitude).toBeCloseTo(40.0);
      expect(result.site?.longitude).toBeCloseTo(-74.0);
      expect(result.site?.elevation).toBe(500);
    });

    it('uses APTDIAM alternative for aperture', async () => {
      const cards = [
        ...basicImageHeader,
        "FOCALLEN=                  400 / Focal length",
        "APTDIAM =                  100 / Aperture diameter",
      ];
      const file = createMockFITSFile(cards);
      const result = await parseFITSHeader(file);
      expect(result.telescope?.aperture).toBe(100);
      expect(result.telescope?.focalRatio).toBeCloseTo(4.0, 1);
    });

    it('uses XBIN/YBIN alternative for binning', async () => {
      const cards = [
        ...basicImageHeader,
        "XPIXSZ  =                3.76 / Pixel size",
        "XBIN    =                    2 / X binning",
        "YBIN    =                    2 / Y binning",
      ];
      const file = createMockFITSFile(cards);
      const result = await parseFITSHeader(file);
      expect(result.camera?.binningX).toBe(2);
      expect(result.camera?.binningY).toBe(2);
    });

    it('uses SOFTWARE alternative for processing software', async () => {
      const cards = [
        ...basicImageHeader,
        "SOFTWARE= 'DeepSkyStacker'     / Processing software",
      ];
      const file = createMockFITSFile(cards);
      const result = await parseFITSHeader(file);
      expect(result.processing?.software).toBe('DeepSkyStacker');
    });
  });

  describe('Edge cases', () => {
    it('handles image with NAXIS < 2 gracefully', async () => {
      const cards = [
        "SIMPLE  =                    T",
        "BITPIX  =                   16",
        "NAXIS   =                    1",
        "NAXIS1  =                  100",
      ];
      const file = createMockFITSFile(cards);
      const result = await parseFITSHeader(file);
      expect(result.image).toBeUndefined();
    });

    it('handles string with escaped single quotes', async () => {
      const cards = [
        "COMMENT = 'It''s a test'       / escaped quote",
      ];
      const file = createMockFITSFile(cards);
      const result = await parseFITSHeader(file);
      expect(result.header['COMMENT']).toBe("It's a test");
    });

    it('returns undefined for site when no site headers', async () => {
      const file = createMockFITSFile(basicImageHeader);
      const result = await parseFITSHeader(file);
      expect(result.site).toBeUndefined();
    });

    it('returns undefined for processing when no processing headers', async () => {
      const file = createMockFITSFile(basicImageHeader);
      const result = await parseFITSHeader(file);
      expect(result.processing).toBeUndefined();
    });

    it('returns undefined for camera when no camera headers', async () => {
      const file = createMockFITSFile(basicImageHeader);
      const result = await parseFITSHeader(file);
      expect(result.camera).toBeUndefined();
    });

    it('handles CALSTAT without B/D/F', async () => {
      const cards = [
        ...basicImageHeader,
        "CALSTAT = 'X'                  / Unknown calibration",
      ];
      const file = createMockFITSFile(cards);
      const result = await parseFITSHeader(file);
      expect(result.processing?.darkApplied).toBe(false);
      expect(result.processing?.flatApplied).toBe(false);
      expect(result.processing?.biasApplied).toBe(false);
    });

    it('handles SIP with AP_ORDER and inverse coefficients', async () => {
      const cards = [
        ...wcsHeader,
        "A_ORDER =                    2",
        "B_ORDER =                    2",
        "AP_ORDER=                    2",
        "BP_ORDER=                    2",
        "A_2_0   =          1.000E-07  ",
        "B_0_2   =          2.000E-07  ",
        "AP_2_0  =         -1.000E-07  ",
        "BP_0_2  =         -2.000E-07  ",
      ];
      const file = createMockFITSFile(cards);
      const result = await parseFITSHeader(file);

      expect(result.sip).toBeDefined();
      expect(result.sip?.apOrder).toBe(2);
      expect(result.sip?.bpOrder).toBe(2);
      expect(result.sip?.ap['AP_2_0']).toBeCloseTo(-1e-7);
      expect(result.sip?.bp['BP_0_2']).toBeCloseTo(-2e-7);
    });
  });
});
