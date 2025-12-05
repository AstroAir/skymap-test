/**
 * @jest-environment node
 */
import * as time from '../index';

describe('Time Module Exports', () => {
  it('exports julian functions', () => {
    expect(time.getJulianDate).toBeDefined();
    expect(time.dateToJulianDate).toBeDefined();
    expect(time.julianDateToDate).toBeDefined();
    expect(time.utcToMJD).toBeDefined();
    expect(time.mjdToUTC).toBeDefined();
    expect(time.getJulianCenturies).toBeDefined();
    expect(time.getDaysSinceJ2000).toBeDefined();
    expect(time.getDayOfYear).toBeDefined();
  });

  it('exports sidereal functions', () => {
    expect(time.getGST).toBeDefined();
    expect(time.getGSTForDate).toBeDefined();
    expect(time.getLST).toBeDefined();
    expect(time.getLSTForDate).toBeDefined();
    expect(time.lstToHours).toBeDefined();
    expect(time.lstToDegrees).toBeDefined();
    expect(time.solarToSidereal).toBeDefined();
    expect(time.siderealToSolar).toBeDefined();
  });

  it('exports sidereal constants', () => {
    expect(time.SIDEREAL_DAY_SECONDS).toBeDefined();
    expect(time.SIDEREAL_RATIO).toBeDefined();
  });

  it('exports format functions', () => {
    expect(time.formatTime).toBeDefined();
    expect(time.formatTimeShort).toBeDefined();
    expect(time.formatTimeLong).toBeDefined();
    expect(time.formatDateForInput).toBeDefined();
    expect(time.formatTimeForInput).toBeDefined();
    expect(time.formatDateTime).toBeDefined();
    expect(time.formatDuration).toBeDefined();
    expect(time.formatDurationLong).toBeDefined();
    expect(time.getRelativeTime).toBeDefined();
    expect(time.wait).toBeDefined();
  });
});
