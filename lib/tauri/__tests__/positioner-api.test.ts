/**
 * @jest-environment jsdom
 */

const mockMoveWindow = jest.fn();
const mockMoveWindowConstrained = jest.fn();
const mockHandleIconState = jest.fn();
const mockCenterWindow = jest.fn();
const mockIsTrayPositioningReady = jest.fn();

const MockPosition = {
  TopLeft: 0,
  TopRight: 1,
  BottomLeft: 2,
  BottomRight: 3,
  TopCenter: 4,
  BottomCenter: 5,
  LeftCenter: 6,
  RightCenter: 7,
  Center: 8,
  TrayLeft: 9,
  TrayBottomLeft: 10,
  TrayRight: 11,
  TrayBottomRight: 12,
  TrayCenter: 13,
  TrayBottomCenter: 14,
} as const;

jest.mock('@/lib/storage/platform', () => ({
  isTauri: jest.fn(() => true),
}));

jest.mock('@/lib/tauri/app-control-api', () => ({
  centerWindow: (...args: unknown[]) => mockCenterWindow(...args),
  isTrayPositioningReady: (...args: unknown[]) => mockIsTrayPositioningReady(...args),
}));

jest.mock('@tauri-apps/plugin-positioner', () => ({
  Position: MockPosition,
  moveWindow: (...args: unknown[]) => mockMoveWindow(...args),
  moveWindowConstrained: (...args: unknown[]) => mockMoveWindowConstrained(...args),
  handleIconState: (...args: unknown[]) => mockHandleIconState(...args),
}));

import { isTauri } from '@/lib/storage/platform';
import {
  WINDOW_POSITION_PRESETS,
  positionerApi,
} from '../positioner-api';

const mockIsTauri = isTauri as jest.Mock;

describe('positionerApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsTauri.mockReturnValue(true);
    mockIsTrayPositioningReady.mockResolvedValue(true);
    mockMoveWindow.mockResolvedValue(undefined);
    mockMoveWindowConstrained.mockResolvedValue(undefined);
    mockHandleIconState.mockResolvedValue(undefined);
    mockCenterWindow.mockResolvedValue(undefined);
  });

  it('exposes all position presets', () => {
    expect(WINDOW_POSITION_PRESETS).toEqual([
      'TopLeft',
      'TopRight',
      'BottomLeft',
      'BottomRight',
      'TopCenter',
      'BottomCenter',
      'LeftCenter',
      'RightCenter',
      'Center',
      'TrayLeft',
      'TrayBottomLeft',
      'TrayRight',
      'TrayBottomRight',
      'TrayCenter',
      'TrayBottomCenter',
    ]);
  });

  it('uses constrained move for tray presets by default', async () => {
    await positionerApi.moveToPreset('TrayLeft');

    expect(mockMoveWindowConstrained).toHaveBeenCalledWith(MockPosition.TrayLeft);
    expect(mockMoveWindow).not.toHaveBeenCalled();
  });

  it('uses unconstrained move for screen presets by default', async () => {
    await positionerApi.moveToPreset('TopRight');

    expect(mockMoveWindow).toHaveBeenCalledWith(MockPosition.TopRight);
    expect(mockMoveWindowConstrained).not.toHaveBeenCalled();
  });

  it('returns non-fatal result in non-Tauri environment', async () => {
    mockIsTauri.mockReturnValue(false);

    const result = await positionerApi.moveToPreset('Center');

    expect(result).toEqual({
      moved: false,
      usedFallback: false,
      reason: 'not-tauri',
    });
    expect(mockMoveWindow).not.toHaveBeenCalled();
  });

  it('falls back to centerWindow when tray move fails', async () => {
    mockMoveWindowConstrained.mockRejectedValue(new Error('no tray state'));

    const result = await positionerApi.moveToPreset('TrayCenter');

    expect(mockCenterWindow).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      moved: true,
      usedFallback: true,
      reason: 'tray-fallback',
    });
  });

  it('marks tray presets unavailable when tray positioning is not ready', async () => {
    mockIsTrayPositioningReady.mockResolvedValue(false);

    await expect(positionerApi.isPresetAvailable('TrayCenter')).resolves.toBe(false);
    await expect(positionerApi.isPresetAvailable('TopRight')).resolves.toBe(true);
  });

  it('returns tray-not-ready for tray presets when tray positioning is unavailable', async () => {
    mockIsTrayPositioningReady.mockResolvedValue(false);

    const result = await positionerApi.moveToPreset('TrayCenter');

    expect(result).toEqual({
      moved: false,
      usedFallback: false,
      reason: 'tray-not-ready',
    });
    expect(mockMoveWindowConstrained).not.toHaveBeenCalled();
    expect(mockCenterWindow).not.toHaveBeenCalled();
  });
});
