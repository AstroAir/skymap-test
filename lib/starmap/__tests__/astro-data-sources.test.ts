/**
 * @jest-environment jsdom
 */
import {
  ASTRO_EVENT_SOURCES,
  SATELLITE_SOURCES,
  fetchLunarPhases,
  fetchMeteorShowers,
  fetchAllAstroEvents,
  type AstroEvent,
  type DataSourceConfig,
} from '../astro-data-sources';

// Mock fetch
global.fetch = jest.fn();

describe('ASTRO_EVENT_SOURCES', () => {
  it('is an array', () => {
    expect(Array.isArray(ASTRO_EVENT_SOURCES)).toBe(true);
  });

  it('has at least one source', () => {
    expect(ASTRO_EVENT_SOURCES.length).toBeGreaterThan(0);
  });

  it('contains Astronomy API source', () => {
    const astronomyApi = ASTRO_EVENT_SOURCES.find(s => s.id === 'astronomyapi');
    expect(astronomyApi).toBeDefined();
    expect(astronomyApi?.enabled).toBe(true);
  });

  it('contains USNO source', () => {
    const usno = ASTRO_EVENT_SOURCES.find(s => s.id === 'usno');
    expect(usno).toBeDefined();
  });

  it('contains local calculations source', () => {
    const local = ASTRO_EVENT_SOURCES.find(s => s.id === 'local');
    expect(local).toBeDefined();
    expect(local?.priority).toBe(99);
  });

  it('all sources have required properties', () => {
    ASTRO_EVENT_SOURCES.forEach((source: DataSourceConfig) => {
      expect(source).toHaveProperty('id');
      expect(source).toHaveProperty('name');
      expect(source).toHaveProperty('enabled');
      expect(source).toHaveProperty('priority');
    });
  });
});

describe('SATELLITE_SOURCES', () => {
  it('is an array', () => {
    expect(Array.isArray(SATELLITE_SOURCES)).toBe(true);
  });

  it('has at least one source', () => {
    expect(SATELLITE_SOURCES.length).toBeGreaterThan(0);
  });

  it('contains CelesTrak source', () => {
    const celestrak = SATELLITE_SOURCES.find(s => s.id === 'celestrak');
    expect(celestrak).toBeDefined();
    expect(celestrak?.apiUrl).toContain('celestrak');
  });

  it('contains N2YO source', () => {
    const n2yo = SATELLITE_SOURCES.find(s => s.id === 'n2yo');
    expect(n2yo).toBeDefined();
  });

  it('all sources have required properties', () => {
    SATELLITE_SOURCES.forEach((source: DataSourceConfig) => {
      expect(source).toHaveProperty('id');
      expect(source).toHaveProperty('name');
      expect(source).toHaveProperty('enabled');
      expect(source).toHaveProperty('priority');
    });
  });
});

describe('fetchLunarPhases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches lunar phases for a given year and month', async () => {
    const mockResponse = {
      phasedata: [
        { phase: 'New Moon', date: '2024 Jan 11', time: '11:57' },
        { phase: 'First Quarter', date: '2024 Jan 18', time: '03:52' },
        { phase: 'Full Moon', date: '2024 Jan 25', time: '17:54' },
        { phase: 'Last Quarter', date: '2024 Feb 02', time: '23:18' },
      ],
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const events = await fetchLunarPhases(2024, 1);
    expect(Array.isArray(events)).toBe(true);
  });

  it('handles API error gracefully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
    });

    const events = await fetchLunarPhases(2024, 1);
    expect(Array.isArray(events)).toBe(true);
    expect(events.length).toBe(0);
  });

  it('handles network error gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const events = await fetchLunarPhases(2024, 1);
    expect(Array.isArray(events)).toBe(true);
    expect(events.length).toBe(0);
  });
});

describe('fetchMeteorShowers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns meteor shower events', async () => {
    const events = await fetchMeteorShowers(2024, 7); // August - Perseids
    expect(Array.isArray(events)).toBe(true);
  });

  it('includes major meteor showers in August', async () => {
    const events = await fetchMeteorShowers(2024, 7); // August - Perseids
    
    // Should include Perseids in August
    expect(events.length).toBeGreaterThan(0);
  });

  it('events have correct type', async () => {
    const events = await fetchMeteorShowers(2024, 11); // December - Geminids
    events.forEach((event: AstroEvent) => {
      expect(event.type).toBe('meteor_shower');
    });
  });
});

describe('fetchAllAstroEvents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches events from multiple sources', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ phasedata: [] }),
    });

    const events = await fetchAllAstroEvents(2024, 1);
    expect(Array.isArray(events)).toBe(true);
  });

  it('handles partial failures gracefully', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ phasedata: [] }),
      });

    const events = await fetchAllAstroEvents(2024, 1);
    expect(Array.isArray(events)).toBe(true);
  });

  it('returns events sorted by date', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ phasedata: [] }),
    });

    const events = await fetchAllAstroEvents(2024, 6);
    
    // Check if events are sorted
    for (let i = 1; i < events.length; i++) {
      expect(events[i].date.getTime()).toBeGreaterThanOrEqual(events[i - 1].date.getTime());
    }
  });
});
