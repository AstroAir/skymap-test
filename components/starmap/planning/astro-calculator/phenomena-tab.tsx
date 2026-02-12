'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  getMoonPhase,
  getMoonPosition,
  angularSeparation,
  getJulianDateFromDate,
} from '@/lib/astronomy/astro-utils';
import type { PhenomenaEvent } from './types';

// Simple planetary position approximations (mean elements)
const PLANETS = {
  Mercury: { period: 87.969, meanLon0: 252.251, a: 0.387 },
  Venus: { period: 224.701, meanLon0: 181.980, a: 0.723 },
  Mars: { period: 686.980, meanLon0: 355.453, a: 1.524 },
  Jupiter: { period: 4332.59, meanLon0: 34.404, a: 5.203 },
  Saturn: { period: 10759.22, meanLon0: 49.944, a: 9.537 },
};

function getPlanetPosition(planet: keyof typeof PLANETS, jd: number) {
  const p = PLANETS[planet];
  const d = jd - 2451545.0; // Days from J2000
  const meanLon = (p.meanLon0 + 360 * d / p.period) % 360;
  // Very simplified - just for demonstration
  const ra = meanLon; // Approximate RA along ecliptic
  const dec = Math.sin(meanLon * Math.PI / 180) * 23.4 * (1 / p.a); // Simplified dec
  return { ra: (ra + 360) % 360, dec: Math.max(-90, Math.min(90, dec)) };
}

interface PhenomenaTabProps {
  latitude: number;
  longitude: number;
}

