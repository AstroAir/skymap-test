/**
 * Tests for aladin-store.ts
 * Aladin catalog, overlay, MOC, and FITS layer management
 */

import { act } from '@testing-library/react';
import { useAladinStore } from '../aladin-store';

beforeEach(() => {
  act(() => {
    useAladinStore.getState().resetAladinLayers();
  });
});

describe('useAladinStore - catalog layers', () => {
  it('should have default catalog layers after reset', () => {
    const layers = useAladinStore.getState().catalogLayers;
    expect(layers.length).toBeGreaterThanOrEqual(1);
    expect(layers.some((l: { type: string }) => l.type === 'simbad')).toBe(true);
  });

  it('should upsert a catalog layer', () => {
    act(() => {
      useAladinStore.getState().upsertCatalogLayer({
        id: 'test-cat',
        type: 'simbad',
        name: 'SIMBAD Test',
        enabled: true,
        color: '#ff0000',
        radius: 0.1,
        limit: 100,
      });
    });
    const layers = useAladinStore.getState().catalogLayers;
    const found = layers.find((l: { id: string }) => l.id === 'test-cat');
    expect(found).toBeDefined();
    expect(found!.name).toBe('SIMBAD Test');
  });

  it('should remove a catalog layer', () => {
    act(() => {
      useAladinStore.getState().upsertCatalogLayer({
        id: 'to-remove',
        type: 'simbad',
        name: 'Remove Me',
        enabled: true,
        color: '#ff0000',
        radius: 0.1,
        limit: 100,
      });
    });
    act(() => {
      useAladinStore.getState().removeCatalogLayer('to-remove');
    });
    const layers = useAladinStore.getState().catalogLayers;
    expect(layers.find((l: { id: string }) => l.id === 'to-remove')).toBeUndefined();
  });

  it('should toggle catalog layer enabled state', () => {
    const id = useAladinStore.getState().catalogLayers[0]?.id;
    if (!id) return; // skip if no default layers after reset
    const before = useAladinStore.getState().catalogLayers[0].enabled;
    act(() => {
      useAladinStore.getState().toggleCatalogLayer(id);
    });
    expect(useAladinStore.getState().catalogLayers[0].enabled).toBe(!before);
  });
});

describe('useAladinStore - image overlay layers', () => {
  it('should add an image overlay layer', () => {
    act(() => {
      useAladinStore.getState().addImageOverlayLayer({
        name: 'DSS',
        surveyId: 'P/DSS2/color',
        enabled: true,
        opacity: 0.7,
        additive: false,
      });
    });
    expect(useAladinStore.getState().imageOverlayLayers).toHaveLength(1);
  });

  it('should reset all layers', () => {
    act(() => {
      useAladinStore.getState().addImageOverlayLayer({
        name: 'DSS',
        surveyId: 'P/DSS2/color',
        enabled: true,
        opacity: 0.7,
        additive: false,
      });
      useAladinStore.getState().resetAladinLayers();
    });
    expect(useAladinStore.getState().imageOverlayLayers).toHaveLength(0);
  });
});
