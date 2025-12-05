/**
 * Comet tracking service
 */

import type { CometEvent } from './types';

// ============================================================================
// Notable Comets
// ============================================================================

/**
 * Current notable comets
 * Updated periodically from MPC and other sources
 */
export const NOTABLE_COMETS: CometEvent[] = [
  {
    id: 'comet-c2023-a3',
    type: 'comet',
    name: 'C/2023 A3 (Tsuchinshan-ATLAS)',
    cometName: 'C/2023 A3',
    date: new Date('2024-10-12'),
    perihelionDate: new Date('2024-09-27'),
    perihelionDistance: 0.391,
    expectedMagnitude: 0,
    tailLength: 60,
    description: 'Potentially naked-eye visible comet',
    visibility: 'excellent',
    ra: 200,
    dec: -15,
    source: 'MPC',
  },
  {
    id: 'comet-12p',
    type: 'comet',
    name: '12P/Pons-Brooks',
    cometName: '12P/Pons-Brooks',
    date: new Date('2024-04-21'),
    perihelionDate: new Date('2024-04-21'),
    perihelionDistance: 0.781,
    expectedMagnitude: 4.5,
    description: 'Devil Comet - Halley-type with outbursts',
    visibility: 'good',
    source: 'MPC',
  },
];

// ============================================================================
// Data Source URLs
// ============================================================================

export const COMET_DATA_SOURCES = {
  mpc: 'https://www.minorplanetcenter.net/iau/Ephemerides/Comets/Soft03Cmt.txt',
  jpl: 'https://ssd-api.jpl.nasa.gov/sbdb_query.api',
  cobs: 'https://www.cobs.si/',
} as const;

// ============================================================================
// Comet Functions
// ============================================================================

/**
 * Get bright comets (magnitude < 10)
 */
export function getBrightComets(): CometEvent[] {
  const now = new Date();
  return NOTABLE_COMETS.filter(c => {
    // Within 6 months of perihelion
    const periDiff = Math.abs(c.perihelionDate!.getTime() - now.getTime());
    const monthsFromPeri = periDiff / (30 * 24 * 3600 * 1000);
    return monthsFromPeri < 6 && c.expectedMagnitude < 10;
  });
}

/**
 * Get all tracked comets
 */
export function getTrackedComets(): CometEvent[] {
  return [...NOTABLE_COMETS];
}

/**
 * Estimate comet magnitude
 * Using standard magnitude formula: m = H + 5*log10(delta) + 2.5*n*log10(r)
 */
export function estimateCometMagnitude(
  absoluteMag: number,
  sunDistance: number, // AU
  earthDistance: number, // AU
  activityIndex: number = 4 // n, typically 2-6
): number {
  return absoluteMag + 
    5 * Math.log10(earthDistance) + 
    2.5 * activityIndex * Math.log10(sunDistance);
}

/**
 * Parse comet name
 */
export function parseCometName(name: string): {
  type: 'periodic' | 'parabolic' | 'hyperbolic';
  number?: number;
  designation?: string;
  discoverer?: string;
} {
  // Periodic comet (e.g., "12P/Pons-Brooks")
  const periodicMatch = name.match(/^(\d+)P\/(.+)$/);
  if (periodicMatch) {
    return {
      type: 'periodic',
      number: parseInt(periodicMatch[1]),
      discoverer: periodicMatch[2],
    };
  }
  
  // Non-periodic comet (e.g., "C/2023 A3")
  const npMatch = name.match(/^([CDPX])\/(\d{4}\s+\w+)(?:\s+\((.+)\))?$/);
  if (npMatch) {
    return {
      type: npMatch[1] === 'C' ? 'parabolic' : 'hyperbolic',
      designation: npMatch[2],
      discoverer: npMatch[3],
    };
  }
  
  return { type: 'parabolic', designation: name };
}

/**
 * Calculate comet position (simplified)
 * For accurate positions, use a proper ephemeris
 * @param comet - Comet event data (reserved for future orbital calculation)
 * @param date - Date for position calculation (reserved for future use)
 */
export function getCometPosition(
  comet: CometEvent,
  date: Date = new Date()
): { ra: number; dec: number } | null {
  // This would require orbital elements and proper calculations
  // Parameters reserved for future implementation
  void comet;
  void date;
  return null;
}
