/**
 * @jest-environment jsdom
 */

import {
  getAllEvents,
  getEventsInRange,
  getTonightEvents,
  getThisWeekEvents,
  getHighlightEvents,
  clearEventCache,
} from '../aggregator';

describe('astro-events aggregator', () => {
  beforeEach(() => {
    clearEventCache();
  });

  describe('getAllEvents', () => {
    it('should return aggregated events', async () => {
      const result = await getAllEvents(3);
      
      expect(result.events).toBeDefined();
      expect(Array.isArray(result.events)).toBe(true);
      expect(result.fetchedAt).toBeInstanceOf(Date);
    });

    it('should include events from multiple sources', async () => {
      const result = await getAllEvents(6);
      
      // Should have events of different types
      const types = new Set(result.events.map(e => e.type));
      expect(types.size).toBeGreaterThan(0);
    });

    it('should sort events by date', async () => {
      const result = await getAllEvents(6);
      
      for (let i = 1; i < result.events.length; i++) {
        expect(result.events[i].date.getTime())
          .toBeGreaterThanOrEqual(result.events[i - 1].date.getTime());
      }
    });

    it('should filter by event types', async () => {
      const result = await getAllEvents(6, ['lunar']);
      
      result.events.forEach(event => {
        expect(event.type).toBe('lunar');
      });
    });

    it('should cache results', async () => {
      const result1 = await getAllEvents(3);
      const result2 = await getAllEvents(3);
      
      expect(result2.source).toBe('cache');
      expect(result2.fetchedAt.getTime()).toBe(result1.fetchedAt.getTime());
    });

    it('should provide fresh data after cache clear', async () => {
      await getAllEvents(3);
      clearEventCache();
      const result = await getAllEvents(3);
      
      expect(result.source).not.toBe('cache');
    });
  });

  describe('getEventsInRange', () => {
    it('should return events within date range', async () => {
      const start = new Date();
      const end = new Date();
      end.setMonth(end.getMonth() + 2);
      
      const events = await getEventsInRange(start, end);
      
      events.forEach(event => {
        expect(event.date.getTime()).toBeGreaterThanOrEqual(start.getTime());
        expect(event.date.getTime()).toBeLessThanOrEqual(end.getTime());
      });
    });

    it('should filter by types within range', async () => {
      const start = new Date();
      const end = new Date();
      end.setMonth(end.getMonth() + 3);
      
      const events = await getEventsInRange(start, end, ['meteor']);
      
      events.forEach(event => {
        expect(event.type).toBe('meteor');
      });
    });

    it('should return empty array for past date range', async () => {
      const end = new Date();
      end.setMonth(end.getMonth() - 1);
      const start = new Date();
      start.setMonth(start.getMonth() - 2);
      
      const events = await getEventsInRange(start, end);
      
      expect(events.length).toBe(0);
    });
  });

  describe('getTonightEvents', () => {
    it('should return events for tonight', async () => {
      const events = await getTonightEvents();
      
      expect(Array.isArray(events)).toBe(true);
      
      const tonight = new Date();
      tonight.setHours(18, 0, 0, 0);
      const tomorrow = new Date(tonight);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(6, 0, 0, 0);
      
      events.forEach(event => {
        expect(event.date.getTime()).toBeGreaterThanOrEqual(tonight.getTime());
        expect(event.date.getTime()).toBeLessThanOrEqual(tomorrow.getTime());
      });
    });
  });

  describe('getThisWeekEvents', () => {
    it('should return events for this week', async () => {
      const events = await getThisWeekEvents();
      
      expect(Array.isArray(events)).toBe(true);
      
      const now = new Date();
      const endOfWeek = new Date();
      endOfWeek.setDate(endOfWeek.getDate() + 7);
      
      events.forEach(event => {
        expect(event.date.getTime()).toBeGreaterThanOrEqual(now.getTime() - 60000); // Allow 1 min tolerance
        expect(event.date.getTime()).toBeLessThanOrEqual(endOfWeek.getTime());
      });
    });
  });

  describe('getHighlightEvents', () => {
    it('should return limited number of events', async () => {
      const events = await getHighlightEvents(3);
      
      expect(events.length).toBeLessThanOrEqual(3);
    });

    it('should return default limit of 5', async () => {
      const events = await getHighlightEvents();
      
      expect(events.length).toBeLessThanOrEqual(5);
    });

    it('should prioritize important events', async () => {
      const highlights = await getHighlightEvents(10);
      const allResult = await getAllEvents(6);
      
      // Highlights should be sorted by importance, not just date
      if (highlights.length > 0 && allResult.events.length > 0) {
        // Eclipse events should be prioritized
        const hasEclipse = highlights.some(e => e.type === 'eclipse');
        const eclipseInAll = allResult.events.some(e => e.type === 'eclipse');
        
        if (eclipseInAll) {
          expect(hasEclipse).toBe(true);
        }
      }
    });
  });

  describe('clearEventCache', () => {
    it('should clear the event cache', async () => {
      await getAllEvents(3);
      clearEventCache();
      const result = await getAllEvents(3);
      
      expect(result.source).toBe('aggregated');
    });
  });
});
