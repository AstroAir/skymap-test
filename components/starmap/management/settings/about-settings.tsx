'use client';

import { useTranslations } from 'next-intl';
import {
  Info,
  Github,
  ExternalLink,
  Database,
  Heart,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { SettingsSection } from './settings-shared';

const APP_VERSION = '1.0.0';
const BUILD_DATE = '2024';

export function AboutSettings() {
  const t = useTranslations();

  return (
    <div className="space-y-4">
      {/* App Info */}
      <SettingsSection
        title={t('settingsNew.about.appInfo')}
        icon={<Info className="h-4 w-4" />}
        defaultOpen={true}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
            <span className="text-sm">{t('settingsNew.about.version')}</span>
            <Badge variant="outline" className="font-mono">v{APP_VERSION}</Badge>
          </div>
          <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
            <span className="text-sm">{t('settingsNew.about.buildDate')}</span>
            <span className="text-sm text-muted-foreground">{BUILD_DATE}</span>
          </div>
          <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
            <span className="text-sm">{t('settingsNew.about.engine')}</span>
            <span className="text-sm text-muted-foreground">Stellarium Web Engine</span>
          </div>
        </div>
      </SettingsSection>

      <Separator />

      {/* Links */}
      <SettingsSection
        title={t('settingsNew.about.links')}
        icon={<ExternalLink className="h-4 w-4" />}
        defaultOpen={false}
      >
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => window.open('https://github.com/AstroAir/skymap', '_blank')}
          >
            <Github className="h-4 w-4" />
            {t('settingsNew.about.sourceCode')}
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => window.open('https://github.com/AstroAir/skymap/wiki', '_blank')}
          >
            <BookOpen className="h-4 w-4" />
            {t('settingsNew.about.documentation')}
          </Button>
        </div>
      </SettingsSection>

      <Separator />

      {/* Data Credits */}
      <SettingsSection
        title={t('settingsNew.about.dataCredits')}
        icon={<Database className="h-4 w-4" />}
        defaultOpen={false}
      >
        <div className="space-y-3 text-sm">
          <div className="p-3 rounded-lg bg-muted/30 space-y-1">
            <div className="font-medium">{t('credits.stars')}</div>
            <p className="text-xs text-muted-foreground">Gaia DR3, Hipparcos, Yale Bright Star</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/30 space-y-1">
            <div className="font-medium">{t('credits.deepSkyObjects')}</div>
            <p className="text-xs text-muted-foreground">OpenNGC, HyperLEDA, SIMBAD</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/30 space-y-1">
            <div className="font-medium">{t('credits.backgroundImage')}</div>
            <p className="text-xs text-muted-foreground">DSS (STScI/NASA), CDS</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/30 space-y-1">
            <div className="font-medium">{t('credits.minorPlanets')}</div>
            <p className="text-xs text-muted-foreground">IAU Minor Planet Center</p>
          </div>
        </div>
      </SettingsSection>

      <Separator />

      {/* Credits */}
      <div className="py-4 text-center space-y-2">
        <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
          {t('about.madeWith')} <Heart className="h-3 w-3 text-red-500 fill-red-500" />
        </p>
        <p className="text-xs text-muted-foreground">
          {t('about.poweredBy')}
        </p>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} SkyMap. {t('about.allRightsReserved')}
        </p>
      </div>
    </div>
  );
}
