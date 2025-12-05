/**
 * Astronomical Data Sources API
 * Supports multiple data sources for astronomical events and satellite tracking
 */

// ============================================================================
// Types
// ============================================================================

export type EventType = 
  | 'lunar_phase' 
  | 'meteor_shower' 
  | 'planet_conjunction' 
  | 'eclipse' 
  | 'planet_opposition'
  | 'planet_elongation'
  | 'equinox_solstice'
  | 'comet'
  | 'asteroid'
  | 'supernova'
  | 'aurora';

export interface AstroEvent {
  id: string;
  type: EventType;
  name: string;
  date: Date;
  endDate?: Date;
  description: string;
  visibility: 'excellent' | 'good' | 'fair' | 'poor';
  ra?: number;
  dec?: number;
  magnitude?: number;
  peakTime?: Date;
  source: string;
  url?: string;
}

export interface SatelliteData {
  id: string;
  name: string;
  noradId: number;
  intlDesignator?: string;
  type: 'iss' | 'starlink' | 'weather' | 'gps' | 'communication' | 'scientific' | 'amateur' | 'other';
  altitude: number;
  velocity: number;
  inclination: number;
  period: number;
  ra?: number;
  dec?: number;
  azimuth?: number;
  elevation?: number;
  magnitude?: number;
  isVisible: boolean;
  tle?: {
    line1: string;
    line2: string;
  };
  source: string;
}

export interface SatellitePass {
  satellite: SatelliteData;
  startTime: Date;
  maxTime: Date;
  endTime: Date;
  startAz: number;
  startEl: number;
  maxAz: number;
  maxEl: number;
  endAz: number;
  endEl: number;
  magnitude?: number;
  duration: number;
  isVisible: boolean;
}

export interface DataSourceConfig {
  id: string;
  name: string;
  enabled: boolean;
  apiUrl?: string;
  apiKey?: string;
  priority: number;
}

// ============================================================================
// Data Source Configurations
// ============================================================================

export const ASTRO_EVENT_SOURCES: DataSourceConfig[] = [
  {
    id: 'astronomyapi',
    name: 'Astronomy API',
    enabled: true,
    apiUrl: 'https://api.astronomyapi.com/api/v2',
    priority: 1,
  },
  {
    id: 'usno',
    name: 'US Naval Observatory',
    enabled: true,
    apiUrl: 'https://aa.usno.navy.mil/api',
    priority: 2,
  },
  {
    id: 'timeanddate',
    name: 'Time and Date',
    enabled: true,
    apiUrl: 'https://api.timeanddate.com',
    priority: 3,
  },
  {
    id: 'imo',
    name: 'International Meteor Organization',
    enabled: true,
    apiUrl: 'https://www.imo.net/api',
    priority: 4,
  },
  {
    id: 'local',
    name: 'Local Calculations',
    enabled: true,
    priority: 99,
  },
];

export const SATELLITE_SOURCES: DataSourceConfig[] = [
  {
    id: 'celestrak',
    name: 'CelesTrak',
    enabled: true,
    apiUrl: 'https://celestrak.org',
    priority: 1,
  },
  {
    id: 'n2yo',
    name: 'N2YO',
    enabled: true,
    apiUrl: 'https://api.n2yo.com/rest/v1/satellite',
    priority: 2,
  },
  {
    id: 'spacetrack',
    name: 'Space-Track.org',
    enabled: true,
    apiUrl: 'https://www.space-track.org/basicspacedata',
    priority: 3,
  },
  {
    id: 'heavensabove',
    name: 'Heavens-Above',
    enabled: true,
    apiUrl: 'https://www.heavens-above.com',
    priority: 4,
  },
];

// ============================================================================
// API Fetchers
// ============================================================================

/**
 * Fetch lunar phases from USNO API
 */
