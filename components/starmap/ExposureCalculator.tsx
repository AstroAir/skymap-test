'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Calculator, Clock, Aperture, Sun, Crosshair } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
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

import {
  BORTLE_SCALE,
  calculateExposure,
  calculateTotalIntegration,
} from '@/lib/starmap/astro-utils';

interface ExposureCalculatorProps {
  focalLength?: number;
  onExposurePlanChange?: (plan: {
    singleExposure: number;
    totalExposure: number;
    subFrames: number;
  }) => void;
}

export function ExposureCalculator({
  focalLength: propFocalLength,
  onExposurePlanChange,
}: ExposureCalculatorProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [bortle, setBortle] = useState(5);
  const [focalLength, setFocalLength] = useState(propFocalLength || 400);
  const [aperture, setAperture] = useState(80);
  const [tracking, setTracking] = useState<'none' | 'basic' | 'guided'>('guided');
  const [targetType, setTargetType] = useState<'galaxy' | 'nebula' | 'cluster' | 'planetary'>('nebula');
  const [isNarrowband, setIsNarrowband] = useState(false);
  const [customSingleExp, setCustomSingleExp] = useState<number | null>(null);

  // Calculate exposure recommendations
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

  // Calculate sub-frames needed
  const singleExp = customSingleExp ?? exposureCalc.recommendedSingle;
  const subFramesForMin = Math.ceil((integrationCalc.minimum * 60) / singleExp);
  const subFramesForRec = Math.ceil((integrationCalc.recommended * 60) / singleExp);
  const subFramesForIdeal = Math.ceil((integrationCalc.ideal * 60) / singleExp);

  const handleApplyPlan = () => {
    onExposurePlanChange?.({
      singleExposure: singleExp,
      totalExposure: integrationCalc.recommended,
      subFrames: subFramesForRec,
    });
    setOpen(false);
  };

  const bortleInfo = BORTLE_SCALE.find((b) => b.value === bortle);

  return (
    <TooltipProvider>
      <Popover open={open} onOpenChange={setOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                <Calculator className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>{t('exposure.exposureCalculator')}</p>
          </TooltipContent>
        </Tooltip>

        <PopoverContent className="w-80" side="left">
          <div className="space-y-4">
            <h4 className="font-medium text-foreground flex items-center gap-2">
              <Calculator className="h-4 w-4 text-primary" />
              {t('exposure.exposureCalculator')}
            </h4>

            {/* Bortle Scale */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-foreground flex items-center gap-1.5">
                  <Sun className="h-3 w-3" />
                  {t('exposure.lightPollution')}
                </Label>
                <Badge variant="outline" className="text-xs">
                  SQM: {bortleInfo?.sqm.toFixed(2)}
                </Badge>
              </div>
              <Select
                value={bortle.toString()}
                onValueChange={(v) => setBortle(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {BORTLE_SCALE.map((b) => (
                    <SelectItem key={b.value} value={b.value.toString()}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono w-4">{b.value}</span>
                        <span className="text-sm">{b.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{bortleInfo?.description}</p>
            </div>

            <Separator />

            {/* Equipment */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Crosshair className="h-3 w-3" />
                  {t('exposure.focalLength')}
                </Label>
                <Input
                  type="number"
                  value={focalLength}
                  onChange={(e) => setFocalLength(parseInt(e.target.value) || 0)}
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Aperture className="h-3 w-3" />
                  {t('exposure.aperture')}
                </Label>
                <Input
                  type="number"
                  value={aperture}
                  onChange={(e) => setAperture(parseInt(e.target.value) || 0)}
                  className="h-8"
                />
              </div>
            </div>

            {/* Tracking */}
            <div className="space-y-2">
              <Label className="text-foreground">{t('exposure.tracking')}</Label>
              <div className="flex gap-1">
                {(['none', 'basic', 'guided'] as const).map((trackingType) => (
                  <Button
                    key={trackingType}
                    variant={tracking === trackingType ? 'default' : 'outline'}
                    size="sm"
                    className={`flex-1 text-xs h-7 ${
                      tracking === trackingType
                        ? ''
                        : 'border-border text-muted-foreground hover:bg-accent'
                    }`}
                    onClick={() => setTracking(trackingType)}
                  >
                    {trackingType === 'none' ? t('exposure.trackingNone') : trackingType === 'basic' ? t('exposure.trackingBasic') : t('exposure.trackingGuided')}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Target Type */}
            <div className="space-y-2">
              <Label className="text-foreground">{t('exposure.targetType')}</Label>
              <div className="grid grid-cols-2 gap-1">
                {(['galaxy', 'nebula', 'cluster', 'planetary'] as const).map((type) => (
                  <Button
                    key={type}
                    variant={targetType === type ? 'default' : 'outline'}
                    size="sm"
                    className={`text-xs h-7 ${
                      targetType === type
                        ? ''
                        : 'border-border text-muted-foreground hover:bg-accent'
                    }`}
                    onClick={() => setTargetType(type)}
                  >
                    {t(`exposure.${type}`)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Narrowband toggle */}
            <div className="flex items-center justify-between">
              <Label className="text-foreground text-sm">{t('exposure.narrowbandFilter')}</Label>
              <Button
                variant={isNarrowband ? 'default' : 'outline'}
                size="sm"
                className={`h-6 text-xs ${
                  isNarrowband
                    ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    : 'border-border text-muted-foreground hover:bg-accent'
                }`}
                onClick={() => setIsNarrowband(!isNarrowband)}
              >
                {isNarrowband ? t('common.yes') : t('common.no')}
              </Button>
            </div>

            <Separator />

            {/* Results */}
            <Card>
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-sm text-primary flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {t('exposure.recommendedExposure')}
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-3 space-y-3">
                {/* Single exposure */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{t('exposure.singleExposure')}</span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={customSingleExp ?? exposureCalc.recommendedSingle}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setCustomSingleExp(val > 0 ? val : null);
                        }}
                        className="h-6 w-16 text-xs text-right"
                      />
                      <span className="text-foreground">sec</span>
                    </div>
                  </div>
                  {tracking === 'none' && (
                    <p className="text-[10px] text-destructive">
                      Max untracked: {exposureCalc.maxUntracked.toFixed(1)}s (500 rule)
                    </p>
                  )}
                </div>

                {/* Integration time recommendations */}
                <div className="space-y-2 pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground">{t('exposure.totalIntegration')}</p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground">{t('exposure.minimum')}</p>
                      <p className="text-sm text-foreground font-mono">{integrationCalc.minimum}m</p>
                      <p className="text-[9px] text-muted-foreground">{subFramesForMin} subs</p>
                    </div>
                    <div className="space-y-1 bg-primary/20 rounded p-1">
                      <p className="text-[10px] text-primary">{t('exposure.recommended')}</p>
                      <p className="text-sm text-primary font-mono font-bold">{integrationCalc.recommended}m</p>
                      <p className="text-[9px] text-primary">{subFramesForRec} subs</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground">{t('exposure.ideal')}</p>
                      <p className="text-sm text-foreground font-mono">{integrationCalc.ideal}m</p>
                      <p className="text-[9px] text-muted-foreground">{subFramesForIdeal} subs</p>
                    </div>
                  </div>
                </div>

                {/* f-ratio info */}
                <div className="text-[10px] text-muted-foreground pt-1">
                  f/{(focalLength / aperture).toFixed(1)} • {isNarrowband ? t('exposure.narrowband') : t('exposure.broadband')}
                </div>
              </CardContent>
            </Card>

            {/* Apply button */}
            {onExposurePlanChange && (
              <Button
                className="w-full"
                onClick={handleApplyPlan}
              >
                {t('exposure.applyToTarget')}
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  );
}
