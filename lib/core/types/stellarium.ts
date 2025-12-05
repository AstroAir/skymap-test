/**
 * Stellarium Web Engine type definitions
 */

// ============================================================================
// Engine Types
// ============================================================================

export interface StellariumEngine {
  core: StellariumCore;
  observer: StellariumObserver;
  D2R: number;
  R2D: number;
  getObj: (name: string) => StellariumObject | null;
  createObj: (type: string, options: Record<string, unknown>) => StellariumObject;
  createLayer: (options: { id: string; z: number; visible: boolean }) => StellariumLayer;
  convertFrame: (observer: StellariumObserver, from: string, to: string, vec: number[]) => number[];
  c2s: (vec: number[]) => number[];
  s2c: (ra: number, dec: number) => number[];
  anp: (angle: number) => number;
  anpm: (angle: number) => number;
  pointAndLock: (obj: StellariumObject) => void;
  change: (callback: (obj: unknown, attr: string) => void) => void;
}

export interface StellariumHipsModule {
  visible: boolean;
  url: string;
  addDataSource?: (options: { url: string; key?: string }) => void;
}

export interface StellariumCore {
  observer: StellariumObserver;
  selection: StellariumObject | null;
  time_speed: number;
  fov: number;
  stars: StellariumDataModule;
  skycultures: StellariumDataModule;
  dsos: StellariumDataModule;
  dss: StellariumDataModule;
  hips: StellariumHipsModule;
  milkyway: StellariumDataModule;
  minor_planets: StellariumDataModule;
  planets: StellariumDataModule;
  comets: StellariumCometsModule;
  landscapes: StellariumDataModule;
  constellations: {
    lines_visible: boolean;
    labels_visible: boolean;
  };
  lines: {
    azimuthal: { visible: boolean };
    equatorial: { visible: boolean };
    meridian: { visible: boolean };
    ecliptic: { visible: boolean };
  };
  atmosphere: { visible: boolean };
}

export interface StellariumObserver {
  latitude: number;
  longitude: number;
  elevation: number;
  utc: number;
  azalt: number[];
}

export interface StellariumObject {
  designations: () => string[];
  getInfo: (key: string, observer?: StellariumObserver) => unknown;
  pos: number[];
  color: number[];
  border_color?: number[];
  size: number[];
  frame?: string;
  label?: string;
  update: () => void;
}

export interface StellariumLayer {
  add: (obj: StellariumObject) => void;
}

export interface StellariumDataModule {
  visible?: boolean;
  addDataSource: (options: { url: string; key?: string }) => void;
}

export interface StellariumCometsModule extends StellariumDataModule {
  listObjs?: (observer: StellariumObserver, limit: number, filter: () => boolean) => StellariumObject[];
}

// ============================================================================
// Settings Types
// ============================================================================

export type SkyCultureLanguage = 'native' | 'en' | 'zh';

export interface StellariumSettings {
  constellationsLinesVisible: boolean;
  constellationArtVisible: boolean;
  azimuthalLinesVisible: boolean;
  equatorialLinesVisible: boolean;
  meridianLinesVisible: boolean;
  eclipticLinesVisible: boolean;
  atmosphereVisible: boolean;
  landscapesVisible: boolean;
  dsosVisible: boolean;
  surveyEnabled: boolean;
  surveyId: string;
  surveyUrl?: string;
  skyCultureLanguage: SkyCultureLanguage;
  nightMode: boolean;
  sensorControl: boolean;
}

// ============================================================================
// Framing Types
// ============================================================================

export interface FramingState {
  RAangle: number;
  DECangle: number;
  RAangleString: string;
  DECangleString: string;
  rotationAngle: number;
  showFramingModal: boolean;
  selectedItem: {
    Name: string;
    RA: number;
    Dec: number;
  } | null;
  containerSize: number;
  isSlewing: boolean;
  isSlewingAndCentering: boolean;
}

// ============================================================================
// Mount Types
// ============================================================================

export interface MountInfo {
  Connected: boolean;
  Coordinates: {
    RADegrees: number;
    Dec: number;
  };
}

export interface ProfileInfo {
  AstrometrySettings: {
    Latitude: number;
    Longitude: number;
    Elevation: number;
  };
}

// ============================================================================
// Selected Object Types
// ============================================================================

export interface SelectedObjectData {
  names: string[];
  ra: string;
  dec: string;
  raDeg: number;
  decDeg: number;
  type?: string;
  magnitude?: number;
  size?: string;
  constellation?: string;
}

// ============================================================================
// Global Window Extension
// ============================================================================

declare global {
  interface Window {
    StelWebEngine?: (options: {
      wasmFile: string;
      canvasElement: HTMLCanvasElement;
      translateFn?: (domain: string, text: string) => string;
      onReady: (stel: StellariumEngine) => void;
    }) => void;
  }
}
