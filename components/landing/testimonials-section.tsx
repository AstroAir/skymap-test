'use client';

import { useTranslations } from 'next-intl';
import { useInView } from '@/lib/hooks/use-in-view';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Quote } from 'lucide-react';
import { cn } from '@/lib/utils';

const TESTIMONIAL_KEYS = ['astronomer', 'photographer', 'beginner'] as const;

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            'h-4 w-4',
            i < rating ? 'text-secondary fill-secondary' : 'text-muted-foreground/30'
          )}
        />
      ))}
    </div>
  );
}

export function TestimonialsSection() {
  const t = useTranslations('landing.testimonials');
  const { ref: gridRef, isInView } = useInView<HTMLDivElement>({ threshold: 0.1 });

  return (
    <section className="py-24 bg-muted/30 relative" aria-labelledby="testimonials-title">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 id="testimonials-title" className="text-3xl sm:text-4xl font-serif font-bold text-foreground mb-4">
            {t('title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIAL_KEYS.map((key, index) => (
            <Card
              key={key}
              className={cn(
                'glass-light border-border/50 transition-all duration-300 card-hover',
                isInView ? 'opacity-0 animate-fade-in' : 'opacity-0'
              )}
              style={isInView ? { animationDelay: `${index * 0.15}s`, animationFillMode: 'forwards' } : undefined}
            >
              <CardContent className="pt-6">
                <Quote className="h-8 w-8 text-primary/30 mb-4" />
                <p className="text-foreground/90 leading-relaxed mb-6 italic">
                  &ldquo;{t(`${key}.quote`)}&rdquo;
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground text-sm">
                      {t(`${key}.name`)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t(`${key}.role`)}
                    </p>
                  </div>
                  <StarRating rating={5} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
