'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Star, Zap, Atom, Code, Palette, Monitor, Database, Component } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useInView } from '@/lib/hooks/use-in-view';
import { SectionHeader } from './section-header';
import { TECHNOLOGIES, TECH_CATEGORY_COLORS } from '@/lib/constants/landing';

const techIconMap: Record<string, LucideIcon> = {
  stellariumEngine: Star,
  nextjs: Zap,
  react: Atom,
  typescript: Code,
  tailwind: Palette,
  tauri: Monitor,
  zustand: Database,
  shadcnui: Component,
};

const technologies = TECHNOLOGIES.map((tech) => ({
  ...tech,
  icon: techIconMap[tech.i18nKey] ?? Star,
}));

export function TechStack() {
  const t = useTranslations('landing.tech');
  const { ref: badgesRef, isInView } = useInView<HTMLDivElement>({ threshold: 0.2 });

  return (
    <section id="tech" className="py-24 bg-background relative" aria-labelledby="tech-title">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader id="tech-title" title={t('title')} subtitle={t('subtitle')} />

        <Separator className="max-w-xs mx-auto mb-12 bg-border/50" />

        {/* Tech badges with tooltips */}
        <TooltipProvider>
          <div ref={badgesRef} className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
            {technologies.map((tech, index) => {
              const Icon = tech.icon;
              return (
                <Tooltip key={tech.name}>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="outline"
                      className={`px-4 py-2 text-sm font-medium cursor-default transition-colors ${isInView ? 'opacity-0 animate-fade-in' : 'opacity-0'} ${TECH_CATEGORY_COLORS[tech.category]}`}
                      style={isInView ? { animationDelay: `${index * 0.05}s`, animationFillMode: 'forwards' } : undefined}
                    >
                      <Icon className="h-3.5 w-3.5 mr-1.5" />
                      {tech.name}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t(`items.${tech.i18nKey}`)}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>

        {/* Engine highlight card */}
        <Card className="mt-16 max-w-lg mx-auto glass-light border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Star className="h-5 w-5 text-primary" />
              </div>
              {t('engineTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{t('engineDescription')}</p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
