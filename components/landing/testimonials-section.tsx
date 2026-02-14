'use client';

import { useTranslations } from 'next-intl';
import { useInView } from '@/lib/hooks/use-in-view';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Quote } from 'lucide-react';
import { SectionHeader } from './section-header';
import { cn } from '@/lib/utils';
import { getScrollAnimationProps } from '@/lib/utils/scroll-animation';

const TESTIMONIAL_KEYS = ['astronomer', 'photographer', 'beginner'] as const;

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" role="img" aria-label={`${rating} out of 5 stars`}>
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
        <SectionHeader id="testimonials-title" title={t('title')} subtitle={t('subtitle')} />

        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIAL_KEYS.map((key, index) => (
            <Card
              key={key}
              className={cn(
                'glass-light border-border/50 transition-all duration-300 card-hover',
                getScrollAnimationProps(isInView, index, 0.15).className
              )}
              style={getScrollAnimationProps(isInView, index, 0.15).style}
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