export async function fetchLunarPhases(year: number, month: number): Promise<AstroEvent[]> {
  try {
    // USNO Moon Phases API
    const response = await fetch(
      `https://aa.usno.navy.mil/api/moon/phases/year?year=${year}`,
      { next: { revalidate: 86400 } } // Cache for 24 hours
    );
    
    if (!response.ok) throw new Error('USNO API error');
    
    const data = await response.json();
    const events: AstroEvent[] = [];
    
    if (data.phasedata) {
      data.phasedata.forEach((phase: { phase: string; date: string; time: string }) => {
        const phaseDate = new Date(`${phase.date}T${phase.time}Z`);
        if (phaseDate.getMonth() === month) {
          events.push({
            id: `lunar-${phase.phase}-${phaseDate.toISOString()}`,
            type: 'lunar_phase',
            name: phase.phase,
            date: phaseDate,
            description: `The Moon reaches ${phase.phase.toLowerCase()} phase.`,
            visibility: phase.phase === 'New Moon' ? 'excellent' : 'good',
            source: 'USNO',
            url: 'https://aa.usno.navy.mil/data/MoonPhases',
          });
        }
      });
    }
    
    return events;
  } catch (error) {
    console.warn('Failed to fetch lunar phases from USNO:', error);
    return [];
  }
}

/**
 * Fetch meteor shower data from IMO
 */
export async function fetchMeteorShowers(year: number, month: number): Promise<AstroEvent[]> {
  // IMO Meteor Shower Calendar data (static but comprehensive)
  const showers = [
    { code: 'QUA', name: 'Quadrantids', peak: [0, 4], start: [0, 1], end: [0, 10], zhr: 120, ra: 230, dec: 49, speed: 41 },
    { code: 'LYR', name: 'Lyrids', peak: [3, 22], start: [3, 16], end: [3, 25], zhr: 18, ra: 271, dec: 34, speed: 49 },
    { code: 'ETA', name: 'η-Aquariids', peak: [4, 6], start: [3, 19], end: [4, 28], zhr: 50, ra: 338, dec: -1, speed: 66 },
    { code: 'SDA', name: 'δ-Aquariids', peak: [6, 30], start: [6, 12], end: [7, 23], zhr: 25, ra: 340, dec: -16, speed: 41 },
    { code: 'CAP', name: 'α-Capricornids', peak: [6, 30], start: [6, 3], end: [7, 15], zhr: 5, ra: 307, dec: -10, speed: 23 },
    { code: 'PER', name: 'Perseids', peak: [7, 12], start: [6, 17], end: [7, 24], zhr: 100, ra: 48, dec: 58, speed: 59 },
    { code: 'ORI', name: 'Orionids', peak: [9, 21], start: [9, 2], end: [10, 7], zhr: 20, ra: 95, dec: 16, speed: 66 },
    { code: 'DRA', name: 'Draconids', peak: [9, 8], start: [9, 6], end: [9, 10], zhr: 10, ra: 262, dec: 54, speed: 20 },
    { code: 'STA', name: 'S. Taurids', peak: [9, 10], start: [8, 10], end: [10, 20], zhr: 5, ra: 52, dec: 13, speed: 27 },
    { code: 'NTA', name: 'N. Taurids', peak: [10, 12], start: [9, 20], end: [11, 10], zhr: 5, ra: 58, dec: 22, speed: 29 },
    { code: 'LEO', name: 'Leonids', peak: [10, 17], start: [10, 6], end: [10, 30], zhr: 15, ra: 152, dec: 22, speed: 71 },
    { code: 'GEM', name: 'Geminids', peak: [11, 14], start: [11, 4], end: [11, 17], zhr: 150, ra: 112, dec: 33, speed: 35 },
    { code: 'URS', name: 'Ursids', peak: [11, 22], start: [11, 17], end: [11, 26], zhr: 10, ra: 217, dec: 76, speed: 33 },
  ];
  
  const events: AstroEvent[] = [];
  
  showers.forEach(shower => {
    const peakDate = new Date(year, shower.peak[0], shower.peak[1]);
    const startDate = new Date(year, shower.start[0], shower.start[1]);
    const endDate = new Date(year, shower.end[0], shower.end[1]);
    
    // Check if active during this month
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    
    if (startDate <= monthEnd && endDate >= monthStart) {
      events.push({
        id: `meteor-${shower.code}-${year}`,
        type: 'meteor_shower',
        name: `${shower.name} Meteor Shower`,
        date: startDate,
        endDate: endDate,
        peakTime: peakDate,
        description: `Peak ZHR: ~${shower.zhr} meteors/hour. Radiant in ${getConstellationName(shower.ra, shower.dec)}. Entry speed: ${shower.speed} km/s.`,
        visibility: shower.zhr >= 50 ? 'excellent' : shower.zhr >= 20 ? 'good' : 'fair',
        ra: shower.ra,
        dec: shower.dec,
        source: 'IMO',
        url: `https://www.imo.net/resources/calendar/#${shower.code}`,
      });
    }
  });
  
  return events;
}

