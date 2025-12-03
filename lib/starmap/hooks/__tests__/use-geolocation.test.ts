/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { useGeolocation, getLocationWithFallback, type GeolocationState } from '../use-geolocation';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock navigator.geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
};

Object.defineProperty(navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

// Mock navigator.permissions
const mockPermissions = {
  query: jest.fn(),
};

Object.defineProperty(navigator, 'permissions', {
  value: mockPermissions,
  writable: true,
});

describe('useGeolocation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    mockPermissions.query.mockResolvedValue({ state: 'prompt' });
  });

  it('returns initial state', () => {
    const { result } = renderHook(() => useGeolocation());

    expect(result.current.latitude).toBeNull();
    expect(result.current.longitude).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.isSupported).toBe(true);
  });

  it('provides requestLocation function', () => {
    const { result } = renderHook(() => useGeolocation());
    expect(typeof result.current.requestLocation).toBe('function');
  });

  it('provides clearLocation function', () => {
    const { result } = renderHook(() => useGeolocation());
    expect(typeof result.current.clearLocation).toBe('function');
  });

  it('sets loading state when requesting location', async () => {
    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      // Simulate async behavior
      setTimeout(() => {
        success({
          coords: {
            latitude: 40.7128,
            longitude: -74.006,
            altitude: 10,
            accuracy: 100,
          },
          timestamp: Date.now(),
        });
      }, 100);
    });

    const { result } = renderHook(() => useGeolocation());

    act(() => {
      result.current.requestLocation();
    });

    expect(result.current.loading).toBe(true);
  });

  it('handles successful location request', async () => {
    const mockPosition = {
      coords: {
        latitude: 40.7128,
        longitude: -74.006,
        altitude: 10,
        accuracy: 100,
      },
      timestamp: Date.now(),
    };

    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success(mockPosition);
    });

    const { result } = renderHook(() => useGeolocation());

    await act(async () => {
      await result.current.requestLocation();
    });

    expect(result.current.latitude).toBe(40.7128);
    expect(result.current.longitude).toBe(-74.006);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('handles geolocation error', async () => {
    // Mock GeolocationPositionError for jsdom
    class MockGeolocationPositionError extends Error {
      code: number;
      PERMISSION_DENIED = 1;
      POSITION_UNAVAILABLE = 2;
      TIMEOUT = 3;
      constructor(code: number, message: string) {
        super(message);
        this.code = code;
        this.name = 'GeolocationPositionError';
      }
    }
    // @ts-expect-error - mock for testing
    global.GeolocationPositionError = MockGeolocationPositionError;

    const mockError = new MockGeolocationPositionError(1, 'User denied geolocation');

    mockGeolocation.getCurrentPosition.mockImplementation((_, error) => {
      error(mockError);
    });

    const { result } = renderHook(() => useGeolocation());

    await act(async () => {
      await result.current.requestLocation();
    });

    expect(result.current.error).toBe('Location permission denied');
    expect(result.current.loading).toBe(false);
  });

  it('clears location data', async () => {
    const mockPosition = {
      coords: {
        latitude: 40.7128,
        longitude: -74.006,
        altitude: 10,
        accuracy: 100,
      },
      timestamp: Date.now(),
    };

    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success(mockPosition);
    });

    const { result } = renderHook(() => useGeolocation());

    await act(async () => {
      await result.current.requestLocation();
    });

    expect(result.current.latitude).toBe(40.7128);

    act(() => {
      result.current.clearLocation();
    });

    expect(result.current.latitude).toBeNull();
    expect(result.current.longitude).toBeNull();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('user-location');
  });

  it('loads from localStorage on mount', () => {
    const storedLocation = {
      latitude: 51.5074,
      longitude: -0.1278,
      altitude: 11,
      timestamp: Date.now() - 1000, // 1 second ago
    };

    localStorageMock.getItem.mockReturnValue(JSON.stringify(storedLocation));

    const { result } = renderHook(() => useGeolocation());

    expect(result.current.latitude).toBe(51.5074);
    expect(result.current.longitude).toBe(-0.1278);
  });
});

describe('getLocationWithFallback', () => {
  it('returns provided location when available', () => {
    const state: GeolocationState = {
      latitude: 40.7128,
      longitude: -74.006,
      altitude: 10,
      accuracy: 100,
      loading: false,
      error: null,
      timestamp: Date.now(),
      permissionStatus: 'granted',
    };

    const result = getLocationWithFallback(state);

    expect(result.latitude).toBe(40.7128);
    expect(result.longitude).toBe(-74.006);
    expect(result.altitude).toBe(10);
  });

  it('returns default location when latitude is null', () => {
    const state: GeolocationState = {
      latitude: null,
      longitude: null,
      altitude: null,
      accuracy: null,
      loading: false,
      error: null,
      timestamp: null,
      permissionStatus: null,
    };

    const result = getLocationWithFallback(state);

    // Default is Beijing
    expect(result.latitude).toBe(39.9042);
    expect(result.longitude).toBe(116.4074);
    expect(result.altitude).toBe(44);
  });

  it('uses default altitude when altitude is null', () => {
    const state: GeolocationState = {
      latitude: 40.7128,
      longitude: -74.006,
      altitude: null,
      accuracy: 100,
      loading: false,
      error: null,
      timestamp: Date.now(),
      permissionStatus: 'granted',
    };

    const result = getLocationWithFallback(state);

    expect(result.latitude).toBe(40.7128);
    expect(result.longitude).toBe(-74.006);
    expect(result.altitude).toBe(44); // Default altitude
  });
});
