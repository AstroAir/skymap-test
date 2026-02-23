/**
 * Tests for feedback-data.ts
 * Star position and splash screen data
 */

import { STAR_POSITIONS } from '../feedback-data';

describe('STAR_POSITIONS', () => {
  it('should be a non-empty array', () => {
    expect(STAR_POSITIONS.length).toBeGreaterThan(0);
  });

  it('should have valid position data', () => {
    for (const star of STAR_POSITIONS) {
      expect(typeof star.left).toBe('number');
      expect(typeof star.top).toBe('number');
      expect(typeof star.delay).toBe('number');
      expect(star.left).toBeGreaterThanOrEqual(0);
      expect(star.top).toBeGreaterThanOrEqual(0);
    }
  });
});
