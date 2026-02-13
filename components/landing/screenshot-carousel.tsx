'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from '@/components/ui/carousel';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Map, Calendar, Camera, Settings, Star, Target, Compass } from 'lucide-react';
import { SectionHeader } from './section-header';
import type { ScreenshotItem } from '@/types/landing';

const screenshots: ScreenshotItem[] = [
  { key: 'starmap', icon: Map },
  { key: 'planning', icon: Calendar },
  { key: 'fov', icon: Camera },
  { key: 'settings', icon: Settings },
];

const STARMAP_STARS = [
  { w: 2, t: 12, l: 15, o: 0.8 }, { w: 1, t: 28, l: 42, o: 0.5 }, { w: 3, t: 8, l: 72, o: 0.9 },
  { w: 1, t: 45, l: 88, o: 0.4 }, { w: 2, t: 62, l: 25, o: 0.7 }, { w: 1, t: 78, l: 55, o: 0.3 },
  { w: 2, t: 18, l: 35, o: 0.6 }, { w: 1, t: 55, l: 68, o: 0.5 }, { w: 3, t: 35, l: 12, o: 0.8 },
  { w: 1, t: 72, l: 82, o: 0.4 }, { w: 2, t: 22, l: 58, o: 0.7 }, { w: 1, t: 48, l: 32, o: 0.6 },
  { w: 1, t: 82, l: 45, o: 0.3 }, { w: 2, t: 15, l: 78, o: 0.9 }, { w: 1, t: 38, l: 92, o: 0.5 },
  { w: 2, t: 68, l: 18, o: 0.6 }, { w: 1, t: 52, l: 75, o: 0.4 }, { w: 3, t: 25, l: 48, o: 0.7 },
  { w: 1, t: 85, l: 62, o: 0.3 }, { w: 2, t: 42, l: 8, o: 0.8 },
];

const FOV_STARS = [
  { w: 2, t: 10, l: 20, o: 0.5 }, { w: 1, t: 30, l: 50, o: 0.3 }, { w: 2, t: 55, l: 75, o: 0.6 },
  { w: 1, t: 70, l: 15, o: 0.4 }, { w: 1, t: 20, l: 85, o: 0.5 }, { w: 2, t: 45, l: 35, o: 0.3 },
  { w: 1, t: 80, l: 60, o: 0.4 }, { w: 2, t: 15, l: 45, o: 0.7 }, { w: 1, t: 60, l: 90, o: 0.3 },
  { w: 1, t: 35, l: 10, o: 0.5 }, { w: 2, t: 75, l: 40, o: 0.4 }, { w: 1, t: 50, l: 65, o: 0.6 },
];

function MockStarmapUI() {
  return (
    <div className="w-full h-full bg-gradient-to-b from-[#0a0e27] to-[#1a1e3a] relative overflow-hidden p-4">
      {/* Mock stars */}
      {STARMAP_STARS.map((star, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            width: `${star.w}px`,
            height: `${star.w}px`,
            top: `${star.t}%`,
            left: `${star.l}%`,
            opacity: star.o,
          }}
        />
      ))}
      {/* Mock toolbar */}
      <div className="absolute top-3 right-3 flex flex-col gap-1.5">
        {[Star, Target, Compass].map((Icon, i) => (
          <div key={i} className="w-7 h-7 rounded-md bg-white/10 backdrop-blur flex items-center justify-center">
            <Icon className="h-3.5 w-3.5 text-white/70" />
          </div>
        ))}
      </div>
      {/* Mock info panel */}
      <div className="absolute bottom-3 left-3 right-3 bg-black/40 backdrop-blur-md rounded-lg p-3 border border-white/10">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-2 h-2 rounded-full bg-blue-400" />
          <span className="text-white/90 text-xs font-medium">M31 - Andromeda Galaxy</span>
        </div>
        <div className="flex gap-4 text-[10px] text-white/50">
          <span>RA: 00h 42m 44s</span>
          <span>Dec: +41° 16&apos;</span>
          <span>Mag: 3.4</span>
        </div>
      </div>
      {/* Mock crosshair */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="w-6 h-6 border border-white/30 rounded-full" />
        <div className="absolute top-1/2 left-0 w-full h-px bg-white/20" />
        <div className="absolute top-0 left-1/2 w-px h-full bg-white/20" />
      </div>
    </div>
  );
}

function MockPlanningUI() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-background to-muted/50 p-4 flex gap-3">
      {/* Mock sidebar */}
      <div className="w-1/3 space-y-2">
        <div className="text-xs font-medium text-foreground/80 mb-2 flex items-center gap-1.5">
          <Calendar className="h-3 w-3" />
          <span>Tonight&apos;s Plan</span>
        </div>
        {['M42 Orion Nebula', 'NGC 7000 N.America', 'M31 Andromeda'].map((name, i) => (
          <div key={i} className={cn(
            'rounded-md p-2 text-[10px] border transition-colors',
            i === 0 ? 'bg-primary/10 border-primary/30 text-foreground' : 'bg-muted/30 border-border/50 text-muted-foreground'
          )}>
            <div className="font-medium">{name}</div>
            <div className="text-muted-foreground/60 mt-0.5">{`${20 + i * 2}:00 - ${21 + i * 2}:30`}</div>
          </div>
        ))}
      </div>
      {/* Mock chart area */}
      <div className="flex-1 bg-muted/20 rounded-lg border border-border/30 p-3 flex flex-col">
        <div className="text-xs font-medium text-foreground/70 mb-2">Altitude Chart</div>
        <div className="flex-1 relative">
          <svg viewBox="0 0 200 80" className="w-full h-full" preserveAspectRatio="none">
            <path d="M0,70 Q30,60 60,40 T120,20 T200,50" fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.6" />
            <path d="M0,75 Q50,50 100,35 T200,60" fill="none" stroke="hsl(var(--secondary))" strokeWidth="1.5" opacity="0.4" />
            <line x1="0" y1="75" x2="200" y2="75" stroke="hsl(var(--border))" strokeWidth="0.5" />
          </svg>
        </div>
        <div className="flex justify-between text-[9px] text-muted-foreground/50 mt-1">
          <span>18:00</span><span>21:00</span><span>00:00</span><span>03:00</span><span>06:00</span>
        </div>
      </div>
    </div>
  );
}

