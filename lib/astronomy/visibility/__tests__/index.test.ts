/**
 * @jest-environment node
 */
import * as visibility from '../index';

describe('Visibility Module Exports', () => {
  it('exports altitude functions', () => {
    expect(visibility.getAltitudeAtTime).toBeDefined();
    expect(visibility.getAltitudeOverTime).toBeDefined();
    expect(visibility.getMaxAltitude).toBeDefined();
    expect(visibility.getMinAltitude).toBeDefined();
    expect(visibility.getTimeAtAltitude).toBeDefined();
  });

  it('exports target functions', () => {
    expect(visibility.calculateTargetVisibility).toBeDefined();
    expect(visibility.getTransitTime).toBeDefined();
  });

  it('exports circumpolar functions', () => {
    expect(visibility.isCircumpolar).toBeDefined();
    expect(visibility.neverRises).toBeDefined();
    expect(visibility.isAlwaysAbove).toBeDefined();
    expect(visibility.canReachAltitude).toBeDefined();
    expect(visibility.isVisible).toBeDefined();
    expect(visibility.getVisibilityClass).toBeDefined();
    expect(visibility.getHoursAboveHorizon).toBeDefined();
    expect(visibility.getHoursAboveAltitude).toBeDefined();
  });
});
