'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Camera, Eye, Ruler, Focus, Grid3X3, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface MosaicSettings {
  enabled: boolean;
  rows: number;
  cols: number;
  overlap: number; // percentage 0-50
}

export type GridType = 'none' | 'crosshair' | 'thirds' | 'golden' | 'diagonal';

interface FOVSimulatorProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  sensorWidth: number;
  sensorHeight: number;
  focalLength: number;
  onSensorWidthChange: (width: number) => void;
  onSensorHeightChange: (height: number) => void;
  onFocalLengthChange: (length: number) => void;
  mosaic: MosaicSettings;
  onMosaicChange: (mosaic: MosaicSettings) => void;
  gridType: GridType;
  onGridTypeChange: (type: GridType) => void;
}

// Common sensor presets organized by category
const sensorPresets = {
  dslr: [
    { name: 'Full Frame', width: 36, height: 24 },
    { name: 'APS-C Canon', width: 22.3, height: 14.9 },
    { name: 'APS-C Nikon', width: 23.5, height: 15.6 },
    { name: 'Micro 4/3', width: 17.3, height: 13 },
    { name: '1" Sensor', width: 13.2, height: 8.8 },
  ],
  zwo: [
    { name: 'ASI2600MC', width: 23.5, height: 15.7 },
    { name: 'ASI294MC', width: 19.1, height: 13 },
    { name: 'ASI533MC', width: 11.31, height: 11.31 },
    { name: 'ASI183MC', width: 13.2, height: 8.8 },
    { name: 'ASI071MC', width: 23.6, height: 15.6 },
    { name: 'ASI6200MC', width: 36, height: 24 },
    { name: 'ASI2400MC', width: 36, height: 24 },
    { name: 'ASI1600MM', width: 17.7, height: 13.4 },
    { name: 'ASI290MM', width: 5.6, height: 3.2 },
    { name: 'ASI120MM', width: 4.8, height: 3.6 },
  ],
  qhy: [
    { name: 'QHY600M', width: 36, height: 24 },
    { name: 'QHY268M', width: 23.5, height: 15.7 },
    { name: 'QHY294M', width: 19.1, height: 13 },
    { name: 'QHY533M', width: 11.31, height: 11.31 },
    { name: 'QHY183M', width: 13.2, height: 8.8 },
  ],
  playerone: [
    { name: 'Poseidon-M', width: 23.5, height: 15.7 },
    { name: 'Ares-M', width: 19.1, height: 13 },
    { name: 'Neptune-M', width: 11.31, height: 11.31 },
  ],
};

// Common focal length presets
const focalLengthPresets = [
  { name: '50mm', value: 50 },
  { name: '135mm', value: 135 },
  { name: '200mm', value: 200 },
  { name: '300mm', value: 300 },
  { name: '400mm', value: 400 },
  { name: '500mm', value: 500 },
  { name: '600mm', value: 600 },
  { name: '800mm', value: 800 },
  { name: '1000mm', value: 1000 },
  { name: '1200mm', value: 1200 },
  { name: '1500mm', value: 1500 },
  { name: '2000mm', value: 2000 },
];

const GRID_OPTIONS: { value: GridType; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'crosshair', label: 'Crosshair' },
  { value: 'thirds', label: 'Rule of Thirds' },
  { value: 'golden', label: 'Golden Ratio' },
  { value: 'diagonal', label: 'Diagonals' },
];

