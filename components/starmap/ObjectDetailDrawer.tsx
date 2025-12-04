'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import { useTranslations } from 'next-intl';
import { 
  X, 
  Star, 
  ExternalLink, 
  Crosshair, 
  Plus, 
  ChevronUp,
  Loader2,
  MapPin,
  Ruler,
  Sun,
  Moon,
  Clock,
  TrendingUp,
  Info,
  Database,
  Compass,
  ArrowUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { ObjectImageGallery } from './ObjectImageGallery';
import { useMountStore, useTargetListStore } from '@/lib/starmap/stores';
import { useCelestialName } from '@/lib/starmap/hooks';
import { raDecToAltAz } from '@/lib/starmap/utils';
import {
  getMoonPosition,
  angularSeparation,
  calculateTargetVisibility,
  calculateImagingFeasibility,
  formatTimeShort,
} from '@/lib/starmap/astro-utils';
import {
  getCachedObjectInfo,
  enhanceObjectInfo,
  type ObjectDetailedInfo,
} from '@/lib/starmap/object-info-service';
import type { SelectedObjectData } from '@/lib/starmap/types';
import { cn } from '@/lib/utils';

interface ObjectDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedObject: SelectedObjectData | null;
  onSetFramingCoordinates?: (data: {
    ra: number;
    dec: number;
    raString: string;
    decString: string;
    name: string;
  }) => void;
}

