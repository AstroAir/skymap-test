'use client';

import { useState, useEffect, useRef, memo } from 'react';
import { useTranslations } from 'next-intl';
import {
  X, ChevronDown, ChevronUp, Crosshair, Plus,
  Compass, TrendingUp, ArrowUp, Info, Sun, Ruler,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  TooltipProvider,
} from '@/components/ui/tooltip';

import { AltitudeChartCompact } from './altitude-chart-compact';
import { RiseTransitSetGrid } from './rise-transit-set-grid';
import { FeasibilityBadge } from '../planning/feasibility-badge';
import { useMountStore } from '@/lib/stores';
import { useCelestialName, useCelestialNames, useAdaptivePosition, useAstroEnvironment, useTargetAstroData, useObjectActions } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import { getObjectTypeIcon, getObjectTypeColor } from '@/lib/astronomy/object-type-utils';
import type { InfoPanelProps } from '@/types/starmap/objects';

export const InfoPanel = memo(function InfoPanel({
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
  
  const profileInfo = useMountStore((state) => state.profileInfo);
  
  const latitude = profileInfo.AstrometrySettings.Latitude || 0;
  const longitude = profileInfo.AstrometrySettings.Longitude || 0;

  // Shared object actions
  const { handleSlew, handleAddToList, mountConnected } = useObjectActions({
    selectedObject,
    onSetFramingCoordinates,
  });

  // Translate celestial object names
  const primaryName = useCelestialName(selectedObject?.names[0]);
  const secondaryNames = useCelestialNames(selectedObject?.names.slice(1, 3));

  // Calculate adaptive position using shared hook
  const position = useAdaptivePosition(
    panelRef,
    clickPosition,
    containerBounds,
    [selectedObject, objectExpanded, chartExpanded],
  );

  // Update time every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Escape key to close panel
  useEffect(() => {
    if (!onClose) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Native event listeners to prevent Stellarium WASM engine from receiving
  // mouse events that originate in the info panel. The engine sets
  // document.onmouseup inside a canvas mousedown handler, which persists and
  // fires on ALL subsequent mouseup events — including clicks on InfoPanel
  // buttons. This causes the WASM core to process a "sky click" that
  // deselects the object, unmounting the panel before the button action fires.
  // React's synthetic stopPropagation (above) fires via delegation at the root
  // and cannot prevent native handlers on ancestor elements from executing.
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;

    const stop = (e: Event) => e.stopPropagation();
    el.addEventListener('mousedown', stop);
    el.addEventListener('mouseup', stop);
    el.addEventListener('pointerdown', stop);
    el.addEventListener('pointerup', stop);

    return () => {
      el.removeEventListener('mousedown', stop);
      el.removeEventListener('mouseup', stop);
      el.removeEventListener('pointerdown', stop);
      el.removeEventListener('pointerup', stop);
    };
  }, []);

  // Calculate astronomical data using shared hooks
  const astroData = useAstroEnvironment(latitude, longitude, currentTime);
  const targetData = useTargetAstroData(selectedObject, latitude, longitude, astroData.moonRa, astroData.moonDec, currentTime);



  const hasCustomPosition = clickPosition && containerBounds;

  return (
    <TooltipProvider>
      <Card 
        ref={panelRef}
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
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
                    aria-label={t('common.close')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <CollapsibleContent className="mt-2 space-y-2">
                  {/* Names and Type Badge */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedObject.type && (
                      <Badge variant="outline" className={cn('text-[10px]', getObjectTypeColor(selectedObject.type))}>
                        {selectedObject.type}
                      </Badge>
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
                      <span className="text-muted-foreground">{t('coordinates.ra')}: </span>
                      <span className="font-mono text-foreground">{selectedObject.ra}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t('coordinates.dec')}: </span>
                      <span className="font-mono text-foreground">{selectedObject.dec}</span>
                    </div>
                  </div>
                  
                  {targetData && (
                    <>
                      {/* Current Position */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1">
                          <ArrowUp className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{t('coordinates.alt')}:</span>
                          <span className={cn(
                            targetData.altitude > 30 ? 'text-green-400' : 
                            targetData.altitude > 0 ? 'text-yellow-400' : 'text-red-400'
                          )}>
                            {targetData.altitude.toFixed(1)}°
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Compass className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{t('coordinates.az')}:</span>
                          <span className="text-foreground">{targetData.azimuth.toFixed(1)}°</span>
                        </div>
                      </div>
                      
                      {/* Rise/Transit/Set */}
                      <RiseTransitSetGrid visibility={targetData.visibility} variant="compact" />
                      
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
                      <FeasibilityBadge feasibility={targetData.feasibility} variant="inline" tooltipSide="right" />
                      
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
});
