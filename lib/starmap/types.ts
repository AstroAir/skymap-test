// Stellarium Web Engine types
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
  fov: number; // Field of view in degrees
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

// Search result types
export interface SearchResultItem {
  Name: string;
  Type?: 'Comet' | 'Planet' | 'Star' | 'Moon' | 'StellariumObject' | 'DSO' | 'Constellation' | 'Coordinates';
  RA?: number;
  Dec?: number;
  'Common names'?: string;
  M?: string;
  Magnitude?: number;
  Size?: string; // Angular size, e.g., "10'x8'"
  StellariumObj?: StellariumObject;
}

// Framing store types
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

// Sky Survey configuration
export interface SkySurvey {
  id: string;
  name: string;
  url: string;
  description: string;
  category: 'optical' | 'infrared' | 'other';
}

// Available sky surveys (HiPS format)
export const SKY_SURVEYS: SkySurvey[] = [
  // Optical surveys
  {
    id: 'dss',
    name: 'DSS (Digitized Sky Survey)',
    url: 'https://alasky.cds.unistra.fr/DSS/DSSColor/',
    description: 'Classic optical survey from photographic plates',
    category: 'optical',
  },
  {
    id: 'dss2-red',
    name: 'DSS2 Red',
    url: 'https://alasky.cds.unistra.fr/DSS/DSS2-red-XJ-S/',
    description: 'DSS2 Red band survey',
    category: 'optical',
  },
  {
    id: 'dss2-blue',
    name: 'DSS2 Blue',
    url: 'https://alasky.cds.unistra.fr/DSS/DSS2-blue-XJ-S/',
    description: 'DSS2 Blue band survey',
    category: 'optical',
  },
  {
    id: 'panstarrs',
    name: 'PanSTARRS DR1',
    url: 'https://alasky.cds.unistra.fr/Pan-STARRS/DR1/color-z-zg-g/',
    description: 'Panoramic Survey Telescope and Rapid Response System',
    category: 'optical',
  },
  {
    id: 'sdss',
    name: 'SDSS9 Color',
    url: 'https://alasky.cds.unistra.fr/SDSS/DR9/color/',
    description: 'Sloan Digital Sky Survey (northern sky)',
    category: 'optical',
  },
  {
    id: 'mellinger',
    name: 'Mellinger Color',
    url: 'https://alasky.cds.unistra.fr/Mellinger/',
    description: 'Axel Mellinger all-sky panorama',
    category: 'optical',
  },
  // Infrared surveys
  {
    id: '2mass',
    name: '2MASS Color',
    url: 'https://alasky.cds.unistra.fr/2MASS/Color/',
    description: 'Two Micron All Sky Survey (J, H, K bands)',
    category: 'infrared',
  },
  {
    id: 'wise',
    name: 'WISE AllSky',
    url: 'https://alasky.cds.unistra.fr/AllWISE/RGB-W4-W2-W1/',
    description: 'Wide-field Infrared Survey Explorer',
    category: 'infrared',
  },
  {
    id: 'iras',
    name: 'IRIS (IRAS)',
    url: 'https://alasky.cds.unistra.fr/IRISColor/',
    description: 'Improved Reprocessing of IRAS Survey',
    category: 'infrared',
  },
  // Other surveys
  {
    id: 'fermi',
    name: 'Fermi LAT',
    url: 'https://alasky.cds.unistra.fr/Fermi/Color/',
    description: 'Fermi Gamma-ray Space Telescope',
    category: 'other',
  },
  {
    id: 'halpha',
    name: 'H-Alpha Full Sky',
    url: 'https://alasky.cds.unistra.fr/VTSS/Ha/',
    description: 'Hydrogen-alpha emission survey',
    category: 'other',
  },
  {
    id: 'gaia-density',
    name: 'Gaia DR2 Density',
    url: 'https://alasky.cds.unistra.fr/ancillary/GaiaDR2/density-map/',
    description: 'Gaia stellar density map',
    category: 'other',
  },
];

// Sky culture language options
export type SkyCultureLanguage = 'native' | 'en' | 'zh';

// Settings store types
export interface StellariumSettings {
  constellationsLinesVisible: boolean;
  azimuthalLinesVisible: boolean;
  equatorialLinesVisible: boolean;
  meridianLinesVisible: boolean;
  eclipticLinesVisible: boolean;
  atmosphereVisible: boolean;
  landscapesVisible: boolean;
  dsosVisible: boolean;
  // Survey settings
  surveyEnabled: boolean;
  surveyId: string; // ID from SKY_SURVEYS or online survey
  surveyUrl?: string; // Direct URL for online surveys
  // Sky culture language settings
  skyCultureLanguage: SkyCultureLanguage; // Language for constellation/star names
}

// Mount info types
export interface MountInfo {
  Connected: boolean;
  Coordinates: {
    RADegrees: number;
    Dec: number;
  };
}

// Profile info types
export interface ProfileInfo {
  AstrometrySettings: {
    Latitude: number;
    Longitude: number;
    Elevation: number;
  };
}

// Selected object data
export interface SelectedObjectData {
  names: string[];
  ra: string;
  dec: string;
  raDeg: number;
  decDeg: number;
}

declare global {
  interface Window {
    StelWebEngine: (options: {
      wasmFile: string;
      canvas: HTMLCanvasElement;
      translateFn?: (domain: string, text: string) => string;
      onReady: (stel: StellariumEngine) => void;
    }) => void;
  }
}
