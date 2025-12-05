/**
 * Multi-target imaging planning
 */

import { calculateTargetVisibility } from '../visibility/target';
import { calculateImagingFeasibility } from './feasibility';
import { angularSeparation } from '../celestial/separation';
import type { 
  PlannedTarget, 
  MultiTargetPlan,
} from '@/lib/core/types/astronomy';

// ============================================================================
// Multi-Target Planning
// ============================================================================

/**
 * Plan a multi-target imaging session
 * @param targets - Array of targets to plan
 * @param latitude - Observer latitude
 * @param longitude - Observer longitude
 * @param minAltitude - Minimum altitude for imaging
 * @param date - Date for planning
 * @returns Optimized session plan
 */
export function planMultipleTargets(
  targets: Array<{ id: string; name: string; ra: number; dec: number }>,
  latitude: number,
  longitude: number,
  minAltitude: number = 30,
  date: Date = new Date()
): MultiTargetPlan {
  const recommendations: string[] = [];
  const plannedTargets: PlannedTarget[] = [];
  
  // Calculate feasibility for all targets
  for (const target of targets) {
    const visibility = calculateTargetVisibility(
      target.ra, target.dec, latitude, longitude, minAltitude, date
    );
    
    const feasibility = calculateImagingFeasibility(
      target.ra, target.dec, latitude, longitude, minAltitude, date
    );
    
    // Find conflicts with other targets
    const conflicts: string[] = [];
    for (const other of targets) {
      if (other.id === target.id) continue;
      
      const otherVisibility = calculateTargetVisibility(
        other.ra, other.dec, latitude, longitude, minAltitude, date
      );
      
      // Check for overlapping windows
      if (visibility.darkImagingStart && visibility.darkImagingEnd &&
          otherVisibility.darkImagingStart && otherVisibility.darkImagingEnd) {
        const overlapStart = Math.max(
          visibility.darkImagingStart.getTime(),
          otherVisibility.darkImagingStart.getTime()
        );
        const overlapEnd = Math.min(
          visibility.darkImagingEnd.getTime(),
          otherVisibility.darkImagingEnd.getTime()
        );
        
        if (overlapEnd > overlapStart) {
          const overlapHours = (overlapEnd - overlapStart) / 3600000;
          if (overlapHours > 2) {
            conflicts.push(`Overlaps with ${other.name} for ${overlapHours.toFixed(1)}h`);
          }
        }
      }
    }
    
    plannedTargets.push({
      id: target.id,
      name: target.name,
      ra: target.ra,
      dec: target.dec,
      windowStart: visibility.darkImagingStart,
      windowEnd: visibility.darkImagingEnd,
      duration: visibility.darkImagingHours,
      feasibility,
      conflicts,
    });
  }
  
  // Sort by best imaging window start time
  plannedTargets.sort((a, b) => {
    if (!a.windowStart) return 1;
    if (!b.windowStart) return -1;
    return a.windowStart.getTime() - b.windowStart.getTime();
  });
  
  // Calculate total imaging time
  let totalImagingTime = 0;
  const usedWindows: Array<{ start: number; end: number }> = [];
  
  for (const target of plannedTargets) {
    if (!target.windowStart || !target.windowEnd) continue;
    
    const start = target.windowStart.getTime();
    const end = target.windowEnd.getTime();
    
    // Check if this window overlaps with already used windows
    let usableStart = start;
    for (const used of usedWindows) {
      if (usableStart < used.end && end > used.start) {
        usableStart = Math.max(usableStart, used.end);
      }
    }
    
    if (usableStart < end) {
      const duration = (end - usableStart) / 3600000;
      totalImagingTime += duration;
      usedWindows.push({ start: usableStart, end });
    }
  }
  
  // Calculate night coverage
  const firstStart = plannedTargets.find(t => t.windowStart)?.windowStart;
  const lastEnd = [...plannedTargets]
    .filter(t => t.windowEnd)
    .sort((a, b) => b.windowEnd!.getTime() - a.windowEnd!.getTime())[0]?.windowEnd;
  
  let nightCoverage = 0;
  if (firstStart && lastEnd) {
    const nightDuration = (lastEnd.getTime() - firstStart.getTime()) / 3600000;
    nightCoverage = nightDuration > 0 ? (totalImagingTime / nightDuration) * 100 : 0;
  }
  
  // Generate recommendations
  const excellentTargets = plannedTargets.filter(t => t.feasibility.score >= 80);
  const poorTargets = plannedTargets.filter(t => t.feasibility.score < 40);
  
  if (excellentTargets.length > 0) {
    recommendations.push(
      `Start with ${excellentTargets[0].name} (score: ${excellentTargets[0].feasibility.score})`
    );
  }
  
  if (poorTargets.length > 0) {
    recommendations.push(
      `Consider skipping: ${poorTargets.map(t => t.name).join(', ')}`
    );
  }
  
  // Check for wide slews
  for (let i = 0; i < plannedTargets.length - 1; i++) {
    const current = plannedTargets[i];
    const next = plannedTargets[i + 1];
    const separation = angularSeparation(
      current.ra, current.dec, next.ra, next.dec
    );
    
    if (separation > 90) {
      recommendations.push(
        `Large slew (${Math.round(separation)}°) from ${current.name} to ${next.name}`
      );
    }
  }
  
  return {
    targets: plannedTargets,
    totalImagingTime,
    nightCoverage,
    recommendations,
  };
}

/**
 * Optimize target order to minimize slew time
 */
export function optimizeTargetOrder(
  targets: Array<{ id: string; ra: number; dec: number }>,
  startRa?: number,
  startDec?: number
): Array<{ id: string; ra: number; dec: number }> {
  if (targets.length <= 2) return [...targets];
  
  const remaining = [...targets];
  const ordered: typeof targets = [];
  
  // Start from provided position or first target
  let currentRa = startRa ?? targets[0].ra;
  let currentDec = startDec ?? targets[0].dec;
  
  while (remaining.length > 0) {
    // Find nearest target
    let nearestIdx = 0;
    let nearestDist = Infinity;
    
    for (let i = 0; i < remaining.length; i++) {
      const dist = angularSeparation(
        currentRa, currentDec,
        remaining[i].ra, remaining[i].dec
      );
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIdx = i;
      }
    }
    
    const next = remaining.splice(nearestIdx, 1)[0];
    ordered.push(next);
    currentRa = next.ra;
    currentDec = next.dec;
  }
  
  return ordered;
}

/**
 * Estimate total slew time for a target sequence
 * @param targets - Ordered list of targets
 * @param slewSpeed - Slew speed in degrees per second
 * @returns Total slew time in seconds
 */
export function estimateSlewTime(
  targets: Array<{ ra: number; dec: number }>,
  slewSpeed: number = 5
): number {
  if (targets.length < 2) return 0;
  
  let totalSlew = 0;
  for (let i = 0; i < targets.length - 1; i++) {
    const separation = angularSeparation(
      targets[i].ra, targets[i].dec,
      targets[i + 1].ra, targets[i + 1].dec
    );
    totalSlew += separation / slewSpeed;
  }
  
  // Add settling time (10s per slew)
  totalSlew += (targets.length - 1) * 10;
  
  return totalSlew;
}
