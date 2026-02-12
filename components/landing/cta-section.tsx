'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Rocket, Download, Github } from 'lucide-react';
import { SectionHeader } from './section-header';

export function CTASection() {
  const t = useTranslations('landing.cta');

  return (
    <section className="py-24 bg-gradient-to-b from-background via-primary/5 to-background relative overflow-hidden" aria-labelledby="cta-title">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-secondary/10 rounded-full blur-[80px]" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <SectionHeader id="cta-title" title={t('title')} subtitle={t('description')} />

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/starmap">
            <Button size="lg" className="min-w-[200px] font-medium group">
              <Rocket className="mr-2 h-5 w-5 group-hover:animate-float" />
              {t('launchButton')}
            </Button>
          </Link>
          <Button
            variant="outline"
            size="lg"
            className="min-w-[200px] font-medium glass-light border-border/50"
            asChild
          >
            <a
              href="https://github.com/AstroAir/skymap/releases"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download className="mr-2 h-5 w-5" />
              {t('downloadButton')}
            </a>
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="min-w-[200px] font-medium"
            asChild
          >
            <a
              href="https://github.com/AstroAir/skymap"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="mr-2 h-5 w-5" />
              {t('githubButton')}
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
