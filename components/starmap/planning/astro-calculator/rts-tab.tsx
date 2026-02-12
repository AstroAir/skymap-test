'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { degreesToHMS, degreesToDMS, raDecToAltAz } from '@/lib/astronomy/starmap-utils';
import {
  calculateTargetVisibility,
  getSunPosition,
  formatTimeShort,
  getJulianDateFromDate,
} from '@/lib/astronomy/astro-utils';
import { AltitudeChart } from '../altitude-chart';

interface RTSTabProps {
  latitude: number;
  longitude: number;
  selectedTarget?: { name: string; ra: number; dec: number };
}

export function RTSTab({ latitude, longitude, selectedTarget }: RTSTabProps) {
  const t = useTranslations();
  const [targetName, setTargetName] = useState(selectedTarget?.name ?? '');
  const [targetRA, setTargetRA] = useState(selectedTarget?.ra?.toString() ?? '');
  const [targetDec, setTargetDec] = useState(selectedTarget?.dec?.toString() ?? '');
  const [dateRange, setDateRange] = useState<number>(7); // days ahead
  
  // Parse coordinates
  const ra = parseFloat(targetRA) || selectedTarget?.ra || 0;
  const dec = parseFloat(targetDec) || selectedTarget?.dec || 0;
  
  // Calculate RTS for multiple days
  const rtsData = useMemo(() => {
    if (!ra && !dec) return [];
    
    const results: Array<{
      date: Date;
      riseTime: Date | null;
      transitTime: Date | null;
      setTime: Date | null;
      transitAlt: number;
      sunAlt: number;
    }> = [];
    
    const now = new Date();
    for (let i = 0; i < dateRange; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      date.setHours(12, 0, 0, 0);
      
      const visibility = calculateTargetVisibility(ra, dec, latitude, longitude, 0, date);
      const sunPos = getSunPosition(getJulianDateFromDate(date));
      const sunAltAz = raDecToAltAz(sunPos.ra, sunPos.dec, latitude, longitude);
      
      results.push({
        date,
        riseTime: visibility.riseTime,
        transitTime: visibility.transitTime,
        setTime: visibility.setTime,
        transitAlt: visibility.transitAltitude,
        sunAlt: sunAltAz.altitude,
      });
    }
    
    return results;
  }, [ra, dec, latitude, longitude, dateRange]);
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  };
  
  return (
    <div className="space-y-4">
      {/* Target Input */}
      <div className="grid grid-cols-4 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">{t('astroCalc.targetName')}</Label>
          <Input
            value={targetName}
            onChange={(e) => setTargetName(e.target.value)}
            placeholder="M31, NGC 7000..."
            className="h-8"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{t('astroCalc.raLabel')}</Label>
          <Input
            value={targetRA}
            onChange={(e) => setTargetRA(e.target.value)}
            placeholder="10.68"
            className="h-8 font-mono"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{t('astroCalc.decLabel')}</Label>
          <Input
            value={targetDec}
            onChange={(e) => setTargetDec(e.target.value)}
            placeholder="41.27"
            className="h-8 font-mono"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{t('astroCalc.daysAhead')}</Label>
          <Select value={dateRange.toString()} onValueChange={(v) => setDateRange(parseInt(v))}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">{t('astroCalc.daysRange.7d')}</SelectItem>
              <SelectItem value="14">{t('astroCalc.daysRange.14d')}</SelectItem>
              <SelectItem value="30">{t('astroCalc.daysRange.30d')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Current info with altitude chart */}
      {ra && dec && (
        <div className="space-y-3">
          <div className="flex items-center gap-4 text-sm p-3 rounded-lg bg-muted/50">
            <div>
              <span className="text-muted-foreground">RA:</span>{' '}
              <span className="font-mono">{degreesToHMS(ra)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Dec:</span>{' '}
              <span className="font-mono">{degreesToDMS(dec)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">{t('astroCalc.maxAltitude')}:</span>{' '}
              <span>{(90 - Math.abs(latitude - dec)).toFixed(1)}°</span>
            </div>
          </div>
          
          {/* Reuse existing AltitudeChart component */}
          <AltitudeChart ra={ra} dec={dec} name={targetName} hoursAhead={12} />
        </div>
      )}
      
      {/* RTS Table */}
      <ScrollArea className="h-[350px] border rounded-lg">
        <Table>
          <TableHeader className="sticky top-0 bg-background">
            <TableRow>
              <TableHead>{t('astroCalc.date')}</TableHead>
              <TableHead>{t('astroCalc.rise')}</TableHead>
              <TableHead>{t('astroCalc.transit')}</TableHead>
              <TableHead>{t('astroCalc.transitAlt')}</TableHead>
              <TableHead>{t('astroCalc.set')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rtsData.map((day, i) => (
              <TableRow key={i}>
                <TableCell className="font-medium text-sm">{formatDate(day.date)}</TableCell>
                <TableCell className="font-mono text-xs">
                  {day.riseTime ? formatTimeShort(day.riseTime) : t('astroCalc.circumpolar')}
                </TableCell>
                <TableCell className="font-mono text-xs">{formatTimeShort(day.transitTime)}</TableCell>
                <TableCell className="text-xs">{day.transitAlt.toFixed(1)}°</TableCell>
                <TableCell className="font-mono text-xs">
                  {day.setTime ? formatTimeShort(day.setTime) : t('astroCalc.circumpolar')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
