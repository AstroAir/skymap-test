import { normalizeWhitespace } from './normalize';

export interface ParsedCoordinate {
  ra: number;
  dec: number;
  format: 'decimal' | 'sexagesimal' | 'jname';
}

function parseSexagesimalParts(value: string): number[] | null {
  const normalized = value
    .replace(/[hHdD°]/g, ':')
    .replace(/[mM′']/g, ':')
    .replace(/[sS″"]/g, '')
    .trim();

  if (!normalized) return null;

  const parts = normalized
    .split(/[:\s]+/)
    .filter(Boolean)
    .map((part) => Number.parseFloat(part));

  if (parts.length < 2 || parts.length > 3 || parts.some((part) => Number.isNaN(part))) {
    return null;
  }

  if (parts.length === 2) parts.push(0);
  return parts as number[];
}

function parseHmsToDegrees(raw: string): number | null {
  const value = normalizeWhitespace(raw);
  if (!value) return null;

  const explicitDecimal = value.match(/^[+]?\d+(?:\.\d+)?$/);
  if (explicitDecimal) {
    const deg = Number.parseFloat(value);
    if (deg < 0 || deg > 360) return null;
    return deg;
  }

  const parts = parseSexagesimalParts(value);
  if (!parts) return null;
  const [hours, minutes, seconds] = parts;

  if (hours < 0 || hours >= 24 || minutes < 0 || minutes >= 60 || seconds < 0 || seconds >= 60) {
    return null;
  }

  return (hours + minutes / 60 + seconds / 3600) * 15;
}

function parseDmsToDegrees(raw: string): number | null {
  const value = normalizeWhitespace(raw);
  if (!value) return null;

  const explicitDecimal = value.match(/^[+-]?\d+(?:\.\d+)?$/);
  if (explicitDecimal) {
    const deg = Number.parseFloat(value);
    if (deg < -90 || deg > 90) return null;
    return deg;
  }

  const sign = value.startsWith('-') ? -1 : 1;
  const unsigned = value.replace(/^[+-]/, '');
  const parts = parseSexagesimalParts(unsigned);
  if (!parts) return null;

  const [degrees, minutes, seconds] = parts;
  if (degrees < 0 || degrees > 90 || minutes < 0 || minutes >= 60 || seconds < 0 || seconds >= 60) {
    return null;
  }

  const result = sign * (degrees + minutes / 60 + seconds / 3600);
  if (result < -90 || result > 90) return null;
  return result;
}

export function parseRACoordinate(input: string): number | null {
  return parseHmsToDegrees(input);
}

export function parseDecCoordinate(input: string): number | null {
  return parseDmsToDegrees(input);
}

export function parseCoordinateScalar(input: string): number | null {
  const value = normalizeWhitespace(input);
  if (!value) return null;

  const decimal = Number.parseFloat(value);
  if (Number.isFinite(decimal) && /^[+-]?\d+(?:\.\d+)?$/.test(value)) {
    return decimal;
  }

  const ra = parseHmsToDegrees(value);
  if (ra !== null) return ra;

  const dec = parseDmsToDegrees(value);
  if (dec !== null) return dec;

  return null;
}

interface JNameMatch {
  ra: number;
  dec: number;
}

export function extractJNameCoordinates(input: string): JNameMatch | null {
  const match = input.match(/J([0-2]\d)([0-5]\d)([0-5]\d)(\d{0,3})([+-])(\d{2})([0-5]\d)([0-5]\d)(\d{0,3})/i);
  if (!match) return null;

  const raHours = Number.parseInt(match[1], 10);
  const raMinutes = Number.parseInt(match[2], 10);
  const raSecondsBase = Number.parseInt(match[3], 10);
  const raFracRaw = match[4] || '';
  const raFrac = raFracRaw ? Number.parseInt(raFracRaw, 10) / 10 ** raFracRaw.length : 0;
  const raSeconds = raSecondsBase + raFrac;

  const decSign = match[5] === '-' ? -1 : 1;
  const decDegrees = Number.parseInt(match[6], 10);
  const decMinutes = Number.parseInt(match[7], 10);
  const decSecondsBase = Number.parseInt(match[8], 10);
  const decFracRaw = match[9] || '';
  const decFrac = decFracRaw ? Number.parseInt(decFracRaw, 10) / 10 ** decFracRaw.length : 0;
  const decSeconds = decSecondsBase + decFrac;

  if (
    raHours >= 24 || raMinutes >= 60 || raSeconds >= 60 ||
    decDegrees > 90 || decMinutes >= 60 || decSeconds >= 60
  ) {
    return null;
  }

  const ra = (raHours + raMinutes / 60 + raSeconds / 3600) * 15;
  const dec = decSign * (decDegrees + decMinutes / 60 + decSeconds / 3600);
  return { ra, dec };
}

function trySplitAndParse(query: string): ParsedCoordinate | null {
  const compact = normalizeWhitespace(query);
  if (!compact) return null;

  const commaParts = compact.split(/\s*,\s*/);
  if (commaParts.length === 2) {
    const ra = parseRACoordinate(commaParts[0]);
    const dec = parseDecCoordinate(commaParts[1]);
    if (ra !== null && dec !== null) {
      const format = /^[+-]?\d/.test(commaParts[0]) && /^[+-]?\d/.test(commaParts[1]) ? 'decimal' : 'sexagesimal';
      return { ra, dec, format };
    }
  }

  const tokens = compact.split(/\s+/);
  for (let split = 1; split < tokens.length; split++) {
    const left = tokens.slice(0, split).join(' ');
    const right = tokens.slice(split).join(' ');
    const ra = parseRACoordinate(left);
    const dec = parseDecCoordinate(right);
    if (ra === null || dec === null) continue;

    const format = /^[+-]?\d+(?:\.\d+)?$/.test(left) && /^[+-]?\d+(?:\.\d+)?$/.test(right)
      ? 'decimal'
      : 'sexagesimal';
    return { ra, dec, format };
  }

  return null;
}

export function parseCoordinateQuery(input: string): ParsedCoordinate | null {
  const trimmed = normalizeWhitespace(input);
  if (!trimmed) return null;

  const jNameCoordinates = extractJNameCoordinates(trimmed);
  if (jNameCoordinates) {
    return {
      ...jNameCoordinates,
      format: 'jname',
    };
  }

  return trySplitAndParse(trimmed);
}
