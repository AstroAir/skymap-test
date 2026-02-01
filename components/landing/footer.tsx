'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Star, Github, Heart, ExternalLink, Map, BookOpen } from 'lucide-react';

export function Footer() {
  const t = useTranslations('landing.footer');
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-12 bg-card border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4 group">
              <Star className="h-6 w-6 text-primary group-hover:text-secondary transition-colors" />
              <span className="font-serif text-xl font-bold text-foreground">
                SkyMap
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('description')}
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">{t('links')}</h4>
            <TooltipProvider>
              <ul className="space-y-2">
                <li>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="link" className="h-auto p-0 text-muted-foreground hover:text-foreground" asChild>
                        <Link href="/starmap" className="inline-flex items-center gap-1.5">
                          <Map className="h-3.5 w-3.5" />
                          {t('starmap')}
                        </Link>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Open the interactive star map</p>
                    </TooltipContent>
                  </Tooltip>
                </li>
                <li>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="link" className="h-auto p-0 text-muted-foreground hover:text-foreground" asChild>
                        <a
                          href="https://github.com/AstroAir/skymap"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5"
                        >
                          <Github className="h-3.5 w-3.5" />
                          GitHub
                          <ExternalLink className="h-3 w-3 opacity-50" />
                        </a>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>View source code on GitHub</p>
                    </TooltipContent>
                  </Tooltip>
                </li>
                <li>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="link" className="h-auto p-0 text-muted-foreground hover:text-foreground" asChild>
                        <a
                          href="https://stellarium.org"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5"
                        >
                          <BookOpen className="h-3.5 w-3.5" />
                          Stellarium
                          <ExternalLink className="h-3 w-3 opacity-50" />
                        </a>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Visit Stellarium official website</p>
                    </TooltipContent>
                  </Tooltip>
                </li>
              </ul>
            </TooltipProvider>
          </div>

          {/* Credits */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">{t('credits')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-1.5">
                <Star className="h-3 w-3 text-primary" />
                {t('stellariumEngine')}
              </li>
              <li className="flex items-center gap-1.5">
                <Star className="h-3 w-3 text-primary" />
                {t('gaiaData')}
              </li>
              <li className="flex items-center gap-1.5">
                <Star className="h-3 w-3 text-primary" />
                {t('dssImages')}
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} SkyMap. {t('allRightsReserved')}
          </p>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            {t('madeWith')} <Heart className="h-3 w-3 text-destructive animate-pulse-subtle" /> {t('forAstronomers')}
          </p>
        </div>
      </div>
    </footer>
  );
}
