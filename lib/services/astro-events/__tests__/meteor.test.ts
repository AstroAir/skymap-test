/**
 * @jest-environment jsdom
 */

import { getUpcomingMeteorShowers } from '../meteor';

describe('meteor shower events', () => {
  describe('getUpcomingMeteorShowers', () => {
    it('should return meteor shower events', () => {
      const events = getUpcomingMeteorShowers(12);
      
      expect(Array.isArray(events)).toBe(true);
    });

    it('should return events with correct type', () => {
      const events = getUpcomingMeteorShowers(12);
      
      events.forEach(event => {
        expect(event.type).toBe('meteor');
      });
    });

    it('should have valid date objects', () => {
      const events = getUpcomingMeteorShowers(6);
      
      events.forEach(event => {
        expect(event.date).toBeInstanceOf(Date);
        expect(isNaN(event.date.getTime())).toBe(false);
      });
    });

    it('should include ZHR value', () => {
      const events = getUpcomingMeteorShowers(12);
      
      events.forEach(event => {
        // ZHR is a required property for meteor showers
        expect(typeof event.zhr).toBe('number');
        expect(event.zhr).toBeGreaterThan(0);
      });
    });

    it('should include shower names', () => {
      const events = getUpcomingMeteorShowers(12);
      
      events.forEach(event => {
        expect(event.name).toBeDefined();
        expect(typeof event.name).toBe('string');
        expect(event.name.length).toBeGreaterThan(0);
      });
    });

    it('should include radiant information', () => {
      const events = getUpcomingMeteorShowers(12);
      
      // MeteorShower type has radiantRa and radiantDec
      events.forEach(event => {
        expect(typeof event.radiantRa).toBe('number');
        expect(typeof event.radiantDec).toBe('number');
      });
    });

    it('should sort events chronologically', () => {
      const events = getUpcomingMeteorShowers(12);
      
      for (let i = 1; i < events.length; i++) {
        expect(events[i].date.getTime())
          .toBeGreaterThanOrEqual(events[i - 1].date.getTime());
      }
    });

    it('should return more events for longer periods', () => {
      const short = getUpcomingMeteorShowers(3);
      const long = getUpcomingMeteorShowers(12);
      
      expect(long.length).toBeGreaterThanOrEqual(short.length);
    });

    it('should have visibility ratings', () => {
      const events = getUpcomingMeteorShowers(12);
      
      events.forEach(event => {
        expect(['excellent', 'good', 'fair', 'poor', undefined]).toContain(event.visibility);
      });
    });

    it('should include description', () => {
      const events = getUpcomingMeteorShowers(6);
      
      events.forEach(event => {
        expect(event.description).toBeDefined();
        expect(typeof event.description).toBe('string');
      });
    });
  });
});
