'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { 
  X, ChevronDown, ChevronUp, Star, Crosshair, Plus,
  Compass, TrendingUp, ArrowUp
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

import { useMountStore, useTargetListStore } from '@/lib/starmap/stores';
import { raDecToAltAz, getLST, degreesToHMS } from '@/lib/starmap/utils';
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
} from '@/lib/starmap/astro-utils';
import type { SelectedObjectData } from '@/lib/starmap/types';
import { cn } from '@/lib/utils';

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
    
    let left = clickPosition.x + offset;
    let top = clickPosition.y - panelSize.height / 2;
    
    // Check right edge
    if (left + panelSize.width + padding > containerBounds.width) {
      left = clickPosition.x - panelSize.width - offset;
    }
    
    // Check left edge
    if (left < padding) {
      left = padding;
    }
    
    // Check top edge
    if (top < padding) {
      top = padding;
    }
    
    // Check bottom edge
    if (top + panelSize.height + padding > containerBounds.height) {
      top = containerBounds.height - panelSize.height - padding;
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

  const handleSlew = () => {
    if (!selectedObject) return;
    onSetFramingCoordinates?.({
      ra: selectedObject.raDeg,
      dec: selectedObject.decDeg,
      raString: selectedObject.ra,
      decString: selectedObject.dec,
      name: selectedObject.names[0] || '',
    });
  };

  const handleAddToList = () => {
    if (!selectedObject) return;
    addTarget({
      name: selectedObject.names[0] || 'Unknown',
      ra: selectedObject.raDeg,
      dec: selectedObject.decDeg,
      raString: selectedObject.ra,
      decString: selectedObject.dec,
      priority: 'medium',
    });
  };

  const hasCustomPosition = clickPosition && containerBounds;

  return (
    <TooltipProvider>
      <Card 
        ref={panelRef}
        className={cn(
          'bg-card/95 backdrop-blur-sm border-border shadow-xl',
          hasCustomPosition ? 'fixed z-50 w-[300px]' : 'w-full',
          className
        )}
        style={hasCustomPosition ? {
          left: position.left,
          top: position.top,
          maxHeight: 'calc(100vh - 32px)',
        } : undefined}
      >
        <ScrollArea className="max-h-[calc(100vh-120px)] md:max-h-[calc(100vh-100px)]">
          <div className="p-3 space-y-2">
            {/* Selected Object Section */}
            {selectedObject && (
              <Collapsible open={objectExpanded} onOpenChange={setObjectExpanded}>
                <div className="flex items-center justify-between">
                  <CollapsibleTrigger className="flex items-center gap-2 hover:text-primary transition-colors flex-1">
                    <Star className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm font-medium truncate">{selectedObject.names[0]}</span>
                    {objectExpanded ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
                  </CollapsibleTrigger>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground shrink-0"
                    onClick={onClose}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <CollapsibleContent className="mt-2 space-y-2">
                  {/* Names */}
                  {selectedObject.names.length > 1 && (
                    <p className="text-xs text-muted-foreground truncate">
                      {selectedObject.names.slice(1, 3).join(' · ')}
                    </p>
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
                      <div className="grid grid-cols-3 gap-1 text-xs">
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
                      <div className="flex gap-2">
                        {mountConnected && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-7 text-xs border-primary text-primary hover:bg-primary/20"
                            onClick={handleSlew}
                          >
                            <Crosshair className="h-3 w-3 mr-1" />
                            {t('actions.slewToObject')}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-7 text-xs"
                          onClick={handleAddToList}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          {t('common.add')}
                        </Button>
                      </div>
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
function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { hour: number; altitude: number; time: string } }> }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-card/95 backdrop-blur-sm border border-border rounded px-2 py-1 text-xs">
        <p className="text-foreground font-mono">{data.time}</p>
        <p className="text-cyan-400">Alt: {data.altitude.toFixed(1)}°</p>
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
  const profileInfo = useMountStore((state) => state.profileInfo);
  const latitude = profileInfo.AstrometrySettings.Latitude || 0;
  const longitude = profileInfo.AstrometrySettings.Longitude || 0;
  const chartRef = useRef<HTMLDivElement>(null);
  
  // Zoom state: hoursAhead controls the time range
  const [hoursAhead, setHoursAhead] = useState(12);
  const minHours = 2;
  const maxHours = 24;

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
    
    chartEl.addEventListener('wheel', handleWheel, { passive: false });
    return () => chartEl.removeEventListener('wheel', handleWheel);
  }, []);

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
    <div ref={chartRef} className="p-2 cursor-ns-resize" title="Scroll to zoom time range">
      {/* Zoom indicator */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] text-muted-foreground">Time range: {hoursAhead}h</span>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setHoursAhead(prev => Math.max(minHours, prev - 2))}
            className="text-[9px] text-muted-foreground hover:text-foreground px-1"
          >−</button>
          <button 
            onClick={() => setHoursAhead(prev => Math.min(maxHours, prev + 2))}
            className="text-[9px] text-muted-foreground hover:text-foreground px-1"
          >+</button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={100}>
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
          
          <RechartsTooltip content={<CustomTooltip />} />
          
          <Area
            type="monotone"
            dataKey="altitudeAbove"
            stroke="#06b6d4"
            strokeWidth={2}
            fill="url(#altGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-[9px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-2 h-0.5 bg-amber-400" />
          <span>Now</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-0.5 bg-purple-400" />
          <span>Transit</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-0.5 bg-green-500" />
          <span>Rise</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-0.5 bg-red-500" />
          <span>Set</span>
        </div>
      </div>
      
      {/* Dark imaging info */}
      {chartData.darkImagingHours > 0 && (
        <div className="mt-1 text-[9px] text-green-400">
          ✓ {chartData.darkImagingHours.toFixed(1)}h dark imaging window
        </div>
      )}
    </div>
  );
}
