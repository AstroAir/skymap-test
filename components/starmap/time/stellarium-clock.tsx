'use client';

import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useTranslations } from 'next-intl';
import { useStellariumStore, useSettingsStore, useMountStore } from '@/lib/stores';
import { mjdToUTC, utcToMJD, formatDateForInput, formatTimeForInput } from '@/lib/astronomy/starmap-utils';
import { Clock, Play, Pause, RotateCcw, FastForward, Rewind, SkipBack, SkipForward, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
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
import { cn } from '@/lib/utils';
import { createLogger } from '@/lib/logger';

const logger = createLogger('stellarium-clock');

// Time jump offsets in MJD (days)
const TIME_JUMPS = [
  { key: 'minus1Week', offset: -7, icon: ChevronsLeft },
  { key: 'minus1Day', offset: -1, icon: SkipBack },
  { key: 'minus1Hour', offset: -1/24, icon: ChevronLeft },
  { key: 'minus1Min', offset: -1/1440, icon: ChevronLeft },
  { key: 'plus1Min', offset: 1/1440, icon: ChevronRight },
  { key: 'plus1Hour', offset: 1/24, icon: ChevronRight },
  { key: 'plus1Day', offset: 1, icon: SkipForward },
  { key: 'plus1Week', offset: 7, icon: ChevronsRight },
] as const;

// Convert engine time_speed to slider exponent value (log2)
function speedToSlider(speed: number): number {
  if (speed <= 0) return -10;
  const log = Math.log2(speed);
  return Math.max(-10, Math.min(10, Math.round(log)));
}

// Format actual engine speed for display
function formatSpeed(speed: number): string {
  if (speed === 0) return '0×';
  if (speed === 1) return '1×';
  if (speed >= 1) return `${speed}×`;
  // For fractional speeds: 1/2×, 1/4×, etc.
  const inverse = Math.round(1 / speed);
  return `1/${inverse}×`;
}

// Calculate LST from MJD and longitude
function calculateLST(mjd: number, longitude: number): string {
  const jd = mjd;
  const T = (jd - 2451545.0) / 36525.0;
  let gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T;
  gmst = ((gmst % 360) + 360) % 360;
  let lstDeg = gmst + longitude;
  lstDeg = ((lstDeg % 360) + 360) % 360;
  const lstHours = lstDeg / 15;
  const h = Math.floor(lstHours);
  const m = Math.floor((lstHours - h) * 60);
  const s = Math.floor(((lstHours - h) * 60 - m) * 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export const StellariumClock = memo(function StellariumClock() {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [formattedTime, setFormattedTime] = useState('');
  const [formattedDate, setFormattedDate] = useState('');
  const [utcTime, setUtcTime] = useState('');
  const [lstTime, setLstTime] = useState('');
  const [dateValue, setDateValue] = useState(formatDateForInput(new Date()));
  const [timeValue, setTimeValue] = useState(formatTimeForInput(new Date()));
  
  // Read actual speed from engine - this is the source of truth
  const [engineSpeed, setEngineSpeed] = useState(1);
  // Track saved speed for pause/resume
  const savedSpeedRef = useRef(1);
  
  const stel = useStellariumStore((state) => state.stel);
  const timeFormat = useSettingsStore((state) => state.preferences.timeFormat);
  const dateFormat = useSettingsStore((state) => state.preferences.dateFormat);
  const longitude = useMountStore((state) => state.profileInfo.AstrometrySettings.Longitude) || 0;

  // Format date/time from Stellarium respecting user preferences
  const formatDateTime = useCallback((date: Date) => {
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: timeFormat === '12h',
    };
    setFormattedTime(date.toLocaleString(undefined, timeOptions));

    let dateLocale: string | undefined;
    const dateOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    };
    
    // Apply date format preference
    switch (dateFormat) {
      case 'us':
        dateLocale = 'en-US';
        break;
      case 'eu':
        dateLocale = 'en-GB';
        break;
      case 'iso':
      default:
        dateLocale = 'sv-SE'; // ISO 8601 format (YYYY-MM-DD)
        break;
    }
    setFormattedDate(date.toLocaleString(dateLocale, dateOptions));

    // UTC time
    const utcOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'UTC',
    };
    setUtcTime(date.toLocaleString(undefined, utcOptions));
  }, [timeFormat, dateFormat]);

  // Update time display using setInterval (efficient: 1s for real-time, faster when accelerated)
  useEffect(() => {
    if (!stel) return;

    const updateTime = () => {
      const mjd = stel.core.observer.utc;
      const date = mjdToUTC(mjd);
      formatDateTime(date);
      
      // Sync engine speed to local state
      const currentSpeed = stel.core.time_speed;
      setEngineSpeed(currentSpeed);
      
      // Calculate LST
      try {
        setLstTime(calculateLST(mjd, longitude));
      } catch {
        // Ignore LST calculation errors
      }
    };

    updateTime();
    
    // Dynamic interval: faster when time is accelerated, slower when paused
    const getInterval = () => {
      const speed = Math.abs(stel.core.time_speed);
      if (speed === 0) return 2000; // Paused: slow poll to detect resume
      if (speed <= 1) return 1000;  // Real-time or slower
      if (speed <= 64) return 250;  // Moderate acceleration
      return 100;                    // Fast acceleration
    };
    
    const intervalId = setInterval(updateTime, getInterval());
    return () => clearInterval(intervalId);
  }, [stel, formatDateTime, longitude]);

  // Sync popover inputs when opening
  const handleOpenChange = useCallback((isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && stel) {
      const mjd = stel.core.observer.utc;
      const stelDate = mjdToUTC(mjd);
      setDateValue(formatDateForInput(stelDate));
      setTimeValue(formatTimeForInput(stelDate));
    }
  }, [stel]);

  // Apply date/time to Stellarium
  const applyDateTime = useCallback(() => {
    if (!stel) return;

    try {
      const [year, month, day] = dateValue.split('-').map(Number);
      const timeParts = timeValue.split(':').map(Number);
      const hours = timeParts[0] || 0;
      const minutes = timeParts[1] || 0;
      const seconds = timeParts[2] || 0;
      const dateObj = new Date(year, month - 1, day, hours, minutes, seconds, 0);
      const mjd = utcToMJD(dateObj);
      
      // Use Object.assign to avoid eslint react-compiler issue
      Object.assign(stel.core.observer, { utc: mjd });
    } catch (error) {
      logger.error('Error setting date/time', error);
    }
  }, [stel, dateValue, timeValue]);

  // Jump time by offset (in MJD days)
  const jumpTime = useCallback((offsetDays: number) => {
    if (!stel) return;
    const mjd = stel.core.observer.utc;
    Object.assign(stel.core.observer, { utc: mjd + offsetDays });
  }, [stel]);

  // Reset to current time and real-time speed
  const resetToCurrentTime = useCallback(() => {
    const now = new Date();
    setDateValue(formatDateForInput(now));
    setTimeValue(formatTimeForInput(now));
    
    if (stel) {
      const mjd = utcToMJD(now);
      Object.assign(stel.core.observer, { utc: mjd });
      Object.assign(stel.core, { time_speed: 1 });
    }
  }, [stel]);

  // Update time speed via slider (exponential: 2^value)
  const handleTimeSpeedChange = useCallback((sliderValue: number) => {
    if (stel) {
      const speed = Math.pow(2, sliderValue);
      Object.assign(stel.core, { time_speed: speed });
    }
  }, [stel]);

  // Toggle pause/play using engine speed as source of truth
  const togglePause = useCallback(() => {
    if (!stel) return;
    const currentSpeed = stel.core.time_speed;
    if (currentSpeed === 0) {
      // Resume to saved speed (default to 1× if no saved speed)
      const resumeSpeed = savedSpeedRef.current || 1;
      Object.assign(stel.core, { time_speed: resumeSpeed });
    } else {
      // Save current speed and pause
      savedSpeedRef.current = currentSpeed;
      Object.assign(stel.core, { time_speed: 0 });
    }
  }, [stel]);

  // Derive display values from engine speed
  const isPaused = engineSpeed === 0;
  const isRealTime = engineSpeed === 1;
  const sliderValue = speedToSlider(engineSpeed);
  const displayTimeSpeed = formatSpeed(engineSpeed);

  const timeSpeedDescription = (() => {
    if (isPaused) return t('time.paused');
    if (isRealTime) return t('time.realTime');
    if (engineSpeed > 1) return t('time.timeLapse');
    if (engineSpeed < 1 && engineSpeed > 0) return t('time.timeRewind');
    return t('time.realTime');
  })();

  if (!stel) return null;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              aria-label={t('time.timeControls')}
              className={cn(
                "h-auto px-3 sm:px-4 py-1.5 sm:py-2 bg-background/60 backdrop-blur-sm text-foreground hover:bg-background/80 flex flex-col items-center gap-0 touch-target toolbar-btn relative",
                isPaused && "opacity-70",
                !isRealTime && !isPaused && "ring-1 ring-primary/40"
              )}
            >
              <span className="font-mono text-xs sm:text-sm">{formattedTime}</span>
              <span className="text-[10px] sm:text-xs text-muted-foreground">{formattedDate}</span>
              {/* Speed indicator badge */}
              {!isRealTime && (
                <Badge
                  variant={isPaused ? 'secondary' : 'default'}
                  className="absolute -top-1 -right-1 h-4 px-1 text-[9px] font-mono leading-none"
                >
                  {isPaused ? '⏸' : displayTimeSpeed}
                </Badge>
              )}
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

          {/* Time Info Display: UTC + LST */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center justify-between bg-muted/50 rounded px-2 py-1">
              <span className="text-muted-foreground">{t('time.utc')}</span>
              <span className="font-mono text-foreground">{utcTime}</span>
            </div>
            <div className="flex items-center justify-between bg-muted/50 rounded px-2 py-1">
              <span className="text-muted-foreground">{t('time.lst')}</span>
              <span className="font-mono text-foreground">{lstTime}</span>
            </div>
          </div>

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
                aria-label={t('time.date')}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t('time.time')}</Label>
              <Input
                type="time"
                step="1"
                value={timeValue}
                onChange={(e) => setTimeValue(e.target.value)}
                onBlur={applyDateTime}
                className="h-8 text-sm"
                aria-label={t('time.time')}
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
                value={[sliderValue]}
                onValueChange={([v]) => handleTimeSpeedChange(v)}
                min={-10}
                max={10}
                step={1}
                className="flex-1"
                aria-label={t('time.timeSpeed')}
              />
              <FastForward className="h-3 w-3 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground text-center">{timeSpeedDescription}</p>
          </div>

          {/* Time Jump Buttons */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">{t('time.jumpTo')}</Label>
            <div className="grid grid-cols-4 gap-1">
              {TIME_JUMPS.map(({ key, offset, icon: Icon }) => (
                <Button
                  key={key}
                  variant="outline"
                  size="sm"
                  className="text-xs px-1.5"
                  onClick={() => jumpTime(offset)}
                >
                  {offset < 0 && <Icon className="h-3 w-3 mr-0.5 shrink-0" />}
                  {t(`time.${key}`)}
                  {offset > 0 && <Icon className="h-3 w-3 ml-0.5 shrink-0" />}
                </Button>
              ))}
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
              variant={isPaused ? 'default' : 'outline'}
              size="sm"
              onClick={togglePause}
              aria-label={isPaused ? t('time.play') : t('time.pause')}
            >
              {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
});
StellariumClock.displayName = 'StellariumClock';
