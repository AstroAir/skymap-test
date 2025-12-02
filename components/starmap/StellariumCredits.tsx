'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function StellariumCredits() {
  const t = useTranslations();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`h-10 w-10 backdrop-blur-sm ${open ? 'bg-primary/30 text-primary' : 'bg-background/60 text-foreground hover:bg-background/80'}`}
            >
              <Info className="h-5 w-5" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{t('credits.dataCredits')}</p>
        </TooltipContent>
      </Tooltip>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('credits.dataCredits')}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
        <div className="space-y-4 text-sm">
          <section>
            <h3 className="font-semibold text-lg mb-2">Stars</h3>
            <p className="mb-2">Combination of the following catalogues:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Gaia DR2:</strong> This work has made use of data from the European Space
                Agency (ESA) mission Gaia, processed by the Gaia Data Processing and Analysis
                Consortium (DPAC).
              </li>
              <li>
                <strong>Hipparcos:</strong> The Hipparcos star catalog from ESA (European Space
                Agency) and the Hipparcos mission.
              </li>
              <li>
                <strong>Bright Stars Catalogue:</strong> Bright Star Catalogue, 5th Revised Ed.
                (Hoffleit+, 1991)
              </li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-2">Deep Sky Objects</h3>
            <p className="mb-2">Combination of the following catalogues:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>HyperLeda database:</strong> Makarov et al. 2014, A&A, 570, A13
              </li>
              <li>
                <strong>Simbad:</strong> SIMBAD astronomical database, operated at CDS, Strasbourg
              </li>
              <li>
                <strong>Open NGC Database:</strong> Mattia Verga
              </li>
              <li>Caldwell Catalogue: from Wikipedia</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-2">Background Image</h3>
            <p className="mb-2">Digitized Sky Survey:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>STScI/NASA, Colored & Healpixed by CDS</li>
              <li>
                Based on DSS2-red and DSS2-blue HiPS surveys from original scanned plates
              </li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-2">Planets & Moons Textures</h3>
            <p className="mb-2">
              High-resolution planet textures from Stellarium Labs under Creative Commons
              Attribution 4.0 International (CC BY 4.0)
            </p>
            <p>Original data from NASA & JPL under public domain license</p>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-2">Minor Planets</h3>
            <p>
              All data comes from the IAU Minor Planet Center. This research has made use of
              data and/or services provided by the International Astronomical Union&apos;s Minor
              Planet Center.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-2">Others</h3>
            <ul className="list-disc pl-5">
              <li>Landscape images by Fabien Chereau</li>
              <li>Constellation lines by Fabien Chereau</li>
            </ul>
          </section>
        </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
