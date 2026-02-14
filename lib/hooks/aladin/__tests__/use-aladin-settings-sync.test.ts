/**
 * @jest-environment jsdom
 */
import { renderHook } from '@testing-library/react';
import { useAladinSettingsSync } from '../use-aladin-settings-sync';

// Mock settings store
const mockSettingsState = {
  stellarium: {
    projectionType: 'stereographic' as const,
    surveyId: 'P/DSS2/color',
    surveyEnabled: true,
  },
  skyEngine: 'aladin' as const,
  aladinDisplay: {
    showCooGrid: false,
    cooGridColor: 'rgb(178, 50, 178)',
    cooGridOpacity: 0.6,
    cooGridLabelSize: 12,
    showReticle: false,
    reticleColor: '#ff0000',
    reticleSize: 22,
    cooFrame: 'ICRSd',
    colormap: 'native',
    colormapReversed: false,
    brightness: 0,
    contrast: 1,
    saturation: 1,
    gamma: 1,
  },
};

jest.mock('@/lib/stores/settings-store', () => ({
  useSettingsStore: (selector: (state: typeof mockSettingsState) => unknown) =>
    selector(mockSettingsState),
}));

describe('useAladinSettingsSync', () => {
  const createMockAladin = () => ({
    setProjection: jest.fn(),
    newImageSurvey: jest.fn(() => ({ id: 'survey' })),
    setBaseImageLayer: jest.fn(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockSettingsState.stellarium.projectionType = 'stereographic';
    mockSettingsState.stellarium.surveyId = 'P/DSS2/color';
    mockSettingsState.stellarium.surveyEnabled = true;
    mockSettingsState.skyEngine = 'aladin';
  });

  it('should not call aladin APIs when engine is not ready', () => {
    const mockAladin = createMockAladin();
    renderHook(() =>
      useAladinSettingsSync(
        { current: mockAladin as never },
        false
      )
    );

    expect(mockAladin.setProjection).not.toHaveBeenCalled();
  });

  it('should not call aladin APIs when aladin ref is null', () => {
    renderHook(() =>
      useAladinSettingsSync(
        { current: null },
        true
      )
    );
    // No error thrown — graceful null handling
  });

  it('should not sync when skyEngine is stellarium', () => {
    mockSettingsState.skyEngine = 'stellarium' as 'aladin';
    const mockAladin = createMockAladin();
    renderHook(() =>
      useAladinSettingsSync(
        { current: mockAladin as never },
        true
      )
    );

    expect(mockAladin.setProjection).not.toHaveBeenCalled();
    expect(mockAladin.newImageSurvey).not.toHaveBeenCalled();
  });
});
