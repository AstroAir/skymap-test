/**
 * @jest-environment jsdom
 */

// Mock isTauri
jest.mock('@/lib/storage/platform', () => ({
  isTauri: jest.fn(() => true),
}));

// Mock @tauri-apps/api/core
const mockInvoke = jest.fn();
jest.mock('@tauri-apps/api/core', () => ({
  invoke: mockInvoke,
}));

import { isTauri } from '@/lib/storage/platform';
import { eventsApi } from '../events-api';

const mockIsTauri = isTauri as jest.Mock;

describe('eventsApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsTauri.mockReturnValue(true);
  });

  it('should get moon phases for month', async () => {
    const mockPhases = [
      {
        phase_type: 'new_moon',
        date: '2024-01-11',
        timestamp: 1704931200,
        illumination: 0,
        is_supermoon: false,
      },
      {
        phase_type: 'first_quarter',
        date: '2024-01-18',
        timestamp: 1705536000,
        illumination: 50,
        is_supermoon: false,
      },
      {
        phase_type: 'full_moon',
        date: '2024-01-25',
        timestamp: 1706140800,
        illumination: 100,
        is_supermoon: true,
      },
      {
        phase_type: 'last_quarter',
        date: '2024-02-02',
        timestamp: 1706832000,
        illumination: 50,
        is_supermoon: false,
      },
    ];
    mockInvoke.mockResolvedValue(mockPhases);

    const result = await eventsApi.getMoonPhasesForMonth(2024, 1);

    expect(mockInvoke).toHaveBeenCalledWith('get_moon_phases_for_month', { year: 2024, month: 1 });
    expect(result).toEqual(mockPhases);
    expect(result).toHaveLength(4);
  });

  it('should get meteor showers', async () => {
    const mockShowers = [
      {
        name: 'Quadrantids',
        peak_date: '2024-01-04',
        active_start: '2024-01-01',
        active_end: '2024-01-12',
        zhr: 120,
        radiant_ra: 230.1,
        radiant_dec: 48.5,
        parent_body: '2003 EH1',
        description: 'One of the best annual showers',
      },
      {
        name: 'Perseids',
        peak_date: '2024-08-12',
        active_start: '2024-07-17',
        active_end: '2024-08-24',
        zhr: 100,
        radiant_ra: 48.0,
        radiant_dec: 58.0,
        parent_body: '109P/Swift-Tuttle',
        description: 'Popular summer shower',
      },
    ];
    mockInvoke.mockResolvedValue(mockShowers);

    const result = await eventsApi.getMeteorShowers(2024);

    expect(mockInvoke).toHaveBeenCalledWith('get_meteor_showers', { year: 2024 });
    expect(result).toEqual(mockShowers);
  });

  it('should get seasonal events', async () => {
    const mockEvents = [
      {
        id: 'equinox-spring-2024',
        event_type: 'equinox',
        name: 'Vernal Equinox',
        description: 'Spring equinox',
        date: '2024-03-20',
        time: '03:06:00',
        timestamp: 1710903960,
        magnitude: null,
        visibility: null,
        details: { season: 'spring' },
      },
      {
        id: 'solstice-summer-2024',
        event_type: 'solstice',
        name: 'Summer Solstice',
        description: 'Summer solstice',
        date: '2024-06-20',
        time: '20:51:00',
        timestamp: 1718916660,
        magnitude: null,
        visibility: null,
        details: { season: 'summer' },
      },
    ];
    mockInvoke.mockResolvedValue(mockEvents);

    const result = await eventsApi.getSeasonalEvents(2024);

    expect(mockInvoke).toHaveBeenCalledWith('get_seasonal_events', { year: 2024 });
    expect(result).toEqual(mockEvents);
  });

  it('should get astro events for date range', async () => {
    const mockEvents = [
      {
        id: 'lunar-eclipse-2024-03-25',
        event_type: 'lunar_eclipse',
        name: 'Penumbral Lunar Eclipse',
        description: 'Subtle penumbral eclipse',
        date: '2024-03-25',
        time: '07:12:00',
        timestamp: 1711350720,
        magnitude: 0.96,
        visibility: 'Americas, Europe, Africa',
        details: null,
      },
    ];
    mockInvoke.mockResolvedValue(mockEvents);

    const result = await eventsApi.getAstroEvents('2024-03-01', '2024-03-31');

    expect(mockInvoke).toHaveBeenCalledWith('get_astro_events', {
      startDate: '2024-03-01',
      endDate: '2024-03-31',
    });
    expect(result).toEqual(mockEvents);
  });

  it('should get daily astro events', async () => {
    const mockDailyEvents = [
      {
        id: 'daily-window-meteor-perseids-2024-08-10',
        event_type: 'meteor_shower',
        name: 'Perseids (Active)',
        description: 'Active meteor shower window',
        date: '2024-08-10',
        time: null,
        timestamp: 1723248000,
        magnitude: null,
        visibility: 'ZHR: 100',
        details: { occurrence_mode: 'window', starts_at: '2024-07-17', ends_at: '2024-08-24' },
      },
    ];
    mockInvoke.mockResolvedValue(mockDailyEvents);

    const result = await eventsApi.getDailyAstroEvents('2024-08-10', 'Etc/UTC', true);

    expect(mockInvoke).toHaveBeenCalledWith('get_daily_astro_events', {
      date: '2024-08-10',
      timezone: 'Etc/UTC',
      includeOngoing: true,
    });
    expect(result).toEqual(mockDailyEvents);
  });

  it('should get tonight highlights', async () => {
    const mockHighlights = [
      'Moon rises at 21:30, 85% illuminated',
      'Jupiter visible in southwest until midnight',
      'Saturn at opposition, excellent viewing conditions',
      'ISS pass at 22:15, magnitude -3.5',
    ];
    mockInvoke.mockResolvedValue(mockHighlights);

    const result = await eventsApi.getTonightHighlights(45.0, -75.0, 1704067200);

    expect(mockInvoke).toHaveBeenCalledWith('get_tonight_highlights', {
      latitude: 45.0,
      longitude: -75.0,
      timestamp: 1704067200,
    });
    expect(result).toEqual(mockHighlights);
  });

  it('should get tonight highlights without timestamp', async () => {
    mockInvoke.mockResolvedValue(['Clear skies tonight']);

    await eventsApi.getTonightHighlights(45.0, -75.0);

    expect(mockInvoke).toHaveBeenCalledWith('get_tonight_highlights', {
      latitude: 45.0,
      longitude: -75.0,
      timestamp: undefined,
    });
  });

  it('should have isAvailable function', () => {
    expect(eventsApi.isAvailable).toBeDefined();
    expect(typeof eventsApi.isAvailable).toBe('function');
  });

  it('should throw error when not in Tauri', async () => {
    mockIsTauri.mockReturnValue(false);

    await expect(eventsApi.getMoonPhasesForMonth(2024, 1)).rejects.toThrow(
      'Tauri API is only available in desktop environment'
    );
  });
});
