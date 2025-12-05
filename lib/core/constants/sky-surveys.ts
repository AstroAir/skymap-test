/**
 * Sky Survey configurations
 * HiPS format surveys for background imagery
 */

// ============================================================================
// Types
// ============================================================================

export interface SkySurvey {
  id: string;
  name: string;
  url: string;
  description: string;
  category: 'optical' | 'infrared' | 'other';
}

// ============================================================================
// Available Sky Surveys
// ============================================================================

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

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get a sky survey by ID
 */
export function getSurveyById(id: string): SkySurvey | undefined {
  return SKY_SURVEYS.find(s => s.id === id);
}

/**
 * Get surveys by category
 */
export function getSurveysByCategory(category: SkySurvey['category']): SkySurvey[] {
  return SKY_SURVEYS.filter(s => s.category === category);
}

/**
 * Get the default survey
 */
export function getDefaultSurvey(): SkySurvey {
  return SKY_SURVEYS[0];
}
