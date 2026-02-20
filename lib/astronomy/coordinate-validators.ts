/**
 * Coordinate validation helpers
 * Pure validation functions for astronomical coordinate inputs
 */
import { parseDecCoordinate, parseRACoordinate } from '@/lib/astronomy/object-resolver/parser';

// ============================================================================
// RA Validation
// ============================================================================

/**
 * Validate a Right Ascension input string.
 * Supports decimal degrees (0-360), HMS format (e.g. 00h42m44s), and colon format (00:42:44).
 */
export function isValidRA(value: string): boolean {
  if (!value.trim()) return true;
  return parseRACoordinate(value) !== null;
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
  return parseDecCoordinate(value) !== null;
}
