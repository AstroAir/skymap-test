'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEquipmentStore } from '@/lib/stores';
import {
  TRACKING_OPTIONS,
  TARGET_TYPE_OPTIONS,
  BINNING_OPTIONS,
  FILTER_OPTIONS,
} from './settings-constants';

export function ExposureSettings() {
  const t = useTranslations();
  const { exposureDefaults, setExposureDefaults } = useEquipmentStore();

  return (
    <div className="space-y-4">
      {/* Exposure Time */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm">{t('exposure.defaultExposure')}</Label>
          <span className="text-xs text-muted-foreground font-mono">{exposureDefaults.exposureTime}s</span>
        </div>
        <div className="flex gap-1 flex-wrap">
          {[30, 60, 120, 180, 300, 600].map((time) => (
            <Button
              key={time}
              variant={exposureDefaults.exposureTime === time ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setExposureDefaults({ exposureTime: time })}
            >
              {time}s
            </Button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Gain & Offset */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">{t('exposure.gain')}</Label>
          <Input
            type="number"
            value={exposureDefaults.gain}
            onChange={(e) => setExposureDefaults({ gain: parseInt(e.target.value) || 0 })}
            className="h-8"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{t('exposure.offset')}</Label>
          <Input
            type="number"
            value={exposureDefaults.offset}
            onChange={(e) => setExposureDefaults({ offset: parseInt(e.target.value) || 0 })}
            className="h-8"
          />
        </div>
      </div>

      {/* Binning */}
      <div className="space-y-2">
        <Label className="text-sm">{t('exposure.binning')}</Label>
        <div className="flex gap-1">
          {BINNING_OPTIONS.map((b) => (
            <Button
              key={b}
              variant={exposureDefaults.binning === b ? 'default' : 'outline'}
              size="sm"
              className="flex-1 h-7 text-xs"
              onClick={() => setExposureDefaults({ binning: b })}
            >
              {b}
            </Button>
          ))}
        </div>
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
              <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
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
      <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
        <div className="space-y-0.5">
          <Label htmlFor="dither-enabled" className="text-sm cursor-pointer">{t('exposure.dither')}</Label>
          <p className="text-[10px] text-muted-foreground">{t('exposure.ditherDescription')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="dither-enabled"
            checked={exposureDefaults.ditherEnabled}
            onCheckedChange={(checked) => setExposureDefaults({ ditherEnabled: checked })}
          />
          {exposureDefaults.ditherEnabled && (
            <Input
              type="number"
              value={exposureDefaults.ditherEvery}
              onChange={(e) => setExposureDefaults({ ditherEvery: Math.max(1, parseInt(e.target.value) || 1) })}
              className="h-7 w-12 text-center text-xs"
              min={1}
            />
          )}
        </div>
      </div>

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
        <div className="flex gap-1">
          {TRACKING_OPTIONS.map(({ value, labelKey }) => (
            <Button
              key={value}
              variant={exposureDefaults.tracking === value ? 'default' : 'outline'}
              size="sm"
              className="flex-1 h-7 text-xs"
              onClick={() => setExposureDefaults({ tracking: value })}
            >
              {t(labelKey)}
            </Button>
          ))}
        </div>
      </div>

      {/* Target Type */}
      <div className="space-y-2">
        <Label className="text-sm">{t('exposure.targetType')}</Label>
        <div className="grid grid-cols-2 gap-1">
          {TARGET_TYPE_OPTIONS.map(({ value, labelKey }) => (
            <Button
              key={value}
              variant={exposureDefaults.targetType === value ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setExposureDefaults({ targetType: value })}
            >
              {t(labelKey)}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
