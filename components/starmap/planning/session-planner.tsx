'use client';

import { useState, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  CalendarClock,
  Clock,
  Moon,
  Sun,
  Target,
  ArrowRight,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Wand2,
  ListOrdered,
  Timer,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMountStore, useStellariumStore, useEquipmentStore } from '@/lib/stores';
import { useTargetListStore, type TargetItem } from '@/lib/stores/target-list-store';
import { degreesToHMS, degreesToDMS } from '@/lib/astronomy/starmap-utils';
import {
  calculateTwilightTimes,
  calculateTargetVisibility,
  calculateImagingFeasibility,
  getMoonPhase,
  getMoonPhaseName,
  getMoonIllumination,
  getMoonPosition,
  angularSeparation,
  formatTimeShort,
  formatDuration,
  type TwilightTimes,
  type ImagingFeasibility,
} from '@/lib/astronomy/astro-utils';

// ============================================================================
// Types
// ============================================================================

interface ScheduledTarget {
  target: TargetItem;
  startTime: Date;
  endTime: Date;
  duration: number; // hours
  transitTime: Date | null;
  maxAltitude: number;
  moonDistance: number;
  feasibility: ImagingFeasibility;
  conflicts: string[];
  isOptimal: boolean;
  order: number;
}

interface SessionPlan {
  targets: ScheduledTarget[];
  totalImagingTime: number;
  nightCoverage: number;
  efficiency: number;
  gaps: Array<{ start: Date; end: Date; duration: number }>;
  recommendations: string[];
  warnings: string[];
}

type OptimizationStrategy = 'altitude' | 'transit' | 'moon' | 'duration' | 'balanced';

// ============================================================================
// Scheduling Algorithm
// ============================================================================

