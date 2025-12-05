/**
 * @jest-environment node
 */
import * as twilight from '../index';

describe('Twilight Module Exports', () => {
  it('exports calculator functions', () => {
    expect(twilight.calculateHourAngle).toBeDefined();
    expect(twilight.calculateTwilightTimes).toBeDefined();
    expect(twilight.getCurrentTwilightPhase).toBeDefined();
    expect(twilight.isDarkEnough).toBeDefined();
    expect(twilight.getTimeUntilDarkness).toBeDefined();
  });

  it('exports constants', () => {
    expect(twilight.TWILIGHT_THRESHOLDS).toBeDefined();
  });
});