function MockFovUI() {
  return (
    <div className="w-full h-full bg-gradient-to-b from-[#0a0e27] to-[#1a1e3a] relative overflow-hidden flex items-center justify-center">
      {/* Mock stars */}
      {FOV_STARS.map((star, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            width: `${star.w}px`,
            height: `${star.w}px`,
            top: `${star.t}%`,
            left: `${star.l}%`,
            opacity: star.o,
          }}
        />
      ))}
      {/* FOV rectangles */}
      <div className="relative">
        <div className="w-48 h-32 border-2 border-blue-400/60 rounded-sm" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-24 border border-green-400/40 rounded-sm" />
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-white/50">
          2.1° × 1.4° — ASI2600MC + RedCat 51
        </div>
      </div>
      {/* Mock mosaic grid */}
      <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-md rounded-md p-2 border border-white/10">
        <div className="text-[10px] text-white/70 font-medium mb-1">Mosaic 2×2</div>
        <div className="grid grid-cols-2 gap-0.5">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="w-5 h-4 border border-blue-400/40 rounded-[2px] bg-blue-400/10" />
          ))}
        </div>
      </div>
    </div>
  );
}

function MockSettingsUI() {
  return (
    <div className="w-full h-full bg-background p-4 flex gap-3">
      {/* Mock sidebar nav */}
      <div className="w-1/4 space-y-1">
        {['General', 'Location', 'Equipment', 'Display', 'Cache'].map((item, i) => (
          <div key={i} className={cn(
            'text-[10px] px-2 py-1.5 rounded-md transition-colors',
            i === 2 ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted/50'
          )}>
            {item}
          </div>
        ))}
      </div>
      {/* Mock settings content */}
      <div className="flex-1 space-y-3">
        <div className="text-xs font-medium text-foreground/80 flex items-center gap-1.5">
          <Settings className="h-3 w-3" />
          <span>Equipment Profiles</span>
        </div>
        {['Telescope: RedCat 51 (250mm f/4.9)', 'Camera: ZWO ASI2600MC Pro', 'Filter: Optolong L-eXtreme'].map((item, i) => (
          <div key={i} className="bg-muted/30 rounded-md p-2 border border-border/30">
            <div className="text-[10px] text-foreground/70">{item}</div>
          </div>
        ))}
        <div className="flex gap-2 mt-2">
          <div className="text-[9px] px-2 py-1 rounded bg-primary/10 text-primary border border-primary/20">Save</div>
          <div className="text-[9px] px-2 py-1 rounded bg-muted/50 text-muted-foreground border border-border/30">Reset</div>
        </div>
      </div>
    </div>
  );
}

const mockUIs: Record<string, React.ComponentType> = {
  starmap: MockStarmapUI,
  planning: MockPlanningUI,
  fov: MockFovUI,
  settings: MockSettingsUI,
};

export function ScreenshotCarousel() {
  const t = useTranslations('landing.screenshots');
  const [api, setApi] = useState<CarouselApi>();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      setActiveIndex(api.selectedScrollSnap());
    };

    api.on('select', onSelect);
    api.on('reInit', onSelect);

    return () => {
      api.off('select', onSelect);
      api.off('reInit', onSelect);
    };
  }, [api]);

  return (
    <section id="screenshots" className="py-24 bg-muted/30 relative overflow-hidden" aria-labelledby="screenshots-title">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader id="screenshots-title" title={t('title')} subtitle={t('subtitle')} />

        <Separator className="max-w-xs mx-auto mb-12 bg-border/50" />

        {/* Dot indicators */}
        <TooltipProvider>
          <div className="flex justify-center gap-3 mb-8" role="tablist" aria-label="Screenshot categories">
            {screenshots.map((item, index) => {
              const Icon = item.icon;
              return (
                <Tooltip key={item.key}>
                  <TooltipTrigger asChild>
                    <button
                      role="tab"
                      aria-selected={activeIndex === index}
                      aria-label={t(`${item.key}.label`)}
                      onClick={() => api?.scrollTo(index)}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                        activeIndex === index
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{t(`${item.key}.label`)}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t(`${item.key}.caption`)}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>

        {/* Carousel */}
        <Carousel
          setApi={setApi}
          opts={{ loop: true }}
          className="max-w-4xl mx-auto"
        >
          <CarouselContent>
            {screenshots.map((item) => {
              const MockUI = mockUIs[item.key];
              return (
                <CarouselItem key={item.key}>
                  <Card className="glass-light border-border/50 shadow-2xl overflow-hidden">
                    <CardContent className="p-0">
                      <div className="aspect-video relative">
                        {MockUI ? (
                          <MockUI />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-background to-secondary/10 flex items-center justify-center">
                            <item.icon className="h-10 w-10 text-primary" />
                          </div>
                        )}
                      </div>
                      {/* Caption bar */}
                      <div className="px-6 py-4 border-t border-border/30 bg-card/50">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <item.icon className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-foreground">
                              {t(`${item.key}.label`)}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {t(`${item.key}.caption`)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              );
            })}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex -left-12 glass-light" />
          <CarouselNext className="hidden md:flex -right-12 glass-light" />
        </Carousel>
      </div>
    </section>
  );
}
