'use client';

import { useState, useMemo, useCallback, useEffect, memo } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Collapsible,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import {
  Satellite,
  Search,
  Eye,
  Clock,
  MapPin,
  RefreshCw,
  Star,
  Orbit,
  ArrowUp,
  Timer,
  Wifi,
  WifiOff,
  Settings,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMountStore, useStellariumStore, useSatelliteStore, type TrackedSatellite } from '@/lib/starmap/stores';
import { parseTLE, calculatePosition, type ObserverLocation } from '@/lib/starmap/satellite-propagator';

// ============================================================================
// Types
// ============================================================================

interface SatelliteData {
  id: string;
  name: string;
  noradId: number;
  type: 'iss' | 'starlink' | 'weather' | 'gps' | 'communication' | 'scientific' | 'amateur' | 'other';
  altitude: number;
  velocity: number;
  inclination: number;
  period: number;
  ra?: number;
  dec?: number;
  azimuth?: number;
  elevation?: number;
  magnitude?: number;
  isVisible: boolean;
  source?: string;
}

interface SatellitePass {
  satellite: SatelliteData;
  startTime: Date;
  maxTime: Date;
  endTime: Date;
  startAz: number;
  maxAz: number;
  maxEl: number;
  endAz: number;
  magnitude?: number;
  duration: number;
}

interface DataSourceConfig {
  id: string;
  name: string;
  enabled: boolean;
  apiUrl: string;
}

// ============================================================================
// Data Sources Configuration
// ============================================================================

const SATELLITE_SOURCES: DataSourceConfig[] = [
  { id: 'celestrak', name: 'CelesTrak', enabled: true, apiUrl: 'https://celestrak.org' },
  { id: 'n2yo', name: 'N2YO', enabled: true, apiUrl: 'https://api.n2yo.com' },
  { id: 'heavensabove', name: 'Heavens-Above', enabled: false, apiUrl: 'https://heavens-above.com' },
];

// ============================================================================
// API Functions
// ============================================================================

async function fetchSatellitesFromCelesTrak(
  category: string = 'stations',
  observer?: ObserverLocation
): Promise<SatelliteData[]> {
  try {
    const response = await fetch(
      `https://celestrak.org/NORAD/elements/gp.php?GROUP=${category}&FORMAT=json`,
      { next: { revalidate: 3600 } }
    );
    
    if (!response.ok) throw new Error('CelesTrak API error');
    
    const data = await response.json();
    const now = new Date();
    
    return data.map((sat: {
      OBJECT_NAME: string;
      NORAD_CAT_ID: number;
      MEAN_MOTION: number;
      INCLINATION: number;
      TLE_LINE1: string;
      TLE_LINE2: string;
    }) => {
      const meanMotion = sat.MEAN_MOTION;
      const period = 1440 / meanMotion;
      const altitude = Math.pow((398600.4418 * Math.pow(period * 60 / (2 * Math.PI), 2)), 1/3) - 6371;
      const velocity = Math.sqrt(398600.4418 / (6371 + altitude));
      
      // Try to calculate real position using SGP4
      let ra: number | undefined;
      let dec: number | undefined;
      let azimuth: number | undefined;
      let elevation: number | undefined;
      let isVisible = false;
      
      if (sat.TLE_LINE1 && sat.TLE_LINE2 && observer) {
        const satrec = parseTLE({
          name: sat.OBJECT_NAME,
          line1: sat.TLE_LINE1,
          line2: sat.TLE_LINE2,
        });
        
        if (satrec) {
          const position = calculatePosition(satrec, now, observer);
          if (position) {
            ra = position.ra;
            dec = position.dec;
            azimuth = position.azimuth;
            elevation = position.elevation;
            isVisible = position.isVisible;
          }
        }
      }
      
      // Fallback to simulated position if SGP4 fails
      if (ra === undefined || dec === undefined) {
        const simPosition = getSimulatedSatellitePosition(sat.NORAD_CAT_ID, sat.INCLINATION, period);
        ra = simPosition.ra;
        dec = simPosition.dec;
      }
      
      return {
        id: `celestrak-${sat.NORAD_CAT_ID}`,
        name: sat.OBJECT_NAME,
        noradId: sat.NORAD_CAT_ID,
        type: categorizeSatellite(sat.OBJECT_NAME, category),
        altitude: Math.round(altitude),
        velocity: parseFloat(velocity.toFixed(2)),
        inclination: sat.INCLINATION,
        period: parseFloat(period.toFixed(1)),
        ra,
        dec,
        azimuth,
        elevation,
        isVisible,
        source: 'CelesTrak',
      };
    });
  } catch (error) {
    console.warn('Failed to fetch from CelesTrak:', error);
    return [];
  }
}

