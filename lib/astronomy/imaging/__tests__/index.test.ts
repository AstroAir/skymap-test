/**
 * @jest-environment node
 */
import * as imaging from '../index';

describe('Imaging Module Exports', () => {
  it('exports exposure functions', () => {
    expect(imaging.calculateExposure).toBeDefined();
    expect(imaging.calculateTotalIntegration).toBeDefined();
    expect(imaging.calculateSubframeCount).toBeDefined();
    expect(imaging.getImageScale).toBeDefined();
    expect(imaging.checkSampling).toBeDefined();
    expect(imaging.calculateFOV).toBeDefined();
    expect(imaging.formatExposureTime).toBeDefined();
  });

  it('exports Bortle scale data', () => {
    expect(imaging.BORTLE_SCALE).toBeDefined();
    expect(imaging.getBortleExposureMultiplier).toBeDefined();
  });

  it('exports feasibility functions', () => {
    expect(imaging.calculateImagingFeasibility).toBeDefined();
    expect(imaging.shouldImage).toBeDefined();
    expect(imaging.rankTargets).toBeDefined();
  });

  it('exports planning functions', () => {
    expect(imaging.planMultipleTargets).toBeDefined();
    expect(imaging.optimizeTargetOrder).toBeDefined();
    expect(imaging.estimateSlewTime).toBeDefined();
  });
});
