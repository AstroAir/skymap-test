'use client';

import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import {
  Palette,
  Sun,
  Moon,
  Monitor,
  Check,
  Sparkles,
  Type,
  Circle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import {
  useThemeStore,
  themePresets,
  type ThemeCustomization,
} from '@/lib/stores/theme-store';
import { cn } from '@/lib/utils';
import { SettingsSection, ToggleItem } from './settings-shared';

export function AppearanceSettings() {
  const t = useTranslations();
  const { theme, setTheme, resolvedTheme } = useTheme();

  const {
    customization,
    setRadius,
    setFontFamily,
    setFontSize,
    setAnimationsEnabled,
    setActivePreset,
  } = useThemeStore();

  return (
    <div className="space-y-4">
      {/* Theme Mode */}
      <SettingsSection
        title={t('settingsNew.appearance.themeMode')}
        icon={<Palette className="h-4 w-4" />}
        defaultOpen={true}
      >
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          <Button
            variant={theme === 'light' ? 'default' : 'outline'}
            size="sm"
            className="flex-col gap-0.5 sm:gap-1 h-auto py-2 sm:py-3 px-1 sm:px-2"
            onClick={() => setTheme('light')}
          >
            <Sun className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="text-[10px] sm:text-xs">{t('settingsNew.appearance.light')}</span>
          </Button>
          <Button
            variant={theme === 'dark' ? 'default' : 'outline'}
            size="sm"
            className="flex-col gap-0.5 sm:gap-1 h-auto py-2 sm:py-3 px-1 sm:px-2"
            onClick={() => setTheme('dark')}
          >
            <Moon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="text-[10px] sm:text-xs">{t('settingsNew.appearance.dark')}</span>
          </Button>
          <Button
            variant={theme === 'system' ? 'default' : 'outline'}
            size="sm"
            className="flex-col gap-0.5 sm:gap-1 h-auto py-2 sm:py-3 px-1 sm:px-2"
            onClick={() => setTheme('system')}
          >
            <Monitor className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="text-[10px] sm:text-xs">{t('settingsNew.appearance.system')}</span>
          </Button>
        </div>
      </SettingsSection>

      <Separator />

      {/* Color Presets */}
      <SettingsSection
        title={t('settingsNew.appearance.colorPresets')}
        icon={<Sparkles className="h-4 w-4" />}
        defaultOpen={false}
      >
        <div className="grid grid-cols-2 gap-2">
          {themePresets.map((preset) => {
            const colors = resolvedTheme === 'dark' ? preset.colors.dark : preset.colors.light;
            const isActive = customization.activePreset === preset.id;

            return (
              <button
                key={preset.id}
                onClick={() => setActivePreset(isActive ? null : preset.id)}
                className={cn(
                  'relative flex items-center gap-2 rounded-lg border-2 p-2.5 transition-all hover:bg-accent/50 text-left',
                  isActive ? 'border-primary bg-accent/30' : 'border-border'
                )}
              >
                <div className="flex -space-x-1">
                  <div
                    className="h-4 w-4 rounded-full border border-background"
                    style={{ background: colors.primary }}
                  />
                  <div
                    className="h-4 w-4 rounded-full border border-background"
                    style={{ background: colors.secondary }}
                  />
                  <div
                    className="h-4 w-4 rounded-full border border-background"
                    style={{ background: colors.accent }}
                  />
                </div>
                <span className="text-sm font-medium flex-1">{preset.name}</span>
                {isActive && <Check className="h-4 w-4 text-primary" />}
              </button>
            );
          })}
        </div>
      </SettingsSection>

      <Separator />

      {/* Border Radius */}
      <SettingsSection
        title={t('settingsNew.appearance.borderRadius')}
        icon={<Circle className="h-4 w-4" />}
        defaultOpen={false}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t('settingsNew.appearance.roundness')}</span>
            <span className="text-sm text-muted-foreground font-mono">
              {customization.radius.toFixed(2)}rem
            </span>
          </div>
          <Slider
            value={[customization.radius]}
            onValueChange={([value]) => setRadius(value)}
            min={0}
            max={1}
            step={0.05}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{t('settingsNew.appearance.square')}</span>
            <span>{t('settingsNew.appearance.rounded')}</span>
          </div>
          <div className="flex gap-2 pt-1">
            <div
              className="h-10 w-10 bg-primary"
              style={{ borderRadius: `${customization.radius}rem` }}
            />
            <div
              className="h-10 flex-1 bg-muted border-2 border-border flex items-center justify-center text-xs"
              style={{ borderRadius: `${customization.radius}rem` }}
            >
              {t('settingsNew.appearance.preview')}
            </div>
          </div>
        </div>
      </SettingsSection>

      <Separator />

      {/* Typography */}
      <SettingsSection
        title={t('settingsNew.appearance.typography')}
        icon={<Type className="h-4 w-4" />}
        defaultOpen={false}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">{t('settingsNew.appearance.fontFamily')}</Label>
            <Select
              value={customization.fontFamily}
              onValueChange={(value) => setFontFamily(value as ThemeCustomization['fontFamily'])}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">{t('theme.fontDefault')}</SelectItem>
                <SelectItem value="serif">{t('theme.fontSerif')}</SelectItem>
                <SelectItem value="mono">{t('theme.fontMono')}</SelectItem>
                <SelectItem value="system">{t('theme.fontSystem')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">{t('settingsNew.appearance.fontSize')}</Label>
            <Select
              value={customization.fontSize}
              onValueChange={(value) => setFontSize(value as ThemeCustomization['fontSize'])}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">{t('theme.fontSizeSmall')}</SelectItem>
                <SelectItem value="default">{t('theme.fontSizeDefault')}</SelectItem>
                <SelectItem value="large">{t('theme.fontSizeLarge')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SettingsSection>

      <Separator />

      {/* Animations */}
      <ToggleItem
        id="enable-animations"
        label={t('settingsNew.appearance.enableAnimations')}
        description={t('settingsNew.appearance.enableAnimationsDesc')}
        checked={customization.animationsEnabled}
        onCheckedChange={setAnimationsEnabled}
      />
    </div>
  );
}
