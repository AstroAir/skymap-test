/**
 * Coordinate formatting utilities
 * Converts RA/Dec degrees to human-readable strings
 * Used by both Stellarium and Aladin canvas components
 */

import type { ClickCoords } from '@/lib/core/types';

/**
 * Format RA degrees to string like "12h 34m 56.7s"
 */
export function formatRaString(raDeg: number): string {
  const raH = Math.floor(raDeg / 15);
  const raM = Math.floor((raDeg / 15 - raH) * 60);
  const raS = ((raDeg / 15 - raH) * 60 - raM) * 60;
  return `${raH}h ${raM}m ${raS.toFixed(1)}s`;
}

/**
 * Format Dec degrees to string like "+45° 30' 12.3"
 */
export function formatDecString(decDeg: number): string {
  const decSign = decDeg >= 0 ? '+' : '-';
  const absDec = Math.abs(decDeg);
  const decD = Math.floor(absDec);
  const decM = Math.floor((absDec - decD) * 60);
  const decS = ((absDec - decD) * 60 - decM) * 60;
  return `${decSign}${decD}° ${decM}' ${decS.toFixed(1)}"`;
}

/**
 * Build a ClickCoords object from RA/Dec in degrees
 */
export function buildClickCoords(raDeg: number, decDeg: number): ClickCoords {
  return {
    ra: raDeg,
    dec: decDeg,
    raStr: formatRaString(raDeg),
    decStr: formatDecString(decDeg),
  };
}
