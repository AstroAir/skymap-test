/**
 * @jest-environment node
 */
import * as coordinates from '../index';

describe('Coordinates Module Exports', () => {
  it('exports conversions functions', () => {
    expect(coordinates.rad2deg).toBeDefined();
    expect(coordinates.deg2rad).toBeDefined();
    expect(coordinates.hoursToDegrees).toBeDefined();
    expect(coordinates.degreesToHours).toBeDefined();
    expect(coordinates.degreesToHMS).toBeDefined();
    expect(coordinates.hmsToDegrees).toBeDefined();
    expect(coordinates.degreesToDMS).toBeDefined();
    expect(coordinates.dmsToDegrees).toBeDefined();
    expect(coordinates.parseCoordinateString).toBeDefined();
  });

  it('exports formats functions', () => {
    expect(coordinates.formatRA).toBeDefined();
    expect(coordinates.formatDec).toBeDefined();
    expect(coordinates.formatCoordinates).toBeDefined();
    expect(coordinates.formatAltitude).toBeDefined();
    expect(coordinates.formatAzimuth).toBeDefined();
    expect(coordinates.getCardinalDirection).toBeDefined();
    expect(coordinates.formatAzimuthWithDirection).toBeDefined();
    expect(coordinates.formatAngularSize).toBeDefined();
    expect(coordinates.formatSeparation).toBeDefined();
  });

  it('exports transforms functions', () => {
    expect(coordinates.raDecToAltAz).toBeDefined();
    expect(coordinates.raDecToAltAzAtTime).toBeDefined();
    expect(coordinates.altAzToRaDec).toBeDefined();
    expect(coordinates.getHourAngle).toBeDefined();
    expect(coordinates.getHourAngleAtTime).toBeDefined();
  });

  it('all exports are functions', () => {
    const exports = Object.values(coordinates);
    for (const exp of exports) {
      expect(typeof exp).toBe('function');
    }
  });
});
