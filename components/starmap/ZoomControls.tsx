'use client';

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

interface ZoomControlsProps {
  fov: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFovChange: (fov: number) => void;
}

// FOV limits - must match StellariumCanvas
const MIN_FOV = 0.5;
const MAX_FOV = 180;

export function ZoomControls({ fov, onZoomIn, onZoomOut, onFovChange }: ZoomControlsProps) {
  const t = useTranslations();
  // Convert FOV to slider value (logarithmic scale for better UX)
  const fovToSlider = (f: number) => {
    // Map MIN_FOV-MAX_FOV to 0-100 using log scale
    const minLog = Math.log(MIN_FOV);
    const maxLog = Math.log(MAX_FOV);
    const clampedF = Math.max(MIN_FOV, Math.min(MAX_FOV, f));
    return ((Math.log(clampedF) - minLog) / (maxLog - minLog)) * 100;
  };

  const sliderToFov = (v: number) => {
    const minLog = Math.log(MIN_FOV);
    const maxLog = Math.log(MAX_FOV);
    return Math.exp(minLog + (v / 100) * (maxLog - minLog));
  };

  const sliderValue = fovToSlider(fov);

  return (
    <TooltipProvider>
      <div className="flex flex-col items-center gap-2 bg-background/80 backdrop-blur-sm rounded-lg p-2 border border-border">
        {/* Zoom In Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30"
              onClick={onZoomIn}
              disabled={fov <= MIN_FOV}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>{t('zoom.zoomIn')}</p>
          </TooltipContent>
        </Tooltip>

        {/* Vertical Slider */}
        <div className="h-32 flex items-center">
          <Slider
            orientation="vertical"
            value={[100 - sliderValue]}
            onValueChange={([v]) => onFovChange(sliderToFov(100 - v))}
            max={100}
            step={1}
            className="h-full"
          />
        </div>

        {/* Zoom Out Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30"
              onClick={onZoomOut}
              disabled={fov >= MAX_FOV}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>{t('zoom.zoomOut')}</p>
          </TooltipContent>
        </Tooltip>

        {/* FOV Display */}
        <div className="text-xs text-muted-foreground text-center">
          {fov < 1 ? fov.toFixed(2) : fov.toFixed(1)}°
        </div>
      </div>
    </TooltipProvider>
  );
}
