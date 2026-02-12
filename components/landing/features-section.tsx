'use client';

import { useTranslations } from 'next-intl';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Telescope,
  Calendar,
  Target,
  Camera,
  Moon,
  Compass,
  Settings,
  Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectionHeader } from './section-header';
import type { LandingFeatureItem } from '@/types/landing';

const features: LandingFeatureItem[] = [
  { icon: Telescope, key: 'stellarium' },
  { icon: Calendar, key: 'planning' },
  { icon: Target, key: 'shotList' },
  { icon: Camera, key: 'fovSimulator' },
  { icon: Moon, key: 'tonight' },
  { icon: Compass, key: 'coordinates' },
  { icon: Settings, key: 'equipment' },
  { icon: Globe, key: 'i18n' },
];

export function FeaturesSection() {
  const t = useTranslations('landing.features');

  return (
    <section id="features" className="py-24 bg-background relative">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader title={t('title')} subtitle={t('subtitle')} />

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.key}
                className={cn(
                  'group glass-light border-border/50 hover:border-primary/50 transition-all duration-300 card-hover',
                  'opacity-0 animate-fade-in'
                )}
                style={{ animationDelay: `${index * 0.1}s`, animationFillMode: 'forwards' }}
              >
                <CardHeader>
                  <div className="mb-2 p-3 rounded-lg bg-primary/10 w-fit group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">
                    {t(`${feature.key}.title`)}
                  </CardTitle>
                  <CardDescription className="leading-relaxed">
                    {t(`${feature.key}.description`)}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
