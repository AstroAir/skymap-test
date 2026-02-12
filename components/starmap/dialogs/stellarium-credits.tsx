'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Database, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { StellariumCreditsProps } from '@/types/stellarium-credits';

export function StellariumCredits({ trigger }: StellariumCreditsProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);

  const defaultTrigger = (
    <Button
      variant="outline"
      size="sm"
      className="w-full justify-between"
      aria-label={t('credits.dataCredits')}
    >
      <span className="flex items-center gap-2">
        <Database className="h-4 w-4" />
        {t('credits.dataCredits')}
      </span>
      <ChevronRight className="h-4 w-4" />
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            {t('credits.dataCredits')}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t('credits.starsDescription')}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4 text-sm">
            <section>
              <h3 className="font-semibold text-lg mb-2">{t('credits.stars')}</h3>
              <p className="mb-2">{t('credits.starsDescription')}</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>Gaia DR2:</strong> {t('credits.gaiaDescription')}
                </li>
                <li>
                  <strong>Hipparcos:</strong> {t('credits.hipparcosDescription')}
                </li>
                <li>
                  <strong>Bright Stars Catalogue:</strong> {t('credits.brightStarsDescription')}
                </li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2">{t('credits.deepSkyObjects')}</h3>
              <p className="mb-2">{t('credits.dsoDescription')}</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>HyperLeda database:</strong> {t('credits.hyperledaDescription')}
                </li>
                <li>
                  <strong>Simbad:</strong> {t('credits.simbadDescription')}
                </li>
                <li>
                  <strong>Open NGC Database:</strong> {t('credits.openNgcDescription')}
                </li>
                <li>{t('credits.caldwellDescription')}</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2">{t('credits.backgroundImage')}</h3>
              <p className="mb-2">{t('credits.dssDescription')}</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>{t('credits.dssDetails1')}</li>
                <li>{t('credits.dssDetails2')}</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2">{t('credits.planetTextures')}</h3>
              <p className="mb-2">{t('credits.planetTexturesDescription')}</p>
              <p>{t('credits.planetTexturesSource')}</p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2">{t('credits.minorPlanets')}</h3>
              <p>{t('credits.minorPlanetsDescription')}</p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2">{t('credits.others')}</h3>
              <ul className="list-disc pl-5">
                <li>{t('credits.landscapeImages')}</li>
                <li>{t('credits.constellationLines')}</li>
              </ul>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
