'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Plus, Telescope } from 'lucide-react';
import { cn } from '@/lib/utils';
import { degreesToHMS, degreesToDMS, raDecToAltAz } from '@/lib/astronomy/starmap-utils';
import {
  calculateTargetVisibility,
  getSunPosition,
  angularSeparation,
  formatTimeShort,
} from '@/lib/astronomy/astro-utils';
import { TranslatedName } from '../../objects/translated-name';
import {
  useSkyAtlasStore,
  initializeSkyAtlas,
  DSO_TYPE_LABELS,
  CONSTELLATION_NAMES,
} from '@/lib/catalogs';
import { SortableHeader } from './sortable-header';
import type { CelestialPosition } from './types';

interface PositionsTabProps {
  latitude: number;
  longitude: number;
  onSelectObject: (ra: number, dec: number) => void;
  onAddToList: (name: string, ra: number, dec: number) => void;
}

export function PositionsTab({ latitude, longitude, onSelectObject, onAddToList }: PositionsTabProps) {
  const t = useTranslations();
  const [catalog, setCatalog] = useState<'messier' | 'ngc' | 'caldwell' | 'planets' | 'all'>('messier');
  const [magnitudeLimit, setMagnitudeLimit] = useState(12);
  const [minAltitude, setMinAltitude] = useState(0);
  const [showAboveHorizon, setShowAboveHorizon] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'altitude',
    direction: 'desc',
  });
  
  const { catalog: dsoCatalog } = useSkyAtlasStore();
  
  // Initialize catalog
  useEffect(() => {
    if (dsoCatalog.length === 0) {
      initializeSkyAtlas(latitude, longitude);
    }
  }, [dsoCatalog.length, latitude, longitude]);
  
  // Calculate positions for all objects
  const positions = useMemo(() => {
    let objects = dsoCatalog;
    
    // Filter by catalog
    if (catalog !== 'all') {
      objects = objects.filter(obj => {
        const name = obj.name.toLowerCase();
        switch (catalog) {
          case 'messier':
            return name.startsWith('m') && /^m\d+/.test(name);
          case 'ngc':
            return name.startsWith('ngc');
          case 'caldwell':
            return name.startsWith('c') && /^c\d+/.test(name);
          default:
            return true;
        }
      });
    }
    
    // Filter by magnitude
    if (magnitudeLimit < 15) {
      objects = objects.filter(obj => (obj.magnitude ?? 15) <= magnitudeLimit);
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      objects = objects.filter(obj => 
        obj.name.toLowerCase().includes(query) ||
        (obj.alternateNames?.some(n => n.toLowerCase().includes(query)))
      );
    }
    
    // Calculate current positions
    const positionedObjects: CelestialPosition[] = objects.map(obj => {
      const altAz = raDecToAltAz(obj.ra, obj.dec, latitude, longitude);
      const visibility = calculateTargetVisibility(obj.ra, obj.dec, latitude, longitude, 30);
      const sunPos = getSunPosition();
      const elongation = angularSeparation(obj.ra, obj.dec, sunPos.ra, sunPos.dec);
      
      return {
        name: obj.name,
        type: DSO_TYPE_LABELS[obj.type] || obj.type,
        ra: obj.ra,
        dec: obj.dec,
        magnitude: obj.magnitude,
        angularSize: obj.sizeMax,
        altitude: altAz.altitude,
        azimuth: altAz.azimuth,
        transitTime: visibility.transitTime,
        maxElevation: visibility.transitAltitude,
        elongation,
        constellation: CONSTELLATION_NAMES[obj.constellation] || obj.constellation,
      };
    });
    
    // Filter by altitude
    let filtered = positionedObjects;
    if (showAboveHorizon) {
      filtered = filtered.filter(obj => obj.altitude > 0);
    }
    if (minAltitude > 0) {
      filtered = filtered.filter(obj => obj.altitude >= minAltitude);
    }
    
    // Sort
    filtered.sort((a, b) => {
      let aVal: number | string = 0;
      let bVal: number | string = 0;
      
      switch (sortConfig.key) {
        case 'name':
          aVal = a.name;
          bVal = b.name;
          break;
        case 'altitude':
          aVal = a.altitude;
          bVal = b.altitude;
          break;
        case 'magnitude':
          aVal = a.magnitude ?? 99;
          bVal = b.magnitude ?? 99;
          break;
        case 'transit':
          aVal = a.transitTime?.getTime() ?? 0;
          bVal = b.transitTime?.getTime() ?? 0;
          break;
        case 'maxElevation':
          aVal = a.maxElevation;
          bVal = b.maxElevation;
          break;
        default:
          aVal = a.altitude;
          bVal = b.altitude;
      }
      
      if (typeof aVal === 'string') {
        return sortConfig.direction === 'asc' 
          ? aVal.localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal);
      }
      
      return sortConfig.direction === 'asc' ? aVal - (bVal as number) : (bVal as number) - aVal;
    });
    
    return filtered.slice(0, 200); // Limit for performance
  }, [dsoCatalog, catalog, magnitudeLimit, minAltitude, showAboveHorizon, searchQuery, sortConfig, latitude, longitude]);
  
  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  };
  
  return (
    <div className="space-y-4">
      {/* Filters Row 1: Catalog + Search */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">{t('astroCalc.catalog')}</Label>
          <Select value={catalog} onValueChange={(v) => setCatalog(v as typeof catalog)}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('astroCalc.allObjects')}</SelectItem>
              <SelectItem value="messier">Messier</SelectItem>
              <SelectItem value="ngc">NGC</SelectItem>
              <SelectItem value="caldwell">Caldwell</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-1.5">
          <Label className="text-xs">{t('astroCalc.search')}</Label>
          <div className="relative">
            <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="M31, NGC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-sm"
            />
          </div>
        </div>
      </div>
      
      {/* Filters Row 2: Sliders */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">{t('astroCalc.magnitudeLimit')}</Label>
            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-mono">
              {magnitudeLimit}
            </Badge>
          </div>
          <Slider
            value={[magnitudeLimit]}
            onValueChange={([v]) => setMagnitudeLimit(v)}
            min={4}
            max={15}
            step={0.5}
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">{t('astroCalc.minAltitude')}</Label>
            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-mono">
              {minAltitude}°
            </Badge>
          </div>
          <Slider
            value={[minAltitude]}
            onValueChange={([v]) => setMinAltitude(v)}
            min={0}
            max={80}
            step={5}
          />
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox
            id="aboveHorizon"
            checked={showAboveHorizon}
            onCheckedChange={(checked) => setShowAboveHorizon(!!checked)}
          />
          <Label htmlFor="aboveHorizon" className="text-xs">
            {t('astroCalc.showAboveHorizonOnly')}
          </Label>
        </div>
        <Badge variant="outline" className="text-xs">
          {positions.length} {t('astroCalc.objects')}
        </Badge>
      </div>
      
      {/* Results Table */}
      <ScrollArea className="h-[350px] border rounded-lg">
        {positions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 text-muted-foreground">
            <Telescope className="h-10 w-10 mb-3 opacity-40" />
            <p className="text-sm font-medium">{t('astroCalc.noObjectsFound')}</p>
            <p className="text-xs mt-1">{t('astroCalc.adjustFilters')}</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <SortableHeader label={t('astroCalc.name')} sortKey="name" currentSort={sortConfig} onSort={handleSort} />
                <TableHead>{t('astroCalc.type')}</TableHead>
                <TableHead>{t('astroCalc.tableRA')}</TableHead>
                <TableHead>{t('astroCalc.tableDec')}</TableHead>
                <SortableHeader label={t('astroCalc.mag')} sortKey="magnitude" currentSort={sortConfig} onSort={handleSort} />
                <SortableHeader label={t('astroCalc.alt')} sortKey="altitude" currentSort={sortConfig} onSort={handleSort} />
                <SortableHeader label={t('astroCalc.transit')} sortKey="transit" currentSort={sortConfig} onSort={handleSort} />
                <SortableHeader label={t('astroCalc.maxEl')} sortKey="maxElevation" currentSort={sortConfig} onSort={handleSort} />
                <TableHead className="w-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {positions.map((obj) => (
                <TableRow 
                  key={obj.name} 
                  className="cursor-pointer hover:bg-accent/50"
                  onClick={() => onSelectObject(obj.ra, obj.dec)}
                >
                  <TableCell className="font-medium text-sm">
                    <TranslatedName name={obj.name} />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{obj.type}</TableCell>
                  <TableCell className="font-mono text-xs">{degreesToHMS(obj.ra)}</TableCell>
                  <TableCell className="font-mono text-xs">{degreesToDMS(obj.dec)}</TableCell>
                  <TableCell className="text-xs text-right tabular-nums">{obj.magnitude?.toFixed(1) ?? '--'}</TableCell>
                  <TableCell className={cn(
                    'text-xs font-medium text-right tabular-nums',
                    obj.altitude > 30 ? 'text-green-500' : obj.altitude > 0 ? 'text-yellow-500' : 'text-red-500'
                  )}>
                    {obj.altitude.toFixed(1)}°
                  </TableCell>
                  <TableCell className="font-mono text-xs">{formatTimeShort(obj.transitTime)}</TableCell>
                  <TableCell className="text-xs text-right tabular-nums">{obj.maxElevation.toFixed(1)}°</TableCell>
                  <TableCell className="w-8">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToList(obj.name, obj.ra, obj.dec);
                      }}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </ScrollArea>
    </div>
  );
}
