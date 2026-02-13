/**
 * Re-export shim for backward compatibility.
 *
 * All implementations now live in modular subdirectories:
 *   coordinates/, time/
 *
 * Prefer importing directly from those modules for new code.
 * @module
 */

// ============================================================================
// Coordinate conversions
// ============================================================================

export {
  degreesToHMS,
  degreesToDMS,
  hmsToDegrees,
  dmsToDegrees,
  rad2deg,
  deg2rad,
} from './coordinates/conversions';

export { raDecToAltAz, altAzToRaDec } from './coordinates/transforms';

// ============================================================================
// Time calculations
// ============================================================================

export { getJulianDate } from './time/julian';
export { utcToMJD, mjdToUTC } from './time/julian';
export { getGST } from './time/sidereal';
export { getLST } from './time/sidereal';

// ============================================================================
// Time formatting
// ============================================================================

export { formatTime, formatDateForInput, wait } from './time/formats';

/**
 * Format time for input[type="time"]
 * Includes seconds for astronomical precision (requires step="1" on input)
 */
export function formatTimeForInput(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}
