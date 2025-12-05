/**
 * @jest-environment node
 */
import * as catalogs from '../index';

describe('Catalogs Module Exports', () => {
  it('exports type constants', () => {
    expect(catalogs.MOON_PHASE_NAMES).toBeDefined();
    expect(catalogs.CONSTELLATIONS).toBeDefined();
    expect(catalogs.CONSTELLATION_NAMES).toBeDefined();
    expect(catalogs.DSO_TYPE_LABELS).toBeDefined();
    expect(catalogs.DEFAULT_FILTER_PRESETS).toBeDefined();
  });

  it('exports deep sky object functions', () => {
    expect(catalogs.calculateAltitudeData).toBeDefined();
    expect(catalogs.calculateTransitTime).toBeDefined();
    expect(catalogs.doesTransitSouth).toBeDefined();
    expect(catalogs.calculateMoonDistance).toBeDefined();
    expect(catalogs.isAboveAltitudeForDuration).toBeDefined();
    expect(catalogs.calculateImagingScore).toBeDefined();
    expect(catalogs.enrichDeepSkyObject).toBeDefined();
    expect(catalogs.enrichDeepSkyObjects).toBeDefined();
  });
});
