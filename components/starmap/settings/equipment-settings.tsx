'use client';

import { useTranslations } from 'next-intl';
import {
  RotateCw,
  Focus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { useEquipmentStore } from '@/lib/stores';
import { CameraSelector } from './camera-selector';
import { TelescopeSelector } from './telescope-selector';

export function EquipmentSettings() {
  const t = useTranslations();

  const rotationAngle = useEquipmentStore((s) => s.rotationAngle);
  const setRotationAngle = useEquipmentStore((s) => s.setRotationAngle);
  const getFOVWidth = useEquipmentStore((s) => s.getFOVWidth);
  const getFOVHeight = useEquipmentStore((s) => s.getFOVHeight);
  const getImageScale = useEquipmentStore((s) => s.getImageScale);
  const getFRatio = useEquipmentStore((s) => s.getFRatio);

  const fovWidth = getFOVWidth();
  const fovHeight = getFOVHeight();
  const imageScale = getImageScale();
  const fRatio = getFRatio();

  return (
    <div className="space-y-4">
      <CameraSelector />

      <Separator />

      <TelescopeSelector />

      <Separator />

      {/* Rotation Angle */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2 text-sm">
            <RotateCw className="h-4 w-4" />
            {t('fov.rotation')}
          </Label>
          <span className="text-xs text-muted-foreground font-mono">{rotationAngle.toFixed(1)}°</span>
        </div>
        <div className="flex gap-2">
          <Slider
            value={[rotationAngle]}
            onValueChange={([v]) => setRotationAngle(v)}
            min={-180}
            max={180}
            step={0.5}
            className="flex-1"
          />
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2"
            onClick={() => setRotationAngle(0)}
          >
            {t('common.reset')}
          </Button>
        </div>
      </div>

      <Separator />

      {/* Calculated FOV Info */}
      <div className="p-3 rounded-lg bg-muted/30 space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Focus className="h-4 w-4" />
          {t('fov.calculatedFOV')}
        </Label>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('fov.fieldWidth')}</span>
            <span className="font-mono">{fovWidth.toFixed(2)}°</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('fov.fieldHeight')}</span>
            <span className="font-mono">{fovHeight.toFixed(2)}°</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('fov.imageScale')}</span>
            <span className="font-mono">{imageScale.toFixed(2)}&quot;/px</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('exposure.fRatio')}</span>
            <span className="font-mono">f/{fRatio.toFixed(1)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
