import {
  parseMinorIdentifier,
  isExplicitMinorObjectQuery,
} from '../minor-parser';

describe('parseMinorIdentifier', () => {
  // ========================================================================
  // Numbered asteroids
  // ========================================================================
  describe('numbered asteroids', () => {
    it('parses parenthesized number (433)', () => {
      const r = parseMinorIdentifier('(433)');
      expect(r?.kind).toBe('numbered');
      expect(r?.category).toBe('asteroid');
      expect(r?.number).toBe(433);
      expect(r?.normalized).toBe('(433)');
      expect(r?.canonicalId).toBe('(433)');
    });

    it('parses plain number', () => {
      const r = parseMinorIdentifier('1');
      expect(r?.kind).toBe('numbered');
      expect(r?.category).toBe('asteroid');
      expect(r?.number).toBe(1);
      expect(r?.normalized).toBe('1');
      expect(r?.canonicalId).toBe('(1)');
    });

    it('parses multi-digit plain number', () => {
      const r = parseMinorIdentifier('99942');
      expect(r?.kind).toBe('numbered');
      expect(r?.number).toBe(99942);
    });
  });

  // ========================================================================
  // Provisional designations
  // ========================================================================
  describe('provisional designations', () => {
    it('parses 2007 TA418', () => {
      const r = parseMinorIdentifier('2007 TA418');
      expect(r?.kind).toBe('provisional');
      expect(r?.category).toBe('asteroid');
      expect(r?.normalized).toBe('2007 TA418');
    });

    it('parses 1995 SM55', () => {
      const r = parseMinorIdentifier('1995 SM55');
      expect(r?.kind).toBe('provisional');
    });

    it('parses provisional without cycle number', () => {
      const r = parseMinorIdentifier('2020 AV');
      expect(r?.kind).toBe('provisional');
      expect(r?.normalized).toBe('2020 AV');
    });
  });

  // ========================================================================
  // Packed provisional
  // ========================================================================
  describe('packed provisional', () => {
    it('parses K07Tf8A', () => {
      const r = parseMinorIdentifier('K07Tf8A');
      expect(r?.kind).toBe('packed_provisional');
      expect(r?.category).toBe('asteroid');
    });

    it('parses J95Sa0B', () => {
      const r = parseMinorIdentifier('J95Sa0B');
      expect(r?.kind).toBe('packed_provisional');
    });
  });

  // ========================================================================
  // Survey designations
  // ========================================================================
  describe('survey designations', () => {
    it('parses 2040 P-L', () => {
      const r = parseMinorIdentifier('2040 P-L');
      expect(r?.kind).toBe('survey');
      expect(r?.category).toBe('asteroid');
      expect(r?.normalized).toBe('2040 P-L');
    });

    it('parses 3138 T-1', () => {
      const r = parseMinorIdentifier('3138 T-1');
      expect(r?.kind).toBe('survey');
    });

    it('parses 1234 T-2', () => {
      const r = parseMinorIdentifier('1234 T-2');
      expect(r?.kind).toBe('survey');
    });

    it('parses 999 T-3', () => {
      const r = parseMinorIdentifier('999 T-3');
      expect(r?.kind).toBe('survey');
    });
  });

  // ========================================================================
  // Packed survey
  // ========================================================================
  describe('packed survey designations', () => {
    it('parses PLS2040', () => {
      const r = parseMinorIdentifier('PLS2040');
      expect(r?.kind).toBe('survey');
      expect(r?.category).toBe('asteroid');
      expect(r?.normalized).toBe('PLS2040');
    });

    it('parses T1S3138', () => {
      const r = parseMinorIdentifier('T1S3138');
      expect(r?.kind).toBe('survey');
    });

    it('parses T2S1234', () => {
      const r = parseMinorIdentifier('T2S1234');
      expect(r?.kind).toBe('survey');
    });

    it('parses T3S999', () => {
      const r = parseMinorIdentifier('T3S999');
      expect(r?.kind).toBe('survey');
    });
  });

  // ========================================================================
  // Comet designations
  // ========================================================================
  describe('comet designations', () => {
    it('parses numbered comet 73P-B', () => {
      const r = parseMinorIdentifier('73P-B');
      expect(r?.kind).toBe('comet');
      expect(r?.category).toBe('comet');
      expect(r?.number).toBe(73);
      expect(r?.normalized).toBe('73P-B');
    });

    it('parses numbered comet without fragment', () => {
      const r = parseMinorIdentifier('1P');
      expect(r?.kind).toBe('comet');
      expect(r?.category).toBe('comet');
      expect(r?.number).toBe(1);
      expect(r?.normalized).toBe('1P');
    });

    it('parses provisional comet C/2023 A3', () => {
      const r = parseMinorIdentifier('C/2023 A3');
      expect(r?.kind).toBe('comet');
      expect(r?.category).toBe('comet');
      expect(r?.normalized).toBe('C/2023 A3');
    });

    it('parses provisional comet with fragment', () => {
      const r = parseMinorIdentifier('C/2023 A3-AB');
      expect(r?.kind).toBe('comet');
      expect(r?.normalized).toBe('C/2023 A3-AB');
    });

    it('parses packed comet designation', () => {
      const r = parseMinorIdentifier('PJ05A010a');
      expect(r?.kind).toBe('comet');
      expect(r?.category).toBe('comet');
    });

    it('parses D-type comet', () => {
      const r = parseMinorIdentifier('D/1993 F2');
      expect(r?.kind).toBe('comet');
    });
  });

  // ========================================================================
  // Old-style designations
  // ========================================================================
  describe('old-style designations', () => {
    it('parses lowercase old-style 1915 a', () => {
      const r = parseMinorIdentifier('1915 a');
      expect(r?.kind).toBe('old_style');
      expect(r?.category).toBe('asteroid');
    });

    it('parses classic old-style with excluded provisional letter', () => {
      // Letter 'I' is excluded from provisional half-month chars [A-HJ-NP-Y]
      // so '1920 I' won't match provisional and falls through to old-style classic
      const r = parseMinorIdentifier('1920 Z');
      expect(r?.kind).toBe('old_style');
      expect(r?.category).toBe('asteroid');
    });

    it('parses Greek old-style 1915 alpha', () => {
      const r = parseMinorIdentifier('1915 alpha');
      expect(r?.kind).toBe('old_style');
      expect(r?.normalized).toBe('1915 alpha');
    });

    it('parses Greek old-style with uppercase 1915 Alpha', () => {
      const r = parseMinorIdentifier('1915 Alpha');
      expect(r?.kind).toBe('old_style');
      expect(r?.normalized).toBe('1915 alpha');
    });

    it('parses sigma designation', () => {
      const r = parseMinorIdentifier('SIGMA 42');
      expect(r?.kind).toBe('old_style');
      expect(r?.normalized).toBe('SIGMA 42');
    });

    it('parses sigma with year prefix', () => {
      const r = parseMinorIdentifier('2005 SIGMA 3');
      expect(r?.kind).toBe('old_style');
      expect(r?.normalized).toBe('2005 SIGMA 3');
    });
  });

  // ========================================================================
  // Edge cases
  // ========================================================================
  describe('edge cases', () => {
    it('returns null for empty string', () => {
      expect(parseMinorIdentifier('')).toBeNull();
    });

    it('returns null for whitespace only', () => {
      expect(parseMinorIdentifier('   ')).toBeNull();
    });

    it('returns null for unrecognized input', () => {
      expect(parseMinorIdentifier('Andromeda Galaxy')).toBeNull();
    });

    it('preserves originalInput', () => {
      const r = parseMinorIdentifier('  (433)  ');
      expect(r?.originalInput).toBe('  (433)  ');
    });
  });
});

describe('isExplicitMinorObjectQuery', () => {
  it('returns true for minor object identifiers', () => {
    expect(isExplicitMinorObjectQuery('(433)')).toBe(true);
    expect(isExplicitMinorObjectQuery('2007 TA418')).toBe(true);
    expect(isExplicitMinorObjectQuery('73P')).toBe(true);
  });

  it('returns false for non-minor identifiers', () => {
    expect(isExplicitMinorObjectQuery('M31')).toBe(false);
    expect(isExplicitMinorObjectQuery('Andromeda')).toBe(false);
  });
});
