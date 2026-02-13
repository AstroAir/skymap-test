'use client';

import { useTranslations } from 'next-intl';
import { useInView } from '@/lib/hooks/use-in-view';
import { Rocket, MapPin, Telescope } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectionHeader } from './section-header';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Step {
  icon: LucideIcon;
  key: string;
  step: number;
}

const steps: Step[] = [
  { icon: Rocket, key: 'launch', step: 1 },
  { icon: MapPin, key: 'setup', step: 2 },
  { icon: Telescope, key: 'observe', step: 3 },
];

export function GettingStartedSection() {
  const t = useTranslations('landing.gettingStarted');
  const { ref: stepsRef, isInView } = useInView<HTMLDivElement>({ threshold: 0.2 });

  return (
    <section id="getting-started" className="py-24 bg-background relative" aria-labelledby="getting-started-title">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader id="getting-started-title" title={t('title')} subtitle={t('subtitle')} />

        <div ref={stepsRef} className="relative">
          {/* Connection line */}
          <div className="hidden md:block absolute top-16 left-[16.67%] right-[16.67%] h-0.5 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.key}
                  className={cn(
                    'flex flex-col items-center text-center gap-4 relative',
                    isInView ? 'opacity-0 animate-fade-in' : 'opacity-0'
                  )}
                  style={isInView ? { animationDelay: `${index * 0.2}s`, animationFillMode: 'forwards' } : undefined}
                >
                  {/* Step number + icon */}
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center shadow-md">
                      {step.step}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-foreground">
                    {t(`${step.key}.title`)}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                    {t(`${step.key}.description`)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link href="/starmap">
            <Button size="lg" className="font-medium group">
              <Rocket className="mr-2 h-5 w-5 group-hover:animate-float" />
              {t('cta')}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