export const ObjectDetailDrawer = memo(function ObjectDetailDrawer({
  open,
  onOpenChange,
  selectedObject,
  onSetFramingCoordinates,
}: ObjectDetailDrawerProps) {
  const t = useTranslations();
  const [objectInfo, setObjectInfo] = useState<ObjectDetailedInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [, setCurrentTime] = useState(new Date()); // Trigger re-render for astro data
  
  const profileInfo = useMountStore((state) => state.profileInfo);
  const mountConnected = useMountStore((state) => state.mountInfo.Connected);
  const addTarget = useTargetListStore((state) => state.addTarget);
  
  const latitude = profileInfo.AstrometrySettings.Latitude || 0;
  const longitude = profileInfo.AstrometrySettings.Longitude || 0;
  
  // Translate celestial object name
  const translatedName = useCelestialName(selectedObject?.names[0]);

  // Load object info when drawer opens
  useEffect(() => {
    if (!open || !selectedObject) {
      setObjectInfo(null);
      return;
    }
    
    let cancelled = false;
    
    async function loadInfo() {
      setIsLoading(true);
      try {
        const info = await getCachedObjectInfo(
          selectedObject!.names,
          selectedObject!.raDeg,
          selectedObject!.decDeg,
          selectedObject!.ra,
          selectedObject!.dec
        );
        
        if (!cancelled) {
          setObjectInfo(info);
          setIsLoading(false);
          
          // Try to enhance with external data
          setIsEnhancing(true);
          const enhanced = await enhanceObjectInfo(info);
          if (!cancelled) {
            setObjectInfo(enhanced);
            setIsEnhancing(false);
          }
        }
      } catch (error) {
        console.error('Failed to load object info:', error);
        if (!cancelled) {
          setIsLoading(false);
          setIsEnhancing(false);
        }
      }
    }
    
    loadInfo();
    
    return () => {
      cancelled = true;
    };
  }, [open, selectedObject]);

  // Update time periodically
  useEffect(() => {
    if (!open) return;
    
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, [open]);

  // Calculate current astronomical data
  const astroData = useCallback(() => {
    if (!selectedObject) return null;
    
    const ra = selectedObject.raDeg;
    const dec = selectedObject.decDeg;
    
    const altAz = raDecToAltAz(ra, dec, latitude, longitude);
    const moonPos = getMoonPosition();
    const moonDistance = angularSeparation(ra, dec, moonPos.ra, moonPos.dec);
    const visibility = calculateTargetVisibility(ra, dec, latitude, longitude, 30);
    const feasibility = calculateImagingFeasibility(ra, dec, latitude, longitude);
    
    return {
      altitude: altAz.altitude,
      azimuth: altAz.azimuth,
      moonDistance,
      visibility,
      feasibility,
    };
  }, [selectedObject, latitude, longitude]);

  const handleSlew = useCallback(() => {
    if (!selectedObject) return;
    onSetFramingCoordinates?.({
      ra: selectedObject.raDeg,
      dec: selectedObject.decDeg,
      raString: selectedObject.ra,
      decString: selectedObject.dec,
      name: selectedObject.names[0] || '',
    });
    onOpenChange(false);
  }, [selectedObject, onSetFramingCoordinates, onOpenChange]);

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

  const getFeasibilityColor = (rec: string) => {
    switch (rec) {
      case 'excellent': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'good': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'fair': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'poor': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'not_recommended': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeColor = (category: string) => {
    switch (category) {
      case 'galaxy': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'nebula': return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
      case 'cluster': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'star': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'planet': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const currentAstro = astroData();
  const displayName = translatedName || selectedObject?.names[0] || 'Unknown';

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh] bg-background/95 backdrop-blur-md">
        {/* Handle */}
        <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-muted" />
        
        <DrawerHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 pr-4">
              <DrawerTitle className="text-xl font-bold truncate flex items-center gap-2">
                <Star className="h-5 w-5 text-primary shrink-0" />
                {displayName}
              </DrawerTitle>
              {selectedObject && selectedObject.names.length > 1 && (
                <p className="text-sm text-muted-foreground mt-0.5 truncate">
                  {selectedObject.names.slice(1, 4).join(' · ')}
                </p>
              )}
            </div>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </div>
          
          {/* Type Badge and Quick Stats */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {objectInfo && (
              <Badge variant="outline" className={cn('text-xs', getTypeColor(objectInfo.typeCategory))}>
                {objectInfo.type}
              </Badge>
            )}
            {objectInfo?.magnitude && (
              <Badge variant="outline" className="text-xs">
                <Sun className="h-3 w-3 mr-1" />
                {t('objectDetail.mag')} {objectInfo.magnitude.toFixed(1)}
              </Badge>
            )}
            {objectInfo?.angularSize && (
              <Badge variant="outline" className="text-xs">
                <Ruler className="h-3 w-3 mr-1" />
                {objectInfo.angularSize}
              </Badge>
            )}
            {currentAstro && (
              <Badge 
                variant="outline" 
                className={cn(
                  'text-xs',
                  getFeasibilityColor(currentAstro.feasibility.recommendation)
                )}
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                {currentAstro.feasibility.score}/100
              </Badge>
            )}
            {isEnhancing && (
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            )}
          </div>
        </DrawerHeader>

        <ScrollArea className="flex-1 px-4 pb-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="overview" className="text-xs">
                  {t('objectDetail.overview')}
                </TabsTrigger>
                <TabsTrigger value="images" className="text-xs">
                  {t('objectDetail.images')}
                </TabsTrigger>
                <TabsTrigger value="observation" className="text-xs">
                  {t('objectDetail.observation')}
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4 mt-0">
                {/* Description */}
                {objectInfo?.description && (
                  <div className="rounded-lg bg-muted/30 p-3">
                    <p className="text-sm text-foreground/90 leading-relaxed">
                      {objectInfo.description}
                    </p>
                  </div>
                )}

                {/* Coordinates */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted/30 p-3">
                    <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                      <MapPin className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium">{t('coordinates.ra')}</span>
                    </div>
                    <p className="font-mono text-sm">{selectedObject?.ra}</p>
                  </div>
                  <div className="rounded-lg bg-muted/30 p-3">
                    <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                      <MapPin className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium">{t('coordinates.dec')}</span>
                    </div>
                    <p className="font-mono text-sm">{selectedObject?.dec}</p>
                  </div>
                </div>

                {/* Current Position */}
                {currentAstro && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-muted/30 p-3">
                      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                        <ArrowUp className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">{t('coordinates.alt')}</span>
                      </div>
                      <p className={cn(
                        'font-mono text-sm font-medium',
                        currentAstro.altitude > 30 ? 'text-green-400' :
                        currentAstro.altitude > 0 ? 'text-yellow-400' : 'text-red-400'
                      )}>
                        {currentAstro.altitude.toFixed(1)}°
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/30 p-3">
                      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                        <Compass className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">{t('coordinates.az')}</span>
                      </div>
                      <p className="font-mono text-sm">{currentAstro.azimuth.toFixed(1)}°</p>
                    </div>
                  </div>
                )}

                {/* Physical Properties */}
                {objectInfo && (objectInfo.distance || objectInfo.morphologicalType || objectInfo.spectralType) && (
                  <>
                    <Separator className="my-3" />
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-1.5">
                        <Info className="h-4 w-4 text-muted-foreground" />
                        {t('objectDetail.properties')}
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {objectInfo.morphologicalType && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('objectDetail.morphology')}</span>
                            <span>{objectInfo.morphologicalType}</span>
                          </div>
                        )}
                        {objectInfo.spectralType && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('objectDetail.spectralType')}</span>
                            <span>{objectInfo.spectralType}</span>
                          </div>
                        )}
                        {objectInfo.distance && (
                          <div className="flex justify-between col-span-2">
                            <span className="text-muted-foreground">{t('objectDetail.distance')}</span>
                            <span>{objectInfo.distance}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* External Links */}
                <Separator className="my-3" />
                <div className="flex flex-wrap gap-2">
                  {objectInfo?.simbadUrl && (
                    <a
                      href={objectInfo.simbadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                    >
                      <Database className="h-3.5 w-3.5" />
                      SIMBAD
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {objectInfo?.wikipediaUrl && (
                    <a
                      href={objectInfo.wikipediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                    >
                      <Info className="h-3.5 w-3.5" />
                      Wikipedia
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                {/* Data Sources */}
                {objectInfo?.sources && objectInfo.sources.length > 0 && (
                  <p className="text-[10px] text-muted-foreground/60 mt-2">
                    {t('objectDetail.dataSources')}: {objectInfo.sources.join(', ')}
                  </p>
                )}
              </TabsContent>

              {/* Images Tab */}
              <TabsContent value="images" className="mt-0">
                {objectInfo && (
                  <ObjectImageGallery 
                    images={objectInfo.images}
                    objectName={displayName}
                  />
                )}
              </TabsContent>

              {/* Observation Tab */}
              <TabsContent value="observation" className="space-y-4 mt-0">
                {currentAstro && (
                  <>
                    {/* Rise/Transit/Set */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center p-3 rounded-lg bg-muted/30">
                        <div className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
                          <ChevronUp className="h-3 w-3" />
                          {t('time.rise')}
                        </div>
                        <p className="font-mono text-sm font-medium">
                          {currentAstro.visibility.isCircumpolar ? '∞' : formatTimeShort(currentAstro.visibility.riseTime)}
                        </p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-muted/30">
                        <div className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
                          <Clock className="h-3 w-3" />
                          {t('time.transit')}
                        </div>
                        <p className="font-mono text-sm font-medium">
                          {formatTimeShort(currentAstro.visibility.transitTime)}
                        </p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-muted/30">
                        <div className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
                          <ChevronUp className="h-3 w-3 rotate-180" />
                          {t('time.set')}
                        </div>
                        <p className="font-mono text-sm font-medium">
                          {currentAstro.visibility.isCircumpolar ? '∞' : formatTimeShort(currentAstro.visibility.setTime)}
                        </p>
                      </div>
                    </div>

                    {/* Moon Distance & Max Altitude */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-muted/30 p-3">
                        <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                          <Moon className="h-3.5 w-3.5" />
                          <span className="text-xs font-medium">{t('session.moonDistance')}</span>
                        </div>
                        <p className={cn(
                          'font-mono text-sm font-medium',
                          currentAstro.moonDistance > 60 ? 'text-green-400' :
                          currentAstro.moonDistance > 30 ? 'text-yellow-400' : 'text-orange-400'
                        )}>
                          {currentAstro.moonDistance.toFixed(0)}°
                        </p>
                      </div>
                      <div className="rounded-lg bg-muted/30 p-3">
                        <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                          <TrendingUp className="h-3.5 w-3.5" />
                          <span className="text-xs font-medium">{t('session.maxAltitude')}</span>
                        </div>
                        <p className="font-mono text-sm font-medium">
                          {currentAstro.visibility.transitAltitude.toFixed(1)}°
                        </p>
                      </div>
                    </div>

                    {/* Imaging Feasibility */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className={cn(
                            'flex items-center justify-between p-3 rounded-lg border',
                            getFeasibilityColor(currentAstro.feasibility.recommendation)
                          )}>
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4" />
                              <span className="font-medium capitalize">
                                {currentAstro.feasibility.recommendation.replace('_', ' ')}
                              </span>
                            </div>
                            <span className="font-mono font-bold">
                              {currentAstro.feasibility.score}/100
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <div className="space-y-1 text-xs">
                            <p className="font-medium mb-1">{t('objectDetail.feasibilityBreakdown')}</p>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                              <span>{t('feasibility.moon')}:</span>
                              <span className="text-right">{currentAstro.feasibility.moonScore}</span>
                              <span>{t('feasibility.altitude')}:</span>
                              <span className="text-right">{currentAstro.feasibility.altitudeScore}</span>
                              <span>{t('feasibility.duration')}:</span>
                              <span className="text-right">{currentAstro.feasibility.durationScore}</span>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {/* Dark Imaging Window */}
                    {currentAstro.visibility.darkImagingHours > 0 && (
                      <div className="flex items-center gap-2 text-sm text-green-400">
                        <Clock className="h-4 w-4" />
                        {t('info.darkImagingWindow', { 
                          hours: currentAstro.visibility.darkImagingHours.toFixed(1) 
                        })}
                      </div>
                    )}

                    {/* Circumpolar indicator */}
                    {currentAstro.visibility.isCircumpolar && (
                      <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                        {t('session.circumpolar')}
                      </Badge>
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>
          )}
        </ScrollArea>

        {/* Action Buttons */}
        <div className="p-4 pt-2 border-t bg-background/80 backdrop-blur-sm">
          <div className="flex gap-2">
            {mountConnected && (
              <Button
                variant="outline"
                className="flex-1 border-primary text-primary hover:bg-primary/20"
                onClick={handleSlew}
              >
                <Crosshair className="h-4 w-4 mr-2" />
                {t('actions.slewToObject')}
              </Button>
            )}
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleAddToList}
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('actions.addToTargetList')}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
});
