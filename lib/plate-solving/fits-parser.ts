/**
 * FITS File Parser Utility
 * 
 * Wraps fitsjs library to provide Promise-based API for parsing FITS headers
 * and extracting astronomical metadata including WCS information.
 */

// ============================================================================
// Types
// ============================================================================

export interface FITSHeader {
  [key: string]: string | number | boolean | undefined;
}

export interface WCSInfo {
  referencePixel: { x: number; y: number };
  referenceCoordinates: { ra: number; dec: number };
  pixelScale: number;
  rotation: number;
  cdMatrix?: {
    cd1_1: number;
    cd1_2: number;
    cd2_1: number;
    cd2_2: number;
  };
  projectionType?: string;
}

export interface FITSImageInfo {
  width: number;
  height: number;
  bitpix: number;
  naxis: number;
  bzero: number;
  bscale: number;
}

export interface FITSObservationInfo {
  object?: string;
  telescope?: string;
  instrument?: string;
  observer?: string;
  dateObs?: string;
  exptime?: number;
  filter?: string;
  airmass?: number;
  gain?: number;
  ccdTemp?: number;
}

export interface FITSTelescopeInfo {
  focalLength?: number;
  aperture?: number;
  focalRatio?: number;
}

export interface FITSCameraInfo {
  pixelSizeX?: number;
  pixelSizeY?: number;
  binningX?: number;
  binningY?: number;
  bayerPattern?: string;
  readoutMode?: string;
  offset?: number;
  usbLimit?: number;
}

export interface FITSSiteInfo {
  latitude?: number;
  longitude?: number;
  elevation?: number;
  siteName?: string;
}

export interface FITSProcessingInfo {
  software?: string;
  stackCount?: number;
  calibrationStatus?: string;
  darkApplied?: boolean;
  flatApplied?: boolean;
  biasApplied?: boolean;
}

export interface SIPCoefficients {
  aOrder: number;
  bOrder: number;
  apOrder?: number;
  bpOrder?: number;
  a: Record<string, number>;
  b: Record<string, number>;
  ap: Record<string, number>;
  bp: Record<string, number>;
}

export interface FITSPixelData {
  width: number;
  height: number;
  bitpix: number;
  data: Float64Array;
  min: number;
  max: number;
  mean: number;
}

export interface FITSMetadata {
  header: FITSHeader;
  image?: FITSImageInfo;
  wcs?: WCSInfo;
  observation?: FITSObservationInfo;
  telescope?: FITSTelescopeInfo;
  camera?: FITSCameraInfo;
  site?: FITSSiteInfo;
  processing?: FITSProcessingInfo;
  sip?: SIPCoefficients;
  rawCards: string[];
}

// ============================================================================
// FITS Header Parser (Pure implementation without fitsjs dependency)
// ============================================================================

const FITS_BLOCK_SIZE = 2880;
const FITS_CARD_SIZE = 80;
const MAX_HEADER_BLOCKS = 100;

function parseHeaderCard(card: string): { key: string; value: string | number | boolean | undefined; isContinue?: boolean } {
  const key = card.substring(0, 8).trim();
  
  if (key === '' || key === 'END') {
    return { key, value: undefined };
  }
  
  // CONTINUE card support (FITS standard for long strings)
  if (key === 'CONTINUE') {
    const rest = card.substring(8).trim();
    if (rest.startsWith("'")) {
      const strValue = extractStringValue(rest);
      return { key: 'CONTINUE', value: strValue, isContinue: true };
    }
    return { key: 'CONTINUE', value: rest, isContinue: true };
  }
  
  // HIERARCH keyword support (ESO convention: "HIERARCH key.subkey = value")
  if (key === 'HIERARCH') {
    const eqIdx = card.indexOf('=', 8);
    if (eqIdx > 0) {
      const hierKey = card.substring(8, eqIdx).trim();
      const valueStr = card.substring(eqIdx + 1).trim();
      const parsed = parseValueString(valueStr);
      return { key: hierKey, value: parsed };
    }
    return { key, value: card.substring(8).trim() };
  }
  
  // Standard keyword=value format check
  if (card[8] !== '=' || card[9] !== ' ') {
    return { key, value: card.substring(10).trim() };
  }
  
  const valueStr = card.substring(10).trim();
  const parsed = parseValueString(valueStr);
  
  return { key, value: parsed };
}

