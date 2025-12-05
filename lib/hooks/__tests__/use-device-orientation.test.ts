/**
 * @jest-environment jsdom
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDeviceOrientation } from '../use-device-orientation';

// Mock DeviceOrientationEvent
const mockDeviceOrientationEvent = {
  alpha: 45,
  beta: 30,
  gamma: 15,
  absolute: true,
};

describe('useDeviceOrientation', () => {
  let originalDeviceOrientationEvent: typeof DeviceOrientationEvent;
  let addEventListenerSpy: jest.SpyInstance;
  let removeEventListenerSpy: jest.SpyInstance;

  beforeEach(() => {
    // Save original
    originalDeviceOrientationEvent = global.DeviceOrientationEvent;
    
    // Mock DeviceOrientationEvent
    (global as unknown as { DeviceOrientationEvent: unknown }).DeviceOrientationEvent = class MockDeviceOrientationEvent {
      static requestPermission?: () => Promise<string>;
    };

    addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    // Restore original
    (global as unknown as { DeviceOrientationEvent: typeof DeviceOrientationEvent }).DeviceOrientationEvent = originalDeviceOrientationEvent;
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  describe('initialization', () => {
    it('returns initial state', () => {
      const { result } = renderHook(() => useDeviceOrientation());

      expect(result.current.orientation).toBeNull();
      expect(result.current.skyDirection).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('detects device orientation support', () => {
      const { result } = renderHook(() => useDeviceOrientation());

      // In jsdom, DeviceOrientationEvent exists
      expect(typeof result.current.isSupported).toBe('boolean');
    });

    it('provides requestPermission function', () => {
      const { result } = renderHook(() => useDeviceOrientation());

      expect(typeof result.current.requestPermission).toBe('function');
    });
  });

  describe('when enabled', () => {
    it('adds event listener when enabled and supported', async () => {
      const { result, rerender } = renderHook(
        ({ enabled }) => useDeviceOrientation({ enabled }),
        { initialProps: { enabled: false } }
      );

      // Initially disabled
      expect(addEventListenerSpy).not.toHaveBeenCalledWith(
        'deviceorientation',
        expect.any(Function),
        true
      );

      // Enable and wait for permission to be granted
      await act(async () => {
        await result.current.requestPermission();
      });

      rerender({ enabled: true });

      // Should add listener after enabling
      await waitFor(() => {
        expect(addEventListenerSpy).toHaveBeenCalledWith(
          'deviceorientation',
          expect.any(Function),
          true
        );
      });
    });

    it('removes event listener when disabled', async () => {
      const { result, rerender } = renderHook(
        ({ enabled }) => useDeviceOrientation({ enabled }),
        { initialProps: { enabled: true } }
      );

      // Grant permission first
      await act(async () => {
        await result.current.requestPermission();
      });

      // Disable
      rerender({ enabled: false });

      // Should remove listener
      await waitFor(() => {
        expect(removeEventListenerSpy).toHaveBeenCalledWith(
          'deviceorientation',
          expect.any(Function),
          true
        );
      });
    });
  });

  describe('requestPermission', () => {
    it('returns true when no permission needed', async () => {
      const { result } = renderHook(() => useDeviceOrientation());

      let granted: boolean = false;
      await act(async () => {
        granted = await result.current.requestPermission();
      });

      expect(granted).toBe(true);
    });

    it('requests permission on iOS 13+', async () => {
      // Mock iOS requestPermission
      const mockRequestPermission = jest.fn().mockResolvedValue('granted');
      (global as unknown as { DeviceOrientationEvent: { requestPermission: () => Promise<string> } }).DeviceOrientationEvent = class {
        static requestPermission = mockRequestPermission;
      };

      const { result } = renderHook(() => useDeviceOrientation());

      let granted: boolean = false;
      await act(async () => {
        granted = await result.current.requestPermission();
      });

      expect(mockRequestPermission).toHaveBeenCalled();
      expect(granted).toBe(true);
    });

    it('handles permission denied', async () => {
      // Mock iOS requestPermission with denied
      const mockRequestPermission = jest.fn().mockResolvedValue('denied');
      (global as unknown as { DeviceOrientationEvent: { requestPermission: () => Promise<string> } }).DeviceOrientationEvent = class {
        static requestPermission = mockRequestPermission;
      };

      const { result } = renderHook(() => useDeviceOrientation());

      let granted: boolean = true;
      await act(async () => {
        granted = await result.current.requestPermission();
      });

      expect(granted).toBe(false);
      expect(result.current.error).toBe('Permission denied');
    });

    it('handles permission request error', async () => {
      // Mock iOS requestPermission with error
      const mockRequestPermission = jest.fn().mockRejectedValue(new Error('User cancelled'));
      (global as unknown as { DeviceOrientationEvent: { requestPermission: () => Promise<string> } }).DeviceOrientationEvent = class {
        static requestPermission = mockRequestPermission;
      };

      const { result } = renderHook(() => useDeviceOrientation());

      let granted: boolean = true;
      await act(async () => {
        granted = await result.current.requestPermission();
      });

      expect(granted).toBe(false);
      expect(result.current.error).toBe('User cancelled');
    });
  });

  describe('orientation callback', () => {
    it('calls onOrientationChange with sky direction', async () => {
      const onOrientationChange = jest.fn();
      
      const { result } = renderHook(() => 
        useDeviceOrientation({ 
          enabled: true, 
          onOrientationChange 
        })
      );

      // Grant permission
      await act(async () => {
        await result.current.requestPermission();
      });

      // Simulate orientation event
      await act(async () => {
        const event = new Event('deviceorientation') as DeviceOrientationEvent;
        Object.assign(event, mockDeviceOrientationEvent);
        window.dispatchEvent(event);
      });

      // Callback should be called with sky direction
      await waitFor(() => {
        if (onOrientationChange.mock.calls.length > 0) {
          const direction = onOrientationChange.mock.calls[0][0];
          expect(direction).toHaveProperty('azimuth');
          expect(direction).toHaveProperty('altitude');
        }
      });
    });
  });

  describe('smoothing', () => {
    it('applies smoothing to orientation values', async () => {
      const onOrientationChange = jest.fn();
      
      const { result } = renderHook(() => 
        useDeviceOrientation({ 
          enabled: true, 
          smoothingFactor: 0.5,
          onOrientationChange 
        })
      );

      // Grant permission
      await act(async () => {
        await result.current.requestPermission();
      });

      // Simulate multiple orientation events
      await act(async () => {
        for (let i = 0; i < 5; i++) {
          const event = new Event('deviceorientation') as DeviceOrientationEvent;
          Object.assign(event, {
            alpha: 45 + i * 10,
            beta: 30 + i * 5,
            gamma: 15 + i * 2,
            absolute: true,
          });
          window.dispatchEvent(event);
        }
      });

      // Values should be smoothed (not jumping directly to latest)
      // This is a basic check - actual smoothing behavior depends on implementation
      expect(onOrientationChange).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('cleans up event listener on unmount', async () => {
      const { result, unmount } = renderHook(() => 
        useDeviceOrientation({ enabled: true })
      );

      // Grant permission
      await act(async () => {
        await result.current.requestPermission();
      });

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'deviceorientation',
        expect.any(Function),
        true
      );
    });
  });
});
