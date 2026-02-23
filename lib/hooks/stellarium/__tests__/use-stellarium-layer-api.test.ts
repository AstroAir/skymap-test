/**
 * Tests for use-stellarium-layer-api.ts
 * Stellarium layer and object creation API
 */

import { renderHook } from '@testing-library/react';
import { useStellariumLayerApi } from '../use-stellarium-layer-api';
import { useRef } from 'react';

describe('useStellariumLayerApi', () => {
  it('should return all API functions', () => {
    const { result } = renderHook(() => {
      const ref = useRef(null);
      return useStellariumLayerApi(ref);
    });
    expect(typeof result.current.createLayer).toBe('function');
    expect(typeof result.current.createObject).toBe('function');
    expect(typeof result.current.createGeoJsonObject).toBe('function');
    expect(typeof result.current.createGeoJsonSurvey).toBe('function');
  });

  it('should return null for all when stel is null', () => {
    const { result } = renderHook(() => {
      const ref = useRef(null);
      return useStellariumLayerApi(ref);
    });
    expect(result.current.createLayer({ id: 'test', z: 1, visible: true })).toBeNull();
    expect(result.current.createObject('circle', {})).toBeNull();
    expect(result.current.createGeoJsonObject({ type: 'FeatureCollection', features: [] })).toBeNull();
    expect(result.current.createGeoJsonSurvey({})).toBeNull();
  });

  it('should delegate to stel.createLayer when engine available', () => {
    const mockLayer = { id: 'test', z: 1 };
    const mockStel = {
      createLayer: jest.fn(() => mockLayer),
      createObj: jest.fn(() => ({})),
    };

    const { result } = renderHook(() => {
      const ref = useRef(mockStel);
      return useStellariumLayerApi(ref as never);
    });

    const layer = result.current.createLayer({ id: 'test', z: 1, visible: true });
    expect(layer).toBe(mockLayer);
    expect(mockStel.createLayer).toHaveBeenCalled();
  });
});