function extractStringValue(str: string): string {
  if (!str.startsWith("'")) return str.trim();
  // Handle escaped single quotes ('' → ')
  let result = '';
  let i = 1;
  while (i < str.length) {
    if (str[i] === "'") {
      if (i + 1 < str.length && str[i + 1] === "'") {
        result += "'";
        i += 2;
      } else {
        break;
      }
    } else {
      result += str[i];
      i++;
    }
  }
  return result.trim();
}

function parseValueString(valueStr: string): string | number | boolean | undefined {
  if (!valueStr) return undefined;
  
  // String value (starts with single quote)
  if (valueStr.startsWith("'")) {
    return extractStringValue(valueStr);
  }
  
  // Strip inline comment for non-string values
  let cleanValue = valueStr;
  const commentIdx = cleanValue.indexOf(' /');
  if (commentIdx >= 0) {
    cleanValue = cleanValue.substring(0, commentIdx).trim();
  }
  
  if (!cleanValue) return undefined;
  
  // Boolean values
  if (cleanValue === 'T') return true;
  if (cleanValue === 'F') return false;
  
  // Numeric values (handle both integer and float, including scientific notation)
  const numValue = parseFloat(cleanValue);
  if (!isNaN(numValue)) {
    return numValue;
  }
  
  return cleanValue;
}

function parseHeaderBlock(buffer: ArrayBuffer, header: FITSHeader, lastKey: { value: string }): { cards: string[]; complete: boolean } {
  const cards: string[] = [];
  const view = new Uint8Array(buffer);
  let complete = false;
  
  const numCards = Math.floor(view.length / FITS_CARD_SIZE);
  
  for (let i = 0; i < numCards; i++) {
    const cardBytes = view.slice(i * FITS_CARD_SIZE, (i + 1) * FITS_CARD_SIZE);
    const card = String.fromCharCode(...cardBytes);
    cards.push(card);
    
    const { key, value, isContinue } = parseHeaderCard(card);
    
    if (key === 'END') {
      complete = true;
      break;
    }
    
    // CONTINUE card: append value to previous key's string
    if (isContinue && lastKey.value && value !== undefined) {
      const prev = header[lastKey.value];
      if (typeof prev === 'string' && typeof value === 'string') {
        header[lastKey.value] = prev + value;
      }
      continue;
    }
    
    if (key && value !== undefined) {
      header[key] = value;
      lastKey.value = key;
    }
  }
  
  return { cards, complete };
}

export async function parseFITSHeader(file: File): Promise<FITSMetadata> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      try {
        const buffer = reader.result as ArrayBuffer;
        let allCards: string[] = [];
        const fullHeader: FITSHeader = {};
        let offset = 0;
        let complete = false;
        const lastKey = { value: '' };
        let blockCount = 0;
        
        while (!complete && offset < buffer.byteLength && blockCount < MAX_HEADER_BLOCKS) {
          const blockEnd = Math.min(offset + FITS_BLOCK_SIZE, buffer.byteLength);
          const block = buffer.slice(offset, blockEnd);
          const { cards, complete: isComplete } = parseHeaderBlock(block, fullHeader, lastKey);
          
          allCards = allCards.concat(cards);
          complete = isComplete;
          offset += FITS_BLOCK_SIZE;
          blockCount++;
        }
        
        const metadata: FITSMetadata = {
          header: fullHeader,
          rawCards: allCards,
        };
        
        metadata.image = extractImageInfo(fullHeader);
        metadata.wcs = extractWCSInfo(fullHeader);
        metadata.observation = extractObservationInfo(fullHeader);
        metadata.telescope = extractTelescopeInfo(fullHeader);
        metadata.camera = extractCameraInfo(fullHeader);
        metadata.site = extractSiteInfo(fullHeader);
        metadata.processing = extractProcessingInfo(fullHeader);
        metadata.sip = extractSIPCoefficients(fullHeader);
        
        resolve(metadata);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read FITS file'));
    };
    
    // Read enough of the file to cover headers dynamically
    // Most headers fit in a few blocks, but allow up to MAX_HEADER_BLOCKS
    const headerSize = Math.min(file.size, FITS_BLOCK_SIZE * MAX_HEADER_BLOCKS);
    const headerBlob = file.slice(0, headerSize);
    reader.readAsArrayBuffer(headerBlob);
  });
}