function categorizeSatellite(name: string, category: string): SatelliteData['type'] {
  const upperName = name.toUpperCase();
  if (upperName.includes('ISS') || upperName.includes('ZARYA') || upperName.includes('TIANGONG')) return 'iss';
  if (upperName.includes('STARLINK')) return 'starlink';
  if (upperName.includes('GPS') || upperName.includes('NAVSTAR') || upperName.includes('GLONASS')) return 'gps';
  if (upperName.includes('NOAA') || upperName.includes('GOES') || upperName.includes('METEO')) return 'weather';
  if (upperName.includes('HUBBLE') || upperName.includes('JWST') || upperName.includes('CHANDRA')) return 'scientific';
  if (category === 'amateur') return 'amateur';
  return 'other';
}

// ============================================================================
// Fallback Sample Data
// ============================================================================

// Generate simulated RA/Dec for satellites based on time
function getSimulatedSatellitePosition(noradId: number, inclination: number, period: number): { ra: number; dec: number } {
  const now = Date.now();
  // Use NORAD ID and time to create unique but deterministic positions
  const orbitalPhase = ((now / 1000 / 60) % period) / period; // 0-1 based on orbital period
  const ra = ((noradId * 137.5 + orbitalPhase * 360) % 360);
  // Dec oscillates based on inclination
  const dec = Math.sin(orbitalPhase * 2 * Math.PI) * inclination * 0.8;
  return { ra, dec };
}

const SAMPLE_SATELLITES: SatelliteData[] = [
  {
    id: 'iss',
    name: 'ISS (ZARYA)',
    noradId: 25544,
    type: 'iss',
    altitude: 420,
    velocity: 7.66,
    inclination: 51.6,
    period: 92.9,
    magnitude: -3.5,
    isVisible: true,
    ra: 45.2,
    dec: 23.5,
  },
  {
    id: 'hst',
    name: 'Hubble Space Telescope',
    noradId: 20580,
    type: 'scientific',
    altitude: 540,
    velocity: 7.59,
    inclination: 28.5,
    period: 95.4,
    magnitude: 1.5,
    isVisible: false,
    ra: 120.8,
    dec: -15.3,
  },
  {
    id: 'tiangong',
    name: 'Tiangong (CSS)',
    noradId: 48274,
    type: 'iss',
    altitude: 390,
    velocity: 7.68,
    inclination: 41.5,
    period: 91.5,
    magnitude: -2.0,
    isVisible: true,
    ra: 200.5,
    dec: 35.2,
  },
  {
    id: 'starlink-1',
    name: 'Starlink-1007',
    noradId: 44713,
    type: 'starlink',
    altitude: 550,
    velocity: 7.59,
    inclination: 53.0,
    period: 95.6,
    magnitude: 5.5,
    isVisible: false,
    ra: 280.3,
    dec: 42.1,
  },
  {
    id: 'starlink-2',
    name: 'Starlink-1008',
    noradId: 44714,
    type: 'starlink',
    altitude: 550,
    velocity: 7.59,
    inclination: 53.0,
    period: 95.6,
    magnitude: 5.5,
    isVisible: false,
    ra: 310.7,
    dec: -28.4,
  },
];

