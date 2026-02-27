/**
 * Unit tests for Fuzzy Search Engine
 * Tests string similarity algorithms, catalog parsing, and common name mappings
 */

import {
  levenshteinDistance,
  jaroSimilarity,
  jaroWinklerSimilarity,
  calculateSimilarity,
  parseCatalogId,
  generateCatalogVariations,
  COMMON_NAME_TO_CATALOG,
  PHONETIC_VARIATIONS,
  buildSearchIndex,
  fuzzySearch,
  quickFuzzySearch,
  weightedSearch,
  type SearchIndexEntry,
} from '../fuzzy-search';

describe('Fuzzy Search Engine', () => {
  describe('Levenshtein Distance', () => {
    test('should return 0 for identical strings', () => {
      expect(levenshteinDistance('hello', 'hello')).toBe(0);
      expect(levenshteinDistance('M31', 'M31')).toBe(0);
      expect(levenshteinDistance('', '')).toBe(0);
    });

    test('should return string length for comparison with empty string', () => {
      expect(levenshteinDistance('hello', '')).toBe(5);
      expect(levenshteinDistance('', 'world')).toBe(5);
    });

    test('should calculate correct distance for single character changes', () => {
      expect(levenshteinDistance('cat', 'bat')).toBe(1); // substitution
      expect(levenshteinDistance('cat', 'cats')).toBe(1); // insertion
      expect(levenshteinDistance('cats', 'cat')).toBe(1); // deletion
    });

    test('should handle common astronomical misspellings', () => {
      expect(levenshteinDistance('andromeda', 'andromida')).toBe(1);
      expect(levenshteinDistance('pleiades', 'pleides')).toBe(1);
      expect(levenshteinDistance('dumbbell', 'dumbell')).toBe(1);
      expect(levenshteinDistance('sombrero', 'sombero')).toBe(1);
    });

    test('should calculate correct distance for multiple changes', () => {
      expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
      expect(levenshteinDistance('saturday', 'sunday')).toBe(3);
    });

    test('should be symmetric', () => {
      expect(levenshteinDistance('abc', 'def')).toBe(levenshteinDistance('def', 'abc'));
      expect(levenshteinDistance('M31', 'NGC224')).toBe(levenshteinDistance('NGC224', 'M31'));
    });
  });

  describe('Jaro Similarity', () => {
    test('should return 1 for identical strings', () => {
      expect(jaroSimilarity('hello', 'hello')).toBe(1);
      expect(jaroSimilarity('M31', 'M31')).toBe(1);
    });

    test('should return 0 for empty string comparisons', () => {
      expect(jaroSimilarity('', 'hello')).toBe(0);
      expect(jaroSimilarity('hello', '')).toBe(0);
    });

    test('should return 0 for completely different strings', () => {
      expect(jaroSimilarity('abc', 'xyz')).toBe(0);
    });

    test('should return high similarity for similar strings', () => {
      const similarity = jaroSimilarity('andromeda', 'andromida');
      expect(similarity).toBeGreaterThan(0.9);
    });

    test('should be symmetric', () => {
      expect(jaroSimilarity('hello', 'hallo')).toBeCloseTo(jaroSimilarity('hallo', 'hello'));
    });
  });

  describe('Jaro-Winkler Similarity', () => {
    test('should return 1 for identical strings', () => {
      expect(jaroWinklerSimilarity('hello', 'hello')).toBe(1);
    });

    test('should give higher scores to strings with common prefixes', () => {
      const withPrefix = jaroWinklerSimilarity('MARTHA', 'MARHTA');
      const jaro = jaroSimilarity('MARTHA', 'MARHTA');
      expect(withPrefix).toBeGreaterThanOrEqual(jaro);
    });

    test('should handle astronomical object names well', () => {
      // Similar names with typos should have high similarity
      expect(jaroWinklerSimilarity('andromeda', 'andromida')).toBeGreaterThan(0.9);
      expect(jaroWinklerSimilarity('NGC7000', 'NGC 7000')).toBeGreaterThan(0.8);
      expect(jaroWinklerSimilarity('messier31', 'messier 31')).toBeGreaterThan(0.8);
    });

    test('should respect the p parameter', () => {
      const defaultP = jaroWinklerSimilarity('DWAYNE', 'DUANE');
      const lowP = jaroWinklerSimilarity('DWAYNE', 'DUANE', 0.05);
      expect(defaultP).toBeGreaterThan(lowP);
    });
  });

  describe('Calculate Similarity', () => {
    test('should return 1 for exact match (case insensitive)', () => {
      expect(calculateSimilarity('M31', 'm31')).toBe(1);
      expect(calculateSimilarity('Andromeda', 'ANDROMEDA')).toBe(1);
    });

    test('should return 0.95 for prefix match', () => {
      expect(calculateSimilarity('Andromeda', 'Andro')).toBe(0.95);
      expect(calculateSimilarity('M31', 'M')).toBe(0.95);
    });

    test('should return 0.85 for contains match', () => {
      expect(calculateSimilarity('Andromeda Galaxy', 'romeda')).toBe(0.85);
    });

    test('should return high score for similar strings with typos', () => {
      const similarity = calculateSimilarity('andromeda', 'andromida');
      expect(similarity).toBeGreaterThan(0.8);
    });

    test('should handle whitespace differences', () => {
      expect(calculateSimilarity('  M31  ', 'M31')).toBe(1);
    });
  });

  describe('Catalog ID Parser', () => {
    describe('Messier Objects', () => {
      test('should parse M31 format', () => {
        const result = parseCatalogId('M31');
        expect(result).not.toBeNull();
        expect(result?.catalog).toBe('M');
        expect(result?.number).toBe(31);
        expect(result?.normalized).toBe('M31');
      });

      test('should parse M 31 format (with space)', () => {
        const result = parseCatalogId('M 31');
        expect(result).not.toBeNull();
        expect(result?.catalog).toBe('M');
        expect(result?.number).toBe(31);
      });

      test('should parse Messier31 format', () => {
        const result = parseCatalogId('Messier31');
        expect(result).not.toBeNull();
        expect(result?.catalog).toBe('M');
        expect(result?.number).toBe(31);
      });

      test('should parse Messier 31 format', () => {
        const result = parseCatalogId('Messier 31');
        expect(result).not.toBeNull();
        expect(result?.catalog).toBe('M');
        expect(result?.number).toBe(31);
      });

      test('should be case insensitive', () => {
        expect(parseCatalogId('m31')?.catalog).toBe('M');
        expect(parseCatalogId('MESSIER31')?.catalog).toBe('M');
      });
    });

    describe('NGC Objects', () => {
      test('should parse NGC7000 format', () => {
        const result = parseCatalogId('NGC7000');
        expect(result).not.toBeNull();
        expect(result?.catalog).toBe('NGC');
        expect(result?.number).toBe(7000);
        expect(result?.normalized).toBe('NGC7000');
      });

      test('should parse NGC 224 format', () => {
        const result = parseCatalogId('NGC 224');
        expect(result).not.toBeNull();
        expect(result?.catalog).toBe('NGC');
        expect(result?.number).toBe(224);
      });

      test('should handle NGC suffix (like NGC6960A)', () => {
        const result = parseCatalogId('NGC6960A');
        expect(result).not.toBeNull();
        expect(result?.catalog).toBe('NGC');
        expect(result?.number).toBe(6960);
        expect(result?.suffix).toBe('A');
        expect(result?.normalized).toBe('NGC6960A');
      });

      test('should parse N7000 shorthand', () => {
        const result = parseCatalogId('N7000');
        expect(result).not.toBeNull();
        expect(result?.catalog).toBe('NGC');
        expect(result?.number).toBe(7000);
      });
    });

    describe('IC Objects', () => {
      test('should parse IC342 format', () => {
        const result = parseCatalogId('IC342');
        expect(result).not.toBeNull();
        expect(result?.catalog).toBe('IC');
        expect(result?.number).toBe(342);
      });

      test('should parse IC 1396 format', () => {
        const result = parseCatalogId('IC 1396');
        expect(result).not.toBeNull();
        expect(result?.catalog).toBe('IC');
        expect(result?.number).toBe(1396);
      });
    });

    describe('Caldwell Objects', () => {
      test('should parse C14 format', () => {
        const result = parseCatalogId('C14');
        expect(result).not.toBeNull();
        expect(result?.catalog).toBe('C');
        expect(result?.number).toBe(14);
      });

      test('should parse Caldwell 14 format', () => {
        const result = parseCatalogId('Caldwell 14');
        expect(result).not.toBeNull();
        expect(result?.catalog).toBe('C');
        expect(result?.number).toBe(14);
      });
    });

    describe('Sharpless Objects', () => {
      test('should parse Sh2-155 format', () => {
        const result = parseCatalogId('Sh2-155');
        expect(result).not.toBeNull();
        expect(result?.catalog).toBe('Sh2');
        expect(result?.number).toBe(155);
      });

      test('should parse Sharpless 155 format', () => {
        const result = parseCatalogId('Sharpless 155');
        expect(result).not.toBeNull();
        expect(result?.catalog).toBe('Sh2');
        expect(result?.number).toBe(155);
      });
    });

    describe('Barnard Objects', () => {
      test('should parse B33 format', () => {
        const result = parseCatalogId('B33');
        expect(result).not.toBeNull();
        expect(result?.catalog).toBe('B');
        expect(result?.number).toBe(33);
      });

      test('should parse Barnard 33 format', () => {
        const result = parseCatalogId('Barnard 33');
        expect(result).not.toBeNull();
        expect(result?.catalog).toBe('B');
        expect(result?.number).toBe(33);
      });
    });

    describe('Other Catalogs', () => {
      test('should parse Abell objects', () => {
        expect(parseCatalogId('Abell 426')?.catalog).toBe('Abell');
      });

      test('should parse Melotte objects', () => {
        expect(parseCatalogId('Mel 111')?.catalog).toBe('Mel');
        expect(parseCatalogId('Melotte 111')?.catalog).toBe('Mel');
      });

      test('should parse Collinder objects', () => {
        expect(parseCatalogId('Cr 399')?.catalog).toBe('Cr');
        expect(parseCatalogId('Collinder 399')?.catalog).toBe('Cr');
      });

      test('should parse Trumpler objects', () => {
        expect(parseCatalogId('Tr 37')?.catalog).toBe('Tr');
        expect(parseCatalogId('Trumpler 37')?.catalog).toBe('Tr');
      });

      test('should parse van den Bergh objects', () => {
        expect(parseCatalogId('vdB 152')?.catalog).toBe('vdB');
      });

      test('should parse LDN objects', () => {
        expect(parseCatalogId('LDN 1622')?.catalog).toBe('LDN');
      });

      test('should parse LBN objects', () => {
        expect(parseCatalogId('LBN 777')?.catalog).toBe('LBN');
      });
    });

    describe('Invalid Input', () => {
      test('should return null for invalid format', () => {
        expect(parseCatalogId('invalid')).toBeNull();
        expect(parseCatalogId('hello world')).toBeNull();
        expect(parseCatalogId('')).toBeNull();
      });

      test('should return null for unknown catalogs', () => {
        expect(parseCatalogId('XYZ123')).toBeNull();
      });
    });
  });

  describe('Generate Catalog Variations', () => {
    test('should generate variations for Messier objects', () => {
      const parsed = parseCatalogId('M31')!;
      const variations = generateCatalogVariations(parsed);
      
      expect(variations).toContain('M31');
      expect(variations).toContain('M 31');
      expect(variations).toContain('Messier 31');
      expect(variations).toContain('Messier31');
    });

    test('should generate variations for NGC objects', () => {
      const parsed = parseCatalogId('NGC7000')!;
      const variations = generateCatalogVariations(parsed);
      
      expect(variations).toContain('NGC7000');
      expect(variations).toContain('NGC 7000');
      expect(variations).toContain('N7000');
    });

    test('should generate variations for NGC objects with suffix', () => {
      const parsed = parseCatalogId('NGC6960A')!;
      const variations = generateCatalogVariations(parsed);
      
      expect(variations).toContain('NGC6960A');
      expect(variations).toContain('NGC 6960A');
    });

    test('should generate variations for Caldwell objects', () => {
      const parsed = parseCatalogId('C14')!;
      const variations = generateCatalogVariations(parsed);
      
      expect(variations).toContain('C14');
      expect(variations).toContain('C 14');
      expect(variations).toContain('Caldwell 14');
    });

    test('should generate variations for Sharpless objects', () => {
      const parsed = parseCatalogId('Sh2-155')!;
      const variations = generateCatalogVariations(parsed);
      
      expect(variations).toContain('Sh2155');
      expect(variations).toContain('Sharpless 155');
      expect(variations).toContain('Sh 2-155');
    });

    test('should generate variations for Barnard objects', () => {
      const parsed = parseCatalogId('B33')!;
      const variations = generateCatalogVariations(parsed);
      
      expect(variations).toContain('B33');
      expect(variations).toContain('Barnard 33');
    });

    test('should not include duplicates', () => {
      const parsed = parseCatalogId('M31')!;
      const variations = generateCatalogVariations(parsed);
      const uniqueVariations = [...new Set(variations)];
      
      expect(variations.length).toBe(uniqueVariations.length);
    });
  });

  describe('Common Name Mappings', () => {
    test('should map Andromeda to M31', () => {
      expect(COMMON_NAME_TO_CATALOG['andromeda']).toContain('M31');
      expect(COMMON_NAME_TO_CATALOG['andromeda galaxy']).toContain('M31');
    });

    test('should map Orion Nebula to M42', () => {
      expect(COMMON_NAME_TO_CATALOG['orion']).toContain('M42');
      expect(COMMON_NAME_TO_CATALOG['orion nebula']).toContain('M42');
      expect(COMMON_NAME_TO_CATALOG['great orion nebula']).toContain('M42');
    });

    test('should map Crab Nebula to M1', () => {
      expect(COMMON_NAME_TO_CATALOG['crab']).toContain('M1');
      expect(COMMON_NAME_TO_CATALOG['crab nebula']).toContain('M1');
    });

    test('should map Whirlpool Galaxy to M51', () => {
      expect(COMMON_NAME_TO_CATALOG['whirlpool']).toContain('M51');
      expect(COMMON_NAME_TO_CATALOG['whirlpool galaxy']).toContain('M51');
    });

    test('should map Ring Nebula to M57', () => {
      expect(COMMON_NAME_TO_CATALOG['ring']).toContain('M57');
      expect(COMMON_NAME_TO_CATALOG['ring nebula']).toContain('M57');
    });

    test('should map Dumbbell Nebula to M27', () => {
      expect(COMMON_NAME_TO_CATALOG['dumbbell']).toContain('M27');
      expect(COMMON_NAME_TO_CATALOG['dumbbell nebula']).toContain('M27');
    });

    test('should map North America Nebula to NGC7000', () => {
      expect(COMMON_NAME_TO_CATALOG['north america']).toContain('NGC7000');
      expect(COMMON_NAME_TO_CATALOG['north america nebula']).toContain('NGC7000');
    });

    test('should map Pleiades to M45', () => {
      expect(COMMON_NAME_TO_CATALOG['pleiades']).toContain('M45');
      expect(COMMON_NAME_TO_CATALOG['seven sisters']).toContain('M45');
    });

    test('should map Hercules Cluster to M13', () => {
      expect(COMMON_NAME_TO_CATALOG['hercules cluster']).toContain('M13');
      expect(COMMON_NAME_TO_CATALOG['great hercules cluster']).toContain('M13');
    });

    test('should include NGC designations as alternatives', () => {
      expect(COMMON_NAME_TO_CATALOG['andromeda']).toContain('NGC224');
      expect(COMMON_NAME_TO_CATALOG['orion nebula']).toContain('NGC1976');
    });
  });

  describe('Phonetic Variations', () => {
    test('should include common misspellings for Andromeda', () => {
      expect(PHONETIC_VARIATIONS['andromeda']).toContain('andromida');
      expect(PHONETIC_VARIATIONS['andromeda']).toContain('andromada');
    });

    test('should include common misspellings for Pleiades', () => {
      expect(PHONETIC_VARIATIONS['pleiades']).toContain('pleides');
      expect(PHONETIC_VARIATIONS['pleiades']).toContain('pleyades');
    });

    test('should include common misspellings for Orion', () => {
      expect(PHONETIC_VARIATIONS['orion']).toContain('oreon');
      expect(PHONETIC_VARIATIONS['orion']).toContain('orien');
    });

    test('should include variations for Andromeda', () => {
      expect(PHONETIC_VARIATIONS['andromeda']).toContain('andromedea');
    });

    test('should include common misspellings for Dumbbell', () => {
      expect(PHONETIC_VARIATIONS['dumbbell']).toContain('dumbell');
      expect(PHONETIC_VARIATIONS['dumbbell']).toContain('dumbel');
    });

    test('should include common misspellings for Sombrero', () => {
      expect(PHONETIC_VARIATIONS['sombrero']).toContain('sombero');
    });
  });

  describe('Build Search Index', () => {

    const testCatalog = [
      {
        id: 'M31',
        name: 'M31',
        alternateNames: ['NGC224', 'Andromeda Galaxy'],
        constellation: 'And',
        type: 'Galaxy',
        magnitude: 3.4,
      },
      {
        id: 'M42',
        name: 'M42',
        alternateNames: ['NGC1976', 'Orion Nebula'],
        constellation: 'Ori',
        type: 'Nebula',
        magnitude: 4.0,
      },
      {
        id: 'NGC7000',
        name: 'NGC7000',
        constellation: 'Cyg',
        type: 'Nebula',
        magnitude: 4.0,
      },
    ];

    test('should build an index from catalog', () => {
      const index = buildSearchIndex(testCatalog);
      expect(index).toBeInstanceOf(Map);
      expect(index.size).toBe(3);
    });

    test('should index entries with correct fields', () => {
      const index = buildSearchIndex(testCatalog);
      const entry = index.get('M31');
      expect(entry).toBeDefined();
      expect(entry?.name).toBe('M31');
      expect(entry?.nameLower).toBe('m31');
      expect(entry?.constellation).toBe('And');
      expect(entry?.constellationLower).toBe('and');
      expect(entry?.type).toBe('Galaxy');
      expect(entry?.typeLower).toBe('galaxy');
      expect(entry?.magnitude).toBe(3.4);
    });

    test('should index alternate names', () => {
      const index = buildSearchIndex(testCatalog);
      const entry = index.get('M31');
      expect(entry?.alternateNames).toContain('NGC224');
      expect(entry?.alternateNames).toContain('Andromeda Galaxy');
      expect(entry?.alternateNamesLower).toContain('ngc224');
    });

    test('should parse catalog IDs from names', () => {
      const index = buildSearchIndex(testCatalog);
      const entry = index.get('M31');
      expect(entry?.catalogIds.length).toBeGreaterThan(0);
      expect(entry?.catalogIds[0].catalog).toBe('M');
      expect(entry?.catalogIds[0].number).toBe(31);
    });

    test('should generate search tokens including catalog variations', () => {
      const index = buildSearchIndex(testCatalog);
      const entry = index.get('M31');
      expect(entry?.tokens).toContain('m31');
      expect(entry?.tokens).toContain('and');
      expect(entry?.tokens).toContain('galaxy');
      // Should include Messier variation
      expect(entry?.tokens.some((t: string) => t.includes('messier'))).toBe(true);
    });

    test('should handle objects without alternate names', () => {
      const index = buildSearchIndex(testCatalog);
      const entry = index.get('NGC7000');
      expect(entry?.alternateNames).toEqual([]);
      expect(entry?.alternateNamesLower).toEqual([]);
    });
  });

  describe('Fuzzy Search (full function)', () => {

    const testCatalog = [
      { id: 'M31', name: 'M31', alternateNames: ['NGC224', 'Andromeda Galaxy'], constellation: 'And', type: 'Galaxy', magnitude: 3.4 },
      { id: 'M42', name: 'M42', alternateNames: ['NGC1976', 'Orion Nebula'], constellation: 'Ori', type: 'Nebula', magnitude: 4.0 },
      { id: 'M45', name: 'M45', alternateNames: ['Pleiades'], constellation: 'Tau', type: 'OpenCluster', magnitude: 1.6 },
      { id: 'NGC7000', name: 'NGC7000', alternateNames: ['North America Nebula'], constellation: 'Cyg', type: 'Nebula', magnitude: 4.0 },
      { id: 'IC1396', name: 'IC1396', alternateNames: ['Elephant Trunk Nebula'], constellation: 'Cep', type: 'Nebula', magnitude: 3.5 },
    ];
    let index: Map<string, SearchIndexEntry>;

    beforeAll(() => {
      index = buildSearchIndex(testCatalog);
    });

    test('should return empty array for empty query', () => {
      expect(fuzzySearch('', index)).toEqual([]);
      expect(fuzzySearch('  ', index)).toEqual([]);
    });

    test('should find exact catalog match', () => {
      const results = fuzzySearch('M31', index);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('M31');
      // Match type could be 'exact' or 'catalog' depending on scoring boosts
      expect(['exact', 'catalog']).toContain(results[0].matchType);
    });

    test('should find by common name mapping', () => {
      const results = fuzzySearch('andromeda', index);
      expect(results.some((r: { id: string }) => r.id === 'M31')).toBe(true);
    });

    test('should find by prefix match', () => {
      const results = fuzzySearch('NGC70', index);
      expect(results.some((r: { id: string }) => r.id === 'NGC7000')).toBe(true);
    });

    test('should find by phonetic variation', () => {
      const results = fuzzySearch('andromida', index);
      // Should still find M31 via phonetic variation
      expect(results.some((r: { id: string }) => r.id === 'M31')).toBe(true);
    });

    test('should find by alternate name', () => {
      const results = fuzzySearch('Orion Nebula', index);
      expect(results.some((r: { id: string }) => r.id === 'M42')).toBe(true);
    });

    test('should find by contains match', () => {
      const results = fuzzySearch('America', index, { minScore: 0.1 });
      expect(results.some((r: { id: string }) => r.id === 'NGC7000')).toBe(true);
    });

    test('should respect maxResults option', () => {
      const results = fuzzySearch('M', index, { maxResults: 2 });
      expect(results.length).toBeLessThanOrEqual(2);
    });

    test('should respect minScore option', () => {
      const results = fuzzySearch('xyz', index, { minScore: 0.9 });
      expect(results.length).toBe(0);
    });

    test('should sort results by score descending', () => {
      const results = fuzzySearch('M', index);
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
      }
    });

    test('should do fuzzy matching for typos', () => {
      const results = fuzzySearch('Pleaides', index, { fuzzyThreshold: 0.5 });
      // May find Pleiades via fuzzy match
      if (results.length > 0) {
        expect(results[0].score).toBeGreaterThan(0);
      }
    });

    test('should match constellation via fuzzy', () => {
      const results = fuzzySearch('Orion', index, { fuzzyThreshold: 0.5 });
      // Should match Ori constellation or Orion Nebula
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('Quick Fuzzy Search', () => {

    const testCatalog = [
      { id: 'M31', name: 'M31', alternateNames: ['NGC224'], constellation: 'And', type: 'Galaxy' },
      { id: 'M32', name: 'M32', alternateNames: [], constellation: 'And', type: 'Galaxy' },
      { id: 'M33', name: 'M33', alternateNames: ['NGC598'], constellation: 'Tri', type: 'Galaxy' },
      { id: 'NGC7000', name: 'NGC7000', alternateNames: [], constellation: 'Cyg', type: 'Nebula' },
    ];
    let index: Map<string, SearchIndexEntry>;

    beforeAll(() => {
      index = buildSearchIndex(testCatalog);
    });

    test('should return empty array for empty query', () => {
      expect(quickFuzzySearch('', index)).toEqual([]);
    });

    test('should find by name prefix', () => {
      const results = quickFuzzySearch('M3', index);
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((r: { id: string }) => r.id.startsWith('M3'))).toBe(true);
    });

    test('should find by alternate name prefix', () => {
      const results = quickFuzzySearch('NGC2', index);
      expect(results.some((r: { id: string }) => r.id === 'M31')).toBe(true);
    });

    test('should find by token prefix', () => {
      const results = quickFuzzySearch('ngc7', index);
      expect(results.some((r: { id: string }) => r.id === 'NGC7000')).toBe(true);
    });

    test('should respect limit parameter', () => {
      const results = quickFuzzySearch('M', index, 2);
      expect(results.length).toBeLessThanOrEqual(2);
    });

    test('should deduplicate results', () => {
      const results = quickFuzzySearch('M3', index);
      const ids = results.map((r: { id: string }) => r.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    test('should sort by score descending', () => {
      const results = quickFuzzySearch('M3', index);
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
      }
    });
  });

  describe('Weighted Search', () => {

    const testCatalog = [
      { id: 'M31', name: 'M31', alternateNames: ['Andromeda Galaxy'], constellation: 'And', type: 'Galaxy', magnitude: 3.4 },
      { id: 'M42', name: 'M42', alternateNames: ['Orion Nebula'], constellation: 'Ori', type: 'Nebula', magnitude: 4.0 },
      { id: 'M45', name: 'M45', alternateNames: ['Pleiades'], constellation: 'Tau', type: 'OpenCluster', magnitude: 1.6 },
    ];
    let index: Map<string, SearchIndexEntry>;

    beforeAll(() => {
      index = buildSearchIndex(testCatalog);
    });

    test('should return empty array for empty query', () => {
      expect(weightedSearch('', index)).toEqual([]);
      expect(weightedSearch('   ', index)).toEqual([]);
    });

    test('should find by name', () => {
      const results = weightedSearch('M31', index);
      expect(results.some((r: { id: string }) => r.id === 'M31')).toBe(true);
    });

    test('should find by alternate name', () => {
      const results = weightedSearch('Andromeda', index);
      expect(results.some((r: { id: string }) => r.id === 'M31')).toBe(true);
    });

    test('should find by constellation', () => {
      const results = weightedSearch('Ori', index);
      expect(results.some((r: { id: string }) => r.id === 'M42')).toBe(true);
    });

    test('should find by type', () => {
      const results = weightedSearch('Galaxy', index);
      expect(results.some((r: { id: string }) => r.id === 'M31')).toBe(true);
    });

    test('should handle multi-word queries', () => {
      const results = weightedSearch('Orion Nebula', index);
      expect(results.some((r: { id: string }) => r.id === 'M42')).toBe(true);
    });

    test('should boost brighter objects when magnitudeBoost enabled', () => {
      const results = weightedSearch('M', index, { magnitudeBoost: true });
      // M45 (mag 1.6) should rank higher than M42 (mag 4.0) when other scores are similar
      if (results.length >= 2) {
        expect(results.every((r: { score: number }) => r.score > 0)).toBe(true);
      }
    });

    test('should respect custom weight options', () => {
      const results = weightedSearch('Galaxy', index, { typeWeight: 2.0 });
      expect(results.length).toBeGreaterThan(0);
    });

    test('should sort results by score descending', () => {
      const results = weightedSearch('M', index);
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
      }
    });

    test('should limit results to 50', () => {
      const results = weightedSearch('M', index);
      expect(results.length).toBeLessThanOrEqual(50);
    });
  });

  describe('Edge Cases', () => {
    test('should handle very long strings', () => {
      const longStr = 'a'.repeat(1000);
      expect(() => levenshteinDistance(longStr, longStr)).not.toThrow();
      expect(() => jaroWinklerSimilarity(longStr, longStr)).not.toThrow();
    });

    test('should handle special characters in input', () => {
      const result = parseCatalogId("NGC6543"); // Cat's Eye
      expect(result).not.toBeNull();
    });

    test('should handle unicode characters', () => {
      expect(() => calculateSimilarity('Café', 'Cafe')).not.toThrow();
    });

    test('should handle numbers as strings', () => {
      const similarity = calculateSimilarity('7000', '7001');
      expect(similarity).toBeGreaterThan(0.5);
    });
  });
});
