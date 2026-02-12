/**
 * Planning-related style mappings and utility formatters
 * Extracted from components/starmap/planning/ for reuse across components
 */

import type { ImagingFeasibility } from '@/lib/astronomy/astro-utils';
import type { TargetItem } from '@/lib/stores/target-list-store';

// ============================================================================
// Sky Condition Styles (from astro-session-panel.tsx)
// ============================================================================

export function getSkyConditionColor(condition: string): string {
  switch (condition) {
    case 'night': return 'bg-indigo-600';
    case 'astronomical': return 'bg-purple-600';
    case 'nautical': return 'bg-blue-600';
    case 'civil': return 'bg-orange-500';
    case 'day': return 'bg-yellow-500';
    default: return 'bg-gray-600';
  }
}

/** Returns the i18n key suffix for a sky condition */
export function getSkyConditionLabelKey(condition: string): string {
  switch (condition) {
    case 'night': return 'session.darkSky';
    case 'astronomical': return 'session.astroTwilight';
    case 'nautical': return 'session.nauticalTwilight';
    case 'civil': return 'session.civilTwilight';
    case 'day': return 'session.daylight';
    default: return condition;
  }
}

// ============================================================================
// Feasibility Styles (from astro-session-panel.tsx & shot-list.tsx)
// ============================================================================

export function getFeasibilityColor(rec: string): string {
  switch (rec) {
    case 'excellent': return 'text-green-400 bg-green-900/30';
    case 'good': return 'text-emerald-400 bg-emerald-900/30';
    case 'fair': return 'text-yellow-400 bg-yellow-900/30';
    case 'poor': return 'text-orange-400 bg-orange-900/30';
    case 'not_recommended': return 'text-red-400 bg-red-900/30';
    default: return 'text-muted-foreground';
  }
}

export function getFeasibilityBadgeColor(rec: ImagingFeasibility['recommendation']): string {
  switch (rec) {
    case 'excellent': return 'bg-green-600';
    case 'good': return 'bg-emerald-600';
    case 'fair': return 'bg-yellow-600';
    case 'poor': return 'bg-orange-600';
    case 'not_recommended': return 'bg-red-600';
  }
}

// ============================================================================
// Target Status/Priority Styles (from shot-list.tsx)
// ============================================================================

export function getStatusColor(status: TargetItem['status']): string {
  switch (status) {
    case 'planned': return 'bg-muted-foreground';
    case 'in_progress': return 'bg-amber-600';
    case 'completed': return 'bg-green-600';
  }
}

export function getPriorityColor(priority: TargetItem['priority']): string {
  switch (priority) {
    case 'low': return 'border-muted-foreground text-muted-foreground';
    case 'medium': return 'border-primary text-primary';
    case 'high': return 'border-red-500 text-red-400';
  }
}

// ============================================================================
// Score Badge (from sky-atlas-panel.tsx & tonight-recommendations.tsx)
// ============================================================================

export function getScoreBadgeVariant(score: number): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (score >= 80) return 'default';
  if (score >= 60) return 'secondary';
  if (score >= 40) return 'outline';
  return 'destructive';
}

// ============================================================================
// Common Formatters (deduplicated from multiple components)
// ============================================================================

/** Format a Date to short time string (HH:MM), returns '--:--' for null */
export function formatPlanningTime(date: Date | null): string {
  if (!date) return '--:--';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/** Format a date string to locale date string */
export function formatPlanningDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString();
  } catch {
    return dateStr;
  }
}

/** Format countdown from minutes to "Xh Ym" or "Xm" */
export function formatCountdown(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}h ${m}m`;
}