// Generate sample passes
function generateSamplePasses(satellites: SatelliteData[]): SatellitePass[] {
  const passes: SatellitePass[] = [];
  const now = new Date();
  
  satellites.forEach((sat, index) => {
    // Generate 1-3 passes per satellite in the next 24 hours
    const numPasses = 1 + (index % 3);
    
    for (let i = 0; i < numPasses; i++) {
      const startOffset = (index * 2 + i * 6) * 60 * 60 * 1000; // hours offset
      const startTime = new Date(now.getTime() + startOffset);
      const duration = 4 + (index % 5); // 4-8 minutes
      const maxTime = new Date(startTime.getTime() + (duration / 2) * 60 * 1000);
      const endTime = new Date(startTime.getTime() + duration * 60 * 1000);
      
      passes.push({
        satellite: sat,
        startTime,
        maxTime,
        endTime,
        startAz: (45 + index * 30) % 360,
        maxAz: (135 + index * 30) % 360,
        maxEl: 30 + (index * 15) % 60,
        endAz: (225 + index * 30) % 360,
        magnitude: sat.magnitude,
        duration,
      });
    }
  });
  
  // Sort by start time
  passes.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  
  return passes;
}

// ============================================================================
// Satellite Card Component (Memoized)
// ============================================================================

const SatelliteCard = memo(function SatelliteCard({ 
  satellite, 
  onTrack 
}: { 
  satellite: SatelliteData; 
  onTrack: () => void;
}) {
  const t = useTranslations();
  
  const getTypeColor = (type: SatelliteData['type']) => {
    switch (type) {
      case 'iss': return 'bg-blue-500/20 text-blue-400';
      case 'starlink': return 'bg-purple-500/20 text-purple-400';
      case 'weather': return 'bg-cyan-500/20 text-cyan-400';
      case 'gps': return 'bg-green-500/20 text-green-400';
      case 'communication': return 'bg-orange-500/20 text-orange-400';
      case 'scientific': return 'bg-pink-500/20 text-pink-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };
  
  const getTypeLabel = (type: SatelliteData['type']) => {
    switch (type) {
      case 'iss': return t('satellites.typeISS');
      case 'starlink': return t('satellites.typeStarlink');
      case 'weather': return t('satellites.typeWeather');
      case 'gps': return t('satellites.typeGPS');
      case 'communication': return t('satellites.typeComm');
      case 'scientific': return t('satellites.typeScientific');
      default: return t('satellites.typeOther');
    }
  };
  
  return (
    <Card className="border-border hover:border-primary/50 transition-colors">
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Satellite className="h-4 w-4 text-primary shrink-0" />
              <span className="font-medium text-sm truncate">{satellite.name}</span>
              {satellite.isVisible && (
                <Badge className="bg-green-500/20 text-green-400 text-[10px]">
                  {t('satellites.visible')}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2 mb-2">
              <Badge className={cn('text-[10px]', getTypeColor(satellite.type))}>
                {getTypeLabel(satellite.type)}
              </Badge>
              <span className="text-xs text-muted-foreground">
                NORAD: {satellite.noradId}
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
              <div>
                <span className="block text-[10px]">{t('satellites.altitude')}</span>
                <span className="text-foreground">{satellite.altitude} km</span>
              </div>
              <div>
                <span className="block text-[10px]">{t('satellites.velocity')}</span>
                <span className="text-foreground">{satellite.velocity} km/s</span>
              </div>
              <div>
                <span className="block text-[10px]">{t('satellites.period')}</span>
                <span className="text-foreground">{satellite.period.toFixed(1)} min</span>
              </div>
            </div>
          </div>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={onTrack}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('satellites.track')}</TooltipContent>
          </Tooltip>
        </div>
      </CardContent>
    </Card>
  );
});

// ============================================================================
// Pass Card Component (Memoized)
// ============================================================================

const PassCard = memo(function PassCard({ 
  pass, 
  onTrack 
}: { 
  pass: SatellitePass; 
  onTrack: () => void;
}) {
  const t = useTranslations();
  const now = new Date();
  const isActive = pass.startTime <= now && pass.endTime >= now;
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(undefined, { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };
  
  const getTimeUntil = () => {
    if (isActive) return t('satellites.inProgress');
    const diff = pass.startTime.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };
  
  return (
    <Card className={cn(
      'border-border transition-colors',
      isActive && 'border-green-500/50 bg-green-500/5'
    )}>
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm truncate">{pass.satellite.name}</span>
              {isActive && (
                <Badge className="bg-green-500/20 text-green-400 text-[10px] animate-pulse">
                  {t('satellites.live')}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
              <div className="flex items-center gap-1">
                <Timer className="h-3 w-3" />
                <span>{getTimeUntil()}</span>
              </div>
              <div className="flex items-center gap-1">
                <ArrowUp className="h-3 w-3" />
                <span>{pass.maxEl}°</span>
              </div>
              {pass.magnitude && (
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  <span>mag {pass.magnitude.toFixed(1)}</span>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center p-1 bg-muted/50 rounded">
                <div className="text-[10px] text-muted-foreground">{t('satellites.start')}</div>
                <div className="font-mono">{formatTime(pass.startTime)}</div>
                <div className="text-[10px] text-muted-foreground">{pass.startAz}° Az</div>
              </div>
              <div className="text-center p-1 bg-primary/10 rounded">
                <div className="text-[10px] text-muted-foreground">{t('satellites.max')}</div>
                <div className="font-mono text-primary">{formatTime(pass.maxTime)}</div>
                <div className="text-[10px] text-primary">{pass.maxEl}° El</div>
              </div>
              <div className="text-center p-1 bg-muted/50 rounded">
                <div className="text-[10px] text-muted-foreground">{t('satellites.end')}</div>
                <div className="font-mono">{formatTime(pass.endTime)}</div>
                <div className="text-[10px] text-muted-foreground">{pass.endAz}° Az</div>
              </div>
            </div>
          </div>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={onTrack}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('satellites.track')}</TooltipContent>
          </Tooltip>
        </div>
      </CardContent>
    </Card>
  );
});

// ============================================================================
// Main Component
// ============================================================================

export function SatelliteTracker() {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyVisible, setShowOnlyVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [activeTab, setActiveTab] = useState<'passes' | 'catalog'>('passes');
  const [showSettings, setShowSettings] = useState(false);
  const [dataSources, setDataSources] = useState(() => 
    SATELLITE_SOURCES.map(s => ({ ...s }))
  );
  
  const setViewDirection = useStellariumStore((state) => state.setViewDirection);
  const profileInfo = useMountStore((state) => state.profileInfo);
  
  // Satellite display store
  const showSatellitesOnMap = useSatelliteStore((state) => state.showSatellites);
  const setShowSatellitesOnMap = useSatelliteStore((state) => state.setShowSatellites);
  const addTrackedSatellite = useSatelliteStore((state) => state.addTrackedSatellite);
  
  // Satellites state - start with sample data, fetch real data when online
  const [satellites, setSatellites] = useState<SatelliteData[]>(SAMPLE_SATELLITES);
  const passes = useMemo(() => generateSamplePasses(satellites), [satellites]);
  
  // Get observer location for SGP4 calculations
  const observerLocation: ObserverLocation = useMemo(() => ({
    latitude: profileInfo.AstrometrySettings.Latitude || 0,
    longitude: profileInfo.AstrometrySettings.Longitude || 0,
    altitude: profileInfo.AstrometrySettings.Elevation || 0,
  }), [profileInfo.AstrometrySettings]);
  
  // Fetch satellites when dialog opens
  useEffect(() => {
    if (!open) return;
    
    const fetchSatellites = async () => {
      setIsLoading(true);
      try {
        // Fetch from enabled sources
        const enabledSources = dataSources.filter(s => s.enabled);
        const allSatellites: SatelliteData[] = [];
        
        for (const source of enabledSources) {
          if (source.id === 'celestrak') {
            // Fetch multiple categories with observer location for SGP4
            const categories = ['stations', 'visual', 'active'];
            for (const cat of categories) {
              const sats = await fetchSatellitesFromCelesTrak(cat, observerLocation);
              allSatellites.push(...sats);
            }
          }
        }
        
        if (allSatellites.length > 0) {
          // Deduplicate by NORAD ID
          const uniqueSats = Array.from(
            new Map(allSatellites.map(s => [s.noradId, s])).values()
          );
          setSatellites(uniqueSats);
          setIsOnline(true);
        } else {
          // Fallback to sample data
          setSatellites(SAMPLE_SATELLITES);
          setIsOnline(false);
        }
      } catch (error) {
        console.error('Failed to fetch satellites:', error);
        setIsOnline(false);
        setSatellites(SAMPLE_SATELLITES);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSatellites();
  }, [open, dataSources, observerLocation]);
  
  // Filter satellites
  const filteredSatellites = useMemo(() => {
    let filtered = satellites;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(query) ||
        s.noradId.toString().includes(query)
      );
    }
    
    if (showOnlyVisible) {
      filtered = filtered.filter(s => s.isVisible);
    }
    
    return filtered;
  }, [satellites, searchQuery, showOnlyVisible]);
  
  // Filter passes (next 24 hours)
  const upcomingPasses = useMemo(() => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return passes.filter(p => p.endTime >= now && p.startTime <= tomorrow);
  }, [passes]);
  
  // Toggle data source
  const toggleDataSource = useCallback((id: string) => {
    setDataSources(prev => prev.map(s => 
      s.id === id ? { ...s, enabled: !s.enabled } : s
    ));
  }, []);
  
  // Handle track satellite - jump to position and add to tracked list
  const handleTrack = useCallback((satellite: SatelliteData) => {
    // Add to tracked satellites for rendering on map
    const trackedSat: TrackedSatellite = {
      id: satellite.id,
      name: satellite.name,
      noradId: satellite.noradId,
      type: satellite.type,
      altitude: satellite.altitude,
      velocity: satellite.velocity,
      inclination: satellite.inclination,
      period: satellite.period,
      ra: satellite.ra ?? 0,
      dec: satellite.dec ?? 0,
      azimuth: satellite.azimuth,
      elevation: satellite.elevation,
      magnitude: satellite.magnitude,
      isVisible: satellite.isVisible,
      source: satellite.source,
    };
    addTrackedSatellite(trackedSat);
    
    // Enable satellite display if not already
    if (!showSatellitesOnMap) {
      setShowSatellitesOnMap(true);
    }
    
    // Jump to satellite position
    if (setViewDirection && satellite.ra !== undefined && satellite.dec !== undefined) {
      setViewDirection(satellite.ra, satellite.dec);
      setOpen(false);
    } else {
      // If no coordinates, just close the dialog
      console.warn('Satellite has no RA/Dec coordinates:', satellite.name);
      setOpen(false);
    }
  }, [setViewDirection, addTrackedSatellite, showSatellitesOnMap, setShowSatellitesOnMap]);
  
  // Refresh data
  const handleRefresh = useCallback(() => {
    setSatellites([]);
    // Trigger re-fetch
    setDataSources(prev => [...prev]);
  }, []);
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <Satellite className="h-5 w-5" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t('satellites.tracker')}</p>
        </TooltipContent>
      </Tooltip>
      
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Satellite className="h-5 w-5 text-primary" />
            {t('satellites.satelliteTracker')}
          </DialogTitle>
        </DialogHeader>
        
        {/* Satellite Display Toggle */}
        <div className="flex items-center justify-between py-2 px-1 bg-muted/50 rounded-lg mb-2">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="show-satellites" className="text-sm font-medium">
              {t('satellites.showOnMap')}
            </Label>
          </div>
          <Switch
            id="show-satellites"
            checked={showSatellitesOnMap}
            onCheckedChange={setShowSatellitesOnMap}
          />
        </div>
        
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'passes' | 'catalog')} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2 shrink-0">
            <TabsTrigger value="passes" className="text-sm">
              <Clock className="h-4 w-4 mr-1" />
              {t('satellites.upcomingPasses')}
            </TabsTrigger>
            <TabsTrigger value="catalog" className="text-sm">
              <Orbit className="h-4 w-4 mr-1" />
              {t('satellites.catalog')}
            </TabsTrigger>
          </TabsList>
          
          {/* Passes Tab */}
          <TabsContent value="passes" className="flex-1 min-h-0 mt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">
                {t('satellites.next24Hours')} ({upcomingPasses.length})
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
              </Button>
            </div>
            
            <ScrollArea className="h-[400px]">
              <div className="space-y-2 pr-2">
                {upcomingPasses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Satellite className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{t('satellites.noPasses')}</p>
                  </div>
                ) : (
                  upcomingPasses.map((pass, index) => (
                    <PassCard 
                      key={`${pass.satellite.id}-${index}`}
                      pass={pass}
                      onTrack={() => handleTrack(pass.satellite)}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          
          {/* Catalog Tab */}
          <TabsContent value="catalog" className="flex-1 min-h-0 mt-4">
            <div className="space-y-3 mb-3">
              {/* Search & Status */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('satellites.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-9"
                  />
                </div>
                {isOnline ? (
                  <Badge variant="outline" className="text-green-500 border-green-500/50 shrink-0">
                    <Wifi className="h-3 w-3 mr-1" />
                    {t('satellites.online')}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-yellow-500 border-yellow-500/50 shrink-0">
                    <WifiOff className="h-3 w-3 mr-1" />
                    {t('satellites.offline')}
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() => setShowSettings(!showSettings)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Data Sources Settings */}
              <Collapsible open={showSettings} onOpenChange={setShowSettings}>
                <CollapsibleContent>
                  <Card className="border-dashed">
                    <CardContent className="p-3 space-y-2">
                      <div className="text-xs font-medium text-muted-foreground mb-2">
                        {t('satellites.dataSources')}
                      </div>
                      {dataSources.map(source => (
                        <div key={source.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`source-${source.id}`} className="text-sm">
                              {source.name}
                            </Label>
                            <a 
                              href={source.apiUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-primary"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                          <Switch
                            id={`source-${source.id}`}
                            checked={source.enabled}
                            onCheckedChange={() => toggleDataSource(source.id)}
                          />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </CollapsibleContent>
              </Collapsible>
              
              {/* Filter */}
              <div className="flex items-center justify-between">
                <Label htmlFor="visible-only" className="text-sm">
                  {t('satellites.showVisibleOnly')}
                </Label>
                <Switch
                  id="visible-only"
                  checked={showOnlyVisible}
                  onCheckedChange={setShowOnlyVisible}
                />
              </div>
            </div>
            
            <Separator className="mb-3" />
            
            <ScrollArea className="h-[300px]">
              <div className="space-y-2 pr-2">
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
                    <p className="text-sm">{t('satellites.loading')}</p>
                  </div>
                ) : filteredSatellites.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Satellite className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{t('satellites.noSatellites')}</p>
                  </div>
                ) : (
                  filteredSatellites.map(satellite => (
                    <SatelliteCard 
                      key={satellite.id}
                      satellite={satellite}
                      onTrack={() => handleTrack(satellite)}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
        
        {/* Location Info & Stats */}
        <div className="shrink-0 pt-2 border-t flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <MapPin className="h-3 w-3" />
            <span>
              {profileInfo.AstrometrySettings.Latitude?.toFixed(2)}°, 
              {profileInfo.AstrometrySettings.Longitude?.toFixed(2)}°
            </span>
          </div>
          <span>{filteredSatellites.length} {t('satellites.satellitesFound')}</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
