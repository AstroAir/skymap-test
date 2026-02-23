/**
 * Tests for coordinate-validators.ts
 * Validates RA and Dec input string validation functions
 */

import { isValidRA, isValidDec } from '../coordinate-validators';

describe('isValidRA', () => {
  it('should accept empty/whitespace string', () => {
    expect(isValidRA('')).toBe(true);
    expect(isValidRA('  ')).toBe(true);
  });

  it('should accept decimal degree values 0-360', () => {
    expect(isValidRA('0')).toBe(true);
    expect(isValidRA('180')).toBe(true);
    expect(isValidRA('359.99')).toBe(true);
  });

  it('should accept HMS format', () => {
    expect(isValidRA('00h42m44s')).toBe(true);
    expect(isValidRA('12h00m00s')).toBe(true);
    expect(isValidRA('23h59m59s')).toBe(true);
  });

  it('should accept colon-separated format', () => {
    expect(isValidRA('00:42:44')).toBe(true);
    expect(isValidRA('12:00:00')).toBe(true);
  });

  it('should reject invalid RA strings', () => {
    expect(isValidRA('abc')).toBe(false);
    expect(isValidRA('not a number')).toBe(false);
  });
});

describe('isValidDec', () => {
  it('should accept empty/whitespace string', () => {
    expect(isValidDec('')).toBe(true);
    expect(isValidDec('  ')).toBe(true);
  });

  it('should accept decimal degree values -90 to 90', () => {
    expect(isValidDec('0')).toBe(true);
    expect(isValidDec('45')).toBe(true);
    expect(isValidDec('-45')).toBe(true);
    expect(isValidDec('90')).toBe(true);
    expect(isValidDec('-90')).toBe(true);
  });

  it('should accept DMS format', () => {
    expect(isValidDec('+41:16:09')).toBe(true);
    expect(isValidDec('-41:16:09')).toBe(true);
  });

  it('should reject invalid Dec strings', () => {
    expect(isValidDec('abc')).toBe(false);
    expect(isValidDec('not a number')).toBe(false);
  });
});