function optimizeSchedule(
  targets: TargetItem[],
  latitude: number,
  longitude: number,
  twilight: TwilightTimes,
  strategy: OptimizationStrategy,
  minAltitude: number,
  minImagingTime: number // minutes
): SessionPlan {
  const moonPos = getMoonPosition();
  const moonPhase = getMoonPhase();
  const moonIllum = getMoonIllumination(moonPhase);
  
  // Calculate visibility for all targets
  const targetData = targets.map(target => {
    const visibility = calculateTargetVisibility(
      target.ra, target.dec, latitude, longitude, minAltitude
    );
    const feasibility = calculateImagingFeasibility(
      target.ra, target.dec, latitude, longitude
    );
    const moonDist = angularSeparation(target.ra, target.dec, moonPos.ra, moonPos.dec);
    
    return {
      target,
      visibility,
      feasibility,
      moonDistance: moonDist,
      transitTime: visibility.transitTime,
      maxAltitude: visibility.transitAltitude,
      darkStart: visibility.darkImagingStart,
      darkEnd: visibility.darkImagingEnd,
      darkHours: visibility.darkImagingHours,
    };
  });
  
  // Filter out targets without imaging time
  const viableTargets = targetData.filter(t => t.darkHours >= minImagingTime / 60);
  
  // Sort based on strategy
  const sortedTargets = [...viableTargets].sort((a, b) => {
    switch (strategy) {
      case 'altitude':
        return b.maxAltitude - a.maxAltitude;
      case 'transit':
        return (a.transitTime?.getTime() ?? 0) - (b.transitTime?.getTime() ?? 0);
      case 'moon':
        return b.moonDistance - a.moonDistance;
      case 'duration':
        return b.darkHours - a.darkHours;
      case 'balanced':
      default:
        // Weighted score combining all factors
        const scoreA = (a.feasibility.score * 0.4) + 
                       (a.maxAltitude * 0.3) + 
                       (a.moonDistance * 0.3);
        const scoreB = (b.feasibility.score * 0.4) + 
                       (b.maxAltitude * 0.3) + 
                       (b.moonDistance * 0.3);
        return scoreB - scoreA;
    }
  });
  
  // Schedule targets without overlap
  const scheduled: ScheduledTarget[] = [];
  const usedSlots: Array<{ start: number; end: number }> = [];
  
  for (let i = 0; i < sortedTargets.length; i++) {
    const td = sortedTargets[i];
    if (!td.darkStart || !td.darkEnd) continue;
    
    const targetStart = td.darkStart.getTime();
    const targetEnd = td.darkEnd.getTime();
    
    // Find available slot for this target
    let slotStart = targetStart;
    let slotEnd = targetEnd;
    
    // Check for overlaps and adjust
    for (const used of usedSlots) {
      if (slotStart < used.end && slotEnd > used.start) {
        // Overlap detected - try to fit around it
        if (used.start > slotStart && used.start - slotStart >= minImagingTime * 60000) {
          slotEnd = used.start;
        } else if (used.end < slotEnd && slotEnd - used.end >= minImagingTime * 60000) {
          slotStart = used.end;
        } else {
          // Can't fit - skip this target
          slotStart = 0;
          slotEnd = 0;
          break;
        }
      }
    }
    
    if (slotEnd - slotStart >= minImagingTime * 60000) {
      const duration = (slotEnd - slotStart) / 3600000;
      
      // Find conflicts
      const conflicts: string[] = [];
      for (const other of sortedTargets) {
        if (other.target.id === td.target.id) continue;
        if (!other.darkStart || !other.darkEnd) continue;
        
        const overlap = Math.max(0,
          Math.min(slotEnd, other.darkEnd.getTime()) -
          Math.max(slotStart, other.darkStart.getTime())
        ) / 3600000;
        
        if (overlap > 0.5) {
          conflicts.push(other.target.name);
        }
      }
      
      scheduled.push({
        target: td.target,
        startTime: new Date(slotStart),
        endTime: new Date(slotEnd),
        duration,
        transitTime: td.transitTime,
        maxAltitude: td.maxAltitude,
        moonDistance: td.moonDistance,
        feasibility: td.feasibility,
        conflicts,
        isOptimal: td.feasibility.score >= 70,
        order: scheduled.length + 1,
      });
      
      usedSlots.push({ start: slotStart, end: slotEnd });
      usedSlots.sort((a, b) => a.start - b.start);
    }
  }
  
  // Sort scheduled by start time
  scheduled.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  scheduled.forEach((s, i) => { s.order = i + 1; });
  
  // Calculate gaps
  const gaps: Array<{ start: Date; end: Date; duration: number }> = [];
  if (twilight.astronomicalDusk && twilight.astronomicalDawn) {
    const nightStart = twilight.astronomicalDusk.getTime();
    const nightEnd = twilight.astronomicalDawn.getTime();
    
    let lastEnd = nightStart;
    for (const s of scheduled) {
      if (s.startTime.getTime() > lastEnd) {
        const gapDuration = (s.startTime.getTime() - lastEnd) / 3600000;
        if (gapDuration > 0.25) { // > 15 min gap
          gaps.push({
            start: new Date(lastEnd),
            end: s.startTime,
            duration: gapDuration,
          });
        }
      }
      lastEnd = Math.max(lastEnd, s.endTime.getTime());
    }
    
    // Gap at end of night
    if (lastEnd < nightEnd) {
      const gapDuration = (nightEnd - lastEnd) / 3600000;
      if (gapDuration > 0.25) {
        gaps.push({
          start: new Date(lastEnd),
          end: new Date(nightEnd),
          duration: gapDuration,
        });
      }
    }
  }
  
  // Calculate totals
  const totalImagingTime = scheduled.reduce((sum, s) => sum + s.duration, 0);
  const nightCoverage = twilight.darknessDuration > 0
    ? (totalImagingTime / twilight.darknessDuration) * 100
    : 0;
  const efficiency = scheduled.length > 0
    ? scheduled.filter(s => s.isOptimal).length / scheduled.length * 100
    : 0;
  
  // Generate recommendations and warnings
  const recommendations: string[] = [];
  const warnings: string[] = [];
  
  if (nightCoverage < 50) {
    recommendations.push('Consider adding more targets to fill the night');
  }
  if (nightCoverage > 120) {
    warnings.push('Too many targets for one night - consider spreading across multiple sessions');
  }
  if (moonIllum > 70) {
    warnings.push('Bright moon tonight - consider narrowband imaging');
  }
  
  const excellentTargets = scheduled.filter(s => s.feasibility.recommendation === 'excellent');
  if (excellentTargets.length > 0) {
    recommendations.push(`Prioritize: ${excellentTargets.map(t => t.target.name).join(', ')}`);
  }
  
  if (gaps.length > 0) {
    const totalGapTime = gaps.reduce((sum, g) => sum + g.duration, 0);
    if (totalGapTime > 1) {
      recommendations.push(`${formatDuration(totalGapTime)} of unused dark time - consider adding targets`);
    }
  }
  
  return {
    targets: scheduled,
    totalImagingTime,
    nightCoverage,
    efficiency,
    gaps,
    recommendations,
    warnings,
  };
}

