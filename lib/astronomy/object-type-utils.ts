/**
 * Unified object type classification utilities
 * Provides consistent icon/color mapping for celestial object types across all components
 */

import {
  Star,
  Globe2,
  Cloud,
  Sparkles,
  Orbit,
  CircleDot,
  Binary,
  Zap,
  Circle,
  Target,
  Rocket,
  Moon,
  Asterisk,
  Atom,
  type LucideIcon,
} from 'lucide-react';

/** Object type category for classification */
export type ObjectTypeCategory = 
  | 'galaxy'
  | 'nebula'
  | 'planetary_nebula'
  | 'supernova_remnant'
  | 'globular_cluster'
  | 'open_cluster'
  | 'cluster'
  | 'double_star'
  | 'variable_star'
  | 'star'
  | 'planet'
  | 'moon'
  | 'asteroid'
  | 'comet'
  | 'quasar'
  | 'unknown';

/** Display configuration for object types */
export interface ObjectTypeDisplay {
  icon: LucideIcon;
  color: string;
  badgeColor: string;
  category: ObjectTypeCategory;
  labelKey: string;
}

/** Type classification configuration */
const TYPE_CONFIG: Record<ObjectTypeCategory, Omit<ObjectTypeDisplay, 'category'>> = {
  galaxy: {
    icon: Globe2,
    color: 'text-purple-400',
    badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    labelKey: 'galaxy',
  },
  nebula: {
    icon: Cloud,
    color: 'text-pink-400',
    badgeColor: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    labelKey: 'nebula',
  },
  planetary_nebula: {
    icon: Circle,
    color: 'text-cyan-400',
    badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    labelKey: 'planetaryNebula',
  },
  supernova_remnant: {
    icon: Zap,
    color: 'text-red-400',
    badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30',
    labelKey: 'supernovaRemnant',
  },
  globular_cluster: {
    icon: Atom,
    color: 'text-indigo-400',
    badgeColor: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    labelKey: 'globularCluster',
  },
  open_cluster: {
    icon: Sparkles,
    color: 'text-blue-400',
    badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    labelKey: 'openCluster',
  },
  cluster: {
    icon: Sparkles,
    color: 'text-blue-400',
    badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    labelKey: 'cluster',
  },
  double_star: {
    icon: Binary,
    color: 'text-amber-400',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    labelKey: 'doubleStar',
  },
  variable_star: {
    icon: Asterisk,
    color: 'text-rose-400',
    badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    labelKey: 'variableStar',
  },
  star: {
    icon: CircleDot,
    color: 'text-yellow-400',
    badgeColor: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    labelKey: 'star',
  },
  planet: {
    icon: Orbit,
    color: 'text-orange-400',
    badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    labelKey: 'planet',
  },
  moon: {
    icon: Moon,
    color: 'text-slate-300',
    badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    labelKey: 'moon',
  },
  asteroid: {
    icon: Target,
    color: 'text-stone-400',
    badgeColor: 'bg-stone-500/20 text-stone-400 border-stone-500/30',
    labelKey: 'asteroid',
  },
  comet: {
    icon: Rocket,
    color: 'text-teal-400',
    badgeColor: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
    labelKey: 'comet',
  },
  quasar: {
    icon: Zap,
    color: 'text-violet-400',
    badgeColor: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
    labelKey: 'quasar',
  },
  unknown: {
    icon: Star,
    color: 'text-primary',
    badgeColor: 'bg-muted text-muted-foreground',
    labelKey: 'unknown',
  },
};

/**
 * Parse object type string into a standardized category
 * Handles various naming conventions from different data sources
 */
