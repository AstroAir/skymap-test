'use client';

import { useEffect, useMemo } from 'react';
import { useEquipmentStore } from '@/lib/stores';
import {
  BARLOW_PRESETS,
  EYEPIECE_PRESETS,
  OCULAR_TELESCOPE_PRESETS,
  type BarlowPreset,
  type EyepiecePreset,
  type OcularTelescopePreset,
} from '@/lib/constants/equipment-presets';
import { calculateOcularView } from '@/lib/astronomy/ocular-utils';
import {
  useEquipment,
  type BarlowReducer as TauriBarlowReducer,
  type Eyepiece as TauriEyepiece,
  type Telescope as TauriTelescope,
} from '@/lib/tauri';

export type OcularEquipmentSource = 'builtin' | 'desktop' | 'custom';

interface OcularEquipmentMeta {
  source: OcularEquipmentSource;
}

export type OcularEyepieceOption = EyepiecePreset & OcularEquipmentMeta;
export type OcularBarlowOption = BarlowPreset & OcularEquipmentMeta;
export type OcularTelescopeOption = OcularTelescopePreset & OcularEquipmentMeta;

function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function normalizeNumeric(value: number, fallback = 0): number {
  return Number.isFinite(value) ? value : fallback;
}

function dedupeByIdThenSignature<T extends { id: string }>(
  items: T[],
  getSignature: (item: T) => string
): T[] {
  const idSet = new Set<string>();
  const signatureSet = new Set<string>();
  const result: T[] = [];

  for (const item of items) {
    const idKey = normalizeText(item.id);
    if (idSet.has(idKey)) {
      continue;
    }

    const signature = getSignature(item);
    if (signatureSet.has(signature)) {
      continue;
    }

    idSet.add(idKey);
    signatureSet.add(signature);
    result.push(item);
  }

  return result;
}

function normalizeTelescopeType(value: string): OcularTelescopePreset['type'] {
  if (value === 'refractor' || value === 'reflector' || value === 'catadioptric') {
    return value;
  }

  return 'catadioptric';
}

export function mapTauriEyepieceToPreset(eyepiece: TauriEyepiece): EyepiecePreset {
  return {
    id: eyepiece.id,
    name: eyepiece.name,
    focalLength: Math.max(0.1, normalizeNumeric(eyepiece.focal_length, 25)),
    afov: Math.max(1, normalizeNumeric(eyepiece.apparent_fov, 50)),
    isCustom: false,
  };
}

export function mapTauriBarlowReducerToPreset(barlowReducer: TauriBarlowReducer): BarlowPreset {
  return {
    id: barlowReducer.id,
    name: barlowReducer.name,
    magnification: Math.max(0.1, normalizeNumeric(barlowReducer.factor, 1)),
    isCustom: false,
  };
}

export function mapTauriTelescopeToOcularPreset(telescope: TauriTelescope): OcularTelescopePreset {
  return {
    id: telescope.id,
    name: telescope.name,
    focalLength: Math.max(1, normalizeNumeric(telescope.focal_length, 400)),
    aperture: Math.max(1, normalizeNumeric(telescope.aperture, 80)),
    type: normalizeTelescopeType(telescope.telescope_type),
    isCustom: false,
  };
}

function eyepieceSignature(eyepiece: EyepiecePreset): string {
  return [
    normalizeText(eyepiece.name),
    normalizeNumeric(eyepiece.focalLength).toFixed(3),
    normalizeNumeric(eyepiece.afov).toFixed(3),
    normalizeNumeric(eyepiece.fieldStop ?? -1).toFixed(3),
  ].join('|');
}

function barlowSignature(barlow: BarlowPreset): string {
  return [
    normalizeText(barlow.name),
    normalizeNumeric(barlow.magnification).toFixed(3),
  ].join('|');
}

function telescopeSignature(telescope: OcularTelescopePreset): string {
  return [
    normalizeText(telescope.name),
    normalizeNumeric(telescope.focalLength).toFixed(3),
    normalizeNumeric(telescope.aperture).toFixed(3),
    telescope.type,
  ].join('|');
}

function withSource<T extends { isCustom?: boolean }>(
  items: T[],
  source: OcularEquipmentSource
): Array<T & OcularEquipmentMeta> {
  return items.map((item) => ({
    ...item,
    isCustom: source === 'custom' ? true : item.isCustom,
    source,
  }));
}

const FALLBACK_TELESCOPE: OcularTelescopePreset = OCULAR_TELESCOPE_PRESETS[0];
const FALLBACK_EYEPIECE: EyepiecePreset = EYEPIECE_PRESETS[0];
const FALLBACK_BARLOW: BarlowPreset = BARLOW_PRESETS[0];

