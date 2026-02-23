/**
 * @jest-environment node
 */

import { Body, Equator, Observer, SearchMoonPhase } from 'astronomy-engine';
import { calculateTwilightTimes } from '../../twilight/calculator';
import { getLSTForDate } from '../../time/sidereal';
import { getOptimalMoonWindowForObserver } from '../separation';

describe('getOptimalMoonWindowForObserver', () => {
  it('returns a usable window when conditions are permissive', () => {
    // Beijing
    const latitude = 39.9;
    const longitude = 116.4;
    const date = new Date('2024-01-15T00:00:00Z');

    const twilight = calculateTwilightTimes(latitude, longitude, date);
    expect(twilight.astronomicalDusk).toBeInstanceOf(Date);
    expect(twilight.astronomicalDawn).toBeInstanceOf(Date);

    const darkStart = twilight.astronomicalDusk!;
    const darkEnd = twilight.astronomicalDawn!;
    const mid = new Date(Math.floor((darkStart.getTime() + darkEnd.getTime()) / 2));

    // Choose a target that transits at mid-night for the location to ensure it is above the horizon.
    const raDeg = getLSTForDate(longitude, mid);
    const decDeg = latitude;

    const result = getOptimalMoonWindowForObserver(raDeg, decDeg, latitude, longitude, date, {
      minAltitudeDeg: 0,
      baseMinMoonDistanceDeg: 1,
      minWindowMinutes: 30,
      sampleMinutes: 10,
      refineToSeconds: 60,
    });

    expect(result.hasWindow).toBe(true);
    expect(result.bestWindow).not.toBeNull();
    expect(result.bestWindow!.start.getTime()).toBeGreaterThanOrEqual(darkStart.getTime());
    expect(result.bestWindow!.end.getTime()).toBeLessThanOrEqual(darkEnd.getTime());
    expect(result.bestWindow!.end.getTime()).toBeGreaterThan(result.bestWindow!.start.getTime());
  });

  it('returns moon_always_bad when targeting the Moon during a full-moon night', () => {
    const latitude = 39.9;
    const longitude = 116.4;

    const fullMoon = SearchMoonPhase(180, new Date('2024-01-01T00:00:00Z'), 370);
    expect(fullMoon).not.toBeNull();

    const date = fullMoon!.date;
    const twilight = calculateTwilightTimes(latitude, longitude, date);
    expect(twilight.astronomicalDusk).toBeInstanceOf(Date);
    expect(twilight.astronomicalDawn).toBeInstanceOf(Date);

    const darkStart = twilight.astronomicalDusk!;
    const darkEnd = twilight.astronomicalDawn!;
    const mid = new Date(Math.floor((darkStart.getTime() + darkEnd.getTime()) / 2));

    const observer = new Observer(latitude, longitude, 0);
    const moonEq = Equator(Body.Moon, mid, observer, true, true);
    const targetRaDeg = moonEq.ra * 15;
    const targetDecDeg = moonEq.dec;

    const result = getOptimalMoonWindowForObserver(targetRaDeg, targetDecDeg, latitude, longitude, date, {
      minAltitudeDeg: 0,
      baseMinMoonDistanceDeg: 30,
      minWindowMinutes: 30,
      sampleMinutes: 10,
      refineToSeconds: 60,
    });

    expect(result.hasWindow).toBe(false);
    expect(result.diagnostics?.reasonIfNone).toBe('moon_always_bad');
  });

  it('returns no_darkness for polar-day locations', () => {
    // Tromsø, Norway (high latitude)
    const latitude = 69.6492;
    const longitude = 18.9553;
    const date = new Date('2024-06-21T00:00:00Z');

    const result = getOptimalMoonWindowForObserver(0, 0, latitude, longitude, date);
    expect(result.hasWindow).toBe(false);
    expect(result.diagnostics?.reasonIfNone).toBe('no_darkness');
  });
});

