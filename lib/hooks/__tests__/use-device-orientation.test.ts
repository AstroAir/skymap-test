/**
 * @jest-environment jsdom
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { altAzToRaDec } from '@/lib/astronomy/coordinates/transforms';
import { useDeviceOrientation } from '../use-device-orientation';

type RequestPermissionFn = jest.Mock<Promise<string>, [boolean?]>;

function createOrientationEvent(
  type: string,
  payload: Partial<DeviceOrientationEvent> & {
    webkitCompassHeading?: number;
    webkitCompassAccuracy?: number;
  } = {}
): DeviceOrientationEvent {
  const event = new Event(type) as DeviceOrientationEvent & {
    webkitCompassHeading?: number;
    webkitCompassAccuracy?: number;
  };
  Object.assign(event, payload);
  return event;
}

describe('useDeviceOrientation', () => {
  let originalDeviceOrientationEvent: unknown;
  let originalScreenOrientation: ScreenOrientation | undefined;
  let requestPermissionMock: RequestPermissionFn;
  let rafSpy: jest.SpyInstance;
  let cafSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    originalDeviceOrientationEvent = (global as unknown as { DeviceOrientationEvent?: unknown }).DeviceOrientationEvent;
    originalScreenOrientation = window.screen.orientation;

    requestPermissionMock = jest.fn().mockResolvedValue('granted');
    (global as unknown as { DeviceOrientationEvent: unknown }).DeviceOrientationEvent = class {
      static requestPermission = requestPermissionMock;
    };

    Object.defineProperty(window.screen, 'orientation', {
      configurable: true,
      value: {
        angle: 0,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      },
    });

    rafSpy = jest.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      return window.setTimeout(() => callback(performance.now()), 0);
    });
    cafSpy = jest.spyOn(window, 'cancelAnimationFrame').mockImplementation((handle) => {
      clearTimeout(handle);
    });
  });

  afterEach(() => {
    (global as unknown as { DeviceOrientationEvent?: unknown }).DeviceOrientationEvent = originalDeviceOrientationEvent;
    Object.defineProperty(window.screen, 'orientation', {
      configurable: true,
      value: originalScreenOrientation,
    });
    rafSpy.mockRestore();
    cafSpy.mockRestore();
  });

  it('returns the extended initial state shape', async () => {
    const { result } = renderHook(() => useDeviceOrientation());

    await waitFor(() => {
      expect(typeof result.current.isSupported).toBe('boolean');
    });

    expect(result.current.orientation).toBeNull();
    expect(result.current.skyDirection).toBeNull();
    expect(result.current.status).toBeDefined();
    expect(result.current.source).toBe('none');
    expect(result.current.accuracyDeg).toBeNull();
    expect(result.current.calibration.required).toBe(true);
  });

  it('requests permission with absolute preference first', async () => {
    const { result } = renderHook(() => useDeviceOrientation());

    await act(async () => {
      await result.current.requestPermission();
    });

    expect(requestPermissionMock).toHaveBeenCalled();
    expect(requestPermissionMock.mock.calls[0][0]).toBe(true);
    expect(result.current.isPermissionGranted).toBe(true);
  });

  it('handles denied permission and reports status', async () => {
    requestPermissionMock.mockResolvedValueOnce('denied');
    requestPermissionMock.mockResolvedValueOnce('denied');

    const { result } = renderHook(() => useDeviceOrientation({ enabled: true }));

    await act(async () => {
      await result.current.requestPermission();
    });

    expect(result.current.isPermissionGranted).toBe(false);
    expect(result.current.status).toBe('permission-denied');
  });

  it('prioritizes deviceorientationabsolute source and emits active status', async () => {
    const onOrientationChange = jest.fn();
    const { result } = renderHook(() =>
      useDeviceOrientation({
        enabled: true,
        smoothingFactor: 1,
        calibration: {
          azimuthOffsetDeg: 0,
          altitudeOffsetDeg: 0,
          required: false,
          updatedAt: null,
        },
        onOrientationChange,
      })
    );

    await act(async () => {
      await result.current.requestPermission();
    });

    await act(async () => {
      window.dispatchEvent(
        createOrientationEvent('deviceorientationabsolute', {
          alpha: 45,
          beta: 30,
          gamma: 15,
          absolute: true,
        })
      );
    });

    await waitFor(() => {
      expect(onOrientationChange).toHaveBeenCalled();
      expect(result.current.source).toBe('deviceorientationabsolute');
      expect(result.current.status).toBe('active');
    });
  });

  it('uses webkit compass heading fallback when available', async () => {
    const { result } = renderHook(() =>
      useDeviceOrientation({
        enabled: true,
        useCompassHeading: true,
        calibration: {
          azimuthOffsetDeg: 0,
          altitudeOffsetDeg: 0,
          required: false,
          updatedAt: null,
        },
      })
    );

    await act(async () => {
      await result.current.requestPermission();
    });

    await act(async () => {
      window.dispatchEvent(
        createOrientationEvent('deviceorientation', {
          alpha: 120,
          beta: 45,
          gamma: 5,
          absolute: false,
          webkitCompassHeading: 12,
          webkitCompassAccuracy: 6,
        })
      );
    });

    await waitFor(() => {
      expect(result.current.source).toBe('webkitCompassHeading');
      expect(result.current.accuracyDeg).toBe(6);
      expect(result.current.skyDirection).not.toBeNull();
    });
  });

  it('compensates screen orientation changes', async () => {
    const directions: Array<{ azimuth: number; altitude: number }> = [];
    const { result } = renderHook(() =>
      useDeviceOrientation({
        enabled: true,
        smoothingFactor: 1,
        calibration: {
          azimuthOffsetDeg: 0,
          altitudeOffsetDeg: 0,
          required: false,
          updatedAt: null,
        },
        onOrientationChange: (direction) => directions.push(direction),
      })
    );

    await act(async () => {
      await result.current.requestPermission();
    });

    await act(async () => {
      window.dispatchEvent(
        createOrientationEvent('deviceorientation', {
          alpha: 0,
          beta: 90,
          gamma: 0,
          absolute: false,
        })
      );
    });

    await waitFor(() => {
      expect(directions.length).toBeGreaterThan(0);
    });
    const first = directions[directions.length - 1];

    Object.defineProperty(window.screen, 'orientation', {
      configurable: true,
      value: {
        angle: 90,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      },
    });

    await act(async () => {
      window.dispatchEvent(new Event('orientationchange'));
      window.dispatchEvent(
        createOrientationEvent('deviceorientation', {
          alpha: 0,
          beta: 90,
          gamma: 0,
          absolute: false,
        })
      );
    });

    await waitFor(() => {
      expect(directions.length).toBeGreaterThan(1);
    });
    const second = directions[directions.length - 1];
    expect(Math.round(first.azimuth)).toBe(0);
    expect(Math.round(second.azimuth)).toBe(90);
  });

  it('applies deadband to suppress tiny changes', async () => {
    const onOrientationChange = jest.fn();
    const { result } = renderHook(() =>
      useDeviceOrientation({
        enabled: true,
        deadbandDeg: 1.0,
        smoothingFactor: 1,
        calibration: {
          azimuthOffsetDeg: 0,
          altitudeOffsetDeg: 0,
          required: false,
          updatedAt: null,
        },
        onOrientationChange,
      })
    );

    await act(async () => {
      await result.current.requestPermission();
    });

    await act(async () => {
      window.dispatchEvent(
        createOrientationEvent('deviceorientation', {
          alpha: 20,
          beta: 60,
          gamma: 3,
          absolute: false,
        })
      );
      window.dispatchEvent(
        createOrientationEvent('deviceorientation', {
          alpha: 20.2,
          beta: 60.1,
          gamma: 3,
          absolute: false,
        })
      );
    });

    await waitFor(() => {
      expect(onOrientationChange).toHaveBeenCalledTimes(1);
    });
  });

  it('updates calibration from current view reference', async () => {
    const { result } = renderHook(() =>
      useDeviceOrientation({
        enabled: true,
        calibration: {
          azimuthOffsetDeg: 0,
          altitudeOffsetDeg: 0,
          required: true,
          updatedAt: null,
        },
      })
    );

    await act(async () => {
      await result.current.requestPermission();
    });

    await act(async () => {
      window.dispatchEvent(
        createOrientationEvent('deviceorientation', {
          alpha: 90,
          beta: 40,
          gamma: 10,
          absolute: false,
        })
      );
    });

    const latitude = 35;
    const longitude = 120;
    const measured = result.current.skyDirection ?? { altitude: 45, azimuth: 180 };
    const { ra, dec } = altAzToRaDec(measured.altitude, measured.azimuth, latitude, longitude);

    await act(async () => {
      result.current.calibrateToCurrentView({
        raDeg: ra,
        decDeg: dec,
        latitude,
        longitude,
        at: new Date(),
      });
    });

    expect(result.current.calibration.required).toBe(false);
    expect(Number.isFinite(result.current.calibration.azimuthOffsetDeg)).toBe(true);
    expect(Number.isFinite(result.current.calibration.altitudeOffsetDeg)).toBe(true);
    expect(result.current.calibration.updatedAt).not.toBeNull();
  });
});
