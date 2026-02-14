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
import { Map, Calendar, Camera, Settings } from 'lucide-react';
import { SectionHeader } from './section-header';
import { MockStarmapUI, MockPlanningUI, MockFovUI, MockSettingsUI } from './mock-screenshots';
import type { ScreenshotItem } from '@/types/landing';

const screenshots: ScreenshotItem[] = [
  { key: 'starmap', icon: Map },
  { key: 'planning', icon: Calendar },
  { key: 'fov', icon: Camera },
  { key: 'settings', icon: Settings },
];

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
                      aria-controls={`screenshot-panel-${item.key}`}
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
                <CarouselItem key={item.key} role="tabpanel" id={`screenshot-panel-${item.key}`} aria-label={t(`${item.key}.label`)}>
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
