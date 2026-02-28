'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEquipmentStore } from '@/lib/stores';
import { ToggleItem } from './settings-shared';
import {
  TRACKING_OPTIONS,
  TARGET_TYPE_OPTIONS,
  BINNING_OPTIONS,
  FILTER_OPTIONS,
  GAIN_STRATEGY_OPTIONS,
} from './settings-constants';

export function ExposureSettings() {
  const t = useTranslations();
  const { exposureDefaults, setExposureDefaults } = useEquipmentStore();
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="space-y-4">
      {/* Exposure Time */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm">{t('exposure.defaultExposure')}</Label>
          <span className="text-xs text-muted-foreground font-mono">{exposureDefaults.exposureTime}s</span>
        </div>
        <ToggleGroup
          type="single"
          value={String(exposureDefaults.exposureTime)}
          onValueChange={(value) => { if (value) setExposureDefaults({ exposureTime: Number(value) }); }}
          className="flex gap-1 flex-wrap"
        >
          {[30, 60, 120, 180, 300, 600].map((time) => (
            <ToggleGroupItem
              key={time}
              value={String(time)}
              size="sm"
              className="h-7 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              {time}s
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <Separator />

      {/* Gain & Offset */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">{t('exposure.gain')}</Label>
          <Input
            type="number"
            min={0}
            value={exposureDefaults.gain}
            onChange={(e) => setExposureDefaults({ gain: Math.max(0, parseInt(e.target.value) || 0) })}
            className="h-8"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{t('exposure.offset')}</Label>
          <Input
            type="number"
            min={0}
            value={exposureDefaults.offset}
            onChange={(e) => setExposureDefaults({ offset: Math.max(0, parseInt(e.target.value) || 0) })}
            className="h-8"
          />
        </div>
      </div>

      {/* Binning */}
      <div className="space-y-2">
        <Label className="text-sm">{t('exposure.binning')}</Label>
        <ToggleGroup
          type="single"
          value={exposureDefaults.binning}
          onValueChange={(value) => { if (value) setExposureDefaults({ binning: value as typeof exposureDefaults.binning }); }}
          className="flex gap-1 w-full"
        >
          {BINNING_OPTIONS.map((b) => (
            <ToggleGroupItem
              key={b}
              value={b}
              size="sm"
              className="flex-1 h-7 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              {b}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {/* Filter */}
      <div className="space-y-2">
        <Label className="text-sm">{t('exposure.filter')}</Label>
        <Select
          value={exposureDefaults.filter}
          onValueChange={(v) => setExposureDefaults({ filter: v })}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FILTER_OPTIONS.map((f) => (
              <SelectItem key={f.id} value={f.id}>{t(f.nameKey)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Frame Count */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm">{t('exposure.defaultFrameCount')}</Label>
          <span className="text-xs text-muted-foreground font-mono">{exposureDefaults.frameCount}</span>
        </div>
        <Slider
          value={[exposureDefaults.frameCount]}
          onValueChange={([v]) => setExposureDefaults({ frameCount: v })}
          min={1}
          max={200}
          step={1}
        />
      </div>

      {/* Dither */}
      <ToggleItem
        id="dither-enabled"
        label={t('exposure.dither')}
        description={t('exposure.ditherDescription')}
        checked={exposureDefaults.ditherEnabled}
        onCheckedChange={(checked) => setExposureDefaults({ ditherEnabled: checked })}
      />
      {exposureDefaults.ditherEnabled && (
        <div className="flex items-center gap-2 px-3">
          <Label className="text-xs text-muted-foreground">{t('exposure.ditherEvery')}</Label>
          <Input
            type="number"
            value={exposureDefaults.ditherEvery}
            onChange={(e) => setExposureDefaults({ ditherEvery: Math.max(1, parseInt(e.target.value) || 1) })}
            className="h-7 w-12 text-center text-xs"
            min={1}
          />
        </div>
      )}

      <Separator />

      {/* Bortle Scale */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm">{t('exposure.defaultBortle')}</Label>
          <Badge variant="outline" className="font-mono">{exposureDefaults.bortle}</Badge>
        </div>
        <Slider
          value={[exposureDefaults.bortle]}
          onValueChange={([v]) => setExposureDefaults({ bortle: v })}
          min={1}
          max={9}
          step={1}
        />
      </div>

      <Separator />

      {/* Tracking Type */}
      <div className="space-y-2">
        <Label className="text-sm">{t('exposure.tracking')}</Label>
        <ToggleGroup
          type="single"
          value={exposureDefaults.tracking}
          onValueChange={(value) => { if (value) setExposureDefaults({ tracking: value as typeof exposureDefaults.tracking }); }}
          className="flex gap-1 w-full"
        >
          {TRACKING_OPTIONS.map(({ value, labelKey }) => (
            <ToggleGroupItem
              key={value}
              value={value}
              size="sm"
              className="flex-1 h-7 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              {t(labelKey)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {/* Target Type */}
      <div className="space-y-2">
        <Label className="text-sm">{t('exposure.targetType')}</Label>
        <ToggleGroup
          type="single"
          value={exposureDefaults.targetType}
          onValueChange={(value) => { if (value) setExposureDefaults({ targetType: value as typeof exposureDefaults.targetType }); }}
          className="grid grid-cols-2 gap-1 w-full"
        >
          {TARGET_TYPE_OPTIONS.map(({ value, labelKey }) => (
            <ToggleGroupItem
              key={value}
              value={value}
              size="sm"
              className="h-7 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              {t(labelKey)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <Separator />

      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between h-8">
            <span className="text-sm">{t('exposure.advancedModelDefaults')}</span>
            {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">{t('exposure.readNoiseLimitPercent')}</Label>
              <div className="flex items-center gap-2">
                <Slider
                  value={[exposureDefaults.readNoiseLimitPercent ?? 5]}
                  onValueChange={([v]) => setExposureDefaults({ readNoiseLimitPercent: Math.max(2, Math.min(20, v)) })}
                  min={2}
                  max={20}
                  step={1}
                />
                <Badge variant="outline" className="min-w-10 justify-center">
                  {exposureDefaults.readNoiseLimitPercent ?? 5}%
                </Badge>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t('exposure.filterBandwidthNm')}</Label>
              <Input
                type="number"
                value={exposureDefaults.filterBandwidthNm ?? 300}
                onChange={(e) =>
                  setExposureDefaults({
                    filterBandwidthNm: Math.max(2, Math.min(300, parseFloat(e.target.value) || 300)),
                  })
                }
                className="h-8"
                min={2}
                max={300}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t('exposure.gainStrategy')}</Label>
              <Select
                value={exposureDefaults.gainStrategy ?? 'unity'}
                onValueChange={(v) => setExposureDefaults({ gainStrategy: v as typeof exposureDefaults.gainStrategy })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GAIN_STRATEGY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {t(option.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t('exposure.manualGain')}</Label>
              <Input
                type="number"
                value={exposureDefaults.manualGain ?? 100}
                onChange={(e) => setExposureDefaults({ manualGain: Math.max(0, parseInt(e.target.value) || 0) })}
                className="h-8"
                min={0}
                max={300}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t('exposure.sqmOverride')}</Label>
              <Input
                type="number"
                value={exposureDefaults.sqmOverride ?? ''}
                onChange={(e) => {
                  const raw = e.target.value.trim();
                  setExposureDefaults({ sqmOverride: raw === '' ? undefined : parseFloat(raw) || undefined });
                }}
                className="h-8"
                placeholder="Auto"
                step={0.01}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t('exposure.targetSurfaceBrightness')}</Label>
              <Input
                type="number"
                value={exposureDefaults.targetSurfaceBrightness ?? 22}
                onChange={(e) =>
                  setExposureDefaults({
                    targetSurfaceBrightness: Math.max(10, Math.min(30, parseFloat(e.target.value) || 22)),
                  })
                }
                className="h-8"
                step={0.1}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t('exposure.targetSignalRate')}</Label>
              <Input
                type="number"
                value={exposureDefaults.targetSignalRate ?? 0}
                onChange={(e) =>
                  setExposureDefaults({
                    targetSignalRate: Math.max(0, parseFloat(e.target.value) || 0),
                  })
                }
                className="h-8"
                step={0.01}
              />
            </div>
          </div>

          <ToggleItem
            id="manual-read-noise"
            label={t('exposure.manualCameraNoise')}
            description={t('exposure.manualCameraNoiseDescription')}
            checked={exposureDefaults.manualReadNoiseEnabled ?? false}
            onCheckedChange={(checked) => setExposureDefaults({ manualReadNoiseEnabled: checked })}
          />

          {Boolean(exposureDefaults.manualReadNoiseEnabled) && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{t('exposure.readNoiseE')}</Label>
                <Input
                  type="number"
                  value={exposureDefaults.manualReadNoise ?? 1.8}
                  onChange={(e) => setExposureDefaults({ manualReadNoise: Math.max(0.1, parseFloat(e.target.value) || 0.1) })}
                  className="h-8"
                  step={0.1}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t('exposure.darkCurrentE')}</Label>
                <Input
                  type="number"
                  value={exposureDefaults.manualDarkCurrent ?? 0.002}
                  onChange={(e) => setExposureDefaults({ manualDarkCurrent: Math.max(0, parseFloat(e.target.value) || 0) })}
                  className="h-8"
                  step={0.0001}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t('exposure.fullWellE')}</Label>
                <Input
                  type="number"
                  value={exposureDefaults.manualFullWell ?? 50000}
                  onChange={(e) => setExposureDefaults({ manualFullWell: Math.max(1000, parseFloat(e.target.value) || 1000) })}
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t('exposure.quantumEfficiency')}</Label>
                <Input
                  type="number"
                  value={exposureDefaults.manualQE ?? 0.8}
                  onChange={(e) => setExposureDefaults({ manualQE: Math.max(0.05, Math.min(1, parseFloat(e.target.value) || 0.8)) })}
                  className="h-8"
                  step={0.01}
                  min={0.05}
                  max={1}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t('exposure.ePerAdu')}</Label>
                <Input
                  type="number"
                  value={exposureDefaults.manualEPeraDu ?? 1}
                  onChange={(e) => setExposureDefaults({ manualEPeraDu: Math.max(0.1, parseFloat(e.target.value) || 0.1) })}
                  className="h-8"
                  step={0.01}
                />
              </div>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
