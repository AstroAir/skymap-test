'use client';

import { useState, useRef, useEffect, useMemo, memo } from 'react';
import { useTranslations } from 'next-intl';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { useMountStore } from '@/lib/stores';
import {
  getAltitudeOverTime,
  getTransitTime,
  calculateTargetVisibility,
} from '@/lib/astronomy/astro-utils';
import type { AltitudeChartCompactProps, ChartTooltipPayload } from '@/types/starmap/objects';

// Custom tooltip component for Recharts
function CustomTooltip({ active, payload, altLabel }: { active?: boolean; payload?: Array<{ payload: ChartTooltipPayload }>; altLabel?: string }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-card/95 backdrop-blur-sm border border-border rounded px-2 py-1 text-xs">
        <p className="text-foreground font-mono">{data.time}</p>
        <p className="text-cyan-400">{altLabel}: {data.altitude.toFixed(1)}°</p>
      </div>
    );
  }
  return null;
}

// Compact altitude chart using Recharts with zoom support
export const AltitudeChartCompact = memo(function AltitudeChartCompact({
  ra,
  dec,
}: AltitudeChartCompactProps) {
  const t = useTranslations();
  const profileInfo = useMountStore((state) => state.profileInfo);
  const latitude = profileInfo.AstrometrySettings.Latitude || 0;
  const longitude = profileInfo.AstrometrySettings.Longitude || 0;
  const chartRef = useRef<HTMLDivElement>(null);
  
  // Zoom state: hoursAhead controls the time range
  const [hoursAhead, setHoursAhead] = useState(12);
  const minHours = 2;
  const maxHours = 24;
  
  // Touch gesture state for mobile
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const initialPinchDistanceRef = useRef<number | null>(null);
  const initialHoursRef = useRef<number>(hoursAhead);

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
    
    // Touch handlers for mobile pinch zoom and swipe
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          time: Date.now(),
        };
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialPinchDistanceRef.current = Math.sqrt(dx * dx + dy * dy);
        initialHoursRef.current = hoursAhead;
      }
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && initialPinchDistanceRef.current !== null) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const currentDistance = Math.sqrt(dx * dx + dy * dy);
        const scale = initialPinchDistanceRef.current / currentDistance;
        const newHours = Math.round(initialHoursRef.current * scale);
        setHoursAhead(Math.max(minHours, Math.min(maxHours, newHours)));
      }
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0 && touchStartRef.current) {
        const endX = e.changedTouches[0].clientX;
        const deltaX = endX - touchStartRef.current.x;
        const deltaTime = Date.now() - touchStartRef.current.time;
        
        // Horizontal swipe to adjust time range
        if (Math.abs(deltaX) > 50 && deltaTime < 300) {
          if (deltaX > 0) {
            setHoursAhead(prev => Math.max(minHours, prev - 2));
          } else {
            setHoursAhead(prev => Math.min(maxHours, prev + 2));
          }
        }
        touchStartRef.current = null;
      }
      initialPinchDistanceRef.current = null;
    };
    
    chartEl.addEventListener('wheel', handleWheel, { passive: false });
    chartEl.addEventListener('touchstart', handleTouchStart, { passive: true });
    chartEl.addEventListener('touchmove', handleTouchMove, { passive: false });
    chartEl.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    return () => {
      chartEl.removeEventListener('wheel', handleWheel);
      chartEl.removeEventListener('touchstart', handleTouchStart);
      chartEl.removeEventListener('touchmove', handleTouchMove);
      chartEl.removeEventListener('touchend', handleTouchEnd);
    };
  }, [hoursAhead]);

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
    <div ref={chartRef} className="p-2 cursor-ns-resize touch-pan-y select-none" title={t('chart.zoomHint')}>
      {/* Zoom indicator with larger touch targets */}
      <div className="flex items-center justify-between mb-2 transition-opacity duration-200">
        <span className="text-[10px] sm:text-[9px] text-muted-foreground transition-all duration-300">
          {t('chart.timeRange')}: <span className="font-mono font-medium text-foreground">{hoursAhead}h</span>
        </span>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost"
            size="icon"
            className="h-7 w-7 sm:h-5 sm:w-5 text-muted-foreground hover:text-foreground touch-target"
            onClick={() => setHoursAhead(prev => Math.max(minHours, prev - 2))}
          >
            <span className="text-sm sm:text-xs">−</span>
          </Button>
          <Button 
            variant="ghost"
            size="icon"
            className="h-7 w-7 sm:h-5 sm:w-5 text-muted-foreground hover:text-foreground touch-target"
            onClick={() => setHoursAhead(prev => Math.min(maxHours, prev + 2))}
          >
            <span className="text-sm sm:text-xs">+</span>
          </Button>
        </div>
      </div>
      {/* Chart - taller on mobile for better touch interaction */}
      <div className="transition-all duration-300 ease-out h-[120px] sm:h-[100px]">
        <ResponsiveContainer width="100%" height="100%">
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
          
          <RechartsTooltip content={<CustomTooltip altLabel={t('info.altitude')} />} />
          
          <Area
            type="monotone"
            dataKey="altitudeAbove"
            stroke="#06b6d4"
            strokeWidth={2}
            fill="url(#altGradient)"
            animationDuration={500}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
      </div>

      {/* Legend - larger on mobile */}
      <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-2 gap-y-1 mt-2 sm:mt-1 text-[11px] sm:text-[9px] text-muted-foreground">
        <div className="flex items-center gap-1.5 sm:gap-1">
          <div className="w-3 sm:w-2 h-1 sm:h-0.5 bg-amber-400 rounded-full" />
          <span>{t('chart.now')}</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-1">
          <div className="w-3 sm:w-2 h-1 sm:h-0.5 bg-purple-400 rounded-full" />
          <span>{t('time.transit')}</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-1">
          <div className="w-3 sm:w-2 h-1 sm:h-0.5 bg-green-500 rounded-full" />
          <span>{t('time.rise')}</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-1">
          <div className="w-3 sm:w-2 h-1 sm:h-0.5 bg-red-500 rounded-full" />
          <span>{t('time.set')}</span>
        </div>
      </div>
      
      {/* Dark imaging info */}
      {chartData.darkImagingHours > 0 && (
        <div className="mt-2 sm:mt-1 text-[11px] sm:text-[9px] text-green-400 font-medium">
          ✓ {t('chart.darkImagingWindow', { hours: chartData.darkImagingHours.toFixed(1) })}
        </div>
      )}
      
      {/* Mobile hint */}
      <div className="sm:hidden text-[10px] text-muted-foreground/60 mt-1 text-center">
        {t('chart.mobileHint')}
      </div>
    </div>
  );
});
