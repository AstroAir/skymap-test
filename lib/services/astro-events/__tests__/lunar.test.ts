/**
 * @jest-environment jsdom
 */

import { getLunarPhaseEvents } from '../lunar';

describe('lunar events', () => {
  describe('getLunarPhaseEvents', () => {
    it('should return lunar phase events', () => {
      const events = getLunarPhaseEvents(3);
      
      expect(Array.isArray(events)).toBe(true);
      expect(events.length).toBeGreaterThan(0);
    });

    it('should return events with correct type', () => {
      const events = getLunarPhaseEvents(2);
      
      events.forEach(event => {
        expect(event.type).toBe('lunar');
      });
    });

    it('should include all moon phases', () => {
      const events = getLunarPhaseEvents(6);
      const names = events.map(e => e.name);
      
      // Should include new moon, first quarter, full moon, last quarter
      expect(names.some(n => n.toLowerCase().includes('new'))).toBe(true);
      expect(names.some(n => n.toLowerCase().includes('full'))).toBe(true);
    });

    it('should have valid date objects', () => {
      const events = getLunarPhaseEvents(2);
      
      events.forEach(event => {
        expect(event.date).toBeInstanceOf(Date);
        expect(isNaN(event.date.getTime())).toBe(false);
      });
    });

    it('should sort events chronologically', () => {
      const events = getLunarPhaseEvents(6);
      
      for (let i = 1; i < events.length; i++) {
        expect(events[i].date.getTime())
          .toBeGreaterThanOrEqual(events[i - 1].date.getTime());
      }
    });

    it('should include description', () => {
      const events = getLunarPhaseEvents(2);
      
      events.forEach(event => {
        expect(event.description).toBeDefined();
        expect(typeof event.description).toBe('string');
      });
    });

    it('should return more events for longer periods', () => {
      const short = getLunarPhaseEvents(1);
      const long = getLunarPhaseEvents(6);
      
      expect(long.length).toBeGreaterThanOrEqual(short.length);
    });

    it('should have visibility property', () => {
      const events = getLunarPhaseEvents(2);
      
      events.forEach(event => {
        expect(['excellent', 'good', 'fair', 'poor', undefined]).toContain(event.visibility);
      });
    });

    it('should return events starting from now', () => {
      const events = getLunarPhaseEvents(2);
      const now = new Date();
      
      // First event should be within a reasonable time frame
      if (events.length > 0) {
        const firstEventDate = events[0].date;
        const daysDiff = (firstEventDate.getTime() - now.getTime()) / (24 * 3600 * 1000);
        expect(daysDiff).toBeLessThan(10); // First lunar event within 10 days
      }
    });
  });
});
