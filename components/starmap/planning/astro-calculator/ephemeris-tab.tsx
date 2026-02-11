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
import { cn } from '@/lib/utils';
import { degreesToHMS, degreesToDMS } from '@/lib/astronomy/starmap-utils';
import { raDecToAltAzAtTime } from '@/lib/astronomy/coordinates/transforms';
import type { EphemerisEntry } from './types';

interface EphemerisTabProps {
  latitude: number;
  longitude: number;
  selectedTarget?: { name: string; ra: number; dec: number };
}

export function EphemerisTab({ latitude, longitude, selectedTarget }: EphemerisTabProps) {
  const t = useTranslations();
  const [targetRA, setTargetRA] = useState(selectedTarget?.ra?.toString() ?? '');
  const [targetDec, setTargetDec] = useState(selectedTarget?.dec?.toString() ?? '');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [stepHours, setStepHours] = useState(1);
  const [numSteps, setNumSteps] = useState(24);
  
  const ra = parseFloat(targetRA) || selectedTarget?.ra || 0;
  const dec = parseFloat(targetDec) || selectedTarget?.dec || 0;
  
  // Calculate ephemeris
  const ephemeris = useMemo(() => {
    if (!ra && !dec) return [];
    
    const results: EphemerisEntry[] = [];
    const start = new Date(startDate);
    
    for (let i = 0; i < numSteps; i++) {
      const date = new Date(start.getTime() + i * stepHours * 3600000);
      const altAz = raDecToAltAzAtTime(ra, dec, latitude, longitude, date);
      
      results.push({
        date,
        ra,
        dec,
        altitude: altAz.altitude,
        azimuth: altAz.azimuth,
      });
    }
    
    return results;
  }, [ra, dec, latitude, longitude, startDate, stepHours, numSteps]);
  
  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="grid grid-cols-5 gap-3">
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
          <Label className="text-xs">{t('astroCalc.startDate')}</Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-8"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{t('astroCalc.stepHours')}</Label>
          <Select value={stepHours.toString()} onValueChange={(v) => setStepHours(parseInt(v))}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">{t('astroCalc.hourIntervals.1h')}</SelectItem>
              <SelectItem value="2">{t('astroCalc.hourIntervals.2h')}</SelectItem>
              <SelectItem value="6">{t('astroCalc.hourIntervals.6h')}</SelectItem>
              <SelectItem value="12">{t('astroCalc.hourIntervals.12h')}</SelectItem>
              <SelectItem value="24">{t('astroCalc.hourIntervals.1d')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{t('astroCalc.steps')}</Label>
          <Select value={numSteps.toString()} onValueChange={(v) => setNumSteps(parseInt(v))}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="12">12</SelectItem>
              <SelectItem value="24">24</SelectItem>
              <SelectItem value="48">48</SelectItem>
              <SelectItem value="168">{t('astroCalc.oneWeek')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Ephemeris Table */}
      <ScrollArea className="h-[380px] border rounded-lg">
        <Table>
          <TableHeader className="sticky top-0 bg-background">
            <TableRow>
              <TableHead>{t('astroCalc.dateTime')}</TableHead>
              <TableHead>{t('astroCalc.tableRA')}</TableHead>
              <TableHead>{t('astroCalc.tableDec')}</TableHead>
              <TableHead>{t('astroCalc.altitude')}</TableHead>
              <TableHead>{t('astroCalc.azimuth')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ephemeris.map((entry, i) => (
              <TableRow key={i}>
                <TableCell className="font-mono text-xs">
                  {entry.date.toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </TableCell>
                <TableCell className="font-mono text-xs">{degreesToHMS(entry.ra)}</TableCell>
                <TableCell className="font-mono text-xs">{degreesToDMS(entry.dec)}</TableCell>
                <TableCell className={cn(
                  'text-xs',
                  entry.altitude > 30 ? 'text-green-500' : entry.altitude > 0 ? 'text-yellow-500' : 'text-red-500'
                )}>
                  {entry.altitude.toFixed(1)}°
                </TableCell>
                <TableCell className="text-xs">{entry.azimuth.toFixed(1)}°</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
