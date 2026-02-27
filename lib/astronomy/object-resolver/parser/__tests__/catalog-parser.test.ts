import {
  parseCatalogIdentifier,
  normalizeCatalogIdentifier,
} from '../catalog-parser';

describe('parseCatalogIdentifier', () => {
  // ========================================================================
  // Messier
  // ========================================================================
  describe('Messier', () => {
    it('parses M31', () => {
      const r = parseCatalogIdentifier('M31');
      expect(r?.catalog).toBe('M');
      expect(r?.number).toBe(31);
      expect(r?.normalized).toBe('M31');
    });

    it('parses MESSIER 42', () => {
      const r = parseCatalogIdentifier('MESSIER 42');
      expect(r?.catalog).toBe('M');
      expect(r?.number).toBe(42);
      expect(r?.normalized).toBe('M42');
    });

    it('parses M 1', () => {
      const r = parseCatalogIdentifier('M 1');
      expect(r?.catalog).toBe('M');
      expect(r?.number).toBe(1);
    });
  });

  // ========================================================================
  // NGC
  // ========================================================================
  describe('NGC', () => {
    it('parses NGC 7000', () => {
      const r = parseCatalogIdentifier('NGC 7000');
      expect(r?.catalog).toBe('NGC');
      expect(r?.number).toBe(7000);
      expect(r?.normalized).toBe('NGC7000');
    });

    it('parses NGC with suffix', () => {
      const r = parseCatalogIdentifier('NGC 4038A');
      expect(r?.catalog).toBe('NGC');
      expect(r?.suffix).toBe('A');
      expect(r?.normalized).toBe('NGC4038A');
    });

    it('parses N 224 shorthand', () => {
      const r = parseCatalogIdentifier('N 224');
      expect(r?.catalog).toBe('NGC');
      expect(r?.number).toBe(224);
    });
  });

  // ========================================================================
  // IC
  // ========================================================================
  describe('IC', () => {
    it('parses IC 434', () => {
      const r = parseCatalogIdentifier('IC 434');
      expect(r?.catalog).toBe('IC');
      expect(r?.number).toBe(434);
      expect(r?.normalized).toBe('IC434');
    });

    it('parses IC with suffix', () => {
      const r = parseCatalogIdentifier('IC 1396A');
      expect(r?.catalog).toBe('IC');
      expect(r?.suffix).toBe('A');
      expect(r?.normalized).toBe('IC1396A');
    });
  });

  // ========================================================================
  // Caldwell
  // ========================================================================
  describe('Caldwell', () => {
    it('parses C49', () => {
      const r = parseCatalogIdentifier('C49');
      expect(r?.catalog).toBe('C');
      expect(r?.number).toBe(49);
      expect(r?.normalized).toBe('C49');
    });

    it('parses CALDWELL 14', () => {
      const r = parseCatalogIdentifier('CALDWELL 14');
      expect(r?.catalog).toBe('C');
      expect(r?.number).toBe(14);
      expect(r?.normalized).toBe('C14');
    });
  });

  // ========================================================================
  // Sharpless
  // ========================================================================
  describe('Sharpless', () => {
    it('parses Sh2-155', () => {
      const r = parseCatalogIdentifier('Sh2-155');
      expect(r?.catalog).toBe('Sh2');
      expect(r?.number).toBe(155);
    });

    it('parses SH 2 155', () => {
      const r = parseCatalogIdentifier('SH 2 155');
      expect(r?.catalog).toBe('Sh2');
    });

    it('parses SHARPLESS 240', () => {
      const r = parseCatalogIdentifier('SHARPLESS 240');
      expect(r?.catalog).toBe('Sh2');
      expect(r?.number).toBe(240);
    });
  });

  // ========================================================================
  // Barnard
  // ========================================================================
  describe('Barnard', () => {
    it('parses B33', () => {
      const r = parseCatalogIdentifier('B33');
      expect(r?.catalog).toBe('B');
      expect(r?.number).toBe(33);
      expect(r?.normalized).toBe('B33');
    });

    it('parses BARNARD 68', () => {
      const r = parseCatalogIdentifier('BARNARD 68');
      expect(r?.catalog).toBe('B');
      expect(r?.number).toBe(68);
    });
  });

  // ========================================================================
  // Abell
  // ========================================================================
  describe('Abell', () => {
    it('parses ABELL 426', () => {
      const r = parseCatalogIdentifier('ABELL 426');
      expect(r?.catalog).toBe('Abell');
      expect(r?.number).toBe(426);
      expect(r?.normalized).toBe('Abell426');
    });

    it('parses abell 39', () => {
      const r = parseCatalogIdentifier('abell 39');
      expect(r?.catalog).toBe('Abell');
      expect(r?.number).toBe(39);
    });
  });

  // ========================================================================
  // Melotte
  // ========================================================================
  describe('Melotte', () => {
    it('parses Mel 25', () => {
      const r = parseCatalogIdentifier('Mel 25');
      expect(r?.catalog).toBe('Mel');
      expect(r?.number).toBe(25);
      expect(r?.normalized).toBe('Mel25');
    });

    it('parses MELOTTE 111', () => {
      const r = parseCatalogIdentifier('MELOTTE 111');
      expect(r?.catalog).toBe('Mel');
      expect(r?.number).toBe(111);
    });
  });

  // ========================================================================
  // Collinder
  // ========================================================================
  describe('Collinder', () => {
    it('parses Cr 399', () => {
      const r = parseCatalogIdentifier('Cr 399');
      expect(r?.catalog).toBe('Cr');
      expect(r?.number).toBe(399);
      expect(r?.normalized).toBe('Cr399');
    });

    it('parses COLLINDER 70', () => {
      const r = parseCatalogIdentifier('COLLINDER 70');
      expect(r?.catalog).toBe('Cr');
      expect(r?.number).toBe(70);
    });

    it('parses CROLLINDER 261', () => {
      const r = parseCatalogIdentifier('CROLLINDER 261');
      expect(r?.catalog).toBe('Cr');
    });
  });

  // ========================================================================
  // Trumpler
  // ========================================================================
  describe('Trumpler', () => {
    it('parses Tr 37', () => {
      const r = parseCatalogIdentifier('Tr 37');
      expect(r?.catalog).toBe('Tr');
      expect(r?.number).toBe(37);
      expect(r?.normalized).toBe('Tr37');
    });

    it('parses TRUMPLER 14', () => {
      const r = parseCatalogIdentifier('TRUMPLER 14');
      expect(r?.catalog).toBe('Tr');
    });
  });

  // ========================================================================
  // vdB
  // ========================================================================
  describe('vdB', () => {
    it('parses VDB 152', () => {
      const r = parseCatalogIdentifier('VDB 152');
      expect(r?.catalog).toBe('vdB');
      expect(r?.number).toBe(152);
      expect(r?.normalized).toBe('vdB152');
    });

    it('parses VD B 1', () => {
      const r = parseCatalogIdentifier('VD B 1');
      expect(r?.catalog).toBe('vdB');
    });
  });

  // ========================================================================
  // LDN / LBN
  // ========================================================================
  describe('LDN', () => {
    it('parses LDN 1622', () => {
      const r = parseCatalogIdentifier('LDN 1622');
      expect(r?.catalog).toBe('LDN');
      expect(r?.number).toBe(1622);
      expect(r?.normalized).toBe('LDN1622');
    });
  });

  describe('LBN', () => {
    it('parses LBN 437', () => {
      const r = parseCatalogIdentifier('LBN 437');
      expect(r?.catalog).toBe('LBN');
      expect(r?.number).toBe(437);
      expect(r?.normalized).toBe('LBN437');
    });
  });

  // ========================================================================
  // PGC / UGC
  // ========================================================================
  describe('PGC', () => {
    it('parses PGC 2557', () => {
      const r = parseCatalogIdentifier('PGC 2557');
      expect(r?.catalog).toBe('PGC');
      expect(r?.number).toBe(2557);
      expect(r?.normalized).toBe('PGC2557');
    });
  });

  describe('UGC', () => {
    it('parses UGC 12158', () => {
      const r = parseCatalogIdentifier('UGC 12158');
      expect(r?.catalog).toBe('UGC');
      expect(r?.number).toBe(12158);
      expect(r?.normalized).toBe('UGC12158');
    });
  });

  // ========================================================================
  // Star catalogs (HD, HIP, SAO, Gaia)
  // ========================================================================
  describe('star catalogs', () => {
    it('parses HD 209458', () => {
      const r = parseCatalogIdentifier('HD 209458');
      expect(r?.catalog).toBe('HD');
      expect(r?.number).toBe(209458);
      expect(r?.normalized).toBe('HD 209458');
    });

    it('parses HIP 11767', () => {
      const r = parseCatalogIdentifier('HIP 11767');
      expect(r?.catalog).toBe('HIP');
      expect(r?.number).toBe(11767);
    });

    it('parses SAO 63349', () => {
      const r = parseCatalogIdentifier('SAO 63349');
      expect(r?.catalog).toBe('SAO');
      expect(r?.number).toBe(63349);
    });

    it('parses GAIA DR3 source', () => {
      const r = parseCatalogIdentifier('GAIA DR3 4295806720');
      expect(r?.catalog).toBe('Gaia');
      expect(r?.token).toBe('4295806720');
    });

    it('parses GAIA SOURCE', () => {
      const r = parseCatalogIdentifier('GAIA SOURCE 4295806720');
      expect(r?.catalog).toBe('Gaia');
    });
  });

  // ========================================================================
  // TYC / 2MASS / PSR
  // ========================================================================
  describe('TYC', () => {
    it('parses TYC 4302-1842-1', () => {
      const r = parseCatalogIdentifier('TYC 4302-1842-1');
      expect(r?.catalog).toBe('TYC');
      expect(r?.number).toBeNull();
      expect(r?.token).toBe('4302-1842-1');
    });
  });

  describe('2MASS', () => {
    it('parses 2MASS J06495091-0737408', () => {
      const r = parseCatalogIdentifier('2MASS J06495091-0737408');
      expect(r?.catalog).toBe('2MASS');
      expect(r?.token).toBe('06495091-0737408');
    });

    it('parses 2MASS without J prefix', () => {
      const r = parseCatalogIdentifier('2MASS 06495091-0737408');
      expect(r?.catalog).toBe('2MASS');
    });
  });

  describe('PSR', () => {
    it('parses PSR J0437-4715', () => {
      const r = parseCatalogIdentifier('PSR J0437-4715');
      expect(r?.catalog).toBe('PSR');
      expect(r?.token).toBe('J0437-4715');
    });

    it('parses bare J-name as PSR', () => {
      const r = parseCatalogIdentifier('J1939+2134');
      expect(r?.catalog).toBe('PSR');
    });
  });

  // ========================================================================
  // Edge cases
  // ========================================================================
  describe('edge cases', () => {
    it('returns null for empty string', () => {
      expect(parseCatalogIdentifier('')).toBeNull();
    });

    it('returns null for whitespace only', () => {
      expect(parseCatalogIdentifier('   ')).toBeNull();
    });

    it('returns null for unrecognized input', () => {
      expect(parseCatalogIdentifier('Andromeda Galaxy')).toBeNull();
    });
  });
});

describe('normalizeCatalogIdentifier', () => {
  it('normalizes known catalog identifiers', () => {
    expect(normalizeCatalogIdentifier('M 31')).toBe('M31');
    expect(normalizeCatalogIdentifier('NGC 7000')).toBe('NGC7000');
  });

  it('falls back to canonical form for unknown input', () => {
    const result = normalizeCatalogIdentifier('Some Random Object');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});
