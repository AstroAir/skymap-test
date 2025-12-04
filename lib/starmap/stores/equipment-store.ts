import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getZustandStorage } from '@/lib/storage';

// ============================================================================
// Types
// ============================================================================

export type GridType = 'none' | 'crosshair' | 'thirds' | 'golden' | 'diagonal';
export type BinningType = '1x1' | '2x2' | '3x3' | '4x4';
export type TrackingType = 'none' | 'basic' | 'guided';
export type TargetType = 'galaxy' | 'nebula' | 'cluster' | 'planetary';

export interface MosaicSettings {
  enabled: boolean;
  rows: number;
  cols: number;
  overlap: number;
  overlapUnit: 'percent' | 'pixels';
}

export interface CameraPreset {
  id: string;
  name: string;
  sensorWidth: number;
  sensorHeight: number;
  pixelSize: number;
  resolutionX?: number;
  resolutionY?: number;
  isCustom: boolean;
}

export interface TelescopePreset {
  id: string;
  name: string;
  focalLength: number;
  aperture: number;
  type: string;
  isCustom: boolean;
}

export interface ExposureDefaults {
  exposureTime: number;
  gain: number;
  offset: number;
  binning: BinningType;
  filter: string;
  frameCount: number;
  ditherEnabled: boolean;
  ditherEvery: number;
  tracking: TrackingType;
  targetType: TargetType;
  bortle: number;
}

export interface FOVDisplaySettings {
  enabled: boolean;
  gridType: GridType;
  showCoordinateGrid: boolean;
  showConstellations: boolean;
  showConstellationBoundaries: boolean;
  showDSOLabels: boolean;
  overlayOpacity: number;
  frameColor: string;
}

// ============================================================================
// Store State
// ============================================================================

interface EquipmentState {
  // Active equipment
  activeCameraId: string | null;
  activeTelescopeId: string | null;
  
  // Current settings (can be from preset or manual)
  sensorWidth: number;
  sensorHeight: number;
  focalLength: number;
  pixelSize: number;
  aperture: number;
  rotationAngle: number;
  
  // Mosaic settings
  mosaic: MosaicSettings;
  
  // FOV display settings
  fovDisplay: FOVDisplaySettings;
  
  // Exposure defaults
  exposureDefaults: ExposureDefaults;
  
  // Custom presets (user-defined, not from Tauri)
  customCameras: CameraPreset[];
  customTelescopes: TelescopePreset[];
  
  // Actions - Equipment selection
  setActiveCamera: (id: string | null) => void;
  setActiveTelescope: (id: string | null) => void;
  
  // Actions - Manual settings
  setSensorWidth: (width: number) => void;
  setSensorHeight: (height: number) => void;
  setFocalLength: (length: number) => void;
  setPixelSize: (size: number) => void;
  setAperture: (aperture: number) => void;
  setRotationAngle: (angle: number) => void;
  
  // Actions - Batch update
  setCameraSettings: (settings: {
    sensorWidth?: number;
    sensorHeight?: number;
    pixelSize?: number;
  }) => void;
  setTelescopeSettings: (settings: {
    focalLength?: number;
    aperture?: number;
  }) => void;
  
  // Actions - Mosaic
  setMosaic: (mosaic: MosaicSettings) => void;
  setMosaicEnabled: (enabled: boolean) => void;
  setMosaicGrid: (rows: number, cols: number) => void;
  setMosaicOverlap: (overlap: number, unit?: 'percent' | 'pixels') => void;
  
  // Actions - FOV Display
  setFOVDisplay: (settings: Partial<FOVDisplaySettings>) => void;
  setFOVEnabled: (enabled: boolean) => void;
  setGridType: (type: GridType) => void;
  
  // Actions - Exposure Defaults
  setExposureDefaults: (defaults: Partial<ExposureDefaults>) => void;
  
  // Actions - Custom Presets
  addCustomCamera: (camera: Omit<CameraPreset, 'id' | 'isCustom'>) => void;
  removeCustomCamera: (id: string) => void;
  updateCustomCamera: (id: string, updates: Partial<CameraPreset>) => void;
  addCustomTelescope: (telescope: Omit<TelescopePreset, 'id' | 'isCustom'>) => void;
  removeCustomTelescope: (id: string) => void;
  updateCustomTelescope: (id: string, updates: Partial<TelescopePreset>) => void;
  
