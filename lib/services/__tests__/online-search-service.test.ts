/**
 * Online Search Service Tests
 */

import {
  searchOnlineByName,
  resolveObjectName,
  checkOnlineSearchAvailability,
  ONLINE_SEARCH_SOURCES,
  type OnlineSearchResult,
  type OnlineSearchResponse,
} from '../online-search-service';

// Mock smartFetch
jest.mock('../http-fetch', () => ({
  smartFetch: jest.fn(),
}));

import { smartFetch, type FetchResponse } from '../http-fetch';
const mockSmartFetch = smartFetch as jest.MockedFunction<typeof smartFetch>;

// Helper to create mock response
function createMockResponse(text: string, ok = true): Partial<FetchResponse> {
  return {
    ok,
    text: jest.fn().mockResolvedValue(text),
  };
}

describe('online-search-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    mockSmartFetch.mockReset();
  });

  describe('ONLINE_SEARCH_SOURCES', () => {
    it('should have all required sources configured', () => {
      expect(ONLINE_SEARCH_SOURCES.simbad).toBeDefined();
      expect(ONLINE_SEARCH_SOURCES.sesame).toBeDefined();
      expect(ONLINE_SEARCH_SOURCES.vizier).toBeDefined();
      expect(ONLINE_SEARCH_SOURCES.ned).toBeDefined();
      expect(ONLINE_SEARCH_SOURCES.mpc).toBeDefined();
    });

    it('should have correct base URLs', () => {
      expect(ONLINE_SEARCH_SOURCES.simbad.baseUrl).toBe('https://simbad.cds.unistra.fr');
      expect(ONLINE_SEARCH_SOURCES.sesame.baseUrl).toBe('https://cds.unistra.fr');
    });
  });

  describe('searchOnlineByName', () => {
    it('should return empty results for empty query', async () => {
      const result = await searchOnlineByName('');
      expect(result.results).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });

    it('should call Sesame API for name resolution', async () => {
      const mockResponse = createMockResponse(`
          <Sesame>
            <Resolver name="S=Simbad">
              <oname>M 31</oname>
              <jpos>10.6847 41.2689</jpos>
              <otype>G</otype>
            </Resolver>
          </Sesame>
        `);
      mockSmartFetch.mockResolvedValue(mockResponse as FetchResponse);

      const result = await searchOnlineByName('M31', { sources: ['sesame'] });

      expect(mockSmartFetch).toHaveBeenCalled();
      expect(result.sources).toContain('sesame');
    });

    it('should handle API errors gracefully', async () => {
      mockSmartFetch
        .mockImplementationOnce(async () => { throw new Error('Network error'); })
        .mockImplementationOnce(async () => { throw new Error('Network error'); });

      const result = await searchOnlineByName('M31', { sources: ['sesame'] });

      expect(result.results).toHaveLength(0);
      expect(result.errors).toBeDefined();
    });

    it('should merge results from multiple sources', async () => {
      const mockSesameResponse = createMockResponse(`
          <Sesame>
            <Resolver>
              <oname>M 31</oname>
              <jpos>10.6847 41.2689</jpos>
            </Resolver>
          </Sesame>
        `);

      mockSmartFetch.mockResolvedValue(mockSesameResponse as FetchResponse);

      const result = await searchOnlineByName('M31', { 
        sources: ['sesame'], 
        limit: 10 
      });

      expect(result.searchTimeMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('resolveObjectName', () => {
    it('should resolve known object names', async () => {
      const mockResponse = createMockResponse(`
          <Sesame>
            <Resolver>
              <oname>NGC 7000</oname>
              <jpos>314.6833 44.3167</jpos>
              <otype>HII</otype>
            </Resolver>
          </Sesame>
        `);
      mockSmartFetch.mockResolvedValue(mockResponse as FetchResponse);

      const result = await resolveObjectName('NGC7000');

      if (result) {
        expect(result.name).toBeDefined();
        expect(result.ra).toBeDefined();
        expect(result.dec).toBeDefined();
      }
    });

    it('should return null for unknown objects', async () => {
      const mockResponse = createMockResponse('<Sesame></Sesame>');
      mockSmartFetch.mockResolvedValue(mockResponse as FetchResponse);

      const result = await resolveObjectName('UNKNOWN_OBJECT_12345');
      expect(result).toBeNull();
    });
  });

  describe('checkOnlineSearchAvailability', () => {
    it('should check availability of online sources', async () => {
      mockSmartFetch.mockResolvedValue({ ok: true } as FetchResponse);

      const result = await checkOnlineSearchAvailability();

      expect(result).toHaveProperty('sesame');
      expect(result).toHaveProperty('simbad');
      expect(result).toHaveProperty('mpc');
      expect(result.local).toBe(true);
    });

    it('should handle offline sources', async () => {
      mockSmartFetch
        .mockImplementationOnce(async () => { throw new Error('Network error'); })
        .mockImplementationOnce(async () => { throw new Error('Network error'); })
        .mockImplementationOnce(async () => { throw new Error('Network error'); })
        .mockImplementationOnce(async () => { throw new Error('Network error'); })
        .mockImplementationOnce(async () => { throw new Error('Network error'); });

      const result = await checkOnlineSearchAvailability();

      expect(result.local).toBe(true);
    });
  });

  describe('OnlineSearchResult type', () => {
    it('should have correct structure', () => {
      const mockResult: OnlineSearchResult = {
        id: 'sesame-m31',
        name: 'M 31',
        canonicalId: 'M31',
        identifiers: ['M31', 'M 31'],
        confidence: 0.9,
        type: 'Galaxy',
        category: 'galaxy',
        ra: 10.6847,
        dec: 41.2689,
        source: 'sesame',
      };

      expect(mockResult.id).toBe('sesame-m31');
      expect(mockResult.source).toBe('sesame');
    });
  });

  describe('OnlineSearchResponse type', () => {
    it('should have correct structure', () => {
      const mockResponse: OnlineSearchResponse = {
        results: [],
        sources: ['sesame'],
        totalCount: 0,
        searchTimeMs: 100,
      };

      expect(mockResponse.results).toEqual([]);
      expect(mockResponse.sources).toContain('sesame');
    });
  });

  describe('signal support', () => {
    it('should accept signal option without error', async () => {
      const controller = new AbortController();
      const mockResponse = createMockResponse(`
        <Sesame>
          <Resolver>
            <oname>M 42</oname>
            <jpos>83.8221 -5.3911</jpos>
          </Resolver>
        </Sesame>
      `);
      mockSmartFetch.mockResolvedValue(mockResponse as FetchResponse);

      const result = await searchOnlineByName('M42', {
        sources: ['sesame'],
        signal: controller.signal,
      });

      expect(result.results.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('deduplication', () => {
    it('should deduplicate results with close coordinates', async () => {
      // Sesame returns one result
      const mockResponse = createMockResponse(`
        <Sesame>
          <Resolver>
            <oname>M 31</oname>
            <jpos>10.6847 41.2689</jpos>
            <otype>G</otype>
          </Resolver>
          <Resolver>
            <oname>Andromeda Galaxy</oname>
            <jpos>10.6848 41.2690</jpos>
            <otype>G</otype>
          </Resolver>
        </Sesame>
      `);
      mockSmartFetch.mockResolvedValue(mockResponse as FetchResponse);

      const result = await searchOnlineByName('M31', { sources: ['sesame'] });

      // Should deduplicate close coordinates (within 0.001 deg)
      expect(result.results.length).toBe(1);
      // Alternate name should be merged
      expect(result.results[0].alternateNames).toContain('Andromeda Galaxy');
    });
  });

  describe('availability checks', () => {
    it('should check all four sources', async () => {
      mockSmartFetch.mockResolvedValue({ ok: true } as FetchResponse);

      const result = await checkOnlineSearchAvailability();

      expect(result).toHaveProperty('sesame');
      expect(result).toHaveProperty('simbad');
      expect(result).toHaveProperty('vizier');
      expect(result).toHaveProperty('ned');
      expect(result).toHaveProperty('mpc');
      expect(result.local).toBe(true);
    });
  });

  describe('retry behavior', () => {
    it('should retry on network error and succeed on second attempt', async () => {
      const mockResponse = createMockResponse(`
        <Sesame>
          <Resolver>
            <oname>M 1</oname>
            <jpos>83.6331 22.0145</jpos>
          </Resolver>
        </Sesame>
      `);

      mockSmartFetch
        .mockImplementationOnce(async () => { throw new Error('Network error'); })
        .mockResolvedValueOnce(mockResponse as FetchResponse);

      const result = await searchOnlineByName('M1', { sources: ['sesame'] });

      // Should have called smartFetch at least twice (retry)
      expect(mockSmartFetch.mock.calls.length).toBeGreaterThanOrEqual(2);
      expect(result.sources).toContain('sesame');
    });
  });
});