/**
 * Fetch eclipse data
 */
export async function fetchEclipses(year: number, month: number): Promise<AstroEvent[]> {
  try {
    // Try to fetch from NASA Eclipse API
    const response = await fetch(
      `https://eclipse.gsfc.nasa.gov/eclipse/api/eclipse?year=${year}&type=all`,
      { next: { revalidate: 86400 * 30 } } // Cache for 30 days
    );
    
    if (!response.ok) throw new Error('NASA Eclipse API error');
    
    const responseData = await response.json();
    const events: AstroEvent[] = [];
    
    // Process eclipse data from NASA API
    if (responseData && Array.isArray(responseData.eclipses)) {
      responseData.eclipses.forEach((eclipse: { date: string; type: string }) => {
        const eclipseDate = new Date(eclipse.date);
        if (eclipseDate.getMonth() === month) {
          events.push({
            id: `eclipse-${eclipse.date}`,
            type: 'eclipse',
            name: eclipse.type,
            date: eclipseDate,
            description: `${eclipse.type} visible from various locations.`,
            visibility: eclipse.type.includes('Total') ? 'excellent' : 'good',
            source: 'NASA',
            url: 'https://eclipse.gsfc.nasa.gov/',
          });
        }
      });
    }
    
    return events;
  } catch {
    // Fallback to known eclipses for 2024-2026
    return getKnownEclipses(year, month);
  }
}

function getKnownEclipses(year: number, month: number): AstroEvent[] {
  const eclipses = [
    // 2024
    { date: '2024-03-25', type: 'Penumbral Lunar Eclipse', visibility: 'fair' as const },
    { date: '2024-04-08', type: 'Total Solar Eclipse', visibility: 'excellent' as const },
    { date: '2024-09-18', type: 'Partial Lunar Eclipse', visibility: 'good' as const },
    { date: '2024-10-02', type: 'Annular Solar Eclipse', visibility: 'good' as const },
    // 2025
    { date: '2025-03-14', type: 'Total Lunar Eclipse', visibility: 'excellent' as const },
    { date: '2025-03-29', type: 'Partial Solar Eclipse', visibility: 'fair' as const },
    { date: '2025-09-07', type: 'Total Lunar Eclipse', visibility: 'excellent' as const },
    { date: '2025-09-21', type: 'Partial Solar Eclipse', visibility: 'fair' as const },
  ];
  
  const events: AstroEvent[] = [];
  
  eclipses.forEach(eclipse => {
    const eclipseDate = new Date(eclipse.date);
    if (eclipseDate.getFullYear() === year && eclipseDate.getMonth() === month) {
      events.push({
        id: `eclipse-${eclipse.date}`,
        type: 'eclipse',
        name: eclipse.type,
        date: eclipseDate,
        description: `${eclipse.type} visible from various locations.`,
        visibility: eclipse.visibility,
        source: 'NASA',
        url: 'https://eclipse.gsfc.nasa.gov/',
      });
    }
  });
  
  return events;
}

/**
 * Fetch comet data from Minor Planet Center
 */
export async function fetchComets(): Promise<AstroEvent[]> {
  try {
    // MPC Observable Comets
    const response = await fetch(
      'https://www.minorplanetcenter.net/iau/Ephemerides/Comets/Soft03Cmt.txt',
      { next: { revalidate: 86400 } }
    );
    
    if (!response.ok) throw new Error('MPC API error');
    
    const text = await response.text();
    const events: AstroEvent[] = [];
    
    // Parse MPC comet data format
    const lines = text.split('\n').slice(2); // Skip header
    lines.forEach(line => {
      if (line.trim()) {
        const name = line.substring(0, 44).trim();
        const mag = parseFloat(line.substring(91, 96));
        
        if (mag && mag < 12) { // Only bright comets
          events.push({
            id: `comet-${name.replace(/\s+/g, '-')}`,
            type: 'comet',
            name: `Comet ${name}`,
            date: new Date(),
            description: `Current magnitude: ${mag.toFixed(1)}`,
            visibility: mag < 6 ? 'excellent' : mag < 8 ? 'good' : 'fair',
            magnitude: mag,
            source: 'MPC',
            url: 'https://www.minorplanetcenter.net/iau/Ephemerides/Comets/',
          });
        }
      }
    });
    
    return events;
  } catch (error) {
    console.warn('Failed to fetch comets from MPC:', error);
    return [];
  }
}

