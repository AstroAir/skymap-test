/**
 * Equipment Presets - Sensor and Telescope preset data
 * 
 * Contains predefined configurations for common astrophotography equipment.
 * These presets can be extended with user-defined custom presets from equipment store.
 */

// ============================================================================
// Types
// ============================================================================

export interface SensorPreset {
  name: string;
  width: number;
  height: number;
  pixelSize?: number;
  resolution?: string;
}

export interface TelescopePreset {
  name: string;
  focalLength: number;
  aperture: number;
  type: string;
}

export interface GridOption {
  value: GridType;
  label: string;
  icon: string;
}

export type GridType = 'none' | 'crosshair' | 'thirds' | 'golden' | 'diagonal';

// ============================================================================
// Sensor Presets
// ============================================================================

export const SENSOR_PRESETS: Record<string, SensorPreset[]> = {
  fullFrame: [
    { name: 'Full Frame 35mm', width: 36, height: 24, pixelSize: 4.5, resolution: '6000×4000' },
    { name: 'Sony A7R IV', width: 35.7, height: 23.8, pixelSize: 3.76, resolution: '9504×6336' },
    { name: 'Canon R5', width: 36, height: 24, pixelSize: 4.39, resolution: '8192×5464' },
    { name: 'Nikon Z7', width: 35.9, height: 23.9, pixelSize: 4.34, resolution: '8256×5504' },
  ],
  apsc: [
    { name: 'APS-C Canon', width: 22.3, height: 14.9, pixelSize: 4.3, resolution: '5184×3456' },
    { name: 'APS-C Nikon/Sony', width: 23.5, height: 15.6, pixelSize: 3.9, resolution: '6000×4000' },
    { name: 'Micro 4/3', width: 17.3, height: 13, pixelSize: 3.75, resolution: '4608×3456' },
    { name: '1" Sensor', width: 13.2, height: 8.8, pixelSize: 2.4, resolution: '5472×3648' },
  ],
  zwo: [
    { name: 'ASI6200MC Pro', width: 36, height: 24, pixelSize: 3.76, resolution: '9576×6388' },
    { name: 'ASI2600MC Pro', width: 23.5, height: 15.7, pixelSize: 3.76, resolution: '6248×4176' },
    { name: 'ASI2400MC Pro', width: 36, height: 24, pixelSize: 5.94, resolution: '6072×4042' },
    { name: 'ASI294MC Pro', width: 19.1, height: 13, pixelSize: 4.63, resolution: '4144×2822' },
    { name: 'ASI533MC Pro', width: 11.31, height: 11.31, pixelSize: 3.76, resolution: '3008×3008' },
    { name: 'ASI183MC Pro', width: 13.2, height: 8.8, pixelSize: 2.4, resolution: '5496×3672' },
    { name: 'ASI071MC Pro', width: 23.6, height: 15.6, pixelSize: 4.78, resolution: '4944×3284' },
    { name: 'ASI1600MM Pro', width: 17.7, height: 13.4, pixelSize: 3.8, resolution: '4656×3520' },
    { name: 'ASI290MM Mini', width: 5.6, height: 3.2, pixelSize: 2.9, resolution: '1936×1096' },
  ],
  qhy: [
    { name: 'QHY600M', width: 36, height: 24, pixelSize: 3.76, resolution: '9576×6388' },
    { name: 'QHY268M', width: 23.5, height: 15.7, pixelSize: 3.76, resolution: '6280×4210' },
    { name: 'QHY294M Pro', width: 19.1, height: 13, pixelSize: 4.63, resolution: '4164×2796' },
    { name: 'QHY533M', width: 11.31, height: 11.31, pixelSize: 3.76, resolution: '3008×3008' },
    { name: 'QHY183M', width: 13.2, height: 8.8, pixelSize: 2.4, resolution: '5544×3694' },
    { name: 'QHY163M', width: 17.7, height: 13.4, pixelSize: 3.8, resolution: '4656×3522' },
  ],
  other: [
    { name: 'Player One Poseidon-M', width: 23.5, height: 15.7, pixelSize: 3.76, resolution: '6280×4210' },
    { name: 'Player One Ares-M', width: 19.1, height: 13, pixelSize: 4.63, resolution: '4128×2808' },
    { name: 'Player One Neptune-M', width: 11.31, height: 11.31, pixelSize: 3.76, resolution: '3008×3008' },
    { name: 'Touptek ATR3CMOS26000KMA', width: 23.5, height: 15.7, pixelSize: 3.76, resolution: '6252×4176' },
  ],
};

