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
  if (!value.trim()) return true;
  // Check decimal format (0-360)
  const decimal = parseFloat(value);
  if (!isNaN(decimal) && decimal >= 0 && decimal < 360) return true;
  // Check HMS format
  if (/^\d+h\s*\d+m\s*[\d.]+s?$/i.test(value)) return true;
  // Check colon format
  if (/^\d+:\d+:[\d.]+$/.test(value)) return true;
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
  if (!value.trim()) return true;
  // Check decimal format (-90 to 90)
  const decimal = parseFloat(value);
  if (!isNaN(decimal) && decimal >= -90 && decimal <= 90) return true;
  // Check DMS format
  if (/^[+-]?\d+[°d]\s*\d+[′']\s*[\d.]+[″"]?$/i.test(value)) return true;
  // Check colon format
  if (/^[+-]?\d+:\d+:[\d.]+$/.test(value)) return true;
  return false;
}