  // Actions - Apply preset
  applyCamera: (camera: CameraPreset) => void;
  applyTelescope: (telescope: TelescopePreset) => void;
  
  // Actions - Reset
  resetToDefaults: () => void;
  
  // Computed values (as getters)
  getFOVWidth: () => number;
  getFOVHeight: () => number;
  getImageScale: () => number;
  getFRatio: () => number;
  getResolution: () => { width: number; height: number };
  getMosaicCoverage: () => { width: number; height: number; totalPanels: number } | null;
}

// ============================================================================
// Default Values
// ============================================================================

const DEFAULT_MOSAIC: MosaicSettings = {
  enabled: false,
  rows: 2,
  cols: 2,
  overlap: 20,
  overlapUnit: 'percent',
};

const DEFAULT_FOV_DISPLAY: FOVDisplaySettings = {
  enabled: false,
  gridType: 'crosshair',
  showCoordinateGrid: true,
  showConstellations: false,
  showConstellationBoundaries: false,
  showDSOLabels: true,
  overlayOpacity: 80,
  frameColor: '#ef4444',
};

const DEFAULT_EXPOSURE: ExposureDefaults = {
  exposureTime: 120,
  gain: 100,
  offset: 30,
  binning: '1x1',
  filter: 'L',
  frameCount: 30,
  ditherEnabled: true,
  ditherEvery: 3,
  tracking: 'guided',
  targetType: 'nebula',
  bortle: 5,
};

// ============================================================================
// Store
// ============================================================================

