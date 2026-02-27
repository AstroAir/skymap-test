import {
  normalizeWhitespace,
  normalizeIdentifierToken,
  buildCanonicalId,
  uniqueStrings,
} from '../normalize';

describe('normalize utilities', () => {
  describe('normalizeWhitespace', () => {
    it('trims leading/trailing spaces', () => {
      expect(normalizeWhitespace('  hello  ')).toBe('hello');
    });

    it('collapses multiple spaces', () => {
      expect(normalizeWhitespace('a   b   c')).toBe('a b c');
    });

    it('returns empty string for whitespace only', () => {
      expect(normalizeWhitespace('   ')).toBe('');
    });
  });

  describe('normalizeIdentifierToken', () => {
    it('normalizes whitespace and dashes', () => {
      expect(normalizeIdentifierToken('NGC  7000')).toBe('NGC 7000');
    });

    it('replaces unicode dashes with ASCII hyphen', () => {
      expect(normalizeIdentifierToken('Sh2\u20131')).toBe('Sh2-1');
      expect(normalizeIdentifierToken('Sh2\u20101')).toBe('Sh2-1');
    });

    it('removes spaces around dashes', () => {
      expect(normalizeIdentifierToken('T - 1')).toBe('T-1');
    });
  });

  describe('buildCanonicalId', () => {
    it('uppercases the normalized token', () => {
      expect(buildCanonicalId('ngc 7000')).toBe('NGC 7000');
    });

    it('normalizes and uppercases together', () => {
      expect(buildCanonicalId('  sh2 - 155  ')).toBe('SH2-155');
    });
  });

  describe('uniqueStrings', () => {
    it('returns unique trimmed strings', () => {
      expect(uniqueStrings(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c']);
    });

    it('is case-insensitive for deduplication', () => {
      expect(uniqueStrings(['NGC 7000', 'ngc 7000', 'NGC 7000'])).toEqual(['NGC 7000']);
    });

    it('filters null and undefined', () => {
      expect(uniqueStrings([null, 'a', undefined, 'b', null])).toEqual(['a', 'b']);
    });

    it('filters empty and whitespace-only strings', () => {
      expect(uniqueStrings(['', '   ', 'a'])).toEqual(['a']);
    });

    it('returns empty array for all-null input', () => {
      expect(uniqueStrings([null, undefined, ''])).toEqual([]);
    });

    it('preserves first occurrence casing', () => {
      expect(uniqueStrings(['Hello', 'HELLO', 'hello'])).toEqual(['Hello']);
    });

    it('trims whitespace from values', () => {
      expect(uniqueStrings(['  a  ', 'a'])).toEqual(['a']);
    });
  });
});
