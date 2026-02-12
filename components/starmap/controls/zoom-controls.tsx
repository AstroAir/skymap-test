'use client';

import { memo } from 'react';
import { useTranslations } from 'next-intl';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { MIN_FOV, MAX_FOV } from '@/lib/core/constants/fov';
import { fovToSlider as fovToSliderUtil, sliderToFov as sliderToFovUtil } from '@/lib/astronomy/fov-utils';
import type { ZoomControlsProps } from '@/types/starmap/controls';

export const ZoomControls = memo(function ZoomControls({ fov, onZoomIn, onZoomOut, onFovChange }: ZoomControlsProps) {
  const t = useTranslations();
  // Convert FOV to slider value (logarithmic scale, extracted to lib/astronomy/fov-utils)
  const sliderValue = fovToSliderUtil(fov, MIN_FOV, MAX_FOV);

  return (
    <TooltipProvider>
      <div className="flex flex-col items-center gap-1.5 sm:gap-2 bg-background/80 backdrop-blur-sm rounded-lg p-1.5 sm:p-2 border border-border" role="group" aria-label={t('zoom.zoomControls')}>
        {/* Zoom In Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 sm:h-8 sm:w-8 text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30 touch-target toolbar-btn"
              onClick={onZoomIn}
              disabled={fov <= MIN_FOV}
              aria-label={t('zoom.zoomIn')}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>{t('zoom.zoomIn')}</p>
          </TooltipContent>
        </Tooltip>

        {/* Vertical Slider */}
        <div className="h-24 sm:h-32 flex items-center">
          <Slider
            orientation="vertical"
            value={[100 - sliderValue]}
            onValueChange={([v]) => onFovChange(sliderToFovUtil(100 - v, MIN_FOV, MAX_FOV))}
            max={100}
            step={1}
            className="h-full"
            aria-label={t('zoom.fovSlider')}
            aria-valuemin={MIN_FOV}
            aria-valuemax={MAX_FOV}
            aria-valuenow={Math.round(fov * 10) / 10}
          />
        </div>

        {/* Zoom Out Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 sm:h-8 sm:w-8 text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30 touch-target toolbar-btn"
              onClick={onZoomOut}
              disabled={fov >= MAX_FOV}
              aria-label={t('zoom.zoomOut')}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>{t('zoom.zoomOut')}</p>
          </TooltipContent>
        </Tooltip>

        {/* FOV Display */}
        <div className="text-[10px] sm:text-xs text-muted-foreground text-center font-mono" aria-live="polite" aria-atomic="true">
          {fov < 1 ? fov.toFixed(2) : fov.toFixed(1)}°
        </div>
      </div>
    </TooltipProvider>
  );
});
ZoomControls.displayName = 'ZoomControls';