export const useEquipmentStore = create<EquipmentState>()(
  persist(
    (set, get) => ({
      // Initial state
      activeCameraId: null,
      activeTelescopeId: null,
      
      sensorWidth: 23.5,
      sensorHeight: 15.6,
      focalLength: 400,
      pixelSize: 3.76,
      aperture: 80,
      rotationAngle: 0,
      
      mosaic: DEFAULT_MOSAIC,
      fovDisplay: DEFAULT_FOV_DISPLAY,
      exposureDefaults: DEFAULT_EXPOSURE,
      
      customCameras: [],
      customTelescopes: [],
      
      // Equipment selection
      setActiveCamera: (id) => set({ activeCameraId: id }),
      setActiveTelescope: (id) => set({ activeTelescopeId: id }),
      
      // Manual settings
      setSensorWidth: (sensorWidth) => set({ sensorWidth, activeCameraId: null }),
      setSensorHeight: (sensorHeight) => set({ sensorHeight, activeCameraId: null }),
      setFocalLength: (focalLength) => set({ focalLength, activeTelescopeId: null }),
      setPixelSize: (pixelSize) => set({ pixelSize, activeCameraId: null }),
      setAperture: (aperture) => set({ aperture, activeTelescopeId: null }),
      setRotationAngle: (rotationAngle) => set({ rotationAngle }),
      
      // Batch update
      setCameraSettings: (settings) => set((state) => ({
        sensorWidth: settings.sensorWidth ?? state.sensorWidth,
        sensorHeight: settings.sensorHeight ?? state.sensorHeight,
        pixelSize: settings.pixelSize ?? state.pixelSize,
        activeCameraId: null,
      })),
      
      setTelescopeSettings: (settings) => set((state) => ({
        focalLength: settings.focalLength ?? state.focalLength,
        aperture: settings.aperture ?? state.aperture,
        activeTelescopeId: null,
      })),
      
      // Mosaic
      setMosaic: (mosaic) => set({ mosaic }),
      setMosaicEnabled: (enabled) => set((state) => ({
        mosaic: { ...state.mosaic, enabled },
      })),
      setMosaicGrid: (rows, cols) => set((state) => ({
        mosaic: { ...state.mosaic, rows, cols },
      })),
      setMosaicOverlap: (overlap, unit) => set((state) => ({
        mosaic: {
          ...state.mosaic,
          overlap,
          overlapUnit: unit ?? state.mosaic.overlapUnit,
        },
      })),
      
      // FOV Display
      setFOVDisplay: (settings) => set((state) => ({
        fovDisplay: { ...state.fovDisplay, ...settings },
      })),
      setFOVEnabled: (enabled) => set((state) => ({
        fovDisplay: { ...state.fovDisplay, enabled },
      })),
      setGridType: (gridType) => set((state) => ({
        fovDisplay: { ...state.fovDisplay, gridType },
      })),
      
      // Exposure Defaults
      setExposureDefaults: (defaults) => set((state) => ({
        exposureDefaults: { ...state.exposureDefaults, ...defaults },
      })),
      
      // Custom Cameras
      addCustomCamera: (camera) => {
        const id = `camera-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        set((state) => ({
          customCameras: [...state.customCameras, { ...camera, id, isCustom: true }],
        }));
      },
      
      removeCustomCamera: (id) => set((state) => ({
        customCameras: state.customCameras.filter((c) => c.id !== id),
        activeCameraId: state.activeCameraId === id ? null : state.activeCameraId,
      })),
      
      updateCustomCamera: (id, updates) => set((state) => ({
        customCameras: state.customCameras.map((c) =>
          c.id === id ? { ...c, ...updates } : c
        ),
      })),
      
      // Custom Telescopes
      addCustomTelescope: (telescope) => {
        const id = `telescope-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        set((state) => ({
          customTelescopes: [...state.customTelescopes, { ...telescope, id, isCustom: true }],
        }));
      },
      
      removeCustomTelescope: (id) => set((state) => ({
        customTelescopes: state.customTelescopes.filter((t) => t.id !== id),
        activeTelescopeId: state.activeTelescopeId === id ? null : state.activeTelescopeId,
      })),
      
      updateCustomTelescope: (id, updates) => set((state) => ({
        customTelescopes: state.customTelescopes.map((t) =>
          t.id === id ? { ...t, ...updates } : t
        ),
      })),
      
      // Apply preset
      applyCamera: (camera) => set({
        activeCameraId: camera.id,
        sensorWidth: camera.sensorWidth,
        sensorHeight: camera.sensorHeight,
        pixelSize: camera.pixelSize,
      }),
      
      applyTelescope: (telescope) => set({
        activeTelescopeId: telescope.id,
        focalLength: telescope.focalLength,
        aperture: telescope.aperture,
      }),
      
      // Reset
      resetToDefaults: () => set({
        activeCameraId: null,
        activeTelescopeId: null,
        sensorWidth: 23.5,
        sensorHeight: 15.6,
        focalLength: 400,
        pixelSize: 3.76,
        aperture: 80,
        rotationAngle: 0,
        mosaic: DEFAULT_MOSAIC,
        fovDisplay: DEFAULT_FOV_DISPLAY,
        exposureDefaults: DEFAULT_EXPOSURE,
      }),
      
      // Computed values
      getFOVWidth: () => {
        const { sensorWidth, focalLength } = get();
        return (2 * Math.atan(sensorWidth / (2 * focalLength)) * 180) / Math.PI;
      },
      
      getFOVHeight: () => {
        const { sensorHeight, focalLength } = get();
        return (2 * Math.atan(sensorHeight / (2 * focalLength)) * 180) / Math.PI;
      },
      
      getImageScale: () => {
        const { pixelSize, focalLength } = get();
        return (206.265 * pixelSize) / focalLength;
      },
      
      getFRatio: () => {
        const { focalLength, aperture } = get();
        return aperture > 0 ? focalLength / aperture : 0;
      },
      
      getResolution: () => {
        const { sensorWidth, sensorHeight, pixelSize } = get();
        return {
          width: Math.round((sensorWidth * 1000) / pixelSize),
          height: Math.round((sensorHeight * 1000) / pixelSize),
        };
      },
      
      getMosaicCoverage: () => {
        const { mosaic } = get();
        if (!mosaic.enabled) return null;
        
        const fovWidth = get().getFOVWidth();
        const fovHeight = get().getFOVHeight();
        const resolution = get().getResolution();
        
        const overlapFactor = mosaic.overlapUnit === 'percent'
          ? (1 - mosaic.overlap / 100)
          : (1 - mosaic.overlap / (resolution.width / mosaic.cols));
        
        return {
          width: fovWidth * mosaic.cols * overlapFactor + fovWidth * (1 - overlapFactor),
          height: fovHeight * mosaic.rows * overlapFactor + fovHeight * (1 - overlapFactor),
          totalPanels: mosaic.rows * mosaic.cols,
        };
      },
    }),
    {
      name: 'starmap-equipment',
      storage: getZustandStorage(),
      version: 1,
      partialize: (state) => ({
        activeCameraId: state.activeCameraId,
        activeTelescopeId: state.activeTelescopeId,
        sensorWidth: state.sensorWidth,
        sensorHeight: state.sensorHeight,
        focalLength: state.focalLength,
        pixelSize: state.pixelSize,
        aperture: state.aperture,
        rotationAngle: state.rotationAngle,
        mosaic: state.mosaic,
        fovDisplay: state.fovDisplay,
        exposureDefaults: state.exposureDefaults,
        customCameras: state.customCameras,
        customTelescopes: state.customTelescopes,
      }),
    }
  )
);

