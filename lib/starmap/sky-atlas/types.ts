/**
 * Sky Atlas types - ported from N.I.N.A. SkyAtlas
 * Comprehensive DSO catalog and filtering system
 */

// ============================================================================
// Moon Phase Types
// ============================================================================

export type MoonPhase = 
  | 'new'
  | 'waxingCrescent'
  | 'firstQuarter'
  | 'waxingGibbous'
  | 'full'
  | 'waningGibbous'
  | 'lastQuarter'
  | 'waningCrescent';

export const MOON_PHASE_NAMES: Record<MoonPhase, string> = {
  new: 'New Moon',
  waxingCrescent: 'Waxing Crescent',
  firstQuarter: 'First Quarter',
  waxingGibbous: 'Waxing Gibbous',
  full: 'Full Moon',
  waningGibbous: 'Waning Gibbous',
  lastQuarter: 'Last Quarter',
  waningCrescent: 'Waning Crescent',
};

// ============================================================================
// Deep Sky Object Types
// ============================================================================

export type DSOType = 
  | 'Galaxy'
  | 'Nebula'
  | 'OpenCluster'
  | 'GlobularCluster'
  | 'PlanetaryNebula'
  | 'SupernovaRemnant'
  | 'DarkNebula'
  | 'EmissionNebula'
  | 'ReflectionNebula'
  | 'StarCluster'
  | 'DoubleStar'
  | 'Asterism'
  | 'GalaxyCluster'
  | 'Quasar'
  | 'Other';

export interface DeepSkyObject {
  id: string;
  name: string;
  alternateNames?: string[];
  type: DSOType;
  constellation: string;
  
  // Coordinates (J2000)
  ra: number;  // Right Ascension in degrees
  dec: number; // Declination in degrees
  
  // Physical properties
  magnitude?: number;           // Visual magnitude
  surfaceBrightness?: number;   // mag/arcsec²
  sizeMax?: number;             // Maximum size in arcminutes
  sizeMin?: number;             // Minimum size in arcminutes
  positionAngle?: number;       // Position angle in degrees
  
  // Catalog references
  messier?: number;
  ngc?: number;
  ic?: number;
  caldwell?: number;
  
  // Description
  description?: string;
  
  // Calculated at runtime
  altitude?: number;
  azimuth?: number;
  transitTime?: Date;
  riseTime?: Date;
  setTime?: Date;
  moonDistance?: number;
  imagingScore?: number;
}

// ============================================================================
// Filter Types
// ============================================================================

export interface DSOTypeFilter {
  type: DSOType;
  selected: boolean;
  label: string;
}

export interface RangeFilter<T> {
  from: T | null;
  through: T | null;
}

export interface TimeFilter {
  from: Date;
  through: Date;
}

export type OrderByField = 
  | 'name'
  | 'magnitude'
  | 'size'
  | 'altitude'
  | 'transitTime'
  | 'surfaceBrightness'
  | 'moonDistance'
  | 'imagingScore';

export type OrderByDirection = 'asc' | 'desc';

export interface SkyAtlasFilters {
  // Basic search
  objectName: string;
  
  // Date for calculations
  filterDate: Date;
  
  // Object type filter
  objectTypes: DSOTypeFilter[];
  
  // Constellation filter
  constellation: string;
  
  // Coordinate filters
  raRange: RangeFilter<number>;
  decRange: RangeFilter<number>;
  
  // Physical property filters
  magnitudeRange: RangeFilter<number>;
  brightnessRange: RangeFilter<number>;  // Surface brightness
  sizeRange: RangeFilter<number>;        // Size in arcsec
  
  // Observation filters
  minimumAltitude: number;           // Minimum altitude in degrees
  altitudeTimeFrom: Date;            // Start of altitude window
  altitudeTimeThrough: Date;         // End of altitude window
  altitudeDuration: number;          // Minimum duration in hours
  
  // Moon distance filter
  minimumMoonDistance: number;       // Minimum distance from moon in degrees
  
  // Transit time filter
  transitTimeFrom: Date | null;
  transitTimeThrough: Date | null;
  
  // Sorting
  orderByField: OrderByField;
  orderByDirection: OrderByDirection;
}

// ============================================================================
// Nighttime Data Types
// ============================================================================

export interface RiseAndSet {
  rise: Date | null;
  set: Date | null;
}

export interface NighttimeData {
  date: Date;
  referenceDate: Date;
  
  // Sun events
  sunRiseAndSet: RiseAndSet;
  
