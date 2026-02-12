'use client';

import { memo } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronUp, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatTimeShort } from '@/lib/astronomy/astro-utils';
import type { TargetVisibility } from '@/lib/core/types';

interface RiseTransitSetGridProps {
  visibility: TargetVisibility;
  /** 'compact' for InfoPanel, 'full' for ObjectDetailDrawer */
  variant?: 'compact' | 'full';
  className?: string;
}

export const RiseTransitSetGrid = memo(function RiseTransitSetGrid({
  visibility,
  variant = 'full',
  className,
}: RiseTransitSetGridProps) {
  const t = useTranslations();

  const isCompact = variant === 'compact';

  const cellClass = isCompact
    ? 'text-center p-1 rounded bg-muted/30'
    : 'text-center p-3 rounded-lg bg-muted/30';

  const labelClass = isCompact
    ? 'text-[10px] text-muted-foreground'
    : 'text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1';

  const valueClass = isCompact
    ? 'font-mono text-foreground'
    : 'font-mono text-sm font-medium';

  return (
    <div className={cn(
      'grid grid-cols-3',
      isCompact ? 'gap-0.5 sm:gap-1 text-xs' : 'gap-2',
      className,
    )}>
      <div className={cellClass}>
        <div className={labelClass}>
          {!isCompact && <ChevronUp className="h-3 w-3" />}
          {t('time.rise')}
        </div>
        <p className={valueClass}>
          {visibility.isCircumpolar ? '∞' : formatTimeShort(visibility.riseTime)}
        </p>
      </div>
      <div className={cellClass}>
        <div className={labelClass}>
          {!isCompact && <Clock className="h-3 w-3" />}
          {t('time.transit')}
        </div>
        <p className={valueClass}>
          {formatTimeShort(visibility.transitTime)}
        </p>
      </div>
      <div className={cellClass}>
        <div className={labelClass}>
          {!isCompact && <ChevronUp className="h-3 w-3 rotate-180" />}
          {t('time.set')}
        </div>
        <p className={valueClass}>
          {visibility.isCircumpolar ? '∞' : formatTimeShort(visibility.setTime)}
        </p>
      </div>
    </div>
  );
});
