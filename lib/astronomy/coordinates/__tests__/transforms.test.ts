/**
 * @jest-environment node
 */
import {
  altAzToRaDecAtTime,
  eclipticToRaDec,
  galacticToRaDec,
  getHourAngleAtTime,
  raDecToAltAzAtTime,
  raDecToEcliptic,
  raDecToGalactic,
} from '../transforms';
import { getLSTForDate } from '../../time/sidereal';

const ARCSEC_IN_DEGREES = 1 / 3600;

function angularDifferenceDegrees(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

describe('Coordinate transforms', () => {
  it('converts M31 equatorial coordinates to galactic within 1 arcsec', () => {
    const m31 = { ra: 10.68470833, dec: 41.26875 };
    const galactic = raDecToGalactic(m31.ra, m31.dec);

    expect(angularDifferenceDegrees(galactic.l, 121.1743221)).toBeLessThan(ARCSEC_IN_DEGREES);
    expect(Math.abs(galactic.b - -21.5733112)).toBeLessThan(ARCSEC_IN_DEGREES);
  });

  it('converts galactic back to equatorial within 1 arcsec', () => {
    const raDec = galacticToRaDec(121.1743221, -21.5733112);
    expect(angularDifferenceDegrees(raDec.ra, 10.68470833)).toBeLessThan(ARCSEC_IN_DEGREES);
    expect(Math.abs(raDec.dec - 41.26875)).toBeLessThan(ARCSEC_IN_DEGREES);
  });

  it('keeps equatorial↔ecliptic round-trip error below 1 arcsec', () => {
    const date = new Date('2025-03-20T00:00:00Z');
    const input = { ra: 83.82208, dec: -5.39111 };
    const ecliptic = raDecToEcliptic(input.ra, input.dec, date);
    const roundtrip = eclipticToRaDec(ecliptic.longitude, ecliptic.latitude, date);

    expect(angularDifferenceDegrees(roundtrip.ra, input.ra)).toBeLessThan(ARCSEC_IN_DEGREES);
    expect(Math.abs(roundtrip.dec - input.dec)).toBeLessThan(ARCSEC_IN_DEGREES);
  });

  it('returns valid horizontal coordinate ranges', () => {
    const horizontal = raDecToAltAzAtTime(
      83.6331,
      22.0145,
      39.9042,
      116.4074,
      new Date('2025-01-01T00:00:00Z')
    );

    expect(horizontal.altitude).toBeGreaterThanOrEqual(-90);
    expect(horizontal.altitude).toBeLessThanOrEqual(90);
    expect(horizontal.azimuth).toBeGreaterThanOrEqual(0);
    expect(horizontal.azimuth).toBeLessThan(360);
  });

  it('roughly round-trips between equatorial and horizontal at time', () => {
    const date = new Date('2025-06-01T04:00:00Z');
    const original = { ra: 201.2983, dec: -11.1614 };
    const horizontal = raDecToAltAzAtTime(original.ra, original.dec, 34.0522, -118.2437, date);
    const recovered = altAzToRaDecAtTime(horizontal.altitude, horizontal.azimuth, 34.0522, -118.2437, date);

    expect(angularDifferenceDegrees(recovered.ra, original.ra)).toBeLessThan(0.2);
    expect(Math.abs(recovered.dec - original.dec)).toBeLessThan(0.2);
  });

  it('computes hour angle from LST consistently', () => {
    const date = new Date('2025-06-01T04:00:00Z');
    const longitude = -118.2437;
    const lst = getLSTForDate(longitude, date);
    const hourAngle = getHourAngleAtTime(lst, longitude, date);

    expect(Math.abs(hourAngle)).toBeLessThan(0.001);
  });
});