// ============================================================================
// Metadata Extractors
// ============================================================================

function extractImageInfo(header: FITSHeader): FITSImageInfo | undefined {
  const naxis = header['NAXIS'] as number;
  if (!naxis || naxis < 2) return undefined;
  
  return {
    width: (header['NAXIS1'] as number) || 0,
    height: (header['NAXIS2'] as number) || 0,
    bitpix: (header['BITPIX'] as number) || 0,
    naxis,
    bzero: (header['BZERO'] as number) || 0,
    bscale: (header['BSCALE'] as number) || 1,
  };
}

function extractWCSInfo(header: FITSHeader): WCSInfo | undefined {
  const crpix1 = header['CRPIX1'] as number;
  const crpix2 = header['CRPIX2'] as number;
  const crval1 = header['CRVAL1'] as number;
  const crval2 = header['CRVAL2'] as number;
  
  if (crpix1 === undefined || crval1 === undefined) {
    return undefined;
  }
  
  let cd1_1: number, cd1_2: number, cd2_1: number, cd2_2: number;
  
  if (header['CD1_1'] !== undefined) {
    // CD matrix is directly available
    cd1_1 = (header['CD1_1'] as number) || 0;
    cd1_2 = (header['CD1_2'] as number) || 0;
    cd2_1 = (header['CD2_1'] as number) || 0;
    cd2_2 = (header['CD2_2'] as number) || 0;
  } else if (header['CDELT1'] !== undefined) {
    // Construct CD matrix from CDELT + CROTA (legacy WCS convention)
    const cdelt1 = (header['CDELT1'] as number) || 0;
    const cdelt2 = (header['CDELT2'] as number) || 0;
    const crota = (header['CROTA2'] as number) || (header['CROTA1'] as number) || 0;
    const crotaRad = crota * (Math.PI / 180);
    
    cd1_1 = cdelt1 * Math.cos(crotaRad);
    cd1_2 = -cdelt2 * Math.sin(crotaRad);
    cd2_1 = cdelt1 * Math.sin(crotaRad);
    cd2_2 = cdelt2 * Math.cos(crotaRad);
  } else {
    // No WCS scale information available
    return undefined;
  }
  
  const pixelScale = Math.sqrt(cd1_1 ** 2 + cd2_1 ** 2) * 3600;
  const rotation = Math.atan2(cd2_1, cd1_1) * (180 / Math.PI);
  
  const ctype1 = header['CTYPE1'] as string;
  let projectionType: string | undefined;
  if (ctype1) {
    const match = ctype1.match(/--([A-Z]{3})/);
    if (match) projectionType = match[1];
  }
  
  return {
    referencePixel: { x: crpix1 || 0, y: crpix2 || 0 },
    referenceCoordinates: { ra: crval1, dec: crval2 || 0 },
    pixelScale,
    rotation,
    cdMatrix: { cd1_1, cd1_2, cd2_1, cd2_2 },
    projectionType,
  };
}

function extractObservationInfo(header: FITSHeader): FITSObservationInfo {
  return {
    object: header['OBJECT'] as string,
    telescope: (header['TELESCOP'] as string) || (header['TELESCOPE'] as string),
    instrument: (header['INSTRUME'] as string) || (header['INSTRUMENT'] as string),
    observer: header['OBSERVER'] as string,
    dateObs: (header['DATE-OBS'] as string) || (header['DATE_OBS'] as string),
    exptime: (header['EXPTIME'] as number) || (header['EXPOSURE'] as number),
    filter: header['FILTER'] as string,
    airmass: header['AIRMASS'] as number,
    gain: (header['GAIN'] as number) || (header['EGAIN'] as number),
    ccdTemp: (header['CCD-TEMP'] as number) || (header['CCDTEMP'] as number),
  };
}

