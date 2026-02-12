'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Map, Calendar, Camera, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import type { ScreenshotItem } from '@/types/landing';
import { useCarousel } from '@/lib/hooks/use-carousel';

const screenshots: ScreenshotItem[] = [
  { key: 'starmap', icon: Map },
  { key: 'planning', icon: Calendar },
  { key: 'fov', icon: Camera },
  { key: 'settings', icon: Settings },
];

export function ScreenshotCarousel() {
  const t = useTranslations('landing.screenshots');
  const { activeIndex, goToNext, goToPrev, goTo } = useCarousel({ items: screenshots });
  const activeTab = screenshots[activeIndex].key;

  const handleTabChange = (value: string) => {
    const index = screenshots.findIndex((s) => s.key === value);
    if (index >= 0) goTo(index);
  };

  return (
    <section id="screenshots" className="py-24 bg-muted/30 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-foreground mb-4">
            {t('title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        <Separator className="max-w-xs mx-auto mb-12 bg-border/50" />

        {/* Tabs-based carousel */}
        <TooltipProvider>
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            {/* Tab triggers */}
            <TabsList className="grid grid-cols-4 max-w-md mx-auto mb-8 glass-light">
              {screenshots.map((item) => {
                const Icon = item.icon;
                return (
                  <Tooltip key={item.key}>
                    <TooltipTrigger asChild>
                      <TabsTrigger value={item.key} className="gap-2">
                        <Icon className="h-4 w-4" />
                        <span className="hidden sm:inline">{t(`${item.key}.label`)}</span>
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t(`${item.key}.caption`)}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </TabsList>

            {/* Tab content */}
            <div className="relative">
              {/* Navigation arrows */}
              <Button
                variant="outline"
                size="icon"
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 hidden md:flex glass-light"
                onClick={goToPrev}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 hidden md:flex glass-light"
                onClick={goToNext}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>

              {screenshots.map((item) => (
                <TabsContent key={item.key} value={item.key} className="mt-0">
                  <Card className="max-w-4xl mx-auto glass-light border-border/50 shadow-2xl overflow-hidden">
                    <CardContent className="p-0">
                      <div className="aspect-video bg-gradient-to-br from-primary/20 via-background to-secondary/10 flex items-center justify-center">
                        <div className="text-center p-8">
                          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/20 flex items-center justify-center">
                            <item.icon className="h-10 w-10 text-primary" />
                          </div>
                          <h3 className="text-xl font-semibold text-foreground mb-2">
                            {t(`${item.key}.label`)}
                          </h3>
                          <p className="text-muted-foreground max-w-md">
                            {t(`${item.key}.caption`)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </TooltipProvider>
      </div>
    </section>
  );
}
