/**
 * @jest-environment node
 */
import {
  computeAlmanac,
  computeCoordinates,
  computeEphemeris,
  computeRiseTransitSet,
  searchPhenomena,
} from '../index';

describe('astronomy engine integration', () => {
  const observer = {
    latitude: 39.9042,
    longitude: 116.4074,
    elevation: 50,
  };

  it('computes coordinate systems consistently', async () => {
    const result = await computeCoordinates({
      coordinate: { ra: 10.68470833, dec: 41.26875 },
      observer,
      date: new Date('2025-01-01T12:00:00Z'),
      refraction: 'none',
    });

    expect(result.equatorial.ra).toBeGreaterThanOrEqual(0);
    expect(result.equatorial.ra).toBeLessThan(360);
    expect(result.horizontal.altitude).toBeGreaterThanOrEqual(-90);
    expect(result.horizontal.altitude).toBeLessThanOrEqual(90);
    expect(result.horizontal.azimuth).toBeGreaterThanOrEqual(0);
    expect(result.horizontal.azimuth).toBeLessThan(360);
    expect(result.meta.model.length).toBeGreaterThan(0);
  });

  it('computes ephemeris points for planets', async () => {
    const result = await computeEphemeris({
      body: 'Mars',
      observer,
      startDate: new Date('2025-01-01T00:00:00Z'),
      stepHours: 6,
      steps: 8,
      refraction: 'none',
    });

    expect(result.body).toBe('Mars');
    expect(result.points).toHaveLength(8);
    for (const point of result.points) {
      expect(point.ra).toBeGreaterThanOrEqual(0);
      expect(point.ra).toBeLessThan(360);
      expect(point.dec).toBeGreaterThanOrEqual(-90);
      expect(point.dec).toBeLessThanOrEqual(90);
    }
  });

  it('computes rise/transit/set for custom target', async () => {
    const result = await computeRiseTransitSet({
      body: 'Custom',
      observer,
      date: new Date('2025-01-01T00:00:00Z'),
      customCoordinate: { ra: 83.82208, dec: -5.39111 },
    });

    expect(result.transitAltitude).toBeGreaterThanOrEqual(-90);
    expect(result.transitAltitude).toBeLessThanOrEqual(90);
    expect(result.currentAzimuth).toBeGreaterThanOrEqual(0);
    expect(result.currentAzimuth).toBeLessThan(360);
    expect(result.darkImagingHours).toBeGreaterThanOrEqual(0);
  });

  it('searches phenomena over date range', async () => {
    const result = await searchPhenomena({
      startDate: new Date('2025-01-01T00:00:00Z'),
      endDate: new Date('2025-03-01T00:00:00Z'),
      observer,
      includeMinor: false,
    });

    expect(Array.isArray(result.events)).toBe(true);
    if (result.events.length > 1) {
      expect(result.events[0].date.getTime()).toBeLessThanOrEqual(result.events[1].date.getTime());
    }
  });

  it('computes almanac for selected date', async () => {
    const result = await computeAlmanac({
      date: new Date('2025-01-01T12:00:00Z'),
      observer,
    });

    expect(result.sun.ra).toBeGreaterThanOrEqual(0);
    expect(result.sun.ra).toBeLessThan(360);
    expect(result.moon.phase).toBeGreaterThanOrEqual(0);
    expect(result.moon.phase).toBeLessThanOrEqual(1);
    expect(result.moon.illumination).toBeGreaterThanOrEqual(0);
    expect(result.moon.illumination).toBeLessThanOrEqual(100);
    expect(result.twilight.darknessDuration).toBeGreaterThanOrEqual(0);
  });
});