  // Twilight events
  civilTwilightRiseAndSet: RiseAndSet;      // Sun at -6°
  nauticalTwilightRiseAndSet: RiseAndSet;   // Sun at -12°
  twilightRiseAndSet: RiseAndSet;           // Astronomical, Sun at -18°
  
  // Moon events
  moonRiseAndSet: RiseAndSet;
  moonPhase: MoonPhase;        // Phase name
  moonPhaseValue: number;      // 0 = new, 0.5 = full, 1 = new
  moonIllumination: number;    // 0-100%
}

// ============================================================================
// Search Result Types
// ============================================================================

export interface SkyAtlasSearchResult {
  objects: DeepSkyObject[];
  totalCount: number;
  pageSize: number;
  currentPage: number;
  totalPages: number;
}

export interface SearchProgress {
  isSearching: boolean;
  progress: number;
  message: string;
}

// ============================================================================
// Altitude Data for Charts
// ============================================================================

export interface AltitudePoint {
  time: Date;
  altitude: number;
  azimuth: number;
  isAboveHorizon: boolean;
}

export interface ObjectAltitudeData {
  objectId: string;
  points: AltitudePoint[];
  maxAltitude: number;
  maxAltitudeTime: Date;
  transitTime: Date | null;
  riseTime: Date | null;
  setTime: Date | null;
}

// ============================================================================
// Preset Filters
// ============================================================================

export interface FilterPreset {
  id: string;
  name: string;
  description: string;
  filters: Partial<SkyAtlasFilters>;
}

export const DEFAULT_FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'tonight-best',
    name: "Tonight's Best",
    description: 'Objects visible tonight with good imaging conditions',
    filters: {
      minimumAltitude: 30,
      altitudeDuration: 2,
      minimumMoonDistance: 30,
      orderByField: 'imagingScore',
      orderByDirection: 'desc',
    },
  },
  {
    id: 'galaxies',
    name: 'Galaxies',
    description: 'All galaxy types',
    filters: {
      objectTypes: [{ type: 'Galaxy', selected: true, label: 'Galaxy' }],
      orderByField: 'magnitude',
      orderByDirection: 'asc',
    },
  },
  {
    id: 'nebulae',
    name: 'Nebulae',
    description: 'Emission, reflection, and planetary nebulae',
    filters: {
      objectTypes: [
        { type: 'Nebula', selected: true, label: 'Nebula' },
        { type: 'EmissionNebula', selected: true, label: 'Emission Nebula' },
        { type: 'ReflectionNebula', selected: true, label: 'Reflection Nebula' },
        { type: 'PlanetaryNebula', selected: true, label: 'Planetary Nebula' },
      ],
      orderByField: 'size',
      orderByDirection: 'desc',
    },
  },
  {
    id: 'clusters',
    name: 'Star Clusters',
    description: 'Open and globular clusters',
    filters: {
      objectTypes: [
        { type: 'OpenCluster', selected: true, label: 'Open Cluster' },
        { type: 'GlobularCluster', selected: true, label: 'Globular Cluster' },
      ],
      orderByField: 'magnitude',
      orderByDirection: 'asc',
    },
  },
  {
    id: 'large-objects',
    name: 'Large Objects',
    description: 'Objects larger than 30 arcminutes',
    filters: {
      sizeRange: { from: 1800, through: null }, // 30 arcmin in arcsec
      orderByField: 'size',
      orderByDirection: 'desc',
    },
  },
  {
    id: 'bright-objects',
    name: 'Bright Objects',
    description: 'Objects brighter than magnitude 8',
    filters: {
      magnitudeRange: { from: null, through: 8 },
      orderByField: 'magnitude',
      orderByDirection: 'asc',
    },
  },
  {
    id: 'messier',
    name: 'Messier Catalog',
    description: 'All 110 Messier objects',
    filters: {
      objectName: 'M',
      orderByField: 'name',
      orderByDirection: 'asc',
    },
  },
];

// ============================================================================
// Constellation Data
// ============================================================================

