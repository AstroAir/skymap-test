/**
 * @jest-environment jsdom
 */

import {
  exportViewCompat,
  getFoVCompat,
  removeImageLayerCompat,
  setFoVCompat,
  setMocStyleCompat,
  updateReticleCompat,
} from '../aladin-compat';

describe('aladin-compat', () => {
  it('prefers modern FoV APIs', () => {
    const aladin = {
      getFoV: jest.fn(() => [42, 42]),
      setFoV: jest.fn(),
    } as unknown as ReturnType<typeof import('aladin-lite').default.aladin>;

    expect(getFoVCompat(aladin)).toBe(42);
    setFoVCompat(aladin, 25);
    expect(aladin.setFoV).toHaveBeenCalledWith(25);
  });

  it('falls back to legacy FoV aliases', () => {
    const aladin = {
      getFov: jest.fn(() => [55, 55]),
      setFov: jest.fn(),
    } as unknown as ReturnType<typeof import('aladin-lite').default.aladin>;

    expect(getFoVCompat(aladin)).toBe(55);
    setFoVCompat(aladin, 30);
    expect(aladin.setFov).toHaveBeenCalledWith(30);
  });

  it('removes image layers using modern API then legacy fallback', () => {
    const modern = {
      removeImageLayer: jest.fn(),
    } as unknown as ReturnType<typeof import('aladin-lite').default.aladin>;
    removeImageLayerCompat(modern, 'layer-1');
    expect(modern.removeImageLayer).toHaveBeenCalledWith('layer-1');

    const legacy = {
      removeOverlayImageLayer: jest.fn(),
    } as unknown as ReturnType<typeof import('aladin-lite').default.aladin>;
    removeImageLayerCompat(legacy, 'layer-2');
    expect(legacy.removeOverlayImageLayer).toHaveBeenCalledWith('layer-2');
  });

  it('updates reticle via getReticle().update when available', () => {
    const reticle = { update: jest.fn() };
    const aladin = {
      getReticle: jest.fn(() => reticle),
      showReticle: jest.fn(),
    } as unknown as ReturnType<typeof import('aladin-lite').default.aladin>;

    updateReticleCompat(aladin, { show: true, color: '#fff', size: 12 });
    expect(reticle.update).toHaveBeenCalledWith({ show: true, color: '#fff', size: 12 });
    expect(aladin.showReticle).not.toHaveBeenCalled();
  });

  it('falls back to showReticle/setDefaultColor when reticle API is unavailable', () => {
    const aladin = {
      showReticle: jest.fn(),
      setDefaultColor: jest.fn(),
    } as unknown as ReturnType<typeof import('aladin-lite').default.aladin>;

    updateReticleCompat(aladin, { show: false, color: '#0f0' });
    expect(aladin.showReticle).toHaveBeenCalledWith(false);
    expect(aladin.setDefaultColor).toHaveBeenCalledWith('#0f0');
  });

  it('applies moc style with property-driven behavior', () => {
    const moc = {
      show: jest.fn(),
      hide: jest.fn(),
      opacity: 0.2,
      color: '#000',
      lineWidth: 1,
    } as unknown as ReturnType<typeof import('aladin-lite').default.MOCFromURL>;

    setMocStyleCompat(moc, {
      visible: true,
      opacity: 0.6,
      color: '#f00',
      lineWidth: 3,
    });

    expect(moc.show).toHaveBeenCalled();
    expect(moc.opacity).toBe(0.6);
    expect(moc.color).toBe('#f00');
    expect(moc.lineWidth).toBe(3);
  });

  it('exports view data url asynchronously with graceful error handling', async () => {
    const aladin = {
      getViewDataURL: jest.fn(async () => 'data:image/png;base64,mock'),
    } as unknown as ReturnType<typeof import('aladin-lite').default.aladin>;

    await expect(exportViewCompat(aladin)).resolves.toBe('data:image/png;base64,mock');

    const broken = {
      getViewDataURL: jest.fn(async () => {
        throw new Error('boom');
      }),
    } as unknown as ReturnType<typeof import('aladin-lite').default.aladin>;

    await expect(exportViewCompat(broken)).resolves.toBeNull();
  });
});
