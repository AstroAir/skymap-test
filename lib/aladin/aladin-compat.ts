'use client';

import type A from 'aladin-lite';

type AladinInstance = ReturnType<typeof A.aladin>;
type AladinMOC = ReturnType<typeof A.MOCFromURL>;

type LegacyAladinInstance = AladinInstance & {
  getFov?: () => number | [number, number];
  setFov?: (fov: number) => void;
  setFovRange?: (min: number, max: number) => void;
  setFOVRange?: (min: number, max: number) => void;
  removeOverlayImageLayer?: (name: string) => void;
  setDefaultColor?: (color: string) => void;
};

type LegacyMOC = AladinMOC & {
  setOpacity?: (opacity: number) => void;
  setColor?: (color: string) => void;
  setLineWidth?: (width: number) => void;
};

interface ReticleUpdateOptions {
  show?: boolean;
  color?: string;
  size?: number;
}

interface MOCStyleOptions {
  visible?: boolean;
  opacity?: number;
  color?: string;
  lineWidth?: number;
}

function normalizeFoV(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return raw;
  }
  if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === 'number' && Number.isFinite(raw[0])) {
    return raw[0];
  }
  return null;
}

export function getFoVCompat(aladin: AladinInstance | null): number | null {
  if (!aladin) return null;

  const modern = aladin.getFoV?.();
  const modernFoV = normalizeFoV(modern);
  if (modernFoV !== null) return modernFoV;

  const legacy = (aladin as LegacyAladinInstance).getFov?.();
  return normalizeFoV(legacy);
}

export function setFoVCompat(aladin: AladinInstance | null, fov: number): void {
  if (!aladin || !Number.isFinite(fov)) return;

  if (typeof aladin.setFoV === 'function') {
    aladin.setFoV(fov);
    return;
  }

  (aladin as LegacyAladinInstance).setFov?.(fov);
}

export function setFoVRangeCompat(aladin: AladinInstance | null, min: number, max: number): void {
  if (!aladin || !Number.isFinite(min) || !Number.isFinite(max)) return;

  if (typeof aladin.setFoVRange === 'function') {
    aladin.setFoVRange(min, max);
    return;
  }

  const legacy = aladin as LegacyAladinInstance;
  if (typeof legacy.setFovRange === 'function') {
    legacy.setFovRange(min, max);
    return;
  }

  legacy.setFOVRange?.(min, max);
}

export function removeImageLayerCompat(aladin: AladinInstance | null, name: string): void {
  if (!aladin || !name) return;

  if (typeof aladin.removeImageLayer === 'function') {
    aladin.removeImageLayer(name);
    return;
  }

  (aladin as LegacyAladinInstance).removeOverlayImageLayer?.(name);
}

export function updateReticleCompat(
  aladin: AladinInstance | null,
  options: ReticleUpdateOptions
): void {
  if (!aladin) return;

  const reticle = typeof aladin.getReticle === 'function' ? aladin.getReticle() : null;

  if (reticle && typeof reticle.update === 'function') {
    reticle.update(options);
    return;
  }

  if (typeof options.show === 'boolean') {
    aladin.showReticle(options.show);
  }

  if (typeof options.color === 'string') {
    const legacy = aladin as LegacyAladinInstance;
    legacy.setDefaultColor?.(options.color);
  }
}

export function setMocStyleCompat(moc: AladinMOC | null, style: MOCStyleOptions): void {
  if (!moc) return;

  if (typeof style.visible === 'boolean') {
    if (style.visible) {
      moc.show();
    } else {
      moc.hide();
    }
  }

  const legacy = moc as LegacyMOC;

  if (typeof style.opacity === 'number') {
    if ('opacity' in moc) {
      moc.opacity = style.opacity;
    } else {
      legacy.setOpacity?.(style.opacity);
    }
  }

  if (typeof style.color === 'string') {
    if ('color' in moc) {
      moc.color = style.color;
    } else {
      legacy.setColor?.(style.color);
    }
  }

  if (typeof style.lineWidth === 'number') {
    if ('lineWidth' in moc) {
      moc.lineWidth = style.lineWidth;
    } else {
      legacy.setLineWidth?.(style.lineWidth);
    }
  }
}

export async function exportViewCompat(
  aladin: AladinInstance | null,
  options: { format?: string; quality?: number } | string = { format: 'image/png' }
): Promise<string | null> {
  if (!aladin || typeof aladin.getViewDataURL !== 'function') {
    return null;
  }

  try {
    const result = aladin.getViewDataURL(options);
    if (typeof result === 'string') {
      return result;
    }
    return await result;
  } catch {
    return null;
  }
}

export function destroyAladinCompat(aladin: AladinInstance | null): void {
  if (!aladin) return;

  if (typeof aladin.remove === 'function') {
    aladin.remove();
    return;
  }

  aladin.removeLayers();
}
