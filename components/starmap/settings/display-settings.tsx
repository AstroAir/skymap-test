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
  Telescope,
  Layers,
  Crosshair,
  Image as ImageIcon,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
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
import { useSatelliteStore, useSettingsStore } from '@/lib/stores';
import type { SkyCultureLanguage, StellariumProjection, SkyEngineType, AladinCooFrameSetting, AladinColormap } from '@/lib/core/types';
import { cn } from '@/lib/utils';
import { StellariumSurveySelector } from './stellarium-survey-selector';
import { ObjectInfoSourcesConfig } from '../objects/object-info-sources-config';
import { SettingsSection, ToggleItem } from './settings-shared';
import { DISPLAY_SETTINGS, GRID_SETTINGS } from './settings-constants';
import { AladinCatalogSettings } from './aladin-catalog-settings';
import { AladinOverlaySettings } from './aladin-overlay-settings';
import { AladinMocSettings } from './aladin-moc-settings';
import { AladinFitsSettings } from './aladin-fits-settings';

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

const MOUNT_FRAME_OPTIONS = [
  { value: 0, labelKey: 'settings.mountFrameAstrom' },
  { value: 1, labelKey: 'settings.mountFrameIcrf' },
  { value: 2, labelKey: 'settings.mountFrameCirs' },
  { value: 3, labelKey: 'settings.mountFrameJnow' },
  { value: 4, labelKey: 'settings.mountFrameObservedGeom' },
  { value: 5, labelKey: 'settings.mountFrameObserved' },
  { value: 6, labelKey: 'settings.mountFrameMount' },
  { value: 7, labelKey: 'settings.mountFrameView' },
  { value: 8, labelKey: 'settings.mountFrameEcliptic' },
] as const;

