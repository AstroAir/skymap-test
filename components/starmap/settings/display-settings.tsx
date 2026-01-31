'use client';

import { useTranslations } from 'next-intl';
import {
  Eye,
  Grid3X3,
  Satellite,
  Globe,
  Palette,
  Moon,
  Smartphone,
  Database,
  AlertCircle,
} from 'lucide-react';
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
import { useSatelliteStore } from '@/lib/stores';
import type { StellariumSettings as StellariumSettingsType, SkyCultureLanguage } from '@/lib/core/types';
import { StellariumSurveySelector } from './stellarium-survey-selector';
import { ObjectInfoSourcesConfig } from '../objects/object-info-sources-config';
import { TourRestartButton } from '../onboarding/welcome-dialog';
import { SettingsSection, ToggleItem } from './settings-shared';
import { DISPLAY_SETTINGS, GRID_SETTINGS } from './settings-constants';

interface DisplaySettingsProps {
  localSettings: StellariumSettingsType;
  onToggleSetting: (key: keyof StellariumSettingsType) => void;
  onSurveyChange: (surveyId: string, surveyUrl?: string) => void;
  onSurveyToggle: (enabled: boolean) => void;
  onSkyCultureLanguageChange: (value: SkyCultureLanguage) => void;
}

export function DisplaySettings({
  localSettings,
  onToggleSetting,
  onSurveyChange,
  onSurveyToggle,
  onSkyCultureLanguageChange,
}: DisplaySettingsProps) {
  const t = useTranslations();
  
  const showSatellites = useSatelliteStore((state) => state.showSatellites);
  const showSatelliteLabels = useSatelliteStore((state) => state.showLabels);
  const showSatelliteOrbits = useSatelliteStore((state) => state.showOrbits);
  const setShowSatellites = useSatelliteStore((state) => state.setShowSatellites);
  const setShowSatelliteLabels = useSatelliteStore((state) => state.setShowLabels);
  const setShowSatelliteOrbits = useSatelliteStore((state) => state.setShowOrbits);

  return (
    <div className="p-4 space-y-4">
      <SettingsSection
        title={t('settings.displaySettings')}
        icon={<Eye className="h-4 w-4" />}
      >
        {DISPLAY_SETTINGS.map(({ key, labelKey }) => (
          <ToggleItem
            key={key}
            id={key}
            label={t(labelKey)}
            checked={localSettings[key] as boolean}
            onCheckedChange={() => onToggleSetting(key)}
          />
        ))}
      </SettingsSection>

      <Separator />

      <SettingsSection
        title={t('settings.gridLines')}
        icon={<Grid3X3 className="h-4 w-4" />}
        defaultOpen={true}
      >
        {GRID_SETTINGS.map(({ key, labelKey }) => (
          <ToggleItem
            key={key}
            id={key}
            label={t(labelKey)}
            checked={localSettings[key] as boolean}
            onCheckedChange={() => onToggleSetting(key)}
          />
        ))}
      </SettingsSection>

      <Separator />

      <SettingsSection
        title={t('settings.viewModes')}
        icon={<Moon className="h-4 w-4" />}
        defaultOpen={false}
      >
        <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
          <div className="flex-1 min-w-0 mr-2">
            <Label htmlFor="night-mode" className="text-sm cursor-pointer flex items-center gap-2">
              <Moon className="h-4 w-4 text-red-400" />
              {t('settings.nightMode')}
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">{t('settings.nightModeDescription')}</p>
          </div>
          <Switch
            id="night-mode"
            checked={localSettings.nightMode}
            onCheckedChange={() => onToggleSetting('nightMode')}
          />
        </div>
        <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
          <div className="flex-1 min-w-0 mr-2">
            <Label htmlFor="sensor-control" className="text-sm cursor-pointer flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-blue-400" />
              {t('settings.sensorControl')}
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">{t('settings.sensorControlPermission')}</p>
          </div>
          <Switch
            id="sensor-control"
            checked={localSettings.sensorControl}
            onCheckedChange={() => onToggleSetting('sensorControl')}
          />
        </div>
      </SettingsSection>

      <Separator />

      <SettingsSection
        title={t('satellites.satelliteTracker')}
        icon={<Satellite className="h-4 w-4" />}
        defaultOpen={false}
      >
        {/* Instant effect hint for satellite settings */}
        <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-1 rounded mb-2">
          {t('settings.instantEffectHint')}
        </p>
        <ToggleItem
          id="show-satellites"
          label={t('satellites.showOnMap')}
          checked={showSatellites}
          onCheckedChange={() => setShowSatellites(!showSatellites)}
        />
        <ToggleItem
          id="show-satellite-labels"
          label={t('satellites.showLabels')}
          checked={showSatelliteLabels}
          onCheckedChange={() => setShowSatelliteLabels(!showSatelliteLabels)}
        />
        <ToggleItem
          id="show-satellite-orbits"
          label={t('satellites.showOrbits')}
          checked={showSatelliteOrbits}
          onCheckedChange={() => setShowSatelliteOrbits(!showSatelliteOrbits)}
        />
      </SettingsSection>

      <Separator />

      <SettingsSection
        title={t('settings.skyCultureLanguage')}
        icon={<Globe className="h-4 w-4" />}
        defaultOpen={false}
      >
        <Select
          value={localSettings.skyCultureLanguage}
          onValueChange={onSkyCultureLanguageChange}
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
        <p className="text-xs text-muted-foreground px-1">
          {t('settings.skyCultureLanguageDescription')}
        </p>
      </SettingsSection>

      <Separator />

      <SettingsSection
        title={t('settings.skySurveys')}
        icon={<Palette className="h-4 w-4" />}
        defaultOpen={false}
      >
        <StellariumSurveySelector
          surveyEnabled={localSettings.surveyEnabled}
          surveyId={localSettings.surveyId}
          surveyUrl={localSettings.surveyUrl}
          onSurveyChange={onSurveyChange}
          onSurveyToggle={onSurveyToggle}
        />
      </SettingsSection>

      <Separator />

      <SettingsSection
        title={t('sourceConfig.title')}
        icon={<Database className="h-4 w-4" />}
        defaultOpen={false}
      >
        <ObjectInfoSourcesConfig />
      </SettingsSection>

      <Separator />

      <SettingsSection
        title={t('settings.help')}
        icon={<AlertCircle className="h-4 w-4" />}
        defaultOpen={false}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm">{t('onboarding.restartTour')}</Label>
              <p className="text-xs text-muted-foreground">
                {t('settings.restartTourDescription')}
              </p>
            </div>
            <TourRestartButton />
          </div>
        </div>
      </SettingsSection>
    </div>
  );
}
