'use client';

import { useTranslations } from 'next-intl';
import { LayoutGrid, Grid3X3 } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { GRID_TYPE_OPTIONS, FRAME_COLORS, MAX_MOSAIC_ROWS, MAX_MOSAIC_COLS } from './settings-constants';

export function FOVSettings() {
  const t = useTranslations();
  const {
    fovDisplay,
    mosaic,
    setFOVDisplay,
    setFOVEnabled,
    setGridType,
    setMosaic,
    setMosaicEnabled,
    setMosaicGrid,
    setMosaicOverlap,
  } = useEquipmentStore();

  return (
    <div className="space-y-4">
      {/* Enable FOV Overlay */}
      <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
        <Label htmlFor="fov-enabled" className="text-sm cursor-pointer flex items-center gap-2">
          <LayoutGrid className="h-4 w-4" />
          {t('fov.showFovOverlay')}
        </Label>
        <Switch
          id="fov-enabled"
          checked={fovDisplay.enabled}
          onCheckedChange={setFOVEnabled}
        />
      </div>

      {/* Grid Type */}
      <div className="space-y-2">
        <Label className="text-sm">{t('fov.compositionGrid')}</Label>
        <div className="grid grid-cols-5 gap-1">
          {GRID_TYPE_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant={fovDisplay.gridType === option.value ? 'default' : 'outline'}
              size="sm"
              className="h-10 flex-col gap-0.5 text-xs"
              onClick={() => setGridType(option.value)}
            >
              <span className="text-base font-mono">{option.icon}</span>
              <span className="text-[10px]">{t(option.labelKey)}</span>
            </Button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Mosaic Settings */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2 text-sm">
            <Grid3X3 className="h-4 w-4" />
            {t('fov.enableMosaic')}
          </Label>
          <Switch
            checked={mosaic.enabled}
            onCheckedChange={setMosaicEnabled}
          />
        </div>
        
        {mosaic.enabled && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{t('fov.columns')}</Label>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setMosaicGrid(mosaic.rows, Math.max(1, mosaic.cols - 1))}
                    disabled={mosaic.cols <= 1}
                  >
                    -
                  </Button>
                  <Input
                    type="number"
                    value={mosaic.cols}
                    onChange={(e) => setMosaicGrid(mosaic.rows, Math.max(1, parseInt(e.target.value) || 1))}
                    className="h-7 w-12 text-center"
                    min={1}
                    max={MAX_MOSAIC_COLS}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setMosaicGrid(mosaic.rows, Math.min(MAX_MOSAIC_COLS, mosaic.cols + 1))}
                    disabled={mosaic.cols >= MAX_MOSAIC_COLS}
                  >
                    +
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{t('fov.rows')}</Label>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setMosaicGrid(Math.max(1, mosaic.rows - 1), mosaic.cols)}
                    disabled={mosaic.rows <= 1}
                  >
                    -
                  </Button>
                  <Input
                    type="number"
                    value={mosaic.rows}
                    onChange={(e) => setMosaicGrid(Math.max(1, parseInt(e.target.value) || 1), mosaic.cols)}
                    className="h-7 w-12 text-center"
                    min={1}
                    max={MAX_MOSAIC_ROWS}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setMosaicGrid(Math.min(MAX_MOSAIC_ROWS, mosaic.rows + 1), mosaic.cols)}
                    disabled={mosaic.rows >= MAX_MOSAIC_ROWS}
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">{t('fov.overlap')}</Label>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    {mosaic.overlap}{mosaic.overlapUnit === 'percent' ? '%' : 'px'}
                  </Badge>
                  <Select
                    value={mosaic.overlapUnit}
                    onValueChange={(v: 'percent' | 'pixels') => setMosaic({ ...mosaic, overlapUnit: v })}
                  >
                    <SelectTrigger className="h-7 w-16 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">%</SelectItem>
                      <SelectItem value="pixels">px</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Slider
                value={[mosaic.overlap]}
                onValueChange={([v]) => setMosaicOverlap(v)}
                min={0}
                max={mosaic.overlapUnit === 'percent' ? 50 : 500}
                step={mosaic.overlapUnit === 'percent' ? 5 : 50}
              />
            </div>
          </>
        )}
      </div>

      <Separator />

      {/* Display Options */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">{t('fov.displayOptions')}</Label>
        <div className="space-y-2">
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-muted-foreground">{t('fov.showCoordinateGrid')}</span>
            <Switch
              checked={fovDisplay.showCoordinateGrid}
              onCheckedChange={(checked) => setFOVDisplay({ showCoordinateGrid: checked })}
            />
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-muted-foreground">{t('fov.showDSOLabels')}</span>
            <Switch
              checked={fovDisplay.showDSOLabels}
              onCheckedChange={(checked) => setFOVDisplay({ showDSOLabels: checked })}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Overlay Opacity */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm">{t('fov.overlayOpacity')}</Label>
          <span className="text-xs text-muted-foreground font-mono">{fovDisplay.overlayOpacity}%</span>
        </div>
        <Slider
          value={[fovDisplay.overlayOpacity]}
          onValueChange={([v]) => setFOVDisplay({ overlayOpacity: v })}
          min={10}
          max={100}
          step={5}
        />
      </div>

      {/* Frame Color */}
      <div className="space-y-2">
        <Label className="text-sm">{t('fov.frameColor')}</Label>
        <div className="flex gap-1">
          {FRAME_COLORS.map((color) => (
            <Button
              key={color}
              variant="outline"
              size="icon"
              className={cn(
                "w-7 h-7 p-0 rounded-full",
                fovDisplay.frameColor === color && "ring-2 ring-primary ring-offset-2"
              )}
              style={{ backgroundColor: color }}
              onClick={() => setFOVDisplay({ frameColor: color })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
