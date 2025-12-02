'use client';

import { useState, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { useTranslations } from 'next-intl';
import { useStellariumStore } from '@/lib/starmap/stores';
import { rad2deg } from '@/lib/starmap/utils';
import type { SearchResultItem } from '@/lib/starmap/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Star, Globe, Moon as MoonIcon, Sparkles, CircleDot, Loader2 } from 'lucide-react';

// Celestial bodies list for search
const celestialBodies: SearchResultItem[] = [
  { Name: 'Sun', Type: 'Star' },
  { Name: 'Mercury', Type: 'Planet' },
  { Name: 'Venus', Type: 'Planet' },
  { Name: 'Moon', Type: 'Moon' },
  { Name: 'Mars', Type: 'Planet' },
  { Name: 'Jupiter', Type: 'Planet' },
  { Name: 'Saturn', Type: 'Planet' },
  { Name: 'Uranus', Type: 'Planet' },
  { Name: 'Neptune', Type: 'Planet' },
  { Name: 'Pluto', Type: 'Planet' },
];

// Popular DSO catalog for quick search
const popularDSOs: SearchResultItem[] = [
  { Name: 'M31', Type: 'DSO', RA: 10.6847, Dec: 41.2689, 'Common names': 'Andromeda Galaxy' },
  { Name: 'M42', Type: 'DSO', RA: 83.8221, Dec: -5.3911, 'Common names': 'Orion Nebula' },
  { Name: 'M45', Type: 'DSO', RA: 56.75, Dec: 24.1167, 'Common names': 'Pleiades' },
  { Name: 'M1', Type: 'DSO', RA: 83.6333, Dec: 22.0167, 'Common names': 'Crab Nebula' },
  { Name: 'M51', Type: 'DSO', RA: 202.4696, Dec: 47.1952, 'Common names': 'Whirlpool Galaxy' },
  { Name: 'M101', Type: 'DSO', RA: 210.8024, Dec: 54.3488, 'Common names': 'Pinwheel Galaxy' },
  { Name: 'M104', Type: 'DSO', RA: 189.9976, Dec: -11.6231, 'Common names': 'Sombrero Galaxy' },
  { Name: 'M13', Type: 'DSO', RA: 250.4217, Dec: 36.4613, 'Common names': 'Hercules Cluster' },
  { Name: 'M57', Type: 'DSO', RA: 283.3962, Dec: 33.0286, 'Common names': 'Ring Nebula' },
  { Name: 'M27', Type: 'DSO', RA: 299.9017, Dec: 22.7211, 'Common names': 'Dumbbell Nebula' },
  { Name: 'NGC7000', Type: 'DSO', RA: 314.6833, Dec: 44.3167, 'Common names': 'North America Nebula' },
  { Name: 'NGC6992', Type: 'DSO', RA: 312.7583, Dec: 31.7167, 'Common names': 'Veil Nebula' },
  { Name: 'IC1396', Type: 'DSO', RA: 324.7458, Dec: 57.4833, 'Common names': 'Elephant Trunk Nebula' },
  { Name: 'NGC2244', Type: 'DSO', RA: 97.9833, Dec: 4.9333, 'Common names': 'Rosette Nebula' },
  { Name: 'M8', Type: 'DSO', RA: 270.9208, Dec: -24.3833, 'Common names': 'Lagoon Nebula' },
  { Name: 'M20', Type: 'DSO', RA: 270.6208, Dec: -23.0333, 'Common names': 'Trifid Nebula' },
  { Name: 'M16', Type: 'DSO', RA: 274.7, Dec: -13.8167, 'Common names': 'Eagle Nebula' },
  { Name: 'M17', Type: 'DSO', RA: 275.1958, Dec: -16.1833, 'Common names': 'Omega Nebula' },
  { Name: 'NGC6888', Type: 'DSO', RA: 303.0583, Dec: 38.35, 'Common names': 'Crescent Nebula' },
  { Name: 'M33', Type: 'DSO', RA: 23.4621, Dec: 30.6599, 'Common names': 'Triangulum Galaxy' },
];

export interface StellariumSearchRef {
  focusSearchInput: () => void;
}

interface StellariumSearchProps {
  onSelect?: () => void;
}

export const StellariumSearch = forwardRef<StellariumSearchRef, StellariumSearchProps>(
  function StellariumSearch({ onSelect }, ref) {
    const t = useTranslations();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const stel = useStellariumStore((state) => state.stel);

    useImperativeHandle(ref, () => ({
      focusSearchInput: () => {
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 100);
      },
    }));

    const fetchTargetSearch = useCallback(async (query: string) => {
      if (query.trim() === '') {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      const results: SearchResultItem[] = [];
      const lowerQuery = query.toLowerCase();

      // Search DSO catalog first (M, NGC, IC objects)
      for (const dso of popularDSOs) {
        if (
          dso.Name.toLowerCase().includes(lowerQuery) ||
          dso['Common names']?.toLowerCase().includes(lowerQuery)
        ) {
          results.push(dso);
        }
      }

      // Search celestial bodies
      if (stel) {
        for (const body of celestialBodies) {
          if (body.Name.toLowerCase().includes(lowerQuery)) {
            try {
              const obj = stel.getObj(`NAME ${body.Name}`);
              if (obj && obj.designations && obj.designations().length > 0) {
                results.push({
                  ...body,
                  StellariumObj: obj,
                });
              } else {
                results.push(body);
              }
            } catch {
              results.push(body);
            }
          }
        }

        // Search comets
        try {
          const comets = stel.core.comets;
          if (comets && comets.listObjs) {
            const cometList = comets.listObjs(stel.core.observer, 100, () => true);
            for (const comet of cometList) {
              if (comet.designations) {
                const designations = comet.designations();
                for (const designation of designations) {
                  const name = designation.replace(/^NAME /, '');
                  if (name.toLowerCase().includes(lowerQuery)) {
                    const exists = results.some((r) => r.Name === name);
                    if (!exists) {
                      results.push({
                        Name: name,
                        Type: 'Comet',
                        StellariumObj: comet,
                      });
                    }
                    break;
                  }
                }
              }
              if (results.length >= 20) break;
            }
          }
        } catch (error) {
          console.log('Comet search error:', error);
        }
      } else {
        // Fallback when Stellarium not available
        results.push(
          ...celestialBodies.filter((body) =>
            body.Name.toLowerCase().includes(lowerQuery)
          )
        );
      }

      setSearchResults(results.slice(0, 20));
      setIsSearching(false);
    }, [stel]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchQuery(value);
      fetchTargetSearch(value);
    };

    const selectTarget = useCallback(async (item: SearchResultItem) => {
      searchInputRef.current?.blur();
      setSearchResults([]);

      if (!stel) return;

      try {
        // Handle Stellarium objects (Comets, Planets)
        if (item.StellariumObj) {
          // Use Object.assign to work around eslint react-compiler rule
          Object.assign(stel.core, { selection: item.StellariumObj });
          stel.pointAndLock(item.StellariumObj);
          onSelect?.();
          return;
        }

        // Handle legacy Planets without StellariumObj
        let ra: number | undefined = item.RA;
        let dec: number | undefined = item.Dec;
        
        if (item.Type && (item.Type === 'Planet' || item.Type === 'Star' || item.Type === 'Moon')) {
          const planetInfo = stel.getObj(`NAME ${item.Name}`)?.getInfo('pvo', stel.observer) as number[][] | undefined;
          if (planetInfo) {
            const cirs = stel.convertFrame(stel.observer, 'ICRF', 'CIRS', planetInfo[0]);
            ra = rad2deg(stel.anp(stel.c2s(cirs)[0]));
            dec = rad2deg(stel.anpm(stel.c2s(cirs)[1]));
          }
        }

        // Handle coordinate-based objects
        if (ra !== undefined && dec !== undefined) {
          const ra_rad = ra * stel.D2R;
          const dec_rad = dec * stel.D2R;
          const icrfVec = stel.s2c(ra_rad, dec_rad);
          const observedVec = stel.convertFrame(stel.observer, 'ICRF', 'CIRS', icrfVec);

          const targetCircle = stel.createObj('circle', {
            id: 'targetCircle',
            pos: observedVec,
            color: [0, 0, 0, 0.1],
            size: [0.05, 0.05],
          });

          targetCircle.pos = observedVec;
          targetCircle.update();
          Object.assign(stel.core, { selection: targetCircle });
          stel.pointAndLock(targetCircle);
        }

        onSelect?.();
      } catch (error) {
        console.error('Error selecting target:', error);
      }
    }, [stel, onSelect]);

    const getTypeIcon = (type?: string) => {
      switch (type) {
        case 'Comet': return <Sparkles className="h-4 w-4 text-green-400" />;
        case 'Planet': return <Globe className="h-4 w-4 text-blue-400" />;
        case 'DSO': return <CircleDot className="h-4 w-4 text-purple-400" />;
        case 'Star': return <Star className="h-4 w-4 text-orange-400" />;
        case 'Moon': return <MoonIcon className="h-4 w-4 text-gray-400" />;
        default: return <CircleDot className="h-4 w-4 text-gray-400" />;
      }
    };

    const getTypeBadge = (type?: string) => {
      const colors: Record<string, string> = {
        'Comet': 'bg-green-500/20 text-green-400 border-green-500/30',
        'Planet': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        'DSO': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        'Star': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
        'Moon': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      };
      return colors[type || ''] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    };

    return (
      <div className="flex flex-col gap-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            ref={searchInputRef}
            placeholder={t('starmap.searchPlaceholder')}
            className="h-10 w-full pl-10"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
          )}
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <ScrollArea className="max-h-64">
            <div className="space-y-1">
              {searchResults.map((item, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full flex items-center gap-3 p-2 h-auto justify-start hover:bg-accent/50"
                  onClick={() => selectTarget(item)}
                >
                  {/* Type Icon */}
                  <div className="shrink-0">
                    {getTypeIcon(item.Type)}
                  </div>
                  
                  {/* Object Info */}
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-foreground font-medium truncate">
                      {item.Name}
                      {item['Common names'] && (
                        <span className="text-muted-foreground font-normal ml-1">
                          ({item['Common names']})
                        </span>
                      )}
                    </p>
                    {item.RA !== undefined && item.Dec !== undefined && (
                      <p className="text-xs text-muted-foreground font-mono">
                        RA: {item.RA.toFixed(2)}° Dec: {item.Dec.toFixed(2)}°
                      </p>
                    )}
                  </div>

                  {/* Type Badge */}
                  {item.Type && (
                    <Badge variant="outline" className={`shrink-0 ${getTypeBadge(item.Type)}`}>
                      {item.Type}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Empty State */}
        {searchQuery && searchResults.length === 0 && !isSearching && (
          <div className="text-center py-4 text-muted-foreground">
            <p>{t('starmap.noObjectsFound')}</p>
            <p className="text-xs mt-1">{t('starmap.trySearching')}</p>
          </div>
        )}

        {/* Quick Access */}
        {!searchQuery && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('starmap.popularObjects')}</p>
            <div className="flex flex-wrap gap-1">
              {['M31', 'M42', 'M45', 'M51', 'NGC7000'].map((name) => (
                <Button
                  key={name}
                  variant="secondary"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => {
                    setSearchQuery(name);
                    fetchTargetSearch(name);
                  }}
                >
                  {name}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
);
