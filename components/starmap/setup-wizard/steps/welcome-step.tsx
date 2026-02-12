'use client';

import { useTranslations } from 'next-intl';
import { MapPin, Telescope, Settings2, Sparkles } from 'lucide-react';

const features = [
  { icon: MapPin, key: 'location' },
  { icon: Telescope, key: 'equipment' },
  { icon: Settings2, key: 'preferences' },
] as const;

export function WelcomeStep() {
  const t = useTranslations();

  return (
    <div className="space-y-6">
      {/* Welcome message */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-primary animate-pulse" />
            </div>
            <div className="absolute -inset-2 rounded-full border border-primary/30 animate-ping" style={{ animationDuration: '3s' }} />
          </div>
        </div>
        <p className="text-muted-foreground">
          {t('setupWizard.steps.welcome.description')}
        </p>
      </div>

      {/* What we'll configure */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">
          {t('setupWizard.steps.welcome.whatWellConfigure')}
        </h3>
        <div className="grid gap-3">
          {features.map(({ icon: Icon, key }) => (
            <div
              key={key}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50 hover:bg-muted transition-colors"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {t(`setupWizard.steps.welcome.features.${key}.title`)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t(`setupWizard.steps.welcome.features.${key}.description`)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Time estimate */}
      <p className="text-center text-xs text-muted-foreground">
        {t('setupWizard.steps.welcome.timeEstimate')}
      </p>
    </div>
  );
}
