'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Calculator,
  Calendar,
  Clock,
  Moon,
  Sun,
  Star,
  Target,
  TrendingUp,
  Plus,
  Search,
  ChevronUp,
  ChevronDown,
  Sparkles,
  SunMoon,
  MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMountStore, useStellariumStore } from '@/lib/stores';
import { useTargetListStore } from '@/lib/stores/target-list-store';
import { degreesToHMS, degreesToDMS, raDecToAltAz } from '@/lib/astronomy/starmap-utils';
import {
  calculateTwilightTimes,
  calculateTargetVisibility,
  calculateImagingFeasibility,
  getMoonPhase,
  getMoonPhaseName,
  getMoonIllumination,
  getMoonPosition,
  getSunPosition,
  angularSeparation,
  formatTimeShort,
  formatDuration,
  getJulianDateFromDate,
} from '@/lib/astronomy/astro-utils';
import { TranslatedName } from '../objects/translated-name';
import { AltitudeChart } from './altitude-chart';
import {
  useSkyAtlasStore,
  initializeSkyAtlas,
  DSO_TYPE_LABELS,
  CONSTELLATION_NAMES,
} from '@/lib/catalogs';

// ============================================================================
// Types
// ============================================================================

interface CelestialPosition {
  name: string;
  type: string;
  ra: number;
  dec: number;
  magnitude?: number;
  angularSize?: number;
  altitude: number;
  azimuth: number;
  transitTime: Date | null;
  maxElevation: number;
  elongation?: number;
  constellation?: string;
}

interface EphemerisEntry {
  date: Date;
  ra: number;
  dec: number;
  altitude: number;
  azimuth: number;
  magnitude?: number;
  phase?: number;
  distance?: number;
  elongation?: number;
}

interface WUTObject {
  name: string;
  type: string;
  ra: number;
  dec: number;
  magnitude?: number;
  riseTime: Date | null;
  transitTime: Date | null;
  setTime: Date | null;
  maxElevation: number;
  angularSize?: number;
  constellation?: string;
  score: number;
}

// ============================================================================
// Utility Components
// ============================================================================

function SortableHeader({
  label,
  sortKey,
  currentSort,
  onSort,
}: {
  label: string;
  sortKey: string;
  currentSort: { key: string; direction: 'asc' | 'desc' };
  onSort: (key: string) => void;
}) {
  const isActive = currentSort.key === sortKey;
  return (
    <TableHead
      className="cursor-pointer hover:bg-accent/50 select-none"
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {label}
        {isActive && (
          currentSort.direction === 'asc' 
            ? <ChevronUp className="h-3 w-3" /> 
            : <ChevronDown className="h-3 w-3" />
        )}
      </div>
    </TableHead>
  );
}

// ============================================================================
// Positions Tab Component
// ============================================================================

interface PositionsTabProps {
  latitude: number;
  longitude: number;
  onSelectObject: (ra: number, dec: number) => void;
  onAddToList: (name: string, ra: number, dec: number) => void;
}