// ============================================================================
// Timeline Component
// ============================================================================

interface TimelineProps {
  plan: SessionPlan;
  twilight: TwilightTimes;
  onTargetClick: (target: TargetItem) => void;
}

function SessionTimeline({ plan, twilight, onTargetClick }: TimelineProps) {
  const t = useTranslations();
  
  if (!twilight.astronomicalDusk || !twilight.astronomicalDawn) {
    return (
      <div className="text-center text-muted-foreground py-4">
        {t('sessionPlanner.noNightTonight')}
      </div>
    );
  }
  
  const nightStart = twilight.astronomicalDusk.getTime();
  const nightEnd = twilight.astronomicalDawn.getTime();
  const nightDuration = nightEnd - nightStart;
  
  const getPosition = (time: Date) => {
    return ((time.getTime() - nightStart) / nightDuration) * 100;
  };
  
  const getWidth = (start: Date, end: Date) => {
    return ((end.getTime() - start.getTime()) / nightDuration) * 100;
  };
  
  // Color palette for targets
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-amber-500',
    'bg-pink-500', 'bg-cyan-500', 'bg-orange-500', 'bg-indigo-500',
  ];
  
  return (
    <div className="space-y-3">
      {/* Time markers */}
      <div className="relative h-6">
        <div className="absolute left-0 text-xs text-muted-foreground">
          {formatTimeShort(twilight.astronomicalDusk)}
        </div>
        <div className="absolute left-1/4 -translate-x-1/2 text-xs text-muted-foreground">
          {formatTimeShort(new Date(nightStart + nightDuration * 0.25))}
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
          {formatTimeShort(new Date(nightStart + nightDuration * 0.5))}
        </div>
        <div className="absolute left-3/4 -translate-x-1/2 text-xs text-muted-foreground">
          {formatTimeShort(new Date(nightStart + nightDuration * 0.75))}
        </div>
        <div className="absolute right-0 text-xs text-muted-foreground">
          {formatTimeShort(twilight.astronomicalDawn)}
        </div>
      </div>
      
      {/* Timeline bar */}
      <div className="relative h-12 bg-muted/50 rounded-lg overflow-hidden">
        {/* Twilight zones */}
        {twilight.nauticalDusk && (
          <div 
            className="absolute top-0 bottom-0 bg-indigo-900/30"
            style={{ 
              left: 0, 
              width: `${getPosition(twilight.astronomicalDusk)}%` 
            }}
          />
        )}
        {twilight.nauticalDawn && (
          <div 
            className="absolute top-0 bottom-0 bg-indigo-900/30"
            style={{ 
              left: `${getPosition(twilight.astronomicalDawn)}%`, 
              right: 0 
            }}
          />
        )}
        
        {/* Gaps */}
        {plan.gaps.map((gap, i) => (
          <div
            key={`gap-${i}`}
            className="absolute top-0 bottom-0 bg-red-900/20 border-x border-red-500/30"
            style={{
              left: `${getPosition(gap.start)}%`,
              width: `${getWidth(gap.start, gap.end)}%`,
            }}
          />
        ))}
        
        {/* Scheduled targets */}
        {plan.targets.map((scheduled, i) => (
          <Tooltip key={scheduled.target.id}>
            <TooltipTrigger asChild>
              <button
                className={cn(
                  'absolute top-1 bottom-1 rounded cursor-pointer transition-all hover:ring-2 ring-white/50',
                  colors[i % colors.length],
                  scheduled.isOptimal ? 'opacity-100' : 'opacity-70'
                )}
                style={{
                  left: `${getPosition(scheduled.startTime)}%`,
                  width: `${Math.max(getWidth(scheduled.startTime, scheduled.endTime), 2)}%`,
                }}
                onClick={() => onTargetClick(scheduled.target)}
              >
                <span className="absolute inset-0 flex items-center justify-center text-[10px] text-white font-medium truncate px-1">
                  {scheduled.target.name}
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-sm">
                <div className="font-medium">{scheduled.target.name}</div>
                <div className="text-muted-foreground">
                  {formatTimeShort(scheduled.startTime)} - {formatTimeShort(scheduled.endTime)}
                </div>
                <div className="text-muted-foreground">
                  {formatDuration(scheduled.duration)} • Max {scheduled.maxAltitude.toFixed(0)}°
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
        
        {/* Current time marker */}
        {(() => {
          const now = new Date();
          if (now.getTime() >= nightStart && now.getTime() <= nightEnd) {
            return (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                style={{ left: `${getPosition(now)}%` }}
              >
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full" />
              </div>
            );
          }
          return null;
        })()}
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {plan.targets.map((scheduled, i) => (
          <Badge
            key={scheduled.target.id}
            variant="outline"
            className={cn(
              'text-xs cursor-pointer',
              colors[i % colors.length].replace('bg-', 'border-')
            )}
            onClick={() => onTargetClick(scheduled.target)}
          >
            <span className={cn('w-2 h-2 rounded-full mr-1', colors[i % colors.length])} />
            {scheduled.target.name}
          </Badge>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Scheduled Target Card
// ============================================================================

interface TargetCardProps {
  scheduled: ScheduledTarget;
  onNavigate: () => void;
  onRemove: () => void;
}

function ScheduledTargetCard({ scheduled, onNavigate, onRemove: _onRemove }: TargetCardProps) {
  const t = useTranslations();
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className={cn(
      'border rounded-lg p-3 transition-colors',
      scheduled.isOptimal ? 'border-green-500/30 bg-green-500/5' : 'border-border'
    )}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-primary">{scheduled.order}</span>
            <Badge variant={scheduled.isOptimal ? 'default' : 'secondary'} className="text-[10px]">
              {scheduled.feasibility.score}
            </Badge>
          </div>
          <div>
            <div className="font-medium">{scheduled.target.name}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <Clock className="h-3 w-3" />
              {formatTimeShort(scheduled.startTime)} - {formatTimeShort(scheduled.endTime)}
              <span className="text-foreground">({formatDuration(scheduled.duration)})</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onNavigate}>
                <Eye className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('actions.goToTarget')}</TooltipContent>
          </Tooltip>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>
      
      {/* Quick stats */}
      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Target className="h-3 w-3" />
          Max {scheduled.maxAltitude.toFixed(0)}°
        </span>
        <span className="flex items-center gap-1">
          <Moon className="h-3 w-3" />
          {scheduled.moonDistance.toFixed(0)}° from moon
        </span>
        {scheduled.transitTime && (
          <span className="flex items-center gap-1">
            <ArrowRight className="h-3 w-3" />
            Transit {formatTimeShort(scheduled.transitTime)}
          </span>
        )}
      </div>
      
      {/* Expanded details */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-border space-y-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">RA:</span>{' '}
              <span className="font-mono">{degreesToHMS(scheduled.target.ra)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Dec:</span>{' '}
              <span className="font-mono">{degreesToDMS(scheduled.target.dec)}</span>
            </div>
          </div>
          
          {/* Feasibility breakdown */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{t('feasibility.moon')}</span>
              <Progress value={scheduled.feasibility.moonScore} className="w-20 h-1.5" />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{t('feasibility.altitude')}</span>
              <Progress value={scheduled.feasibility.altitudeScore} className="w-20 h-1.5" />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{t('feasibility.duration')}</span>
              <Progress value={scheduled.feasibility.durationScore} className="w-20 h-1.5" />
            </div>
          </div>
          
          {/* Conflicts */}
          {scheduled.conflicts.length > 0 && (
            <div className="flex items-start gap-2 text-xs text-amber-500">
              <AlertTriangle className="h-3 w-3 mt-0.5" />
              <span>Overlaps with: {scheduled.conflicts.join(', ')}</span>
            </div>
          )}
          
          {/* Tips */}
          {scheduled.feasibility.tips.length > 0 && (
            <div className="space-y-1">
              {scheduled.feasibility.tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Info className="h-3 w-3 mt-0.5" />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function SessionPlanner() {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [strategy, setStrategy] = useState<OptimizationStrategy>('balanced');
  const [minAltitude, setMinAltitude] = useState(30);
  const [minImagingTime, setMinImagingTime] = useState(30); // minutes
  const [_autoOptimize, _setAutoOptimize] = useState(true);
  const [showGaps, setShowGaps] = useState(true);
  
  const profileInfo = useMountStore((state) => state.profileInfo);
  const setViewDirection = useStellariumStore((state) => state.setViewDirection);
  const targets = useTargetListStore((state) => state.targets);
  const setActiveTarget = useTargetListStore((state) => state.setActiveTarget);
  
  // Equipment profile
  const focalLength = useEquipmentStore((state) => state.focalLength);
  const aperture = useEquipmentStore((state) => state.aperture);
  const sensorWidth = useEquipmentStore((state) => state.sensorWidth);
  const sensorHeight = useEquipmentStore((state) => state.sensorHeight);
  
  const latitude = profileInfo.AstrometrySettings.Latitude || 0;
  const longitude = profileInfo.AstrometrySettings.Longitude || 0;
  
  // Calculate FOV
  const fovWidth = sensorWidth && focalLength ? (sensorWidth / focalLength) * 57.3 : 0;
  const fovHeight = sensorHeight && focalLength ? (sensorHeight / focalLength) * 57.3 : 0;
  
  const twilight = useMemo(
    () => calculateTwilightTimes(latitude, longitude),
    [latitude, longitude]
  );
  
  const moonPhase = getMoonPhase();
  const moonIllum = getMoonIllumination(moonPhase);
  
  // Filter active targets (not archived)
  const activeTargets = useMemo(
    () => targets.filter(t => !t.isArchived && t.status !== 'completed'),
    [targets]
  );
  
  // Generate optimized plan
  const plan = useMemo(
    () => optimizeSchedule(
      activeTargets,
      latitude,
      longitude,
      twilight,
      strategy,
      minAltitude,
      minImagingTime
    ),
    [activeTargets, latitude, longitude, twilight, strategy, minAltitude, minImagingTime]
  );
  
  const handleTargetClick = useCallback((target: TargetItem) => {
    setActiveTarget(target.id);
    if (setViewDirection) {
      setViewDirection(target.ra, target.dec);
    }
  }, [setActiveTarget, setViewDirection]);
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <CalendarClock className="h-4 w-4" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t('sessionPlanner.title')}</p>
        </TooltipContent>
      </Tooltip>
      
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-primary" />
            {t('sessionPlanner.title')}
          </DialogTitle>
        </DialogHeader>
        
        {/* Night & Equipment Overview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <Sun className="h-4 w-4 text-amber-500" />
                <span className="text-muted-foreground">{t('sessionPlanner.darkTime')}:</span>
                <span className="font-medium">{formatDuration(twilight.darknessDuration)}</span>
              </div>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-1.5">
                <Moon className="h-4 w-4 text-amber-400" />
                <span className="text-muted-foreground">{getMoonPhaseName(moonPhase)}</span>
                <span>({moonIllum}%)</span>
              </div>
            </div>
            <Badge variant={twilight.isCurrentlyNight ? 'default' : 'secondary'}>
              {twilight.isCurrentlyNight ? t('sessionPlanner.night') : t('sessionPlanner.daylight')}
            </Badge>
          </div>
          
          {/* Equipment Info */}
          {focalLength > 0 && (
            <div className="flex items-center gap-4 px-3 py-2 text-xs text-muted-foreground">
              <span>{t('sessionPlanner.equipment')}:</span>
              <span>{focalLength}mm f/{aperture > 0 ? (focalLength / aperture).toFixed(1) : '?'}</span>
              <Separator orientation="vertical" className="h-3" />
              <span>FOV: {fovWidth.toFixed(1)}° × {fovHeight.toFixed(1)}°</span>
            </div>
          )}
        </div>
        
        {/* Settings */}
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between" size="sm">
              <span className="flex items-center gap-2">
                <Wand2 className="h-4 w-4" />
                {t('sessionPlanner.optimizationSettings')}
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">{t('sessionPlanner.strategy')}</Label>
                <Select value={strategy} onValueChange={(v) => setStrategy(v as OptimizationStrategy)}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="balanced">{t('sessionPlanner.strategyBalanced')}</SelectItem>
                    <SelectItem value="altitude">{t('sessionPlanner.strategyAltitude')}</SelectItem>
                    <SelectItem value="transit">{t('sessionPlanner.strategyTransit')}</SelectItem>
                    <SelectItem value="moon">{t('sessionPlanner.strategyMoon')}</SelectItem>
                    <SelectItem value="duration">{t('sessionPlanner.strategyDuration')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs">{t('sessionPlanner.minAltitude')}: {minAltitude}°</Label>
                <Slider
                  value={[minAltitude]}
                  onValueChange={([v]) => setMinAltitude(v)}
                  min={10}
                  max={60}
                  step={5}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs">{t('sessionPlanner.minImagingTime')}: {minImagingTime}m</Label>
                <Slider
                  value={[minImagingTime]}
                  onValueChange={([v]) => setMinImagingTime(v)}
                  min={15}
                  max={120}
                  step={15}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Switch checked={showGaps} onCheckedChange={setShowGaps} id="showGaps" />
                <Label htmlFor="showGaps" className="text-xs">{t('sessionPlanner.showGaps')}</Label>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
        
        <Separator />
        
        {/* Plan Summary */}
        <div className="grid grid-cols-4 gap-3">
          <div className="p-2 rounded-lg bg-muted/50 text-center">
            <div className="text-2xl font-bold text-primary">{plan.targets.length}</div>
            <div className="text-xs text-muted-foreground">{t('sessionPlanner.targets')}</div>
          </div>
          <div className="p-2 rounded-lg bg-muted/50 text-center">
            <div className="text-2xl font-bold text-primary">{formatDuration(plan.totalImagingTime)}</div>
            <div className="text-xs text-muted-foreground">{t('sessionPlanner.imagingTime')}</div>
          </div>
          <div className="p-2 rounded-lg bg-muted/50 text-center">
            <div className={cn(
              'text-2xl font-bold',
              plan.nightCoverage >= 80 ? 'text-green-500' : 
              plan.nightCoverage >= 50 ? 'text-amber-500' : 'text-red-500'
            )}>
              {plan.nightCoverage.toFixed(0)}%
            </div>
            <div className="text-xs text-muted-foreground">{t('sessionPlanner.nightCoverage')}</div>
          </div>
          <div className="p-2 rounded-lg bg-muted/50 text-center">
            <div className={cn(
              'text-2xl font-bold',
              plan.efficiency >= 70 ? 'text-green-500' : 
              plan.efficiency >= 50 ? 'text-amber-500' : 'text-red-500'
            )}>
              {plan.efficiency.toFixed(0)}%
            </div>
            <div className="text-xs text-muted-foreground">{t('sessionPlanner.efficiency')}</div>
          </div>
        </div>
        
        {/* Timeline */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Timer className="h-4 w-4" />
            {t('sessionPlanner.timeline')}
          </div>
          <SessionTimeline
            plan={plan}
            twilight={twilight}
            onTargetClick={handleTargetClick}
          />
        </div>
        
        {/* Recommendations & Warnings */}
        {(plan.recommendations.length > 0 || plan.warnings.length > 0) && (
          <div className="space-y-2">
            {plan.warnings.map((warning, i) => (
              <div key={`warn-${i}`} className="flex items-start gap-2 text-sm text-amber-500 p-2 rounded-lg bg-amber-500/10">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{warning}</span>
              </div>
            ))}
            {plan.recommendations.map((rec, i) => (
              <div key={`rec-${i}`} className="flex items-start gap-2 text-sm text-muted-foreground p-2 rounded-lg bg-muted/50">
                <Sparkles className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                <span>{rec}</span>
              </div>
            ))}
          </div>
        )}
        
        {/* Scheduled Targets List */}
        <div className="space-y-2 flex-1 min-h-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ListOrdered className="h-4 w-4" />
              {t('sessionPlanner.schedule')}
            </div>
            <Badge variant="outline" className="text-xs">
              {plan.targets.length} / {activeTargets.length} {t('sessionPlanner.scheduled')}
            </Badge>
          </div>
          
          <ScrollArea className="h-[200px]">
            <div className="space-y-2 pr-4">
              {plan.targets.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>{t('sessionPlanner.noTargets')}</p>
                  <p className="text-xs mt-1">{t('sessionPlanner.addTargetsHint')}</p>
                </div>
              ) : (
                plan.targets.map(scheduled => (
                  <ScheduledTargetCard
                    key={scheduled.target.id}
                    scheduled={scheduled}
                    onNavigate={() => handleTargetClick(scheduled.target)}
                    onRemove={() => {}}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </div>
        
        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const planText = plan.targets.map((t, i) => 
                  `${i + 1}. ${t.target.name}\n   ${formatTimeShort(t.startTime)} - ${formatTimeShort(t.endTime)} (${formatDuration(t.duration)})\n   Max Alt: ${t.maxAltitude.toFixed(0)}° | Moon: ${t.moonDistance.toFixed(0)}°`
                ).join('\n\n');
                const summary = `Session Plan - ${new Date().toLocaleDateString()}\n${'='.repeat(40)}\nTargets: ${plan.targets.length}\nTotal Time: ${formatDuration(plan.totalImagingTime)}\nCoverage: ${plan.nightCoverage.toFixed(0)}%\n\n${planText}`;
                navigator.clipboard.writeText(summary);
              }}
              disabled={plan.targets.length === 0}
            >
              {t('sessionPlanner.copyPlan')}
            </Button>
          </div>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t('common.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
