/**
 * @jest-environment jsdom
 */

import {
  parseFITSHeader,
  formatRA,
  formatDec,
  formatPixelScale,
  formatExposure,
  isFITSFile,
  validateFITSFile,
} from '../fits-parser';

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
});