export function PhenomenaTab({ latitude: _latitude, longitude: _longitude }: PhenomenaTabProps) {
  const t = useTranslations();
  const [daysAhead, setDaysAhead] = useState(30);
  const [showMinor, setShowMinor] = useState(false);
  
  // Calculate phenomena for the date range
  const phenomena = useMemo(() => {
    const events: PhenomenaEvent[] = [];
    const now = new Date();
    
    for (let d = 0; d < daysAhead; d++) {
      const date = new Date(now);
      date.setDate(date.getDate() + d);
      date.setHours(0, 0, 0, 0);
      const jd = getJulianDateFromDate(date);
      
      // Get moon position
      const moonPos = getMoonPosition(jd);
      const moonPhase = getMoonPhase(jd);
      
      // Check moon phase events
      if (d > 0) {
        const prevDate = new Date(date);
        prevDate.setDate(prevDate.getDate() - 1);
        const prevPhase = getMoonPhase(getJulianDateFromDate(prevDate));
        
        // New Moon
        if (prevPhase > 0.95 && moonPhase < 0.05) {
          events.push({
            date,
            type: 'conjunction',
            object1: 'Moon',
            object2: 'Sun',
            details: t('astroCalc.newMoon'),
            importance: 'high',
          });
        }
        // Full Moon
        if (prevPhase < 0.5 && moonPhase >= 0.5 && prevPhase > 0.45) {
          events.push({
            date,
            type: 'opposition',
            object1: 'Moon',
            details: t('astroCalc.fullMoon'),
            importance: 'high',
          });
        }
        // First Quarter
        if (prevPhase < 0.25 && moonPhase >= 0.25 && prevPhase > 0.2) {
          events.push({
            date,
            type: 'elongation',
            object1: 'Moon',
            separation: 90,
            details: t('astroCalc.firstQuarter'),
            importance: 'medium',
          });
        }
        // Last Quarter
        if (prevPhase < 0.75 && moonPhase >= 0.75 && prevPhase > 0.7) {
          events.push({
            date,
            type: 'elongation',
            object1: 'Moon',
            separation: 90,
            details: t('astroCalc.lastQuarter'),
            importance: 'medium',
          });
        }
      }
      
      // Check planetary conjunctions with moon
      Object.keys(PLANETS).forEach(planetName => {
        const planetPos = getPlanetPosition(planetName as keyof typeof PLANETS, jd);
        const sep = angularSeparation(moonPos.ra, moonPos.dec, planetPos.ra, planetPos.dec);
        
        if (sep < 5) {
          events.push({
            date,
            type: 'close_approach',
            object1: 'Moon',
            object2: planetName,
            separation: sep,
            details: t('astroCalc.moonFrom', { sep: sep.toFixed(1), planet: planetName }),
            importance: sep < 2 ? 'high' : 'medium',
          });
        }
      });
      
      // Check planetary conjunctions with each other
      const planetNames = Object.keys(PLANETS) as Array<keyof typeof PLANETS>;
      for (let i = 0; i < planetNames.length; i++) {
        for (let j = i + 1; j < planetNames.length; j++) {
          const pos1 = getPlanetPosition(planetNames[i], jd);
          const pos2 = getPlanetPosition(planetNames[j], jd);
          const sep = angularSeparation(pos1.ra, pos1.dec, pos2.ra, pos2.dec);
          
          if (sep < 3) {
            events.push({
              date,
              type: 'conjunction',
              object1: planetNames[i],
              object2: planetNames[j],
              separation: sep,
              details: t('astroCalc.planetFrom', { planet1: planetNames[i], sep: sep.toFixed(1), planet2: planetNames[j] }),
              importance: sep < 1 ? 'high' : 'medium',
            });
          }
        }
      }
    }
    
    // Filter and sort
    const filtered = showMinor ? events : events.filter(e => e.importance !== 'low');
    return filtered.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [daysAhead, showMinor, t]);
  
  const getEventIcon = (type: PhenomenaEvent['type']) => {
    switch (type) {
      case 'conjunction': return '☌';
      case 'opposition': return '☍';
      case 'elongation': return '◐';
      case 'occultation': return '◯';
      case 'close_approach': return '↔';
    }
  };
  
  const getImportanceColor = (importance: PhenomenaEvent['importance']) => {
    switch (importance) {
      case 'high': return 'text-amber-500';
      case 'medium': return 'text-blue-400';
      case 'low': return 'text-muted-foreground';
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">{t('astroCalc.daysAhead')}</Label>
            <Select value={daysAhead.toString()} onValueChange={(v) => setDaysAhead(parseInt(v))}>
              <SelectTrigger className="h-8 w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">{t('astroCalc.daysRange.7d')}</SelectItem>
                <SelectItem value="14">{t('astroCalc.daysRange.14d')}</SelectItem>
                <SelectItem value="30">{t('astroCalc.daysRange.30d')}</SelectItem>
                <SelectItem value="60">{t('astroCalc.daysRange.60d')}</SelectItem>
                <SelectItem value="90">{t('astroCalc.daysRange.90d')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <Switch
              id="showMinor"
              checked={showMinor}
              onCheckedChange={setShowMinor}
            />
            <Label htmlFor="showMinor" className="text-xs">{t('astroCalc.showMinorEvents')}</Label>
          </div>
        </div>
        
        <Badge variant="outline">
          {phenomena.length} {t('astroCalc.events')}
        </Badge>
      </div>
      
      <ScrollArea className="h-[420px] border rounded-lg">
        {phenomena.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            {t('astroCalc.noPhenomena')}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {phenomena.map((event, i) => (
              <div key={i} className="p-3 hover:bg-muted/50">
                <div className="flex items-start gap-3">
                  <span className={cn('text-xl', getImportanceColor(event.importance))}>
                    {getEventIcon(event.type)}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{event.details}</span>
                      <Badge variant={event.importance === 'high' ? 'default' : 'secondary'} className="text-[10px]">
                        {t(`astroCalc.eventType.${event.type}`)}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {event.date.toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                      {event.separation && ` • ${event.separation.toFixed(1)}° ${t('astroCalc.separation')}`}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
      
      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>☌ {t('astroCalc.conjunction')}</span>
        <span>☍ {t('astroCalc.opposition')}</span>
        <span>◐ {t('astroCalc.elongation')}</span>
        <span>↔ {t('astroCalc.closeApproach')}</span>
      </div>
    </div>
  );
}
