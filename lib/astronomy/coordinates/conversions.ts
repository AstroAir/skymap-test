/**
 * Basic coordinate conversions
 * Converts between different angle units and representations
 */
import {
  parseCoordinateScalar as parseCoordinateScalarValue,
  parseDecCoordinate as parseDecCoordinateValue,
  parseRACoordinate as parseRACoordinateValue,
} from '@/lib/astronomy/object-resolver/parser';

// ============================================================================
// Angle Unit Conversions
// ============================================================================

/**
 * Convert radians to degrees
 */
export function rad2deg(rad: number): number {
  return rad * (180 / Math.PI);
}

/**
 * Convert degrees to radians
 */
export function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

// ============================================================================
// Hours/Degrees Conversions
// ============================================================================

/**
 * Convert hours to degrees
 */
export function hoursToDegrees(hours: number): number {
  return hours * 15;
}

/**
 * Convert degrees to hours
 */
export function degreesToHours(degrees: number): number {
  return degrees / 15;
}

// ============================================================================
// HMS (Hours:Minutes:Seconds) Conversions
// ============================================================================

/**
 * Convert degrees to Hours:Minutes:Seconds format (for RA)
 * @param deg - Angle in degrees
 * @returns Formatted string like "12:34:56.7"
 */
export function degreesToHMS(deg: number): string {
  const totalHours = deg / 15;
  const h = Math.floor(totalHours);
  const remainingHours = totalHours - h;
  const totalMinutes = remainingHours * 60;
  const m = Math.floor(totalMinutes);
  const remainingMinutes = totalMinutes - m;
  const s = remainingMinutes * 60;
  
  const hStr = String(h);
  const mStr = String(m).padStart(2, '0');
  const sStr = s.toFixed(1).padStart(4, '0');

  return `${hStr}:${mStr}:${sStr}`;
}

/**
 * Convert HMS string to degrees
 * @param hmsString - String in format "HH:MM:SS.s"
 * @returns Angle in degrees
 */
export function hmsToDegrees(hmsString: string): number {
  const parts = hmsString.split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const seconds = parseFloat(parts[2]);
  return hours * 15 + minutes * (15 / 60) + seconds * (15 / 3600);
}

// ============================================================================
// DMS (Degrees:Minutes:Seconds) Conversions
// ============================================================================

/**
 * Convert degrees to Degrees:Minutes:Seconds format (for Dec)
 * @param deg - Angle in degrees
 * @returns Formatted string like "+45:30:00.0"
 */
export function degreesToDMS(deg: number): string {
  const sign = deg < 0 ? '-' : '+';
  deg = Math.abs(deg);
  const d = Math.floor(deg);
  const remainingDeg = deg - d;
  const totalMinutes = remainingDeg * 60;
  const m = Math.floor(totalMinutes);
  const remainingMinutes = totalMinutes - m;
  const s = remainingMinutes * 60;

  const dStr = String(d).padStart(2, '0');
  const mStr = String(m).padStart(2, '0');
  const sStr = s.toFixed(1).padStart(4, '0');

  return `${sign}${dStr}:${mStr}:${sStr}`;
}

/**
 * Convert DMS string to degrees
 * @param dmsString - String in format "+DD:MM:SS.s" or "-DD:MM:SS.s"
 * @returns Angle in degrees
 */
export function dmsToDegrees(dmsString: string): number {
  const sign = dmsString.startsWith('-') ? -1 : 1;
  const stripped = dmsString.replace('-', '').replace('+', '');
  const parts = stripped.split(':');
  const degrees = parseFloat(parts[0]);
  const minutes = parseFloat(parts[1]);
  const seconds = parseFloat(parts[2]);

  return sign * (degrees + minutes / 60 + seconds / 3600);
}

// ============================================================================
// Parsing Functions
// ============================================================================

/**
 * Parse coordinate string in various formats
 * Supports: "12h 34m 56s", "12:34:56", "12 34 56", etc.
 */
export function parseCoordinateString(str: string): number | null {
  return parseCoordinateScalarValue(str);
}

// ============================================================================
// RA/Dec Coordinate Parsing with Validation
// ============================================================================

/**
 * Parse a Right Ascension coordinate string with range validation.
 * Supports decimal degrees (0-360) and HMS format ("00h42m44s" or "00:42:44").
 * @returns RA in degrees, or null if invalid
 */
export function parseRACoordinate(value: string): number | null {
  return parseRACoordinateValue(value);
}

/**
 * Parse a Declination coordinate string with range validation.
 * Supports decimal degrees (-90 to 90) and DMS format ("+41°16'09\"" or "+41:16:09").
 * @returns Dec in degrees, or null if invalid
 */
export function parseDecCoordinate(value: string): number | null {
  return parseDecCoordinateValue(value);
}
