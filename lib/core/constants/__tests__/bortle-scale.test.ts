/**
 * @jest-environment node
 */
import {
  BORTLE_SCALE,
  getBortleEntry,
  getBortleFromSQM,
  getBortleExposureMultiplier,
  getBortleQualityMultiplier,
  getBortleMinimumMultiplier,
} from '../bortle-scale';

describe('Bortle Scale', () => {
  // ============================================================================
  // BORTLE_SCALE constant
  // ============================================================================
  describe('BORTLE_SCALE', () => {
    it('has 9 entries', () => {
      expect(BORTLE_SCALE).toHaveLength(9);
    });

    it('values range from 1 to 9', () => {
      const values = BORTLE_SCALE.map(b => b.value);
      expect(values).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    it('each entry has required properties', () => {
      for (const entry of BORTLE_SCALE) {
        expect(entry).toHaveProperty('value');
        expect(entry).toHaveProperty('name');
        expect(entry).toHaveProperty('sqm');
        expect(entry).toHaveProperty('description');
      }
    });

    it('names are non-empty strings', () => {
      for (const entry of BORTLE_SCALE) {
        expect(typeof entry.name).toBe('string');
        expect(entry.name.length).toBeGreaterThan(0);
      }
    });

    it('SQM values decrease with Bortle class', () => {
      for (let i = 1; i < BORTLE_SCALE.length; i++) {
        expect(BORTLE_SCALE[i].sqm).toBeLessThan(BORTLE_SCALE[i - 1].sqm);
      }
    });

    it('SQM values are in realistic range', () => {
      for (const entry of BORTLE_SCALE) {
        expect(entry.sqm).toBeGreaterThan(17);
        expect(entry.sqm).toBeLessThan(23);
      }
    });

    it('Bortle 1 has highest SQM', () => {
      expect(BORTLE_SCALE[0].sqm).toBeGreaterThan(21.9);
    });

    it('Bortle 9 has lowest SQM', () => {
      expect(BORTLE_SCALE[8].sqm).toBeLessThan(18);
    });
  });

  // ============================================================================
  // getBortleEntry
  // ============================================================================
  describe('getBortleEntry', () => {
    it('returns correct entry for valid value', () => {
      const entry = getBortleEntry(5);
      expect(entry).toBeDefined();
      expect(entry?.value).toBe(5);
      expect(entry?.name).toBe('Suburban sky');
    });

    it('returns undefined for invalid value', () => {
      expect(getBortleEntry(0)).toBeUndefined();
      expect(getBortleEntry(10)).toBeUndefined();
      expect(getBortleEntry(-1)).toBeUndefined();
    });

    it('returns correct entry for all valid values', () => {
      for (let i = 1; i <= 9; i++) {
        const entry = getBortleEntry(i);
        expect(entry).toBeDefined();
        expect(entry?.value).toBe(i);
      }
    });

    it('handles non-integer values', () => {
      expect(getBortleEntry(5.5)).toBeUndefined();
    });
  });

  // ============================================================================
  // getBortleFromSQM
  // ============================================================================
  describe('getBortleFromSQM', () => {
    it('returns Bortle 1 for very dark sky', () => {
      expect(getBortleFromSQM(22.0)).toBe(1);
      expect(getBortleFromSQM(21.99)).toBe(1);
    });

    it('returns Bortle 9 for very bright sky', () => {
      expect(getBortleFromSQM(17.0)).toBe(9);
      expect(getBortleFromSQM(17.5)).toBe(9);
    });

    it('returns correct Bortle for typical suburban (SQM 19-20)', () => {
      const bortle = getBortleFromSQM(19.5);
      expect(bortle).toBeGreaterThanOrEqual(6);
      expect(bortle).toBeLessThanOrEqual(7);
    });

    it('returns correct Bortle for rural sky (SQM ~21.5)', () => {
      const bortle = getBortleFromSQM(21.5);
      expect(bortle).toBeGreaterThanOrEqual(3);
      expect(bortle).toBeLessThanOrEqual(4);
    });

    it('handles edge cases at thresholds', () => {
      // Test exact threshold values
      expect(getBortleFromSQM(21.99)).toBe(1);
      expect(getBortleFromSQM(21.89)).toBe(2);
    });

    it('returns 9 for values below minimum SQM', () => {
      expect(getBortleFromSQM(15.0)).toBe(9);
    });
  });

  // ============================================================================
  // getBortleExposureMultiplier
  // ============================================================================
  describe('getBortleExposureMultiplier', () => {
    it('returns higher multiplier for darker skies', () => {
      const dark = getBortleExposureMultiplier(1);
      const light = getBortleExposureMultiplier(9);
      expect(dark).toBeGreaterThan(light);
    });

    it('returns valid multipliers for all Bortle values', () => {
      for (let i = 1; i <= 9; i++) {
        const mult = getBortleExposureMultiplier(i);
        expect(mult).toBeGreaterThan(0);
        expect(mult).toBeLessThanOrEqual(10);
      }
    });

    it('multiplier decreases with Bortle class', () => {
      for (let i = 2; i <= 9; i++) {
        const prev = getBortleExposureMultiplier(i - 1);
        const curr = getBortleExposureMultiplier(i);
        expect(curr).toBeLessThanOrEqual(prev);
      }
    });

    it('returns default for invalid values', () => {
      expect(getBortleExposureMultiplier(0)).toBe(2);
      expect(getBortleExposureMultiplier(10)).toBe(2);
      expect(getBortleExposureMultiplier(-1)).toBe(2);
    });

    it('Bortle 1 gives highest multiplier (~8)', () => {
      expect(getBortleExposureMultiplier(1)).toBeCloseTo(8, 0);
    });

    it('Bortle 9 gives lowest multiplier (~1)', () => {
      expect(getBortleExposureMultiplier(9)).toBeCloseTo(1, 0);
    });
  });

  // ============================================================================
  // getBortleQualityMultiplier
  // ============================================================================
  describe('getBortleQualityMultiplier', () => {
    it('returns higher multiplier for darker skies', () => {
      expect(getBortleQualityMultiplier(1)).toBeGreaterThan(getBortleQualityMultiplier(9));
    });

    it('returns valid multipliers for all Bortle values', () => {
      for (let i = 1; i <= 9; i++) {
        const mult = getBortleQualityMultiplier(i);
        expect(mult).toBeGreaterThan(0);
        expect(mult).toBeLessThanOrEqual(10);
      }
    });

    it('multiplier decreases with Bortle class', () => {
      for (let i = 2; i <= 9; i++) {
        expect(getBortleQualityMultiplier(i)).toBeLessThanOrEqual(getBortleQualityMultiplier(i - 1));
      }
    });

    it('returns default for invalid values', () => {
      expect(getBortleQualityMultiplier(0)).toBe(2);
      expect(getBortleQualityMultiplier(10)).toBe(2);
      expect(getBortleQualityMultiplier(-1)).toBe(2);
    });

    it('Bortle 1 gives highest multiplier (8)', () => {
      expect(getBortleQualityMultiplier(1)).toBe(8);
    });

    it('Bortle 9 gives lowest multiplier (1)', () => {
      expect(getBortleQualityMultiplier(9)).toBe(1);
    });

    it('getBortleExposureMultiplier delegates to getBortleQualityMultiplier', () => {
      for (let i = 1; i <= 9; i++) {
        expect(getBortleExposureMultiplier(i)).toBe(getBortleQualityMultiplier(i));
      }
    });
  });

  // ============================================================================
  // getBortleMinimumMultiplier
  // ============================================================================
  describe('getBortleMinimumMultiplier', () => {
    it('returns lower multiplier for darker skies (less minimum needed)', () => {
      expect(getBortleMinimumMultiplier(1)).toBeLessThan(getBortleMinimumMultiplier(9));
    });

    it('returns valid multipliers for all Bortle values', () => {
      for (let i = 1; i <= 9; i++) {
        const mult = getBortleMinimumMultiplier(i);
        expect(mult).toBeGreaterThan(0);
        expect(mult).toBeLessThanOrEqual(5);
      }
    });

    it('multiplier increases with Bortle class', () => {
      for (let i = 2; i <= 9; i++) {
        expect(getBortleMinimumMultiplier(i)).toBeGreaterThanOrEqual(getBortleMinimumMultiplier(i - 1));
      }
    });

    it('returns default for invalid values', () => {
      expect(getBortleMinimumMultiplier(0)).toBe(1);
      expect(getBortleMinimumMultiplier(10)).toBe(1);
      expect(getBortleMinimumMultiplier(-1)).toBe(1);
    });

    it('Bortle 1 gives lowest multiplier (0.5)', () => {
      expect(getBortleMinimumMultiplier(1)).toBe(0.5);
    });

    it('Bortle 9 gives highest multiplier (3.0)', () => {
      expect(getBortleMinimumMultiplier(9)).toBe(3.0);
    });
  });
});