export function DisplaySettings() {
  const t = useTranslations();
  
  const skyEngine = useSettingsStore((state) => state.skyEngine);
  const setSkyEngine = useSettingsStore((state) => state.setSkyEngine);
  const stellarium = useSettingsStore((state) => state.stellarium);
  const toggleStellariumSetting = useSettingsStore((state) => state.toggleStellariumSetting);
  const setStellariumSetting = useSettingsStore((state) => state.setStellariumSetting);
  const isStellarium = skyEngine === 'stellarium';
  const isAladin = skyEngine === 'aladin';
  
  const aladinDisplay = useSettingsStore((state) => state.aladinDisplay);
  const setAladinDisplaySetting = useSettingsStore((state) => state.setAladinDisplaySetting);
  const toggleAladinDisplaySetting = useSettingsStore((state) => state.toggleAladinDisplaySetting);
  
  const showSatellites = useSatelliteStore((state) => state.showSatellites);
  const showSatelliteLabels = useSatelliteStore((state) => state.showLabels);
  const showSatelliteOrbits = useSatelliteStore((state) => state.showOrbits);
  const setShowSatellites = useSatelliteStore((state) => state.setShowSatellites);
  const setShowSatelliteLabels = useSatelliteStore((state) => state.setShowLabels);
  const setShowSatelliteOrbits = useSatelliteStore((state) => state.setShowOrbits);

  return (
    <div className="p-4 space-y-4">
      {/* Sky Engine Switcher */}
      <SettingsSection
        title={t('settings.skyEngineSwitchTitle')}
        icon={<Layers className="h-4 w-4" />}
        defaultOpen={true}
      >
        <div className="grid grid-cols-2 gap-2">
          {(['stellarium', 'aladin'] as SkyEngineType[]).map((engine) => (
            <button
              key={engine}
              onClick={() => setSkyEngine(engine)}
              className={cn(
                'flex flex-col items-center gap-1.5 p-3 rounded-lg border text-xs transition-all',
                skyEngine === engine
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-muted bg-muted/30 text-muted-foreground hover:bg-muted/50'
              )}
            >
              {engine === 'stellarium' ? (
                <Telescope className="h-5 w-5" />
              ) : (
                <Globe className="h-5 w-5" />
              )}
              <span className="font-medium">
                {engine === 'stellarium' ? t('settings.skyEngineStellarium') : t('settings.skyEngineAladin')}
              </span>
              <span className="text-[10px] text-muted-foreground text-center leading-tight">
                {engine === 'stellarium' ? t('settings.stellariumDesc') : t('settings.aladinDesc')}
              </span>
            </button>
          ))}
        </div>
      </SettingsSection>

      <Separator />

      {/* Stellarium-only: Display toggles */}
      {isStellarium && (
        <>
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
        </>
      )}

      {/* Stellarium-only: Rendering settings */}
      {isStellarium && (
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

        {/* Tonemapper P */}
        <div className="space-y-1 py-2 px-3 rounded-lg bg-muted/30">
          <div className="flex items-center justify-between">
            <Label className="text-sm">{t('settings.tonemapperP')}</Label>
            <span className="text-xs font-mono text-muted-foreground">{stellarium.tonemapperP.toFixed(2)}</span>
          </div>
          <Slider
            value={[stellarium.tonemapperP * 100]}
            onValueChange={([v]) => setStellariumSetting('tonemapperP', v / 100)}
            min={0}
            max={200}
            step={1}
            className="w-full"
          />
        </div>
      </SettingsSection>
      )}

      {/* Stellarium-only: Projection & View Modes */}
      {isStellarium && (
        <>
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

            <div className="space-y-1 py-2 px-3 rounded-lg bg-muted/30">
              <div className="flex items-center justify-between">
                <Label className="text-sm">{t('settings.viewYOffset')}</Label>
                <span className="text-xs font-mono text-muted-foreground">{stellarium.viewYOffset.toFixed(2)}</span>
              </div>
              <Slider
                value={[stellarium.viewYOffset * 100]}
                onValueChange={([v]) => setStellariumSetting('viewYOffset', v / 100)}
                min={-100}
                max={100}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-1 py-2 px-3 rounded-lg bg-muted/30">
              <Label className="text-sm">{t('settings.mountFrame')}</Label>
              <Select
                value={String(stellarium.mountFrame)}
                onValueChange={(v) => setStellariumSetting('mountFrame', Number(v) as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MOUNT_FRAME_OPTIONS.map(({ value, labelKey }) => (
                    <SelectItem key={value} value={String(value)}>{t(labelKey)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
            <ToggleItem
              id="sensor-absolute-preferred"
              label={t('settings.sensorAbsolutePreferred')}
              checked={stellarium.sensorAbsolutePreferred}
              onCheckedChange={() => toggleStellariumSetting('sensorAbsolutePreferred')}
            />
            <ToggleItem
              id="sensor-compass-heading"
              label={t('settings.sensorUseCompassHeading')}
              checked={stellarium.sensorUseCompassHeading}
              onCheckedChange={() => toggleStellariumSetting('sensorUseCompassHeading')}
            />
            <div className="space-y-1 py-1 px-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">{t('settings.sensorUpdateRate')}</Label>
                <span className="text-xs text-muted-foreground">{stellarium.sensorUpdateHz} Hz</span>
              </div>
              <Slider
                value={[stellarium.sensorUpdateHz]}
                min={10}
                max={60}
                step={1}
                onValueChange={([value]) => setStellariumSetting('sensorUpdateHz', value)}
              />
            </div>
            <div className="space-y-1 py-1 px-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">{t('settings.sensorSmoothingFactor')}</Label>
                <span className="text-xs text-muted-foreground">{stellarium.sensorSmoothingFactor.toFixed(2)}</span>
              </div>
              <Slider
                value={[stellarium.sensorSmoothingFactor]}
                min={0.05}
                max={0.9}
                step={0.05}
                onValueChange={([value]) => setStellariumSetting('sensorSmoothingFactor', value)}
              />
            </div>
            <div className="space-y-1 py-1 px-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">{t('settings.sensorDeadbandDeg')}</Label>
                <span className="text-xs text-muted-foreground">{stellarium.sensorDeadbandDeg.toFixed(2)}°</span>
              </div>
              <Slider
                value={[stellarium.sensorDeadbandDeg]}
                min={0.05}
                max={2}
                step={0.05}
                onValueChange={([value]) => setStellariumSetting('sensorDeadbandDeg', value)}
              />
            </div>
            <div className="px-3 py-2 rounded-lg bg-muted/30 space-y-2">
              <p className="text-xs text-muted-foreground">
                {stellarium.sensorCalibrationRequired
                  ? t('settings.sensorCalibrationRequired')
                  : `${t('settings.sensorCalibrationUpdated')}: ${stellarium.sensorCalibrationUpdatedAt ? new Date(stellarium.sensorCalibrationUpdatedAt).toLocaleString() : '--'}`}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setStellariumSetting('sensorCalibrationRequired', true)}
                >
                  {t('settings.sensorRecalibrate')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setStellariumSetting('sensorCalibrationRequired', true);
                    setStellariumSetting('sensorCalibrationAzimuthOffsetDeg', 0);
                    setStellariumSetting('sensorCalibrationAltitudeOffsetDeg', 0);
                    setStellariumSetting('sensorCalibrationUpdatedAt', null);
                  }}
                >
                  {t('settings.sensorResetCalibration')}
                </Button>
              </div>
            </div>
            <div className="space-y-1 py-1 px-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">{t('settings.arOpacity')}</Label>
                <span className="text-xs text-muted-foreground">{(stellarium.arOpacity * 100).toFixed(0)}%</span>
              </div>
              <Slider
                value={[stellarium.arOpacity]}
                min={0.1}
                max={1}
                step={0.05}
                onValueChange={([value]) => setStellariumSetting('arOpacity', value)}
              />
            </div>
            <ToggleItem
              id="ar-show-compass"
              label={t('settings.arShowCompass')}
              checked={stellarium.arShowCompass}
              onCheckedChange={() => toggleStellariumSetting('arShowCompass')}
            />
          </SettingsSection>
        </>
      )}

      {/* Aladin-only: Display settings */}
      {isAladin && (
        <>
          <Separator />

          <SettingsSection
            title={t('settings.aladinCoordinateGrid')}
            icon={<Grid3X3 className="h-4 w-4" />}
            defaultOpen={false}
          >
            <ToggleItem
              id="aladin-coo-grid"
              label={t('settings.aladinShowCooGrid')}
              checked={aladinDisplay.showCooGrid}
              onCheckedChange={() => toggleAladinDisplaySetting('showCooGrid')}
            />
            {aladinDisplay.showCooGrid && (
              <div className="space-y-2 pl-2">
                <div className="space-y-1 py-1">
                  <Label className="text-xs text-muted-foreground">{t('settings.aladinGridOpacity')}</Label>
                  <Slider
                    value={[aladinDisplay.cooGridOpacity]}
                    min={0.1}
                    max={1}
                    step={0.1}
                    onValueChange={([v]) => setAladinDisplaySetting('cooGridOpacity', v)}
                  />
                </div>
              </div>
            )}
          </SettingsSection>

          <Separator />

          <SettingsSection
            title={t('settings.aladinReticle')}
            icon={<Crosshair className="h-4 w-4" />}
            defaultOpen={false}
          >
            <ToggleItem
              id="aladin-reticle"
              label={t('settings.aladinShowReticle')}
              checked={aladinDisplay.showReticle}
              onCheckedChange={() => toggleAladinDisplaySetting('showReticle')}
            />
          </SettingsSection>

          <Separator />

          <SettingsSection
            title={t('settings.aladinCoordinateFrame')}
            icon={<Globe className="h-4 w-4" />}
            defaultOpen={false}
          >
            <Select
              value={aladinDisplay.cooFrame}
              onValueChange={(v: AladinCooFrameSetting) => setAladinDisplaySetting('cooFrame', v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ICRSd">{t('settings.aladinFrameICRS')}</SelectItem>
                <SelectItem value="galactic">{t('settings.aladinFrameGalactic')}</SelectItem>
              </SelectContent>
            </Select>
          </SettingsSection>

          <Separator />

          <SettingsSection
            title={t('settings.aladinImageAdjustments')}
            icon={<ImageIcon className="h-4 w-4" />}
            defaultOpen={false}
          >
            {/* Colormap */}
            <div className="space-y-1 py-1">
              <Label className="text-xs text-muted-foreground">{t('settings.aladinColormap')}</Label>
              <Select
                value={aladinDisplay.colormap}
                onValueChange={(v: AladinColormap) => setAladinDisplaySetting('colormap', v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="native">{t('settings.aladinColormapNative')}</SelectItem>
                  <SelectItem value="grayscale">Grayscale</SelectItem>
                  <SelectItem value="viridis">Viridis</SelectItem>
                  <SelectItem value="plasma">Plasma</SelectItem>
                  <SelectItem value="inferno">Inferno</SelectItem>
                  <SelectItem value="magma">Magma</SelectItem>
                  <SelectItem value="cubehelix">Cubehelix</SelectItem>
                  <SelectItem value="rainbow">Rainbow</SelectItem>
                  <SelectItem value="rdbu">RdBu</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Brightness */}
            <div className="space-y-1 py-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">{t('settings.aladinBrightness')}</Label>
                <span className="text-xs text-muted-foreground">{aladinDisplay.brightness.toFixed(1)}</span>
              </div>
              <Slider
                value={[aladinDisplay.brightness]}
                min={-1}
                max={1}
                step={0.1}
                onValueChange={([v]) => setAladinDisplaySetting('brightness', v)}
              />
            </div>

            {/* Contrast */}
            <div className="space-y-1 py-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">{t('settings.aladinContrast')}</Label>
                <span className="text-xs text-muted-foreground">{aladinDisplay.contrast.toFixed(1)}</span>
              </div>
              <Slider
                value={[aladinDisplay.contrast]}
                min={0}
                max={3}
                step={0.1}
                onValueChange={([v]) => setAladinDisplaySetting('contrast', v)}
              />
            </div>

            {/* Saturation */}
            <div className="space-y-1 py-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">{t('settings.aladinSaturation')}</Label>
                <span className="text-xs text-muted-foreground">{aladinDisplay.saturation.toFixed(1)}</span>
              </div>
              <Slider
                value={[aladinDisplay.saturation]}
                min={0}
                max={3}
                step={0.1}
                onValueChange={([v]) => setAladinDisplaySetting('saturation', v)}
              />
            </div>

            {/* Gamma */}
            <div className="space-y-1 py-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">{t('settings.aladinGamma')}</Label>
                <span className="text-xs text-muted-foreground">{aladinDisplay.gamma.toFixed(1)}</span>
              </div>
              <Slider
                value={[aladinDisplay.gamma]}
                min={0.1}
                max={5}
                step={0.1}
                onValueChange={([v]) => setAladinDisplaySetting('gamma', v)}
              />
            </div>
          </SettingsSection>

          <Separator />
          <AladinCatalogSettings />

          <Separator />
          <AladinOverlaySettings />

          <Separator />
          <AladinMocSettings />

          <Separator />
          <AladinFitsSettings />

          <div className="rounded-lg bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            {t('settings.aladinAttribution')}
            {' '}
            <a
              href="https://aladin.cds.unistra.fr/AladinLite/"
              target="_blank"
              rel="noreferrer"
              className="text-primary underline"
            >
              Aladin Lite
            </a>
          </div>
        </>
      )}

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

      {/* Stellarium-only: Sky Culture Language */}
      {isStellarium && (
        <>
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
        </>
      )}

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
