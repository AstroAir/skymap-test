'use client';

import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import {
  Globe,
  Clock,
  Ruler,
  Thermometer,
  MapPin,
  Power,
  XCircle,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSettingsStore } from '@/lib/stores';
import type {
  AppLocale,
  TimeFormat,
  DateFormat,
  CoordinateFormat,
  DistanceUnit,
  TemperatureUnit,
  StartupView,
} from '@/lib/stores/settings-store';
import { SettingsSection, ToggleItem } from './settings-shared';

export function GeneralSettings() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  
  const preferences = useSettingsStore((state) => state.preferences);
  const setPreference = useSettingsStore((state) => state.setPreference);

  const handleLocaleChange = (locale: AppLocale) => {
    setPreference('locale', locale);
    // Navigate to the new locale path
    const segments = pathname.split('/').filter(Boolean);
    if (segments[0] === 'en' || segments[0] === 'zh') {
      segments[0] = locale;
    } else {
      segments.unshift(locale);
    }
    router.push('/' + segments.join('/'));
  };

  return (
    <div className="space-y-4">
      {/* Language */}
      <SettingsSection
        title={t('settingsNew.general.language')}
        icon={<Globe className="h-4 w-4" />}
        defaultOpen={true}
      >
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            {t('settingsNew.general.appLanguage')}
          </Label>
          <Select
            value={preferences.locale}
            onValueChange={(v) => handleLocaleChange(v as AppLocale)}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">{t('settingsNew.general.languageEnglish')}</SelectItem>
              <SelectItem value="zh">{t('settingsNew.general.languageChinese')}</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {t('settingsNew.general.languageDescription')}
          </p>
        </div>
      </SettingsSection>

      <Separator />

      {/* Time & Date Format */}
      <SettingsSection
        title={t('settingsNew.general.timeDate')}
        icon={<Clock className="h-4 w-4" />}
        defaultOpen={false}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              {t('settingsNew.general.timeFormat')}
            </Label>
            <Select
              value={preferences.timeFormat}
              onValueChange={(v) => setPreference('timeFormat', v as TimeFormat)}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">{t('settingsNew.general.time24h')}</SelectItem>
                <SelectItem value="12h">{t('settingsNew.general.time12h')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              {t('settingsNew.general.dateFormat')}
            </Label>
            <Select
              value={preferences.dateFormat}
              onValueChange={(v) => setPreference('dateFormat', v as DateFormat)}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="iso">{t('settingsNew.general.dateFormatIso')}</SelectItem>
                <SelectItem value="us">{t('settingsNew.general.dateFormatUs')}</SelectItem>
                <SelectItem value="eu">{t('settingsNew.general.dateFormatEu')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SettingsSection>

      <Separator />

      {/* Coordinates Format */}
      <SettingsSection
        title={t('settingsNew.general.coordinates')}
        icon={<MapPin className="h-4 w-4" />}
        defaultOpen={false}
      >
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            {t('settingsNew.general.coordinateFormat')}
          </Label>
          <Select
            value={preferences.coordinateFormat}
            onValueChange={(v) => setPreference('coordinateFormat', v as CoordinateFormat)}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dms">{t('settingsNew.general.formatDMS')}</SelectItem>
              <SelectItem value="hms">{t('settingsNew.general.formatHMS')}</SelectItem>
              <SelectItem value="degrees">{t('settingsNew.general.formatDegrees')}</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {t('settingsNew.general.coordinateFormatDesc')}
          </p>
        </div>
      </SettingsSection>

      <Separator />

      {/* Units */}
      <SettingsSection
        title={t('settingsNew.general.units')}
        icon={<Ruler className="h-4 w-4" />}
        defaultOpen={false}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              {t('settingsNew.general.distanceUnit')}
            </Label>
            <Select
              value={preferences.distanceUnit}
              onValueChange={(v) => setPreference('distanceUnit', v as DistanceUnit)}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="metric">{t('settingsNew.general.metric')}</SelectItem>
                <SelectItem value="imperial">{t('settingsNew.general.imperial')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-muted-foreground" />
              <Label className="text-xs text-muted-foreground">
                {t('settingsNew.general.temperatureUnit')}
              </Label>
            </div>
            <Select
              value={preferences.temperatureUnit}
              onValueChange={(v) => setPreference('temperatureUnit', v as TemperatureUnit)}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="celsius">{t('settingsNew.general.celsius')}</SelectItem>
                <SelectItem value="fahrenheit">{t('settingsNew.general.fahrenheit')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SettingsSection>

      <Separator />

      {/* Startup Behavior */}
      <SettingsSection
        title={t('settingsNew.general.startup')}
        icon={<Power className="h-4 w-4" />}
        defaultOpen={false}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              {t('settingsNew.general.startupView')}
            </Label>
            <Select
              value={preferences.startupView}
              onValueChange={(v) => setPreference('startupView', v as StartupView)}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last">{t('settingsNew.general.startupViewLast')}</SelectItem>
                <SelectItem value="default">{t('settingsNew.general.startupViewDefault')}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {t('settingsNew.general.startupViewDesc')}
            </p>
          </div>

          <ToggleItem
            id="show-splash"
            label={t('settingsNew.general.showSplash')}
            description={t('settingsNew.general.showSplashDesc')}
            checked={preferences.showSplash}
            onCheckedChange={(checked) => setPreference('showSplash', checked)}
          />
          <ToggleItem
            id="auto-connect-backend"
            label={t('settingsNew.general.autoConnect')}
            description={t('settingsNew.general.autoConnectDesc')}
            checked={preferences.autoConnectBackend}
            onCheckedChange={(checked) => setPreference('autoConnectBackend', checked)}
          />
        </div>
      </SettingsSection>

      <Separator />

      {/* Close Confirmation */}
      <SettingsSection
        title={t('settingsNew.general.behavior')}
        icon={<XCircle className="h-4 w-4" />}
        defaultOpen={false}
      >
        <ToggleItem
          id="skip-close-confirmation"
          label={t('settingsNew.general.skipCloseConfirmation')}
          description={t('settingsNew.general.skipCloseConfirmationDesc')}
          checked={preferences.skipCloseConfirmation}
          onCheckedChange={(checked) => setPreference('skipCloseConfirmation', checked)}
        />
      </SettingsSection>
    </div>
  );
}
