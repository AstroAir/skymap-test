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
import { Star, Zap, Palette, Monitor, Database, Component } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { SectionHeader } from './section-header';
import { TECHNOLOGIES, TECH_CATEGORY_COLORS } from '@/lib/constants/landing';

const techIconMap: Record<string, LucideIcon> = {
  'Stellarium Web Engine': Star,
  'Next.js 16': Zap,
  'React 19': Zap,
  'TypeScript': Zap,
  'Tailwind CSS v4': Palette,
  'Tauri 2.9': Monitor,
  'Zustand': Database,
  'shadcn/ui': Component,
};

const techI18nKeyMap: Record<string, string> = {
  'Stellarium Web Engine': 'stellariumEngine',
  'Next.js 16': 'nextjs',
  'React 19': 'react',
  'TypeScript': 'typescript',
  'Tailwind CSS v4': 'tailwind',
  'Tauri 2.9': 'tauri',
  'Zustand': 'zustand',
  'shadcn/ui': 'shadcnui',
};

const technologies = TECHNOLOGIES.map((tech) => ({
  ...tech,
  icon: techIconMap[tech.name] ?? Star,
  i18nKey: techI18nKeyMap[tech.name] ?? tech.name,
}));

export function TechStack() {
  const t = useTranslations('landing.tech');

  return (
    <section id="tech" className="py-24 bg-background relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader title={t('title')} subtitle={t('subtitle')} />

        <Separator className="max-w-xs mx-auto mb-12 bg-border/50" />

        {/* Tech badges with tooltips */}
        <TooltipProvider>
          <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
            {technologies.map((tech, index) => {
              const Icon = tech.icon;
              return (
                <Tooltip key={tech.name}>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="outline"
                      className={`px-4 py-2 text-sm font-medium cursor-default opacity-0 animate-fade-in transition-colors ${TECH_CATEGORY_COLORS[tech.category]}`}
                      style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'forwards' }}
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
