/**
 * Satellite orbit propagator using SGP4
 * Wrapper around satellite.js library
 */

import type { TLEData, SatellitePosition, SatelliteGroundTrack } from './types';

// ============================================================================
// TLE Parsing
// ============================================================================

/**
 * Parse TLE lines into structured data
 */
export function parseTLE(name: string, line1: string, line2: string): TLEData | null {
  try {
    const catalogNumber = parseInt(line1.substring(2, 7).trim());
    const epochYear = parseInt(line1.substring(18, 20));
    const epochDay = parseFloat(line1.substring(20, 32));
    
    const inclination = parseFloat(line2.substring(8, 16));
    const raan = parseFloat(line2.substring(17, 25));
    const eccentricityStr = '0.' + line2.substring(26, 33).trim();
    const eccentricity = parseFloat(eccentricityStr);
    const argOfPerigee = parseFloat(line2.substring(34, 42));
    const meanAnomaly = parseFloat(line2.substring(43, 51));
    const meanMotion = parseFloat(line2.substring(52, 63));
    
    return {
      name: name.trim(),
      line1,
      line2,
      catalogNumber,
      epochYear: epochYear > 57 ? 1900 + epochYear : 2000 + epochYear,
      epochDay,
      inclination,
      raan,
      eccentricity,
      argOfPerigee,
      meanAnomaly,
      meanMotion,
    };
  } catch {
    return null;
  }
}

/**
 * Parse multiple TLEs from 3-line format text
 */
export function parseTLEText(text: string): TLEData[] {
  const lines = text.trim().split('\n').map(l => l.trim());
  const satellites: TLEData[] = [];
  
  for (let i = 0; i < lines.length - 2; i += 3) {
    const name = lines[i];
    const line1 = lines[i + 1];
    const line2 = lines[i + 2];
    
    if (line1?.startsWith('1 ') && line2?.startsWith('2 ')) {
      const tle = parseTLE(name, line1, line2);
      if (tle) satellites.push(tle);
    }
  }
  
  return satellites;
}

// ============================================================================
// Position Calculation (Simplified)
// ============================================================================

/**
 * Calculate satellite position at a given time
 * NOTE: This is a simplified version. For production use,
 * import and use the satellite.js library directly.
 */
export function getSatellitePosition(
  tle: TLEData,
  date: Date,
  observerLat: number,
  observerLon: number,
  observerAlt: number = 0
): SatellitePosition | null {
  // This would use satellite.js for proper SGP4 propagation
  // Simplified placeholder implementation
  
  const timeSinceEpoch = (date.getTime() - getTLEEpoch(tle).getTime()) / 1000 / 60;
  const orbitsCompleted = timeSinceEpoch * tle.meanMotion / 1440;
  const currentMeanAnomaly = (tle.meanAnomaly + orbitsCompleted * 360) % 360;
  
  // Very simplified position estimate (not accurate)
  const latitude = tle.inclination * Math.sin((currentMeanAnomaly * Math.PI) / 180);
  const longitude = (tle.raan + currentMeanAnomaly - observerLon) % 360;
  const altitude = 400; // Placeholder
  
  // Calculate observer-relative values
  const range = calculateRange(latitude, longitude, altitude, observerLat, observerLon, observerAlt);
  const { azimuth, elevation } = calculateLookAngles(latitude, longitude, altitude, observerLat, observerLon, observerAlt);
  
  // Check if sunlit (simplified)
  const sunAlt = getSunAltitudeSimple(date);
  const isSunlit = sunAlt < 0 && altitude > 200; // In shadow of Earth
  const isVisible = isSunlit && elevation > 0 && sunAlt < -6;
  
  return {
    latitude,
    longitude: ((longitude + 180) % 360) - 180,
    altitude,
    velocity: 7.5, // Approximate orbital velocity
    azimuth,
    elevation,
    range,
    isSunlit,
    isVisible,
  };
}

/**
 * Calculate ground track for one orbit
 */
export function getGroundTrack(
  tle: TLEData,
  startDate: Date = new Date()
): SatelliteGroundTrack {
  const period = 1440 / tle.meanMotion; // minutes
  const positions: SatelliteGroundTrack['positions'] = [];
  
  // Sample every 2 minutes
  const steps = Math.ceil(period / 2);
  for (let i = 0; i <= steps; i++) {
    const time = new Date(startDate.getTime() + i * 2 * 60 * 1000);
    const pos = getSatellitePosition(tle, time, 0, 0);
    if (pos) {
      positions.push({
        time,
        latitude: pos.latitude,
        longitude: pos.longitude,
        altitude: pos.altitude,
      });
    }
  }
  
  return { positions, period };
}

// ============================================================================
// Helper Functions
// ============================================================================

function getTLEEpoch(tle: TLEData): Date {
  const year = tle.epochYear;
  const dayOfYear = tle.epochDay;
  const date = new Date(year, 0, 1);
  date.setDate(date.getDate() + dayOfYear - 1);
  return date;
}

function calculateRange(
  satLat: number, satLon: number, satAlt: number,
  obsLat: number, obsLon: number, obsAlt: number
): number {
  // Simplified range calculation
  const earthRadius = 6371;
  const dLat = (satLat - obsLat) * Math.PI / 180;
  const dLon = (satLon - obsLon) * Math.PI / 180;
  const a = Math.sin(dLat/2) ** 2 + 
            Math.cos(obsLat * Math.PI / 180) * Math.cos(satLat * Math.PI / 180) * 
            Math.sin(dLon/2) ** 2;
  const groundDist = 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.sqrt(groundDist ** 2 + (satAlt - obsAlt/1000) ** 2);
}

function calculateLookAngles(
  satLat: number, satLon: number, satAlt: number,
  obsLat: number, obsLon: number, obsAlt: number
): { azimuth: number; elevation: number } {
  // Simplified look angle calculation
  // obsAlt reserved for more accurate calculation
  void obsAlt;
  
  const dLon = satLon - obsLon;
  const azimuth = (Math.atan2(
    Math.sin(dLon * Math.PI / 180),
    Math.cos(obsLat * Math.PI / 180) * Math.tan(satLat * Math.PI / 180) -
    Math.sin(obsLat * Math.PI / 180) * Math.cos(dLon * Math.PI / 180)
  ) * 180 / Math.PI + 360) % 360;
  
  const range = calculateRange(satLat, satLon, satAlt, obsLat, obsLon, 0);
  const elevation = Math.atan2(satAlt - 0, range) * 180 / Math.PI;
  
  return { azimuth, elevation: Math.max(-90, Math.min(90, elevation)) };
}

function getSunAltitudeSimple(date: Date): number {
  // Very simplified sun altitude
  const hour = date.getUTCHours() + date.getUTCMinutes() / 60;
  return -20 + 40 * Math.cos((hour - 12) * Math.PI / 12);
}
