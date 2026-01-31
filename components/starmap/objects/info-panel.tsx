'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  X, ChevronDown, ChevronUp, Crosshair, Plus,
  Compass, TrendingUp, ArrowUp, Info, Sun, Ruler,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts';

import { useMountStore, useTargetListStore } from '@/lib/stores';
import { useCelestialName, useCelestialNames } from '@/lib/hooks';
import { raDecToAltAz, getLST, degreesToHMS } from '@/lib/astronomy/starmap-utils';
import {
  getMoonPhase,
  getMoonPhaseName,
  getMoonIllumination,
  getMoonPosition,
  getSunPosition,
  angularSeparation,
  calculateTargetVisibility,
  calculateImagingFeasibility,
  calculateTwilightTimes,
  formatTimeShort,
  getAltitudeOverTime,
  getTransitTime,
} from '@/lib/astronomy/astro-utils';
import type { SelectedObjectData } from '@/lib/core/types';
import { cn } from '@/lib/utils';
import { getObjectTypeIcon, getObjectTypeColor } from '@/lib/astronomy/object-type-utils';

interface InfoPanelProps {
  selectedObject: SelectedObjectData | null;
  onClose?: () => void;
  onSetFramingCoordinates?: (data: {
    ra: number;
    dec: number;
    raString: string;
    decString: string;
    name: string;
  }) => void;
  /** Callback to open the detail drawer */
  onViewDetails?: () => void;
  className?: string;
  /** Click position for adaptive positioning */
  clickPosition?: { x: number; y: number };
  /** Container bounds for adaptive positioning */
  containerBounds?: { width: number; height: number };
}

