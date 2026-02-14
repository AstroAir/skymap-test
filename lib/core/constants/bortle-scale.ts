/**
 * Bortle Scale definitions
 * Light pollution classification scale
 */

import type { BortleScaleEntry } from '../types/astronomy';

// ============================================================================
// Bortle Scale Data
// ============================================================================

export const BORTLE_SCALE: BortleScaleEntry[] = [
  { 
    value: 1, 
    name: 'Excellent dark-sky site', 
    sqm: 21.99, 
    description: 'Zodiacal light, gegenschein visible' 
  },
  { 
    value: 2, 
    name: 'Typical dark-sky site', 
    sqm: 21.89, 
    description: 'Airglow visible, M33 direct vision' 
  },
  { 
    value: 3, 
    name: 'Rural sky', 
    sqm: 21.69, 
    description: 'Some light pollution on horizon' 
  },
  { 
    value: 4, 
    name: 'Rural/suburban transition', 
    sqm: 21.25, 
    description: 'Light domes visible' 
  },
  { 
    value: 5, 
    name: 'Suburban sky', 
    sqm: 20.49, 
    description: 'Milky Way washed out at zenith' 
  },
  { 
    value: 6, 
    name: 'Bright suburban sky', 
    sqm: 19.50, 
    description: 'Milky Way invisible' 
  },
  { 
    value: 7, 
    name: 'Suburban/urban transition', 
    sqm: 18.94, 
    description: 'M31 barely visible' 
  },
  { 
    value: 8, 
    name: 'City sky', 
    sqm: 18.38, 
    description: 'Only bright stars visible' 
  },
  { 
    value: 9, 
    name: 'Inner-city sky', 
    sqm: 17.80, 
    description: 'Only planets and brightest stars' 
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get Bortle scale entry by value
 */
export function getBortleEntry(value: number): BortleScaleEntry | undefined {
  return BORTLE_SCALE.find(b => b.value === value);
}

/**
 * Get Bortle value from SQM measurement
 */
export function getBortleFromSQM(sqm: number): number {
  for (let i = 0; i < BORTLE_SCALE.length; i++) {
    if (sqm >= BORTLE_SCALE[i].sqm) {
      return BORTLE_SCALE[i].value;
    }
  }
  return 9;
}

/**
 * Get quality potential multiplier for Bortle value.
 * Higher values = darker skies = more potential benefit from longer integration.
 * Bortle 1 (pristine dark) → 8x, Bortle 9 (city center) → 1x.
 *
 * Use this to scale "ideal" integration times:
 * darker skies reward longer totals with diminishing returns under light pollution.
 * @deprecated Use getBortleQualityMultiplier instead
 */
export function getBortleExposureMultiplier(bortle: number): number {
  return getBortleQualityMultiplier(bortle);
}

/**
 * Quality potential multiplier: how much benefit longer integration provides.
 * Darker skies (low Bortle) = higher multiplier = more gain from extra time.
 */
export function getBortleQualityMultiplier(bortle: number): number {
  const multipliers = [8, 6, 5, 4, 3, 2.5, 2, 1.5, 1];
  return multipliers[bortle - 1] || 2;
}

/**
 * Minimum useful integration multiplier for Bortle value.
 * Light-polluted skies need MORE minimum time to overcome sky background noise.
 * Bortle 1 → 0.5x (dark sky needs less), Bortle 9 → 3x (city needs more).
 */
export function getBortleMinimumMultiplier(bortle: number): number {
  const multipliers = [0.5, 0.6, 0.7, 0.8, 1.0, 1.2, 1.5, 2.0, 3.0];
  return multipliers[bortle - 1] || 1;
}
