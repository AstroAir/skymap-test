/**
 * @jest-environment jsdom
 */

import {
  DEFAULT_DATA_SOURCES,
  getDSSImageUrl,
  getWikipediaApiUrl,
  getWikipediaImageUrl,
  getSimbadQueryUrl,
  getSimbadTapUrl,
  checkSourceHealth,
  checkAllSourcesHealth,
  getActiveSources,
  findSource,
} from '../config';
import type { DataSource } from '../types';

// Mock fetch for health check tests
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('object-info config', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('DEFAULT_DATA_SOURCES', () => {
    it('should have default data sources', () => {
      expect(DEFAULT_DATA_SOURCES.length).toBeGreaterThan(0);
    });

    it('should include SIMBAD source', () => {
      const simbad = DEFAULT_DATA_SOURCES.find(s => s.id === 'simbad');
      expect(simbad).toBeDefined();
      expect(simbad?.enabled).toBe(true);
    });

    it('should include local source', () => {
      const local = DEFAULT_DATA_SOURCES.find(s => s.id === 'local');
      expect(local).toBeDefined();
      expect(local?.enabled).toBe(true);
    });

    it('should have valid priority values', () => {
      DEFAULT_DATA_SOURCES.forEach(source => {
        expect(typeof source.priority).toBe('number');
        expect(source.priority).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('getDSSImageUrl', () => {
    it('should generate valid DSS URL', () => {
      const url = getDSSImageUrl(83.82, -5.39);
      
      expect(url).toContain('archive.stsci.edu');
      expect(url).toContain('dss_search');
    });

    it('should include RA and Dec parameters', () => {
      const url = getDSSImageUrl(180, 45);
      
      expect(url).toContain('r=');
      expect(url).toContain('d=');
    });

    it('should accept custom size parameter', () => {
      const url = getDSSImageUrl(0, 0, 60);
      
      expect(url).toContain('h=60');
      expect(url).toContain('w=60');
    });

    it('should use default size of 30 arcminutes', () => {
      const url = getDSSImageUrl(0, 0);
      
      expect(url).toContain('h=30');
      expect(url).toContain('w=30');
    });
  });

  describe('getWikipediaApiUrl', () => {
    it('should generate valid Wikipedia API URL', () => {
      const url = getWikipediaApiUrl('Andromeda_Galaxy');
      
      expect(url).toContain('en.wikipedia.org');
      expect(url).toContain('/api/rest_v1/page/summary/');
      expect(url).toContain('Andromeda_Galaxy');
    });

    it('should encode special characters', () => {
      const url = getWikipediaApiUrl('NGC 7000');
      
      expect(url).toContain('NGC%207000');
    });
  });

  describe('getWikipediaImageUrl', () => {
    it('should generate valid Wikipedia image URL', () => {
      const url = getWikipediaImageUrl('Orion_Nebula.jpg');
      
      expect(url).toContain('en.wikipedia.org');
      expect(url).toContain('Special:FilePath');
    });

    it('should include width parameter', () => {
      const url = getWikipediaImageUrl('image.jpg', 500);
      
      expect(url).toContain('width=500');
    });

    it('should use default size of 300', () => {
      const url = getWikipediaImageUrl('image.jpg');
      
      expect(url).toContain('width=300');
    });
  });

  describe('getSimbadQueryUrl', () => {
    it('should generate valid SIMBAD query URL', () => {
      const url = getSimbadQueryUrl('M31');
      
      expect(url).toContain('simbad.u-strasbg.fr');
      expect(url).toContain('sim-id');
      expect(url).toContain('M31');
    });

    it('should encode special characters', () => {
      const url = getSimbadQueryUrl('NGC 1234');
      
      expect(url).toContain('NGC%201234');
    });
  });

  describe('getSimbadTapUrl', () => {
    it('should generate valid SIMBAD TAP URL', () => {
      const query = 'SELECT * FROM basic WHERE main_id = "M31"';
      const url = getSimbadTapUrl(query);
      
      expect(url).toContain('simbad.u-strasbg.fr');
      expect(url).toContain('sim-tap/sync');
      expect(url).toContain('REQUEST=doQuery');
    });

    it('should encode query parameter', () => {
      const query = 'SELECT TOP 10 * FROM basic';
      const url = getSimbadTapUrl(query);
      
      expect(url).toContain('QUERY=');
      expect(url).not.toContain(' '); // Spaces should be encoded
    });
  });

  describe('checkSourceHealth', () => {
    it('should return true for healthy source', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });
      
      const source: DataSource = {
        id: 'test',
        name: 'Test',
        url: 'https://example.com',
        enabled: true,
        priority: 1,
        timeout: 5000,
        healthy: true,
      };
      
      const result = await checkSourceHealth(source);
      expect(result).toBe(true);
    });

    it('should return true for source without URL', async () => {
      const source: DataSource = {
        id: 'local',
        name: 'Local',
        enabled: true,
        priority: 0,
        timeout: 100,
        healthy: true,
      };
      
      const result = await checkSourceHealth(source);
      expect(result).toBe(true);
    });

    it('should return true for 405 response (method not allowed)', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 405 });
      
      const source: DataSource = {
        id: 'test',
        name: 'Test',
        url: 'https://example.com',
        enabled: true,
        priority: 1,
        timeout: 5000,
        healthy: true,
      };
      
      const result = await checkSourceHealth(source);
      expect(result).toBe(true);
    });

    it('should return false on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      const source: DataSource = {
        id: 'test',
        name: 'Test',
        url: 'https://example.com',
        enabled: true,
        priority: 1,
        timeout: 5000,
        healthy: true,
      };
      
      const result = await checkSourceHealth(source);
      expect(result).toBe(false);
    });
  });

  describe('checkAllSourcesHealth', () => {
    it('should check health of all sources', async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200 });
      
      const sources: DataSource[] = [
        { id: 'a', name: 'A', url: 'https://a.com', enabled: true, priority: 1, timeout: 1000, healthy: true },
        { id: 'b', name: 'B', url: 'https://b.com', enabled: true, priority: 2, timeout: 1000, healthy: true },
      ];
      
      const results = await checkAllSourcesHealth(sources);
      
      expect(results.size).toBe(2);
      expect(results.get('a')).toBe(true);
      expect(results.get('b')).toBe(true);
    });

    it('should handle mixed health results', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, status: 200 })
        .mockRejectedValueOnce(new Error('Failed'));
      
      const sources: DataSource[] = [
        { id: 'healthy', name: 'Healthy', url: 'https://ok.com', enabled: true, priority: 1, timeout: 1000, healthy: true },
        { id: 'unhealthy', name: 'Unhealthy', url: 'https://fail.com', enabled: true, priority: 2, timeout: 1000, healthy: true },
      ];
      
      const results = await checkAllSourcesHealth(sources);
      
      expect(results.get('healthy')).toBe(true);
      expect(results.get('unhealthy')).toBe(false);
    });
  });

  describe('getActiveSources', () => {
    it('should return only enabled and healthy sources', () => {
      const sources: DataSource[] = [
        { id: 'a', name: 'A', enabled: true, priority: 1, timeout: 1000, healthy: true },
        { id: 'b', name: 'B', enabled: false, priority: 2, timeout: 1000, healthy: true },
        { id: 'c', name: 'C', enabled: true, priority: 3, timeout: 1000, healthy: false },
      ];
      
      const active = getActiveSources(sources);
      
      expect(active.length).toBe(1);
      expect(active[0].id).toBe('a');
    });

    it('should sort by priority', () => {
      const sources: DataSource[] = [
        { id: 'c', name: 'C', enabled: true, priority: 3, timeout: 1000, healthy: true },
        { id: 'a', name: 'A', enabled: true, priority: 1, timeout: 1000, healthy: true },
        { id: 'b', name: 'B', enabled: true, priority: 2, timeout: 1000, healthy: true },
      ];
      
      const active = getActiveSources(sources);
      
      expect(active[0].id).toBe('a');
      expect(active[1].id).toBe('b');
      expect(active[2].id).toBe('c');
    });
  });

  describe('findSource', () => {
    it('should find source by ID', () => {
      const sources: DataSource[] = [
        { id: 'a', name: 'A', enabled: true, priority: 1, timeout: 1000, healthy: true },
        { id: 'b', name: 'B', enabled: true, priority: 2, timeout: 1000, healthy: true },
      ];
      
      const found = findSource(sources, 'b');
      
      expect(found).toBeDefined();
      expect(found?.name).toBe('B');
    });

    it('should return undefined for non-existent ID', () => {
      const sources: DataSource[] = [
        { id: 'a', name: 'A', enabled: true, priority: 1, timeout: 1000, healthy: true },
      ];
      
      const found = findSource(sources, 'nonexistent');
      
      expect(found).toBeUndefined();
    });
  });
});
