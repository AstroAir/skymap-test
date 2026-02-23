/**
 * Tests for use-stellarium-zoom.ts
 * FOV/zoom control for Stellarium engine
 */

import { renderHook, act } from '@testing-library/react';
import { useStellariumZoom } from '../use-stellarium-zoom';
import { useRef } from 'react';
import { fovToRad } from '@/lib/core/stellarium-canvas-utils';

describe('useStellariumZoom', () => {
  it('should return zoom control functions', () => {
    const { result } = renderHook(() => {
      const stelRef = useRef(null);
      const canvasRef = useRef<HTMLCanvasElement | null>(null);
      return useStellariumZoom({ stelRef, canvasRef });
    });
    expect(typeof result.current.zoomIn).toBe('function');
    expect(typeof result.current.zoomOut).toBe('function');
    expect(typeof result.current.setFov).toBe('function');
    expect(typeof result.current.getFov).toBe('function');
    expect(typeof result.current.setEngineFov).toBe('function');
  });

  it('should zoomIn reducing FOV', () => {
    const initialFov = fovToRad(60);
    const mockStel = {
      core: { fov: initialFov },
      zoomTo: jest.fn(),
    };
    const onFovChange = jest.fn();

    const { result } = renderHook(() => {
      const stelRef = useRef(mockStel);
      const canvasRef = useRef<HTMLCanvasElement | null>(null);
      return useStellariumZoom({ stelRef: stelRef as never, canvasRef, onFovChange });
    });

    act(() => result.current.zoomIn());
    expect(onFovChange).toHaveBeenCalled();
    const newFov = onFovChange.mock.calls[0][0];
    expect(newFov).toBeLessThan(60);
  });

  it('should zoomOut increasing FOV', () => {
    const initialFov = fovToRad(60);
    const mockStel = {
      core: { fov: initialFov },
      zoomTo: jest.fn(),
    };
    const onFovChange = jest.fn();

    const { result } = renderHook(() => {
      const stelRef = useRef(mockStel);
      const canvasRef = useRef<HTMLCanvasElement | null>(null);
      return useStellariumZoom({ stelRef: stelRef as never, canvasRef, onFovChange });
    });

    act(() => result.current.zoomOut());
    expect(onFovChange).toHaveBeenCalled();
    const newFov = onFovChange.mock.calls[0][0];
    expect(newFov).toBeGreaterThan(60);
  });

  it('should return current FOV from getFov', () => {
    const fov = fovToRad(45);
    const mockStel = { core: { fov } };

    const { result } = renderHook(() => {
      const stelRef = useRef(mockStel);
      const canvasRef = useRef<HTMLCanvasElement | null>(null);
      return useStellariumZoom({ stelRef: stelRef as never, canvasRef });
    });

    expect(result.current.getFov()).toBeCloseTo(45, 1);
  });

  it('should return null FOV when stel is null', () => {
    const { result } = renderHook(() => {
      const stelRef = useRef(null);
      const canvasRef = useRef<HTMLCanvasElement | null>(null);
      return useStellariumZoom({ stelRef, canvasRef });
    });

    // Returns DEFAULT_FOV when stel is null
    expect(result.current.getFov()).toBe(60);
  });
});
