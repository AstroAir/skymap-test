'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { 
  Moon, Sun, Clock, MapPin, Eye, Compass, TrendingUp, 
  Sunrise, Sunset, Star, Calendar, Timer, AlertTriangle,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

import { useMountStore } from '@/lib/stores';
import { raDecToAltAz, getLST, degreesToHMS } from '@/lib/astronomy/starmap-utils';
import { getSkyConditionColor, getFeasibilityColor, formatCountdown } from '@/lib/core/constants/planning-styles';
import type { AstroSessionPanelProps } from '@/types/starmap/planning';
import { useAstronomy } from '@/lib/tauri/hooks';
import {
  getMoonPhase,
  getMoonPhaseName,
  getMoonIllumination,
  getMoonPosition,
  getSunPosition,
  angularSeparation,
  getTransitTime,
  getMaxAltitude,
  isCircumpolar,
  calculateTwilightTimes,
  calculateTargetVisibility,
  calculateImagingFeasibility,
  formatTimeShort,
  formatDuration,
} from '@/lib/astronomy/astro-utils';


export function AstroSessionPanel({
  selectedRa,
  selectedDec,
  selectedName,
}: AstroSessionPanelProps) {
  const t = useTranslations();
  const [showTwilightDetails, setShowTwilightDetails] = useState(false);
  const [calcEpoch, setCalcEpoch] = useState(0);
  
  const profileInfo = useMountStore((state) => state.profileInfo);
  
  const latitude = profileInfo.AstrometrySettings.Latitude || 0;
  const longitude = profileInfo.AstrometrySettings.Longitude || 0;
  
  // Tauri astronomy hook for enhanced calculations in desktop mode
  const tauriAstronomy = useAstronomy(latitude, longitude);

  // Recalculate astronomical data every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCalcEpoch(prev => prev + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Calculate astronomical data including twilight
  // Use Tauri data when available for enhanced accuracy
  const astroData = useMemo(() => {
    // Prefer Tauri calculations when available
    const moonPhase = tauriAstronomy.moonPhase?.phase ?? getMoonPhase();
    const moonPhaseName = tauriAstronomy.moonPhase?.phase_name ?? getMoonPhaseName(moonPhase);
    const moonIllumination = tauriAstronomy.moonPhase 
      ? tauriAstronomy.moonPhase.illumination * 100 
      : getMoonIllumination(moonPhase);
    
    const moonPos = tauriAstronomy.moonPosition 
      ? { ra: tauriAstronomy.moonPosition.ra, dec: tauriAstronomy.moonPosition.dec }
      : getMoonPosition();
    const sunPos = tauriAstronomy.sunPosition
      ? { ra: tauriAstronomy.sunPosition.ra, dec: tauriAstronomy.sunPosition.dec }
      : getSunPosition();
    
    const moonAltAz = raDecToAltAz(moonPos.ra, moonPos.dec, latitude, longitude);
    const sunAltAz = raDecToAltAz(sunPos.ra, sunPos.dec, latitude, longitude);
    
    const lst = getLST(longitude);
    const lstString = degreesToHMS(lst);
    
    // Get detailed twilight times
    const twilight = calculateTwilightTimes(latitude, longitude, new Date());
    
    // Calculate countdown to next event
    const now = new Date();
    let nextEvent = '';
    let nextEventTime: Date | null = null;
    let countdownMinutes = 0;
    
    if (twilight.currentTwilightPhase === 'day' && twilight.sunset) {
      nextEvent = t('session.sunset');
      nextEventTime = twilight.sunset;
    } else if (twilight.currentTwilightPhase === 'civil' && twilight.civilDusk) {
      nextEvent = t('session.civilDusk');
      nextEventTime = twilight.civilDusk;
    } else if (twilight.currentTwilightPhase === 'nautical' && twilight.nauticalDusk) {
      nextEvent = t('session.nauticalDusk');
      nextEventTime = twilight.nauticalDusk;
    } else if (twilight.currentTwilightPhase === 'astronomical' && twilight.astronomicalDusk) {
      nextEvent = t('session.astroDusk');
      nextEventTime = twilight.astronomicalDusk;
    } else if (twilight.currentTwilightPhase === 'night' && twilight.astronomicalDawn) {
      nextEvent = t('session.astroDawn');
      nextEventTime = twilight.astronomicalDawn;
    }
    
    if (nextEventTime) {
      countdownMinutes = Math.max(0, (nextEventTime.getTime() - now.getTime()) / 60000);
    }
    
    // Moon interference score (0-100, higher is worse)
    let moonInterference = 0;
    if (moonAltAz.altitude > 0) {
      moonInterference = Math.min(100, (moonIllumination * (90 - Math.abs(moonAltAz.altitude))) / 90);
    }
    
    return {
      moonPhase,
      moonPhaseName,
      moonIllumination,
      moonAltitude: moonAltAz.altitude,
      moonAzimuth: moonAltAz.azimuth,
      moonRa: moonPos.ra,
      moonDec: moonPos.dec,
      sunAltitude: sunAltAz.altitude,
      sunAzimuth: sunAltAz.azimuth,
      lst,
      lstString,
      twilight,
      nextEvent,
      nextEventTime,
      countdownMinutes,
      moonInterference,
    };
  // calcEpoch is intentionally used to throttle recalculations to every 60s
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude, calcEpoch, t, tauriAstronomy.moonPhase, tauriAstronomy.moonPosition, tauriAstronomy.sunPosition]);

  // Calculate target-specific data with full visibility info
  const targetData = useMemo(() => {
    if (selectedRa === undefined || selectedDec === undefined) return null;
    
    const altAz = raDecToAltAz(selectedRa, selectedDec, latitude, longitude);
    const moonDistance = angularSeparation(selectedRa, selectedDec, astroData.moonRa, astroData.moonDec);
    const transit = getTransitTime(selectedRa, longitude);
    const maxAlt = getMaxAltitude(selectedDec, latitude);
    const circumpolar = isCircumpolar(selectedDec, latitude);
    
    // Get detailed visibility and feasibility
    const visibility = calculateTargetVisibility(selectedRa, selectedDec, latitude, longitude, 30);
    const feasibility = calculateImagingFeasibility(selectedRa, selectedDec, latitude, longitude);
    
    return {
      altitude: altAz.altitude,
      azimuth: altAz.azimuth,
      moonDistance,
      hoursUntilTransit: transit.hoursUntilTransit,
      maxAltitude: maxAlt,
      isCircumpolar: circumpolar,
      isVisible: altAz.altitude > 0,
      visibility,
      feasibility,
    };
  // calcEpoch is intentionally used to throttle recalculations to every 60s
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRa, selectedDec, latitude, longitude, astroData.moonRa, astroData.moonDec, calcEpoch]);

  const getSkyConditionLabel = (condition: string) => {
    switch (condition) {
      case 'night': return t('session.darkSky');
      case 'astronomical': return t('session.astroTwilight');
      case 'nautical': return t('session.nauticalTwilight');
      case 'civil': return t('session.civilTwilight');
      case 'day': return t('session.daylight');
      default: return condition;
    }
  };

  return (
    <TooltipProvider>
      <Card className="bg-transparent border-0 shadow-none">
        <CardHeader className="pb-2 px-0 pt-0">
          <CardTitle className="text-sm flex items-center gap-2 text-primary">
            <Eye className="h-4 w-4" />
            {t('session.sessionInfo')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-0 pb-0">
          {/* Sky Condition with Countdown */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{t('session.sky')}</span>
              <Badge className={`${getSkyConditionColor(astroData.twilight.currentTwilightPhase)} text-white text-xs`}>
                {getSkyConditionLabel(astroData.twilight.currentTwilightPhase)}
              </Badge>
            </div>
            {astroData.nextEvent && astroData.countdownMinutes > 0 && (
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Timer className="h-3 w-3" />
                  <span>{astroData.nextEvent}</span>
                </div>
                <span className="text-foreground font-mono">
                  {formatCountdown(astroData.countdownMinutes)}
                </span>
              </div>
            )}
          </div>

          {/* Night Duration */}
          {astroData.twilight.darknessDuration > 0 && (
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Star className="h-3 w-3" />
                <span>{t('session.darkTime')}</span>
              </div>
              <span className="text-foreground">{formatDuration(astroData.twilight.darknessDuration)}</span>
            </div>
          )}

          {/* LST */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{t('session.lst')}</span>
            </div>
            <span className="text-xs text-foreground font-mono">{astroData.lstString}</span>
          </div>

          <Separator className="bg-border" />

          {/* Twilight Times (Collapsible) */}
          <Collapsible open={showTwilightDetails} onOpenChange={setShowTwilightDetails}>
            <CollapsibleTrigger className="flex items-center justify-between w-full text-xs text-muted-foreground hover:text-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3" />
                <span>{t('session.twilightTimes')}</span>
              </div>
              {showTwilightDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-1.5">
              {/* Evening */}
              <div className="text-[10px] text-muted-foreground mb-1">{t('session.evening')}</div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                <div className="flex items-center gap-1">
                  <Sunset className="h-3 w-3 text-amber-500" />
                  <span className="text-muted-foreground">{t('session.sunset')}</span>
                </div>
                <span className="text-foreground font-mono text-right">{formatTimeShort(astroData.twilight.sunset)}</span>
                
                <span className="text-muted-foreground pl-4">{t('session.civil')}</span>
                <span className="text-foreground font-mono text-right">{formatTimeShort(astroData.twilight.civilDusk)}</span>
                
                <span className="text-muted-foreground pl-4">{t('session.nautical')}</span>
                <span className="text-foreground font-mono text-right">{formatTimeShort(astroData.twilight.nauticalDusk)}</span>
                
                <span className="text-muted-foreground pl-4">{t('session.astro')}</span>
                <span className="text-foreground font-mono text-right">{formatTimeShort(astroData.twilight.astronomicalDusk)}</span>
              </div>
              
              {/* Morning */}
              <div className="text-[10px] text-muted-foreground mt-2 mb-1">{t('session.morning')}</div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                <span className="text-muted-foreground pl-4">{t('session.astro')}</span>
                <span className="text-foreground font-mono text-right">{formatTimeShort(astroData.twilight.astronomicalDawn)}</span>
                
                <span className="text-muted-foreground pl-4">{t('session.nautical')}</span>
                <span className="text-foreground font-mono text-right">{formatTimeShort(astroData.twilight.nauticalDawn)}</span>
                
                <span className="text-muted-foreground pl-4">{t('session.civil')}</span>
                <span className="text-foreground font-mono text-right">{formatTimeShort(astroData.twilight.civilDawn)}</span>
                
                <div className="flex items-center gap-1">
                  <Sunrise className="h-3 w-3 text-amber-500" />
                  <span className="text-muted-foreground">{t('session.sunrise')}</span>
                </div>
                <span className="text-foreground font-mono text-right">{formatTimeShort(astroData.twilight.sunrise)}</span>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator className="bg-border" />

          {/* Moon Info */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Moon className="h-3 w-3 text-amber-400" />
                <span className="text-xs text-foreground">{astroData.moonPhaseName}</span>
              </div>
              <span className={`text-xs ${astroData.moonAltitude > 0 ? 'text-amber-400' : 'text-muted-foreground'}`}>
                {astroData.moonAltitude.toFixed(1)}°
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{t('session.illumination')}</span>
              <span className="text-foreground">{astroData.moonIllumination}%</span>
            </div>
            <Progress value={astroData.moonIllumination} className="h-1" />
            
            {/* Moon interference indicator */}
            {astroData.moonAltitude > 0 && astroData.moonIllumination > 20 && (
              <div className="flex items-center gap-1.5 text-xs">
                <AlertTriangle className="h-3 w-3 text-yellow-400" />
                <span className="text-yellow-400">
                  {astroData.moonInterference > 60 
                    ? t('session.highMoonInterference') 
                    : astroData.moonInterference > 30 
                      ? t('session.moderateMoonInterference') 
                      : t('session.lowMoonInterference')}
                </span>
              </div>
            )}
          </div>

          <Separator className="bg-border" />

          {/* Sun Info */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <Sun className="h-3 w-3 text-amber-500" />
              <span className="text-muted-foreground">{t('session.sunAltitude')}</span>
            </div>
            <span className={astroData.sunAltitude > 0 ? 'text-amber-500' : 'text-muted-foreground'}>
              {astroData.sunAltitude.toFixed(1)}°
            </span>
          </div>

          {/* Target Info */}
          {targetData && (
            <>
              <Separator className="bg-border" />
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Compass className="h-3 w-3 text-primary" />
                  <span className="text-xs text-primary truncate font-medium">
                    {selectedName || t('session.target')}
                  </span>
                </div>
                
                {/* Position */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Alt: </span>
                    <span className={targetData.altitude > 30 ? 'text-green-400' : targetData.altitude > 0 ? 'text-yellow-400' : 'text-red-400'}>
                      {targetData.altitude.toFixed(1)}°
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Az: </span>
                    <span className="text-foreground">{targetData.azimuth.toFixed(1)}°</span>
                  </div>
                </div>

                {/* Rise/Set/Transit Times */}
                <div className="grid grid-cols-3 gap-1 text-xs">
                  <div className="text-center">
                    <div className="text-muted-foreground text-[10px]">{t('chart.rise')}</div>
                    <div className="text-foreground font-mono">
                      {targetData.visibility.isCircumpolar ? '∞' : formatTimeShort(targetData.visibility.riseTime)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-muted-foreground text-[10px]">{t('session.transitTime')}</div>
                    <div className="text-foreground font-mono">{formatTimeShort(targetData.visibility.transitTime)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-muted-foreground text-[10px]">{t('chart.set')}</div>
                    <div className="text-foreground font-mono">
                      {targetData.visibility.isCircumpolar ? '∞' : formatTimeShort(targetData.visibility.setTime)}
                    </div>
                  </div>
                </div>

                {/* Moon & Max Alt */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t('session.moonDistance')}</span>
                    <span className={targetData.moonDistance > 30 ? 'text-green-400' : 'text-yellow-400'}>
                      {targetData.moonDistance.toFixed(0)}°
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t('session.maxAltitude')}</span>
                    <span className="text-foreground">{targetData.maxAltitude.toFixed(1)}°</span>
                  </div>
                </div>

                {/* Dark Imaging Window */}
                {targetData.visibility.darkImagingHours > 0 && (
                  <div className="text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{t('session.darkWindow')}</span>
                      <span className="text-green-400">{formatDuration(targetData.visibility.darkImagingHours)}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {formatTimeShort(targetData.visibility.darkImagingStart)} - {formatTimeShort(targetData.visibility.darkImagingEnd)}
                    </div>
                  </div>
                )}

                {targetData.isCircumpolar && (
                  <Badge variant="outline" className="text-xs border-primary text-primary">
                    {t('session.circumpolar')}
                  </Badge>
                )}

                {/* Feasibility Score */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={`flex items-center justify-between p-1.5 rounded text-xs ${getFeasibilityColor(targetData.feasibility.recommendation)}`}>
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="h-3 w-3" />
                        <span className="capitalize">{targetData.feasibility.recommendation.replace('_', ' ')}</span>
                      </div>
                      <span className="font-mono">{targetData.feasibility.score}/100</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-56">
                    <div className="space-y-1 text-xs">
                      <div className="grid grid-cols-2 gap-x-2">
                        <span>{t('feasibility.moon')}:</span><span>{targetData.feasibility.moonScore}</span>
                        <span>{t('feasibility.altitude')}:</span><span>{targetData.feasibility.altitudeScore}</span>
                        <span>{t('feasibility.duration')}:</span><span>{targetData.feasibility.durationScore}</span>
                        <span>{t('feasibility.twilight')}:</span><span>{targetData.feasibility.twilightScore}</span>
                      </div>
                      {targetData.feasibility.warnings.length > 0 && (
                        <div className="text-yellow-400 mt-1">
                          {targetData.feasibility.warnings[0]}
                        </div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
            </>
          )}

          {/* Location */}
          <Separator className="bg-border" />
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>{latitude.toFixed(2)}°, {longitude.toFixed(2)}°</span>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}


