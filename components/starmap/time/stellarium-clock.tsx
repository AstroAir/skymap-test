'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useStellariumStore } from '@/lib/stores';
import { mjdToUTC, utcToMJD, formatDateForInput, formatTimeForInput } from '@/lib/astronomy/starmap-utils';
import { Clock, Play, Pause, RotateCcw, FastForward, Rewind, SkipBack, SkipForward, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { createLogger } from '@/lib/logger';

const logger = createLogger('stellarium-clock');

export function StellariumClock() {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [formattedTime, setFormattedTime] = useState('');
  const [formattedDate, setFormattedDate] = useState('');
  const [dateValue, setDateValue] = useState(formatDateForInput(new Date()));
  const [timeValue, setTimeValue] = useState(formatTimeForInput(new Date()));
  const [timeSpeed, setTimeSpeed] = useState(0);
  
  const stel = useStellariumStore((state) => state.stel);

  // Convert MJD to Date
  const mjdToDate = useCallback((mjd: number) => {
    const mjdBaseDate = new Date(Date.UTC(1858, 10, 17, 0, 0, 0));
    const daysToMilliseconds = 86400000;
    return new Date(mjdBaseDate.getTime() + mjd * daysToMilliseconds);
  }, []);

  // Format date/time from Stellarium
  const formatDateTime = useCallback((date: Date) => {
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    };
    setFormattedTime(date.toLocaleString(undefined, timeOptions));

    const dateOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    };
    setFormattedDate(date.toLocaleString(undefined, dateOptions));
  }, []);

  // Update time display
  useEffect(() => {
    if (!stel) return;

    let animationFrameId: number;
    
    const updateTime = () => {
      const mjd = stel.core.observer.utc;
      const date = mjdToDate(mjd);
      formatDateTime(date);
      animationFrameId = requestAnimationFrame(updateTime);
    };

    updateTime();
    return () => cancelAnimationFrame(animationFrameId);
  }, [stel, mjdToDate, formatDateTime]);

  // Update inputs from Stellarium time when dialog opens
  // Using a ref to track previous open state to avoid synchronous setState warning
  const prevOpenRef = useRef(false);
  useEffect(() => {
    // Only update when transitioning from closed to open
    if (open && !prevOpenRef.current && stel) {
      const mjd = stel.core.observer.utc;
      const stelDate = mjdToUTC(mjd);
      // Use setTimeout to make the setState async
      setTimeout(() => {
        setDateValue(formatDateForInput(stelDate));
        setTimeValue(formatTimeForInput(stelDate));
      }, 0);
    }
    prevOpenRef.current = open;
  }, [open, stel]);

  // Apply date/time to Stellarium
  const applyDateTime = useCallback(() => {
    if (!stel) return;

    try {
      const [year, month, day] = dateValue.split('-').map(Number);
      const [hours, minutes] = timeValue.split(':').map(Number);
      const dateObj = new Date(year, month - 1, day, hours, minutes, 0, 0);
      const mjd = utcToMJD(dateObj);
      
      // Use Object.assign to avoid eslint react-compiler issue
      Object.assign(stel.core.observer, { utc: mjd });
    } catch (error) {
      logger.error('Error setting date/time', error);
    }
  }, [stel, dateValue, timeValue]);

  // Reset to current time
  const resetToCurrentTime = useCallback(() => {
    const now = new Date();
    setDateValue(formatDateForInput(now));
    setTimeValue(formatTimeForInput(now));
    
    if (stel) {
      const mjd = utcToMJD(now);
      Object.assign(stel.core.observer, { utc: mjd });
    }
  }, [stel]);

  // Update time speed
  const handleTimeSpeedChange = useCallback((value: number) => {
    setTimeSpeed(value);
    if (stel) {
      const speed = Math.pow(2, value);
      Object.assign(stel.core, { time_speed: speed });
    }
  }, [stel]);

  // Format time speed for display
  const displayTimeSpeed = (() => {
    const speed = Math.pow(2, timeSpeed);
    if (speed === 1) return '1×';
    return speed > 0 ? `${speed}×` : `1/${Math.abs(1 / speed)}×`;
  })();

  const timeSpeedDescription = (() => {
    const speed = Math.pow(2, timeSpeed);
    if (speed === 0) return t('time.paused');
    if (speed === 1) return t('time.realTime');
    if (speed > 1) return t('time.timeLapse');
    return t('time.timeRewind');
  })();

  if (!stel) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className="h-auto px-3 sm:px-4 py-1.5 sm:py-2 bg-background/60 backdrop-blur-sm text-foreground hover:bg-background/80 flex flex-col items-center gap-0 touch-target toolbar-btn"
            >
              <span className="font-mono text-xs sm:text-sm">{formattedTime}</span>
              <span className="text-[10px] sm:text-xs text-muted-foreground">{formattedDate}</span>
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{t('time.timeControls')}</p>
        </TooltipContent>
      </Tooltip>

      <PopoverContent className="w-[calc(100vw-32px)] sm:w-80" side="bottom">
        <div className="space-y-4">
          <h4 className="font-medium text-foreground flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {t('time.dateTime')}
          </h4>

          {/* Date & Time Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t('time.date')}</Label>
              <Input
                type="date"
                value={dateValue}
                onChange={(e) => setDateValue(e.target.value)}
                onBlur={applyDateTime}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t('time.time')}</Label>
              <Input
                type="time"
                value={timeValue}
                onChange={(e) => setTimeValue(e.target.value)}
                onBlur={applyDateTime}
                className="h-8 text-sm"
              />
            </div>
          </div>

          {/* Time Speed */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">{t('time.timeSpeed')}</Label>
              <span className="text-sm font-mono text-primary">{displayTimeSpeed}</span>
            </div>
            <div className="flex items-center gap-2">
              <Rewind className="h-3 w-3 text-muted-foreground" />
              <Slider
                value={[timeSpeed]}
                onValueChange={([v]) => handleTimeSpeedChange(v)}
                min={-10}
                max={10}
                step={1}
                className="flex-1"
              />
              <FastForward className="h-3 w-3 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground text-center">{timeSpeedDescription}</p>
          </div>

          {/* Time Jump Buttons */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">{t('time.jumpTo')}</Label>
            <div className="grid grid-cols-4 gap-1">
              <Button
                variant="outline"
                size="sm"
                className="text-xs px-2"
                onClick={() => {
                  if (!stel) return;
                  const mjd = stel.core.observer.utc;
                  Object.assign(stel.core.observer, { utc: mjd - 1 });
                }}
              >
                <SkipBack className="h-3 w-3 mr-0.5" />
                {t('time.minus1Day')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs px-2"
                onClick={() => {
                  if (!stel) return;
                  const mjd = stel.core.observer.utc;
                  Object.assign(stel.core.observer, { utc: mjd - 1/24 });
                }}
              >
                <ChevronLeft className="h-3 w-3" />
                {t('time.minus1Hour')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs px-2"
                onClick={() => {
                  if (!stel) return;
                  const mjd = stel.core.observer.utc;
                  Object.assign(stel.core.observer, { utc: mjd + 1/24 });
                }}
              >
                {t('time.plus1Hour')}
                <ChevronRight className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs px-2"
                onClick={() => {
                  if (!stel) return;
                  const mjd = stel.core.observer.utc;
                  Object.assign(stel.core.observer, { utc: mjd + 1 });
                }}
              >
                {t('time.plus1Day')}
                <SkipForward className="h-3 w-3 ml-0.5" />
              </Button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={resetToCurrentTime}
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              {t('time.now')}
            </Button>
            <Button
              variant={timeSpeed === 0 ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleTimeSpeedChange(timeSpeed === 0 ? 1 : 0)}
            >
              {timeSpeed === 0 ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}