/**
 * Fetch satellite TLE data from CelesTrak
 */
export async function fetchSatelliteTLE(category: string = 'stations'): Promise<SatelliteData[]> {
  try {
    const response = await fetch(
      `https://celestrak.org/NORAD/elements/gp.php?GROUP=${category}&FORMAT=json`,
      { next: { revalidate: 3600 } } // Cache for 1 hour
    );
    
    if (!response.ok) throw new Error('CelesTrak API error');
    
    const data = await response.json();
    const satellites: SatelliteData[] = [];
    
    data.forEach((sat: {
      OBJECT_NAME: string;
      NORAD_CAT_ID: number;
      OBJECT_ID: string;
      TLE_LINE1: string;
      TLE_LINE2: string;
      MEAN_MOTION: number;
      INCLINATION: number;
    }) => {
      // Calculate orbital parameters from TLE
      const meanMotion = sat.MEAN_MOTION;
      const period = 1440 / meanMotion; // minutes
      const altitude = Math.pow((398600.4418 * Math.pow(period * 60 / (2 * Math.PI), 2)), 1/3) - 6371; // km
      const velocity = Math.sqrt(398600.4418 / (6371 + altitude)); // km/s
      
      satellites.push({
        id: `celestrak-${sat.NORAD_CAT_ID}`,
        name: sat.OBJECT_NAME,
        noradId: sat.NORAD_CAT_ID,
        intlDesignator: sat.OBJECT_ID,
        type: categorizesSatellite(sat.OBJECT_NAME, category),
        altitude: Math.round(altitude),
        velocity: parseFloat(velocity.toFixed(2)),
        inclination: sat.INCLINATION,
        period: parseFloat(period.toFixed(1)),
        isVisible: false,
        tle: {
          line1: sat.TLE_LINE1,
          line2: sat.TLE_LINE2,
        },
        source: 'CelesTrak',
      });
    });
    
    return satellites;
  } catch (error) {
    console.warn('Failed to fetch TLE from CelesTrak:', error);
    return [];
  }
}

/**
 * Fetch satellite passes from N2YO API
 */
export async function fetchSatellitePasses(
  noradId: number,
  lat: number,
  lng: number,
  alt: number = 0,
  days: number = 2,
  minVisibility: number = 300,
  apiKey?: string
): Promise<SatellitePass[]> {
  if (!apiKey) {
    console.warn('N2YO API key not provided');
    return [];
  }
  
  try {
    const response = await fetch(
      `https://api.n2yo.com/rest/v1/satellite/visualpasses/${noradId}/${lat}/${lng}/${alt}/${days}/${minVisibility}/&apiKey=${apiKey}`,
      { next: { revalidate: 1800 } } // Cache for 30 minutes
    );
    
    if (!response.ok) throw new Error('N2YO API error');
    
    const data = await response.json();
    const passes: SatellitePass[] = [];
    
    if (data.passes) {
      data.passes.forEach((pass: {
        startUTC: number;
        startAz: number;
        startEl: number;
        maxUTC: number;
        maxAz: number;
        maxEl: number;
        endUTC: number;
        endAz: number;
        endEl: number;
        mag: number;
        duration: number;
      }) => {
        passes.push({
          satellite: {
            id: `n2yo-${noradId}`,
            name: data.info?.satname || `NORAD ${noradId}`,
            noradId: noradId,
            type: 'other',
            altitude: 0,
            velocity: 0,
            inclination: 0,
            period: 0,
            isVisible: true,
            source: 'N2YO',
          },
          startTime: new Date(pass.startUTC * 1000),
          maxTime: new Date(pass.maxUTC * 1000),
          endTime: new Date(pass.endUTC * 1000),
          startAz: pass.startAz,
          startEl: pass.startEl,
          maxAz: pass.maxAz,
          maxEl: pass.maxEl,
          endAz: pass.endAz,
          endEl: pass.endEl,
          magnitude: pass.mag,
          duration: pass.duration / 60,
          isVisible: pass.maxEl > 10,
        });
      });
    }
    
    return passes;
  } catch (error) {
    console.warn('Failed to fetch passes from N2YO:', error);
    return [];
  }
}

/**
 * Fetch ISS position in real-time
 */
