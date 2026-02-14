import { renderHook, act } from '@testing-library/react';
import { useEquipmentFOVRead, useEquipmentFOVProps } from '../use-equipment-fov-props';
import { useEquipmentStore } from '@/lib/stores';

// Mock zustand storage
jest.mock('@/lib/storage', () => ({
  getZustandStorage: jest.fn(() => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  })),
}));

describe('useEquipmentFOVRead', () => {
  it('returns current FOV-related read values from equipment store', () => {
    const { result } = renderHook(() => useEquipmentFOVRead());

    expect(result.current).toHaveProperty('fovSimEnabled');
    expect(result.current).toHaveProperty('sensorWidth');
    expect(result.current).toHaveProperty('sensorHeight');
    expect(result.current).toHaveProperty('focalLength');
    expect(result.current).toHaveProperty('mosaic');
    expect(result.current).toHaveProperty('gridType');
  });

  it('reflects store default values', () => {
    const { result } = renderHook(() => useEquipmentFOVRead());
    const storeState = useEquipmentStore.getState();

    expect(result.current.fovSimEnabled).toBe(storeState.fovDisplay.enabled);
    expect(result.current.sensorWidth).toBe(storeState.sensorWidth);
    expect(result.current.sensorHeight).toBe(storeState.sensorHeight);
    expect(result.current.focalLength).toBe(storeState.focalLength);
    expect(result.current.gridType).toBe(storeState.fovDisplay.gridType);
  });

  it('updates when store values change', () => {
    const { result } = renderHook(() => useEquipmentFOVRead());

    act(() => {
      useEquipmentStore.getState().setSensorWidth(100);
    });

    expect(result.current.sensorWidth).toBe(100);
  });
});

describe('useEquipmentFOVProps', () => {
  it('returns all read and write props', () => {
    const { result } = renderHook(() => useEquipmentFOVProps());

    // Read props
    expect(result.current).toHaveProperty('fovSimEnabled');
    expect(result.current).toHaveProperty('sensorWidth');
    expect(result.current).toHaveProperty('sensorHeight');
    expect(result.current).toHaveProperty('focalLength');
    expect(result.current).toHaveProperty('mosaic');
    expect(result.current).toHaveProperty('gridType');

    // Write props
    expect(typeof result.current.setFovSimEnabled).toBe('function');
    expect(typeof result.current.setSensorWidth).toBe('function');
    expect(typeof result.current.setSensorHeight).toBe('function');
    expect(typeof result.current.setFocalLength).toBe('function');
    expect(typeof result.current.setMosaic).toBe('function');
    expect(typeof result.current.setGridType).toBe('function');
    expect(typeof result.current.setRotationAngle).toBe('function');
  });

  it('setters update the store', () => {
    const { result } = renderHook(() => useEquipmentFOVProps());

    act(() => {
      result.current.setSensorWidth(200);
      result.current.setSensorHeight(150);
      result.current.setFocalLength(500);
    });

    expect(result.current.sensorWidth).toBe(200);
    expect(result.current.sensorHeight).toBe(150);
    expect(result.current.focalLength).toBe(500);
  });

  it('setFovSimEnabled toggles FOV simulation', () => {
    const { result } = renderHook(() => useEquipmentFOVProps());

    const initial = result.current.fovSimEnabled;
    act(() => {
      result.current.setFovSimEnabled(!initial);
    });

    expect(result.current.fovSimEnabled).toBe(!initial);
  });
});
