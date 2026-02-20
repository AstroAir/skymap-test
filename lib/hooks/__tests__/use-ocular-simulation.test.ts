/**
 * @jest-environment jsdom
 */

import { renderHook, waitFor } from '@testing-library/react';
import type { EquipmentData } from '@/lib/tauri';
import {
  mapTauriBarlowReducerToPreset,
  mapTauriEyepieceToPreset,
  mapTauriTelescopeToOcularPreset,
  useOcularSimulation,
} from '../use-ocular-simulation';

const mockUseEquipment = jest.fn();
const mockSetSelectedOcularTelescopeId = jest.fn();
const mockSetSelectedEyepieceId = jest.fn();
const mockSetSelectedBarlowId = jest.fn();

let mockEquipmentState = {
  customEyepieces: [] as Array<{ id: string; name: string; focalLength: number; afov: number; fieldStop?: number; isCustom?: boolean }>,
  customBarlows: [] as Array<{ id: string; name: string; magnification: number; isCustom?: boolean }>,
  customOcularTelescopes: [] as Array<{ id: string; name: string; focalLength: number; aperture: number; type: 'refractor' | 'reflector' | 'catadioptric'; isCustom?: boolean }>,
  selectedOcularTelescopeId: 't1',
  selectedEyepieceId: 'e1',
  selectedBarlowId: 'b0',
  setSelectedOcularTelescopeId: mockSetSelectedOcularTelescopeId,
  setSelectedEyepieceId: mockSetSelectedEyepieceId,
  setSelectedBarlowId: mockSetSelectedBarlowId,
};

jest.mock('@/lib/stores', () => ({
  useEquipmentStore: (selector: (state: typeof mockEquipmentState) => unknown) => selector(mockEquipmentState),
}));

jest.mock('@/lib/tauri', () => ({
  useEquipment: () => mockUseEquipment(),
}));

describe('useOcularSimulation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEquipmentState = {
      customEyepieces: [],
      customBarlows: [],
      customOcularTelescopes: [],
      selectedOcularTelescopeId: 't1',
      selectedEyepieceId: 'e1',
      selectedBarlowId: 'b0',
      setSelectedOcularTelescopeId: mockSetSelectedOcularTelescopeId,
      setSelectedEyepieceId: mockSetSelectedEyepieceId,
      setSelectedBarlowId: mockSetSelectedBarlowId,
    };
    mockUseEquipment.mockReturnValue({
      equipment: null,
      isAvailable: false,
    });
  });

  it('merges local, custom and desktop sources with source tags', () => {
    const equipment: EquipmentData = {
      telescopes: [
        {
          id: 'desktop-scope',
          name: 'Desktop Scope',
          aperture: 90,
          focal_length: 900,
          focal_ratio: 10,
          telescope_type: 'refractor',
          is_default: false,
          created_at: '',
          updated_at: '',
        },
      ],
      cameras: [],
      eyepieces: [
        {
          id: 'desktop-ep',
          name: 'Desktop EP',
          focal_length: 12,
          apparent_fov: 70,
          barrel_size: 1.25,
          created_at: '',
          updated_at: '',
        },
      ],
      barlow_reducers: [
        {
          id: 'desktop-barlow',
          name: 'Desktop 1.5x',
          factor: 1.5,
          created_at: '',
          updated_at: '',
        },
      ],
      filters: [],
    };

    mockEquipmentState.customEyepieces = [
      { id: 'custom-ep', name: 'Custom EP', focalLength: 18, afov: 68, isCustom: true },
    ];
    mockUseEquipment.mockReturnValue({
      equipment,
      isAvailable: true,
    });

    const { result } = renderHook(() => useOcularSimulation());

    expect(result.current.hasDesktopSource).toBe(true);
    expect(result.current.eyepieces.some((item) => item.id === 'desktop-ep' && item.source === 'desktop')).toBe(true);
    expect(result.current.eyepieces.some((item) => item.id === 'custom-ep' && item.source === 'custom')).toBe(true);
    expect(result.current.telescopes.some((item) => item.id === 'desktop-scope' && item.source === 'desktop')).toBe(true);
    expect(result.current.barlows.some((item) => item.id === 'desktop-barlow' && item.source === 'desktop')).toBe(true);
  });

  it('falls back to first available ids when selected ids are invalid', async () => {
    mockEquipmentState.selectedOcularTelescopeId = 'missing-scope';
    mockEquipmentState.selectedEyepieceId = 'missing-ep';
    mockEquipmentState.selectedBarlowId = 'missing-barlow';

    renderHook(() => useOcularSimulation());

    await waitFor(() => {
      expect(mockSetSelectedOcularTelescopeId).toHaveBeenCalledWith('t1');
      expect(mockSetSelectedEyepieceId).toHaveBeenCalledWith('e1');
      expect(mockSetSelectedBarlowId).toHaveBeenCalledWith('b0');
    });
  });

  it('computes viewData from resolved selection', () => {
    const { result } = renderHook(() => useOcularSimulation());

    expect(result.current.viewData.magnification).toBeGreaterThan(0);
    expect(result.current.viewData.tfov).toBeGreaterThan(0);
    expect(result.current.selectedTelescope.id).toBe('t1');
    expect(result.current.selectedEyepiece.id).toBe('e1');
  });
});

describe('tauri mapping helpers', () => {
  it('maps tauri eyepiece to internal preset', () => {
    const mapped = mapTauriEyepieceToPreset({
      id: 'ep-1',
      name: 'EP',
      focal_length: 9,
      apparent_fov: 82,
      barrel_size: 1.25,
      created_at: '',
      updated_at: '',
    });

    expect(mapped).toEqual(expect.objectContaining({
      id: 'ep-1',
      focalLength: 9,
      afov: 82,
    }));
  });

  it('maps tauri barlow/reducer to internal preset', () => {
    const mapped = mapTauriBarlowReducerToPreset({
      id: 'barlow-1',
      name: 'Reducer',
      factor: 0.7,
      created_at: '',
      updated_at: '',
    });

    expect(mapped).toEqual(expect.objectContaining({
      id: 'barlow-1',
      magnification: 0.7,
    }));
  });

  it('maps tauri telescope type safely', () => {
    const mapped = mapTauriTelescopeToOcularPreset({
      id: 'scope-1',
      name: 'Scope',
      aperture: 102,
      focal_length: 714,
      focal_ratio: 7,
      telescope_type: 'other',
      is_default: false,
      created_at: '',
      updated_at: '',
    });

    expect(mapped).toEqual(expect.objectContaining({
      id: 'scope-1',
      aperture: 102,
      focalLength: 714,
      type: 'catadioptric',
    }));
  });
});
