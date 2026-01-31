'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

import { useMountStore } from '@/lib/stores';
import { 
  getAltitudeOverTime, 
  getTransitTime,
  calculateTargetVisibility,
} from '@/lib/astronomy/astro-utils';

interface AltitudeChartProps {
  ra: number;
  dec: number;
  name?: string;
  hoursAhead?: number;
}

export function AltitudeChart({
  ra,
  dec,
  name,
  hoursAhead = 12,
}: AltitudeChartProps) {
  const t = useTranslations();
  const displayName = name || t('astroCalc.defaultTarget');
  const profileInfo = useMountStore((state) => state.profileInfo);
  const latitude = profileInfo.AstrometrySettings.Latitude || 0;
  const longitude = profileInfo.AstrometrySettings.Longitude || 0;

  const chartData = useMemo(() => {
    const data = getAltitudeOverTime(ra, dec, latitude, longitude, hoursAhead, 30);
    const transit = getTransitTime(ra, longitude);
    const visibility = calculateTargetVisibility(ra, dec, latitude, longitude, 30);
    
    // Find max altitude point
    let maxAlt = -90;
    let maxAltHour = 0;
    data.forEach((point) => {
      if (point.altitude > maxAlt) {
        maxAlt = point.altitude;
        maxAltHour = point.hour;
      }
    });

    // Get current time for calculations
    const now = new Date();

    // Find rise and set hours relative to now
    let riseHour: number | null = null;
    let setHour: number | null = null;
    
    if (visibility.riseTime) {
      const riseMs = visibility.riseTime.getTime() - now.getTime();
      if (riseMs > 0 && riseMs < hoursAhead * 3600000) {
        riseHour = riseMs / 3600000;
      }
    }
    if (visibility.setTime) {
      const setMs = visibility.setTime.getTime() - now.getTime();
      if (setMs > 0 && setMs < hoursAhead * 3600000) {
        setHour = setMs / 3600000;
      }
    }
    
    return { 
      points: data, 
      maxAlt, 
      maxAltHour, 
      transitIn: transit.hoursUntilTransit,
      visibility,
      riseHour,
      setHour,
    };
  }, [ra, dec, latitude, longitude, hoursAhead]);

  // Chart dimensions
  const width = 280;
  const height = 120;
  const padding = { top: 10, right: 10, bottom: 25, left: 35 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Scale functions
  const xScale = (hour: number) => padding.left + (hour / hoursAhead) * chartWidth;
  const yScale = (alt: number) => padding.top + chartHeight - ((alt + 10) / 100) * chartHeight;

  // Generate path
  const pathD = useMemo(() => {
    const xS = (hour: number) => padding.left + (hour / hoursAhead) * chartWidth;
    const yS = (alt: number) => padding.top + chartHeight - ((alt + 10) / 100) * chartHeight;
    const points = chartData.points;
    if (points.length === 0) return '';
    
    let d = `M ${xS(points[0].hour)} ${yS(points[0].altitude)}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${xS(points[i].hour)} ${yS(points[i].altitude)}`;
    }
    return d;
  }, [chartData.points, hoursAhead, chartWidth, chartHeight, padding.left, padding.top]);

  // Generate area fill path
  const areaD = useMemo(() => {
    const xS = (hour: number) => padding.left + (hour / hoursAhead) * chartWidth;
    const yS = (alt: number) => padding.top + chartHeight - ((alt + 10) / 100) * chartHeight;
    const points = chartData.points;
    if (points.length === 0) return '';
    
    let d = `M ${xS(points[0].hour)} ${yS(0)}`;
    d += ` L ${xS(points[0].hour)} ${yS(Math.max(0, points[0].altitude))}`;
    
    for (let i = 1; i < points.length; i++) {
      d += ` L ${xS(points[i].hour)} ${yS(Math.max(0, points[i].altitude))}`;
    }
    
    d += ` L ${xS(points[points.length - 1].hour)} ${yS(0)}`;
    d += ' Z';
    return d;
  }, [chartData.points, hoursAhead, chartWidth, chartHeight, padding.left, padding.top]);

  // Current time marker
  const nowX = xScale(0);

  // Transit time marker
  const transitX = chartData.transitIn <= hoursAhead ? xScale(chartData.transitIn) : null;

  return (
    <Card className="bg-card/95 border-border">
      <CardHeader className="pb-1 pt-2 px-3">
        <CardTitle className="text-xs flex items-center gap-1.5 text-primary">
          <TrendingUp className="h-3 w-3" />
          {t('chart.altitudeTarget')} ({displayName})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <svg width={width} height={height} className="overflow-visible">
          {/* Grid lines */}
          <g className="text-border">
            {/* Horizontal grid lines at 0°, 30°, 60°, 90° */}
            {[0, 30, 60, 90].map((alt) => (
              <g key={alt}>
                <line
                  x1={padding.left}
                  y1={yScale(alt)}
                  x2={width - padding.right}
                  y2={yScale(alt)}
                  stroke="currentColor"
                  strokeWidth={alt === 0 ? 1 : 0.5}
                  strokeDasharray={alt === 0 ? 'none' : '2,2'}
                />
                <text
                  x={padding.left - 4}
                  y={yScale(alt)}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="text-[9px] fill-muted-foreground"
                >
                  {alt}°
                </text>
              </g>
            ))}
            
            {/* Vertical grid lines every 3 hours */}
            {Array.from({ length: Math.ceil(hoursAhead / 3) + 1 }, (_, i) => i * 3).map((hour) => (
              <g key={hour}>
                <line
                  x1={xScale(hour)}
                  y1={padding.top}
                  x2={xScale(hour)}
                  y2={height - padding.bottom}
                  stroke="currentColor"
                  strokeWidth={0.5}
                  strokeDasharray="2,2"
                />
                <text
                  x={xScale(hour)}
                  y={height - padding.bottom + 12}
                  textAnchor="middle"
                  className="text-[9px] fill-muted-foreground"
                >
                  +{hour}h
                </text>
              </g>
            ))}
          </g>

          {/* 30° imaging threshold line */}
          <line
            x1={padding.left}
            y1={yScale(30)}
            x2={width - padding.right}
            y2={yScale(30)}
            stroke="#22c55e"
            strokeWidth={1}
            strokeDasharray="4,2"
            opacity={0.5}
          />

          {/* Area fill for above horizon */}
          <path
            d={areaD}
            fill="url(#altitudeGradient)"
            opacity={0.3}
          />

          {/* Altitude curve */}
          <path
            d={pathD}
            fill="none"
            stroke="#06b6d4"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Current time marker */}
          <line
            x1={nowX}
            y1={padding.top}
            x2={nowX}
            y2={height - padding.bottom}
            stroke="#f59e0b"
            strokeWidth={1.5}
          />
          <text
            x={nowX}
            y={padding.top - 2}
            textAnchor="middle"
            className="text-[8px] fill-amber-400 font-medium"
          >
            {t('chart.now')}
          </text>

          {/* Transit marker */}
          {transitX && (
            <>
              <line
                x1={transitX}
                y1={padding.top}
                x2={transitX}
                y2={height - padding.bottom}
                stroke="#a855f7"
                strokeWidth={1}
                strokeDasharray="3,2"
              />
              <circle
                cx={transitX}
                cy={yScale(chartData.maxAlt)}
                r={3}
                fill="#a855f7"
              />
              <text
                x={transitX}
                y={yScale(chartData.maxAlt) - 6}
                textAnchor="middle"
                className="text-[8px] fill-purple-400"
              >
                {chartData.maxAlt.toFixed(0)}°
              </text>
            </>
          )}

          {/* Rise marker */}
          {chartData.riseHour !== null && (
            <>
              <line
                x1={xScale(chartData.riseHour)}
                y1={padding.top}
                x2={xScale(chartData.riseHour)}
                y2={height - padding.bottom}
                stroke="#22c55e"
                strokeWidth={1}
                strokeDasharray="2,2"
              />
              <text
                x={xScale(chartData.riseHour)}
                y={padding.top - 2}
                textAnchor="middle"
                className="text-[7px] fill-green-500"
              >
                ↑
              </text>
            </>
          )}
          
          {/* Set marker */}
          {chartData.setHour !== null && (
            <>
              <line
                x1={xScale(chartData.setHour)}
                y1={padding.top}
                x2={xScale(chartData.setHour)}
                y2={height - padding.bottom}
                stroke="#ef4444"
                strokeWidth={1}
                strokeDasharray="2,2"
              />
              <text
                x={xScale(chartData.setHour)}
                y={padding.top - 2}
                textAnchor="middle"
                className="text-[7px] fill-red-500"
              >
                ↓
              </text>
            </>
          )}

          {/* Imaging window highlight (above 30° during dark time) */}
          {chartData.visibility.darkImagingHours > 0 && chartData.visibility.darkImagingStart && chartData.visibility.darkImagingEnd && (() => {
            const now = new Date();
            const startMs = chartData.visibility.darkImagingStart.getTime() - now.getTime();
            const endMs = chartData.visibility.darkImagingEnd.getTime() - now.getTime();
            const startHour = Math.max(0, startMs / 3600000);
            const endHour = Math.min(hoursAhead, endMs / 3600000);
            
            if (endHour > startHour && startHour < hoursAhead) {
              return (
                <rect
                  x={xScale(startHour)}
                  y={yScale(90)}
                  width={xScale(endHour) - xScale(startHour)}
                  height={yScale(30) - yScale(90)}
                  fill="#22c55e"
                  opacity={0.1}
                />
              );
            }
            return null;
          })()}

          {/* Gradient definition */}
          <defs>
            <linearGradient id="altitudeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.1" />
            </linearGradient>
          </defs>
        </svg>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[9px] text-muted-foreground px-1">
          <div className="flex items-center gap-1">
            <div className="w-2 h-0.5 bg-amber-400" />
            <span>{t('chart.now')}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-0.5 bg-purple-400" />
            <span>{t('chart.transit')}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-0.5 bg-green-500" />
            <span>{t('chart.rise')}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-0.5 bg-red-500" />
            <span>{t('chart.set')}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500/20 border border-green-500/50" />
            <span>{t('chart.window')}</span>
          </div>
        </div>

        {/* Dark imaging time summary */}
        {chartData.visibility.darkImagingHours > 0 && (
          <div className="mt-1 text-[9px] text-green-400 px-1">
            ✓ {chartData.visibility.darkImagingHours.toFixed(1)}h {t('chart.darkImagingAvailable')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


