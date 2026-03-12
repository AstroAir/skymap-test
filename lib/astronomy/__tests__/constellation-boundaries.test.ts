/**
 * @jest-environment jsdom
 */

import {
  getConstellationAbbrev,
  getConstellationFromCoords,
  getConstellationFullName,
} from '../constellation-boundaries';

describe('constellation-boundaries', () => {
  describe('getConstellationAbbrev', () => {
    // Known object positions (J2000)
    it('should return Ori for M42 (Orion Nebula)', () => {
      // M42: RA 83.82°, Dec -5.39°
      expect(getConstellationAbbrev(83.82, -5.39)).toBe('Ori');
    });

    it('should return And for M31 (Andromeda Galaxy)', () => {
      // M31: RA 10.68°, Dec 41.27°
      expect(getConstellationAbbrev(10.68, 41.27)).toBe('And');
    });

    it('should return UMa for M81', () => {
      // M81: RA 148.97°, Dec 69.07°
      expect(getConstellationAbbrev(148.97, 69.07)).toBe('UMa');
    });

    it('should return Sgr for Galactic Center area', () => {
      // Sgr A*: RA 266.42°, Dec -29.01°
      expect(getConstellationAbbrev(266.42, -29.01)).toBe('Sgr');
    });

    it('should return UMi for north celestial pole', () => {
      expect(getConstellationAbbrev(0, 89.5)).toBe('UMi');
    });

    it('should return Oct for south celestial pole', () => {
      expect(getConstellationAbbrev(0, -89.5)).toBe('Oct');
    });

    it('should return Vir for M87', () => {
      // M87: RA 187.71°, Dec 12.39°
      expect(getConstellationAbbrev(187.71, 12.39)).toBe('Vir');
    });

    it('should return Lyr for Vega area', () => {
      // Vega: RA 279.23°, Dec 38.78°
      expect(getConstellationAbbrev(279.23, 38.78)).toBe('Lyr');
    });

    it('should return Cyg for Deneb area', () => {
      // Deneb: RA 310.36°, Dec 45.28°
      expect(getConstellationAbbrev(310.36, 45.28)).toBe('Cyg');
    });
  });

  describe('getConstellationFromCoords', () => {
    it('should return full name for M31 position', () => {
      const name = getConstellationFromCoords(10.68, 41.27);
      expect(name).toBe('Andromeda');
    });

    it('should return full name for M42 position', () => {
      const name = getConstellationFromCoords(83.82, -5.39);
      expect(name).toBe('Orion');
    });

    it('should return full name for south pole', () => {
      expect(getConstellationFromCoords(0, -89.5)).toBe('Octans');
    });
  });

  describe('getConstellationFullName', () => {
    it('should return full name from abbreviation', () => {
      expect(getConstellationFullName('Ori')).toBe('Orion');
      expect(getConstellationFullName('UMa')).toBe('Ursa Major');
      expect(getConstellationFullName('CVn')).toBe('Canes Venatici');
    });

    it('should return abbreviation if not found', () => {
      expect(getConstellationFullName('XYZ')).toBe('XYZ');
    });
  });
});
