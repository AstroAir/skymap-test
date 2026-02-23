/**
 * Tests for navigation.ts
 * Celestial reference point coordinate lookups
 */

import { getCelestialReferencePoint } from '../navigation';

describe('getCelestialReferencePoint', () => {
  it('should return NCP at RA=0, Dec=+90', () => {
    const result = getCelestialReferencePoint('NCP');
    expect(result.ra).toBe(0);
    expect(result.dec).toBe(90);
  });

  it('should return SCP at RA=0, Dec=-90', () => {
    const result = getCelestialReferencePoint('SCP');
    expect(result.ra).toBe(0);
    expect(result.dec).toBe(-90);
  });

  it('should return Vernal Equinox at RA=0, Dec=0', () => {
    const result = getCelestialReferencePoint('vernal');
    expect(result.ra).toBe(0);
    expect(result.dec).toBe(0);
  });

  it('should return Autumnal Equinox at RA=180, Dec=0', () => {
    const result = getCelestialReferencePoint('autumnal');
    expect(result.ra).toBe(180);
    expect(result.dec).toBe(0);
  });

  it('should return Zenith with Dec = latitude', () => {
    const result = getCelestialReferencePoint('zenith', 40, -74);
    expect(result.dec).toBe(40);
    // RA should be LST at given longitude
    expect(typeof result.ra).toBe('number');
  });

  it('should default latitude/longitude to 0 for zenith', () => {
    const result = getCelestialReferencePoint('zenith');
    expect(result.dec).toBe(0);
    expect(typeof result.ra).toBe('number');
  });
});