export function parseObjectTypeCategory(type?: string | null): ObjectTypeCategory {
  if (!type) return 'unknown';
  const t = type.toLowerCase().trim();
  
  // Galaxies
  if (t === 'galaxy' || t.includes('gx') || t === 'g' || t.includes('galaxy')) {
    return 'galaxy';
  }
  
  // Nebulae subtypes (check specific types before generic nebula)
  if (t === 'planetary_nebula' || t.includes('pn') || t.includes('planetary')) {
    return 'planetary_nebula';
  }
  if (t === 'supernova_remnant' || t.includes('snr') || t.includes('supernova')) {
    return 'supernova_remnant';
  }
  if (t === 'nebula' || t.includes('neb') || t.includes('hii') || t === 'en' || t === 'rn') {
    return 'nebula';
  }
  
  // Clusters (check specific types before generic cluster)
  if (t === 'globular_cluster' || t === 'gc' || t.includes('globular')) {
    return 'globular_cluster';
  }
  if (t === 'open_cluster' || t === 'oc' || t.includes('open')) {
    return 'open_cluster';
  }
  if (t === 'cluster' || t === 'as' || t.includes('asterism')) {
    return 'cluster';
  }
  
  // Stars subtypes (check specific types before generic star)
  if (t === 'double_star' || t === 'binary' || t === '**' || t.includes('ds') || t.includes('double') || t.includes('binary')) {
    return 'double_star';
  }
  if (t === 'variable_star' || t === 'v*' || t.includes('var') || t.includes('variable')) {
    return 'variable_star';
  }
  if (t === 'star' || t === '*' || t.includes('star') || t.includes('carbon') || t.includes('c*')) {
    return 'star';
  }
  
  // Solar system objects (check asteroid/minor_planet before planet to avoid false matches)
  if (t.includes('asteroid') || t === 'minor_planet') {
    return 'asteroid';
  }
  if (t.includes('planet')) {
    return 'planet';
  }
  if (t === 'moon' || t.includes('satellite')) {
    return 'moon';
  }
  if (t.includes('comet')) {
    return 'comet';
  }
  
  // Exotic objects
  if (t === 'quasar' || t.includes('agn') || t.includes('qso')) {
    return 'quasar';
  }
  
  return 'unknown';
}

/**
 * Get display configuration for an object type
 * @param type - Raw object type string from any data source
 * @returns Display configuration including icon, colors, and i18n key
 */
export function getObjectTypeDisplay(type?: string | null): ObjectTypeDisplay {
  const category = parseObjectTypeCategory(type);
  const config = TYPE_CONFIG[category];
  return {
    ...config,
    category,
  };
}

/**
 * Get icon component for object type
 */
export function getObjectTypeIcon(type?: string | null): LucideIcon {
  return getObjectTypeDisplay(type).icon;
}

/**
 * Get text color class for object type
 */
export function getObjectTypeColor(type?: string | null): string {
  return getObjectTypeDisplay(type).color;
}

/**
 * Get badge color classes for object type
 */
export function getObjectTypeBadgeColor(type?: string | null): string {
  return getObjectTypeDisplay(type).badgeColor;
}

/**
 * Legend items for ObjectTypeLegend component
 * Grouped by category for display purposes
 */
export const LEGEND_CATEGORIES = {
  galaxy: ['galaxy'],
  nebula: ['nebula', 'planetary_nebula', 'supernova_remnant'],
  cluster: ['globular_cluster', 'open_cluster'],
  star: ['star', 'double_star', 'variable_star'],
  solar: ['planet', 'moon', 'asteroid', 'comet'],
  exotic: ['quasar'],
} as const;

/**
 * Get all legend items for display
 */
export function getLegendItems(): Array<{
  category: ObjectTypeCategory;
  icon: LucideIcon;
  color: string;
  labelKey: string;
  group: keyof typeof LEGEND_CATEGORIES;
}> {
  const items: Array<{
    category: ObjectTypeCategory;
    icon: LucideIcon;
    color: string;
    labelKey: string;
    group: keyof typeof LEGEND_CATEGORIES;
  }> = [];
  
  for (const [group, categories] of Object.entries(LEGEND_CATEGORIES)) {
    for (const category of categories) {
      const config = TYPE_CONFIG[category as ObjectTypeCategory];
      items.push({
        category: category as ObjectTypeCategory,
        icon: config.icon,
        color: config.color,
        labelKey: config.labelKey,
        group: group as keyof typeof LEGEND_CATEGORIES,
      });
    }
  }
  
  return items;
}