// ============================================================================
// Built-in Presets
// ============================================================================

export const BUILTIN_CAMERA_PRESETS: CameraPreset[] = [
  // Full Frame
  { id: 'ff-35mm', name: 'Full Frame 35mm', sensorWidth: 36, sensorHeight: 24, pixelSize: 4.5, isCustom: false },
  { id: 'sony-a7r4', name: 'Sony A7R IV', sensorWidth: 35.7, sensorHeight: 23.8, pixelSize: 3.76, isCustom: false },
  { id: 'canon-r5', name: 'Canon R5', sensorWidth: 36, sensorHeight: 24, pixelSize: 4.39, isCustom: false },
  { id: 'nikon-z7', name: 'Nikon Z7', sensorWidth: 35.9, sensorHeight: 23.9, pixelSize: 4.34, isCustom: false },
  // APS-C
  { id: 'apsc-canon', name: 'APS-C Canon', sensorWidth: 22.3, sensorHeight: 14.9, pixelSize: 4.3, isCustom: false },
  { id: 'apsc-sony', name: 'APS-C Nikon/Sony', sensorWidth: 23.5, sensorHeight: 15.6, pixelSize: 3.9, isCustom: false },
  { id: 'm43', name: 'Micro 4/3', sensorWidth: 17.3, sensorHeight: 13, pixelSize: 3.75, isCustom: false },
  // ZWO
  { id: 'asi6200', name: 'ASI6200MC Pro', sensorWidth: 36, sensorHeight: 24, pixelSize: 3.76, isCustom: false },
  { id: 'asi2600', name: 'ASI2600MC Pro', sensorWidth: 23.5, sensorHeight: 15.7, pixelSize: 3.76, isCustom: false },
  { id: 'asi2400', name: 'ASI2400MC Pro', sensorWidth: 36, sensorHeight: 24, pixelSize: 5.94, isCustom: false },
  { id: 'asi294', name: 'ASI294MC Pro', sensorWidth: 19.1, sensorHeight: 13, pixelSize: 4.63, isCustom: false },
  { id: 'asi533', name: 'ASI533MC Pro', sensorWidth: 11.31, sensorHeight: 11.31, pixelSize: 3.76, isCustom: false },
  { id: 'asi183', name: 'ASI183MC Pro', sensorWidth: 13.2, sensorHeight: 8.8, pixelSize: 2.4, isCustom: false },
  { id: 'asi071', name: 'ASI071MC Pro', sensorWidth: 23.6, sensorHeight: 15.6, pixelSize: 4.78, isCustom: false },
  { id: 'asi1600', name: 'ASI1600MM Pro', sensorWidth: 17.7, sensorHeight: 13.4, pixelSize: 3.8, isCustom: false },
  { id: 'asi290', name: 'ASI290MM Mini', sensorWidth: 5.6, sensorHeight: 3.2, pixelSize: 2.9, isCustom: false },
  // QHY
  { id: 'qhy600', name: 'QHY600M', sensorWidth: 36, sensorHeight: 24, pixelSize: 3.76, isCustom: false },
  { id: 'qhy268', name: 'QHY268M', sensorWidth: 23.5, sensorHeight: 15.7, pixelSize: 3.76, isCustom: false },
  { id: 'qhy294', name: 'QHY294M Pro', sensorWidth: 19.1, sensorHeight: 13, pixelSize: 4.63, isCustom: false },
  { id: 'qhy533', name: 'QHY533M', sensorWidth: 11.31, sensorHeight: 11.31, pixelSize: 3.76, isCustom: false },
  { id: 'qhy183', name: 'QHY183M', sensorWidth: 13.2, sensorHeight: 8.8, pixelSize: 2.4, isCustom: false },
  { id: 'qhy163', name: 'QHY163M', sensorWidth: 17.7, sensorHeight: 13.4, pixelSize: 3.8, isCustom: false },
  // Player One
  { id: 'poseidon', name: 'Player One Poseidon-M', sensorWidth: 23.5, sensorHeight: 15.7, pixelSize: 3.76, isCustom: false },
  { id: 'ares', name: 'Player One Ares-M', sensorWidth: 19.1, sensorHeight: 13, pixelSize: 4.63, isCustom: false },
  { id: 'neptune', name: 'Player One Neptune-M', sensorWidth: 11.31, sensorHeight: 11.31, pixelSize: 3.76, isCustom: false },
];

