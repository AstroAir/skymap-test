/**
 * Tests for data-sources.ts
 */

import {
  TLE_SOURCES,
  fetchTLEFromSource,
  fetchTLEByCategory,
  fetchTLEByNoradId,
  fetchISSTLE,
  NOTABLE_SATELLITES,
  getCacheStatus,
  clearTLECache,
} from '../data-sources';

// Mock smartFetch
jest.mock('../../http-fetch', () => ({
  smartFetch: jest.fn(),
}));

// Mock parseTLEText
jest.mock('../propagator', () => ({
  parseTLEText: jest.fn((text: string) => {
    if (!text || text === '') return [];
    return [{
      name: 'TEST SAT',
      line1: '1 25544U 98067A   24001.00000000  .00000000  00000-0  00000-0 0  0009',
      line2: '2 25544  51.6400   0.0000 0000000   0.0000   0.0000 15.50000000000009',
      catalogNumber: 25544,
      epochYear: 2024,
      epochDay: 1,
      inclination: 51.64,
      raan: 0,
      eccentricity: 0,
      argOfPerigee: 0,
      meanAnomaly: 0,
      meanMotion: 15.5,
    }];
  }),
}));

import { smartFetch } from '../../http-fetch';

describe('satellite data-sources', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearTLECache();
  });

  describe('TLE_SOURCES', () => {
    it('should be an array of TLE sources', () => {
      expect(Array.isArray(TLE_SOURCES)).toBe(true);
      expect(TLE_SOURCES.length).toBeGreaterThan(0);
    });

    it('should have valid source structure', () => {
      TLE_SOURCES.forEach(source => {
        expect(source.id).toBeDefined();
        expect(source.name).toBeDefined();
        expect(source.url).toBeDefined();
        expect(source.category).toBeDefined();
        expect(Array.isArray(source.category)).toBe(true);
        expect(typeof source.updateInterval).toBe('number');
      });
    });

    it('should include space stations source', () => {
      const stationsSource = TLE_SOURCES.find(s => s.category.includes('space-stations'));
      expect(stationsSource).toBeDefined();
    });

    it('should include Starlink source', () => {
      const starlinkSource = TLE_SOURCES.find(s => s.category.includes('starlink'));
      expect(starlinkSource).toBeDefined();
    });

    it('should have valid CelesTrak URLs', () => {
      TLE_SOURCES.forEach(source => {
        expect(source.url).toContain('celestrak.org');
      });
    });
  });

  describe('NOTABLE_SATELLITES', () => {
    it('should include ISS', () => {
      expect(NOTABLE_SATELLITES.ISS).toBeDefined();
      expect(NOTABLE_SATELLITES.ISS.noradId).toBe(25544);
      expect(NOTABLE_SATELLITES.ISS.name).toContain('ISS');
    });

    it('should include HST', () => {
      expect(NOTABLE_SATELLITES.HST).toBeDefined();
      expect(NOTABLE_SATELLITES.HST.noradId).toBe(20580);
    });

    it('should include Tiangong', () => {
      expect(NOTABLE_SATELLITES.TIANGONG).toBeDefined();
      expect(NOTABLE_SATELLITES.TIANGONG.name).toContain('TIANHE');
    });
  });

  describe('fetchTLEFromSource', () => {
    it('should fetch TLE data from source', async () => {
      (smartFetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue('ISS (ZARYA)\n1 25544U...\n2 25544...'),
      });

      const source = TLE_SOURCES[0];
      const result = await fetchTLEFromSource(source);

      expect(smartFetch).toHaveBeenCalledWith(source.url, expect.any(Object));
      expect(result.source).toBe(source.id);
      expect(result.satellites).toBeDefined();
      expect(result.fetchedAt).toBeInstanceOf(Date);
    });

    it('should use cache for repeated requests', async () => {
      (smartFetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue('ISS\n1 25544U...\n2 25544...'),
      });

      const source = TLE_SOURCES[0];
      
      await fetchTLEFromSource(source);
      const fetchCount1 = (smartFetch as jest.Mock).mock.calls.length;

      await fetchTLEFromSource(source);
      const fetchCount2 = (smartFetch as jest.Mock).mock.calls.length;

      expect(fetchCount2).toBe(fetchCount1);
    });

    it('should handle fetch errors', async () => {
      (smartFetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      const source = TLE_SOURCES[0];
      const result = await fetchTLEFromSource(source);

      expect(result.satellites).toHaveLength(0);
      expect(result.error).toBeDefined();
    });

    it('should handle network errors', async () => {
      (smartFetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const source = TLE_SOURCES[0];
      const result = await fetchTLEFromSource(source);

      expect(result.satellites).toHaveLength(0);
      expect(result.error).toBe('Network error');
    });
  });

  describe('fetchTLEByCategory', () => {
    it('should fetch TLE by category', async () => {
      (smartFetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue('SAT\n1 12345U...\n2 12345...'),
      });

      const result = await fetchTLEByCategory('starlink');

      expect(result.source).toBeDefined();
      expect(result.satellites).toBeDefined();
    });

    it('should return error for unknown category', async () => {
      // @ts-expect-error Testing invalid input
      const result = await fetchTLEByCategory('nonexistent');

      expect(result.source).toBe('none');
      expect(result.satellites).toHaveLength(0);
      expect(result.error).toContain('No source for category');
    });

    it('should find correct source for category', async () => {
      (smartFetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue('SAT\n1 12345U...\n2 12345...'),
      });

      await fetchTLEByCategory('weather');

      const fetchCall = (smartFetch as jest.Mock).mock.calls[0][0];
      expect(fetchCall).toContain('weather');
    });
  });

  describe('fetchTLEByNoradId', () => {
    it('should fetch TLE by NORAD ID', async () => {
      (smartFetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue('ISS\n1 25544U...\n2 25544...'),
      });

      const result = await fetchTLEByNoradId(25544);

      expect(smartFetch).toHaveBeenCalled();
      const fetchUrl = (smartFetch as jest.Mock).mock.calls[0][0];
      expect(fetchUrl).toContain('25544');
      expect(result).toBeDefined();
    });

    it('should return null for failed fetch', async () => {
      (smartFetch as jest.Mock).mockResolvedValue({
        ok: false,
      });

      const result = await fetchTLEByNoradId(99999);

      expect(result).toBeNull();
    });

    it('should return null on network error', async () => {
      (smartFetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await fetchTLEByNoradId(25544);

      expect(result).toBeNull();
    });
  });

  describe('fetchISSTLE', () => {
    it('should fetch ISS TLE specifically', async () => {
      (smartFetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue('ISS\n1 25544U...\n2 25544...'),
      });

      await fetchISSTLE();

      expect(smartFetch).toHaveBeenCalled();
      const fetchUrl = (smartFetch as jest.Mock).mock.calls[0][0];
      expect(fetchUrl).toContain('25544');
    });

    it('should return ISS data', async () => {
      (smartFetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue('ISS\n1 25544U...\n2 25544...'),
      });

      const tle = await fetchISSTLE();

      expect(tle).toBeDefined();
      expect(tle?.catalogNumber).toBe(25544);
    });
  });

  describe('getCacheStatus', () => {
    it('should return cache status for all sources', () => {
      const status = getCacheStatus();

      expect(status).toBeDefined();
      TLE_SOURCES.forEach(source => {
        expect(status[source.id]).toBeDefined();
        expect(typeof status[source.id].hasCached).toBe('boolean');
      });
    });

    it('should show no cache initially', () => {
      const status = getCacheStatus();

      Object.values(status).forEach(sourceStatus => {
        expect(sourceStatus.hasCached).toBe(false);
      });
    });

    it('should show cache after fetch', async () => {
      (smartFetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue('SAT\n1 12345U...\n2 12345...'),
      });

      const source = TLE_SOURCES[0];
      await fetchTLEFromSource(source);

      const status = getCacheStatus();

      expect(status[source.id].hasCached).toBe(true);
      expect(status[source.id].expiresAt).toBeDefined();
      expect(status[source.id].count).toBeGreaterThan(0);
    });
  });

  describe('clearTLECache', () => {
    it('should clear all cached TLE data', async () => {
      (smartFetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue('SAT\n1 12345U...\n2 12345...'),
      });

      await fetchTLEFromSource(TLE_SOURCES[0]);
      
      const statusBefore = getCacheStatus();
      expect(statusBefore[TLE_SOURCES[0].id].hasCached).toBe(true);

      clearTLECache();

      const statusAfter = getCacheStatus();
      Object.values(statusAfter).forEach(sourceStatus => {
        expect(sourceStatus.hasCached).toBe(false);
      });
    });

    it('should allow fresh fetches after clearing', async () => {
      (smartFetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue('SAT\n1 12345U...\n2 12345...'),
      });

      const source = TLE_SOURCES[0];
      await fetchTLEFromSource(source);
      
      clearTLECache();

      const fetchCountBefore = (smartFetch as jest.Mock).mock.calls.length;
      await fetchTLEFromSource(source);
      const fetchCountAfter = (smartFetch as jest.Mock).mock.calls.length;

      expect(fetchCountAfter).toBeGreaterThan(fetchCountBefore);
    });
  });
});
