'use client';

import { useTranslations } from 'next-intl';
import { degreesToHMS, degreesToDMS } from '@/lib/astronomy/starmap-utils';
import { useMountOverlay } from '@/lib/hooks/use-mount-overlay';
import { Telescope, RefreshCw, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { StellariumMountProps } from '@/types/starmap/mount';

function MountPanel({ compact }: StellariumMountProps) {
  const t = useTranslations();
  const {
    connected,
    raDegree,
    decDegree,
    effectiveAutoSync,
    toggleAutoSync,
    syncViewToMount,
    altAz,
  } = useMountOverlay();

  // Disconnected state
  if (!connected) {
    if (compact) return null;
    return (
      <div className="flex flex-col gap-1 bg-black/80 backdrop-blur-sm rounded-lg p-2 border border-border">
        <div className="text-center px-2">
          <div className="flex items-center justify-center gap-1 text-muted-foreground">
            <WifiOff className="h-3 w-3" />
            <span className="text-xs font-medium">{t('mount.disconnected')}</span>
          </div>
        </div>
      </div>
    );
  }

  // Format coordinates for display
  const raDisplay = degreesToHMS(((raDegree % 360) + 360) % 360);
  const decDisplay = degreesToDMS(decDegree);

  const panel = (
    <div className="flex flex-col gap-2 bg-black/80 backdrop-blur-sm rounded-lg p-2 border border-border">
      {/* Mount Position Display */}
      <div className="text-center px-2">
        <div className="flex items-center justify-center gap-1 text-green-400 mb-1">
          <Telescope className="h-3 w-3" />
          <span className="text-xs font-medium">{t('mount.mount')}</span>
          <span className="text-[9px] text-muted-foreground ml-0.5">J2000</span>
        </div>
        <p className="text-xs font-mono text-foreground">{raDisplay}</p>
        <p className="text-xs font-mono text-foreground">{decDisplay}</p>
        {altAz && (
          <div className="mt-1 pt-1 border-t border-border/50">
            <p className="text-[10px] font-mono text-muted-foreground">
              {t('mount.altitude')}: {degreesToDMS(altAz.alt)}
            </p>
            <p className="text-[10px] font-mono text-muted-foreground">
              {t('mount.azimuth')}: {degreesToDMS(altAz.az)}
            </p>
          </div>
        )}
      </div>

      {/* Sync View Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent"
            onClick={syncViewToMount}
          >
            <Telescope className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>{t('mount.goToMountPosition')}</p>
        </TooltipContent>
      </Tooltip>

      {/* Auto-Sync Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 ${effectiveAutoSync ? 'text-primary bg-primary/20' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}
            onClick={toggleAutoSync}
          >
            <RefreshCw className={`h-4 w-4 ${effectiveAutoSync ? 'animate-spin' : ''}`} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>{effectiveAutoSync ? t('mount.disableAutoSync') : t('mount.enableAutoSync')}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );

  // Compact mode: popover trigger for mobile
  if (compact) {
    return (
      <Popover>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-green-400 hover:text-green-300 hover:bg-accent"
              >
                <Telescope className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>{t('mount.mount')}</p>
          </TooltipContent>
        </Tooltip>
        <PopoverContent side="top" align="center" className="w-auto p-0">
          {panel}
        </PopoverContent>
      </Popover>
    );
  }

  return panel;
}

export { MountPanel as StellariumMount };
