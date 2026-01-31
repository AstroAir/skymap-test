'use client';

import { useState, useCallback, useEffect } from 'react';
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
  Ruler,
  Eye,
  Database,
  Globe,
  Cpu,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { ImageCapture } from './image-capture';
import { SolverSettings } from './solver-settings';
import { IndexManager } from './index-manager';
import { 
  AstrometryApiClient, 
  type SolveProgress,
  type UploadOptions 
} from '@/lib/plate-solving';
import type { PlateSolveResult } from '@/lib/plate-solving';
import { isTauri } from '@/lib/tauri/app-control-api';
import {
  usePlateSolverStore,
  selectActiveSolver,
} from '@/lib/stores/plate-solver-store';
import {
  solveImageLocal,
  convertToLegacyResult,
  isLocalSolver,
} from '@/lib/tauri/plate-solver-api';

// ============================================================================
// Types
// ============================================================================

export interface PlateSolverUnifiedProps {
  onSolveComplete?: (result: PlateSolveResult) => void;
  onGoToCoordinates?: (ra: number, dec: number) => void;
  trigger?: React.ReactNode;
  className?: string;
  defaultImagePath?: string;
  raHint?: number;
  decHint?: number;
  fovHint?: number;
}

type SolveMode = 'online' | 'local';

// ============================================================================
// Component
// ============================================================================

