'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { 
  Languages,
  Info,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/lib/stores/settings-store';
import type { SkyCultureLanguage } from '@/lib/translations';
import { useOnboardingStore } from '@/lib/stores/onboarding-store';
import { DISPLAY_OPTIONS } from '@/lib/constants/onboarding';

export function PreferencesStep() {
  const t = useTranslations();
  const updateSetupData = useOnboardingStore((state) => state.updateSetupData);
  
  const stellarium = useSettingsStore((state) => state.stellarium);
  const toggleStellariumSetting = useSettingsStore((state) => state.toggleStellariumSetting);
  const setStellariumSetting = useSettingsStore((state) => state.setStellariumSetting);

  useEffect(() => {
    updateSetupData({ preferencesConfigured: true });
  }, [updateSetupData]);

  return (
    <div className="space-y-6">
      {/* Description */}
      <p className="text-sm text-muted-foreground">
        {t('setupWizard.steps.preferences.description')}
      </p>

      {/* Language setting */}
      <div className="p-4 rounded-lg bg-muted/50 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Languages className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{t('setupWizard.steps.preferences.objectLanguage')}</p>
            <p className="text-xs text-muted-foreground">
              {t('setupWizard.steps.preferences.objectLanguageDesc')}
            </p>
          </div>
        </div>
        <Select
          value={stellarium.skyCultureLanguage}
          onValueChange={(value: SkyCultureLanguage) => 
            setStellariumSetting('skyCultureLanguage', value)
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="native">{t('settings.languageNative')}</SelectItem>
            <SelectItem value="en">{t('settings.languageEnglish')}</SelectItem>
            <SelectItem value="zh">{t('settings.languageChinese')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Display toggles */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">{t('setupWizard.steps.preferences.displayOptions')}</h3>
        
        <div className="space-y-2">
          {DISPLAY_OPTIONS.map(({ id, icon: Icon, titleKey, descKey, settingKey }) => {
            const isEnabled = stellarium[settingKey] as boolean;
            const switchId = `onboarding-preferences-${id}`;
            
            return (
              <div
                key={id}
                className={cn(
                  'flex items-center justify-between p-3 rounded-lg border transition-all',
                  isEnabled ? 'border-primary/50 bg-primary/5' : 'border-border'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center transition-colors',
                    isEnabled ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                  )}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium cursor-pointer" htmlFor={switchId}>
                      {t(titleKey)}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {t(descKey)}
                    </p>
                  </div>
                </div>
                <Switch
                  id={switchId}
                  checked={isEnabled}
                  onCheckedChange={() => toggleStellariumSetting(settingKey)}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick tip */}
      <Alert className="bg-blue-500/10 border-blue-500/30">
        <Info className="h-4 w-4 text-blue-500" />
        <AlertDescription className="text-muted-foreground">
          {t('setupWizard.steps.preferences.tipMessage')}
        </AlertDescription>
      </Alert>
    </div>
  );
}
