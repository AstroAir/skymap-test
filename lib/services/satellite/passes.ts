/**
 * Satellite pass predictions
 */

import type { TLEData, SatellitePass, PassPredictionParams } from './types';
import { getSatellitePosition } from './propagator';

// ============================================================================
// Pass Prediction
// ============================================================================

/**
 * Predict satellite passes
 */
export function predictPasses(
  tle: TLEData,
  params: PassPredictionParams
): SatellitePass[] {
  const {
    latitude,
    longitude,
    elevation = 0,
    minElevation = 10,
    hours = 48,
  } = params;
  
  const passes: SatellitePass[] = [];
  const now = new Date();
  const endTime = new Date(now.getTime() + hours * 3600 * 1000);
  
  // Sample every minute
  const stepMs = 60 * 1000;
  let inPass = false;
  let currentPass: Partial<SatellitePass> | null = null;
  let maxElInPass = 0;
  let maxElTime: Date | null = null;
  
  for (let time = now.getTime(); time <= endTime.getTime(); time += stepMs) {
    const date = new Date(time);
    const pos = getSatellitePosition(tle, date, latitude, longitude, elevation);
    
    if (!pos) continue;
    
    if (pos.elevation > 0) {
      if (!inPass) {
        // Pass started
        inPass = true;
        currentPass = {
          satellite: tle.name,
          startTime: date,
          startAzimuth: pos.azimuth,
          isVisible: pos.isVisible,
        };
        maxElInPass = pos.elevation;
        maxElTime = date;
      } else {
        // Continue pass
        if (pos.elevation > maxElInPass) {
          maxElInPass = pos.elevation;
          maxElTime = date;
        }
        if (pos.isVisible && !currentPass!.isVisible) {
          currentPass!.isVisible = true;
        }
      }
    } else if (inPass && currentPass) {
      // Pass ended
      if (maxElInPass >= minElevation) {
        passes.push({
          satellite: tle.name,
          startTime: currentPass.startTime!,
          endTime: date,
          maxElevation: maxElInPass,
          maxElevationTime: maxElTime!,
          startAzimuth: currentPass.startAzimuth!,
          endAzimuth: pos.azimuth,
          isVisible: currentPass.isVisible!,
          magnitude: estimateMagnitude(tle, maxElInPass),
        });
      }
      
      inPass = false;
      currentPass = null;
      maxElInPass = 0;
    }
  }
  
  return passes;
}

/**
 * Get the next pass for a satellite
 */
export function getNextPass(
  tle: TLEData,
  params: PassPredictionParams
): SatellitePass | null {
  const passes = predictPasses(tle, { ...params, hours: 48 });
  return passes[0] ?? null;
}

/**
 * Get visible passes only (satellite is sunlit and in dark sky)
 */
export function getVisiblePasses(
  tle: TLEData,
  params: PassPredictionParams
): SatellitePass[] {
  return predictPasses(tle, params).filter(p => p.isVisible);
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Estimate satellite visual magnitude
 * Based on standard magnitude and range
 */
function estimateMagnitude(tle: TLEData, elevation: number): number {
  // ISS is about magnitude -3 at 90° elevation
  // Brightness decreases with lower elevation (longer range)
  const baseMag = tle.name.includes('ISS') ? -3 : 2;
  const elevationFactor = (90 - elevation) / 30; // dimmer at lower elevation
  return baseMag + elevationFactor;
}

/**
 * Get pass direction description
 */
export function getPassDirection(startAz: number, endAz: number): string {
  const directions: Record<number, string> = {
    0: 'N',
    45: 'NE',
    90: 'E',
    135: 'SE',
    180: 'S',
    225: 'SW',
    270: 'W',
    315: 'NW',
  };
  
  const getNearestDirection = (az: number): string => {
    const normalized = ((az % 360) + 360) % 360;
    const nearest = Math.round(normalized / 45) * 45;
    return directions[nearest % 360] || 'N';
  };
  
  return `${getNearestDirection(startAz)} → ${getNearestDirection(endAz)}`;
}

/**
 * Get pass quality description
 */
export function getPassQuality(pass: SatellitePass): 'excellent' | 'good' | 'fair' | 'poor' {
  if (!pass.isVisible) return 'poor';
  if (pass.maxElevation >= 70) return 'excellent';
  if (pass.maxElevation >= 45) return 'good';
  if (pass.maxElevation >= 25) return 'fair';
  return 'poor';
}

/**
 * Format pass for display
 */
export function formatPass(pass: SatellitePass): string {
  const startTime = pass.startTime.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  const maxEl = Math.round(pass.maxElevation);
  const direction = getPassDirection(pass.startAzimuth, pass.endAzimuth);
  const visible = pass.isVisible ? '👁' : '';
  
  return `${startTime} | ${maxEl}° | ${direction} ${visible}`;
}
