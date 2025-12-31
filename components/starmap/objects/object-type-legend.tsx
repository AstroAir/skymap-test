'use client';

import { memo } from 'react';
import { useTranslations } from 'next-intl';
import {
  Star,
  Globe2,
  Cloud,
  Sparkles,
  Orbit,
  CircleDot,
  Binary,
  Zap,
  Circle,
  Target,
  Rocket,
  Moon,
  Asterisk,
  Atom,
  HelpCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface ObjectTypeLegendItem {
  icon: React.ElementType;
  color: string;
  labelKey: string;
  category: 'galaxy' | 'nebula' | 'cluster' | 'star' | 'solar' | 'exotic';
}

const legendItems: ObjectTypeLegendItem[] = [
  // Galaxies
  { icon: Globe2, color: 'text-purple-400', labelKey: 'galaxy', category: 'galaxy' },
  
  // Nebulae
  { icon: Cloud, color: 'text-pink-400', labelKey: 'nebula', category: 'nebula' },
  { icon: Circle, color: 'text-cyan-400', labelKey: 'planetaryNebula', category: 'nebula' },
  { icon: Zap, color: 'text-red-400', labelKey: 'supernovaRemnant', category: 'nebula' },
  
  // Clusters
  { icon: Sparkles, color: 'text-blue-400', labelKey: 'openCluster', category: 'cluster' },
  { icon: Atom, color: 'text-indigo-400', labelKey: 'globularCluster', category: 'cluster' },
  
  // Stars
  { icon: CircleDot, color: 'text-yellow-400', labelKey: 'star', category: 'star' },
  { icon: Binary, color: 'text-amber-400', labelKey: 'doubleStar', category: 'star' },
  { icon: Asterisk, color: 'text-rose-400', labelKey: 'variableStar', category: 'star' },
  
  // Solar System
  { icon: Orbit, color: 'text-orange-400', labelKey: 'planet', category: 'solar' },
  { icon: Moon, color: 'text-slate-300', labelKey: 'moon', category: 'solar' },
  { icon: Target, color: 'text-stone-400', labelKey: 'asteroid', category: 'solar' },
  { icon: Rocket, color: 'text-teal-400', labelKey: 'comet', category: 'solar' },
  
  // Exotic
  { icon: Zap, color: 'text-violet-400', labelKey: 'quasar', category: 'exotic' },
];

interface ObjectTypeLegendContentProps {
  compact?: boolean;
}

function ObjectTypeLegendContent({ compact = false }: ObjectTypeLegendContentProps) {
  const t = useTranslations('objects');
  const tLegend = useTranslations('legend');

  const categories = [
    { key: 'galaxy', label: tLegend('galaxies') },
    { key: 'nebula', label: tLegend('nebulae') },
    { key: 'cluster', label: tLegend('clusters') },
    { key: 'star', label: tLegend('stars') },
    { key: 'solar', label: tLegend('solarSystem') },
    { key: 'exotic', label: tLegend('exoticObjects') },
  ];

  if (compact) {
    return (
      <div className="grid grid-cols-2 gap-2 p-2">
        {legendItems.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.labelKey} className="flex items-center gap-2 text-xs">
              <Icon className={cn('h-4 w-4 shrink-0', item.color)} />
              <span className="text-foreground truncate">{t(item.labelKey)}</span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {categories.map((category) => {
        const items = legendItems.filter((item) => item.category === category.key);
        if (items.length === 0) return null;

        return (
          <div key={category.key}>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {category.label}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.labelKey}
                    className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className={cn('p-1.5 rounded-md bg-background/50', item.color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm text-foreground">{t(item.labelKey)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface ObjectTypeLegendProps {
  variant?: 'dialog' | 'popover';
  triggerClassName?: string;
}

export const ObjectTypeLegend = memo(function ObjectTypeLegend({
  variant = 'popover',
  triggerClassName,
}: ObjectTypeLegendProps) {
  const t = useTranslations('legend');

  const triggerButton = (
    <Button
      variant="ghost"
      size="sm"
      className={cn('h-8 px-2 text-xs gap-1.5 touch-target', triggerClassName)}
    >
      <HelpCircle className="h-4 w-4" />
      <span className="hidden sm:inline">{t('objectTypes')}</span>
    </Button>
  );

  if (variant === 'dialog') {
    return (
      <Dialog>
        <DialogTrigger asChild>{triggerButton}</DialogTrigger>
        <DialogContent className="max-w-md max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              {t('objectTypesTitle')}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <ObjectTypeLegendContent />
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="end">
        <div className="flex items-center gap-2 mb-3">
          <Star className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">{t('objectTypesTitle')}</h3>
        </div>
        <ScrollArea className="max-h-[50vh]">
          <ObjectTypeLegendContent compact />
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
});

export { ObjectTypeLegendContent };
