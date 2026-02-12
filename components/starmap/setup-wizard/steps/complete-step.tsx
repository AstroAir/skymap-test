'use client';

import { useTranslations } from 'next-intl';
import { Check, Rocket } from 'lucide-react';

export function CompleteStep() {
  const t = useTranslations();

  return (
    <div className="text-center space-y-6 py-4">
      {/* Success animation */}
      <div className="flex justify-center">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500/30 to-green-500/10 flex items-center justify-center">
            <Check className="w-12 h-12 text-green-500" />
          </div>
          <div className="absolute -inset-2 rounded-full border-2 border-green-500/30 animate-ping" style={{ animationDuration: '2s' }} />
        </div>
      </div>

      {/* Message */}
      <div>
        <p className="text-muted-foreground mb-4">
          {t('setupWizard.steps.complete.description')}
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm">
          <Rocket className="w-4 h-4" />
          {t('setupWizard.steps.complete.readyToExplore')}
        </div>
      </div>

      {/* Tips */}
      <div className="text-left bg-muted/50 rounded-lg p-4 space-y-2">
        <h4 className="text-sm font-medium text-foreground">
          {t('setupWizard.steps.complete.quickTips')}
        </h4>
        <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
          <li>{t('setupWizard.steps.complete.tip1')}</li>
          <li>{t('setupWizard.steps.complete.tip2')}</li>
          <li>{t('setupWizard.steps.complete.tip3')}</li>
        </ul>
      </div>
    </div>
  );
}
