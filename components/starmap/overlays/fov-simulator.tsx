'use client';

import { useState, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  Camera,
  Ruler,
  Focus,
  Grid3X3,
  LayoutGrid,
  RotateCw,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Settings2,
  Layers,
  ZoomIn,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import {
  type MosaicSettings,
  type GridType,
} from '@/lib/stores';

// Re-export types from equipment store for backward compatibility
export type { MosaicSettings, GridType } from '@/lib/stores';

interface FOVSimulatorProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  sensorWidth: number;
  sensorHeight: number;
  focalLength: number;
  pixelSize?: number;
  rotationAngle?: number;
  onSensorWidthChange: (width: number) => void;
  onSensorHeightChange: (height: number) => void;
  onFocalLengthChange: (length: number) => void;
  onPixelSizeChange?: (size: number) => void;
  onRotationAngleChange?: (angle: number) => void;
  mosaic: MosaicSettings;
  onMosaicChange: (mosaic: MosaicSettings) => void;
  gridType: GridType;
  onGridTypeChange: (type: GridType) => void;
}

// ============================================================================
// Sensor Presets
// ============================================================================

interface SensorPreset {
  name: string;
  width: number;
  height: number;
  pixelSize?: number;
  resolution?: string;
}

const SENSOR_PRESETS: Record<string, SensorPreset[]> = {
  fullFrame: [
    { name: 'Full Frame 35mm', width: 36, height: 24, pixelSize: 4.5, resolution: '6000×4000' },
    { name: 'Sony A7R IV', width: 35.7, height: 23.8, pixelSize: 3.76, resolution: '9504×6336' },
    { name: 'Canon R5', width: 36, height: 24, pixelSize: 4.39, resolution: '8192×5464' },
    { name: 'Nikon Z7', width: 35.9, height: 23.9, pixelSize: 4.34, resolution: '8256×5504' },
  ],
  apsc: [
    { name: 'APS-C Canon', width: 22.3, height: 14.9, pixelSize: 4.3, resolution: '5184×3456' },
    { name: 'APS-C Nikon/Sony', width: 23.5, height: 15.6, pixelSize: 3.9, resolution: '6000×4000' },
    { name: 'Micro 4/3', width: 17.3, height: 13, pixelSize: 3.75, resolution: '4608×3456' },
    { name: '1" Sensor', width: 13.2, height: 8.8, pixelSize: 2.4, resolution: '5472×3648' },
  ],
  zwo: [
    { name: 'ASI6200MC Pro', width: 36, height: 24, pixelSize: 3.76, resolution: '9576×6388' },
    { name: 'ASI2600MC Pro', width: 23.5, height: 15.7, pixelSize: 3.76, resolution: '6248×4176' },
    { name: 'ASI2400MC Pro', width: 36, height: 24, pixelSize: 5.94, resolution: '6072×4042' },
    { name: 'ASI294MC Pro', width: 19.1, height: 13, pixelSize: 4.63, resolution: '4144×2822' },
    { name: 'ASI533MC Pro', width: 11.31, height: 11.31, pixelSize: 3.76, resolution: '3008×3008' },
    { name: 'ASI183MC Pro', width: 13.2, height: 8.8, pixelSize: 2.4, resolution: '5496×3672' },
    { name: 'ASI071MC Pro', width: 23.6, height: 15.6, pixelSize: 4.78, resolution: '4944×3284' },
    { name: 'ASI1600MM Pro', width: 17.7, height: 13.4, pixelSize: 3.8, resolution: '4656×3520' },
    { name: 'ASI290MM Mini', width: 5.6, height: 3.2, pixelSize: 2.9, resolution: '1936×1096' },
  ],
  qhy: [
    { name: 'QHY600M', width: 36, height: 24, pixelSize: 3.76, resolution: '9576×6388' },
    { name: 'QHY268M', width: 23.5, height: 15.7, pixelSize: 3.76, resolution: '6280×4210' },
    { name: 'QHY294M Pro', width: 19.1, height: 13, pixelSize: 4.63, resolution: '4164×2796' },
    { name: 'QHY533M', width: 11.31, height: 11.31, pixelSize: 3.76, resolution: '3008×3008' },
    { name: 'QHY183M', width: 13.2, height: 8.8, pixelSize: 2.4, resolution: '5544×3694' },
    { name: 'QHY163M', width: 17.7, height: 13.4, pixelSize: 3.8, resolution: '4656×3522' },
  ],
  other: [
    { name: 'Player One Poseidon-M', width: 23.5, height: 15.7, pixelSize: 3.76, resolution: '6280×4210' },
    { name: 'Player One Ares-M', width: 19.1, height: 13, pixelSize: 4.63, resolution: '4128×2808' },
    { name: 'Player One Neptune-M', width: 11.31, height: 11.31, pixelSize: 3.76, resolution: '3008×3008' },
    { name: 'Touptek ATR3CMOS26000KMA', width: 23.5, height: 15.7, pixelSize: 3.76, resolution: '6252×4176' },
  ],
};

