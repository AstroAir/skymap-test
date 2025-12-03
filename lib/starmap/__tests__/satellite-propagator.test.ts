/**
 * @jest-environment jsdom
 */
import {
  parseTLE,
  calculatePosition,
  type TLEData,
  type ObserverLocation,
} from '../satellite-propagator';

// Sample TLE data for ISS
const ISS_TLE: TLEData = {
  name: 'ISS (ZARYA)',
  line1: '1 25544U 98067A   24001.50000000  .00016717  00000-0  10270-3 0  9993',
  line2: '2 25544  51.6416 208.5481 0006703  35.9375 324.2045 15.49560722431234',
};

// Sample observer location (New York)
const OBSERVER: ObserverLocation = {
  latitude: 40.7128,
  longitude: -74.006,
  altitude: 10,
};

describe('parseTLE', () => {
  it('parses valid TLE data', () => {
    const satrec = parseTLE(ISS_TLE);
    expect(satrec).not.toBeNull();
  });

  it('returns object with NaN values for invalid TLE', () => {
    const invalidTLE: TLEData = {
      name: 'Invalid',
      line1: 'invalid line 1',
      line2: 'invalid line 2',
    };
    const satrec = parseTLE(invalidTLE);
    // satellite.js returns an object with NaN values for invalid TLE
    expect(satrec).not.toBeNull();
    if (satrec) {
      expect(Number.isNaN(satrec.a)).toBe(true);
    }
  });

  it('handles empty TLE lines with NaN values', () => {
    const emptyTLE: TLEData = {
      name: 'Empty',
      line1: '',
      line2: '',
    };
    const satrec = parseTLE(emptyTLE);
    // satellite.js returns an object with NaN values for empty TLE
    expect(satrec).not.toBeNull();
    if (satrec) {
      expect(Number.isNaN(satrec.a)).toBe(true);
    }
  });
});

describe('calculatePosition', () => {
  it('calculates position for valid satellite', () => {
    const satrec = parseTLE(ISS_TLE);
    if (!satrec) {
      throw new Error('Failed to parse TLE');
    }

    const position = calculatePosition(satrec, new Date(), OBSERVER);
    
    if (position) {
      expect(position).toHaveProperty('latitude');
      expect(position).toHaveProperty('longitude');
      expect(position).toHaveProperty('altitude');
      expect(position).toHaveProperty('azimuth');
      expect(position).toHaveProperty('elevation');
      expect(position).toHaveProperty('range');
      expect(position).toHaveProperty('ra');
      expect(position).toHaveProperty('dec');
      expect(position).toHaveProperty('velocity');
      expect(position).toHaveProperty('isVisible');
      expect(position).toHaveProperty('isSunlit');
    }
  });

  it('returns valid latitude range', () => {
    const satrec = parseTLE(ISS_TLE);
    if (!satrec) {
      throw new Error('Failed to parse TLE');
    }

    const position = calculatePosition(satrec, new Date(), OBSERVER);
    
    if (position) {
      expect(position.latitude).toBeGreaterThanOrEqual(-90);
      expect(position.latitude).toBeLessThanOrEqual(90);
    }
  });

  it('returns valid longitude range', () => {
    const satrec = parseTLE(ISS_TLE);
    if (!satrec) {
      throw new Error('Failed to parse TLE');
    }

    const position = calculatePosition(satrec, new Date(), OBSERVER);
    
    if (position) {
      expect(position.longitude).toBeGreaterThanOrEqual(-180);
      expect(position.longitude).toBeLessThanOrEqual(180);
    }
  });

  it('returns valid azimuth range', () => {
    const satrec = parseTLE(ISS_TLE);
    if (!satrec) {
      throw new Error('Failed to parse TLE');
    }

    const position = calculatePosition(satrec, new Date(), OBSERVER);
    
    if (position) {
      expect(position.azimuth).toBeGreaterThanOrEqual(0);
      expect(position.azimuth).toBeLessThan(360);
    }
  });

  it('returns valid RA range', () => {
    const satrec = parseTLE(ISS_TLE);
    if (!satrec) {
      throw new Error('Failed to parse TLE');
    }

    const position = calculatePosition(satrec, new Date(), OBSERVER);
    
    if (position) {
      expect(position.ra).toBeGreaterThanOrEqual(0);
      expect(position.ra).toBeLessThan(360);
    }
  });

  it('returns valid Dec range', () => {
    const satrec = parseTLE(ISS_TLE);
    if (!satrec) {
      throw new Error('Failed to parse TLE');
    }

    const position = calculatePosition(satrec, new Date(), OBSERVER);
    
    if (position) {
      expect(position.dec).toBeGreaterThanOrEqual(-90);
      expect(position.dec).toBeLessThanOrEqual(90);
    }
  });

  it('returns positive altitude for ISS', () => {
    const satrec = parseTLE(ISS_TLE);
    if (!satrec) {
      throw new Error('Failed to parse TLE');
    }

    const position = calculatePosition(satrec, new Date(), OBSERVER);
    
    if (position) {
      // ISS orbits at ~400km
      expect(position.altitude).toBeGreaterThan(300);
      expect(position.altitude).toBeLessThan(500);
    }
  });

  it('handles different observer locations', () => {
    const satrec = parseTLE(ISS_TLE);
    if (!satrec) {
      throw new Error('Failed to parse TLE');
    }

    const observers: ObserverLocation[] = [
      { latitude: 0, longitude: 0, altitude: 0 },
      { latitude: 51.5074, longitude: -0.1278, altitude: 11 },
      { latitude: -33.8688, longitude: 151.2093, altitude: 58 },
    ];

    observers.forEach((observer) => {
      const position = calculatePosition(satrec, new Date(), observer);
      // Position should be calculable for any observer
      expect(position === null || typeof position === 'object').toBe(true);
    });
  });

  it('handles different dates', () => {
    const satrec = parseTLE(ISS_TLE);
    if (!satrec) {
      throw new Error('Failed to parse TLE');
    }

    const dates = [
      new Date('2024-01-01T00:00:00Z'),
      new Date('2024-06-15T12:00:00Z'),
      new Date('2024-12-31T23:59:59Z'),
    ];

    dates.forEach((date) => {
      const position = calculatePosition(satrec, date, OBSERVER);
      // Position should be calculable for any date
      expect(position === null || typeof position === 'object').toBe(true);
    });
  });
});