export function FOVSimulator({
  enabled,
  onEnabledChange,
  sensorWidth,
  sensorHeight,
  focalLength,
  onSensorWidthChange,
  onSensorHeightChange,
  onFocalLengthChange,
  mosaic,
  onMosaicChange,
  gridType,
  onGridTypeChange,
}: FOVSimulatorProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);

  // Calculate FOV
  const fovWidth = (2 * Math.atan(sensorWidth / (2 * focalLength)) * 180) / Math.PI;
  const fovHeight = (2 * Math.atan(sensorHeight / (2 * focalLength)) * 180) / Math.PI;

  const applyPreset = (preset: { name: string; width: number; height: number }) => {
    onSensorWidthChange(preset.width);
    onSensorHeightChange(preset.height);
  };

  return (
    <TooltipProvider>
      <Popover open={open} onOpenChange={setOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-10 w-10 ${enabled ? 'bg-primary/30 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}
              >
                <Camera className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>{t('fov.fovSimulator')}</p>
          </TooltipContent>
        </Tooltip>

        <PopoverContent className="w-80" side="left">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-foreground">{t('fov.fovSimulator')}</h4>
              <Switch checked={enabled} onCheckedChange={onEnabledChange} />
            </div>

            {/* Sensor Presets */}
            <div className="space-y-2">
              <Label className="text-foreground">{t('fov.sensorPreset')}</Label>
              <Tabs defaultValue="zwo" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="dslr" className="text-xs">DSLR</TabsTrigger>
                  <TabsTrigger value="zwo" className="text-xs">ZWO</TabsTrigger>
                  <TabsTrigger value="qhy" className="text-xs">QHY</TabsTrigger>
                  <TabsTrigger value="playerone" className="text-xs">P1</TabsTrigger>
                </TabsList>
                {(['dslr', 'zwo', 'qhy', 'playerone'] as const).map((category) => (
                  <TabsContent key={category} value={category} className="mt-2">
                    <ScrollArea className="h-28">
                      <div className="grid grid-cols-2 gap-1 pr-2">
                        {sensorPresets[category].map((preset) => (
                          <Button
                            key={preset.name}
                            variant="outline"
                            size="sm"
                            className={`text-xs h-7 justify-start ${
                              sensorWidth === preset.width && sensorHeight === preset.height
                                ? 'bg-primary/20 border-primary text-primary hover:bg-primary/30'
                                : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground'
                            }`}
                            onClick={() => applyPreset(preset)}
                          >
                            {preset.name}
                          </Button>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                ))}
              </Tabs>
            </div>

            {/* Manual Input */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{t('fov.sensorWidth')}</Label>
                <Input
                  type="number"
                  value={sensorWidth}
                  onChange={(e) => onSensorWidthChange(parseFloat(e.target.value) || 0)}
                  className="h-8"
                  step="0.1"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{t('fov.sensorHeight')}</Label>
                <Input
                  type="number"
                  value={sensorHeight}
                  onChange={(e) => onSensorHeightChange(parseFloat(e.target.value) || 0)}
                  className="h-8"
                  step="0.1"
                />
              </div>
            </div>

            <Separator />

            {/* Focal Length */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Ruler className="h-4 w-4 text-muted-foreground" />
                <Label className="text-foreground">{t('fov.focalLength')}</Label>
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={focalLength}
                  onChange={(e) => onFocalLengthChange(parseFloat(e.target.value) || 0)}
                  className="h-8 w-24"
                  step="1"
                />
                <Select
                  value={focalLengthPresets.find(p => p.value === focalLength)?.name || ''}
                  onValueChange={(val) => {
                    const preset = focalLengthPresets.find(p => p.name === val);
                    if (preset) onFocalLengthChange(preset.value);
                  }}
                >
                  <SelectTrigger className="flex-1 h-8">
                    <SelectValue placeholder="Quick select" />
                  </SelectTrigger>
                  <SelectContent>
                    {focalLengthPresets.map((preset) => (
                      <SelectItem key={preset.value} value={preset.name}>
                        {preset.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Mosaic Settings */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Grid3X3 className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-foreground">Mosaic</Label>
                </div>
                <Switch 
                  checked={mosaic.enabled} 
                  onCheckedChange={(checked) => onMosaicChange({ ...mosaic, enabled: checked })} 
                />
              </div>
              
              {mosaic.enabled && (
                <div className="space-y-3 pl-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Columns</Label>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => onMosaicChange({ ...mosaic, cols: Math.max(1, mosaic.cols - 1) })}
                        >
                          -
                        </Button>
                        <Input
                          type="number"
                          value={mosaic.cols}
                          onChange={(e) => onMosaicChange({ ...mosaic, cols: Math.max(1, Math.min(10, parseInt(e.target.value) || 1)) })}
                          className="h-7 w-12 text-center"
                          min={1}
                          max={10}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => onMosaicChange({ ...mosaic, cols: Math.min(10, mosaic.cols + 1) })}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Rows</Label>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => onMosaicChange({ ...mosaic, rows: Math.max(1, mosaic.rows - 1) })}
                        >
                          -
                        </Button>
                        <Input
                          type="number"
                          value={mosaic.rows}
                          onChange={(e) => onMosaicChange({ ...mosaic, rows: Math.max(1, Math.min(10, parseInt(e.target.value) || 1)) })}
                          className="h-7 w-12 text-center"
                          min={1}
                          max={10}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => onMosaicChange({ ...mosaic, rows: Math.min(10, mosaic.rows + 1) })}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">Overlap</Label>
                      <span className="text-xs text-primary font-mono">{mosaic.overlap}%</span>
                    </div>
                    <Slider
                      value={[mosaic.overlap]}
                      onValueChange={([v]) => onMosaicChange({ ...mosaic, overlap: v })}
                      min={0}
                      max={50}
                      step={5}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Grid Type */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                <Label className="text-foreground">Composition Grid</Label>
              </div>
              <div className="flex flex-wrap gap-1">
                {GRID_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    variant="outline"
                    size="sm"
                    className={`text-xs h-7 ${gridType === option.value
                      ? 'bg-primary/20 border-primary text-primary hover:bg-primary/30'
                      : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground'
                    }`}
                    onClick={() => onGridTypeChange(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Calculated FOV */}
            <Card>
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-sm flex items-center gap-2 text-primary">
                  <Focus className="h-4 w-4" />
                  Calculated FOV
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Eye className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Width:</span>
                    <span className="text-foreground font-mono">{fovWidth.toFixed(2)}°</span>
                  </div>
                  <div className="text-muted-foreground text-xs">
                    ({(fovWidth * 60).toFixed(1)}&apos;)
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Height:</span>
                    <span className="text-foreground font-mono">{fovHeight.toFixed(2)}°</span>
                  </div>
                  <div className="text-muted-foreground text-xs">
                    ({(fovHeight * 60).toFixed(1)}&apos;)
                  </div>
                  {mosaic.enabled && (
                    <>
                      <div className="col-span-2 pt-1 border-t border-border mt-1">
                        <span className="text-muted-foreground">Total Coverage:</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-primary font-mono">
                          {(fovWidth * mosaic.cols * (1 - mosaic.overlap / 100) + fovWidth * mosaic.overlap / 100).toFixed(2)}°
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-primary font-mono">
                          × {(fovHeight * mosaic.rows * (1 - mosaic.overlap / 100) + fovHeight * mosaic.overlap / 100).toFixed(2)}°
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  );
}
