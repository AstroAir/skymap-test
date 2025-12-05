/**
 * Eclipse data service
 */

import type { SolarEclipse, LunarEclipse, AstroEvent } from './types';

// ============================================================================
// Known Eclipses (2024-2026)
// ============================================================================

/**
 * Upcoming solar eclipses
 * Data from NASA Eclipse Predictions
 */
export const SOLAR_ECLIPSES: SolarEclipse[] = [
  {
    id: 'solar-2024-04-08',
    type: 'eclipse',
    name: 'Total Solar Eclipse',
    date: new Date('2024-04-08T18:18:00Z'),
    eclipseType: 'total',
    pathWidth: 185,
    duration: 268,
    maxEclipse: new Date('2024-04-08T18:17:00Z'),
    description: 'Total eclipse visible across North America',
    visibility: 'excellent',
    source: 'NASA',
  },
  {
    id: 'solar-2024-10-02',
    type: 'eclipse',
    name: 'Annular Solar Eclipse',
    date: new Date('2024-10-02T18:46:00Z'),
    eclipseType: 'annular',
    pathWidth: 266,
    duration: 444,
    description: 'Annular eclipse visible from South America',
    visibility: 'fair',
    source: 'NASA',
  },
  {
    id: 'solar-2025-03-29',
    type: 'eclipse',
    name: 'Partial Solar Eclipse',
    date: new Date('2025-03-29T10:48:00Z'),
    eclipseType: 'partial',
    description: 'Partial eclipse visible from Europe, Africa',
    visibility: 'fair',
    source: 'NASA',
  },
  {
    id: 'solar-2025-09-21',
    type: 'eclipse',
    name: 'Partial Solar Eclipse',
    date: new Date('2025-09-21T19:43:00Z'),
    eclipseType: 'partial',
    description: 'Partial eclipse visible from Pacific, Australia',
    visibility: 'fair',
    source: 'NASA',
  },
  {
    id: 'solar-2026-02-17',
    type: 'eclipse',
    name: 'Annular Solar Eclipse',
    date: new Date('2026-02-17T12:13:00Z'),
    eclipseType: 'annular',
    pathWidth: 289,
    duration: 132,
    description: 'Annular eclipse visible from Antarctica',
    visibility: 'poor',
    source: 'NASA',
  },
  {
    id: 'solar-2026-08-12',
    type: 'eclipse',
    name: 'Total Solar Eclipse',
    date: new Date('2026-08-12T17:47:00Z'),
    eclipseType: 'total',
    pathWidth: 294,
    duration: 132,
    description: 'Total eclipse visible from Spain, Iceland, Greenland',
    visibility: 'good',
    source: 'NASA',
  },
];

/**
 * Upcoming lunar eclipses
 */
export const LUNAR_ECLIPSES: LunarEclipse[] = [
  {
    id: 'lunar-2024-03-25',
    type: 'eclipse',
    name: 'Penumbral Lunar Eclipse',
    date: new Date('2024-03-25T07:13:00Z'),
    eclipseType: 'penumbral',
    duration: 279,
    description: 'Subtle penumbral eclipse',
    visibility: 'fair',
    source: 'NASA',
  },
  {
    id: 'lunar-2024-09-18',
    type: 'eclipse',
    name: 'Partial Lunar Eclipse',
    date: new Date('2024-09-18T02:44:00Z'),
    eclipseType: 'partial',
    duration: 63,
    description: 'Partial eclipse visible from Americas, Europe, Africa',
    visibility: 'good',
    source: 'NASA',
  },
  {
    id: 'lunar-2025-03-14',
    type: 'eclipse',
    name: 'Total Lunar Eclipse',
    date: new Date('2025-03-14T06:58:00Z'),
    eclipseType: 'total',
    duration: 65,
    maxEclipse: new Date('2025-03-14T06:58:00Z'),
    description: 'Total eclipse visible from Americas, Pacific',
    visibility: 'excellent',
    source: 'NASA',
  },
  {
    id: 'lunar-2025-09-07',
    type: 'eclipse',
    name: 'Total Lunar Eclipse',
    date: new Date('2025-09-07T18:12:00Z'),
    eclipseType: 'total',
    duration: 82,
    maxEclipse: new Date('2025-09-07T18:12:00Z'),
    description: 'Total eclipse visible from Europe, Africa, Asia',
    visibility: 'excellent',
    source: 'NASA',
  },
];

// ============================================================================
// Eclipse Functions
// ============================================================================

/**
 * Get upcoming eclipses
 * @param months - Number of months ahead
 * @returns All upcoming eclipses
 */
export function getUpcomingEclipses(months: number = 24): AstroEvent[] {
  const now = new Date();
  const endDate = new Date(now);
  endDate.setMonth(endDate.getMonth() + months);
  
  const allEclipses: AstroEvent[] = [
    ...SOLAR_ECLIPSES,
    ...LUNAR_ECLIPSES,
  ];
  
  return allEclipses
    .filter(e => e.date >= now && e.date <= endDate)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Get next solar eclipse
 */
export function getNextSolarEclipse(): SolarEclipse | null {
  const now = new Date();
  return SOLAR_ECLIPSES.find(e => e.date >= now) ?? null;
}

/**
 * Get next lunar eclipse
 */
export function getNextLunarEclipse(): LunarEclipse | null {
  const now = new Date();
  return LUNAR_ECLIPSES.find(e => e.date >= now) ?? null;
}

/**
 * Check if an eclipse is visible from a location
 * This is a simplified check - real visibility depends on many factors
 * @param eclipse - Eclipse event data (reserved for visibility calculation)
 * @param latitude - Observer latitude (reserved for geographic calculation)
 * @param longitude - Observer longitude (reserved for geographic calculation)
 */
export function isEclipseVisible(
  eclipse: AstroEvent,
  latitude: number,
  longitude: number
): boolean {
  // Simplified: would need proper geographic calculations
  // Parameters reserved for future implementation
  void eclipse;
  void latitude;
  void longitude;
  return true;
}