export function PlateSolverUnified({ 
  onSolveComplete, 
  onGoToCoordinates,
  trigger, 
  className,
  defaultImagePath: _defaultImagePath,
  raHint,
  decHint,
  fovHint,
}: PlateSolverUnifiedProps) {
  const t = useTranslations();
  const isDesktop = isTauri();
  
  // Store state
  const {
    config,
    onlineApiKey,
    detectSolvers,
    setOnlineApiKey,
    loadConfig,
  } = usePlateSolverStore();
  const activeSolver = usePlateSolverStore(selectActiveSolver);
  const canSolveLocal = usePlateSolverStore((state) => {
    const active = selectActiveSolver(state);
    if (!active) return false;
    if (active.solver_type === 'astrometry_net_online') return false;
    return active.is_available && active.installed_indexes.length > 0;
  });

  // Local state
  const [open, setOpen] = useState(false);
  const [solveMode, setSolveMode] = useState<SolveMode>(isDesktop ? 'local' : 'online');
  const [solving, setSolving] = useState(false);
  const [progress, setProgress] = useState<SolveProgress | null>(null);
  const [localProgress, setLocalProgress] = useState<number>(0);
  const [localMessage, setLocalMessage] = useState<string>('');
  const [result, setResult] = useState<PlateSolveResult | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [options, setOptions] = useState<Partial<UploadOptions>>({
    downsampleFactor: 2,
    publiclyVisible: 'n',
  });

  const persistFileForLocalSolve = useCallback(async (file: File) => {
    const fileWithPath = file as File & { path?: string };
    if (fileWithPath.path) {
      return { filePath: fileWithPath.path, cleanup: undefined as undefined | (() => Promise<void>) };
    }

    const { mkdir, writeFile, remove } = await import('@tauri-apps/plugin-fs');
    const { BaseDirectory, appCacheDir, join } = await import('@tauri-apps/api/path');

    const dirName = 'plate-solving';
    await mkdir(dirName, { recursive: true, baseDir: BaseDirectory.AppCache });

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${Date.now()}-${safeName}`;
    const relativePath = `${dirName}/${fileName}`;

    const data = new Uint8Array(await file.arrayBuffer());
    await writeFile(relativePath, data, { baseDir: BaseDirectory.AppCache });

    const fullPath = await join(await appCacheDir(), dirName, fileName);

    return {
      filePath: fullPath,
      cleanup: async () => {
        await remove(relativePath, { baseDir: BaseDirectory.AppCache });
      },
    };
  }, []);

  // Initialize on open
  useEffect(() => {
    if (open && isDesktop) {
      detectSolvers();
      loadConfig();
    }
  }, [open, isDesktop, detectSolvers, loadConfig]);

  // Handle local solve
  const handleLocalSolve = useCallback(async (file: File) => {
    if (!isDesktop || !canSolveLocal) return;
    if (config.solver_type === 'astrometry_net_online') {
      setResult({
        success: false,
        coordinates: null,
        positionAngle: 0,
        pixelScale: 0,
        fov: { width: 0, height: 0 },
        flipped: false,
        solverName: activeSolver?.name || 'Local Solver',
        solveTime: 0,
        errorMessage: t('plateSolving.localSolverNotReady') || 'Local solver not ready.',
      });
      return;
    }

    setSolving(true);
    setResult(null);
    setLocalProgress(10);
    setLocalMessage(t('plateSolving.preparing') || 'Preparing...');

    let cleanup: undefined | (() => Promise<void>);

    try {
      const persisted = await persistFileForLocalSolve(file);
      cleanup = persisted.cleanup;

      setLocalProgress(30);
      setLocalMessage(t('plateSolving.solving') || 'Solving...');

      const solveResult = await solveImageLocal(
        config,
        {
          image_path: persisted.filePath,
          ra_hint: raHint ?? null,
          dec_hint: decHint ?? null,
          fov_hint: fovHint ?? null,
          search_radius: config.search_radius,
          downsample: config.downsample,
          timeout: config.timeout_seconds,
        }
      );

      setLocalProgress(100);
      setLocalMessage(solveResult.success 
        ? (t('plateSolving.success') || 'Success!') 
        : (t('plateSolving.failed') || 'Failed'));

      const legacyResult = convertToLegacyResult(solveResult);
      setResult(legacyResult);
      onSolveComplete?.(legacyResult);
    } catch (error) {
      setLocalProgress(100);
      setLocalMessage(t('plateSolving.failed') || 'Failed');
      setResult({
        success: false,
        coordinates: null,
        positionAngle: 0,
        pixelScale: 0,
        fov: { width: 0, height: 0 },
        flipped: false,
        solverName: activeSolver?.name || 'Local Solver',
        solveTime: 0,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      if (cleanup) {
        cleanup().catch(() => {});
      }
      setSolving(false);
    }
  }, [isDesktop, canSolveLocal, config, persistFileForLocalSolve, raHint, decHint, fovHint, activeSolver, onSolveComplete, t]);

  // Handle online solve
  const handleOnlineSolve = useCallback(async (file: File) => {
    if (!onlineApiKey) return;

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

  // Handle image capture
  const handleImageCapture = useCallback(async (file: File) => {
    if (solveMode === 'local' && isDesktop) {
      await handleLocalSolve(file);
    } else {
      await handleOnlineSolve(file);
    }
  }, [solveMode, isDesktop, handleLocalSolve, handleOnlineSolve]);

  // Handle go to coordinates
  const handleGoTo = useCallback(() => {
    if (result?.success && result.coordinates) {
      onGoToCoordinates?.(result.coordinates.ra, result.coordinates.dec);
      setOpen(false);
    }
  }, [result, onGoToCoordinates]);

  // Progress text for online solver
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
    if (solveMode === 'local') return localProgress;
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

  // Can solve check
  const canSolve = solveMode === 'local' ? canSolveLocal : !!onlineApiKey;

  // Get solver icon
  const getSolverIcon = () => {
    if (solveMode === 'online') return <Globe className="h-4 w-4" />;
    return <Cpu className="h-4 w-4" />;
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
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crosshair className="h-5 w-5" />
            {t('plateSolving.title') || 'Plate Solving'}
          </DialogTitle>
          <DialogDescription>
            {t('plateSolving.description') || 'Upload an astronomical image to determine its sky coordinates'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mode Selection (Desktop only) */}
          {isDesktop && (
            <Tabs value={solveMode} onValueChange={(v) => setSolveMode(v as SolveMode)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="local" className="flex items-center gap-2">
                  <Cpu className="h-4 w-4" />
                  {t('plateSolving.localSolver') || 'Local'}
                </TabsTrigger>
                <TabsTrigger value="online" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  {t('plateSolving.onlineSolver') || 'Online'}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="local" className="space-y-4 mt-4">
                {/* Active Solver Info */}
                {activeSolver && (
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                    <div className="flex items-center gap-2">
                      {getSolverIcon()}
                      <div>
                        <div className="font-medium text-sm">{activeSolver.name}</div>
                        {activeSolver.version && (
                          <div className="text-xs text-muted-foreground">{activeSolver.version}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {activeSolver.is_available ? (
                        <Badge variant="default" className="bg-green-600 text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {t('plateSolving.ready') || 'Ready'}
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs">
                          <XCircle className="h-3 w-3 mr-1" />
                          {t('plateSolving.notInstalled') || 'Not Installed'}
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setShowSettings(true)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Index Status */}
                {activeSolver && isLocalSolver(config.solver_type) && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <Database className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {activeSolver.installed_indexes.length}{' '}
                        {t('plateSolving.indexesInstalled') || 'indexes installed'}
                      </span>
                    </div>
                    <IndexManager solverType={config.solver_type} />
                  </div>
                )}

                {/* Warning if not ready */}
                {!canSolveLocal && (
                  <Alert>
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      {t('plateSolving.localSolverNotReady') || 
                        'Local solver not ready. Install a solver and download index files.'}
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>

              <TabsContent value="online" className="space-y-4 mt-4">
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
              </TabsContent>
            </Tabs>
          )}

          {/* Online-only mode for web */}
          {!isDesktop && (
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
          )}

          {/* Advanced Options */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  {t('plateSolving.advancedOptions') || 'Advanced Options'}
                </span>
                <ChevronDown className={cn("h-4 w-4 transition-transform", showAdvanced && 'rotate-180')} />
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
                    min={0}
                    max={8}
                    value={solveMode === 'local' ? config.downsample : (options.downsampleFactor || 2)}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      if (solveMode === 'local') {
                        usePlateSolverStore.getState().setConfig({ downsample: val });
                      } else {
                        setOptions(prev => ({ ...prev, downsampleFactor: val }));
                      }
                    }}
                    placeholder="0 = Auto"
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
                    value={solveMode === 'local' ? config.search_radius : (options.radius || '')}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 30;
                      if (solveMode === 'local') {
                        usePlateSolverStore.getState().setConfig({ search_radius: val });
                      } else {
                        setOptions(prev => ({ ...prev, radius: val }));
                      }
                    }}
                    placeholder="30"
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Image Selection & Solve */}
          <ImageCapture 
            onImageCapture={handleImageCapture}
            trigger={
              <Button 
                className="w-full" 
                disabled={!canSolve || solving}
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

          {/* Progress */}
          {solving && (
            <div className="space-y-2">
              <Progress value={getProgressPercent()} />
              <p className="text-sm text-center text-muted-foreground">
                {solveMode === 'local' ? localMessage : getProgressText()}
              </p>
            </div>
          )}

          {/* Result */}
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
                  <span className="ml-2">• {result.solverName}</span>
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Settings Dialog */}
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {t('plateSolving.solverSettings') || 'Solver Settings'}
              </DialogTitle>
            </DialogHeader>
            <SolverSettings onClose={() => setShowSettings(false)} />
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}

export default PlateSolverUnified;