function extractTelescopeInfo(header: FITSHeader): FITSTelescopeInfo | undefined {
  const focalLength = (header['FOCALLEN'] as number) || (header['FLENGTH'] as number);
  const aperture = (header['APTDIA'] as number) || (header['APTDIAM'] as number);
  if (!focalLength && !aperture) return undefined;
  return {
    focalLength,
    aperture,
    focalRatio: focalLength && aperture ? focalLength / aperture : undefined,
  };
}

function extractCameraInfo(header: FITSHeader): FITSCameraInfo | undefined {
  const pixelSizeX = (header['XPIXSZ'] as number) || (header['PIXSIZE1'] as number);
  const pixelSizeY = (header['YPIXSZ'] as number) || (header['PIXSIZE2'] as number);
  const binningX = (header['XBINNING'] as number) || (header['XBIN'] as number);
  const binningY = (header['YBINNING'] as number) || (header['YBIN'] as number);
  if (!pixelSizeX && !binningX) return undefined;
  return {
    pixelSizeX,
    pixelSizeY: pixelSizeY || pixelSizeX,
    binningX,
    binningY: binningY || binningX,
    bayerPattern: header['BAYERPAT'] as string,
    readoutMode: header['READOUTM'] as string,
    offset: header['OFFSET'] as number,
    usbLimit: header['USBLIMIT'] as number,
  };
}

function extractSiteInfo(header: FITSHeader): FITSSiteInfo | undefined {
  const lat = (header['SITELAT'] as number) || (header['LAT-OBS'] as number) || (header['OBSLAT'] as number);
  const lon = (header['SITELONG'] as number) || (header['LONG-OBS'] as number) || (header['OBSLON'] as number);
  if (lat === undefined && lon === undefined) return undefined;
  return {
    latitude: lat,
    longitude: lon,
    elevation: (header['SITEELEV'] as number) || (header['ALT-OBS'] as number) || (header['OBSALT'] as number),
    siteName: header['SITENAME'] as string,
  };
}

function extractProcessingInfo(header: FITSHeader): FITSProcessingInfo | undefined {
  const software = (header['SWCREATE'] as string) || (header['CREATOR'] as string) || (header['SOFTWARE'] as string);
  const stackCount = header['STACKCNT'] as number;
  const calstat = header['CALSTAT'] as string;
  if (!software && !stackCount && !calstat) return undefined;
  return {
    software,
    stackCount,
    calibrationStatus: calstat,
    darkApplied: calstat ? calstat.includes('D') : undefined,
    flatApplied: calstat ? calstat.includes('F') : undefined,
    biasApplied: calstat ? calstat.includes('B') : undefined,
  };
}

function extractSIPCoefficients(header: FITSHeader): SIPCoefficients | undefined {
  const aOrder = header['A_ORDER'] as number;
  const bOrder = header['B_ORDER'] as number;
  if (aOrder === undefined || bOrder === undefined) return undefined;

  const a: Record<string, number> = {};
  const b: Record<string, number> = {};
  const ap: Record<string, number> = {};
  const bp: Record<string, number> = {};

  // Extract A/B forward SIP polynomial coefficients
  for (const [key, value] of Object.entries(header)) {
    if (typeof value !== 'number') continue;
    if (/^A_\d+_\d+$/.test(key)) a[key] = value;
    else if (/^B_\d+_\d+$/.test(key)) b[key] = value;
    else if (/^AP_\d+_\d+$/.test(key)) ap[key] = value;
    else if (/^BP_\d+_\d+$/.test(key)) bp[key] = value;
  }

  return {
    aOrder,
    bOrder,
    apOrder: header['AP_ORDER'] as number,
    bpOrder: header['BP_ORDER'] as number,
    a,
    b,
    ap,
    bp,
  };
}

// ============================================================================
// FITS Pixel Data Reader
// ============================================================================

export async function readFITSPixelData(file: File): Promise<FITSPixelData | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const buffer = reader.result as ArrayBuffer;
        const result = parseFITSPixels(buffer);
        resolve(result);
      } catch {
        resolve(null);
      }
    };
    reader.onerror = () => resolve(null);
    reader.readAsArrayBuffer(file);
  });
}

