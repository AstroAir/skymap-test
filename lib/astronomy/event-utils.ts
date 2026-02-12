/**
 * Astronomical event conversion utilities
 * Extracted from components/starmap/planning/astro-events-calendar.tsx
 */

import type { AstroEvent, EventType } from '@/lib/services/astro-data-sources';

// ============================================================================
// Event Type Mapping
// ============================================================================

/**
 * Map a Tauri event type string to the canonical EventType
 */
export function mapEventType(t: string): EventType {
  if (t.includes('moon')) return 'lunar_phase';
  if (t.includes('eclipse')) return 'eclipse';
  if (t.includes('meteor')) return 'meteor_shower';
  if (t.includes('conjunction')) return 'planet_conjunction';
  if (t.includes('opposition')) return 'planet_opposition';
  if (t.includes('elongation')) return 'planet_elongation';
  if (t.includes('equinox') || t.includes('solstice')) return 'equinox_solstice';
  return 'lunar_phase';
}

// ============================================================================
// Tauri Event Conversion
// ============================================================================

interface TauriEventItem {
  id: string;
  event_type: string;
  name: string;
  date: string;
  description: string;
  visibility?: string | null;
  magnitude?: number | null;
}

/**
 * Convert Tauri desktop events to the canonical AstroEvent format
 */
export function convertTauriEvents(tauriEventList: TauriEventItem[]): AstroEvent[] {
  return tauriEventList.map(e => ({
    id: e.id,
    type: mapEventType(e.event_type),
    name: e.name,
    date: new Date(e.date),
    description: e.description,
    visibility: (e.visibility || 'good') as 'excellent' | 'good' | 'fair' | 'poor',
    magnitude: e.magnitude ?? undefined,
    source: 'Desktop',
  }));
}
