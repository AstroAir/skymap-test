/**
 * @jest-environment node
 */
import * as constants from '../index';

describe('Constants Module Exports', () => {
  it('exports Bortle scale data', () => {
    expect(constants.BORTLE_SCALE).toBeDefined();
    expect(constants.getBortleEntry).toBeDefined();
    expect(constants.getBortleFromSQM).toBeDefined();
    expect(constants.getBortleExposureMultiplier).toBeDefined();
  });

  it('exports sky survey data', () => {
    expect(constants.SKY_SURVEYS).toBeDefined();
    expect(constants.getSurveyById).toBeDefined();
    expect(constants.getSurveysByCategory).toBeDefined();
    expect(constants.getDefaultSurvey).toBeDefined();
  });
});