export async function fetchISSPosition(): Promise<{ lat: number; lng: number; alt: number; velocity: number } | null> {
  try {
    const response = await fetch(
      'http://api.open-notify.org/iss-now.json',
      { cache: 'no-store' }
    );
    
    if (!response.ok) throw new Error('Open Notify API error');
    
    const data = await response.json();
    
    return {
      lat: parseFloat(data.iss_position.latitude),
      lng: parseFloat(data.iss_position.longitude),
      alt: 420, // Approximate
      velocity: 7.66, // Approximate
    };
  } catch (error) {
    console.warn('Failed to fetch ISS position:', error);
    return null;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function getConstellationName(ra: number, dec: number): string {
  // Simplified constellation lookup based on RA/Dec
  if (ra >= 45 && ra < 60 && dec >= 50) return 'Perseus';
  if (ra >= 90 && ra < 120 && dec >= 20 && dec < 40) return 'Gemini';
  if (ra >= 140 && ra < 170 && dec >= 10 && dec < 30) return 'Leo';
  if (ra >= 200 && ra < 230 && dec >= 70) return 'Ursa Minor';
  if (ra >= 260 && ra < 280 && dec >= 30 && dec < 50) return 'Lyra';
  if (ra >= 330 && ra < 350 && dec >= -20 && dec < 10) return 'Aquarius';
  return 'the sky';
}

function categorizesSatellite(name: string, category: string): SatelliteData['type'] {
  const upperName = name.toUpperCase();
  
  if (upperName.includes('ISS') || upperName.includes('ZARYA') || upperName.includes('TIANGONG') || upperName.includes('CSS')) {
    return 'iss';
  }
  if (upperName.includes('STARLINK')) return 'starlink';
  if (upperName.includes('GPS') || upperName.includes('NAVSTAR') || upperName.includes('GLONASS') || upperName.includes('GALILEO') || upperName.includes('BEIDOU')) {
    return 'gps';
  }
  if (upperName.includes('NOAA') || upperName.includes('GOES') || upperName.includes('METEO') || upperName.includes('FENGYUN')) {
    return 'weather';
  }
  if (upperName.includes('INTELSAT') || upperName.includes('IRIDIUM') || upperName.includes('ORBCOMM')) {
    return 'communication';
  }
  if (upperName.includes('HUBBLE') || upperName.includes('CHANDRA') || upperName.includes('JWST') || upperName.includes('TERRA') || upperName.includes('AQUA')) {
    return 'scientific';
  }
  if (category === 'amateur') return 'amateur';
  
  return 'other';
}

// ============================================================================
// Aggregated Data Fetchers
// ============================================================================

/**
 * Fetch all astronomical events for a given month from multiple sources
 */
export async function fetchAllAstroEvents(
  year: number, 
  month: number,
  enabledSources: string[] = ['usno', 'imo', 'nasa', 'mpc']
): Promise<AstroEvent[]> {
  const allEvents: AstroEvent[] = [];
  
  const fetchPromises: Promise<AstroEvent[]>[] = [];
  
  if (enabledSources.includes('usno')) {
    fetchPromises.push(fetchLunarPhases(year, month));
  }
  
  if (enabledSources.includes('imo')) {
    fetchPromises.push(fetchMeteorShowers(year, month));
  }
  
  if (enabledSources.includes('nasa')) {
    fetchPromises.push(fetchEclipses(year, month));
  }
  
  if (enabledSources.includes('mpc')) {
    fetchPromises.push(fetchComets());
  }
  
  const results = await Promise.allSettled(fetchPromises);
  
  results.forEach(result => {
    if (result.status === 'fulfilled') {
      allEvents.push(...result.value);
    }
  });
  
  // Sort by date
  allEvents.sort((a, b) => a.date.getTime() - b.date.getTime());
  
  return allEvents;
}

/**
 * Fetch all satellites from multiple sources
 */
export async function fetchAllSatellites(
  categories: string[] = ['stations', 'visual', 'starlink']
): Promise<SatelliteData[]> {
  const allSatellites: SatelliteData[] = [];
  const seenIds = new Set<number>();
  
  const fetchPromises = categories.map(cat => fetchSatelliteTLE(cat));
  const results = await Promise.allSettled(fetchPromises);
  
  results.forEach(result => {
    if (result.status === 'fulfilled') {
      result.value.forEach(sat => {
        if (!seenIds.has(sat.noradId)) {
          seenIds.add(sat.noradId);
          allSatellites.push(sat);
        }
      });
    }
  });
  
  // Sort by name
  allSatellites.sort((a, b) => a.name.localeCompare(b.name));
  
  return allSatellites;
}
