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

function parseHeaderCard(card: string): { key: string; value: string | number | boolean | undefined } {
  const key = card.substring(0, 8).trim();
  
  if (key === '' || key === 'END') {
    return { key, value: undefined };
  }
  
  if (card[8] !== '=' || card[9] !== ' ') {
    return { key, value: card.substring(10).trim() };
  }
  
  let valueStr = card.substring(10).trim();
  
  const commentIdx = valueStr.indexOf('/');
  if (commentIdx > 0 && !valueStr.startsWith("'")) {
    valueStr = valueStr.substring(0, commentIdx).trim();
  }
  
  if (valueStr.startsWith("'")) {
    const endQuote = valueStr.indexOf("'", 1);
    if (endQuote > 0) {
      return { key, value: valueStr.substring(1, endQuote).trim() };
    }
    return { key, value: valueStr.substring(1).trim() };
  }
  
  if (valueStr === 'T') return { key, value: true };
  if (valueStr === 'F') return { key, value: false };
  
  const numValue = parseFloat(valueStr);
  if (!isNaN(numValue)) {
    return { key, value: numValue };
  }
  
  return { key, value: valueStr };
}

function parseHeaderBlock(buffer: ArrayBuffer): { header: FITSHeader; cards: string[]; complete: boolean } {
  const header: FITSHeader = {};
  const cards: string[] = [];
  const view = new Uint8Array(buffer);
  let complete = false;
  
  const numCards = Math.floor(view.length / FITS_CARD_SIZE);
  
  for (let i = 0; i < numCards; i++) {
    const cardBytes = view.slice(i * FITS_CARD_SIZE, (i + 1) * FITS_CARD_SIZE);
    const card = String.fromCharCode(...cardBytes);
    cards.push(card);
    
    const { key, value } = parseHeaderCard(card);
    
    if (key === 'END') {
      complete = true;
      break;
    }
    
    if (key && value !== undefined) {
      header[key] = value;
    }
  }
  
  return { header, cards, complete };
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
        
        while (!complete && offset < buffer.byteLength) {
          const blockEnd = Math.min(offset + FITS_BLOCK_SIZE, buffer.byteLength);
          const block = buffer.slice(offset, blockEnd);
          const { header, cards, complete: isComplete } = parseHeaderBlock(block);
          
          Object.assign(fullHeader, header);
          allCards = allCards.concat(cards);
          complete = isComplete;
          offset += FITS_BLOCK_SIZE;
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
    
    const headerSize = Math.min(file.size, FITS_BLOCK_SIZE * 10);
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
  
  const cd1_1 = (header['CD1_1'] as number) || (header['CDELT1'] as number) || 0;
  const cd1_2 = (header['CD1_2'] as number) || 0;
  const cd2_1 = (header['CD2_1'] as number) || 0;
  const cd2_2 = (header['CD2_2'] as number) || (header['CDELT2'] as number) || 0;
  
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

export function formatRA(degrees: number): string {
  const hours = degrees / 15;
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  const s = ((hours - h) * 60 - m) * 60;
  return `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toFixed(2).padStart(5, '0')}s`;
}

export function formatDec(degrees: number): string {
  const sign = degrees >= 0 ? '+' : '-';
  const abs = Math.abs(degrees);
  const d = Math.floor(abs);
  const m = Math.floor((abs - d) * 60);
  const s = ((abs - d) * 60 - m) * 60;
  return `${sign}${d.toString().padStart(2, '0')}° ${m.toString().padStart(2, '0')}' ${s.toFixed(1).padStart(4, '0')}"`;
}

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
      const magic = String.fromCharCode(...view.slice(0, 6));
      resolve(magic === 'SIMPLE');
    };
    reader.onerror = () => resolve(false);
    reader.readAsArrayBuffer(file.slice(0, 10));
  });
}
