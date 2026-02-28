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

describe('useAladinStore - MOC layers', () => {
  it('should add a MOC layer', () => {
    let id = '';
    act(() => {
      id = useAladinStore.getState().addMocLayer({
        name: 'Test MOC',
        url: 'http://example.com/moc',
        color: '#ff0000',
        opacity: 0.5,
        lineWidth: 2,
        visible: true,
      });
    });
    expect(id).toBeDefined();
    const layers = useAladinStore.getState().mocLayers;
    expect(layers).toHaveLength(1);
    expect(layers[0].name).toBe('Test MOC');
  });

  it('should update a MOC layer', () => {
    let id = '';
    act(() => {
      id = useAladinStore.getState().addMocLayer({
        name: 'MOC',
        color: '#ff0000',
        opacity: 0.5,
        lineWidth: 2,
        visible: true,
      });
    });
    act(() => {
      useAladinStore.getState().updateMocLayer(id, { opacity: 0.8 });
    });
    expect(useAladinStore.getState().mocLayers[0].opacity).toBe(0.8);
  });

  it('should toggle MOC layer visibility', () => {
    let id = '';
    act(() => {
      id = useAladinStore.getState().addMocLayer({
        name: 'MOC',
        color: '#ff0000',
        opacity: 0.5,
        lineWidth: 2,
        visible: true,
      });
    });
    act(() => {
      useAladinStore.getState().toggleMocLayer(id);
    });
    expect(useAladinStore.getState().mocLayers[0].visible).toBe(false);
  });

  it('should remove a MOC layer', () => {
    let id = '';
    act(() => {
      id = useAladinStore.getState().addMocLayer({
        name: 'MOC',
        color: '#ff0000',
        opacity: 0.5,
        lineWidth: 2,
        visible: true,
      });
    });
    act(() => {
      useAladinStore.getState().removeMocLayer(id);
    });
    expect(useAladinStore.getState().mocLayers).toHaveLength(0);
  });
});

describe('useAladinStore - FITS layers', () => {
  it('should add a FITS layer', () => {
    let id = '';
    act(() => {
      id = useAladinStore.getState().addFitsLayer({
        name: 'Test FITS',
        url: 'http://example.com/fits',
        mode: 'base',
        enabled: true,
        opacity: 1.0,
      });
    });
    expect(id).toBeDefined();
    expect(useAladinStore.getState().fitsLayers).toHaveLength(1);
    expect(useAladinStore.getState().fitsLayers[0].name).toBe('Test FITS');
  });

  it('should update a FITS layer', () => {
    let id = '';
    act(() => {
      id = useAladinStore.getState().addFitsLayer({
        name: 'FITS',
        url: 'http://example.com/fits',
        mode: 'base',
        enabled: true,
        opacity: 1.0,
      });
    });
    act(() => {
      useAladinStore.getState().updateFitsLayer(id, { opacity: 0.5 });
    });
    expect(useAladinStore.getState().fitsLayers[0].opacity).toBe(0.5);
  });

  it('should toggle a FITS layer', () => {
    let id = '';
    act(() => {
      id = useAladinStore.getState().addFitsLayer({
        name: 'FITS',
        url: 'http://example.com/fits',
        mode: 'base',
        enabled: true,
        opacity: 1.0,
      });
    });
    act(() => {
      useAladinStore.getState().toggleFitsLayer(id);
    });
    expect(useAladinStore.getState().fitsLayers[0].enabled).toBe(false);
  });

  it('should remove a FITS layer', () => {
    let id = '';
    act(() => {
      id = useAladinStore.getState().addFitsLayer({
        name: 'FITS',
        url: 'http://example.com/fits',
        mode: 'base',
        enabled: true,
        opacity: 1.0,
      });
    });
    act(() => {
      useAladinStore.getState().removeFitsLayer(id);
    });
    expect(useAladinStore.getState().fitsLayers).toHaveLength(0);
  });
});

describe('useAladinStore - additional catalog/overlay operations', () => {
  it('should setCatalogLayers to replace all catalog layers', () => {
    act(() => {
      useAladinStore.getState().setCatalogLayers([
        { id: 'custom', type: 'simbad', name: 'Custom', enabled: true, color: '#000', radius: 1, limit: 50 },
      ]);
    });
    expect(useAladinStore.getState().catalogLayers).toHaveLength(1);
    expect(useAladinStore.getState().catalogLayers[0].id).toBe('custom');
  });

  it('should updateCatalogLayer partial properties', () => {
    const id = useAladinStore.getState().catalogLayers[0]?.id;
    if (!id) return;
    act(() => {
      useAladinStore.getState().updateCatalogLayer(id, { color: '#00ff00', limit: 9999 });
    });
    const layer = useAladinStore.getState().catalogLayers.find(l => l.id === id);
    expect(layer?.color).toBe('#00ff00');
    expect(layer?.limit).toBe(9999);
  });

  it('should updateImageOverlayLayer', () => {
    let id = '';
    act(() => {
      id = useAladinStore.getState().addImageOverlayLayer({
        name: 'DSS',
        surveyId: 'P/DSS2/color',
        enabled: true,
        opacity: 0.7,
        additive: false,
      });
    });
    act(() => {
      useAladinStore.getState().updateImageOverlayLayer(id, { opacity: 0.3 });
    });
    expect(useAladinStore.getState().imageOverlayLayers[0].opacity).toBe(0.3);
  });

  it('should toggleImageOverlayLayer', () => {
    let id = '';
    act(() => {
      id = useAladinStore.getState().addImageOverlayLayer({
        name: 'DSS',
        surveyId: 'P/DSS2/color',
        enabled: true,
        opacity: 0.7,
        additive: false,
      });
    });
    act(() => {
      useAladinStore.getState().toggleImageOverlayLayer(id);
    });
    expect(useAladinStore.getState().imageOverlayLayers[0].enabled).toBe(false);
  });

  it('should removeImageOverlayLayer', () => {
    let id = '';
    act(() => {
      id = useAladinStore.getState().addImageOverlayLayer({
        name: 'DSS',
        surveyId: 'P/DSS2/color',
        enabled: true,
        opacity: 0.7,
        additive: false,
      });
    });
    act(() => {
      useAladinStore.getState().removeImageOverlayLayer(id);
    });
    expect(useAladinStore.getState().imageOverlayLayers).toHaveLength(0);
  });

  it('should upsert (update existing) catalog layer', () => {
    act(() => {
      useAladinStore.getState().upsertCatalogLayer({
        id: 'simbad',
        type: 'simbad',
        name: 'Updated SIMBAD',
        enabled: true,
        color: '#ff0000',
        radius: 1.0,
        limit: 2000,
      });
    });
    const layer = useAladinStore.getState().catalogLayers.find(l => l.id === 'simbad');
    expect(layer?.name).toBe('Updated SIMBAD');
    expect(layer?.limit).toBe(2000);
  });
});
