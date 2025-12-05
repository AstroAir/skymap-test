/**
 * @jest-environment node
 */
import * as astronomy from '../index';

describe('Astronomy Module Exports', () => {
  it('re-exports from coordinates module', () => {
    // Core conversion functions
    expect(astronomy.rad2deg).toBeDefined();
    expect(astronomy.deg2rad).toBeDefined();
    expect(astronomy.hoursToDegrees).toBeDefined();
    expect(astronomy.degreesToHours).toBeDefined();
    expect(astronomy.degreesToHMS).toBeDefined();
    expect(astronomy.hmsToDegrees).toBeDefined();
    expect(astronomy.degreesToDMS).toBeDefined();
    expect(astronomy.dmsToDegrees).toBeDefined();
    
    // Format functions
    expect(astronomy.formatRA).toBeDefined();
    expect(astronomy.formatDec).toBeDefined();
    expect(astronomy.formatCoordinates).toBeDefined();
    
    // Transform functions
    expect(astronomy.raDecToAltAz).toBeDefined();
    expect(astronomy.altAzToRaDec).toBeDefined();
  });

  it('re-exports from time module', () => {
    // Julian date functions
    expect(astronomy.getJulianDate).toBeDefined();
    expect(astronomy.dateToJulianDate).toBeDefined();
    expect(astronomy.julianDateToDate).toBeDefined();
    
    // Sidereal time functions
    expect(astronomy.getGST).toBeDefined();
    expect(astronomy.getLST).toBeDefined();
    expect(astronomy.getLSTForDate).toBeDefined();
    
    // Format functions
    expect(astronomy.formatTime).toBeDefined();
    expect(astronomy.formatDuration).toBeDefined();
  });

  it('re-exports from celestial module', () => {
    // Sun functions
    expect(astronomy.getSunPosition).toBeDefined();
    expect(astronomy.getSunAltitude).toBeDefined();
    
    // Moon functions
    expect(astronomy.getMoonPhase).toBeDefined();
    expect(astronomy.getMoonPhaseName).toBeDefined();
    expect(astronomy.getMoonIllumination).toBeDefined();
    expect(astronomy.getMoonPosition).toBeDefined();
    
    // Separation functions
    expect(astronomy.angularSeparation).toBeDefined();
    expect(astronomy.getMoonDistance).toBeDefined();
  });

  it('re-exports from twilight module', () => {
    expect(astronomy.calculateTwilightTimes).toBeDefined();
    expect(astronomy.getCurrentTwilightPhase).toBeDefined();
    expect(astronomy.isDarkEnough).toBeDefined();
  });

  it('re-exports from visibility module', () => {
    expect(astronomy.calculateTargetVisibility).toBeDefined();
    expect(astronomy.isCircumpolar).toBeDefined();
    expect(astronomy.neverRises).toBeDefined();
    expect(astronomy.getMaxAltitude).toBeDefined();
  });

  it('re-exports from imaging module', () => {
    expect(astronomy.calculateExposure).toBeDefined();
    expect(astronomy.calculateTotalIntegration).toBeDefined();
    expect(astronomy.calculateImagingFeasibility).toBeDefined();
    expect(astronomy.planMultipleTargets).toBeDefined();
  });
});
