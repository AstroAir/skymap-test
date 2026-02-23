'use client';

import { useMemo, memo } from 'react';
import { useTranslations } from 'next-intl';
import { useStellariumStore } from '@/lib/stores';
import { rad2deg } from '@/lib/astronomy/starmap-utils';
import { cn } from '@/lib/utils';

interface ARCompassOverlayProps {
  enabled: boolean;
}

const COMPASS_POINTS = [
  { key: 'N', deg: 0 },
  { key: 'NE', deg: 45 },
  { key: 'E', deg: 90 },
  { key: 'SE', deg: 135 },
  { key: 'S', deg: 180 },
  { key: 'SW', deg: 225 },
  { key: 'W', deg: 270 },
  { key: 'NW', deg: 315 },
] as const;

const TICK_INTERVAL = 10;
const COMPASS_WIDTH_DEG = 120;

function normalizeAz(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

export const ARCompassOverlay = memo(function ARCompassOverlay({ enabled }: ARCompassOverlayProps) {
  const t = useTranslations();
  const viewDirection = useStellariumStore((s) => s.viewDirection);

  const azDeg = useMemo(() => {
    if (!viewDirection) return 0;
    return normalizeAz(rad2deg(viewDirection.az));
  }, [viewDirection]);

  const altDeg = useMemo(() => {
    if (!viewDirection) return 0;
    const alt = rad2deg(viewDirection.alt);
    return Number.isFinite(alt) ? alt : 0;
  }, [viewDirection]);

  const compassLabels = useMemo(() => {
    const labels: Array<{ key: string; label: string; offset: number }> = [];
    const halfWidth = COMPASS_WIDTH_DEG / 2;

    for (const point of COMPASS_POINTS) {
      let diff = point.deg - azDeg;
      if (diff > 180) diff -= 360;
      if (diff < -180) diff += 360;

      if (Math.abs(diff) <= halfWidth) {
        const isCardinal = point.key.length === 1;
        labels.push({
          key: point.key,
          label: isCardinal ? t(`compass.${point.key.toLowerCase()}`) : point.key,
          offset: (diff / COMPASS_WIDTH_DEG) * 100 + 50,
        });
      }
    }
    return labels;
  }, [azDeg, t]);

  const ticks = useMemo(() => {
    const result: Array<{ deg: number; offset: number; isMain: boolean }> = [];
    const halfWidth = COMPASS_WIDTH_DEG / 2;

    for (let d = 0; d < 360; d += TICK_INTERVAL) {
      let diff = d - azDeg;
      if (diff > 180) diff -= 360;
      if (diff < -180) diff += 360;

      if (Math.abs(diff) <= halfWidth) {
        result.push({
          deg: d,
          offset: (diff / COMPASS_WIDTH_DEG) * 100 + 50,
          isMain: d % 30 === 0,
        });
      }
    }
    return result;
  }, [azDeg]);

  if (!enabled) return null;

  return (
    <div className="absolute top-12 left-0 right-0 z-20 pointer-events-none flex flex-col items-center" data-testid="ar-compass-overlay">
      {/* Compass bar */}
      <div className="relative w-64 sm:w-80 h-8 bg-black/30 backdrop-blur-sm rounded-lg overflow-hidden border border-white/10">
        {/* Center indicator */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/60 -translate-x-1/2 z-10" />
        <div className="absolute left-1/2 top-0 w-0 h-0 -translate-x-1/2 z-10 border-l-[4px] border-r-[4px] border-t-[5px] border-l-transparent border-r-transparent border-t-white/70" />

        {/* Tick marks */}
        {ticks.map((tick) => (
          <div
            key={tick.deg}
            className={cn(
              'absolute top-0',
              tick.isMain ? 'h-3 w-px bg-white/40' : 'h-2 w-px bg-white/20'
            )}
            style={{ left: `${tick.offset}%` }}
          />
        ))}

        {/* Direction labels */}
        {compassLabels.map((label) => (
          <span
            key={label.key}
            className={cn(
              'absolute bottom-0.5 text-[10px] font-bold -translate-x-1/2',
              label.key.length === 1 ? 'text-white/90' : 'text-white/50'
            )}
            style={{ left: `${label.offset}%` }}
          >
            {label.label}
          </span>
        ))}
      </div>

      {/* Numeric readout */}
      <div className="flex items-center gap-3 mt-1 text-[10px] font-mono text-white/70">
        <span>{azDeg.toFixed(1)}°</span>
        <span className={cn(
          altDeg > 30 ? 'text-green-400/70' :
          altDeg > 0 ? 'text-yellow-400/70' : 'text-red-400/70'
        )}>
          Alt {altDeg.toFixed(1)}°
        </span>
      </div>
    </div>
  );
});
ARCompassOverlay.displayName = 'ARCompassOverlay';
