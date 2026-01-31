'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { 
  Crosshair, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Settings,
  MapPin,
  RotateCw,
  ChevronDown,
  Ruler,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ImageCapture } from './image-capture';
import { 
  AstrometryApiClient, 
  type SolveProgress,
  type UploadOptions 
} from '@/lib/plate-solving';
import type { PlateSolveResult } from '@/lib/plate-solving';
import { usePlateSolverStore } from '@/lib/stores/plate-solver-store';

export interface PlateSolverProps {
  onSolveComplete?: (result: PlateSolveResult) => void;
  onGoToCoordinates?: (ra: number, dec: number) => void;
  trigger?: React.ReactNode;
  className?: string;
}

export function PlateSolver({ 
  onSolveComplete, 
  onGoToCoordinates,
  trigger, 
  className 
}: PlateSolverProps) {
  const t = useTranslations();
  const { onlineApiKey, setOnlineApiKey } = usePlateSolverStore();
  const [open, setOpen] = useState(false);
  const [solving, setSolving] = useState(false);
  const [progress, setProgress] = useState<SolveProgress | null>(null);
  const [result, setResult] = useState<PlateSolveResult | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [options, setOptions] = useState<Partial<UploadOptions>>({
    downsampleFactor: 2,
    publiclyVisible: 'n',
  });

  const handleImageCapture = useCallback(async (file: File) => {
    if (!onlineApiKey) {
      return;
    }

    setSolving(true);
    setResult(null);
    setProgress({ stage: 'uploading', progress: 0 });

    try {
      const client = new AstrometryApiClient({ apiKey: onlineApiKey });
      const solveResult = await client.solve(file, options, setProgress);
      setResult(solveResult);
      onSolveComplete?.(solveResult);
    } catch (error) {
      setResult({
        success: false,
        coordinates: null,
        positionAngle: 0,
        pixelScale: 0,
        fov: { width: 0, height: 0 },
        flipped: false,
        solverName: 'astrometry.net',
        solveTime: 0,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setSolving(false);
    }
  }, [onlineApiKey, options, onSolveComplete]);

  const handleGoTo = useCallback(() => {
    if (result?.success && result.coordinates) {
      onGoToCoordinates?.(result.coordinates.ra, result.coordinates.dec);
      setOpen(false);
    }
  }, [result, onGoToCoordinates]);

  const getProgressText = () => {
    if (!progress) return '';
    switch (progress.stage) {
      case 'uploading':
        return `${t('plateSolving.uploading') || 'Uploading'}... ${progress.progress}%`;
      case 'queued':
        return `${t('plateSolving.queued') || 'Queued'} (ID: ${progress.subid})`;
      case 'processing':
        return `${t('plateSolving.processing') || 'Processing'} (Job: ${progress.jobId})`;
      case 'success':
        return t('plateSolving.success') || 'Success!';
      case 'failed':
        return `${t('plateSolving.failed') || 'Failed'}: ${progress.error}`;
    }
  };

  const getProgressPercent = () => {
    if (!progress) return 0;
    switch (progress.stage) {
      case 'uploading': return progress.progress * 0.3;
      case 'queued': return 30;
      case 'processing': return 60;
      case 'success': return 100;
      case 'failed': return 100;
      default: return 0;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className={cn("h-9 w-9", className)}>
            <Crosshair className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crosshair className="h-5 w-5" />
            {t('plateSolving.title') || 'Plate Solving'}
          </DialogTitle>
          <DialogDescription>
            {t('plateSolving.description') || 'Upload an astronomical image to determine its sky coordinates using astrometry.net'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">
              {t('plateSolving.apiKey') || 'Astrometry.net API Key'}
            </Label>
            <Input
              id="apiKey"
              type="password"
              value={onlineApiKey}
              onChange={(e) => setOnlineApiKey(e.target.value)}
              placeholder={t('plateSolving.apiKeyPlaceholder') || 'Enter your API key'}
            />
            <p className="text-xs text-muted-foreground">
              {t('plateSolving.apiKeyHint') || 'Get your free API key at nova.astrometry.net'}
            </p>
          </div>

          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  {t('plateSolving.advancedOptions') || 'Advanced Options'}
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="downsample" className="text-xs">
                    {t('plateSolving.downsample') || 'Downsample Factor'}
                  </Label>
                  <Input
                    id="downsample"
                    type="number"
                    min={1}
                    max={8}
                    value={options.downsampleFactor || 2}
                    onChange={(e) => setOptions(prev => ({ 
                      ...prev, 
                      downsampleFactor: parseInt(e.target.value) || 2 
                    }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="radius" className="text-xs">
                    {t('plateSolving.searchRadius') || 'Search Radius (°)'}
                  </Label>
                  <Input
                    id="radius"
                    type="number"
                    min={0}
                    max={180}
                    value={options.radius || ''}
                    onChange={(e) => setOptions(prev => ({ 
                      ...prev, 
                      radius: parseFloat(e.target.value) || undefined 
                    }))}
                    placeholder="Auto"
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <ImageCapture 
            onImageCapture={handleImageCapture}
            trigger={
              <Button 
                className="w-full" 
                disabled={!onlineApiKey || solving}
              >
                {solving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('plateSolving.solving') || 'Solving...'}
                  </>
                ) : (
                  <>
                    <Crosshair className="h-4 w-4 mr-2" />
                    {t('plateSolving.selectImage') || 'Select Image to Solve'}
                  </>
                )}
              </Button>
            }
          />

          {solving && progress && (
            <div className="space-y-2">
              <Progress value={getProgressPercent()} />
              <p className="text-sm text-center text-muted-foreground">
                {getProgressText()}
              </p>
            </div>
          )}

          {result && (
            <Card className={result.success ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-3">
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="font-medium">
                    {result.success 
                      ? (t('plateSolving.solveSuccess') || 'Plate Solve Successful!')
                      : (t('plateSolving.solveFailed') || 'Plate Solve Failed')
                    }
                  </span>
                </div>

                {result.success && result.coordinates && (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>RA: {result.coordinates.raHMS}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>Dec: {result.coordinates.decDMS}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <RotateCw className="h-4 w-4 text-muted-foreground" />
                      <span>{t('plateSolving.rotation') || 'Rotation'}: {result.positionAngle.toFixed(2)}°</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Ruler className="h-4 w-4 text-muted-foreground" />
                      <span>{t('plateSolving.pixelScale') || 'Scale'}: {result.pixelScale.toFixed(2)}&quot;/px</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span>{t('plateSolving.fov') || 'FOV'}: {result.fov.width.toFixed(2)}° × {result.fov.height.toFixed(2)}°</span>
                    </div>

                    {onGoToCoordinates && (
                      <Button onClick={handleGoTo} className="w-full mt-3">
                        <MapPin className="h-4 w-4 mr-2" />
                        {t('plateSolving.goToPosition') || 'Go to Position'}
                      </Button>
                    )}
                  </div>
                )}

                {!result.success && result.errorMessage && (
                  <Alert variant="destructive" className="mt-2">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>{result.errorMessage}</AlertDescription>
                  </Alert>
                )}

                <p className="text-xs text-muted-foreground mt-2">
                  {t('plateSolving.solveTime') || 'Solve time'}: {(result.solveTime / 1000).toFixed(1)}s
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
