/**
 * Satellite display constants
 * Color and label mappings for satellite types
 */

import type { SatelliteData } from '@/lib/core/types';

/** CSS class for satellite type badge color */
export function getSatelliteTypeColor(type: SatelliteData['type']): string {
  switch (type) {
    case 'iss': return 'bg-blue-500/20 text-blue-400';
    case 'starlink': return 'bg-purple-500/20 text-purple-400';
    case 'weather': return 'bg-cyan-500/20 text-cyan-400';
    case 'gps': return 'bg-green-500/20 text-green-400';
    case 'communication': return 'bg-orange-500/20 text-orange-400';
    case 'scientific': return 'bg-pink-500/20 text-pink-400';
    default: return 'bg-gray-500/20 text-gray-400';
  }
}

/** i18n key for satellite type label */
export function getSatelliteTypeLabelKey(type: SatelliteData['type']): string {
  switch (type) {
    case 'iss': return 'satellites.typeISS';
    case 'starlink': return 'satellites.typeStarlink';
    case 'weather': return 'satellites.typeWeather';
    case 'gps': return 'satellites.typeGPS';
    case 'communication': return 'satellites.typeComm';
    case 'scientific': return 'satellites.typeScientific';
    default: return 'satellites.typeOther';
  }
}