function parseFITSPixels(buffer: ArrayBuffer): FITSPixelData | null {
  // Parse header first to find data start
  const header: FITSHeader = {};
  const lastKey = { value: '' };
  let offset = 0;
  let complete = false;
  let blockCount = 0;

  while (!complete && offset < buffer.byteLength && blockCount < MAX_HEADER_BLOCKS) {
    const blockEnd = Math.min(offset + FITS_BLOCK_SIZE, buffer.byteLength);
    const block = buffer.slice(offset, blockEnd);
    const { complete: isComplete } = parseHeaderBlock(block, header, lastKey);
    complete = isComplete;
    offset += FITS_BLOCK_SIZE;
    blockCount++;
  }

  // Data starts at next block boundary after header
  const dataOffset = offset;
  const bitpix = header['BITPIX'] as number;
  const naxis = header['NAXIS'] as number;
  if (!bitpix || !naxis || naxis < 2) return null;

  const width = (header['NAXIS1'] as number) || 0;
  const height = (header['NAXIS2'] as number) || 0;
  if (width === 0 || height === 0) return null;

  const bzero = (header['BZERO'] as number) || 0;
  const bscale = (header['BSCALE'] as number) || 1;

  const totalPixels = width * height;
  const bytesPerPixel = Math.abs(bitpix) / 8;
  const dataEnd = dataOffset + totalPixels * bytesPerPixel;

  if (dataEnd > buffer.byteLength) return null;

  const dataView = new DataView(buffer, dataOffset);
  const data = new Float64Array(totalPixels);
  let min = Infinity;
  let max = -Infinity;
  let sum = 0;

  for (let i = 0; i < totalPixels; i++) {
    const byteOffset = i * bytesPerPixel;
    let rawValue: number;

    switch (bitpix) {
      case 8:  rawValue = dataView.getUint8(byteOffset); break;
      case 16: rawValue = dataView.getInt16(byteOffset, false); break;  // FITS is big-endian
      case 32: rawValue = dataView.getInt32(byteOffset, false); break;
      case -32: rawValue = dataView.getFloat32(byteOffset, false); break;
      case -64: rawValue = dataView.getFloat64(byteOffset, false); break;
      default: return null;
    }

    const physValue = bzero + bscale * rawValue;
    data[i] = physValue;
    if (physValue < min) min = physValue;
    if (physValue > max) max = physValue;
    sum += physValue;
  }

  return {
    width,
    height,
    bitpix,
    data,
    min,
    max,
    mean: sum / totalPixels,
  };
}

export function generatePreviewImageData(
  pixelData: FITSPixelData,
  stretchMode: 'linear' | 'asinh' | 'log' | 'sqrt' = 'asinh',
  clipLow = 0.05,
  clipHigh = 0.995,
): ImageData {
  const { width, height, data } = pixelData;

  // Sort a sample to compute percentile-based clipping
  const sampleSize = Math.min(data.length, 100000);
  const step = Math.max(1, Math.floor(data.length / sampleSize));
  const sample: number[] = [];
  for (let i = 0; i < data.length; i += step) {
    sample.push(data[i]);
  }
  sample.sort((a, b) => a - b);

  const lo = sample[Math.floor(sample.length * clipLow)];
  const hi = sample[Math.floor(sample.length * clipHigh)];
  const range = hi - lo || 1;

  const imageData = new ImageData(width, height);
  const pixels = imageData.data;

  for (let i = 0; i < data.length; i++) {
    let normalized = (data[i] - lo) / range;
    normalized = Math.max(0, Math.min(1, normalized));

    let stretched: number;
    switch (stretchMode) {
      case 'linear': stretched = normalized; break;
      case 'log': stretched = normalized > 0 ? Math.log1p(normalized * 1000) / Math.log1p(1000) : 0; break;
      case 'sqrt': stretched = Math.sqrt(normalized); break;
      case 'asinh': {
        const a = 10;
        stretched = Math.asinh(normalized * a) / Math.asinh(a);
        break;
      }
    }

    const val = Math.round(stretched * 255);
    const idx = i * 4;
    pixels[idx] = val;
    pixels[idx + 1] = val;
    pixels[idx + 2] = val;
    pixels[idx + 3] = 255;
  }

  return imageData;
}

