'use client';

import { useState, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  Calculator,
  Clock,
  Aperture,
  Sun,
  Crosshair,
  Camera,
  Layers,
  Filter,
  Zap,
  Info,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
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
  BORTLE_SCALE,
  calculateExposure,
  calculateTotalIntegration,
  formatDuration,
} from '@/lib/astronomy/astro-utils';
import { calculateSNR, estimateFileSize } from '@/lib/astronomy/exposure-utils';
import { COMMON_FILTERS, BINNING_OPTIONS, IMAGE_TYPES } from '@/lib/core/constants/planning';
import type { ExposurePlan, ExposureCalculatorProps } from '@/types/starmap/planning';
import { useEquipmentStore } from '@/lib/stores';

// ============================================================================
// Sub Components
// ============================================================================

function SNRIndicator({ snr }: { snr: number }) {
  const t = useTranslations();
  const level = snr > 50 ? 'excellent' : snr > 30 ? 'good' : snr > 15 ? 'fair' : 'poor';
  const colors = {
    excellent: 'bg-green-500',
    good: 'bg-emerald-400',
    fair: 'bg-yellow-500',
    poor: 'bg-red-500',
  };
  
  return (
    <div className="flex items-center gap-2">
      <div className={cn('w-2 h-2 rounded-full', colors[level])} />
      <span className="text-sm font-mono">{snr.toFixed(1)}</span>
      <span className="text-xs text-muted-foreground">({t(`exposure.snrLevel.${level}`)})</span>
    </div>
  );
}

