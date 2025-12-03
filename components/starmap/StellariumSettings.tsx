'use client';

import { useState, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useSettingsStore } from '@/lib/starmap/stores';
import type { StellariumSettings as StellariumSettingsType } from '@/lib/starmap/types';
import { Settings, Save, X, RotateCcw, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { SkyCultureLanguage } from '@/lib/starmap/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { StellariumSurveySelector } from './StellariumSurveySelector';

const SETTINGS_CONFIG = [
  { key: 'constellationsLinesVisible' as const, labelKey: 'settings.constellationLines' },
  { key: 'azimuthalLinesVisible' as const, labelKey: 'settings.azimuthalGrid' },
  { key: 'equatorialLinesVisible' as const, labelKey: 'settings.equatorialGrid' },
  { key: 'meridianLinesVisible' as const, labelKey: 'settings.meridianLine' },
  { key: 'eclipticLinesVisible' as const, labelKey: 'settings.eclipticLine' },
  { key: 'atmosphereVisible' as const, labelKey: 'settings.atmosphere' },
  { key: 'landscapesVisible' as const, labelKey: 'settings.landscape' },
  { key: 'dsosVisible' as const, labelKey: 'settings.deepSkyObjects' },
] as const;

export function StellariumSettings() {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const storeSettings = useSettingsStore((state) => state.stellarium);
  const setStellariumSettings = useSettingsStore((state) => state.setStellariumSettings);

  // Local state for editing - only update store on save
  const [localSettings, setLocalSettings] = useState<StellariumSettingsType>(storeSettings);

  // Calculate hasChanges using useMemo
  const hasChanges = useMemo(() => {
    return JSON.stringify(localSettings) !== JSON.stringify(storeSettings);
  }, [localSettings, storeSettings]);

  // Handle dialog open state change - reset local settings when opening
  const handleOpenChange = useCallback((isOpen: boolean) => {
    if (isOpen) {
      // Reset to store values when opening
      setLocalSettings(storeSettings);
    }
    setOpen(isOpen);
  }, [storeSettings]);

  // Toggle a setting locally
  const toggleLocalSetting = useCallback((key: keyof StellariumSettingsType) => {
    setLocalSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  // Update survey settings locally
  const handleSurveyChange = useCallback((surveyId: string, surveyUrl?: string) => {
    setLocalSettings((prev) => ({
      ...prev,
      surveyId,
      surveyUrl,
    }));
  }, []);

  const handleSurveyToggle = useCallback((enabled: boolean) => {
    setLocalSettings((prev) => ({
      ...prev,
      surveyEnabled: enabled,
    }));
  }, []);

  // Save all settings to store at once
  const handleSave = useCallback(() => {
    // Apply all settings at once to minimize re-renders
    setStellariumSettings(localSettings);
    setOpen(false);
  }, [localSettings, setStellariumSettings]);

  // Cancel and reset to store values
  const handleCancel = useCallback(() => {
    setLocalSettings(storeSettings);
    setOpen(false);
  }, [storeSettings]);

  // Reset to defaults
  const handleReset = useCallback(() => {
    setLocalSettings({
      constellationsLinesVisible: true,
      azimuthalLinesVisible: false,
      equatorialLinesVisible: false,
      meridianLinesVisible: false,
      eclipticLinesVisible: false,
      atmosphereVisible: false,
      landscapesVisible: false,
      dsosVisible: true,
      surveyEnabled: true,
      surveyId: 'dss',
      surveyUrl: undefined,
      skyCultureLanguage: 'native',
    });
  }, []);

  // Update sky culture language
  const handleSkyCultureLanguageChange = useCallback((value: SkyCultureLanguage) => {
    setLocalSettings((prev) => ({
      ...prev,
      skyCultureLanguage: value,
    }));
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`h-10 w-10 backdrop-blur-sm ${open ? 'bg-primary/30 text-primary' : 'bg-background/60 text-foreground hover:bg-background/80'}`}
            >
              <Settings className="h-5 w-5" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{t('settings.displaySettings')}</p>
        </TooltipContent>
      </Tooltip>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {t('settings.displaySettings')}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleReset}
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              {t('common.reset')}
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {/* Grid/Line Display Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SETTINGS_CONFIG.map(({ key, labelKey }) => (
              <div
                key={key}
                className="flex items-center justify-between w-full bg-muted/50 border border-border p-3 rounded-lg hover:bg-muted transition-colors"
              >
                <Label htmlFor={key} className="text-foreground cursor-pointer text-sm">
                  {t(labelKey)}
                </Label>
                <Switch
                  id={key}
                  checked={localSettings[key] as boolean}
                  onCheckedChange={() => toggleLocalSetting(key)}
                />
              </div>
            ))}
          </div>

          <Separator />

          {/* Sky Culture Language Settings */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Globe className="h-4 w-4" />
              {t('settings.skyCultureLanguage')}
            </h3>
            <Select
              value={localSettings.skyCultureLanguage}
              onValueChange={handleSkyCultureLanguageChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('settings.selectLanguage')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="native">{t('settings.languageNative')}</SelectItem>
                <SelectItem value="en">{t('settings.languageEnglish')}</SelectItem>
                <SelectItem value="zh">{t('settings.languageChinese')}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {t('settings.skyCultureLanguageDescription')}
            </p>
          </div>

          <Separator />

          {/* Sky Survey Settings */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">{t('settings.skySurveys')}</h3>
            <StellariumSurveySelector
              surveyEnabled={localSettings.surveyEnabled}
              surveyId={localSettings.surveyId}
              surveyUrl={localSettings.surveyUrl}
              onSurveyChange={handleSurveyChange}
              onSurveyToggle={handleSurveyToggle}
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2 pt-4 border-t border-border">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleCancel}
          >
            <X className="h-4 w-4 mr-2" />
            {t('common.cancel')}
          </Button>
          <Button
            className="flex-1"
            onClick={handleSave}
            disabled={!hasChanges}
          >
            <Save className="h-4 w-4 mr-2" />
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