// ============================================================================
// Telescope Presets
// ============================================================================

export const TELESCOPE_PRESETS: TelescopePreset[] = [
  { name: 'Samyang 135mm f/2', focalLength: 135, aperture: 67.5, type: 'Lens' },
  { name: 'RedCat 51', focalLength: 250, aperture: 51, type: 'APO' },
  { name: 'Radian 61', focalLength: 275, aperture: 61, type: 'APO' },
  { name: 'Esprit 80ED', focalLength: 400, aperture: 80, type: 'APO' },
  { name: 'FSQ-85ED', focalLength: 450, aperture: 85, type: 'APO' },
  { name: 'Esprit 100ED', focalLength: 550, aperture: 100, type: 'APO' },
  { name: 'TOA-130F', focalLength: 1000, aperture: 130, type: 'APO' },
  { name: 'EdgeHD 8"', focalLength: 2032, aperture: 203, type: 'SCT' },
  { name: 'EdgeHD 9.25"', focalLength: 2350, aperture: 235, type: 'SCT' },
  { name: 'C11', focalLength: 2800, aperture: 280, type: 'SCT' },
  { name: 'EdgeHD 11"', focalLength: 2800, aperture: 280, type: 'SCT' },
  { name: 'EdgeHD 14"', focalLength: 3910, aperture: 356, type: 'SCT' },
];

// ============================================================================
// Eyepiece Presets (for Ocular Simulator)
// ============================================================================

export interface EyepiecePreset {
  id: string;
  name: string;
  focalLength: number; // mm
  afov: number; // apparent field of view in degrees
  fieldStop?: number; // mm, optional
  isCustom?: boolean;
}

export interface BarlowPreset {
  id: string;
  name: string;
  magnification: number;
  isCustom?: boolean;
}

export interface OcularTelescopePreset {
  id: string;
  name: string;
  focalLength: number; // mm
  aperture: number; // mm
  type: 'refractor' | 'reflector' | 'catadioptric';
  isCustom?: boolean;
}

export const EYEPIECE_PRESETS: EyepiecePreset[] = [
  { id: 'e1', name: 'Plössl 32mm', focalLength: 32, afov: 52, fieldStop: 27 },
  { id: 'e2', name: 'Plössl 25mm', focalLength: 25, afov: 52, fieldStop: 21.3 },
  { id: 'e3', name: 'Plössl 17mm', focalLength: 17, afov: 52, fieldStop: 14.5 },
  { id: 'e4', name: 'Plössl 10mm', focalLength: 10, afov: 52, fieldStop: 8.5 },
  { id: 'e5', name: 'Plössl 6mm', focalLength: 6, afov: 52, fieldStop: 5.1 },
  { id: 'e6', name: 'Wide Field 24mm', focalLength: 24, afov: 68, fieldStop: 27.2 },
  { id: 'e7', name: 'Wide Field 15mm', focalLength: 15, afov: 68, fieldStop: 17 },
  { id: 'e8', name: 'Ultra Wide 9mm', focalLength: 9, afov: 82, fieldStop: 12.4 },
  { id: 'e9', name: 'Ultra Wide 5mm', focalLength: 5, afov: 82, fieldStop: 6.9 },
  { id: 'e10', name: 'Nagler 31mm', focalLength: 31, afov: 82, fieldStop: 42 },
  { id: 'e11', name: 'Nagler 16mm', focalLength: 16, afov: 82, fieldStop: 22 },
  { id: 'e12', name: 'Ethos 13mm', focalLength: 13, afov: 100, fieldStop: 22.1 },
  { id: 'e13', name: 'Ethos 6mm', focalLength: 6, afov: 100, fieldStop: 10.4 },
  { id: 'e14', name: 'XW 40mm', focalLength: 40, afov: 70, fieldStop: 46 },
  { id: 'e15', name: 'Morpheus 6.5mm', focalLength: 6.5, afov: 76, fieldStop: 8.7 },
];

