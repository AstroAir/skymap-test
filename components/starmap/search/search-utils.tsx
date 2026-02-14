import { memo } from 'react';
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
    case 'galaxies': return <CircleDot className="h-3 w-3 text-purple-400" />;
    case 'nebulae': return <Sparkles className="h-3 w-3 text-pink-400" />;
    case 'planets': return <Globe className="h-3 w-3 text-blue-400" />;
    case 'clusters': return <Star className="h-3 w-3 text-yellow-400" />;
    default: return <CircleDot className="h-3 w-3" />;
  }
}

/**
 * Highlight matching portions of text in search results.
 * Splits text on query matches (case-insensitive) and wraps matches in <mark>.
 */
export const HighlightText = memo(function HighlightText({
  text,
  query,
  className,
}: {
  text: string;
  query: string;
  className?: string;
}) {
  if (!query || query.length < 2) {
    return <span className={className}>{text}</span>;
  }

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));

  return (
    <span className={className}>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-primary/20 text-foreground rounded-sm px-0.5">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
});
