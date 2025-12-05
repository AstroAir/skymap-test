'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Crosshair, Clock, TrendingUp, Moon, Sun, 
  ArrowUp, ArrowDown, Timer, Star, Plus
} from 'lucide-react';
import { useOrientation } from '@/lib/hooks';
import { useMountStore, useTargetListStore } from '@/lib/stores';
import type { SelectedObjectData } from '@/lib/core/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { raDecToAltAz } from '@/lib/astronomy/starmap-utils';
import {
  calculateTargetVisibility,
  calculateImagingFeasibility,
  getMoonPosition,
  angularSeparation,
  formatTimeShort,
  formatDuration,
} from '@/lib/astronomy/astro-utils';

interface SelectedObjectProps {
  selectedObject: SelectedObjectData | null;
  onSetFramingCoordinates?: (data: {
    ra: number;
    dec: number;
    raString: string;
    decString: string;
    name: string;
  }) => void;
}

export function SelectedObject({ selectedObject, onSetFramingCoordinates }: SelectedObjectProps) {
  const { isLandscape } = useOrientation();
  const mountConnected = useMountStore((state) => state.mountInfo.Connected);
  const sequenceRunning = useMountStore((state) => state.sequenceRunning);
  const profileInfo = useMountStore((state) => state.profileInfo);
  const addTarget = useTargetListStore((state) => state.addTarget);
  
  const latitude = profileInfo.AstrometrySettings.Latitude || 0;
  const longitude = profileInfo.AstrometrySettings.Longitude || 0;

  // Track button enabled state based on selection key
  const selectedObjectKey = selectedObject?.names.join(',') ?? '';
  const [enabledForKey, setEnabledForKey] = useState<string | null>(null);
  
  useEffect(() => {
    // Enable buttons after delay for current selection
    const timer = setTimeout(() => {
      setEnabledForKey(selectedObjectKey);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [selectedObjectKey]);
  
  const buttonsEnabled = enabledForKey === selectedObjectKey && selectedObjectKey !== '';

  // Calculate detailed target information
  const targetInfo = useMemo(() => {
    if (!selectedObject) return null;
    
    const ra = selectedObject.raDeg;
    const dec = selectedObject.decDeg;
    
    // Current position
    const altAz = raDecToAltAz(ra, dec, latitude, longitude);
    
    // Moon distance
    const moonPos = getMoonPosition();
    const moonDist = angularSeparation(ra, dec, moonPos.ra, moonPos.dec);
    
    // Visibility info
    const visibility = calculateTargetVisibility(ra, dec, latitude, longitude, 30);
    
    // Feasibility score
    const feasibility = calculateImagingFeasibility(ra, dec, latitude, longitude);
    
    return {
      altitude: altAz.altitude,
      azimuth: altAz.azimuth,
      moonDistance: moonDist,
      visibility,
      feasibility,
    };
  }, [selectedObject, latitude, longitude]);

  if (!selectedObject) return null;

  const handleSlew = () => {
    onSetFramingCoordinates?.({
      ra: selectedObject.raDeg,
      dec: selectedObject.decDeg,
      raString: selectedObject.ra,
      decString: selectedObject.dec,
      name: selectedObject.names[0] || '',
    });
  };

  const handleAddToList = () => {
    addTarget({
      name: selectedObject.names[0] || 'Unknown',
      ra: selectedObject.raDeg,
      dec: selectedObject.decDeg,
      raString: selectedObject.ra,
      decString: selectedObject.dec,
      priority: 'medium',
    });
  };

  const getFeasibilityStyle = (rec: string) => {
    switch (rec) {
      case 'excellent': return 'bg-green-900/30 text-green-400 border-green-600';
      case 'good': return 'bg-emerald-900/30 text-emerald-400 border-emerald-600';
      case 'fair': return 'bg-yellow-900/30 text-yellow-400 border-yellow-600';
      case 'poor': return 'bg-orange-900/30 text-orange-400 border-orange-600';
      case 'not_recommended': return 'bg-red-900/30 text-red-400 border-red-600';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <TooltipProvider>
      <div
        className={cn(
          'absolute bg-card/95 backdrop-blur-sm text-foreground p-4 rounded-lg shadow-lg border border-border z-50',
          !isLandscape && 'top-28 left-1/2 transform -translate-x-1/2 min-w-[320px] max-w-[90vw]',
          isLandscape && 'top-4 left-28 w-80 max-w-[calc(100vw-8rem)]'
        )}
      >
        {/* Loading overlay */}
        {!buttonsEnabled && (
          <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center rounded-lg">
            <div className="w-12 h-12 border-2 border-muted-foreground border-t-border rounded-full animate-spin" />
          </div>
        )}

        {/* Content */}
        <div className={cn(
          'overflow-y-auto',
          !isLandscape && 'max-h-[calc(100vh-8rem)]',
          isLandscape && 'max-h-[calc(100vh-8rem)]'
        )}>
          {/* Header with names */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Star className="h-4 w-4 text-primary" />
                {selectedObject.names[0] || 'Unknown'}
              </h3>
              {selectedObject.names.length > 1 && (
                <p className="text-xs text-muted-foreground">
                  {selectedObject.names.slice(1).join(', ')}
                </p>
              )}
            </div>
          </div>

          {/* Coordinates */}
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm font-mono">
            <div>
              <span className="text-muted-foreground text-xs">RA</span>
              <p className="text-foreground">{selectedObject.ra}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Dec</span>
              <p className="text-foreground">{selectedObject.dec}</p>
            </div>
          </div>

          {targetInfo && (
            <>
              <Separator className="my-3 bg-border" />
              
              {/* Current Position */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1.5">
                  <ArrowUp className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Alt:</span>
                  <span className={cn(
                    targetInfo.altitude > 30 ? 'text-green-400' : 
                    targetInfo.altitude > 0 ? 'text-yellow-400' : 'text-red-400'
                  )}>
                    {targetInfo.altitude.toFixed(1)}°
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Crosshair className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Az:</span>
                  <span className="text-foreground">{targetInfo.azimuth.toFixed(1)}°</span>
                </div>
              </div>

              {/* Rise/Transit/Set Times */}
              <div className="mt-3 grid grid-cols-3 gap-1 text-center">
                <div className="p-1.5 rounded bg-muted/50">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                    <ArrowUp className="h-3 w-3" />
                    Rise
                  </div>
                  <div className="text-xs font-mono text-foreground">
                    {targetInfo.visibility.isCircumpolar ? '∞' : formatTimeShort(targetInfo.visibility.riseTime)}
                  </div>
                </div>
                <div className="p-1.5 rounded bg-muted/50">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Transit
                  </div>
                  <div className="text-xs font-mono text-foreground">
                    {formatTimeShort(targetInfo.visibility.transitTime)}
                  </div>
                </div>
                <div className="p-1.5 rounded bg-muted/50">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                    <ArrowDown className="h-3 w-3" />
                    Set
                  </div>
                  <div className="text-xs font-mono text-foreground">
                    {targetInfo.visibility.isCircumpolar ? '∞' : formatTimeShort(targetInfo.visibility.setTime)}
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="mt-3 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Sun className="h-3 w-3" />
                    <span>Max Altitude</span>
                  </div>
                  <span className="text-foreground">{targetInfo.visibility.transitAltitude.toFixed(1)}°</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Moon className="h-3 w-3" />
                    <span>Moon Distance</span>
                  </div>
                  <span className={targetInfo.moonDistance > 30 ? 'text-green-400' : 'text-yellow-400'}>
                    {targetInfo.moonDistance.toFixed(0)}°
                  </span>
                </div>

                {targetInfo.visibility.darkImagingHours > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Timer className="h-3 w-3" />
                      <span>Dark Window</span>
                    </div>
                    <span className="text-green-400">{formatDuration(targetInfo.visibility.darkImagingHours)}</span>
                  </div>
                )}

                {targetInfo.visibility.isCircumpolar && (
                  <Badge variant="outline" className="text-xs border-primary text-primary">
                    Circumpolar
                  </Badge>
                )}
              </div>

              {/* Feasibility Score */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn(
                    'mt-3 p-2 rounded border flex items-center justify-between',
                    getFeasibilityStyle(targetInfo.feasibility.recommendation)
                  )}>
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4" />
                      <span className="capitalize font-medium">
                        {targetInfo.feasibility.recommendation.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="font-mono">{targetInfo.feasibility.score}/100</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-64">
                  <div className="text-xs space-y-1">
                    <div className="grid grid-cols-2 gap-x-3">
                      <span>Moon Score:</span><span>{targetInfo.feasibility.moonScore}</span>
                      <span>Altitude Score:</span><span>{targetInfo.feasibility.altitudeScore}</span>
                      <span>Duration Score:</span><span>{targetInfo.feasibility.durationScore}</span>
                      <span>Twilight Score:</span><span>{targetInfo.feasibility.twilightScore}</span>
                    </div>
                    {targetInfo.feasibility.warnings.length > 0 && (
                      <div className="text-yellow-400 mt-1 pt-1 border-t border-border">
                        {targetInfo.feasibility.warnings.slice(0, 2).join('. ')}
                      </div>
                    )}
                    {targetInfo.feasibility.tips.length > 0 && (
                      <div className="text-muted-foreground">
                        {targetInfo.feasibility.tips[0]}
                      </div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2 mt-4">
            {mountConnected && !sequenceRunning && (
              <Button
                variant="outline"
                className="w-full border-primary text-primary hover:bg-primary/20"
                onClick={handleSlew}
              >
                <Crosshair className="h-4 w-4 mr-2" />
                Slew & Center
              </Button>
            )}
            <Button
              variant="outline"
              className="w-full border-border text-muted-foreground hover:bg-accent"
              onClick={handleAddToList}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add to Shot List
            </Button>
          </div>
          <div className="pb-6" />
        </div>
      </div>
    </TooltipProvider>
  );
}