export function InfoPanel({
  selectedObject,
  onClose,
  onSetFramingCoordinates,
  onViewDetails,
  className,
  clickPosition,
  containerBounds,
}: InfoPanelProps) {
  const t = useTranslations();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [objectExpanded, setObjectExpanded] = useState(true);
  const [chartExpanded, setChartExpanded] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelSize, setPanelSize] = useState({ width: 300, height: 400 });
  
  const profileInfo = useMountStore((state) => state.profileInfo);
  const mountConnected = useMountStore((state) => state.mountInfo.Connected);
  const addTarget = useTargetListStore((state) => state.addTarget);
  
  const latitude = profileInfo.AstrometrySettings.Latitude || 0;
  const longitude = profileInfo.AstrometrySettings.Longitude || 0;

  // Translate celestial object names
  const primaryName = useCelestialName(selectedObject?.names[0]);
  const secondaryNames = useCelestialNames(selectedObject?.names.slice(1, 3));

  // Measure panel size for positioning
  useEffect(() => {
    if (panelRef.current) {
      const rect = panelRef.current.getBoundingClientRect();
      setPanelSize({ width: rect.width, height: rect.height });
    }
  }, [selectedObject, objectExpanded, chartExpanded]);

  // Calculate adaptive position
  const position = useMemo(() => {
    if (!clickPosition || !containerBounds) {
      return { left: 12, top: 64 }; // Default position
    }
    
    const padding = 16;
    const offset = 20; // Offset from click point
    const rightPanelWidth = 320; // Reserve space for right-side panels
    const topBarHeight = 64; // Reserve space for top toolbar
    const bottomBarHeight = 48; // Reserve space for bottom status bar
    
    // Calculate available width (exclude right panel area)
    const availableWidth = containerBounds.width - rightPanelWidth;
    
    let left = clickPosition.x + offset;
    let top = clickPosition.y - panelSize.height / 2;
    
    // Check right edge - ensure InfoPanel stays within left portion of screen
    if (left + panelSize.width + padding > availableWidth) {
      // Try to position on left side of click
      left = clickPosition.x - panelSize.width - offset;
    }
    
    // If still exceeds available width, clamp to available area
    if (left + panelSize.width > availableWidth) {
      left = availableWidth - panelSize.width - padding;
    }
    
    // Check left edge
    if (left < padding) {
      left = padding;
    }
    
    // Check top edge (account for top toolbar)
    if (top < topBarHeight + padding) {
      top = topBarHeight + padding;
    }
    
    // Check bottom edge (account for bottom status bar)
    if (top + panelSize.height + padding > containerBounds.height - bottomBarHeight) {
      top = containerBounds.height - panelSize.height - bottomBarHeight - padding;
    }
    
    return { left, top };
  }, [clickPosition, containerBounds, panelSize]);

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate astronomical data
  const astroData = useMemo(() => {
    const moonPhase = getMoonPhase();
    const moonPhaseName = getMoonPhaseName(moonPhase);
    const moonIllumination = getMoonIllumination(moonPhase);
    const moonPos = getMoonPosition();
    const sunPos = getSunPosition();
    
    const moonAltAz = raDecToAltAz(moonPos.ra, moonPos.dec, latitude, longitude);
    const sunAltAz = raDecToAltAz(sunPos.ra, sunPos.dec, latitude, longitude);
    
    const lst = getLST(longitude);
    const lstString = degreesToHMS(lst);
    
    const twilight = calculateTwilightTimes(latitude, longitude, new Date());
    
    return {
      moonPhaseName,
      moonIllumination,
      moonAltitude: moonAltAz.altitude,
      moonRa: moonPos.ra,
      moonDec: moonPos.dec,
      sunAltitude: sunAltAz.altitude,
      lstString,
      twilight,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude, Math.floor(currentTime.getTime() / 1000)]);

  // Calculate target-specific data
  const targetData = useMemo(() => {
    if (!selectedObject) return null;
    
    const ra = selectedObject.raDeg;
    const dec = selectedObject.decDeg;
    
    const altAz = raDecToAltAz(ra, dec, latitude, longitude);
    const moonDistance = angularSeparation(ra, dec, astroData.moonRa, astroData.moonDec);
    const visibility = calculateTargetVisibility(ra, dec, latitude, longitude, 30);
    const feasibility = calculateImagingFeasibility(ra, dec, latitude, longitude);
    
    return {
      altitude: altAz.altitude,
      azimuth: altAz.azimuth,
      moonDistance,
      visibility,
      feasibility,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedObject, latitude, longitude, astroData.moonRa, astroData.moonDec, Math.floor(currentTime.getTime() / 1000)]);


  const getFeasibilityColor = (rec: string) => {
    switch (rec) {
      case 'excellent': return 'text-green-400 bg-green-900/30';
      case 'good': return 'text-emerald-400 bg-emerald-900/30';
      case 'fair': return 'text-yellow-400 bg-yellow-900/30';
      case 'poor': return 'text-orange-400 bg-orange-900/30';
      case 'not_recommended': return 'text-red-400 bg-red-900/30';
      default: return 'text-muted-foreground';
    }
  };

  const handleSlew = useCallback(() => {
    if (!selectedObject) return;
    onSetFramingCoordinates?.({
      ra: selectedObject.raDeg,
      dec: selectedObject.decDeg,
      raString: selectedObject.ra,
      decString: selectedObject.dec,
      name: selectedObject.names[0] || '',
    });
  }, [selectedObject, onSetFramingCoordinates]);

  const handleAddToList = useCallback(() => {
    if (!selectedObject) return;
    addTarget({
      name: selectedObject.names[0] || 'Unknown',
      ra: selectedObject.raDeg,
      dec: selectedObject.decDeg,
      raString: selectedObject.ra,
      decString: selectedObject.dec,
      priority: 'medium',
    });
  }, [selectedObject, addTarget]);

  const hasCustomPosition = clickPosition && containerBounds;

  return (
    <TooltipProvider>
      <Card 
        ref={panelRef}
        className={cn(
          'bg-card/95 backdrop-blur-md border-border/60 shadow-2xl',
          'transition-all duration-300 ease-out',
          'animate-in fade-in zoom-in-95 slide-in-from-bottom-2',
          hasCustomPosition ? 'fixed z-50 w-[280px] sm:w-[300px]' : 'w-full',
          className
        )}
        style={hasCustomPosition ? {
          left: position.left,
          top: position.top,
          maxHeight: 'calc(100vh - 80px)',
        } : undefined}
      >
        <ScrollArea className="max-h-[calc(100vh-140px)] sm:max-h-[calc(100vh-100px)]">
          <div className="p-3 space-y-2">
            {/* Selected Object Section */}
            {selectedObject && (
              <Collapsible open={objectExpanded} onOpenChange={setObjectExpanded}>
                <div className="flex items-center justify-between">
                  <CollapsibleTrigger className="flex items-center gap-2 hover:text-primary transition-colors flex-1 min-w-0">
                    {(() => {
                      const TypeIcon = getObjectTypeIcon(selectedObject.type);
                      const typeColor = getObjectTypeColor(selectedObject.type);
                      return <TypeIcon className={cn('h-4 w-4 shrink-0', typeColor)} />;
                    })()}
                    <span className="text-sm font-medium truncate">{primaryName || selectedObject.names[0]}</span>
                    {objectExpanded ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
                  </CollapsibleTrigger>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 sm:h-6 sm:w-6 text-muted-foreground hover:text-foreground shrink-0 touch-target"
                    onClick={onClose}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <CollapsibleContent className="mt-2 space-y-2">
                  {/* Names and Type Badge */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedObject.type && (
                      <span className={cn(
                        'text-[10px] px-1.5 py-0.5 rounded-full border',
                        getObjectTypeColor(selectedObject.type),
                        'border-current/30 bg-current/10'
                      )}>
                        {selectedObject.type}
                      </span>
                    )}
                    {selectedObject.names.length > 1 && (
                      <span className="text-xs text-muted-foreground truncate">
                        {secondaryNames.length > 0 ? secondaryNames.join(' · ') : selectedObject.names.slice(1, 3).join(' · ')}
                      </span>
                    )}
                  </div>
                  
                  {/* Magnitude and Size */}
                  {(selectedObject.magnitude !== undefined || selectedObject.size) && (
                    <div className="flex items-center gap-3 text-xs">
                      {selectedObject.magnitude !== undefined && (
                        <div className="flex items-center gap-1">
                          <Sun className="h-3 w-3 text-yellow-400" />
                          <span className="text-muted-foreground">{t('objectDetail.mag')}:</span>
                          <span className="font-mono text-foreground">{selectedObject.magnitude.toFixed(1)}</span>
                        </div>
                      )}
                      {selectedObject.size && (
                        <div className="flex items-center gap-1">
                          <Ruler className="h-3 w-3 text-muted-foreground" />
                          <span className="font-mono text-foreground">{selectedObject.size}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Constellation */}
                  {selectedObject.constellation && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">{t('coordinates.constellation')}: </span>
                      <span className="text-foreground">{selectedObject.constellation}</span>
                    </div>
                  )}
                  
                  {/* Coordinates */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">RA: </span>
                      <span className="font-mono text-foreground">{selectedObject.ra}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Dec: </span>
                      <span className="font-mono text-foreground">{selectedObject.dec}</span>
                    </div>
                  </div>
                  
                  {targetData && (
                    <>
                      {/* Current Position */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1">
                          <ArrowUp className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Alt:</span>
                          <span className={cn(
                            targetData.altitude > 30 ? 'text-green-400' : 
                            targetData.altitude > 0 ? 'text-yellow-400' : 'text-red-400'
                          )}>
                            {targetData.altitude.toFixed(1)}°
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Compass className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Az:</span>
                          <span className="text-foreground">{targetData.azimuth.toFixed(1)}°</span>
                        </div>
                      </div>
                      
                      {/* Rise/Transit/Set */}
                      <div className="grid grid-cols-3 gap-0.5 sm:gap-1 text-xs">
                        <div className="text-center p-1 rounded bg-muted/30">
                          <div className="text-[10px] text-muted-foreground">{t('time.rise')}</div>
                          <div className="font-mono text-foreground">
                            {targetData.visibility.isCircumpolar ? '∞' : formatTimeShort(targetData.visibility.riseTime)}
                          </div>
                        </div>
                        <div className="text-center p-1 rounded bg-muted/30">
                          <div className="text-[10px] text-muted-foreground">{t('time.transit')}</div>
                          <div className="font-mono text-foreground">{formatTimeShort(targetData.visibility.transitTime)}</div>
                        </div>
                        <div className="text-center p-1 rounded bg-muted/30">
                          <div className="text-[10px] text-muted-foreground">{t('time.set')}</div>
                          <div className="font-mono text-foreground">
                            {targetData.visibility.isCircumpolar ? '∞' : formatTimeShort(targetData.visibility.setTime)}
                          </div>
                        </div>
                      </div>
                      
                      {/* Moon distance & Max alt */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">{t('session.moonDistance')}</span>
                          <span className={targetData.moonDistance > 30 ? 'text-green-400' : 'text-yellow-400'}>
                            {targetData.moonDistance.toFixed(0)}°
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">{t('session.maxAltitude')}</span>
                          <span className="text-foreground">{targetData.visibility.transitAltitude.toFixed(1)}°</span>
                        </div>
                      </div>
                      
                      {/* Feasibility Score */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className={cn(
                            'flex items-center justify-between p-1.5 rounded text-xs',
                            getFeasibilityColor(targetData.feasibility.recommendation)
                          )}>
                            <div className="flex items-center gap-1.5">
                              <TrendingUp className="h-3 w-3" />
                              <span className="capitalize">{targetData.feasibility.recommendation.replace('_', ' ')}</span>
                            </div>
                            <span className="font-mono">{targetData.feasibility.score}/100</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-56">
                          <div className="space-y-1 text-xs">
                            <div className="grid grid-cols-2 gap-x-2">
                              <span>Moon:</span><span>{targetData.feasibility.moonScore}</span>
                              <span>Altitude:</span><span>{targetData.feasibility.altitudeScore}</span>
                              <span>Duration:</span><span>{targetData.feasibility.durationScore}</span>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                      
                      {/* Actions */}
                      <div className="flex gap-1.5 sm:gap-2">
                        {mountConnected && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-8 sm:h-7 text-xs border-primary text-primary hover:bg-primary/20 touch-target"
                            onClick={handleSlew}
                          >
                            <Crosshair className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">{t('actions.slewToObject')}</span>
                            <span className="sm:hidden">{t('actions.slew')}</span>
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-8 sm:h-7 text-xs touch-target"
                          onClick={handleAddToList}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          {t('common.add')}
                        </Button>
                      </div>
                      
                      {/* View Details Button */}
                      {onViewDetails && (
                        <Button
                          variant="default"
                          size="sm"
                          className="w-full h-8 sm:h-7 text-xs mt-2 touch-target"
                          onClick={onViewDetails}
                        >
                          <Info className="h-3 w-3 mr-1" />
                          {t('objectDetail.viewDetails')}
                        </Button>
                      )}
                    </>
                  )}
                </CollapsibleContent>
                
                <Separator className="mt-2 bg-border" />
              </Collapsible>
            )}


            {/* Altitude Chart Section */}
            {selectedObject && (
              <Collapsible open={chartExpanded} onOpenChange={setChartExpanded}>
                <CollapsibleTrigger className="flex items-center justify-between w-full hover:text-primary transition-colors">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{t('info.altitude')}</span>
                  </div>
                  {chartExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </CollapsibleTrigger>
                
                <CollapsibleContent className="mt-2">
                  <div className="-mx-1">
                    <AltitudeChartCompact
                      ra={selectedObject.raDeg}
                      dec={selectedObject.decDeg}
                      name={selectedObject.names[0]}
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        </ScrollArea>
      </Card>
    </TooltipProvider>
  );
}

// Custom tooltip component for Recharts
function CustomTooltip({ active, payload, altLabel }: { active?: boolean; payload?: Array<{ payload: { hour: number; altitude: number; time: string } }>; altLabel?: string }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-card/95 backdrop-blur-sm border border-border rounded px-2 py-1 text-xs">
        <p className="text-foreground font-mono">{data.time}</p>
        <p className="text-cyan-400">{altLabel}: {data.altitude.toFixed(1)}°</p>
      </div>
    );
  }
  return null;
}

// Compact altitude chart using Recharts with zoom support
function AltitudeChartCompact({
  ra,
  dec,
}: {
  ra: number;
  dec: number;
  name?: string;
}) {
  const t = useTranslations();
  const profileInfo = useMountStore((state) => state.profileInfo);
  const latitude = profileInfo.AstrometrySettings.Latitude || 0;
  const longitude = profileInfo.AstrometrySettings.Longitude || 0;
  const chartRef = useRef<HTMLDivElement>(null);
  
  // Zoom state: hoursAhead controls the time range
  const [hoursAhead, setHoursAhead] = useState(12);
  const minHours = 2;
  const maxHours = 24;
  
  // Touch gesture state for mobile
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const initialPinchDistanceRef = useRef<number | null>(null);
  const initialHoursRef = useRef<number>(hoursAhead);

  // Handle wheel zoom - stop propagation to prevent star map zoom
  useEffect(() => {
    const chartEl = chartRef.current;
    if (!chartEl) return;
    
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      const zoomFactor = e.deltaY > 0 ? 1.2 : 0.8;
      setHoursAhead(prev => {
        const newValue = Math.round(prev * zoomFactor);
        return Math.max(minHours, Math.min(maxHours, newValue));
      });
    };
    
    // Touch handlers for mobile pinch zoom and swipe
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          time: Date.now(),
        };
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialPinchDistanceRef.current = Math.sqrt(dx * dx + dy * dy);
        initialHoursRef.current = hoursAhead;
      }
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && initialPinchDistanceRef.current !== null) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const currentDistance = Math.sqrt(dx * dx + dy * dy);
        const scale = initialPinchDistanceRef.current / currentDistance;
        const newHours = Math.round(initialHoursRef.current * scale);
        setHoursAhead(Math.max(minHours, Math.min(maxHours, newHours)));
      }
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0 && touchStartRef.current) {
        const endX = e.changedTouches[0].clientX;
        const deltaX = endX - touchStartRef.current.x;
        const deltaTime = Date.now() - touchStartRef.current.time;
        
        // Horizontal swipe to adjust time range
        if (Math.abs(deltaX) > 50 && deltaTime < 300) {
          if (deltaX > 0) {
            setHoursAhead(prev => Math.max(minHours, prev - 2));
          } else {
            setHoursAhead(prev => Math.min(maxHours, prev + 2));
          }
        }
        touchStartRef.current = null;
      }
      initialPinchDistanceRef.current = null;
    };
    
    chartEl.addEventListener('wheel', handleWheel, { passive: false });
    chartEl.addEventListener('touchstart', handleTouchStart, { passive: true });
    chartEl.addEventListener('touchmove', handleTouchMove, { passive: false });
    chartEl.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    return () => {
      chartEl.removeEventListener('wheel', handleWheel);
      chartEl.removeEventListener('touchstart', handleTouchStart);
      chartEl.removeEventListener('touchmove', handleTouchMove);
      chartEl.removeEventListener('touchend', handleTouchEnd);
    };
  }, [hoursAhead]);

  const chartData = useMemo(() => {
    const data = getAltitudeOverTime(ra, dec, latitude, longitude, hoursAhead, 30);
    const transit = getTransitTime(ra, longitude);
    const visibility = calculateTargetVisibility(ra, dec, latitude, longitude, 30);
    const now = new Date();
    
    // Find max altitude
    const maxPoint = data.reduce(
      (max: { alt: number; hour: number }, point: { hour: number; altitude: number }) => 
        point.altitude > max.alt ? { alt: point.altitude, hour: point.hour } : max,
      { alt: -90, hour: 0 }
    );
    
    // Transform data for Recharts
    const transformedData = data.map((point: { hour: number; altitude: number }) => {
      const pointTime = new Date(now.getTime() + point.hour * 3600000);
      return {
        hour: point.hour,
        altitude: point.altitude,
        altitudeAbove: Math.max(0, point.altitude),
        time: pointTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
    });

    let riseHour: number | null = null;
    let setHour: number | null = null;
    
    if (visibility.riseTime) {
      const riseMs = visibility.riseTime.getTime() - now.getTime();
      if (riseMs > 0 && riseMs < hoursAhead * 3600000) riseHour = riseMs / 3600000;
    }
    if (visibility.setTime) {
      const setMs = visibility.setTime.getTime() - now.getTime();
      if (setMs > 0 && setMs < hoursAhead * 3600000) setHour = setMs / 3600000;
    }
    
    return { 
      points: transformedData, 
      maxAlt: maxPoint.alt, 
      maxAltHour: maxPoint.hour,
      transitIn: transit.hoursUntilTransit, 
      visibility, 
      riseHour, 
      setHour,
      darkImagingHours: visibility.darkImagingHours,
    };
  }, [ra, dec, latitude, longitude, hoursAhead]);

  return (
    <div ref={chartRef} className="p-2 cursor-ns-resize touch-pan-y select-none" title={t('chart.zoomHint')}>
      {/* Zoom indicator with larger touch targets */}
      <div className="flex items-center justify-between mb-2 transition-opacity duration-200">
        <span className="text-[10px] sm:text-[9px] text-muted-foreground transition-all duration-300">
          {t('chart.timeRange')}: <span className="font-mono font-medium text-foreground">{hoursAhead}h</span>
        </span>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost"
            size="icon"
            className="h-7 w-7 sm:h-5 sm:w-5 text-muted-foreground hover:text-foreground touch-target"
            onClick={() => setHoursAhead(prev => Math.max(minHours, prev - 2))}
          >
            <span className="text-sm sm:text-xs">−</span>
          </Button>
          <Button 
            variant="ghost"
            size="icon"
            className="h-7 w-7 sm:h-5 sm:w-5 text-muted-foreground hover:text-foreground touch-target"
            onClick={() => setHoursAhead(prev => Math.min(maxHours, prev + 2))}
          >
            <span className="text-sm sm:text-xs">+</span>
          </Button>
        </div>
      </div>
      {/* Chart - taller on mobile for better touch interaction */}
      <div className="transition-all duration-300 ease-out" style={{ height: typeof window !== 'undefined' && window.innerWidth < 640 ? 120 : 100 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData.points}
            margin={{ top: 5, right: 5, left: -15, bottom: 5 }}
          >
            <defs>
              <linearGradient id="altGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.05} />
              </linearGradient>
            </defs>
          
          <XAxis 
            dataKey="hour" 
            tick={{ fontSize: 9, fill: '#71717a' }}
            tickFormatter={(v) => `+${v}h`}
            axisLine={{ stroke: '#3f3f46' }}
            tickLine={{ stroke: '#3f3f46' }}
            domain={[0, hoursAhead]}
            ticks={Array.from({ length: Math.ceil(hoursAhead / 3) + 1 }, (_, i) => i * 3).filter(t => t <= hoursAhead)}
          />
          <YAxis 
            domain={[-10, 90]}
            tick={{ fontSize: 9, fill: '#71717a' }}
            tickFormatter={(v) => `${v}°`}
            axisLine={{ stroke: '#3f3f46' }}
            tickLine={{ stroke: '#3f3f46' }}
            ticks={[0, 30, 60, 90]}
          />
          
          {/* 30° imaging threshold */}
          <ReferenceLine y={30} stroke="#22c55e" strokeDasharray="4 2" strokeOpacity={0.5} />
          
          {/* Horizon line */}
          <ReferenceLine y={0} stroke="#3f3f46" strokeWidth={1} />
          
          {/* Current time marker */}
          <ReferenceLine x={0} stroke="#f59e0b" strokeWidth={1.5} />
          
          {/* Transit marker */}
          {chartData.transitIn <= hoursAhead && (
            <ReferenceLine x={chartData.transitIn} stroke="#a855f7" strokeDasharray="3 2" />
          )}
          
          {/* Rise marker */}
          {chartData.riseHour !== null && (
            <ReferenceLine x={chartData.riseHour} stroke="#22c55e" strokeDasharray="2 2" />
          )}
          
          {/* Set marker */}
          {chartData.setHour !== null && (
            <ReferenceLine x={chartData.setHour} stroke="#ef4444" strokeDasharray="2 2" />
          )}
          
          <RechartsTooltip content={<CustomTooltip altLabel={t('info.altitude')} />} />
          
          <Area
            type="monotone"
            dataKey="altitudeAbove"
            stroke="#06b6d4"
            strokeWidth={2}
            fill="url(#altGradient)"
            animationDuration={500}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
      </div>

      {/* Legend - larger on mobile */}
      <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-2 gap-y-1 mt-2 sm:mt-1 text-[11px] sm:text-[9px] text-muted-foreground">
        <div className="flex items-center gap-1.5 sm:gap-1">
          <div className="w-3 sm:w-2 h-1 sm:h-0.5 bg-amber-400 rounded-full" />
          <span>{t('chart.now')}</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-1">
          <div className="w-3 sm:w-2 h-1 sm:h-0.5 bg-purple-400 rounded-full" />
          <span>{t('time.transit')}</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-1">
          <div className="w-3 sm:w-2 h-1 sm:h-0.5 bg-green-500 rounded-full" />
          <span>{t('time.rise')}</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-1">
          <div className="w-3 sm:w-2 h-1 sm:h-0.5 bg-red-500 rounded-full" />
          <span>{t('time.set')}</span>
        </div>
      </div>
      
      {/* Dark imaging info */}
      {chartData.darkImagingHours > 0 && (
        <div className="mt-2 sm:mt-1 text-[11px] sm:text-[9px] text-green-400 font-medium">
          ✓ {t('chart.darkImagingWindow', { hours: chartData.darkImagingHours.toFixed(1) })}
        </div>
      )}
      
      {/* Mobile hint */}
      <div className="sm:hidden text-[10px] text-muted-foreground/60 mt-1 text-center">
        {t('chart.mobileHint')}
      </div>
    </div>
  );
}


