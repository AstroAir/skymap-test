/**
 * Meteor shower data
 */

import type { MeteorShower } from './types';

// ============================================================================
// Major Meteor Showers
// ============================================================================

/**
 * Major meteor shower catalog
 * Annual recurring showers with typical activity dates
 */
export const MAJOR_METEOR_SHOWERS: Omit<MeteorShower, 'id' | 'date' | 'active'>[] = [
  {
    type: 'meteor',
    name: 'Quadrantids',
    zhr: 120,
    peakDate: new Date('2024-01-04'),
    radiantRa: 230.1,
    radiantDec: 49.5,
    velocity: 41,
    parentBody: '2003 EH1',
    description: 'Brief but intense shower with blue meteors',
    visibility: 'good',
    source: 'IMO',
  },
  {
    type: 'meteor',
    name: 'Lyrids',
    zhr: 18,
    peakDate: new Date('2024-04-22'),
    radiantRa: 271.4,
    radiantDec: 33.6,
    velocity: 49,
    parentBody: 'C/1861 G1 (Thatcher)',
    description: 'Bright meteors with occasional fireballs',
    visibility: 'good',
    source: 'IMO',
  },
  {
    type: 'meteor',
    name: 'Eta Aquariids',
    zhr: 50,
    peakDate: new Date('2024-05-06'),
    radiantRa: 338.0,
    radiantDec: -1.0,
    velocity: 66,
    parentBody: '1P/Halley',
    description: 'Best viewed from Southern Hemisphere',
    visibility: 'fair',
    source: 'IMO',
  },
  {
    type: 'meteor',
    name: 'Delta Aquariids',
    zhr: 25,
    peakDate: new Date('2024-07-30'),
    radiantRa: 340.0,
    radiantDec: -16.0,
    velocity: 41,
    description: 'Faint meteors, peaks in late July',
    visibility: 'fair',
    source: 'IMO',
  },
  {
    type: 'meteor',
    name: 'Perseids',
    zhr: 100,
    peakDate: new Date('2024-08-12'),
    radiantRa: 48.0,
    radiantDec: 58.0,
    velocity: 59,
    parentBody: '109P/Swift-Tuttle',
    description: 'Most popular shower, many bright meteors',
    visibility: 'excellent',
    source: 'IMO',
  },
  {
    type: 'meteor',
    name: 'Orionids',
    zhr: 20,
    peakDate: new Date('2024-10-21'),
    radiantRa: 95.0,
    radiantDec: 16.0,
    velocity: 66,
    parentBody: '1P/Halley',
    description: 'Fast meteors from Halley\'s Comet',
    visibility: 'good',
    source: 'IMO',
  },
  {
    type: 'meteor',
    name: 'Leonids',
    zhr: 15,
    peakDate: new Date('2024-11-17'),
    radiantRa: 152.0,
    radiantDec: 22.0,
    velocity: 71,
    parentBody: '55P/Tempel-Tuttle',
    description: 'Fast meteors, occasional storms',
    visibility: 'good',
    source: 'IMO',
  },
  {
    type: 'meteor',
    name: 'Geminids',
    zhr: 150,
    peakDate: new Date('2024-12-14'),
    radiantRa: 112.0,
    radiantDec: 33.0,
    velocity: 35,
    parentBody: '3200 Phaethon',
    description: 'King of meteor showers, bright and numerous',
    visibility: 'excellent',
    source: 'IMO',
  },
  {
    type: 'meteor',
    name: 'Ursids',
    zhr: 10,
    peakDate: new Date('2024-12-22'),
    radiantRa: 217.0,
    radiantDec: 76.0,
    velocity: 33,
    parentBody: '8P/Tuttle',
    description: 'Modest shower near winter solstice',
    visibility: 'fair',
    source: 'IMO',
  },
];

// ============================================================================
// Meteor Shower Functions
// ============================================================================

/**
 * Get upcoming meteor showers
 * @param months - Number of months ahead to check
 * @returns Array of upcoming meteor showers
 */
export function getUpcomingMeteorShowers(months: number = 6): MeteorShower[] {
  const now = new Date();
  const endDate = new Date(now);
  endDate.setMonth(endDate.getMonth() + months);
  
  const currentYear = now.getFullYear();
  const showers: MeteorShower[] = [];
  
  for (const shower of MAJOR_METEOR_SHOWERS) {
    // Create events for current and next year
    for (let yearOffset = 0; yearOffset <= 1; yearOffset++) {
      const year = currentYear + yearOffset;
      const peakMonth = shower.peakDate.getMonth();
      const peakDay = shower.peakDate.getDate();
      
      const peakDate = new Date(year, peakMonth, peakDay);
      
      // Activity window (typically 2 weeks around peak)
      const activeStart = new Date(peakDate);
      activeStart.setDate(activeStart.getDate() - 7);
      const activeEnd = new Date(peakDate);
      activeEnd.setDate(activeEnd.getDate() + 7);
      
      if (activeEnd >= now && activeStart <= endDate) {
        showers.push({
          ...shower,
          id: `meteor-${shower.name.toLowerCase().replace(/\s/g, '-')}-${year}`,
          date: peakDate,
          peakDate,
          active: {
            start: activeStart,
            end: activeEnd,
          },
        });
      }
    }
  }
  
  return showers.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Check if a meteor shower is currently active
 */
export function isShowerActive(shower: MeteorShower): boolean {
  const now = new Date();
  return now >= shower.active.start && now <= shower.active.end;
}

/**
 * Get currently active meteor showers
 */
export function getActiveShowers(): MeteorShower[] {
  return getUpcomingMeteorShowers(1).filter(isShowerActive);
}
