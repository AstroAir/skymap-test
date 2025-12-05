/**
 * Coordinate formatting utilities
 */

import { degreesToHMS, degreesToDMS } from './conversions';

// ============================================================================
// RA/Dec Formatting
// ============================================================================

/**
 * Format RA in standard format
 * @param raDeg - Right Ascension in degrees
 * @param precision - Number of decimal places for seconds
 */
export function formatRA(raDeg: number, precision: number = 1): string {
  const totalHours = raDeg / 15;
  const h = Math.floor(totalHours);
  const remainingHours = totalHours - h;
  const totalMinutes = remainingHours * 60;
  const m = Math.floor(totalMinutes);
  const remainingMinutes = totalMinutes - m;
  const s = remainingMinutes * 60;
  
  const hStr = String(h).padStart(2, '0');
  const mStr = String(m).padStart(2, '0');
  const sStr = s.toFixed(precision).padStart(precision + 3, '0');

  return `${hStr}h ${mStr}m ${sStr}s`;
}

/**
 * Format Dec in standard format
 * @param decDeg - Declination in degrees
 * @param precision - Number of decimal places for arcseconds
 */
export function formatDec(decDeg: number, precision: number = 1): string {
  const sign = decDeg < 0 ? '-' : '+';
  const deg = Math.abs(decDeg);
  const d = Math.floor(deg);
  const remainingDeg = deg - d;
  const totalMinutes = remainingDeg * 60;
  const m = Math.floor(totalMinutes);
  const remainingMinutes = totalMinutes - m;
  const s = remainingMinutes * 60;

  const dStr = String(d).padStart(2, '0');
  const mStr = String(m).padStart(2, '0');
  const sStr = s.toFixed(precision).padStart(precision + 3, '0');

  return `${sign}${dStr}° ${mStr}' ${sStr}"`;
}

/**
 * Format coordinates as a pair
 */
export function formatCoordinates(
  raDeg: number, 
  decDeg: number, 
  format: 'hms' | 'degrees' = 'hms'
): { ra: string; dec: string } {
  if (format === 'hms') {
    return {
      ra: degreesToHMS(raDeg),
      dec: degreesToDMS(decDeg),
    };
  }
  return {
    ra: raDeg.toFixed(4) + '°',
    dec: decDeg.toFixed(4) + '°',
  };
}

// ============================================================================
// Alt/Az Formatting
// ============================================================================

/**
 * Format altitude
 * @param alt - Altitude in degrees
 */
export function formatAltitude(alt: number): string {
  const sign = alt < 0 ? '-' : '+';
  return `${sign}${Math.abs(alt).toFixed(1)}°`;
}

/**
 * Format azimuth
 * @param az - Azimuth in degrees (0-360)
 */
export function formatAzimuth(az: number): string {
  return `${az.toFixed(1)}°`;
}

/**
 * Get cardinal direction from azimuth
 */
export function getCardinalDirection(az: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 
                      'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(az / 22.5) % 16;
  return directions[index];
}

/**
 * Format azimuth with cardinal direction
 */
export function formatAzimuthWithDirection(az: number): string {
  return `${az.toFixed(1)}° (${getCardinalDirection(az)})`;
}

// ============================================================================
// Angular Size Formatting
// ============================================================================

/**
 * Format angular size
 * @param widthArcmin - Width in arcminutes
 * @param heightArcmin - Height in arcminutes (optional)
 */
export function formatAngularSize(
  widthArcmin?: number, 
  heightArcmin?: number
): string | undefined {
  if (!widthArcmin) return undefined;
  
  if (!heightArcmin || widthArcmin === heightArcmin) {
    if (widthArcmin < 1) {
      return `${(widthArcmin * 60).toFixed(1)}"`;
    }
    return `${widthArcmin.toFixed(1)}'`;
  }
  
  if (widthArcmin < 1 && heightArcmin < 1) {
    return `${(widthArcmin * 60).toFixed(1)}" × ${(heightArcmin * 60).toFixed(1)}"`;
  }
  return `${widthArcmin.toFixed(1)}' × ${heightArcmin.toFixed(1)}'`;
}

// ============================================================================
// Distance Formatting
// ============================================================================

/**
 * Format angular separation
 * @param degrees - Separation in degrees
 */
export function formatSeparation(degrees: number): string {
  if (degrees < 1 / 60) {
    // Less than 1 arcminute, show in arcseconds
    return `${(degrees * 3600).toFixed(1)}"`;
  }
  if (degrees < 1) {
    // Less than 1 degree, show in arcminutes
    return `${(degrees * 60).toFixed(1)}'`;
  }
  return `${degrees.toFixed(1)}°`;
}
