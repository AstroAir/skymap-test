import {
  Star,
  Globe,
  Moon as MoonIcon,
  Sparkles,
  CircleDot,
  MapPin,
} from 'lucide-react';

/**
 * Get the icon for a celestial object type.
 * Shared between StellariumSearch and AdvancedSearchDialog.
 */
export function getTypeIcon(type?: string) {
  switch (type) {
    case 'Comet': return <Sparkles className="h-4 w-4 text-green-400" />;
    case 'Planet': return <Globe className="h-4 w-4 text-blue-400" />;
    case 'DSO': return <CircleDot className="h-4 w-4 text-purple-400" />;
    case 'Star': return <Star className="h-4 w-4 text-orange-400" />;
    case 'Moon': return <MoonIcon className="h-4 w-4 text-gray-400" />;
    case 'Constellation': return <MapPin className="h-4 w-4 text-cyan-400" />;
    default: return <CircleDot className="h-4 w-4 text-gray-400" />;
  }
}

/**
 * Get the icon for a quick category label.
 */
export function getCategoryIcon(label: string) {
  switch (label) {
    case 'Galaxies': return <CircleDot className="h-3 w-3 text-purple-400" />;
    case 'Nebulae': return <Sparkles className="h-3 w-3 text-pink-400" />;
    case 'Planets': return <Globe className="h-3 w-3 text-blue-400" />;
    case 'Clusters': return <Star className="h-3 w-3 text-yellow-400" />;
    default: return <CircleDot className="h-3 w-3" />;
  }
}
