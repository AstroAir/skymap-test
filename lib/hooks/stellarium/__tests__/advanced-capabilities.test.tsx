/**
 * @jest-environment jsdom
 */

import { act, renderHook } from '@testing-library/react';
import type { StellariumEngine } from '@/lib/core/types';
import { useStellariumCalendar } from '../use-stellarium-calendar';
import { useStellariumFonts } from '../use-stellarium-fonts';
import { useStellariumLayerApi } from '../use-stellarium-layer-api';
import { useStellariumValueWatch } from '../use-stellarium-value-watch';

describe('Stellarium advanced capability hooks', () => {
  describe('useStellariumCalendar', () => {
    it('collects events emitted by calendar callback', async () => {
      const calendar = jest.fn(({ onEvent }: { onEvent: (event: unknown) => void }) => {
        onEvent({ type: 'rise' });
        onEvent({ type: 'set' });
      });
      const stelRef = { current: { calendar } as unknown as StellariumEngine };

      const { result } = renderHook(() => useStellariumCalendar(stelRef));
      const events = await result.current.runCalendar({
        start: new Date('2026-01-01T00:00:00.000Z'),
        end: new Date('2026-01-02T00:00:00.000Z'),
      });

      expect(calendar).toHaveBeenCalledTimes(1);
      expect(events).toEqual([{ type: 'rise' }, { type: 'set' }]);
    });

    it('returns an empty list when calendar API is unavailable', async () => {
      const stelRef = { current: {} as StellariumEngine };
      const { result } = renderHook(() => useStellariumCalendar(stelRef));

      const events = await result.current.runCalendar({
        start: new Date('2026-01-01T00:00:00.000Z'),
        end: new Date('2026-01-02T00:00:00.000Z'),
      });

      expect(events).toEqual([]);
    });
  });

  describe('useStellariumFonts', () => {
    it('delegates to setFont when available', async () => {
      const setFont = jest.fn().mockResolvedValue(undefined);
      const stelRef = { current: { setFont } as unknown as StellariumEngine };
      const { result } = renderHook(() => useStellariumFonts(stelRef));

      await result.current.setEngineFont('regular', '/fonts/Mock-Regular.ttf');
      expect(setFont).toHaveBeenCalledWith('regular', '/fonts/Mock-Regular.ttf');
    });

    it('throws when setFont API is unavailable', async () => {
      const stelRef = { current: {} as StellariumEngine };
      const { result } = renderHook(() => useStellariumFonts(stelRef));

      await expect(
        result.current.setEngineFont('bold', '/fonts/Mock-Bold.ttf')
      ).rejects.toThrow('Stellarium setFont API is not available');
    });
  });

  describe('useStellariumLayerApi', () => {
    it('creates layer/object and geojson wrappers through engine API', () => {
      const layer = { add: jest.fn() };
      const geoObj = { setData: jest.fn() };
      const surveyObj = { queryRenderedFeatures: jest.fn() };
      const createLayer = jest.fn(() => layer);
      const createObj = jest
        .fn()
        .mockImplementation((type: string) => {
          if (type === 'geojson') return geoObj;
          if (type === 'geojson-survey') return surveyObj;
          return { type };
        });

      const stelRef = {
        current: { createLayer, createObj } as unknown as StellariumEngine,
      };
      const { result } = renderHook(() => useStellariumLayerApi(stelRef));

      const createdLayer = result.current.createLayer({ id: 'test', z: 10, visible: true });
      const createdObject = result.current.createObject('circle', { r: 1 });
      const createdGeoJson = result.current.createGeoJsonObject({
        type: 'FeatureCollection',
        features: [],
      });
      const createdGeoJsonSurvey = result.current.createGeoJsonSurvey({ url: 'https://example.test' });

      expect(createdLayer).toBe(layer);
      expect(createdObject).toEqual({ type: 'circle' });
      expect(createdGeoJson).toBe(geoObj);
      expect(createdGeoJsonSurvey).toBe(surveyObj);
      expect(createLayer).toHaveBeenCalledWith({ id: 'test', z: 10, visible: true });
      expect(createObj).toHaveBeenCalledWith('circle', { r: 1 });
      expect(createObj).toHaveBeenCalledWith('geojson', {});
      expect(createObj).toHaveBeenCalledWith('geojson-survey', { url: 'https://example.test' });
      expect(geoObj.setData).toHaveBeenCalledWith({
        type: 'FeatureCollection',
        features: [],
      });
    });
  });

  describe('useStellariumValueWatch', () => {
    it('bridges onValueChanged and supports unsubscribe', () => {
      let bridgeCallback: ((path: string, value: unknown) => void) | undefined;
      const onValueChanged = jest.fn((cb: (path: string, value: unknown) => void) => {
        bridgeCallback = cb;
      });

      const stelRef = {
        current: { onValueChanged } as unknown as StellariumEngine,
      };

      const { result } = renderHook(() => useStellariumValueWatch(stelRef));
      const watcherA = jest.fn();
      const watcherB = jest.fn();

      const unsubscribeA = result.current.watchValue(watcherA);
      const unsubscribeB = result.current.watchValue(watcherB);
      expect(onValueChanged).toHaveBeenCalledTimes(1);

      act(() => {
        bridgeCallback?.('projection', 1);
      });

      expect(watcherA).toHaveBeenCalledWith('projection', 1);
      expect(watcherB).toHaveBeenCalledWith('projection', 1);

      unsubscribeA();
      act(() => {
        bridgeCallback?.('projection', 2);
      });

      expect(watcherA).toHaveBeenCalledTimes(1);
      expect(watcherB).toHaveBeenLastCalledWith('projection', 2);

      unsubscribeB();
    });
  });
});

