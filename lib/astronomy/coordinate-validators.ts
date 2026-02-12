/**
 * Coordinate validation helpers
 * Pure validation functions for astronomical coordinate inputs
 */

// ============================================================================
// RA Validation
// ============================================================================

/**
 * Validate a Right Ascension input string.
 * Supports decimal degrees (0-360), HMS format (e.g. 00h42m44s), and colon format (00:42:44).
 */
export function isValidRA(value: string): boolean {
  if (!value.trim()) return true; // Empty is valid (optional field)
  // Check decimal format (0-360)
  const decimal = parseFloat(value);
  if (!isNaN(decimal) && decimal >= 0 && decimal < 360 && /^[\d.]+$/.test(value.trim())) return true;
  // Check HMS format with component range validation
  const hmsMatch = value.match(/^(\d+)h\s*(\d+)m\s*([\d.]+)s?$/i);
  if (hmsMatch) {
    const h = parseInt(hmsMatch[1], 10);
    const m = parseInt(hmsMatch[2], 10);
    const s = parseFloat(hmsMatch[3]);
    return h >= 0 && h < 24 && m >= 0 && m < 60 && s >= 0 && s < 60;
  }
  // Check colon format with component range validation
  const colonMatch = value.match(/^(\d+):(\d+):([\d.]+)$/);
  if (colonMatch) {
    const h = parseInt(colonMatch[1], 10);
    const m = parseInt(colonMatch[2], 10);
    const s = parseFloat(colonMatch[3]);
    return h >= 0 && h < 24 && m >= 0 && m < 60 && s >= 0 && s < 60;
  }
  return false;
}

// ============================================================================
// Dec Validation
// ============================================================================

/**
 * Validate a Declination input string.
 * Supports decimal degrees (-90 to 90), DMS format (e.g. +41°16′09″), and colon format (+41:16:09).
 */
export function isValidDec(value: string): boolean {
  if (!value.trim()) return true; // Empty is valid (optional field)
  // Check decimal format (-90 to 90)
  const decimal = parseFloat(value);
  if (!isNaN(decimal) && decimal >= -90 && decimal <= 90 && /^[+-]?[\d.]+$/.test(value.trim())) return true;
  // Check DMS format with component range validation
  const dmsMatch = value.match(/^([+-]?)(\d+)[°d]\s*(\d+)[′']\s*([\d.]+)[″"]?$/i);
  if (dmsMatch) {
    const sign = dmsMatch[1] === '-' ? -1 : 1;
    const d = parseInt(dmsMatch[2], 10);
    const m = parseInt(dmsMatch[3], 10);
    const s = parseFloat(dmsMatch[4]);
    if (m >= 60 || s >= 60) return false;
    const total = sign * (d + m / 60 + s / 3600);
    return total >= -90 && total <= 90;
  }
  // Check colon format with component range validation
  const colonMatch = value.match(/^([+-]?)(\d+):(\d+):([\d.]+)$/);
  if (colonMatch) {
    const sign = colonMatch[1] === '-' ? -1 : 1;
    const d = parseInt(colonMatch[2], 10);
    const m = parseInt(colonMatch[3], 10);
    const s = parseFloat(colonMatch[4]);
    if (m >= 60 || s >= 60) return false;
    const total = sign * (d + m / 60 + s / 3600);
    return total >= -90 && total <= 90;
  }
  return false;
}