// ============================================================================
// Formatting Utilities
// ============================================================================

export { formatRA, formatDec } from '@/lib/astronomy/coordinates/formats';

export function formatPixelScale(arcsecPerPixel: number): string {
  if (arcsecPerPixel < 1) {
    return `${(arcsecPerPixel * 1000).toFixed(0)} mas/px`;
  }
  return `${arcsecPerPixel.toFixed(2)}"/px`;
}

export function formatExposure(seconds: number): string {
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs.toFixed(0)}s`;
}

// ============================================================================
// FITS File Detection
// ============================================================================

export function isFITSFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return name.endsWith('.fits') || name.endsWith('.fit') || name.endsWith('.fts') || name.endsWith('.xisf');
}

export function isXISFFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return name.endsWith('.xisf');
}

export async function parseXISFHeader(file: File): Promise<FITSMetadata | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = new TextDecoder().decode(reader.result as ArrayBuffer);
        // XISF header is XML - extract FITSKeyword elements
        const header: FITSHeader = {};
        const rawCards: string[] = [];

        // Parse FITSKeyword elements: <FITSKeyword name="KEY" value="VAL" comment="..." />
        const keywordRegex = new RegExp('<FITSKeyword\\s+name="([^"]+)"\\s+value="([^"]*)"[^>]*\\/>', 'g');
        let match;
        while ((match = keywordRegex.exec(text)) !== null) {
          const [, key, rawVal] = match;
          rawCards.push(`${key} = ${rawVal}`);
          // Try to parse as number, boolean, or string
          if (rawVal === 'T') header[key] = true;
          else if (rawVal === 'F') header[key] = false;
          else {
            const num = parseFloat(rawVal);
            header[key] = isNaN(num) ? rawVal.replace(/^'+|'+$/g, '').trim() : num;
          }
        }

        // Also extract Geometry for dimensions
        const geomMatch = text.match(/Geometry="(\d+):(\d+):\d+"/);
        if (geomMatch) {
          header['NAXIS'] = 2;
          header['NAXIS1'] = parseInt(geomMatch[1]);
          header['NAXIS2'] = parseInt(geomMatch[2]);
        }

        const sampleFormatMatch = text.match(/sampleFormat="(\w+)"/i);
        if (sampleFormatMatch) {
          const fmt = sampleFormatMatch[1].toLowerCase();
          if (fmt.includes('float32')) header['BITPIX'] = -32;
          else if (fmt.includes('float64')) header['BITPIX'] = -64;
          else if (fmt.includes('uint16') || fmt.includes('int16')) header['BITPIX'] = 16;
          else if (fmt.includes('uint8') || fmt.includes('int8')) header['BITPIX'] = 8;
          else if (fmt.includes('uint32') || fmt.includes('int32')) header['BITPIX'] = 32;
        }

        if (Object.keys(header).length === 0) {
          resolve(null);
          return;
        }

        const metadata: FITSMetadata = {
          header,
          rawCards,
          image: extractImageInfo(header),
          wcs: extractWCSInfo(header),
          observation: extractObservationInfo(header),
          telescope: extractTelescopeInfo(header),
          camera: extractCameraInfo(header),
          site: extractSiteInfo(header),
          processing: extractProcessingInfo(header),
          sip: extractSIPCoefficients(header),
        };
        resolve(metadata);
      } catch {
        resolve(null);
      }
    };
    reader.onerror = () => resolve(null);
    // Read first 1MB for XISF XML header (should be enough)
    reader.readAsArrayBuffer(file.slice(0, 1024 * 1024));
  });
}

export async function validateFITSFile(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const buffer = reader.result as ArrayBuffer;
      const view = new Uint8Array(buffer);
      // Check "SIMPLE  =" magic bytes (FITS standard requirement)
      const magic = String.fromCharCode(...view.slice(0, 9));
      resolve(magic.startsWith('SIMPLE') && magic.includes('='));
    };
    reader.onerror = () => resolve(false);
    reader.readAsArrayBuffer(file.slice(0, 80));
  });
}
