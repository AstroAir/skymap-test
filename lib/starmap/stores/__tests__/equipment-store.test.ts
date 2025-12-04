/**
 * @jest-environment jsdom
 */
import {
  useEquipmentStore,
  BUILTIN_CAMERA_PRESETS,
  BUILTIN_TELESCOPE_PRESETS,
  getAllCameras,
  getAllTelescopes,
  findCameraById,
  findTelescopeById,
} from '../equipment-store';

// Mock zustand persist
jest.mock('zustand/middleware', () => ({
  persist: (config: unknown) => config,
}));

// Default state for reset
const DEFAULT_STATE = {
  activeCameraId: null,
  activeTelescopeId: null,
  sensorWidth: 23.5,
  sensorHeight: 15.6,
  focalLength: 400,
  pixelSize: 3.76,
  aperture: 80,
  rotationAngle: 0,
  mosaic: {
    enabled: false,
    rows: 2,
    cols: 2,
    overlap: 20,
    overlapUnit: 'percent' as const,
  },
  fovDisplay: {
    enabled: false,
    gridType: 'crosshair' as const,
    showCoordinateGrid: true,
    showConstellations: false,
    showConstellationBoundaries: false,
    showDSOLabels: true,
    overlayOpacity: 80,
    frameColor: '#ef4444',
  },
  exposureDefaults: {
    exposureTime: 120,
    gain: 100,
    offset: 30,
    binning: '1x1' as const,
    filter: 'L',
    frameCount: 30,
    ditherEnabled: true,
    ditherEvery: 3,
    tracking: 'guided' as const,
    targetType: 'nebula' as const,
    bortle: 5,
  },
  customCameras: [],
  customTelescopes: [],
};

