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

const technologies = [
  { name: 'Stellarium Web Engine', category: 'core', icon: Star, description: 'Realistic sky rendering engine' },
  { name: 'Next.js 16', category: 'framework', icon: Zap, description: 'React framework with App Router' },
  { name: 'React 19', category: 'framework', icon: Zap, description: 'Latest React with Server Components' },
  { name: 'TypeScript', category: 'language', icon: Zap, description: 'Type-safe JavaScript' },
  { name: 'Tailwind CSS v4', category: 'styling', icon: Palette, description: 'Utility-first CSS framework' },
  { name: 'Tauri 2.9', category: 'desktop', icon: Monitor, description: 'Cross-platform desktop apps' },
  { name: 'Zustand', category: 'state', icon: Database, description: 'Lightweight state management' },
  { name: 'shadcn/ui', category: 'components', icon: Component, description: 'Beautiful UI components' },
];

const categoryColors: Record<string, string> = {
  core: 'bg-primary/20 text-primary border-primary/30 hover:bg-primary/30',
  framework: 'bg-secondary/20 text-secondary-foreground border-secondary/30 hover:bg-secondary/30',
  language: 'bg-accent/20 text-accent-foreground border-accent/30 hover:bg-accent/30',
  styling: 'bg-chart-3/20 text-foreground border-chart-3/30 hover:bg-chart-3/30',
  desktop: 'bg-chart-1/20 text-foreground border-chart-1/30 hover:bg-chart-1/30',
  state: 'bg-chart-2/20 text-foreground border-chart-2/30 hover:bg-chart-2/30',
  components: 'bg-chart-4/20 text-foreground border-chart-4/30 hover:bg-chart-4/30',
};

export function TechStack() {
  const t = useTranslations('landing.tech');

  return (
    <section id="tech" className="py-24 bg-background relative">
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
                      className={`px-4 py-2 text-sm font-medium cursor-default opacity-0 animate-fade-in transition-colors ${categoryColors[tech.category]}`}
                      style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'forwards' }}
                    >
                      <Icon className="h-3.5 w-3.5 mr-1.5" />
                      {tech.name}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{tech.description}</p>
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
