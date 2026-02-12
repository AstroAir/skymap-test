'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Moon, Sun, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { raDecToAltAz } from '@/lib/astronomy/starmap-utils';
import { MoonPhaseSVG } from '../moon-phase-svg';
import {
  calculateTwilightTimes,
  getMoonPhase,
  getMoonPhaseName,
  getMoonIllumination,
  getMoonPosition,
  getSunPosition,
  formatTimeShort,
  formatDuration,
  getJulianDateFromDate,
} from '@/lib/astronomy/astro-utils';
import { degreesToHMS, degreesToDMS } from '@/lib/astronomy/starmap-utils';

interface AlmanacTabProps {
  latitude: number;
  longitude: number;
}

export function AlmanacTab({ latitude, longitude }: AlmanacTabProps) {
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
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Label className="text-xs">{t('astroCalc.date')}</Label>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="h-8 w-44"
          />
        </div>
        <div className="text-xs text-muted-foreground p-2 rounded-md bg-muted/50">
          {t('astroCalc.sunAlt')}: <span className={cn('font-mono font-medium', sunAltAz.altitude > 0 ? 'text-amber-500' : 'text-blue-400')}>{sunAltAz.altitude.toFixed(1)}°</span>
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
              <span className="text-muted-foreground">{t('astroCalc.tableRA')}</span>
              <span className="font-mono">{degreesToHMS(moonPos.ra)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('astroCalc.tableDec')}</span>
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
        <div className="flex gap-1.5 overflow-x-auto pb-2">
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
                  {d.toLocaleDateString(undefined, { weekday: 'short' })}
                </span>
                <span className="font-medium">
                  {d.getDate()}
                </span>
                <MoonPhaseSVG phase={phase} size={24} className="mt-1" />
                <span className="text-muted-foreground text-[10px] mt-1">{illum}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