export const BARLOW_PRESETS: BarlowPreset[] = [
  { id: 'b0', name: 'None', magnification: 1 },
  // Focal reducers
  { id: 'r1', name: '0.63x Reducer', magnification: 0.63 },
  { id: 'r2', name: '0.72x Reducer', magnification: 0.72 },
  { id: 'r3', name: '0.8x Reducer', magnification: 0.8 },
  { id: 'r4', name: '0.85x Reducer', magnification: 0.85 },
  // Barlows
  { id: 'b1', name: '2x Barlow', magnification: 2 },
  { id: 'b2', name: '2.5x Barlow', magnification: 2.5 },
  { id: 'b3', name: '3x Barlow', magnification: 3 },
  { id: 'b4', name: '5x Barlow', magnification: 5 },
];

export const OCULAR_TELESCOPE_PRESETS: OcularTelescopePreset[] = [
  { id: 't1', name: '80mm f/5 Refractor', focalLength: 400, aperture: 80, type: 'refractor' },
  { id: 't2', name: '102mm f/7 Refractor', focalLength: 714, aperture: 102, type: 'refractor' },
  { id: 't3', name: '130mm f/5 Newtonian', focalLength: 650, aperture: 130, type: 'reflector' },
  { id: 't4', name: '150mm f/5 Newtonian', focalLength: 750, aperture: 150, type: 'reflector' },
  { id: 't5', name: '200mm f/5 Newtonian', focalLength: 1000, aperture: 200, type: 'reflector' },
  { id: 't6', name: '8" SCT f/10', focalLength: 2032, aperture: 203, type: 'catadioptric' },
  { id: 't7', name: '6" Mak f/12', focalLength: 1800, aperture: 150, type: 'catadioptric' },
];

// ============================================================================
// Grid Options
// ============================================================================

export const GRID_OPTIONS: GridOption[] = [
  { value: 'none', label: 'None', icon: '○' },
  { value: 'crosshair', label: 'Crosshair', icon: '┼' },
  { value: 'thirds', label: 'Rule of Thirds', icon: '▦' },
  { value: 'golden', label: 'Golden Ratio', icon: '◫' },
  { value: 'diagonal', label: 'Diagonals', icon: '╳' },
];

// ============================================================================
// Sensor Categories (for UI display)
// ============================================================================

export const SENSOR_CATEGORIES = [
  { key: 'fullFrame', label: 'Full Frame' },
  { key: 'apsc', label: 'APS-C' },
  { key: 'zwo', label: 'ZWO' },
  { key: 'qhy', label: 'QHY' },
  { key: 'other', label: 'Other' },
] as const;

export type SensorCategoryKey = typeof SENSOR_CATEGORIES[number]['key'];

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get all sensor presets as a flat array
 */
export function getAllSensorPresets(): SensorPreset[] {
  return Object.values(SENSOR_PRESETS).flat();
}

/**
 * Find a sensor preset by name
 */
export function findSensorPreset(name: string): SensorPreset | undefined {
  return getAllSensorPresets().find(p => p.name === name);
}

/**
 * Find a telescope preset by name
 */
export function findTelescopePreset(name: string): TelescopePreset | undefined {
  return TELESCOPE_PRESETS.find(p => p.name === name);
}

/**
 * Get sensor presets for a specific category
 */
export function getSensorPresetsByCategory(category: string): SensorPreset[] {
  return SENSOR_PRESETS[category] || [];
}