function PositionsTab({ latitude, longitude, onSelectObject, onAddToList }: PositionsTabProps) {
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
      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
          <Label className="text-xs">{t('astroCalc.magnitudeLimit')}: {magnitudeLimit}</Label>
          <Slider
            value={[magnitudeLimit]}
            onValueChange={([v]) => setMagnitudeLimit(v)}
            min={4}
            max={15}
            step={0.5}
            className="mt-2"
          />
        </div>
        
        <div className="space-y-1.5">
          <Label className="text-xs">{t('astroCalc.minAltitude')}: {minAltitude}°</Label>
          <Slider
            value={[minAltitude]}
            onValueChange={([v]) => setMinAltitude(v)}
            min={0}
            max={80}
            step={5}
            className="mt-2"
          />
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
      
      <div className="flex items-center gap-4">
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
      <ScrollArea className="h-[400px] border rounded-lg">
        <Table>
          <TableHeader className="sticky top-0 bg-background">
            <TableRow>
              <SortableHeader label={t('astroCalc.name')} sortKey="name" currentSort={sortConfig} onSort={handleSort} />
              <TableHead>{t('astroCalc.type')}</TableHead>
              <TableHead>RA</TableHead>
              <TableHead>Dec</TableHead>
              <SortableHeader label={t('astroCalc.mag')} sortKey="magnitude" currentSort={sortConfig} onSort={handleSort} />
              <SortableHeader label={t('astroCalc.alt')} sortKey="altitude" currentSort={sortConfig} onSort={handleSort} />
              <SortableHeader label={t('astroCalc.transit')} sortKey="transit" currentSort={sortConfig} onSort={handleSort} />
              <SortableHeader label={t('astroCalc.maxEl')} sortKey="maxElevation" currentSort={sortConfig} onSort={handleSort} />
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {positions.map((obj) => (
              <TableRow 
                key={obj.name} 
                className="cursor-pointer hover:bg-accent/50"
                onClick={() => onSelectObject(obj.ra, obj.dec)}
              >
                <TableCell className="font-medium">
                  <TranslatedName name={obj.name} />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{obj.type}</TableCell>
                <TableCell className="font-mono text-xs">{degreesToHMS(obj.ra)}</TableCell>
                <TableCell className="font-mono text-xs">{degreesToDMS(obj.dec)}</TableCell>
                <TableCell className="text-xs">{obj.magnitude?.toFixed(1) ?? '--'}</TableCell>
                <TableCell className={cn(
                  'text-xs font-medium',
                  obj.altitude > 30 ? 'text-green-500' : obj.altitude > 0 ? 'text-yellow-500' : 'text-red-500'
                )}>
                  {obj.altitude.toFixed(1)}°
                </TableCell>
                <TableCell className="font-mono text-xs">{formatTimeShort(obj.transitTime)}</TableCell>
                <TableCell className="text-xs">{obj.maxElevation.toFixed(1)}°</TableCell>
                <TableCell>
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
      </ScrollArea>
    </div>
  );
}

// ============================================================================
// WUT (What's Up Tonight) Tab Component
// ============================================================================

interface WUTTabProps {
  latitude: number;
  longitude: number;
  onSelectObject: (ra: number, dec: number) => void;
  onAddToList: (name: string, ra: number, dec: number) => void;
}

function WUTTab({ latitude, longitude, onSelectObject, onAddToList }: WUTTabProps) {
  const t = useTranslations();
  const [objectType, setObjectType] = useState<'all' | 'galaxy' | 'nebula' | 'cluster' | 'planetary'>('all');
  const [magnitudeRange, setMagnitudeRange] = useState<[number, number]>([0, 12]);
  const [minAltitude, setMinAltitude] = useState(30);
  const [timeWindow, setTimeWindow] = useState<'evening' | 'midnight' | 'morning' | 'all'>('all');
  const [sortBy, setSortBy] = useState<'score' | 'altitude' | 'transit' | 'magnitude' | 'size'>('score');
  const [minSize, setMinSize] = useState(0); // arcminutes
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const { catalog: dsoCatalog } = useSkyAtlasStore();
  const twilight = useMemo(() => calculateTwilightTimes(latitude, longitude), [latitude, longitude]);
  
  // Get WUT objects
  const wutObjects = useMemo(() => {
    let objects = dsoCatalog;
    
    // Filter by type
    if (objectType !== 'all') {
      objects = objects.filter(obj => {
        const typeStr = obj.type as string;
        switch (objectType) {
          case 'galaxy':
            return typeStr === 'Galaxy';
          case 'nebula':
            return ['Nebula', 'EmissionNebula', 'ReflectionNebula', 'DarkNebula', 'SupernovaRemnant'].includes(typeStr);
          case 'cluster':
            return ['OpenCluster', 'GlobularCluster', 'StarCluster'].includes(typeStr);
          case 'planetary':
            return typeStr === 'PlanetaryNebula';
          default:
            return true;
        }
      });
    }
    
    // Filter by magnitude
    objects = objects.filter(obj => {
      const mag = obj.magnitude ?? 15;
      return mag >= magnitudeRange[0] && mag <= magnitudeRange[1];
    });
    
    // Filter by size
    if (minSize > 0) {
      objects = objects.filter(obj => (obj.sizeMax ?? 0) >= minSize);
    }
    
    
    // Calculate visibility and scores
    const wutResults: WUTObject[] = objects.map(obj => {
      const visibility = calculateTargetVisibility(obj.ra, obj.dec, latitude, longitude, minAltitude);
      const feasibility = calculateImagingFeasibility(obj.ra, obj.dec, latitude, longitude);
      
      return {
        name: obj.name,
        type: DSO_TYPE_LABELS[obj.type] || obj.type,
        ra: obj.ra,
        dec: obj.dec,
        magnitude: obj.magnitude,
        riseTime: visibility.riseTime,
        transitTime: visibility.transitTime,
        setTime: visibility.setTime,
        maxElevation: visibility.transitAltitude,
        angularSize: obj.sizeMax,
        constellation: CONSTELLATION_NAMES[obj.constellation] || obj.constellation,
        score: feasibility.score,
      };
    });
    
    // Filter by visibility tonight
    const filtered = wutResults.filter(obj => {
      // Must have positive imaging time
      if (obj.maxElevation < minAltitude) return false;
      
      // Filter by time window
      if (timeWindow !== 'all' && obj.transitTime && twilight.astronomicalDusk && twilight.astronomicalDawn) {
        const transitHour = obj.transitTime.getHours();
        const duskHour = twilight.astronomicalDusk.getHours();
        const dawnHour = twilight.astronomicalDawn.getHours();
        
        switch (timeWindow) {
          case 'evening':
            return transitHour >= duskHour || transitHour <= 23;
          case 'midnight':
            return transitHour >= 22 || transitHour <= 2;
          case 'morning':
            return transitHour >= 2 && transitHour <= dawnHour;
        }
      }
      
      return true;
    });
    
    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'altitude':
          return b.maxElevation - a.maxElevation;
        case 'transit':
          return (a.transitTime?.getTime() ?? 0) - (b.transitTime?.getTime() ?? 0);
        case 'magnitude':
          return (a.magnitude ?? 99) - (b.magnitude ?? 99);
        default:
          return b.score - a.score;
      }
    });
    
    return filtered.slice(0, 100);
  }, [dsoCatalog, objectType, magnitudeRange, minAltitude, minSize, timeWindow, sortBy, latitude, longitude, twilight]);
  
  return (
    <div className="space-y-4">
      {/* Night Info */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <Moon className="h-4 w-4 text-amber-400" />
            <span>{getMoonPhaseName(getMoonPhase())}</span>
            <span className="text-muted-foreground">({getMoonIllumination(getMoonPhase())}%)</span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4 text-indigo-400" />
            <span>{t('astroCalc.darkHours')}: {twilight.darknessDuration.toFixed(1)}h</span>
          </div>
        </div>
        <Badge variant={twilight.isCurrentlyNight ? 'default' : 'secondary'}>
          {twilight.isCurrentlyNight ? t('astroCalc.night') : t('astroCalc.daylight')}
        </Badge>
      </div>
      
      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">{t('astroCalc.objectType')}</Label>
          <Select value={objectType} onValueChange={(v) => setObjectType(v as typeof objectType)}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('astroCalc.allTypes')}</SelectItem>
              <SelectItem value="galaxy">{t('objects.galaxy')}</SelectItem>
              <SelectItem value="nebula">{t('objects.nebula')}</SelectItem>
              <SelectItem value="cluster">{t('objects.openCluster')}</SelectItem>
              <SelectItem value="planetary">{t('objects.planetaryNebula')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-1.5">
          <Label className="text-xs">{t('astroCalc.magnitude')}: {magnitudeRange[0]}-{magnitudeRange[1]}</Label>
          <Slider
            value={magnitudeRange}
            onValueChange={(v) => setMagnitudeRange(v as [number, number])}
            min={0}
            max={15}
            step={0.5}
            className="mt-2"
          />
        </div>
        
        <div className="space-y-1.5">
          <Label className="text-xs">{t('astroCalc.minAltitude')}: {minAltitude}°</Label>
          <Slider
            value={[minAltitude]}
            onValueChange={([v]) => setMinAltitude(v)}
            min={10}
            max={60}
            step={5}
            className="mt-2"
          />
        </div>
        
        <div className="space-y-1.5">
          <Label className="text-xs">{t('astroCalc.timeWindow')}</Label>
          <Select value={timeWindow} onValueChange={(v) => setTimeWindow(v as typeof timeWindow)}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('astroCalc.allNight')}</SelectItem>
              <SelectItem value="evening">{t('astroCalc.evening')}</SelectItem>
              <SelectItem value="midnight">{t('astroCalc.midnight')}</SelectItem>
              <SelectItem value="morning">{t('astroCalc.morning')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-1.5">
          <Label className="text-xs">{t('astroCalc.sortBy')}</Label>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="score">{t('astroCalc.score')}</SelectItem>
              <SelectItem value="altitude">{t('astroCalc.maxAltitude')}</SelectItem>
              <SelectItem value="transit">{t('astroCalc.transitTime')}</SelectItem>
              <SelectItem value="magnitude">{t('astroCalc.magnitude')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Advanced Filters */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs"
        >
          {showAdvanced ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
          {t('astroCalc.advancedFilters')}
        </Button>
        <Badge variant="outline" className="text-xs">
          {wutObjects.length} {t('astroCalc.objectsVisible')}
        </Badge>
      </div>
      
      {showAdvanced && (
        <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/30">
          <div className="space-y-1.5">
            <Label className="text-xs">{t('astroCalc.minSize')}: {minSize > 0 ? `${minSize}'` : t('astroCalc.any')}</Label>
            <Slider
              value={[minSize]}
              onValueChange={([v]) => setMinSize(v)}
              min={0}
              max={60}
              step={1}
            />
          </div>
        </div>
      )}
      
      {/* Results Table */}
      <ScrollArea className="h-[350px] border rounded-lg">
        <Table>
          <TableHeader className="sticky top-0 bg-background">
            <TableRow>
              <TableHead>{t('astroCalc.name')}</TableHead>
              <TableHead>{t('astroCalc.type')}</TableHead>
              <TableHead>{t('astroCalc.mag')}</TableHead>
              <TableHead>{t('astroCalc.rise')}</TableHead>
              <TableHead>{t('astroCalc.transit')}</TableHead>
              <TableHead>{t('astroCalc.maxEl')}</TableHead>
              <TableHead>{t('astroCalc.set')}</TableHead>
              <TableHead>{t('astroCalc.size')}</TableHead>
              <TableHead>{t('astroCalc.score')}</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {wutObjects.map((obj) => (
              <TableRow 
                key={obj.name}
                className="cursor-pointer hover:bg-accent/50"
                onClick={() => onSelectObject(obj.ra, obj.dec)}
              >
                <TableCell className="font-medium">
                  <TranslatedName name={obj.name} />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{obj.type}</TableCell>
                <TableCell className="text-xs">{obj.magnitude?.toFixed(1) ?? '--'}</TableCell>
                <TableCell className="font-mono text-xs">{formatTimeShort(obj.riseTime)}</TableCell>
                <TableCell className="font-mono text-xs">{formatTimeShort(obj.transitTime)}</TableCell>
                <TableCell className="text-xs">{obj.maxElevation.toFixed(0)}°</TableCell>
                <TableCell className="font-mono text-xs">{formatTimeShort(obj.setTime)}</TableCell>
                <TableCell className="text-xs">
                  {obj.angularSize ? `${obj.angularSize.toFixed(1)}'` : '--'}
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={obj.score >= 70 ? 'default' : obj.score >= 50 ? 'secondary' : 'outline'}
                    className="text-xs"
                  >
                    {obj.score}
                  </Badge>
                </TableCell>
                <TableCell>
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
      </ScrollArea>
    </div>
  );
}

// ============================================================================
// RTS (Rise/Transit/Set) Tab Component
// ============================================================================

interface RTSTabProps {
  latitude: number;
  longitude: number;
  selectedTarget?: { name: string; ra: number; dec: number };
}

function RTSTab({ latitude, longitude, selectedTarget }: RTSTabProps) {
  const t = useTranslations();
  const [targetName, setTargetName] = useState(selectedTarget?.name ?? '');
  const [targetRA, setTargetRA] = useState(selectedTarget?.ra?.toString() ?? '');
  const [targetDec, setTargetDec] = useState(selectedTarget?.dec?.toString() ?? '');
  const [dateRange, setDateRange] = useState<number>(7); // days ahead
  
  // Parse coordinates
  const ra = parseFloat(targetRA) || selectedTarget?.ra || 0;
  const dec = parseFloat(targetDec) || selectedTarget?.dec || 0;
  
  // Calculate RTS for multiple days
  const rtsData = useMemo(() => {
    if (!ra && !dec) return [];
    
    const results: Array<{
      date: Date;
      riseTime: Date | null;
      transitTime: Date | null;
      setTime: Date | null;
      transitAlt: number;
      sunAlt: number;
    }> = [];
    
    const now = new Date();
    for (let i = 0; i < dateRange; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      date.setHours(12, 0, 0, 0);
      
      const visibility = calculateTargetVisibility(ra, dec, latitude, longitude, 0, date);
      const sunPos = getSunPosition(getJulianDateFromDate(date));
      const sunAltAz = raDecToAltAz(sunPos.ra, sunPos.dec, latitude, longitude);
      
      results.push({
        date,
        riseTime: visibility.riseTime,
        transitTime: visibility.transitTime,
        setTime: visibility.setTime,
        transitAlt: visibility.transitAltitude,
        sunAlt: sunAltAz.altitude,
      });
    }
    
    return results;
  }, [ra, dec, latitude, longitude, dateRange]);
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };
  
  return (
    <div className="space-y-4">
      {/* Target Input */}
      <div className="grid grid-cols-4 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">{t('astroCalc.targetName')}</Label>
          <Input
            value={targetName}
            onChange={(e) => setTargetName(e.target.value)}
            placeholder="M31, NGC 7000..."
            className="h-8"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">RA (°)</Label>
          <Input
            value={targetRA}
            onChange={(e) => setTargetRA(e.target.value)}
            placeholder="10.68"
            className="h-8 font-mono"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Dec (°)</Label>
          <Input
            value={targetDec}
            onChange={(e) => setTargetDec(e.target.value)}
            placeholder="41.27"
            className="h-8 font-mono"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{t('astroCalc.daysAhead')}</Label>
          <Select value={dateRange.toString()} onValueChange={(v) => setDateRange(parseInt(v))}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="14">14 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Current info with altitude chart - reusing existing AltitudeChart component */}
      {ra && dec && (
        <div className="space-y-3">
          <div className="flex items-center gap-4 text-sm p-3 rounded-lg bg-muted/50">
            <div>
              <span className="text-muted-foreground">RA:</span>{' '}
              <span className="font-mono">{degreesToHMS(ra)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Dec:</span>{' '}
              <span className="font-mono">{degreesToDMS(dec)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">{t('astroCalc.maxAltitude')}:</span>{' '}
              <span>{(90 - Math.abs(latitude - dec)).toFixed(1)}°</span>
            </div>
          </div>
          
          {/* Reuse existing AltitudeChart component */}
          <AltitudeChart ra={ra} dec={dec} name={targetName} hoursAhead={12} />
        </div>
      )}
      
      {/* RTS Table */}
      <ScrollArea className="h-[350px] border rounded-lg">
        <Table>
          <TableHeader className="sticky top-0 bg-background">
            <TableRow>
              <TableHead>{t('astroCalc.date')}</TableHead>
              <TableHead>{t('astroCalc.rise')}</TableHead>
              <TableHead>{t('astroCalc.transit')}</TableHead>
              <TableHead>{t('astroCalc.transitAlt')}</TableHead>
              <TableHead>{t('astroCalc.set')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rtsData.map((day, i) => (
              <TableRow key={i}>
                <TableCell className="font-medium text-sm">{formatDate(day.date)}</TableCell>
                <TableCell className="font-mono text-xs">
                  {day.riseTime ? formatTimeShort(day.riseTime) : t('astroCalc.circumpolar')}
                </TableCell>
                <TableCell className="font-mono text-xs">{formatTimeShort(day.transitTime)}</TableCell>
                <TableCell className="text-xs">{day.transitAlt.toFixed(1)}°</TableCell>
                <TableCell className="font-mono text-xs">
                  {day.setTime ? formatTimeShort(day.setTime) : t('astroCalc.circumpolar')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}

// ============================================================================
// Ephemeris Tab Component  
// ============================================================================

interface EphemerisTabProps {
  latitude: number;
  longitude: number;
  selectedTarget?: { name: string; ra: number; dec: number };
}

function EphemerisTab({ latitude, longitude, selectedTarget }: EphemerisTabProps) {
  const t = useTranslations();
  const [targetRA, setTargetRA] = useState(selectedTarget?.ra?.toString() ?? '');
  const [targetDec, setTargetDec] = useState(selectedTarget?.dec?.toString() ?? '');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [stepHours, setStepHours] = useState(1);
  const [numSteps, setNumSteps] = useState(24);
  
  const ra = parseFloat(targetRA) || selectedTarget?.ra || 0;
  const dec = parseFloat(targetDec) || selectedTarget?.dec || 0;
  
  // Calculate ephemeris
  const ephemeris = useMemo(() => {
    if (!ra && !dec) return [];
    
    const results: EphemerisEntry[] = [];
    const start = new Date(startDate);
    
    for (let i = 0; i < numSteps; i++) {
      const date = new Date(start.getTime() + i * stepHours * 3600000);
      const altAz = raDecToAltAz(ra, dec, latitude, longitude);
      
      // For fixed stars, RA/Dec don't change
      // For planets/moon, we'd need orbital calculations here
      
      results.push({
        date,
        ra,
        dec,
        altitude: altAz.altitude,
        azimuth: altAz.azimuth,
      });
    }
    
    return results;
  }, [ra, dec, latitude, longitude, startDate, stepHours, numSteps]);
  
  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="grid grid-cols-5 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">{t('astroCalc.raLabel')}</Label>
          <Input
            value={targetRA}
            onChange={(e) => setTargetRA(e.target.value)}
            placeholder="10.68"
            className="h-8 font-mono"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{t('astroCalc.decLabel')}</Label>
          <Input
            value={targetDec}
            onChange={(e) => setTargetDec(e.target.value)}
            placeholder="41.27"
            className="h-8 font-mono"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{t('astroCalc.startDate')}</Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-8"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{t('astroCalc.stepHours')}</Label>
          <Select value={stepHours.toString()} onValueChange={(v) => setStepHours(parseInt(v))}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">{t('astroCalc.hourIntervals.1h')}</SelectItem>
              <SelectItem value="2">{t('astroCalc.hourIntervals.2h')}</SelectItem>
              <SelectItem value="6">{t('astroCalc.hourIntervals.6h')}</SelectItem>
              <SelectItem value="12">{t('astroCalc.hourIntervals.12h')}</SelectItem>
              <SelectItem value="24">{t('astroCalc.hourIntervals.1d')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{t('astroCalc.steps')}</Label>
          <Select value={numSteps.toString()} onValueChange={(v) => setNumSteps(parseInt(v))}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="12">12</SelectItem>
              <SelectItem value="24">24</SelectItem>
              <SelectItem value="48">48</SelectItem>
              <SelectItem value="168">{t('astroCalc.oneWeek')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Ephemeris Table */}
      <ScrollArea className="h-[380px] border rounded-lg">
        <Table>
          <TableHeader className="sticky top-0 bg-background">
            <TableRow>
              <TableHead>{t('astroCalc.dateTime')}</TableHead>
              <TableHead>{t('astroCalc.tableRA')}</TableHead>
              <TableHead>{t('astroCalc.tableDec')}</TableHead>
              <TableHead>{t('astroCalc.altitude')}</TableHead>
              <TableHead>{t('astroCalc.azimuth')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ephemeris.map((entry, i) => (
              <TableRow key={i}>
                <TableCell className="font-mono text-xs">
                  {entry.date.toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </TableCell>
                <TableCell className="font-mono text-xs">{degreesToHMS(entry.ra)}</TableCell>
                <TableCell className="font-mono text-xs">{degreesToDMS(entry.dec)}</TableCell>
                <TableCell className={cn(
                  'text-xs',
                  entry.altitude > 30 ? 'text-green-500' : entry.altitude > 0 ? 'text-yellow-500' : 'text-red-500'
                )}>
                  {entry.altitude.toFixed(1)}°
                </TableCell>
                <TableCell className="text-xs">{entry.azimuth.toFixed(1)}°</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}

// ============================================================================
// Phenomena Tab Component
// ============================================================================

interface PhenomenaEvent {
  date: Date;
  type: 'conjunction' | 'opposition' | 'elongation' | 'occultation' | 'close_approach';
  object1: string;
  object2?: string;
  separation?: number;
  details: string;
  importance: 'high' | 'medium' | 'low';
}

// Simple planetary position approximations (mean elements)
const PLANETS = {
  Mercury: { period: 87.969, meanLon0: 252.251, a: 0.387 },
  Venus: { period: 224.701, meanLon0: 181.980, a: 0.723 },
  Mars: { period: 686.980, meanLon0: 355.453, a: 1.524 },
  Jupiter: { period: 4332.59, meanLon0: 34.404, a: 5.203 },
  Saturn: { period: 10759.22, meanLon0: 49.944, a: 9.537 },
};

function getPlanetPosition(planet: keyof typeof PLANETS, jd: number) {
  const p = PLANETS[planet];
  const d = jd - 2451545.0; // Days from J2000
  const meanLon = (p.meanLon0 + 360 * d / p.period) % 360;
  // Very simplified - just for demonstration
  const ra = meanLon; // Approximate RA along ecliptic
  const dec = Math.sin(meanLon * Math.PI / 180) * 23.4 * (1 / p.a); // Simplified dec
  return { ra: (ra + 360) % 360, dec: Math.max(-90, Math.min(90, dec)) };
}

interface PhenomenaTabProps {
  latitude: number;
  longitude: number;
}

function PhenomenaTab({ latitude: _latitude, longitude: _longitude }: PhenomenaTabProps) {
  const t = useTranslations();
  const [daysAhead, setDaysAhead] = useState(30);
  const [showMinor, setShowMinor] = useState(false);
  
  // Calculate phenomena for the date range
  const phenomena = useMemo(() => {
    const events: PhenomenaEvent[] = [];
    const now = new Date();
    
    for (let d = 0; d < daysAhead; d++) {
      const date = new Date(now);
      date.setDate(date.getDate() + d);
      date.setHours(0, 0, 0, 0);
      const jd = getJulianDateFromDate(date);
      
      // Get moon position
      const moonPos = getMoonPosition(jd);
      const moonPhase = getMoonPhase(jd);
      
      // Check moon phase events
      if (d > 0) {
        const prevDate = new Date(date);
        prevDate.setDate(prevDate.getDate() - 1);
        const prevPhase = getMoonPhase(getJulianDateFromDate(prevDate));
        
        // New Moon
        if (prevPhase > 0.95 && moonPhase < 0.05) {
          events.push({
            date,
            type: 'conjunction',
            object1: 'Moon',
            object2: 'Sun',
            details: t('astroCalc.newMoon'),
            importance: 'high',
          });
        }
        // Full Moon
        if (prevPhase < 0.5 && moonPhase >= 0.5 && prevPhase > 0.45) {
          events.push({
            date,
            type: 'opposition',
            object1: 'Moon',
            details: t('astroCalc.fullMoon'),
            importance: 'high',
          });
        }
        // First Quarter
        if (prevPhase < 0.25 && moonPhase >= 0.25 && prevPhase > 0.2) {
          events.push({
            date,
            type: 'elongation',
            object1: 'Moon',
            separation: 90,
            details: t('astroCalc.firstQuarter'),
            importance: 'medium',
          });
        }
        // Last Quarter
        if (prevPhase < 0.75 && moonPhase >= 0.75 && prevPhase > 0.7) {
          events.push({
            date,
            type: 'elongation',
            object1: 'Moon',
            separation: 90,
            details: t('astroCalc.lastQuarter'),
            importance: 'medium',
          });
        }
      }
      
      // Check planetary conjunctions with moon
      Object.keys(PLANETS).forEach(planetName => {
        const planetPos = getPlanetPosition(planetName as keyof typeof PLANETS, jd);
        const sep = angularSeparation(moonPos.ra, moonPos.dec, planetPos.ra, planetPos.dec);
        
        if (sep < 5) {
          events.push({
            date,
            type: 'close_approach',
            object1: 'Moon',
            object2: planetName,
            separation: sep,
            details: t('astroCalc.moonFrom', { sep: sep.toFixed(1), planet: planetName }),
            importance: sep < 2 ? 'high' : 'medium',
          });
        }
      });
      
      // Check planetary conjunctions with each other
      const planetNames = Object.keys(PLANETS) as Array<keyof typeof PLANETS>;
      for (let i = 0; i < planetNames.length; i++) {
        for (let j = i + 1; j < planetNames.length; j++) {
          const pos1 = getPlanetPosition(planetNames[i], jd);
          const pos2 = getPlanetPosition(planetNames[j], jd);
          const sep = angularSeparation(pos1.ra, pos1.dec, pos2.ra, pos2.dec);
          
          if (sep < 3) {
            events.push({
              date,
              type: 'conjunction',
              object1: planetNames[i],
              object2: planetNames[j],
              separation: sep,
              details: t('astroCalc.planetFrom', { planet1: planetNames[i], sep: sep.toFixed(1), planet2: planetNames[j] }),
              importance: sep < 1 ? 'high' : 'medium',
            });
          }
        }
      }
    }
    
    // Filter and sort
    const filtered = showMinor ? events : events.filter(e => e.importance !== 'low');
    return filtered.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [daysAhead, showMinor, t]);
  
  const getEventIcon = (type: PhenomenaEvent['type']) => {
    switch (type) {
      case 'conjunction': return '☌';
      case 'opposition': return '☍';
      case 'elongation': return '◐';
      case 'occultation': return '◯';
      case 'close_approach': return '↔';
    }
  };
  
  const getImportanceColor = (importance: PhenomenaEvent['importance']) => {
    switch (importance) {
      case 'high': return 'text-amber-500';
      case 'medium': return 'text-blue-400';
      case 'low': return 'text-muted-foreground';
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">{t('astroCalc.daysAhead')}</Label>
            <Select value={daysAhead.toString()} onValueChange={(v) => setDaysAhead(parseInt(v))}>
              <SelectTrigger className="h-8 w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">{t('astroCalc.daysRange.7d')}</SelectItem>
                <SelectItem value="14">{t('astroCalc.daysRange.14d')}</SelectItem>
                <SelectItem value="30">{t('astroCalc.daysRange.30d')}</SelectItem>
                <SelectItem value="60">60 {t('astroCalc.events')}</SelectItem>
                <SelectItem value="90">{t('astroCalc.daysRange.90d')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <Switch
              id="showMinor"
              checked={showMinor}
              onCheckedChange={setShowMinor}
            />
            <Label htmlFor="showMinor" className="text-xs">{t('astroCalc.showMinorEvents')}</Label>
          </div>
        </div>
        
        <Badge variant="outline">
          {phenomena.length} {t('astroCalc.events')}
        </Badge>
      </div>
      
      <ScrollArea className="h-[420px] border rounded-lg">
        {phenomena.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            {t('astroCalc.noPhenomena')}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {phenomena.map((event, i) => (
              <div key={i} className="p-3 hover:bg-muted/50">
                <div className="flex items-start gap-3">
                  <span className={cn('text-xl', getImportanceColor(event.importance))}>
                    {getEventIcon(event.type)}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{event.details}</span>
                      <Badge variant={event.importance === 'high' ? 'default' : 'secondary'} className="text-[10px]">
                        {event.type.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {event.date.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                      {event.separation && ` • ${event.separation.toFixed(1)}° ${t('astroCalc.separation')}`}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
      
      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>☌ {t('astroCalc.conjunction')}</span>
        <span>☍ {t('astroCalc.opposition')}</span>
        <span>◐ {t('astroCalc.elongation')}</span>
        <span>↔ {t('astroCalc.closeApproach')}</span>
      </div>
    </div>
  );
}

// ============================================================================
// Almanac Tab Component
// ============================================================================

interface AlmanacTabProps {
  latitude: number;
  longitude: number;
}

function AlmanacTab({ latitude, longitude }: AlmanacTabProps) {
  const t = useTranslations();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const date = useMemo(() => new Date(selectedDate), [selectedDate]);
  const twilight = useMemo(() => calculateTwilightTimes(latitude, longitude, date), [latitude, longitude, date]);
  const moonPhase = useMemo(() => getMoonPhase(getJulianDateFromDate(date)), [date]);
  
  const moonPos = getMoonPosition(getJulianDateFromDate(date));
  const sunPos = getSunPosition(getJulianDateFromDate(date));
  const moonAltAz = raDecToAltAz(moonPos.ra, moonPos.dec, latitude, longitude);
  const sunAltAz = raDecToAltAz(sunPos.ra, sunPos.dec, latitude, longitude);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs">{t('astroCalc.date')}</Label>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="h-8 w-40"
          />
        </div>
        <div className="text-xs text-muted-foreground">
          <span>{t('astroCalc.sunAlt')}: {sunAltAz.altitude.toFixed(1)}°</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Sun Info */}
        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-2 mb-3">
            <Sun className="h-5 w-5 text-amber-500" />
            <span className="font-medium">{t('astroCalc.sun')}</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('astroCalc.sunrise')}</span>
              <span className="font-mono">{formatTimeShort(twilight.sunrise)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('astroCalc.sunset')}</span>
              <span className="font-mono">{formatTimeShort(twilight.sunset)}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('astroCalc.civilDusk')}</span>
              <span className="font-mono">{formatTimeShort(twilight.civilDusk)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('astroCalc.nauticalDusk')}</span>
              <span className="font-mono">{formatTimeShort(twilight.nauticalDusk)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('astroCalc.astroDusk')}</span>
              <span className="font-mono">{formatTimeShort(twilight.astronomicalDusk)}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('astroCalc.astroDawn')}</span>
              <span className="font-mono">{formatTimeShort(twilight.astronomicalDawn)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('astroCalc.nauticalDawn')}</span>
              <span className="font-mono">{formatTimeShort(twilight.nauticalDawn)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('astroCalc.civilDawn')}</span>
              <span className="font-mono">{formatTimeShort(twilight.civilDawn)}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('astroCalc.darknessDuration')}</span>
              <span className="font-medium">{formatDuration(twilight.darknessDuration)}</span>
            </div>
          </div>
        </div>
        
        {/* Moon Info */}
        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-2 mb-3">
            <Moon className="h-5 w-5 text-amber-400" />
            <span className="font-medium">{t('astroCalc.moon')}</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('astroCalc.phase')}</span>
              <span>{getMoonPhaseName(moonPhase)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('astroCalc.illumination')}</span>
              <span>{getMoonIllumination(moonPhase)}%</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">RA</span>
              <span className="font-mono">{degreesToHMS(moonPos.ra)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dec</span>
              <span className="font-mono">{degreesToDMS(moonPos.dec)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('astroCalc.currentAlt')}</span>
              <span className={moonAltAz.altitude > 0 ? 'text-amber-400' : ''}>
                {moonAltAz.altitude.toFixed(1)}°
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Moon Phase Calendar Preview */}
      <div className="p-4 rounded-lg border bg-card">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="h-5 w-5 text-primary" />
          <span className="font-medium">{t('astroCalc.moonPhaseCalendar')}</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {Array.from({ length: 14 }, (_, i) => {
            const d = new Date(date);
            d.setDate(d.getDate() + i);
            const phase = getMoonPhase(getJulianDateFromDate(d));
            const illum = getMoonIllumination(phase);
            const isNew = phase < 0.03 || phase > 0.97;
            const isFull = phase > 0.47 && phase < 0.53;
            
            return (
              <div
                key={i}
                className={cn(
                  'flex flex-col items-center p-2 rounded-lg min-w-[60px] text-xs',
                  isNew && 'bg-indigo-900/30',
                  isFull && 'bg-amber-900/30'
                )}
              >
                <span className="text-muted-foreground">
                  {d.toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
                <span className="font-medium">
                  {d.getDate()}
                </span>
                <div 
                  className="w-6 h-6 rounded-full mt-1 border"
                  style={{
                    background: `linear-gradient(90deg, 
                      ${illum > 50 ? '#fef3c7' : '#1e293b'} ${illum}%, 
                      #1e293b ${illum}%)`
                  }}
                />
                <span className="text-muted-foreground text-[10px] mt-1">{illum}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function AstroCalculatorDialog() {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('wut');
  
  const profileInfo = useMountStore((state) => state.profileInfo);
  const setViewDirection = useStellariumStore((state) => state.setViewDirection);
  const addTarget = useTargetListStore((state) => state.addTarget);
  
  const latitude = profileInfo.AstrometrySettings.Latitude || 0;
  const longitude = profileInfo.AstrometrySettings.Longitude || 0;
  
  const handleSelectObject = useCallback((ra: number, dec: number) => {
    if (setViewDirection) {
      setViewDirection(ra, dec);
    }
  }, [setViewDirection]);
  
  const handleAddToList = useCallback((name: string, ra: number, dec: number) => {
    addTarget({
      name,
      ra,
      dec,
      raString: degreesToHMS(ra),
      decString: degreesToDMS(dec),
      priority: 'medium',
    });
  }, [addTarget]);
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Calculator className="h-4 w-4" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t('astroCalc.title')}</p>
        </TooltipContent>
      </Tooltip>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              {t('astroCalc.title')}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-normal">
              <MapPin className="h-3 w-3" />
              <span>{latitude.toFixed(2)}°, {longitude.toFixed(2)}°</span>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="wut" className="text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              {t('astroCalc.wut')}
            </TabsTrigger>
            <TabsTrigger value="positions" className="text-xs">
              <Target className="h-3 w-3 mr-1" />
              {t('astroCalc.positions')}
            </TabsTrigger>
            <TabsTrigger value="rts" className="text-xs">
              <TrendingUp className="h-3 w-3 mr-1" />
              {t('astroCalc.rts')}
            </TabsTrigger>
            <TabsTrigger value="ephemeris" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {t('astroCalc.ephemeris')}
            </TabsTrigger>
            <TabsTrigger value="almanac" className="text-xs">
              <SunMoon className="h-3 w-3 mr-1" />
              {t('astroCalc.almanac')}
            </TabsTrigger>
            <TabsTrigger value="phenomena" className="text-xs">
              <Star className="h-3 w-3 mr-1" />
              {t('astroCalc.phenomena')}
            </TabsTrigger>
          </TabsList>
          
          <div className="flex-1 overflow-auto mt-4">
            <TabsContent value="wut" className="mt-0 h-full">
              <WUTTab
                latitude={latitude}
                longitude={longitude}
                onSelectObject={handleSelectObject}
                onAddToList={handleAddToList}
              />
            </TabsContent>
            
            <TabsContent value="positions" className="mt-0 h-full">
              <PositionsTab
                latitude={latitude}
                longitude={longitude}
                onSelectObject={handleSelectObject}
                onAddToList={handleAddToList}
              />
            </TabsContent>
            
            <TabsContent value="rts" className="mt-0 h-full">
              <RTSTab latitude={latitude} longitude={longitude} />
            </TabsContent>
            
            <TabsContent value="ephemeris" className="mt-0 h-full">
              <EphemerisTab latitude={latitude} longitude={longitude} />
            </TabsContent>
            
            <TabsContent value="almanac" className="mt-0 h-full">
              <AlmanacTab latitude={latitude} longitude={longitude} />
            </TabsContent>
            
            <TabsContent value="phenomena" className="mt-0 h-full">
              <PhenomenaTab latitude={latitude} longitude={longitude} />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