// ============================================================================
// Telescope Presets
// ============================================================================

interface TelescopePreset {
  name: string;
  focalLength: number;
  aperture: number;
  type: string;
}

const TELESCOPE_PRESETS: TelescopePreset[] = [
  { name: 'Samyang 135mm f/2', focalLength: 135, aperture: 67.5, type: 'Lens' },
  { name: 'RedCat 51', focalLength: 250, aperture: 51, type: 'APO' },
  { name: 'Radian 61', focalLength: 275, aperture: 61, type: 'APO' },
  { name: 'Esprit 80ED', focalLength: 400, aperture: 80, type: 'APO' },
  { name: 'FSQ-85ED', focalLength: 450, aperture: 85, type: 'APO' },
  { name: 'Esprit 100ED', focalLength: 550, aperture: 100, type: 'APO' },
  { name: 'TOA-130F', focalLength: 1000, aperture: 130, type: 'APO' },
  { name: 'EdgeHD 8"', focalLength: 2032, aperture: 203, type: 'SCT' },
  { name: 'EdgeHD 9.25"', focalLength: 2350, aperture: 235, type: 'SCT' },
  { name: 'C11', focalLength: 2800, aperture: 280, type: 'SCT' },
  { name: 'EdgeHD 11"', focalLength: 2800, aperture: 280, type: 'SCT' },
  { name: 'EdgeHD 14"', focalLength: 3910, aperture: 356, type: 'SCT' },
];

const GRID_OPTIONS: { value: GridType; label: string; icon: string }[] = [
  { value: 'none', label: 'None', icon: '○' },
  { value: 'crosshair', label: 'Crosshair', icon: '┼' },
  { value: 'thirds', label: 'Rule of Thirds', icon: '▦' },
  { value: 'golden', label: 'Golden Ratio', icon: '◫' },
  { value: 'diagonal', label: 'Diagonals', icon: '╳' },
];

// ============================================================================
// Utility Components
// ============================================================================