export const CONSTELLATIONS = [
  'And', 'Ant', 'Aps', 'Aql', 'Aqr', 'Ara', 'Ari', 'Aur', 'Boo', 'CMa',
  'CMi', 'CVn', 'Cae', 'Cam', 'Cap', 'Car', 'Cas', 'Cen', 'Cep', 'Cet',
  'Cha', 'Cir', 'Cnc', 'Col', 'Com', 'CrA', 'CrB', 'Crt', 'Cru', 'Crv',
  'Cyg', 'Del', 'Dor', 'Dra', 'Equ', 'Eri', 'For', 'Gem', 'Gru', 'Her',
  'Hor', 'Hya', 'Hyi', 'Ind', 'Lac', 'Leo', 'Lep', 'Lib', 'LMi', 'Lup',
  'Lyn', 'Lyr', 'Men', 'Mic', 'Mon', 'Mus', 'Nor', 'Oct', 'Oph', 'Ori',
  'Pav', 'Peg', 'Per', 'Phe', 'Pic', 'PsA', 'Psc', 'Pup', 'Pyx', 'Ret',
  'Scl', 'Sco', 'Sct', 'Ser', 'Sex', 'Sge', 'Sgr', 'Tau', 'Tel', 'TrA',
  'Tri', 'Tuc', 'UMa', 'UMi', 'Vel', 'Vir', 'Vol', 'Vul'
];

export const CONSTELLATION_NAMES: Record<string, string> = {
  And: 'Andromeda', Ant: 'Antlia', Aps: 'Apus', Aql: 'Aquila', Aqr: 'Aquarius',
  Ara: 'Ara', Ari: 'Aries', Aur: 'Auriga', Boo: 'Boötes', CMa: 'Canis Major',
  CMi: 'Canis Minor', CVn: 'Canes Venatici', Cae: 'Caelum', Cam: 'Camelopardalis',
  Cap: 'Capricornus', Car: 'Carina', Cas: 'Cassiopeia', Cen: 'Centaurus',
  Cep: 'Cepheus', Cet: 'Cetus', Cha: 'Chamaeleon', Cir: 'Circinus', Cnc: 'Cancer',
  Col: 'Columba', Com: 'Coma Berenices', CrA: 'Corona Australis', CrB: 'Corona Borealis',
  Crt: 'Crater', Cru: 'Crux', Crv: 'Corvus', Cyg: 'Cygnus', Del: 'Delphinus',
  Dor: 'Dorado', Dra: 'Draco', Equ: 'Equuleus', Eri: 'Eridanus', For: 'Fornax',
  Gem: 'Gemini', Gru: 'Grus', Her: 'Hercules', Hor: 'Horologium', Hya: 'Hydra',
  Hyi: 'Hydrus', Ind: 'Indus', Lac: 'Lacerta', Leo: 'Leo', Lep: 'Lepus',
  Lib: 'Libra', LMi: 'Leo Minor', Lup: 'Lupus', Lyn: 'Lynx', Lyr: 'Lyra',
  Men: 'Mensa', Mic: 'Microscopium', Mon: 'Monoceros', Mus: 'Musca', Nor: 'Norma',
  Oct: 'Octans', Oph: 'Ophiuchus', Ori: 'Orion', Pav: 'Pavo', Peg: 'Pegasus',
  Per: 'Perseus', Phe: 'Phoenix', Pic: 'Pictor', PsA: 'Piscis Austrinus', Psc: 'Pisces',
  Pup: 'Puppis', Pyx: 'Pyxis', Ret: 'Reticulum', Scl: 'Sculptor', Sco: 'Scorpius',
  Sct: 'Scutum', Ser: 'Serpens', Sex: 'Sextans', Sge: 'Sagitta', Sgr: 'Sagittarius',
  Tau: 'Taurus', Tel: 'Telescopium', TrA: 'Triangulum Australe', Tri: 'Triangulum',
  Tuc: 'Tucana', UMa: 'Ursa Major', UMi: 'Ursa Minor', Vel: 'Vela', Vir: 'Virgo',
  Vol: 'Volans', Vul: 'Vulpecula'
};

// ============================================================================
// DSO Type Labels
// ============================================================================

export const DSO_TYPE_LABELS: Record<DSOType, string> = {
  Galaxy: 'Galaxy',
  Nebula: 'Nebula',
  OpenCluster: 'Open Cluster',
  GlobularCluster: 'Globular Cluster',
  PlanetaryNebula: 'Planetary Nebula',
  SupernovaRemnant: 'Supernova Remnant',
  DarkNebula: 'Dark Nebula',
  EmissionNebula: 'Emission Nebula',
  ReflectionNebula: 'Reflection Nebula',
  StarCluster: 'Star Cluster',
  DoubleStar: 'Double Star',
  Asterism: 'Asterism',
  GalaxyCluster: 'Galaxy Cluster',
  Quasar: 'Quasar',
  Other: 'Other',
};
