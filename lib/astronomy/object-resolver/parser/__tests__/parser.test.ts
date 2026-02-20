import {
  parseCatalogIdentifier,
  parseCoordinateQuery,
  parseDecCoordinate,
  parseMinorIdentifier,
  parseQuery,
  parseRACoordinate,
} from '../index';

describe('object-resolver parser', () => {
  describe('catalog parser', () => {
    it('parses DSO catalog identifiers', () => {
      expect(parseCatalogIdentifier('M31')?.normalized).toBe('M31');
      expect(parseCatalogIdentifier('NGC 7000')?.normalized).toBe('NGC7000');
      expect(parseCatalogIdentifier('Sh2-155')?.catalog).toBe('Sh2');
      expect(parseCatalogIdentifier('vdB 152')?.normalized).toBe('vdB152');
    });

    it('parses stellar survey identifiers', () => {
      expect(parseCatalogIdentifier('TYC 4302-1842-1')?.catalog).toBe('TYC');
      expect(parseCatalogIdentifier('2MASS J06495091-0737408')?.catalog).toBe('2MASS');
      expect(parseCatalogIdentifier('PSR J0437-4715')?.catalog).toBe('PSR');
    });
  });

  describe('minor parser', () => {
    it('parses minor-planet and comet identifiers', () => {
      expect(parseMinorIdentifier('(433)')?.kind).toBe('numbered');
      expect(parseMinorIdentifier('2007 TA418')?.kind).toBe('provisional');
      expect(parseMinorIdentifier('K07Tf8A')?.kind).toBe('packed_provisional');
      expect(parseMinorIdentifier('2040 P-L')?.kind).toBe('survey');
      expect(parseMinorIdentifier('73P-B')?.category).toBe('comet');
      expect(parseMinorIdentifier('C/2023 A3')?.category).toBe('comet');
    });

    it('parses old-style identifiers', () => {
      expect(parseMinorIdentifier('1915 a')?.kind).toBe('old_style');
    });
  });

  describe('coordinate parser', () => {
    it('parses decimal and sexagesimal coordinates', () => {
      const decimal = parseCoordinateQuery('10.6847 41.2689');
      expect(decimal?.ra).toBeCloseTo(10.6847, 5);
      expect(decimal?.dec).toBeCloseTo(41.2689, 5);

      const colon = parseCoordinateQuery('00:42:44 +41:16:09');
      expect(colon?.ra).toBeCloseTo(10.6833, 3);
      expect(colon?.dec).toBeCloseTo(41.2691, 3);

      const hms = parseCoordinateQuery(`00h42m44s +41°16'09"`);
      expect(hms?.ra).toBeCloseTo(10.6833, 3);
      expect(hms?.dec).toBeCloseTo(41.2691, 3);
    });

    it('extracts J-name coordinates', () => {
      const parsed = parseCoordinateQuery('2MASS J06495091-0737408');
      expect(parsed?.format).toBe('jname');
      expect(parsed?.ra).toBeCloseTo(102.462, 2);
      expect(parsed?.dec).toBeCloseTo(-7.628, 2);
    });

    it('validates RA/Dec scalar parsing', () => {
      expect(parseRACoordinate('00:42:44')).not.toBeNull();
      expect(parseRACoordinate('361')).toBeNull();
      expect(parseDecCoordinate('+41:16:09')).not.toBeNull();
      expect(parseDecCoordinate('+91:00:00')).toBeNull();
    });
  });

  describe('parseQuery', () => {
    it('classifies query types', () => {
      expect(parseQuery('M31').kind).toBe('catalog');
      expect(parseQuery('2007 TA418').kind).toBe('minor');
      expect(parseQuery('10.6847 41.2689').kind).toBe('coordinate');
      expect(parseQuery('Andromeda Galaxy').kind).toBe('name');
    });
  });
});