export function useOcularSimulation() {
  const customEyepieces = useEquipmentStore((state) => state.customEyepieces);
  const customBarlows = useEquipmentStore((state) => state.customBarlows);
  const customOcularTelescopes = useEquipmentStore((state) => state.customOcularTelescopes);

  const selectedOcularTelescopeId = useEquipmentStore((state) => state.selectedOcularTelescopeId);
  const selectedEyepieceId = useEquipmentStore((state) => state.selectedEyepieceId);
  const selectedBarlowId = useEquipmentStore((state) => state.selectedBarlowId);

  const setSelectedOcularTelescopeId = useEquipmentStore((state) => state.setSelectedOcularTelescopeId);
  const setSelectedEyepieceId = useEquipmentStore((state) => state.setSelectedEyepieceId);
  const setSelectedBarlowId = useEquipmentStore((state) => state.setSelectedBarlowId);

  const { equipment, isAvailable } = useEquipment();

  const desktopEyepieces = useMemo(
    () => (isAvailable && equipment ? equipment.eyepieces.map(mapTauriEyepieceToPreset) : []),
    [equipment, isAvailable]
  );

  const desktopBarlows = useMemo(
    () => (isAvailable && equipment ? equipment.barlow_reducers.map(mapTauriBarlowReducerToPreset) : []),
    [equipment, isAvailable]
  );

  const desktopTelescopes = useMemo(
    () => (isAvailable && equipment ? equipment.telescopes.map(mapTauriTelescopeToOcularPreset) : []),
    [equipment, isAvailable]
  );

  const eyepieces = useMemo(
    () =>
      dedupeByIdThenSignature(
        [
          ...withSource(EYEPIECE_PRESETS, 'builtin'),
          ...withSource(desktopEyepieces, 'desktop'),
          ...withSource(customEyepieces, 'custom'),
        ],
        eyepieceSignature
      ),
    [customEyepieces, desktopEyepieces]
  );

  const barlows = useMemo(
    () =>
      dedupeByIdThenSignature(
        [
          ...withSource(BARLOW_PRESETS, 'builtin'),
          ...withSource(desktopBarlows, 'desktop'),
          ...withSource(customBarlows, 'custom'),
        ],
        barlowSignature
      ),
    [customBarlows, desktopBarlows]
  );

  const telescopes = useMemo(
    () =>
      dedupeByIdThenSignature(
        [
          ...withSource(OCULAR_TELESCOPE_PRESETS, 'builtin'),
          ...withSource(desktopTelescopes, 'desktop'),
          ...withSource(customOcularTelescopes, 'custom'),
        ],
        telescopeSignature
      ),
    [customOcularTelescopes, desktopTelescopes]
  );

  const selectedTelescope = useMemo(
    () => telescopes.find((item) => item.id === selectedOcularTelescopeId) ?? telescopes[0] ?? { ...FALLBACK_TELESCOPE, source: 'builtin' as const },
    [selectedOcularTelescopeId, telescopes]
  );

  const selectedEyepiece = useMemo(
    () => eyepieces.find((item) => item.id === selectedEyepieceId) ?? eyepieces[0] ?? { ...FALLBACK_EYEPIECE, source: 'builtin' as const },
    [eyepieces, selectedEyepieceId]
  );

  const selectedBarlow = useMemo(
    () => barlows.find((item) => item.id === selectedBarlowId) ?? barlows[0] ?? { ...FALLBACK_BARLOW, source: 'builtin' as const },
    [barlows, selectedBarlowId]
  );

  useEffect(() => {
    if (telescopes.length === 0) {
      return;
    }

    if (!telescopes.some((item) => item.id === selectedOcularTelescopeId)) {
      setSelectedOcularTelescopeId(telescopes[0].id);
    }
  }, [selectedOcularTelescopeId, setSelectedOcularTelescopeId, telescopes]);

  useEffect(() => {
    if (eyepieces.length === 0) {
      return;
    }

    if (!eyepieces.some((item) => item.id === selectedEyepieceId)) {
      setSelectedEyepieceId(eyepieces[0].id);
    }
  }, [eyepieces, selectedEyepieceId, setSelectedEyepieceId]);

  useEffect(() => {
    if (barlows.length === 0) {
      return;
    }

    if (!barlows.some((item) => item.id === selectedBarlowId)) {
      setSelectedBarlowId(barlows[0].id);
    }
  }, [barlows, selectedBarlowId, setSelectedBarlowId]);

  const viewData = useMemo(
    () => calculateOcularView(selectedTelescope, selectedEyepiece, selectedBarlow),
    [selectedBarlow, selectedEyepiece, selectedTelescope]
  );

  return {
    telescopes,
    eyepieces,
    barlows,
    selectedTelescope,
    selectedEyepiece,
    selectedBarlow,
    selectedOcularTelescopeId,
    selectedEyepieceId,
    selectedBarlowId,
    setSelectedOcularTelescopeId,
    setSelectedEyepieceId,
    setSelectedBarlowId,
    viewData,
    hasDesktopSource: isAvailable && !!equipment,
  };
}
