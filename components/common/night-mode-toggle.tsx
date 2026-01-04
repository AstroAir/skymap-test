'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { MoonStar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useSettingsStore } from '@/lib/stores';
import { cn } from '@/lib/utils';

interface NightModeToggleProps {
  className?: string;
}

export function NightModeToggle({ className }: NightModeToggleProps) {
  const t = useTranslations();
  const nightMode = useSettingsStore((state) => state.stellarium.nightMode);
  const toggleStellariumSetting = useSettingsStore((state) => state.toggleStellariumSetting);

  // Apply night mode class to document
  useEffect(() => {
    if (nightMode) {
      document.documentElement.classList.add('night-mode');
    } else {
      document.documentElement.classList.remove('night-mode');
    }
  }, [nightMode]);

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-10 w-10 backdrop-blur-sm transition-colors',
              nightMode
                ? 'bg-red-900/50 text-red-400 hover:bg-red-900/70'
                : 'bg-background/60 text-foreground hover:bg-background/80',
              className
            )}
            onClick={() => toggleStellariumSetting('nightMode')}
          >
            <MoonStar className={cn('h-5 w-5', nightMode && 'fill-current')} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{t('settings.nightMode')}</p>
        </TooltipContent>
      </Tooltip>
      
      {/* Night mode filter overlay */}
      {nightMode && <div className="night-mode-filter" />}
    </>
  );
}
