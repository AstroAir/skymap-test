/**
 * Tests for mount-store.ts
 */

import { renderHook, act } from '@testing-library/react';
import { useMountStore } from '../mount-store';

describe('useMountStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useMountStore());
    act(() => {
      result.current.setMountConnected(false);
      result.current.setMountCoordinates(0, 0);
      result.current.setSequenceRunning(false);
      result.current.setCurrentTab('showSlew');
    });
  });

  describe('initial state', () => {
    it('should have mountInfo with Connected false', () => {
      const { result } = renderHook(() => useMountStore());
      expect(result.current.mountInfo.Connected).toBe(false);
    });

    it('should have default coordinates', () => {
      const { result } = renderHook(() => useMountStore());
      expect(result.current.mountInfo.Coordinates).toBeDefined();
    });

    it('should have sequenceRunning as false', () => {
      const { result } = renderHook(() => useMountStore());
      expect(result.current.sequenceRunning).toBe(false);
    });

    it('should have default currentTab', () => {
      const { result } = renderHook(() => useMountStore());
      expect(result.current.currentTab).toBe('showSlew');
    });
  });

  describe('setMountConnected', () => {
    it('should update mount connected status', () => {
      const { result } = renderHook(() => useMountStore());
      act(() => {
        result.current.setMountConnected(true);
      });
      expect(result.current.mountInfo.Connected).toBe(true);
    });

    it('should set connected to false', () => {
      const { result } = renderHook(() => useMountStore());
      act(() => {
        result.current.setMountConnected(true);
        result.current.setMountConnected(false);
      });
      expect(result.current.mountInfo.Connected).toBe(false);
    });
  });

  describe('setMountCoordinates', () => {
    it('should update RA and Dec', () => {
      const { result } = renderHook(() => useMountStore());
      act(() => {
        result.current.setMountCoordinates(180, 45);
      });
      expect(result.current.mountInfo.Coordinates?.RADegrees).toBe(180);
      expect(result.current.mountInfo.Coordinates?.Dec).toBe(45);
    });

    it('should handle negative declination', () => {
      const { result } = renderHook(() => useMountStore());
      act(() => {
        result.current.setMountCoordinates(90, -30);
      });
      expect(result.current.mountInfo.Coordinates?.Dec).toBe(-30);
    });
  });

  describe('setMountInfo', () => {
    it('should update partial mount info', () => {
      const { result } = renderHook(() => useMountStore());
      act(() => {
        result.current.setMountInfo({ Connected: true });
      });
      expect(result.current.mountInfo.Connected).toBe(true);
    });
  });

  describe('setProfileInfo', () => {
    it('should update profile info', () => {
      const { result } = renderHook(() => useMountStore());
      act(() => {
        result.current.setProfileInfo({
          AstrometrySettings: { Latitude: 45, Longitude: -75, Elevation: 100 },
        });
      });
      expect(result.current.profileInfo.AstrometrySettings?.Latitude).toBe(45);
    });
  });

  describe('setSequenceRunning', () => {
    it('should update sequence running status', () => {
      const { result } = renderHook(() => useMountStore());
      act(() => {
        result.current.setSequenceRunning(true);
      });
      expect(result.current.sequenceRunning).toBe(true);
    });
  });

  describe('setCurrentTab', () => {
    it('should update current tab', () => {
      const { result } = renderHook(() => useMountStore());
      act(() => {
        result.current.setCurrentTab('settings');
      });
      expect(result.current.currentTab).toBe('settings');
    });
  });

  describe('safetyConfig', () => {
    it('should have default safety config', () => {
      const { result } = renderHook(() => useMountStore());
      expect(result.current.safetyConfig).toBeDefined();
      expect(result.current.safetyConfig.mountType).toBe('gem');
      expect(result.current.safetyConfig.minAltitude).toBe(15);
      expect(result.current.safetyConfig.meridianFlip.enabled).toBe(true);
    });

    it('should update safety config partially', () => {
      const { result } = renderHook(() => useMountStore());
      act(() => {
        result.current.setSafetyConfig({ minAltitude: 25, mountType: 'fork' });
      });
      expect(result.current.safetyConfig.minAltitude).toBe(25);
      expect(result.current.safetyConfig.mountType).toBe('fork');
      // Other fields should remain at defaults
      expect(result.current.safetyConfig.hourAngleLimitEast).toBe(-90);
    });

    it('should update meridian flip config partially', () => {
      const { result } = renderHook(() => useMountStore());
      act(() => {
        result.current.setSafetyConfig({
          meridianFlip: { enabled: true, minutesAfterMeridian: 10, maxMinutesAfterMeridian: 20, pauseBeforeMeridian: 3 },
        });
      });
      expect(result.current.safetyConfig.meridianFlip.minutesAfterMeridian).toBe(10);
      expect(result.current.safetyConfig.meridianFlip.maxMinutesAfterMeridian).toBe(20);
      expect(result.current.safetyConfig.meridianFlip.pauseBeforeMeridian).toBe(3);
    });

    it('should reset safety config to defaults', () => {
      const { result } = renderHook(() => useMountStore());
      act(() => {
        result.current.setSafetyConfig({ minAltitude: 50, mountType: 'altaz' });
      });
      expect(result.current.safetyConfig.minAltitude).toBe(50);
      act(() => {
        result.current.resetSafetyConfig();
      });
      expect(result.current.safetyConfig.minAltitude).toBe(15);
      expect(result.current.safetyConfig.mountType).toBe('gem');
    });
  });
});