function ExposureTimeSlider({
  value,
  onChange,
  max = 600,
}: {
  value: number;
  onChange: (v: number) => void;
  max?: number;
}) {
  // Common exposure times for quick selection
  const presets = [1, 5, 10, 30, 60, 120, 180, 300, 600];
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {presets.slice(0, 6).map((preset) => (
            <Button
              key={preset}
              variant={value === preset ? 'default' : 'outline'}
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => onChange(preset)}
            >
              {preset}s
            </Button>
          ))}
        </div>
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(Math.max(1, parseInt(e.target.value) || 1))}
          className="h-7 w-20 text-right text-sm"
          min={1}
          max={max}
        />
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={1}
        max={max}
        step={1}
        className="w-full"
      />
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ExposureCalculator({
  focalLength: propFocalLength,
  aperture: propAperture,
  pixelSize: propPixelSize,
  onExposurePlanChange,
}: ExposureCalculatorProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Get defaults from equipment store
  const equipmentStore = useEquipmentStore();
  const exposureDefaults = equipmentStore.exposureDefaults;
  
  // Equipment settings - prefer props, fallback to store
  const [focalLength, setFocalLength] = useState(propFocalLength ?? equipmentStore.focalLength);
  const [aperture, setAperture] = useState(propAperture ?? equipmentStore.aperture);
  const [pixelSize, setPixelSize] = useState(propPixelSize ?? equipmentStore.pixelSize);
  
  // Environment - use store defaults
  const [bortle, setBortle] = useState(exposureDefaults.bortle);
  
  // Exposure settings - use store defaults
  const [exposureTime, setExposureTime] = useState(exposureDefaults.exposureTime);
  const [gain, setGain] = useState(exposureDefaults.gain);
  const [offset, setOffset] = useState(exposureDefaults.offset);
  const [binning, setBinning] = useState<typeof BINNING_OPTIONS[number]>(exposureDefaults.binning);
  const [imageType, setImageType] = useState<'LIGHT' | 'DARK' | 'FLAT' | 'BIAS'>('LIGHT');
  const [filter, setFilter] = useState(exposureDefaults.filter);
  const [frameCount, setFrameCount] = useState(exposureDefaults.frameCount);
  
  // Dither settings - use store defaults
  const [ditherEnabled, setDitherEnabled] = useState(exposureDefaults.ditherEnabled);
  const [ditherEvery, setDitherEvery] = useState(exposureDefaults.ditherEvery);
  
  // Target settings - use store defaults
  const [targetType, setTargetType] = useState<'galaxy' | 'nebula' | 'cluster' | 'planetary'>(exposureDefaults.targetType);
  const [tracking, setTracking] = useState<'none' | 'basic' | 'guided'>(exposureDefaults.tracking);
  
  // UI state
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Calculations
  const isNarrowband = useMemo(() => {
    const filterInfo = COMMON_FILTERS.find(f => f.id === filter);
    return filterInfo?.type === 'narrowband';
  }, [filter]);
  
  const exposureCalc = useMemo(() => {
    return calculateExposure({
      bortle,
      focalLength,
      aperture,
      tracking,
    });
  }, [bortle, focalLength, aperture, tracking]);
  
  const integrationCalc = useMemo(() => {
    return calculateTotalIntegration({
      bortle,
      targetType,
      isNarrowband,
    });
  }, [bortle, targetType, isNarrowband]);
  
  const snr = useMemo(() => {
    return calculateSNR(exposureTime, gain, bortle, isNarrowband);
  }, [exposureTime, gain, bortle, isNarrowband]);
  
  const totalIntegrationMinutes = useMemo(() => {
    return (exposureTime * frameCount) / 60;
  }, [exposureTime, frameCount]);
  
  const fileSize = useMemo(() => {
    return estimateFileSize(binning);
  }, [binning]);
  
  const totalStorageGB = useMemo(() => {
    return (fileSize * frameCount) / 1024;
  }, [fileSize, frameCount]);
  
  const bortleInfo = BORTLE_SCALE.find((b) => b.value === bortle);
  const fRatio = focalLength / aperture;
  const imageScale = (206.265 * pixelSize) / focalLength; // arcsec/pixel
  
  // Plan summary
  const plan = useMemo((): ExposurePlan => ({
    settings: {
      exposureTime,
      gain,
      offset,
      binning,
      imageType,
      count: frameCount,
      filter,
      ditherEvery,
      ditherEnabled,
    },
    totalExposure: totalIntegrationMinutes,
    totalFrames: frameCount,
    estimatedFileSize: fileSize,
    estimatedTime: formatDuration(totalIntegrationMinutes),
  }), [exposureTime, gain, offset, binning, imageType, frameCount, filter, ditherEvery, ditherEnabled, totalIntegrationMinutes, fileSize]);
  
  const handleApply = useCallback(() => {
    onExposurePlanChange?.(plan);
    setOpen(false);
  }, [plan, onExposurePlanChange]);
  
  const handleCopy = useCallback(() => {
    const text = `Exposure: ${exposureTime}s × ${frameCount} = ${formatDuration(totalIntegrationMinutes)}\nFilter: ${filter} | Gain: ${gain} | Binning: ${binning}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [exposureTime, frameCount, totalIntegrationMinutes, filter, gain, binning]);
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-accent touch-target toolbar-btn"
            >
              <Calculator className="h-5 w-5" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>{t('exposure.exposureCalculator')}</p>
        </TooltipContent>
      </Tooltip>
      
      <DialogContent className="w-[95vw] max-w-[640px] max-h-[85vh] overflow-hidden flex flex-col p-4 sm:p-6">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Calculator className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            {t('exposure.exposureCalculator')}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {t('exposure.calculatorDescription')}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="exposure" className="flex-1 flex flex-col min-h-0 mt-2">
          <TabsList className="grid w-full grid-cols-3 shrink-0">
            <TabsTrigger value="exposure" className="text-[10px] sm:text-xs px-1 sm:px-3">
              <Camera className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-0.5 sm:mr-1.5" />
              <span className="hidden sm:inline">{t('exposure.exposureTab')}</span>
              <span className="sm:hidden">{t('exposure.exposureTabShort')}</span>
            </TabsTrigger>
            <TabsTrigger value="equipment" className="text-[10px] sm:text-xs px-1 sm:px-3">
              <Aperture className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-0.5 sm:mr-1.5" />
              <span className="hidden sm:inline">{t('exposure.equipmentTab')}</span>
              <span className="sm:hidden">{t('exposure.equipmentTabShort')}</span>
            </TabsTrigger>
            <TabsTrigger value="plan" className="text-[10px] sm:text-xs px-1 sm:px-3">
              <Layers className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-0.5 sm:mr-1.5" />
              <span className="hidden sm:inline">{t('exposure.planTab')}</span>
              <span className="sm:hidden">{t('exposure.planTabShort')}</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Exposure Tab */}
          <TabsContent value="exposure" className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 pt-3 sm:pt-4 pr-1">
            {/* Environment Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5 text-sm">
                  <Sun className="h-4 w-4 text-yellow-500" />
                  {t('exposure.lightPollution')}
                </Label>
                <Badge variant="outline" className="text-xs font-mono">
                  SQM: {bortleInfo?.sqm.toFixed(2)}
                </Badge>
              </div>
              <Select
                value={bortle.toString()}
                onValueChange={(v) => setBortle(parseInt(v))}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BORTLE_SCALE.map((b) => (
                    <SelectItem key={b.value} value={b.value.toString()}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono w-4">{b.value}</span>
                        <span>{b.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Separator />
            
            {/* Exposure Time */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5 text-sm">
                  <Clock className="h-4 w-4" />
                  {t('exposure.singleExposure')}
                </Label>
                <SNRIndicator snr={snr} />
              </div>
              <ExposureTimeSlider
                value={exposureTime}
                onChange={setExposureTime}
                max={tracking === 'none' ? Math.floor(exposureCalc.maxUntracked) : 600}
              />
              {tracking === 'none' && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  {t('exposure.maxUntracked', { seconds: exposureCalc.maxUntracked.toFixed(1) })}
                </p>
              )}
            </div>
            
            {/* Filter & Gain/Offset */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1">
                  <Filter className="h-3 w-3" />
                  {t('exposure.filter')}
                </Label>
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_FILTERS.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'w-2 h-2 rounded-full',
                            f.type === 'narrowband' ? 'bg-red-500' : 'bg-blue-500'
                          )} />
                          <span>{f.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">{t('exposure.gain')}</Label>
                <Input
                  type="number"
                  value={gain}
                  onChange={(e) => setGain(parseInt(e.target.value) || 0)}
                  className="h-8"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">{t('exposure.offset')}</Label>
                <Input
                  type="number"
                  value={offset}
                  onChange={(e) => setOffset(parseInt(e.target.value) || 0)}
                  className="h-8"
                />
              </div>
            </div>
            
            {/* Binning & Image Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <div className="space-y-2">
                <Label className="text-xs">{t('exposure.binning')}</Label>
                <ToggleGroup type="single" value={binning} onValueChange={(v) => v && setBinning(v as typeof binning)} variant="outline" size="sm" className="w-full">
                  {BINNING_OPTIONS.map((b) => (
                    <ToggleGroupItem key={b} value={b} className="flex-1 h-7 text-xs">
                      {b}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">{t('exposure.imageType')}</Label>
                <Select value={imageType} onValueChange={(v) => setImageType(v as typeof imageType)}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {IMAGE_TYPES.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Frame Count */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">{t('exposure.frameCount')}</Label>
                <span className="text-xs text-muted-foreground">
                  {t('exposure.totalTime')}: {formatDuration(totalIntegrationMinutes)}
                </span>
              </div>
              <div className="flex gap-2">
                <Slider
                  value={[frameCount]}
                  onValueChange={([v]) => setFrameCount(v)}
                  min={1}
                  max={200}
                  step={1}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={frameCount}
                  onChange={(e) => setFrameCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="h-8 w-20 text-right"
                />
              </div>
            </div>
            
            {/* Advanced Options */}
            <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between h-8">
                  <span className="text-xs">{t('exposure.advancedOptions')}</span>
                  {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-3">
                {/* Dither Settings */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-xs">{t('exposure.dither')}</Label>
                    <p className="text-[10px] text-muted-foreground">
                      {t('exposure.ditherDescription')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={ditherEnabled}
                      onCheckedChange={setDitherEnabled}
                    />
                    {ditherEnabled && (
                      <Input
                        type="number"
                        value={ditherEvery}
                        onChange={(e) => setDitherEvery(Math.max(1, parseInt(e.target.value) || 1))}
                        className="h-7 w-12 text-center text-xs"
                        min={1}
                      />
                    )}
                  </div>
                </div>
                
                {/* Tracking Mode */}
                <div className="space-y-2">
                  <Label className="text-xs">{t('exposure.tracking')}</Label>
                  <ToggleGroup type="single" value={tracking} onValueChange={(v) => v && setTracking(v as typeof tracking)} variant="outline" size="sm" className="w-full">
                    {(['none', 'basic', 'guided'] as const).map((trackingMode) => (
                      <ToggleGroupItem key={trackingMode} value={trackingMode} className="flex-1 h-7 text-xs">
                        {trackingMode === 'none' 
                          ? t('exposure.trackingNone') 
                          : trackingMode === 'basic' 
                            ? t('exposure.trackingBasic') 
                            : t('exposure.trackingGuided')}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>
                
                {/* Target Type */}
                <div className="space-y-2">
                  <Label className="text-xs">{t('exposure.targetType')}</Label>
                  <ToggleGroup type="single" value={targetType} onValueChange={(v) => v && setTargetType(v as typeof targetType)} variant="outline" size="sm" className="w-full">
                    {(['galaxy', 'nebula', 'cluster', 'planetary'] as const).map((type) => (
                      <ToggleGroupItem key={type} value={type} className="flex-1 h-6 text-[10px]">
                        {t(`exposure.${type}`)}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </TabsContent>
          
          {/* Equipment Tab */}
          <TabsContent value="equipment" className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 pt-3 sm:pt-4 pr-1">
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1">
                  <Crosshair className="h-3 w-3" />
                  {t('exposure.focalLength')} (mm)
                </Label>
                <Input
                  type="number"
                  value={focalLength}
                  onChange={(e) => setFocalLength(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1">
                  <Aperture className="h-3 w-3" />
                  {t('exposure.aperture')} (mm)
                </Label>
                <Input
                  type="number"
                  value={aperture}
                  onChange={(e) => setAperture(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">{t('exposure.pixelSize')} (μm)</Label>
                <Input
                  type="number"
                  value={pixelSize}
                  onChange={(e) => setPixelSize(parseFloat(e.target.value) || 0)}
                  step={0.01}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">{t('exposure.fRatio')}</Label>
                <div className="h-10 flex items-center px-3 bg-muted rounded-md font-mono text-sm">
                  f/{fRatio.toFixed(1)}
                </div>
              </div>
            </div>
            
            <Separator />
            
            {/* Calculated Values */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm">{t('exposure.calculatedValues')}</CardTitle>
              </CardHeader>
              <CardContent className="py-2 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('exposure.imageScale')}</span>
                  <span className="font-mono">{imageScale.toFixed(2)} &quot;/px</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('exposure.recommendedSingle')}</span>
                  <span className="font-mono">{exposureCalc.recommendedSingle}s</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('exposure.recommendedTotal')}</span>
                  <span className="font-mono">{integrationCalc.recommended}m</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Plan Summary Tab */}
          <TabsContent value="plan" className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 pt-3 sm:pt-4 pr-1">
            <Card className="border-primary/50 bg-primary/5">
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>{t('exposure.sessionSummary')}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={handleCopy}
                  >
                    {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">{t('exposure.singleExposure')}</span>
                    <p className="font-mono font-medium">{exposureTime}s</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">{t('exposure.frameCount')}</span>
                    <p className="font-mono font-medium">{frameCount}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">{t('exposure.totalIntegration')}</span>
                    <p className="font-mono font-medium text-primary">{formatDuration(totalIntegrationMinutes)}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">{t('exposure.storageRequired')}</span>
                    <p className="font-mono font-medium">{totalStorageGB.toFixed(2)} GB</p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{filter}</Badge>
                  <Badge variant="outline">{t('exposure.gainLabel', { value: gain })}</Badge>
                  <Badge variant="outline">{binning}</Badge>
                  <Badge variant="outline">{imageType}</Badge>
                  {ditherEnabled && (
                    <Badge variant="outline">{t('exposure.ditherLabel', { value: ditherEvery })}</Badge>
                  )}
                </div>
                
                {/* Recommendation */}
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="flex items-center gap-1">
                    <Zap className="h-3 w-3 text-yellow-500" />
                    {totalIntegrationMinutes >= integrationCalc.recommended
                      ? t('exposure.meetsRecommended')
                      : t('exposure.belowRecommended', { 
                          recommended: integrationCalc.recommended,
                          current: Math.round(totalIntegrationMinutes)
                        })
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
            
            {/* Integration Comparison */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className={cn(
                'p-2 rounded-lg border',
                totalIntegrationMinutes >= integrationCalc.minimum ? 'border-green-500/50 bg-green-500/10' : 'border-border'
              )}>
                <p className="text-[10px] text-muted-foreground">{t('exposure.minimum')}</p>
                <p className="text-sm font-mono">{integrationCalc.minimum}m</p>
              </div>
              <div className={cn(
                'p-2 rounded-lg border',
                totalIntegrationMinutes >= integrationCalc.recommended ? 'border-primary bg-primary/10' : 'border-border'
              )}>
                <p className="text-[10px] text-primary">{t('exposure.recommended')}</p>
                <p className="text-sm font-mono font-medium">{integrationCalc.recommended}m</p>
              </div>
              <div className={cn(
                'p-2 rounded-lg border',
                totalIntegrationMinutes >= integrationCalc.ideal ? 'border-purple-500/50 bg-purple-500/10' : 'border-border'
              )}>
                <p className="text-[10px] text-muted-foreground">{t('exposure.ideal')}</p>
                <p className="text-sm font-mono">{integrationCalc.ideal}m</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
            {t('common.cancel')}
          </Button>
          {onExposurePlanChange && (
            <Button className="flex-1" onClick={handleApply}>
              {t('exposure.applyToTarget')}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}


