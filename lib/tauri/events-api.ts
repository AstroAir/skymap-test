/**
 * Tauri API wrapper for astronomical events
 * Only available in Tauri desktop environment
 */

import { isTauri } from '@/lib/storage/platform';

// Lazy import to avoid errors in web environment
async function getInvoke() {
  if (!isTauri()) {
    throw new Error('Tauri API is only available in desktop environment');
  }
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke;
}

// ============================================================================
// Types
// ============================================================================

export type AstroEventType =
  | 'new_moon'
  | 'first_quarter'
  | 'full_moon'
  | 'last_quarter'
  | 'solar_eclipse'
  | 'lunar_eclipse'
  | 'meteor_shower'
  | 'planetary_conjunction'
  | 'planetary_opposition'
  | 'planetary_elongation'
  | 'equinox'
  | 'solstice'
  | 'perihelion'
  | 'aphelion'
  | 'supermoon'
  | 'blue_moon';

export interface AstroEvent {
  id: string;
  event_type: AstroEventType;
  name: string;
  description: string;
  date: string;
  time: string | null;
  timestamp: number;
  magnitude: number | null;
  visibility: string | null;
  details: Record<string, unknown> | null;
}

export interface DailyAstroEvent extends AstroEvent {
  occurrence_mode?: 'instant' | 'window';
  starts_at?: string;
  ends_at?: string;
}

export interface MoonPhaseEvent {
  phase_type: string;
  date: string;
  timestamp: number;
  illumination: number;
  is_supermoon: boolean;
}

export interface MeteorShowerInfo {
  name: string;
  peak_date: string;
  active_start: string;
  active_end: string;
  zhr: number;
  radiant_ra: number;
  radiant_dec: number;
  parent_body: string | null;
  description: string;
}

// ============================================================================
// Events API
// ============================================================================

export const eventsApi = {
  /**
   * Get moon phases for a specific month
   */
  async getMoonPhasesForMonth(year: number, month: number): Promise<MoonPhaseEvent[]> {
    const invoke = await getInvoke();
    return invoke('get_moon_phases_for_month', { year, month });
  },

  /**
   * Get meteor showers for a year
   */
  async getMeteorShowers(year: number): Promise<MeteorShowerInfo[]> {
    const invoke = await getInvoke();
    return invoke('get_meteor_showers', { year });
  },

  /**
   * Get seasonal events (equinoxes and solstices) for a year
   */
  async getSeasonalEvents(year: number): Promise<AstroEvent[]> {
    const invoke = await getInvoke();
    return invoke('get_seasonal_events', { year });
  },

  /**
   * Get all astronomical events for a date range
   */
  async getAstroEvents(startDate: string, endDate: string): Promise<AstroEvent[]> {
    const invoke = await getInvoke();
    return invoke('get_astro_events', { startDate, endDate });
  },

  /**
   * Get astronomical events for a single day in a specific timezone
   */
  async getDailyAstroEvents(
    date: string,
    timezone: string,
    includeOngoing: boolean = true
  ): Promise<DailyAstroEvent[]> {
    const invoke = await getInvoke();
    return invoke('get_daily_astro_events', { date, timezone, includeOngoing });
  },

  /**
   * Get tonight's astronomical highlights
   */
  async getTonightHighlights(
    latitude: number,
    longitude: number,
    timestamp?: number
  ): Promise<string[]> {
    const invoke = await getInvoke();
    return invoke('get_tonight_highlights', { latitude, longitude, timestamp });
  },

  /** Check if events API is available */
  isAvailable: isTauri,
};

export default eventsApi;
