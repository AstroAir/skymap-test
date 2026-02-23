/**
 * Tests for translations/constellations.ts
 * Constellation translation data
 */

import { CONSTELLATION_TRANSLATIONS } from '../constellations';

describe('CONSTELLATION_TRANSLATIONS', () => {
  it('should contain 88 constellations', () => {
    expect(CONSTELLATION_TRANSLATIONS.length).toBe(88);
  });

  it('should have unique IAU abbreviations', () => {
    const iaus = CONSTELLATION_TRANSLATIONS.map((c) => c.iau);
    expect(new Set(iaus).size).toBe(88);
  });

  it('should have required fields for each entry', () => {
    for (const c of CONSTELLATION_TRANSLATIONS) {
      expect(typeof c.iau).toBe('string');
      expect(c.iau.length).toBeGreaterThanOrEqual(2);
      expect(typeof c.native).toBe('string');
      expect(typeof c.english).toBe('string');
      expect(typeof c.chinese).toBe('string');
    }
  });

  it('should contain well-known constellations', () => {
    const orion = CONSTELLATION_TRANSLATIONS.find((c) => c.iau === 'Ori');
    expect(orion).toBeDefined();
    expect(orion!.native).toBe('Orion');
  });
});