describe('useEquipmentStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useEquipmentStore.setState({
      ...DEFAULT_STATE,
      customCameras: [],
      customTelescopes: [],
    });
  });

  describe('initial state', () => {
    it('has default camera settings', () => {
      const state = useEquipmentStore.getState();
      expect(state.sensorWidth).toBe(23.5);
      expect(state.sensorHeight).toBe(15.6);
      expect(state.pixelSize).toBe(3.76);
    });

    it('has default telescope settings', () => {
      const state = useEquipmentStore.getState();
      expect(state.focalLength).toBe(400);
      expect(state.aperture).toBe(80);
    });

    it('has default mosaic settings', () => {
      const state = useEquipmentStore.getState();
      expect(state.mosaic.enabled).toBe(false);
      expect(state.mosaic.rows).toBe(2);
      expect(state.mosaic.cols).toBe(2);
      expect(state.mosaic.overlap).toBe(20);
      expect(state.mosaic.overlapUnit).toBe('percent');
    });

    it('has default FOV display settings', () => {
      const state = useEquipmentStore.getState();
      expect(state.fovDisplay.enabled).toBe(false);
      expect(state.fovDisplay.gridType).toBe('crosshair');
      expect(state.fovDisplay.overlayOpacity).toBe(80);
    });

    it('has default exposure settings', () => {
      const state = useEquipmentStore.getState();
      expect(state.exposureDefaults.exposureTime).toBe(120);
      expect(state.exposureDefaults.gain).toBe(100);
      expect(state.exposureDefaults.binning).toBe('1x1');
      expect(state.exposureDefaults.bortle).toBe(5);
    });

    it('has no active camera or telescope', () => {
      const state = useEquipmentStore.getState();
      expect(state.activeCameraId).toBeNull();
      expect(state.activeTelescopeId).toBeNull();
    });
  });

  describe('camera settings', () => {
    it('setSensorWidth updates width and clears active camera', () => {
      useEquipmentStore.getState().setActiveCamera('test-camera');
      useEquipmentStore.getState().setSensorWidth(36);
      
      const state = useEquipmentStore.getState();
      expect(state.sensorWidth).toBe(36);
      expect(state.activeCameraId).toBeNull();
    });

    it('setSensorHeight updates height', () => {
      useEquipmentStore.getState().setSensorHeight(24);
      expect(useEquipmentStore.getState().sensorHeight).toBe(24);
    });

    it('setPixelSize updates pixel size', () => {
      useEquipmentStore.getState().setPixelSize(5.94);
      expect(useEquipmentStore.getState().pixelSize).toBe(5.94);
    });

    it('setCameraSettings updates multiple settings at once', () => {
      useEquipmentStore.getState().setCameraSettings({
        sensorWidth: 36,
        sensorHeight: 24,
        pixelSize: 4.5,
      });
      
      const state = useEquipmentStore.getState();
      expect(state.sensorWidth).toBe(36);
      expect(state.sensorHeight).toBe(24);
      expect(state.pixelSize).toBe(4.5);
    });
  });

  describe('telescope settings', () => {
    it('setFocalLength updates focal length and clears active telescope', () => {
      useEquipmentStore.getState().setActiveTelescope('test-telescope');
      useEquipmentStore.getState().setFocalLength(1000);
      
      const state = useEquipmentStore.getState();
      expect(state.focalLength).toBe(1000);
      expect(state.activeTelescopeId).toBeNull();
    });

    it('setAperture updates aperture', () => {
      useEquipmentStore.getState().setAperture(200);
      expect(useEquipmentStore.getState().aperture).toBe(200);
    });

    it('setTelescopeSettings updates multiple settings at once', () => {
      useEquipmentStore.getState().setTelescopeSettings({
        focalLength: 2000,
        aperture: 280,
      });
      
      const state = useEquipmentStore.getState();
      expect(state.focalLength).toBe(2000);
      expect(state.aperture).toBe(280);
    });
  });

  describe('rotation', () => {
    it('setRotationAngle updates angle', () => {
      useEquipmentStore.getState().setRotationAngle(45);
      expect(useEquipmentStore.getState().rotationAngle).toBe(45);
    });

    it('can set negative rotation', () => {
      useEquipmentStore.getState().setRotationAngle(-90);
      expect(useEquipmentStore.getState().rotationAngle).toBe(-90);
    });
  });

  describe('mosaic settings', () => {
    it('setMosaic updates all mosaic settings', () => {
      useEquipmentStore.getState().setMosaic({
        enabled: true,
        rows: 3,
        cols: 3,
        overlap: 15,
        overlapUnit: 'pixels',
      });
      
      const { mosaic } = useEquipmentStore.getState();
      expect(mosaic.enabled).toBe(true);
      expect(mosaic.rows).toBe(3);
      expect(mosaic.cols).toBe(3);
      expect(mosaic.overlap).toBe(15);
      expect(mosaic.overlapUnit).toBe('pixels');
    });

    it('setMosaicEnabled toggles enabled state', () => {
      useEquipmentStore.getState().setMosaicEnabled(true);
      expect(useEquipmentStore.getState().mosaic.enabled).toBe(true);
      
      useEquipmentStore.getState().setMosaicEnabled(false);
      expect(useEquipmentStore.getState().mosaic.enabled).toBe(false);
    });

    it('setMosaicGrid updates rows and cols', () => {
      useEquipmentStore.getState().setMosaicGrid(4, 5);
      
      const { mosaic } = useEquipmentStore.getState();
      expect(mosaic.rows).toBe(4);
      expect(mosaic.cols).toBe(5);
    });

    it('setMosaicOverlap updates overlap and optionally unit', () => {
      useEquipmentStore.getState().setMosaicOverlap(30, 'percent');
      
      const { mosaic } = useEquipmentStore.getState();
      expect(mosaic.overlap).toBe(30);
      expect(mosaic.overlapUnit).toBe('percent');
    });
  });

  describe('FOV display settings', () => {
    it('setFOVEnabled toggles enabled state', () => {
      useEquipmentStore.getState().setFOVEnabled(true);
      expect(useEquipmentStore.getState().fovDisplay.enabled).toBe(true);
    });

    it('setGridType updates grid type', () => {
      useEquipmentStore.getState().setGridType('thirds');
      expect(useEquipmentStore.getState().fovDisplay.gridType).toBe('thirds');
    });

    it('setFOVDisplay updates partial settings', () => {
      useEquipmentStore.getState().setFOVDisplay({
        overlayOpacity: 50,
        frameColor: '#3b82f6',
      });
      
      const { fovDisplay } = useEquipmentStore.getState();
      expect(fovDisplay.overlayOpacity).toBe(50);
      expect(fovDisplay.frameColor).toBe('#3b82f6');
      expect(fovDisplay.gridType).toBe('crosshair'); // unchanged
    });
  });

  describe('exposure defaults', () => {
    it('setExposureDefaults updates partial settings', () => {
      useEquipmentStore.getState().setExposureDefaults({
        exposureTime: 300,
        gain: 200,
        bortle: 3,
      });
      
      const { exposureDefaults } = useEquipmentStore.getState();
      expect(exposureDefaults.exposureTime).toBe(300);
      expect(exposureDefaults.gain).toBe(200);
      expect(exposureDefaults.bortle).toBe(3);
      expect(exposureDefaults.filter).toBe('L'); // unchanged
    });

    it('updates binning', () => {
      useEquipmentStore.getState().setExposureDefaults({ binning: '2x2' });
      expect(useEquipmentStore.getState().exposureDefaults.binning).toBe('2x2');
    });

    it('updates dither settings', () => {
      useEquipmentStore.getState().setExposureDefaults({
        ditherEnabled: false,
        ditherEvery: 5,
      });
      
      const { exposureDefaults } = useEquipmentStore.getState();
      expect(exposureDefaults.ditherEnabled).toBe(false);
      expect(exposureDefaults.ditherEvery).toBe(5);
    });
  });

  describe('custom presets', () => {
    it('addCustomCamera adds a new camera', () => {
      useEquipmentStore.getState().addCustomCamera({
        name: 'My Camera',
        sensorWidth: 22.5,
        sensorHeight: 15.0,
        pixelSize: 4.0,
      });
      
      const { customCameras } = useEquipmentStore.getState();
      expect(customCameras).toHaveLength(1);
      expect(customCameras[0].name).toBe('My Camera');
      expect(customCameras[0].isCustom).toBe(true);
    });

    it('removeCustomCamera removes camera and clears active if needed', () => {
      useEquipmentStore.getState().addCustomCamera({
        name: 'My Camera',
        sensorWidth: 22.5,
        sensorHeight: 15.0,
        pixelSize: 4.0,
      });
      
      const cameraId = useEquipmentStore.getState().customCameras[0].id;
      useEquipmentStore.getState().setActiveCamera(cameraId);
      useEquipmentStore.getState().removeCustomCamera(cameraId);
      
      expect(useEquipmentStore.getState().customCameras).toHaveLength(0);
      expect(useEquipmentStore.getState().activeCameraId).toBeNull();
    });

    it('addCustomTelescope adds a new telescope', () => {
      useEquipmentStore.getState().addCustomTelescope({
        name: 'My Telescope',
        focalLength: 1200,
        aperture: 150,
        type: 'Newtonian',
      });
      
      const { customTelescopes } = useEquipmentStore.getState();
      expect(customTelescopes).toHaveLength(1);
      expect(customTelescopes[0].name).toBe('My Telescope');
      expect(customTelescopes[0].type).toBe('Newtonian');
    });

    it('updateCustomCamera updates camera properties', () => {
      useEquipmentStore.getState().addCustomCamera({
        name: 'My Camera',
        sensorWidth: 22.5,
        sensorHeight: 15.0,
        pixelSize: 4.0,
      });
      
      const cameraId = useEquipmentStore.getState().customCameras[0].id;
      useEquipmentStore.getState().updateCustomCamera(cameraId, { name: 'Updated Camera' });
      
      expect(useEquipmentStore.getState().customCameras[0].name).toBe('Updated Camera');
    });
  });

  describe('apply presets', () => {
    it('applyCamera updates settings and sets active ID', () => {
      const camera = BUILTIN_CAMERA_PRESETS[0];
      useEquipmentStore.getState().applyCamera(camera);
      
      const state = useEquipmentStore.getState();
      expect(state.activeCameraId).toBe(camera.id);
      expect(state.sensorWidth).toBe(camera.sensorWidth);
      expect(state.sensorHeight).toBe(camera.sensorHeight);
      expect(state.pixelSize).toBe(camera.pixelSize);
    });

    it('applyTelescope updates settings and sets active ID', () => {
      const telescope = BUILTIN_TELESCOPE_PRESETS[0];
      useEquipmentStore.getState().applyTelescope(telescope);
      
      const state = useEquipmentStore.getState();
      expect(state.activeTelescopeId).toBe(telescope.id);
      expect(state.focalLength).toBe(telescope.focalLength);
      expect(state.aperture).toBe(telescope.aperture);
    });
  });

  describe('reset', () => {
    it('resetToDefaults restores all defaults', () => {
      // Change various settings
      useEquipmentStore.getState().setSensorWidth(100);
      useEquipmentStore.getState().setFocalLength(2000);
      useEquipmentStore.getState().setMosaicEnabled(true);
      useEquipmentStore.getState().setFOVEnabled(true);
      useEquipmentStore.getState().setExposureDefaults({ exposureTime: 600 });
      
      // Reset
      useEquipmentStore.getState().resetToDefaults();
      
      const state = useEquipmentStore.getState();
      expect(state.sensorWidth).toBe(23.5);
      expect(state.focalLength).toBe(400);
      expect(state.mosaic.enabled).toBe(false);
      expect(state.fovDisplay.enabled).toBe(false);
      expect(state.exposureDefaults.exposureTime).toBe(120);
    });
  });

  describe('computed values', () => {
    it('getFOVWidth calculates correctly', () => {
      useEquipmentStore.getState().setSensorWidth(36);
      useEquipmentStore.getState().setFocalLength(500);
      
      const fovWidth = useEquipmentStore.getState().getFOVWidth();
      // FOV = 2 * atan(sensor / (2 * focal)) * 180 / PI
      const expected = (2 * Math.atan(36 / 1000) * 180) / Math.PI;
      expect(fovWidth).toBeCloseTo(expected, 4);
    });

    it('getFOVHeight calculates correctly', () => {
      useEquipmentStore.getState().setSensorHeight(24);
      useEquipmentStore.getState().setFocalLength(500);
      
      const fovHeight = useEquipmentStore.getState().getFOVHeight();
      const expected = (2 * Math.atan(24 / 1000) * 180) / Math.PI;
      expect(fovHeight).toBeCloseTo(expected, 4);
    });

    it('getImageScale calculates correctly', () => {
      useEquipmentStore.getState().setPixelSize(3.76);
      useEquipmentStore.getState().setFocalLength(400);
      
      const imageScale = useEquipmentStore.getState().getImageScale();
      const expected = (206.265 * 3.76) / 400;
      expect(imageScale).toBeCloseTo(expected, 4);
    });

    it('getFRatio calculates correctly', () => {
      useEquipmentStore.getState().setFocalLength(400);
      useEquipmentStore.getState().setAperture(80);
      
      const fRatio = useEquipmentStore.getState().getFRatio();
      expect(fRatio).toBe(5);
    });

    it('getResolution calculates correctly', () => {
      useEquipmentStore.getState().setSensorWidth(23.5);
      useEquipmentStore.getState().setSensorHeight(15.6);
      useEquipmentStore.getState().setPixelSize(3.76);
      
      const resolution = useEquipmentStore.getState().getResolution();
      expect(resolution.width).toBe(Math.round((23.5 * 1000) / 3.76));
      expect(resolution.height).toBe(Math.round((15.6 * 1000) / 3.76));
    });

    it('getMosaicCoverage returns null when mosaic disabled', () => {
      useEquipmentStore.getState().setMosaicEnabled(false);
      expect(useEquipmentStore.getState().getMosaicCoverage()).toBeNull();
    });

    it('getMosaicCoverage calculates coverage when enabled', () => {
      useEquipmentStore.getState().setMosaicEnabled(true);
      useEquipmentStore.getState().setMosaicGrid(2, 3);
      
      const coverage = useEquipmentStore.getState().getMosaicCoverage();
      expect(coverage).not.toBeNull();
      expect(coverage!.totalPanels).toBe(6);
    });
  });

  describe('helper functions', () => {
    it('getAllCameras returns builtin and custom cameras', () => {
      useEquipmentStore.getState().addCustomCamera({
        name: 'My Camera',
        sensorWidth: 22.5,
        sensorHeight: 15.0,
        pixelSize: 4.0,
      });
      
      const cameras = getAllCameras();
      expect(cameras.length).toBe(BUILTIN_CAMERA_PRESETS.length + 1);
    });

    it('getAllTelescopes returns builtin and custom telescopes', () => {
      useEquipmentStore.getState().addCustomTelescope({
        name: 'My Telescope',
        focalLength: 1200,
        aperture: 150,
        type: 'Newtonian',
      });
      
      const telescopes = getAllTelescopes();
      expect(telescopes.length).toBe(BUILTIN_TELESCOPE_PRESETS.length + 1);
    });

    it('findCameraById finds builtin camera', () => {
      const camera = findCameraById('asi6200');
      expect(camera).toBeDefined();
      expect(camera?.name).toBe('ASI6200MC Pro');
    });

    it('findCameraById finds custom camera', () => {
      useEquipmentStore.getState().addCustomCamera({
        name: 'My Camera',
        sensorWidth: 22.5,
        sensorHeight: 15.0,
        pixelSize: 4.0,
      });
      
      const customId = useEquipmentStore.getState().customCameras[0].id;
      const camera = findCameraById(customId);
      expect(camera).toBeDefined();
      expect(camera?.name).toBe('My Camera');
    });

    it('findTelescopeById finds builtin telescope', () => {
      const telescope = findTelescopeById('redcat-51');
      expect(telescope).toBeDefined();
      expect(telescope?.name).toBe('RedCat 51');
    });
  });

  describe('builtin presets', () => {
    it('has expected number of camera presets', () => {
      expect(BUILTIN_CAMERA_PRESETS.length).toBeGreaterThan(20);
    });

    it('has expected number of telescope presets', () => {
      expect(BUILTIN_TELESCOPE_PRESETS.length).toBeGreaterThan(10);
    });

    it('camera presets have required properties', () => {
      BUILTIN_CAMERA_PRESETS.forEach((camera) => {
        expect(camera.id).toBeDefined();
        expect(camera.name).toBeDefined();
        expect(camera.sensorWidth).toBeGreaterThan(0);
        expect(camera.sensorHeight).toBeGreaterThan(0);
        expect(camera.pixelSize).toBeGreaterThan(0);
        expect(camera.isCustom).toBe(false);
      });
    });

    it('telescope presets have required properties', () => {
      BUILTIN_TELESCOPE_PRESETS.forEach((telescope) => {
        expect(telescope.id).toBeDefined();
        expect(telescope.name).toBeDefined();
        expect(telescope.focalLength).toBeGreaterThan(0);
        expect(telescope.aperture).toBeGreaterThan(0);
        expect(telescope.isCustom).toBe(false);
      });
    });
  });
});
