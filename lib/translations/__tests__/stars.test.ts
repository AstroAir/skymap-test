/**
 * Tests for translations/stars.ts
 * Star name translation data
 */

import { STAR_TRANSLATIONS } from '../stars';

describe('STAR_TRANSLATIONS', () => {
  it('should be a non-empty array', () => {
    expect(STAR_TRANSLATIONS.length).toBeGreaterThan(0);
  });

  it('should have required fields for each entry', () => {
    for (const s of STAR_TRANSLATIONS) {
      expect(typeof s.english).toBe('string');
      expect(typeof s.chinese).toBe('string');
    }
  });

  it('should contain well-known stars', () => {
    const sirius = STAR_TRANSLATIONS.find((s) => s.english === 'Sirius');
    expect(sirius).toBeDefined();
    expect(sirius!.chinese).toBe('天狼星');
  });

  it('should have unique English names', () => {
    const names = STAR_TRANSLATIONS.map((s) => s.english);
    expect(new Set(names).size).toBe(names.length);
  });
});