export const BUILTIN_TELESCOPE_PRESETS: TelescopePreset[] = [
  { id: 'samyang-135', name: 'Samyang 135mm f/2', focalLength: 135, aperture: 67.5, type: 'Lens', isCustom: false },
  { id: 'redcat-51', name: 'RedCat 51', focalLength: 250, aperture: 51, type: 'APO', isCustom: false },
  { id: 'radian-61', name: 'Radian 61', focalLength: 275, aperture: 61, type: 'APO', isCustom: false },
  { id: 'esprit-80', name: 'Esprit 80ED', focalLength: 400, aperture: 80, type: 'APO', isCustom: false },
  { id: 'fsq-85', name: 'FSQ-85ED', focalLength: 450, aperture: 85, type: 'APO', isCustom: false },
  { id: 'esprit-100', name: 'Esprit 100ED', focalLength: 550, aperture: 100, type: 'APO', isCustom: false },
  { id: 'toa-130', name: 'TOA-130F', focalLength: 1000, aperture: 130, type: 'APO', isCustom: false },
  { id: 'edge-8', name: 'EdgeHD 8"', focalLength: 2032, aperture: 203, type: 'SCT', isCustom: false },
  { id: 'edge-925', name: 'EdgeHD 9.25"', focalLength: 2350, aperture: 235, type: 'SCT', isCustom: false },
  { id: 'c11', name: 'C11', focalLength: 2800, aperture: 280, type: 'SCT', isCustom: false },
  { id: 'edge-11', name: 'EdgeHD 11"', focalLength: 2800, aperture: 280, type: 'SCT', isCustom: false },
  { id: 'edge-14', name: 'EdgeHD 14"', focalLength: 3910, aperture: 356, type: 'SCT', isCustom: false },
];

// Helper function to get all cameras (built-in + custom)
export function getAllCameras(): CameraPreset[] {
  const customCameras = useEquipmentStore.getState().customCameras;
  return [...BUILTIN_CAMERA_PRESETS, ...customCameras];
}

// Helper function to get all telescopes (built-in + custom)
export function getAllTelescopes(): TelescopePreset[] {
  const customTelescopes = useEquipmentStore.getState().customTelescopes;
  return [...BUILTIN_TELESCOPE_PRESETS, ...customTelescopes];
}

// Helper function to find camera by id
export function findCameraById(id: string): CameraPreset | undefined {
  return getAllCameras().find((c) => c.id === id);
}

// Helper function to find telescope by id
export function findTelescopeById(id: string): TelescopePreset | undefined {
  return getAllTelescopes().find((t) => t.id === id);
}