function NumberStepper({
  value,
  onChange,
  min = 1,
  max = 10,
  step = 1,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
}) {
  return (
    <div className="space-y-1">
      {label && <Label className="text-xs text-muted-foreground">{label}</Label>}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => onChange(Math.max(min, value - step))}
          disabled={value <= min}
        >
          -
        </Button>
        <Input
          type="number"
          value={value}
          onChange={(e) => {
            const v = parseFloat(e.target.value) || min;
            onChange(Math.max(min, Math.min(max, v)));
          }}
          className="h-7 w-12 text-center"
          min={min}
          max={max}
          step={step}
        />
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => onChange(Math.min(max, value + step))}
          disabled={value >= max}
        >
          +
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function FOVSimulator({
  enabled,
  onEnabledChange,
  sensorWidth,
  sensorHeight,
  focalLength,
  pixelSize = 3.76,
  rotationAngle = 0,
  onSensorWidthChange,
  onSensorHeightChange,
  onFocalLengthChange,
  onPixelSizeChange,
  onRotationAngleChange,
  mosaic,
  onMosaicChange,
  gridType,
  onGridTypeChange,
}: FOVSimulatorProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [localPixelSize, setLocalPixelSize] = useState(pixelSize);
  const [localRotation, setLocalRotation] = useState(rotationAngle);

  // Calculations
  const fovWidth = useMemo(() => 
    (2 * Math.atan(sensorWidth / (2 * focalLength)) * 180) / Math.PI,
    [sensorWidth, focalLength]
  );
  
  const fovHeight = useMemo(() =>
    (2 * Math.atan(sensorHeight / (2 * focalLength)) * 180) / Math.PI,
    [sensorHeight, focalLength]
  );

  const imageScale = useMemo(() =>
    (206.265 * localPixelSize) / focalLength,
    [localPixelSize, focalLength]
  );

  const resolution = useMemo(() => ({
    width: Math.round((sensorWidth * 1000) / localPixelSize),
    height: Math.round((sensorHeight * 1000) / localPixelSize),
  }), [sensorWidth, sensorHeight, localPixelSize]);

  const mosaicCoverage = useMemo(() => {
    if (!mosaic.enabled) return null;
    const overlapFactor = mosaic.overlapUnit === 'percent' 
      ? (1 - mosaic.overlap / 100) 
      : (1 - mosaic.overlap / (resolution.width / mosaic.cols));
    return {
      width: fovWidth * mosaic.cols * overlapFactor + fovWidth * (1 - overlapFactor),
      height: fovHeight * mosaic.rows * overlapFactor + fovHeight * (1 - overlapFactor),
      totalPanels: mosaic.rows * mosaic.cols,
    };
  }, [mosaic, fovWidth, fovHeight, resolution]);

  const applyPreset = useCallback((preset: SensorPreset) => {
    onSensorWidthChange(preset.width);
    onSensorHeightChange(preset.height);
    if (preset.pixelSize && onPixelSizeChange) {
      onPixelSizeChange(preset.pixelSize);
      setLocalPixelSize(preset.pixelSize);
    }
  }, [onSensorWidthChange, onSensorHeightChange, onPixelSizeChange]);

  const applyTelescopePreset = useCallback((preset: TelescopePreset) => {
    onFocalLengthChange(preset.focalLength);
  }, [onFocalLengthChange]);

  const handleCopy = useCallback(() => {
    const text = [
      `FOV: ${fovWidth.toFixed(2)}° × ${fovHeight.toFixed(2)}°`,
      `Sensor: ${sensorWidth}mm × ${sensorHeight}mm`,
      `Focal Length: ${focalLength}mm`,
      `Image Scale: ${imageScale.toFixed(2)}"/px`,
      `Resolution: ${resolution.width} × ${resolution.height}`,
      mosaic.enabled ? `Mosaic: ${mosaic.cols}×${mosaic.rows} (${mosaicCoverage?.width.toFixed(2)}° × ${mosaicCoverage?.height.toFixed(2)}°)` : '',
    ].filter(Boolean).join('\n');
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [fovWidth, fovHeight, sensorWidth, sensorHeight, focalLength, imageScale, resolution, mosaic, mosaicCoverage]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-10 w-10 touch-target toolbar-btn',
                enabled 
                  ? 'bg-primary/30 text-primary' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              <Camera className="h-5 w-5" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>{t('fov.fovSimulator')}</p>
        </TooltipContent>
      </Tooltip>

      <DialogContent className="w-[95vw] max-w-[640px] max-h-[85vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              {t('fov.fovSimulator')}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleCopy}
              >
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Switch checked={enabled} onCheckedChange={onEnabledChange} />
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="camera" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="camera" className="text-xs">
              <Camera className="h-3.5 w-3.5 mr-1.5" />
              {t('fov.cameraTab')}
            </TabsTrigger>
            <TabsTrigger value="optics" className="text-xs">
              <Focus className="h-3.5 w-3.5 mr-1.5" />
              {t('fov.opticsTab')}
            </TabsTrigger>
            <TabsTrigger value="mosaic" className="text-xs">
              <Grid3X3 className="h-3.5 w-3.5 mr-1.5" />
              {t('fov.mosaicTab')}
            </TabsTrigger>
            <TabsTrigger value="display" className="text-xs">
              <Layers className="h-3.5 w-3.5 mr-1.5" />
              {t('fov.displayTab')}
            </TabsTrigger>
          </TabsList>

          {/* Camera Tab */}
          <TabsContent value="camera" className="space-y-4 pt-4">
            {/* Sensor Presets */}
            <div className="space-y-2">
              <Label>{t('fov.sensorPreset')}</Label>
              <Tabs defaultValue="zwo" className="w-full">
                <TabsList className="grid w-full grid-cols-5 h-8">
                  <TabsTrigger value="fullFrame" className="text-[10px] px-1">Full Frame</TabsTrigger>
                  <TabsTrigger value="apsc" className="text-[10px] px-1">APS-C</TabsTrigger>
                  <TabsTrigger value="zwo" className="text-[10px] px-1">ZWO</TabsTrigger>
                  <TabsTrigger value="qhy" className="text-[10px] px-1">QHY</TabsTrigger>
                  <TabsTrigger value="other" className="text-[10px] px-1">Other</TabsTrigger>
                </TabsList>
                {Object.entries(SENSOR_PRESETS).map(([key, presets]) => (
                  <TabsContent key={key} value={key} className="mt-2">
                    <ScrollArea className="h-32">
                      <div className="grid grid-cols-2 gap-1 pr-2">
                        {presets.map((preset) => (
                          <Button
                            key={preset.name}
                            variant="outline"
                            size="sm"
                            className={cn(
                              'text-xs h-auto py-1.5 px-2 justify-start flex-col items-start',
                              sensorWidth === preset.width && sensorHeight === preset.height
                                ? 'bg-primary/20 border-primary text-primary'
                                : ''
                            )}
                            onClick={() => applyPreset(preset)}
                          >
                            <span className="font-medium truncate w-full text-left">{preset.name}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {preset.width}×{preset.height}mm
                              {preset.pixelSize && ` | ${preset.pixelSize}μm`}
                            </span>
                          </Button>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                ))}
              </Tabs>
            </div>

            <Separator />

            {/* Manual Sensor Input */}
            <div className="space-y-3">
              <Label className="text-sm">{t('fov.manualInput')}</Label>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{t('fov.sensorWidth')} (mm)</Label>
                  <Input
                    type="number"
                    value={sensorWidth}
                    onChange={(e) => onSensorWidthChange(parseFloat(e.target.value) || 0)}
                    className="h-8"
                    step="0.1"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{t('fov.sensorHeight')} (mm)</Label>
                  <Input
                    type="number"
                    value={sensorHeight}
                    onChange={(e) => onSensorHeightChange(parseFloat(e.target.value) || 0)}
                    className="h-8"
                    step="0.1"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{t('fov.pixelSize')} (μm)</Label>
                  <Input
                    type="number"
                    value={localPixelSize}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value) || 1;
                      setLocalPixelSize(v);
                      onPixelSizeChange?.(v);
                    }}
                    className="h-8"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            {/* Rotation */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5 text-sm">
                  <RotateCw className="h-4 w-4" />
                  {t('fov.rotation')}
                </Label>
                <span className="text-xs text-muted-foreground font-mono">{localRotation.toFixed(1)}°</span>
              </div>
              <div className="flex gap-2">
                <Slider
                  value={[localRotation]}
                  onValueChange={([v]) => {
                    setLocalRotation(v);
                    onRotationAngleChange?.(v);
                  }}
                  min={-180}
                  max={180}
                  step={0.5}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => {
                    setLocalRotation(0);
                    onRotationAngleChange?.(0);
                  }}
                >
                  Reset
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Optics Tab */}
          <TabsContent value="optics" className="space-y-4 pt-4">
            {/* Telescope Presets */}
            <div className="space-y-2">
              <Label>{t('fov.telescopePreset')}</Label>
              <ScrollArea className="h-40">
                <div className="grid grid-cols-2 gap-1 pr-2">
                  {TELESCOPE_PRESETS.map((preset) => (
                    <Button
                      key={preset.name}
                      variant="outline"
                      size="sm"
                      className={cn(
                        'text-xs h-auto py-1.5 px-2 justify-start flex-col items-start',
                        focalLength === preset.focalLength ? 'bg-primary/20 border-primary' : ''
                      )}
                      onClick={() => applyTelescopePreset(preset)}
                    >
                      <span className="font-medium truncate w-full text-left">{preset.name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {preset.focalLength}mm | f/{(preset.focalLength / preset.aperture).toFixed(1)} | {preset.type}
                      </span>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <Separator />

            {/* Manual Focal Length */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Ruler className="h-4 w-4" />
                {t('fov.focalLength')} (mm)
              </Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={focalLength}
                  onChange={(e) => onFocalLengthChange(parseFloat(e.target.value) || 0)}
                  className="h-9"
                  step="1"
                />
                <div className="flex gap-1">
                  {[200, 400, 600, 1000, 2000].map((fl) => (
                    <Button
                      key={fl}
                      variant={focalLength === fl ? 'default' : 'outline'}
                      size="sm"
                      className="h-9 px-2 text-xs"
                      onClick={() => onFocalLengthChange(fl)}
                    >
                      {fl}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Calculated Results */}
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ZoomIn className="h-4 w-4" />
                  {t('fov.calculatedFOV')}
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">{t('fov.fieldWidth')}</span>
                    <p className="font-mono font-medium">
                      {fovWidth.toFixed(2)}° <span className="text-muted-foreground">({(fovWidth * 60).toFixed(1)}&apos;)</span>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">{t('fov.fieldHeight')}</span>
                    <p className="font-mono font-medium">
                      {fovHeight.toFixed(2)}° <span className="text-muted-foreground">({(fovHeight * 60).toFixed(1)}&apos;)</span>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">{t('fov.imageScale')}</span>
                    <p className="font-mono font-medium">{imageScale.toFixed(2)} &quot;/px</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">{t('fov.resolution')}</span>
                    <p className="font-mono font-medium">{resolution.width} × {resolution.height}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Mosaic Tab */}
          <TabsContent value="mosaic" className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Grid3X3 className="h-4 w-4" />
                {t('fov.enableMosaic')}
              </Label>
              <Switch
                checked={mosaic.enabled}
                onCheckedChange={(checked) => onMosaicChange({ ...mosaic, enabled: checked })}
              />
            </div>

            {mosaic.enabled && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <NumberStepper
                    value={mosaic.cols}
                    onChange={(v) => onMosaicChange({ ...mosaic, cols: v })}
                    min={1}
                    max={10}
                    label={t('fov.columns')}
                  />
                  <NumberStepper
                    value={mosaic.rows}
                    onChange={(v) => onMosaicChange({ ...mosaic, rows: v })}
                    min={1}
                    max={10}
                    label={t('fov.rows')}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">{t('fov.overlap')}</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono">
                        {mosaic.overlap}{mosaic.overlapUnit === 'percent' ? '%' : 'px'}
                      </Badge>
                      <Select
                        value={mosaic.overlapUnit}
                        onValueChange={(v: 'percent' | 'pixels') => onMosaicChange({ ...mosaic, overlapUnit: v })}
                      >
                        <SelectTrigger className="h-7 w-16">
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
                    onValueChange={([v]) => onMosaicChange({ ...mosaic, overlap: v })}
                    min={0}
                    max={mosaic.overlapUnit === 'percent' ? 50 : 500}
                    step={mosaic.overlapUnit === 'percent' ? 5 : 50}
                    className="w-full"
                  />
                </div>

                {/* Mosaic Summary */}
                {mosaicCoverage && (
                  <Card className="border-primary/30 bg-primary/5">
                    <CardContent className="py-3 px-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-xs text-muted-foreground">{t('fov.totalPanels')}</span>
                          <p className="font-mono font-medium">{mosaicCoverage.totalPanels}</p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">{t('fov.totalCoverage')}</span>
                          <p className="font-mono font-medium text-primary">
                            {mosaicCoverage.width.toFixed(2)}° × {mosaicCoverage.height.toFixed(2)}°
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {!mosaic.enabled && (
              <div className="text-center py-8 text-muted-foreground">
                <Grid3X3 className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">{t('fov.mosaicDisabled')}</p>
              </div>
            )}
          </TabsContent>

          {/* Display Tab */}
          <TabsContent value="display" className="space-y-4 pt-4">
            {/* Grid Type */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4" />
                {t('fov.compositionGrid')}
              </Label>
              <div className="grid grid-cols-5 gap-1">
                {GRID_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    variant={gridType === option.value ? 'default' : 'outline'}
                    size="sm"
                    className="h-12 flex-col gap-1"
                    onClick={() => onGridTypeChange(option.value)}
                  >
                    <span className="text-lg font-mono">{option.icon}</span>
                    <span className="text-[10px]">{option.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Advanced Options */}
            <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <Settings2 className="h-4 w-4" />
                    {t('fov.advancedOptions')}
                  </span>
                  {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-3">
                {/* Overlay Opacity */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">{t('fov.overlayOpacity')}</Label>
                    <span className="text-xs text-muted-foreground font-mono">80%</span>
                  </div>
                  <Slider
                    defaultValue={[80]}
                    min={10}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>

                {/* Annotations */}
                <div className="space-y-3">
                  <Label className="text-sm">{t('fov.annotations')}</Label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t('fov.showCoordinateGrid')}</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t('fov.showConstellations')}</span>
                      <Switch defaultChecked={false} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t('fov.showConstellationBoundaries')}</span>
                      <Switch defaultChecked={false} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t('fov.showDSOLabels')}</span>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Frame Color */}
                <div className="space-y-2">
                  <Label className="text-sm">{t('fov.frameColor')}</Label>
                  <div className="flex gap-1">
                    {['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ffffff'].map((color) => (
                      <Button
                        key={color}
                        variant="outline"
                        size="icon"
                        className="w-7 h-7 p-0 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Frame Style */}
                <div className="space-y-2">
                  <Label className="text-sm">{t('fov.frameStyle')}</Label>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" className="flex-1 h-8 text-xs">
                      {t('fov.styleSolid')}
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 h-8 text-xs">
                      {t('fov.styleDashed')}
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 h-8 text-xs">
                      {t('fov.styleDotted')}
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Position Angle Display */}
                <div className="space-y-2">
                  <Label className="text-sm">{t('fov.positionAngle')}</Label>
                  <Card className="border-muted">
                    <CardContent className="py-2 px-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-xs text-muted-foreground">{t('fov.cameraAngle')}</span>
                          <p className="font-mono">{localRotation.toFixed(1)}°</p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">{t('fov.dsoAngle')}</span>
                          <p className="font-mono">{(360 - localRotation).toFixed(1)}°</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
            {t('common.close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

