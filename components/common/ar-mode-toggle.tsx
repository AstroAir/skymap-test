'use client';

import { useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useSettingsStore } from '@/lib/stores';
import { useIsClient } from '@/lib/hooks/use-is-client';
import { cn } from '@/lib/utils';

interface ARModeToggleProps {
  className?: string;
}

interface SavedSettings {
  atmosphereVisible: boolean;
  landscapesVisible: boolean;
  fogVisible: boolean;
  milkyWayVisible: boolean;
  sensorControl: boolean;
}

export function ARModeToggle({ className }: ARModeToggleProps) {
  const t = useTranslations();
  const isClient = useIsClient();
  const stellarium = useSettingsStore((s) => s.stellarium);
  const setStellariumSetting = useSettingsStore((s) => s.setStellariumSetting);

  const savedSettingsRef = useRef<SavedSettings | null>(null);

  const arMode = stellarium.arMode;

  const handleToggle = useCallback(() => {
    if (!arMode) {
      // Save current settings before entering AR
      savedSettingsRef.current = {
        atmosphereVisible: stellarium.atmosphereVisible,
        landscapesVisible: stellarium.landscapesVisible,
        fogVisible: stellarium.fogVisible,
        milkyWayVisible: stellarium.milkyWayVisible,
        sensorControl: stellarium.sensorControl,
      };

      // Enable AR mode + sensor + disable opaque layers
      setStellariumSetting('arMode', true);
      setStellariumSetting('sensorControl', true);
      setStellariumSetting('atmosphereVisible', false);
      setStellariumSetting('landscapesVisible', false);
      setStellariumSetting('fogVisible', false);
      setStellariumSetting('milkyWayVisible', false);
    } else {
      // Exit AR mode
      setStellariumSetting('arMode', false);

      // Restore previous settings
      const saved = savedSettingsRef.current;
      if (saved) {
        setStellariumSetting('atmosphereVisible', saved.atmosphereVisible);
        setStellariumSetting('landscapesVisible', saved.landscapesVisible);
        setStellariumSetting('fogVisible', saved.fogVisible);
        setStellariumSetting('milkyWayVisible', saved.milkyWayVisible);
        // Only restore sensorControl if it was off before AR
        if (!saved.sensorControl) {
          setStellariumSetting('sensorControl', false);
        }
        savedSettingsRef.current = null;
      }
    }
  }, [arMode, stellarium, setStellariumSetting]);

  if (!isClient) return null;

  const tooltipText = arMode
    ? t('settings.arModeDisable')
    : t('settings.arModeEnable');

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={tooltipText}
          data-testid="ar-mode-toggle"
          className={cn(
            'relative h-9 w-9 backdrop-blur-sm transition-colors',
            arMode
              ? 'bg-blue-500/30 text-blue-400 hover:bg-blue-500/40'
              : 'bg-background/60 text-foreground hover:bg-background/80',
            className
          )}
          onClick={handleToggle}
        >
          <Camera className={cn('h-5 w-5', arMode && 'animate-pulse')} />
          {arMode && (
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-blue-500" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>{tooltipText}</p>
      </TooltipContent>
    </Tooltip>
  );
}
