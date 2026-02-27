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
    expect(constants.getBortleQualityMultiplier).toBeDefined();
    expect(constants.getBortleMinimumMultiplier).toBeDefined();
  });

  it('exports sky survey data', () => {
    expect(constants.SKY_SURVEYS).toBeDefined();
    expect(constants.getSurveyById).toBeDefined();
    expect(constants.getSurveysByCategory).toBeDefined();
    expect(constants.getDefaultSurvey).toBeDefined();
  });

  it('exports FOV constants', () => {
    expect(constants.MIN_FOV).toBeDefined();
    expect(constants.MAX_FOV).toBeDefined();
    expect(constants.DEFAULT_FOV).toBeDefined();
    expect(constants.ZOOM_PRESETS).toBeDefined();
  });

  it('exports Stellarium canvas constants', () => {
    expect(constants.SCRIPT_LOAD_TIMEOUT).toBeDefined();
    expect(constants.WASM_INIT_TIMEOUT).toBeDefined();
    expect(constants.MAX_RETRY_COUNT).toBeDefined();
    expect(constants.SCRIPT_PATH).toBeDefined();
    expect(constants.WASM_PATH).toBeDefined();
  });

  it('exports mount constants', () => {
    expect(constants.MOUNT_CIRCLE_COLOR).toBeDefined();
    expect(constants.MOUNT_CIRCLE_BORDER).toBeDefined();
    expect(constants.MOUNT_CIRCLE_SIZE).toBeDefined();
    expect(constants.MOUNT_LAYER_Z).toBeDefined();
  });

  it('exports planning constants', () => {
    expect(constants.COMMON_FILTERS).toBeDefined();
    expect(constants.BINNING_OPTIONS).toBeDefined();
    expect(constants.IMAGE_TYPES).toBeDefined();
    expect(constants.FILTER_SEQUENCE_PRESETS).toBeDefined();
  });

  it('exports planning style functions', () => {
    expect(constants.getSkyConditionColor).toBeDefined();
    expect(constants.getFeasibilityColor).toBeDefined();
    expect(constants.getStatusColor).toBeDefined();
    expect(constants.getPriorityColor).toBeDefined();
    expect(constants.getScoreBadgeVariant).toBeDefined();
    expect(constants.formatPlanningTime).toBeDefined();
    expect(constants.formatCountdown).toBeDefined();
  });

  it('exports search constants', () => {
    expect(constants.ALL_OBJECT_TYPES).toBeDefined();
    expect(constants.CATALOG_PRESETS).toBeDefined();
    expect(constants.SOURCE_COLOR_MAP).toBeDefined();
  });
});
