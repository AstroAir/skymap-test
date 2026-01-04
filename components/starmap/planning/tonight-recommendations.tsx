'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { degreesToHMS, degreesToDMS } from '@/lib/astronomy/starmap-utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Sparkles,
  Moon,
  Clock,
  Mountain,
  Target,
  RefreshCw,
  Plus,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  MapPin,
  Sunrise,
  Sunset,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTonightRecommendations, useGeolocation, type RecommendedTarget, type TwilightInfo } from '@/lib/hooks';
import { useStellariumStore } from '@/lib/stores';
import { useTargetListStore } from '@/lib/stores/target-list-store';
import { useMountStore } from '@/lib/stores';
import { TranslatedName } from '../objects/translated-name';
import { useAstronomy } from '@/lib/tauri/hooks';

// ============================================================================
// Utility Functions
// ============================================================================

function getScoreBadgeVariant(score: number): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (score >= 80) return 'default';
  if (score >= 60) return 'secondary';
  return 'outline';
}

function formatTime(date: Date | null): string {
  if (!date) return '--:--';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ============================================================================
// Night Timeline Component - Beautiful day/night visualization
// ============================================================================

interface NightTimelineProps {
  twilight: TwilightInfo;
  currentTime: Date;
}

function NightTimeline({ twilight, currentTime }: NightTimelineProps) {
  const t = useTranslations();
  
  // Dynamically calculate timeline based on actual sunset/sunrise
  // Use sunset - 1 hour as start, sunrise + 1 hour as end
  const timelineStart = useMemo(() => {
    if (twilight.sunset) {
      const start = new Date(twilight.sunset);
      start.setHours(start.getHours() - 1);
      return start;
    }
    // Fallback: 6 PM today
    const fallback = new Date(currentTime);
    fallback.setHours(18, 0, 0, 0);
    return fallback;
  }, [twilight.sunset, currentTime]);
  
  const timelineEnd = useMemo(() => {
    if (twilight.sunrise) {
      const end = new Date(twilight.sunrise);
      end.setHours(end.getHours() + 1);
      return end;
    }
    // Fallback: 6 AM next day
    const fallback = new Date(currentTime);
    fallback.setDate(fallback.getDate() + 1);
    fallback.setHours(6, 0, 0, 0);
    return fallback;
  }, [twilight.sunrise, currentTime]);
  
  const totalMs = timelineEnd.getTime() - timelineStart.getTime();
  
  // Calculate positions as percentages
  const getPosition = (date: Date | null): number => {
    if (!date) return 0;
    const ms = date.getTime() - timelineStart.getTime();
    return Math.max(0, Math.min(100, (ms / totalMs) * 100));
  };
  
  const sunsetPos = getPosition(twilight.sunset);
  const civilDuskPos = getPosition(twilight.civilDusk);
  const nauticalDuskPos = getPosition(twilight.nauticalDusk);
  const astroDuskPos = getPosition(twilight.astronomicalDusk);
  const astroDawnPos = getPosition(twilight.astronomicalDawn);
  const nauticalDawnPos = getPosition(twilight.nauticalDawn);
  const civilDawnPos = getPosition(twilight.civilDawn);
  const sunrisePos = getPosition(twilight.sunrise);
  const currentPos = getPosition(currentTime);
  
  // Generate dynamic time labels based on timeline span
  const timeLabels = useMemo(() => {
    const labels: string[] = [];
    const spanHours = totalMs / (1000 * 60 * 60);
    const interval = spanHours > 10 ? 2 : 1; // 2 hour intervals for long nights
    
    const labelTime = new Date(timelineStart);
    while (labelTime <= timelineEnd) {
      labels.push(labelTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      labelTime.setHours(labelTime.getHours() + interval);
    }
    return labels.slice(0, 7); // Max 7 labels for display
  }, [timelineStart, timelineEnd, totalMs]);
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Sunset className="h-3 w-3" />
          {t('tonight.evening')}
        </span>
        <span className="flex items-center gap-1">
          {t('tonight.morning')}
          <Sunrise className="h-3 w-3" />
        </span>
      </div>
      
      {/* Main timeline bar */}
      <div className="relative h-8 rounded-lg overflow-hidden">
        {/* Background gradient - day to night to day */}
        <div className="absolute inset-0 flex">
          {/* Evening twilight gradient */}
          <div 
            className="h-full"
            style={{ 
              width: `${sunsetPos}%`,
              background: 'linear-gradient(to right, #f97316, #ea580c)',
            }}
          />
          {/* Civil twilight - orange to deep orange */}
          <div 
            className="h-full"
            style={{ 
              width: `${civilDuskPos - sunsetPos}%`,
              background: 'linear-gradient(to right, #ea580c, #c2410c)',
            }}
          />
          {/* Nautical twilight - deep orange to purple */}
          <div 
            className="h-full"
            style={{ 
              width: `${nauticalDuskPos - civilDuskPos}%`,
              background: 'linear-gradient(to right, #c2410c, #7c3aed)',
            }}
          />
          {/* Astronomical twilight - purple to dark blue */}
          <div 
            className="h-full"
            style={{ 
              width: `${astroDuskPos - nauticalDuskPos}%`,
              background: 'linear-gradient(to right, #7c3aed, #1e1b4b)',
            }}
          />
          {/* Full night - dark blue */}
          <div 
            className="h-full"
            style={{ 
              width: `${astroDawnPos - astroDuskPos}%`,
              background: '#0f0a1e',
            }}
          />
          {/* Morning astronomical twilight */}
          <div 
            className="h-full"
            style={{ 
              width: `${nauticalDawnPos - astroDawnPos}%`,
              background: 'linear-gradient(to right, #1e1b4b, #7c3aed)',
            }}
          />
          {/* Morning nautical twilight */}
          <div 
            className="h-full"
            style={{ 
              width: `${civilDawnPos - nauticalDawnPos}%`,
              background: 'linear-gradient(to right, #7c3aed, #c2410c)',
            }}
          />
          {/* Morning civil twilight */}
          <div 
            className="h-full"
            style={{ 
              width: `${sunrisePos - civilDawnPos}%`,
              background: 'linear-gradient(to right, #c2410c, #ea580c)',
            }}
          />
          {/* After sunrise */}
          <div 
            className="h-full flex-1"
            style={{ 
              background: 'linear-gradient(to right, #ea580c, #f97316)',
            }}
          />
        </div>
        
        {/* Stars overlay for night section */}
        <div 
          className="absolute top-0 h-full pointer-events-none"
          style={{ 
            left: `${astroDuskPos}%`,
            width: `${astroDawnPos - astroDuskPos}%`,
          }}
        >
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-0.5 h-0.5 bg-white rounded-full opacity-60"
              style={{
                left: `${(i * 8 + 4) % 100}%`,
                top: `${(i * 17 + 10) % 80 + 10}%`,
              }}
            />
          ))}
        </div>
        
        {/* Current time indicator */}
        {currentPos > 0 && currentPos < 100 && (
          <div 
            className="absolute top-0 h-full w-0.5 bg-white shadow-lg z-10"
            style={{ left: `${currentPos}%` }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rounded-full shadow" />
          </div>
        )}
        
        {/* Twilight markers */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className="absolute top-0 h-full w-px bg-orange-400/50 cursor-help"
              style={{ left: `${sunsetPos}%` }}
            />
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('tonight.sunset')}: {formatTime(twilight.sunset)}</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className="absolute top-0 h-full w-px bg-purple-400/50 cursor-help"
              style={{ left: `${astroDuskPos}%` }}
            />
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('tonight.astronomicalDusk')}: {formatTime(twilight.astronomicalDusk)}</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className="absolute top-0 h-full w-px bg-purple-400/50 cursor-help"
              style={{ left: `${astroDawnPos}%` }}
            />
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('tonight.astronomicalDawn')}: {formatTime(twilight.astronomicalDawn)}</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className="absolute top-0 h-full w-px bg-orange-400/50 cursor-help"
              style={{ left: `${sunrisePos}%` }}
            />
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('tonight.sunrise')}: {formatTime(twilight.sunrise)}</p>
          </TooltipContent>
        </Tooltip>
      </div>
      
      {/* Time labels */}
      <div className="flex justify-between text-[10px] text-muted-foreground px-1">
        {timeLabels.map((label, i) => (
          <span key={i}>{label}</span>
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-3 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-2 rounded-sm bg-linear-to-r from-orange-500 to-orange-700" />
          <span>{t('tonight.twilight')}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-2 rounded-sm bg-[#0f0a1e]" />
          <span>{t('tonight.darkSky')}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-white border border-muted" />
          <span>{t('tonight.now')}</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Moon Phase Visualization
// ============================================================================

interface MoonPhaseDisplayProps {
  phase: number;
  illumination: number;
  phaseName: string;
}

function MoonPhaseDisplay({ phase, illumination, phaseName }: MoonPhaseDisplayProps) {
  const t = useTranslations();
  
  // Calculate moon appearance
  // phase: 0 = new, 0.25 = first quarter, 0.5 = full, 0.75 = last quarter
  const isWaxing = phase < 0.5;
  const illuminatedPercent = illumination;
  
  return (
    <div className="flex items-center gap-3">
      {/* Moon visualization */}
      <div className="relative w-10 h-10">
        {/* Moon base (dark side) */}
        <div className="absolute inset-0 rounded-full bg-slate-800 border border-slate-600" />
        
        {/* Illuminated portion */}
        <div 
          className="absolute inset-0 rounded-full overflow-hidden"
          style={{
            background: `linear-gradient(${isWaxing ? '90deg' : '270deg'}, 
              #fef3c7 ${illuminatedPercent}%, 
              transparent ${illuminatedPercent}%)`,
          }}
        />
        
        {/* Subtle glow for bright moon */}
        {illumination > 50 && (
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              boxShadow: `0 0 ${illumination / 10}px ${illumination / 20}px rgba(254, 243, 199, 0.3)`,
            }}
          />
        )}
      </div>
      
      {/* Moon info */}
      <div className="flex-1">
        <div className="text-sm font-medium">{phaseName}</div>
        <div className="text-xs text-muted-foreground">
          {illumination}% {t('tonight.illuminated')}
        </div>
      </div>
    </div>
  );
}

// Target card component
function TargetCard({
  target,
  onSelect,
  onAddToList,
}: {
  target: RecommendedTarget;
  onSelect: () => void;
  onAddToList: () => void;
}) {
  const t = useTranslations();
  
  return (
    <div className="p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Button
              variant="link"
              className="h-auto p-0 text-sm font-medium hover:text-primary transition-colors truncate"
              onClick={onSelect}
            >
              <TranslatedName name={target.Name} />
            </Button>
            <Badge variant={getScoreBadgeVariant(target.score)} className="shrink-0">
              {target.score}
            </Badge>
          </div>
          {target['Common names'] && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              <TranslatedName name={target['Common names']} />
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-1 shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onAddToList}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('actions.addToTargetList')}</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onSelect}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('tonight.goToTarget')}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
      
      {/* Stats row */}
      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
        <Tooltip>
          <TooltipTrigger className="flex items-center gap-1">
            <Mountain className="h-3 w-3" />
            <span>{target.maxAltitude.toFixed(0)}°</span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('tonight.maxAltitude')}</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{target.imagingHours.toFixed(1)}h</span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('tonight.imagingTime')}</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger className="flex items-center gap-1">
            <Moon className="h-3 w-3" />
            <span>{target.moonDistance.toFixed(0)}°</span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('tonight.moonDistance')}</p>
          </TooltipContent>
        </Tooltip>
        
        {target.transitTime && (
          <Tooltip>
            <TooltipTrigger className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              <span>{formatTime(target.transitTime)}</span>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('tonight.transitTime')}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      
      {/* Reasons and warnings */}
      {(target.reasons.length > 0 || target.warnings.length > 0) && (
        <div className="mt-2 space-y-1">
          {target.reasons.slice(0, 2).map((reason, i) => (
            <div key={i} className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-3 w-3 shrink-0" />
              <span className="truncate">{reason}</span>
            </div>
          ))}
          {target.warnings.slice(0, 1).map((warning, i) => (
            <div key={i} className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              <span className="truncate">{warning}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function TonightRecommendations() {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'score' | 'altitude' | 'time'>('score');
  const [filterType, setFilterType] = useState<'all' | 'galaxy' | 'nebula' | 'cluster'>('all');
  
  const { recommendations, conditions, isLoading, refresh } = useTonightRecommendations();
  const setViewDirection = useStellariumStore((state) => state.setViewDirection);
  const addTarget = useTargetListStore((state) => state.addTarget);
  const setProfileInfo = useMountStore((state) => state.setProfileInfo);
  
  // Geolocation hook
  const geolocation = useGeolocation({ autoRequest: false });
  
  // Tauri astronomy hook for enhanced data in desktop mode
  const astronomy = useAstronomy(conditions?.latitude, conditions?.longitude);
  
  // Use Tauri moon data if available, otherwise fallback to conditions
  const moonPhaseData = useMemo(() => {
    if (astronomy.isAvailable && astronomy.moonPhase) {
      return {
        phase: astronomy.moonPhase.phase,
        illumination: astronomy.moonPhase.illumination * 100,
        phaseName: astronomy.moonPhase.phase_name,
      };
    }
    if (conditions) {
      return {
        phase: conditions.moonPhase,
        illumination: conditions.moonIllumination,
        phaseName: conditions.moonPhaseName,
      };
    }
    return null;
  }, [astronomy.isAvailable, astronomy.moonPhase, conditions]);
  
  // Handle location request and update mount store
  const handleRequestLocation = useCallback(async () => {
    await geolocation.requestLocation();
  }, [geolocation]);
  
  // Update profile when geolocation changes
  useEffect(() => {
    if (geolocation.latitude !== null && geolocation.longitude !== null) {
      setProfileInfo({
        AstrometrySettings: {
          Latitude: geolocation.latitude,
          Longitude: geolocation.longitude,
          Elevation: geolocation.altitude ?? 0,
        },
      });
      // Refresh recommendations with new location
      refresh();
    }
  }, [geolocation.latitude, geolocation.longitude, geolocation.altitude, setProfileInfo, refresh]);
  
  // Sort and filter recommendations
  const filteredRecommendations = useMemo(() => {
    let filtered = [...recommendations];
    
    // Filter by type (based on common names or target name patterns)
    if (filterType !== 'all') {
      filtered = filtered.filter(target => {
        const name = (target['Common names'] || '').toLowerCase();
        switch (filterType) {
          case 'galaxy':
            return name.includes('galaxy') || name.includes('galax');
          case 'nebula':
            return name.includes('nebula') || name.includes('planetary');
          case 'cluster':
            return name.includes('cluster') || name.includes('pleiades');
          default:
            return true;
        }
      });
    }
    
    // Sort
    switch (sortBy) {
      case 'altitude':
        filtered.sort((a, b) => b.maxAltitude - a.maxAltitude);
        break;
      case 'time':
        filtered.sort((a, b) => b.imagingHours - a.imagingHours);
        break;
      default:
        filtered.sort((a, b) => b.score - a.score);
    }
    
    return filtered;
  }, [recommendations, sortBy, filterType]);
  
  const handleSelectTarget = useCallback((target: RecommendedTarget) => {
    if (setViewDirection && target.RA !== undefined && target.Dec !== undefined) {
      setViewDirection(target.RA, target.Dec);
    }
  }, [setViewDirection]);
  
  const handleAddToList = useCallback((target: RecommendedTarget) => {
    if (target.RA !== undefined && target.Dec !== undefined) {
      addTarget({
        name: target.Name,
        ra: target.RA,
        dec: target.Dec,
        raString: degreesToHMS(target.RA),
        decString: degreesToDMS(target.Dec),
        priority: 'medium',
      });
    }
  }, [addTarget]);
  
  const handleAddAllToList = useCallback(() => {
    filteredRecommendations.slice(0, 10).forEach(target => {
      if (target.RA !== undefined && target.Dec !== undefined) {
        addTarget({
          name: target.Name,
          ra: target.RA,
          dec: target.Dec,
          raString: degreesToHMS(target.RA),
          decString: degreesToDMS(target.Dec),
          priority: 'medium',
        });
      }
    });
  }, [filteredRecommendations, addTarget]);
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
            >
              <Sparkles className="h-4 w-4" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t('tonight.recommendations')}</p>
        </TooltipContent>
      </Tooltip>
      
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {t('tonight.title')}
          </DialogTitle>
        </DialogHeader>
        
        {/* Tonight's conditions with beautiful visualization */}
        {conditions && (
          <div className="shrink-0 space-y-4 p-4 rounded-xl bg-linear-to-br from-slate-900/80 to-slate-800/80 border border-slate-700/50">
            {/* Header with refresh */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-200">{t('tonight.conditions')}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-slate-400 hover:text-slate-200"
                onClick={refresh}
                disabled={isLoading}
              >
                <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
              </Button>
            </div>
            
            {/* Night Timeline */}
            <NightTimeline twilight={conditions.twilight} currentTime={conditions.currentTime} />
            
            {/* Moon and Location Info */}
            <div className="grid grid-cols-2 gap-4">
              {/* Moon Phase - uses Tauri data when available */}
              {moonPhaseData && (
                <MoonPhaseDisplay 
                  phase={moonPhaseData.phase}
                  illumination={moonPhaseData.illumination}
                  phaseName={moonPhaseData.phaseName}
                />
              )}
              
              {/* Quick Stats */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <span>{conditions.totalDarkHours.toFixed(1)}h {t('tonight.darkHours')}</span>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                      onClick={handleRequestLocation}
                      disabled={geolocation.loading}
                    >
                      <MapPin className={cn('h-3.5 w-3.5', geolocation.loading && 'animate-pulse')} />
                      <span>{conditions.latitude.toFixed(2)}°, {conditions.longitude.toFixed(2)}°</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('tonight.clickToUpdateLocation')}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        )}
        
        {/* Filter and Sort Controls */}
        <div className="shrink-0 flex items-center gap-2 flex-wrap">
          {/* Filter buttons */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-muted-foreground mr-1">{t('tonight.filter')}:</span>
            {(['all', 'galaxy', 'nebula', 'cluster'] as const).map((type) => (
              <Button
                key={type}
                variant={filterType === type ? 'default' : 'outline'}
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => setFilterType(type)}
              >
                {t(`tonight.filterType.${type}`)}
              </Button>
            ))}
          </div>
          
          {/* Sort buttons */}
          <div className="flex items-center gap-1 text-xs ml-auto">
            <span className="text-muted-foreground mr-1">{t('tonight.sort')}:</span>
            {(['score', 'altitude', 'time'] as const).map((sort) => (
              <Button
                key={sort}
                variant={sortBy === sort ? 'default' : 'outline'}
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => setSortBy(sort)}
              >
                {t(`tonight.sortType.${sort}`)}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Recommendations list */}
        <div className="flex-1 min-h-0 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {t('tonight.topTargets')} ({filteredRecommendations.length})
            </span>
            {filteredRecommendations.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs gap-1"
                onClick={handleAddAllToList}
              >
                <Plus className="h-3 w-3" />
                {t('tonight.addTop10')}
              </Button>
            )}
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredRecommendations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{t('tonight.noRecommendations')}</p>
            </div>
          ) : (
            <ScrollArea className="h-[280px]">
              <div className="space-y-2 pr-2">
                {filteredRecommendations.map((target, index) => (
                  <TargetCard
                    key={`${target.Name}-${index}`}
                    target={target}
                    onSelect={() => handleSelectTarget(target)}
                    onAddToList={() => handleAddToList(target)}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
        
        {/* Score legend */}
        <div className="shrink-0 flex items-center justify-center gap-4 pt-2 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span>80+ {t('tonight.excellent')}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <span>60+ {t('tonight.good')}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-orange-500" />
            <span>40+ {t('tonight.fair')}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


