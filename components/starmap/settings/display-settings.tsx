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
  Star,
  SunDim,
  Projector,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSatelliteStore, useSettingsStore } from '@/lib/stores';
import type { SkyCultureLanguage, StellariumProjection } from '@/lib/core/types';
import { StellariumSurveySelector } from './stellarium-survey-selector';
import { ObjectInfoSourcesConfig } from '../objects/object-info-sources-config';
import { SettingsSection, ToggleItem } from './settings-shared';
import { DISPLAY_SETTINGS, GRID_SETTINGS } from './settings-constants';

const PROJECTION_OPTIONS: { value: StellariumProjection; labelKey: string }[] = [
  { value: 'stereographic', labelKey: 'settings.projStereographic' },
  { value: 'perspective', labelKey: 'settings.projPerspective' },
  { value: 'fisheye', labelKey: 'settings.projFisheye' },
  { value: 'orthographic', labelKey: 'settings.projOrthographic' },
  { value: 'equal-area', labelKey: 'settings.projEqualArea' },
  { value: 'hammer', labelKey: 'settings.projHammer' },
  { value: 'mercator', labelKey: 'settings.projMercator' },
  { value: 'miller', labelKey: 'settings.projMiller' },
  { value: 'cylinder', labelKey: 'settings.projCylinder' },
  { value: 'sinusoidal', labelKey: 'settings.projSinusoidal' },
];

export function DisplaySettings() {
  const t = useTranslations();
  
  const stellarium = useSettingsStore((state) => state.stellarium);
  const toggleStellariumSetting = useSettingsStore((state) => state.toggleStellariumSetting);
  const setStellariumSetting = useSettingsStore((state) => state.setStellariumSetting);
  
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
            checked={stellarium[key] as boolean}
            onCheckedChange={() => toggleStellariumSetting(key)}
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
            checked={stellarium[key] as boolean}
            onCheckedChange={() => toggleStellariumSetting(key)}
          />
        ))}
      </SettingsSection>

      <Separator />

      <SettingsSection
        title={t('settings.rendering')}
        icon={<Star className="h-4 w-4" />}
        defaultOpen={false}
      >
        {/* Bortle Light Pollution Index */}
        <div className="space-y-1 py-2 px-3 rounded-lg bg-muted/30">
          <div className="flex items-center justify-between">
            <Label className="text-sm flex items-center gap-2">
              <SunDim className="h-4 w-4 text-amber-400" />
              {t('settings.bortleIndex')}
            </Label>
            <span className="text-sm font-mono text-primary">{stellarium.bortleIndex}</span>
          </div>
          <Slider
            value={[stellarium.bortleIndex]}
            onValueChange={([v]) => setStellariumSetting('bortleIndex', v)}
            min={1}
            max={9}
            step={1}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">{t('settings.bortleIndexDescription')}</p>
        </div>

        {/* Star Linear Scale */}
        <div className="space-y-1 py-2 px-3 rounded-lg bg-muted/30">
          <div className="flex items-center justify-between">
            <Label className="text-sm">{t('settings.starLinearScale')}</Label>
            <span className="text-xs font-mono text-muted-foreground">{stellarium.starLinearScale.toFixed(1)}</span>
          </div>
          <Slider
            value={[stellarium.starLinearScale * 10]}
            onValueChange={([v]) => setStellariumSetting('starLinearScale', v / 10)}
            min={1}
            max={20}
            step={1}
            className="w-full"
          />
        </div>

        {/* Star Relative Scale */}
        <div className="space-y-1 py-2 px-3 rounded-lg bg-muted/30">
          <div className="flex items-center justify-between">
            <Label className="text-sm">{t('settings.starRelativeScale')}</Label>
            <span className="text-xs font-mono text-muted-foreground">{stellarium.starRelativeScale.toFixed(1)}</span>
          </div>
          <Slider
            value={[stellarium.starRelativeScale * 10]}
            onValueChange={([v]) => setStellariumSetting('starRelativeScale', v / 10)}
            min={1}
            max={30}
            step={1}
            className="w-full"
          />
        </div>

        {/* Display Magnitude Limit */}
        <div className="space-y-1 py-2 px-3 rounded-lg bg-muted/30">
          <div className="flex items-center justify-between">
            <Label className="text-sm">{t('settings.displayLimitMag')}</Label>
            <span className="text-xs font-mono text-muted-foreground">
              {stellarium.displayLimitMag >= 99 ? t('settings.magNoLimit') : stellarium.displayLimitMag.toFixed(1)}
            </span>
          </div>
          <Slider
            value={[Math.min(stellarium.displayLimitMag, 20)]}
            onValueChange={([v]) => setStellariumSetting('displayLimitMag', v >= 20 ? 99 : v)}
            min={3}
            max={20}
            step={0.5}
            className="w-full"
          />
        </div>

        {/* Exposure Scale */}
        <div className="space-y-1 py-2 px-3 rounded-lg bg-muted/30">
          <div className="flex items-center justify-between">
            <Label className="text-sm">{t('settings.exposureScale')}</Label>
            <span className="text-xs font-mono text-muted-foreground">{stellarium.exposureScale.toFixed(1)}</span>
          </div>
          <Slider
            value={[stellarium.exposureScale * 10]}
            onValueChange={([v]) => setStellariumSetting('exposureScale', v / 10)}
            min={1}
            max={50}
            step={1}
            className="w-full"
          />
        </div>
      </SettingsSection>

      <Separator />

      <SettingsSection
        title={t('settings.projection')}
        icon={<Projector className="h-4 w-4" />}
        defaultOpen={false}
      >
        <Select
          value={stellarium.projectionType}
          onValueChange={(v: StellariumProjection) => setStellariumSetting('projectionType', v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PROJECTION_OPTIONS.map(({ value, labelKey }) => (
              <SelectItem key={value} value={value}>{t(labelKey)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground px-1">{t('settings.projectionDescription')}</p>
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
            checked={stellarium.nightMode}
            onCheckedChange={() => toggleStellariumSetting('nightMode')}
          />
        </div>
        <ToggleItem
          id="flip-vertical"
          label={t('settings.flipViewVertical')}
          checked={stellarium.flipViewVertical}
          onCheckedChange={() => toggleStellariumSetting('flipViewVertical')}
        />
        <ToggleItem
          id="flip-horizontal"
          label={t('settings.flipViewHorizontal')}
          checked={stellarium.flipViewHorizontal}
          onCheckedChange={() => toggleStellariumSetting('flipViewHorizontal')}
        />
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
            checked={stellarium.sensorControl}
            onCheckedChange={() => toggleStellariumSetting('sensorControl')}
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
          value={stellarium.skyCultureLanguage}
          onValueChange={(v: SkyCultureLanguage) => setStellariumSetting('skyCultureLanguage', v)}
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
          surveyEnabled={stellarium.surveyEnabled}
          surveyId={stellarium.surveyId}
          surveyUrl={stellarium.surveyUrl}
          onSurveyChange={(surveyId: string, surveyUrl?: string) => {
            setStellariumSetting('surveyId', surveyId);
            if (surveyUrl !== undefined) setStellariumSetting('surveyUrl', surveyUrl);
          }}
          onSurveyToggle={(enabled: boolean) => setStellariumSetting('surveyEnabled', enabled)}
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

    </div>
  );
}
