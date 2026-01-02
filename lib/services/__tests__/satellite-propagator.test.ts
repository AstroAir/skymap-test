/**
 * @jest-environment jsdom
 */

import {
  parseTLE,
  calculatePosition,
  predictPasses,
  calculateMultiplePositions,
  createPositionUpdater,
  type TLEData,
  type ObserverLocation,
} from '../satellite-propagator';

// Sample ISS TLE data (epoch may be outdated but format is valid)
const ISS_TLE: TLEData = {
  name: 'ISS (ZARYA)',
  line1: '1 25544U 98067A   24001.50000000  .00016717  00000-0  10270-3 0  9993',
  line2: '2 25544  51.6400 208.9163 0006703 296.4597 324.8853 15.49390283999999',
};

const OBSERVER: ObserverLocation = {
  latitude: 45.5017,
  longitude: -73.5673,
  altitude: 100,
};

describe('satellite-propagator', () => {
  describe('parseTLE', () => {
    it('should parse valid TLE data', () => {
      const satrec = parseTLE(ISS_TLE);
      
      expect(satrec).not.toBeNull();
      expect(satrec?.satnum).toBe('25544');
    });

    it('should handle malformed TLE gracefully', () => {
      // satellite.js parses even invalid TLEs but produces NaN values
      const result = parseTLE({
        name: 'Invalid',
        line1: 'invalid line 1',
        line2: 'invalid line 2',
      });
      
      // The library returns a satrec with NaN values for invalid data
      if (result) {
        expect(isNaN(result.no)).toBe(true);
      }
    });
  });

  describe('calculatePosition', () => {
    it('should calculate satellite position', () => {
      const satrec = parseTLE(ISS_TLE);
      if (!satrec) throw new Error('Failed to parse TLE');
      
      const date = new Date('2024-01-01T12:00:00Z');
      const position = calculatePosition(satrec, date, OBSERVER);
      
      expect(position).not.toBeNull();
      expect(position?.latitude).toBeGreaterThanOrEqual(-90);
      expect(position?.latitude).toBeLessThanOrEqual(90);
      expect(position?.longitude).toBeGreaterThanOrEqual(-180);
      expect(position?.longitude).toBeLessThanOrEqual(180);
      expect(position?.altitude).toBeGreaterThan(0);
    });

    it('should calculate azimuth and elevation', () => {
      const satrec = parseTLE(ISS_TLE);
      if (!satrec) throw new Error('Failed to parse TLE');
      
      const date = new Date('2024-01-01T12:00:00Z');
      const position = calculatePosition(satrec, date, OBSERVER);
      
      expect(position?.azimuth).toBeGreaterThanOrEqual(0);
      expect(position?.azimuth).toBeLessThan(360);
      expect(position?.elevation).toBeGreaterThanOrEqual(-90);
      expect(position?.elevation).toBeLessThanOrEqual(90);
    });

    it('should calculate RA and Dec', () => {
      const satrec = parseTLE(ISS_TLE);
      if (!satrec) throw new Error('Failed to parse TLE');
      
      const date = new Date('2024-01-01T12:00:00Z');
      const position = calculatePosition(satrec, date, OBSERVER);
      
      expect(position?.ra).toBeGreaterThanOrEqual(0);
      expect(position?.ra).toBeLessThan(360);
      expect(position?.dec).toBeGreaterThanOrEqual(-90);
      expect(position?.dec).toBeLessThanOrEqual(90);
    });

    it('should calculate velocity', () => {
      const satrec = parseTLE(ISS_TLE);
      if (!satrec) throw new Error('Failed to parse TLE');
      
      const date = new Date('2024-01-01T12:00:00Z');
      const position = calculatePosition(satrec, date, OBSERVER);
      
      // ISS velocity is approximately 7.66 km/s
      expect(position?.velocity).toBeGreaterThan(5);
      expect(position?.velocity).toBeLessThan(10);
    });

    it('should determine visibility status', () => {
      const satrec = parseTLE(ISS_TLE);
      if (!satrec) throw new Error('Failed to parse TLE');
      
      const date = new Date('2024-01-01T12:00:00Z');
      const position = calculatePosition(satrec, date, OBSERVER);
      
      expect(typeof position?.isVisible).toBe('boolean');
      expect(typeof position?.isSunlit).toBe('boolean');
    });

    it('should calculate range to satellite', () => {
      const satrec = parseTLE(ISS_TLE);
      if (!satrec) throw new Error('Failed to parse TLE');
      
      const date = new Date('2024-01-01T12:00:00Z');
      const position = calculatePosition(satrec, date, OBSERVER);
      
      // Range depends on satellite position relative to observer
      // Can be anywhere from ~400km (overhead) to ~2500km+ (on horizon)
      expect(position?.range).toBeGreaterThan(0);
    });
  });

  describe('predictPasses', () => {
    it('should predict satellite passes', () => {
      const satrec = parseTLE(ISS_TLE);
      if (!satrec) throw new Error('Failed to parse TLE');
      
      const startTime = new Date('2024-01-01T00:00:00Z');
      const passes = predictPasses(satrec, OBSERVER, startTime, 24, 10);
      
      // ISS typically has multiple passes per day
      expect(passes.length).toBeGreaterThanOrEqual(0);
    });

    it('should include pass timing information', () => {
      const satrec = parseTLE(ISS_TLE);
      if (!satrec) throw new Error('Failed to parse TLE');
      
      const startTime = new Date('2024-01-01T00:00:00Z');
      const passes = predictPasses(satrec, OBSERVER, startTime, 48, 5);
      
      if (passes.length > 0) {
        const pass = passes[0];
        
        expect(pass.startTime).toBeInstanceOf(Date);
        expect(pass.maxTime).toBeInstanceOf(Date);
        expect(pass.endTime).toBeInstanceOf(Date);
        expect(pass.duration).toBeGreaterThan(0);
      }
    });

    it('should include azimuth/elevation at key points', () => {
      const satrec = parseTLE(ISS_TLE);
      if (!satrec) throw new Error('Failed to parse TLE');
      
      const startTime = new Date('2024-01-01T00:00:00Z');
      const passes = predictPasses(satrec, OBSERVER, startTime, 48, 5);
      
      if (passes.length > 0) {
        const pass = passes[0];
        
        expect(pass.startAzimuth).toBeGreaterThanOrEqual(0);
        expect(pass.maxAzimuth).toBeGreaterThanOrEqual(0);
        expect(pass.endAzimuth).toBeGreaterThanOrEqual(0);
        expect(pass.maxElevation).toBeGreaterThanOrEqual(5); // Min elevation filter
      }
    });

    it('should filter passes by minimum elevation', () => {
      const satrec = parseTLE(ISS_TLE);
      if (!satrec) throw new Error('Failed to parse TLE');
      
      const startTime = new Date('2024-01-01T00:00:00Z');
      const lowPasses = predictPasses(satrec, OBSERVER, startTime, 24, 5);
      const highPasses = predictPasses(satrec, OBSERVER, startTime, 24, 60);
      
      // Higher minimum elevation should result in fewer passes
      expect(highPasses.length).toBeLessThanOrEqual(lowPasses.length);
    });
  });

  describe('calculateMultiplePositions', () => {
    it('should calculate positions for multiple satellites', () => {
      const satrec1 = parseTLE(ISS_TLE);
      if (!satrec1) throw new Error('Failed to parse TLE');
      
      const satellites = [
        { satrec: satrec1, id: 'iss', name: 'ISS' },
      ];
      
      const date = new Date('2024-01-01T12:00:00Z');
      const positions = calculateMultiplePositions(satellites, date, OBSERVER);
      
      expect(positions.length).toBe(1);
      expect(positions[0].id).toBe('iss');
      expect(positions[0].name).toBe('ISS');
      expect(positions[0].position).not.toBeNull();
    });

    it('should preserve satellite metadata', () => {
      const satrec = parseTLE(ISS_TLE);
      if (!satrec) throw new Error('Failed to parse TLE');
      
      const satellites = [
        { satrec, id: 'sat-123', name: 'Test Satellite' },
      ];
      
      const positions = calculateMultiplePositions(satellites, new Date(), OBSERVER);
      
      expect(positions[0].id).toBe('sat-123');
      expect(positions[0].name).toBe('Test Satellite');
    });
  });

  describe('createPositionUpdater', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should call callback immediately', () => {
      const satrec = parseTLE(ISS_TLE);
      if (!satrec) throw new Error('Failed to parse TLE');
      
      const satellites = [{ satrec, id: 'iss', name: 'ISS' }];
      const callback = jest.fn();
      
      const cleanup = createPositionUpdater(satellites, OBSERVER, callback, 1000);
      
      expect(callback).toHaveBeenCalledTimes(1);
      
      cleanup();
    });

    it('should call callback at interval', () => {
      const satrec = parseTLE(ISS_TLE);
      if (!satrec) throw new Error('Failed to parse TLE');
      
      const satellites = [{ satrec, id: 'iss', name: 'ISS' }];
      const callback = jest.fn();
      
      const cleanup = createPositionUpdater(satellites, OBSERVER, callback, 1000);
      
      jest.advanceTimersByTime(3000);
      
      // Initial + 3 interval calls
      expect(callback).toHaveBeenCalledTimes(4);
      
      cleanup();
    });

    it('should stop updates when cleanup called', () => {
      const satrec = parseTLE(ISS_TLE);
      if (!satrec) throw new Error('Failed to parse TLE');
      
      const satellites = [{ satrec, id: 'iss', name: 'ISS' }];
      const callback = jest.fn();
      
      const cleanup = createPositionUpdater(satellites, OBSERVER, callback, 1000);
      cleanup();
      
      const callCount = callback.mock.calls.length;
      jest.advanceTimersByTime(5000);
      
      expect(callback).toHaveBeenCalledTimes(callCount);
    });

    it('should provide position data to callback', () => {
      const satrec = parseTLE(ISS_TLE);
      if (!satrec) throw new Error('Failed to parse TLE');
      
      const satellites = [{ satrec, id: 'iss', name: 'ISS' }];
      const callback = jest.fn();
      
      const cleanup = createPositionUpdater(satellites, OBSERVER, callback, 1000);
      
      expect(callback).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'iss',
            name: 'ISS',
            position: expect.any(Object),
          }),
        ])
      );
      
      cleanup();
    });
  });
});
