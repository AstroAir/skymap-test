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

export interface FITSMetadata {
  header: FITSHeader;
  image?: FITSImageInfo;
  wcs?: WCSInfo;
  observation?: FITSObservationInfo;
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
  return name.endsWith('.fits') || name.endsWith('.fit') || name.endsWith('.fts');
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
