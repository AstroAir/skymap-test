/**
 * Celestial reference point navigation utilities
 * Pure functions for calculating coordinates of well-known celestial reference points
 */

import { getLST } from './starmap-utils';
import type { CelestialDirection } from '@/types/starmap/controls';

export interface CelestialReferencePoint {
  ra: number;
  dec: number;
}

/**
 * Get the RA/Dec coordinates of a celestial reference point
 *
 * Reference points:
 * - NCP (North Celestial Pole): RA=0°, Dec=+90°
 * - SCP (South Celestial Pole): RA=0°, Dec=-90°
 * - Vernal Equinox (春分点): RA=0°, Dec=0°
 * - Autumnal Equinox (秋分点): RA=180°, Dec=0°
 * - Zenith: Dec = observer latitude, RA = current LST
 *
 * @param direction - The celestial direction to navigate to
 * @param latitude - Observer latitude (only needed for zenith)
 * @param longitude - Observer longitude (only needed for zenith)
 */
export function getCelestialReferencePoint(
  direction: CelestialDirection,
  latitude: number = 0,
  longitude: number = 0,
): CelestialReferencePoint {
  switch (direction) {
    case 'NCP':
      return { ra: 0, dec: 90 };
    case 'SCP':
      return { ra: 0, dec: -90 };
    case 'vernal':
      return { ra: 0, dec: 0 };
    case 'autumnal':
      return { ra: 180, dec: 0 };
    case 'zenith':
      return { ra: getLST(longitude), dec: latitude };
  }
}
