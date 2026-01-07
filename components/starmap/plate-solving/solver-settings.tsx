'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import {
  Settings,
  CheckCircle,
  XCircle,
  RefreshCw,
  Loader2,
  AlertTriangle,
  HardDrive,
  Globe,
  Cpu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  usePlateSolverStore,
  selectActiveSolver,
  selectCanSolve,
} from '@/lib/stores/plate-solver-store';
import type { SolverType, SolverInfo } from '@/lib/tauri/plate-solver-api';
import {
  isLocalSolver,
  formatFileSize,
  validateSolverPath,
} from '@/lib/tauri/plate-solver-api';

// ============================================================================
// Types
// ============================================================================

export interface SolverSettingsProps {
  onClose?: () => void;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function SolverSettings({ onClose, className }: SolverSettingsProps) {
  const t = useTranslations();
  const {
    detectedSolvers,
    isDetecting,
    detectionError,
    config,
    onlineApiKey,
    detectSolvers,
    setConfig,
    saveConfig,
    setOnlineApiKey,
  } = usePlateSolverStore();

  const activeSolver = usePlateSolverStore(selectActiveSolver);
  const canSolve = usePlateSolverStore(selectCanSolve);

  const [customPath, setCustomPath] = useState(config.executable_path || '');
  const [isValidatingPath, setIsValidatingPath] = useState(false);
  const [pathValid, setPathValid] = useState<boolean | null>(null);

  // Detect solvers on mount
  useEffect(() => {
    if (detectedSolvers.length === 0) {
      detectSolvers();
    }
  }, [detectedSolvers.length, detectSolvers]);

  // Validate custom path
  const handleValidatePath = useCallback(async () => {
    if (!customPath) {
      setPathValid(null);
      return;
    }

    setIsValidatingPath(true);
    try {
      const valid = await validateSolverPath(config.solver_type, customPath);
      setPathValid(valid);
      if (valid) {
        setConfig({ executable_path: customPath });
      }
    } catch (_error) {
      setPathValid(false);
    } finally {
      setIsValidatingPath(false);
    }
  }, [customPath, config.solver_type, setConfig]);

  // Handle solver type change
  const handleSolverChange = useCallback(
    (value: string) => {
      setConfig({ solver_type: value as SolverType });
      setCustomPath('');
      setPathValid(null);
    },
    [setConfig]
  );

  // Save settings
  const handleSave = useCallback(async () => {
    await saveConfig();
    onClose?.();
  }, [saveConfig, onClose]);

  // Get solver icon
  const getSolverIcon = (solver: SolverInfo) => {
    if (solver.solver_type === 'astrometry_net_online') {
      return <Globe className="h-4 w-4" />;
    }
    return <Cpu className="h-4 w-4" />;
  };

  // Get status badge
  const getStatusBadge = (solver: SolverInfo) => {
    if (solver.solver_type === 'astrometry_net_online') {
      return (
        <Badge variant="secondary" className="text-xs">
          {t('plateSolving.online') || 'Online'}
        </Badge>
      );
    }
    if (solver.is_available) {
      return (
        <Badge variant="default" className="text-xs bg-green-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          {t('plateSolving.installed') || 'Installed'}
        </Badge>
      );
    }
    return (
      <Badge variant="destructive" className="text-xs">
        <XCircle className="h-3 w-3 mr-1" />
        {t('plateSolving.notInstalled') || 'Not Installed'}
      </Badge>
    );
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Solver Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-4 w-4" />
            {t('plateSolving.solverSelection') || 'Solver Selection'}
          </CardTitle>
          <CardDescription>
            {t('plateSolving.solverSelectionDesc') ||
              'Choose which plate solver to use'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Refresh Button */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={detectSolvers}
              disabled={isDetecting}
            >
              {isDetecting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {t('plateSolving.detectSolvers') || 'Detect Solvers'}
            </Button>
          </div>

          {detectionError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{detectionError}</AlertDescription>
            </Alert>
          )}

          {/* Solver List */}
          <div className="space-y-2">
            {detectedSolvers.map((solver) => (
              <div
                key={solver.solver_type}
                className={cn(
                  'flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors',
                  config.solver_type === solver.solver_type
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted/50'
                )}
                onClick={() => handleSolverChange(solver.solver_type)}
              >
                <div className="flex items-center gap-3">
                  {getSolverIcon(solver)}
                  <div>
                    <div className="font-medium">{solver.name}</div>
                    {solver.version && (
                      <div className="text-xs text-muted-foreground">
                        {solver.version}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(solver)}
                  {config.solver_type === solver.solver_type && (
                    <CheckCircle className="h-4 w-4 text-primary" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Custom Path (for local solvers) */}
          {isLocalSolver(config.solver_type) && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label>
                  {t('plateSolving.customPath') || 'Custom Executable Path'}
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={customPath}
                    onChange={(e) => {
                      setCustomPath(e.target.value);
                      setPathValid(null);
                    }}
                    placeholder={
                      activeSolver?.executable_path ||
                      (t('plateSolving.pathPlaceholder') || 'Path to solver executable')
                    }
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={handleValidatePath}
                    disabled={!customPath || isValidatingPath}
                  >
                    {isValidatingPath ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : pathValid === true ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : pathValid === false ? (
                      <XCircle className="h-4 w-4 text-red-500" />
                    ) : (
                      t('plateSolving.validate') || 'Validate'
                    )}
                  </Button>
                </div>
                {pathValid === false && (
                  <p className="text-xs text-red-500">
                    {t('plateSolving.invalidPath') || 'Invalid solver path'}
                  </p>
                )}
              </div>
            </>
          )}

          {/* Online API Key */}
          {config.solver_type === 'astrometry_net_online' && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="apiKey">
                  {t('plateSolving.apiKey') || 'Astrometry.net API Key'}
                </Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={onlineApiKey}
                  onChange={(e) => setOnlineApiKey(e.target.value)}
                  placeholder={
                    t('plateSolving.apiKeyPlaceholder') || 'Enter your API key'
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {t('plateSolving.apiKeyHint') ||
                    'Get your free API key at nova.astrometry.net'}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Solver Options */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {t('plateSolving.solverOptions') || 'Solver Options'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Timeout */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>
                {t('plateSolving.timeout') || 'Timeout'}
              </Label>
              <span className="text-sm text-muted-foreground">
                {config.timeout_seconds}s
              </span>
            </div>
            <Slider
              value={[config.timeout_seconds]}
              onValueChange={([value]) => setConfig({ timeout_seconds: value })}
              min={30}
              max={300}
              step={10}
            />
          </div>

          {/* Downsample */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>
                {t('plateSolving.downsample') || 'Downsample Factor'}
              </Label>
              <span className="text-sm text-muted-foreground">
                {config.downsample === 0
                  ? t('plateSolving.auto') || 'Auto'
                  : `${config.downsample}x`}
              </span>
            </div>
            <Slider
              value={[config.downsample]}
              onValueChange={([value]) => setConfig({ downsample: value })}
              min={0}
              max={4}
              step={1}
            />
          </div>

          {/* Search Radius */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>
                {t('plateSolving.searchRadius') || 'Search Radius'}
              </Label>
              <span className="text-sm text-muted-foreground">
                {config.search_radius}°
              </span>
            </div>
            <Slider
              value={[config.search_radius]}
              onValueChange={([value]) => setConfig({ search_radius: value })}
              min={5}
              max={180}
              step={5}
            />
          </div>

          {/* Use SIP */}
          {isLocalSolver(config.solver_type) && (
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>
                  {t('plateSolving.useSip') || 'Use SIP Coefficients'}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t('plateSolving.useSipDesc') ||
                    'Add polynomial distortion correction'}
                </p>
              </div>
              <Switch
                checked={config.use_sip}
                onCheckedChange={(checked) => setConfig({ use_sip: checked })}
              />
            </div>
          )}

          {/* ASTAP-specific options */}
          {config.solver_type === 'astap' && (
            <>
              <Separator className="my-4" />
              <div className="space-y-4">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Cpu className="h-4 w-4" />
                  {t('plateSolving.astapOptions') || 'ASTAP Options'}
                </h4>

                {/* Max Stars */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>
                      {t('plateSolving.maxStars') || 'Max Stars'}
                    </Label>
                    <span className="text-sm text-muted-foreground">
                      {config.astap_max_stars}
                    </span>
                  </div>
                  <Slider
                    value={[config.astap_max_stars]}
                    onValueChange={([value]) => setConfig({ astap_max_stars: value })}
                    min={100}
                    max={1000}
                    step={50}
                  />
                </div>

                {/* Tolerance */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>
                      {t('plateSolving.tolerance') || 'Tolerance'}
                    </Label>
                    <span className="text-sm text-muted-foreground">
                      {config.astap_tolerance.toFixed(4)}
                    </span>
                  </div>
                  <Slider
                    value={[config.astap_tolerance * 1000]}
                    onValueChange={([value]) => setConfig({ astap_tolerance: value / 1000 })}
                    min={1}
                    max={20}
                    step={1}
                  />
                </div>

                {/* Min Star Size */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>
                      {t('plateSolving.minStarSize') || 'Min Star Size'}
                    </Label>
                    <span className="text-sm text-muted-foreground">
                      {config.astap_min_star_size.toFixed(1)}&quot;
                    </span>
                  </div>
                  <Slider
                    value={[config.astap_min_star_size * 10]}
                    onValueChange={([value]) => setConfig({ astap_min_star_size: value / 10 })}
                    min={5}
                    max={50}
                    step={5}
                  />
                </div>

                {/* Equalise Background */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>
                      {t('plateSolving.equaliseBackground') || 'Equalise Background'}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {t('plateSolving.equaliseBackgroundDesc') ||
                        'For images with gradient backgrounds'}
                    </p>
                  </div>
                  <Switch
                    checked={config.astap_equalise_background}
                    onCheckedChange={(checked) => setConfig({ astap_equalise_background: checked })}
                  />
                </div>
              </div>
            </>
          )}

          {/* Astrometry.net-specific options */}
          {config.solver_type === 'astrometry_net' && (
            <>
              <Separator className="my-4" />
              <div className="space-y-4">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  {t('plateSolving.astrometryOptions') || 'Astrometry.net Options'}
                </h4>

                {/* Scale Low */}
                <div className="space-y-2">
                  <Label>
                    {t('plateSolving.scaleLow') || 'Scale Low'}
                  </Label>
                  <Input
                    type="number"
                    value={config.astrometry_scale_low ?? ''}
                    onChange={(e) => setConfig({ 
                      astrometry_scale_low: e.target.value ? parseFloat(e.target.value) : null 
                    })}
                    placeholder={t('plateSolving.auto') || 'Auto'}
                    step={0.1}
                  />
                </div>

                {/* Scale High */}
                <div className="space-y-2">
                  <Label>
                    {t('plateSolving.scaleHigh') || 'Scale High'}
                  </Label>
                  <Input
                    type="number"
                    value={config.astrometry_scale_high ?? ''}
                    onChange={(e) => setConfig({ 
                      astrometry_scale_high: e.target.value ? parseFloat(e.target.value) : null 
                    })}
                    placeholder={t('plateSolving.auto') || 'Auto'}
                    step={0.1}
                  />
                </div>

                {/* No Verify */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>
                      {t('plateSolving.skipVerify') || 'Skip Verification'}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {t('plateSolving.skipVerifyDesc') || 'Faster but may reduce accuracy'}
                    </p>
                  </div>
                  <Switch
                    checked={config.astrometry_no_verify}
                    onCheckedChange={(checked) => setConfig({ astrometry_no_verify: checked })}
                  />
                </div>

                {/* CRPIX Center */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>
                      {t('plateSolving.crpixCenter') || 'Center Reference Pixel'}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {t('plateSolving.crpixCenterDesc') || 'Set reference point to image center'}
                    </p>
                  </div>
                  <Switch
                    checked={config.astrometry_crpix_center}
                    onCheckedChange={(checked) => setConfig({ astrometry_crpix_center: checked })}
                  />
                </div>
              </div>
            </>
          )}

          {/* General Options */}
          <Separator className="my-4" />
          <div className="space-y-4">
            <h4 className="text-sm font-medium">
              {t('plateSolving.generalOptions') || 'General Options'}
            </h4>

            {/* Auto Hints */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>
                  {t('plateSolving.autoHints') || 'Auto Position Hints'}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t('plateSolving.autoHintsDesc') || 'Use current view position as hint'}
                </p>
              </div>
              <Switch
                checked={config.auto_hints}
                onCheckedChange={(checked) => setConfig({ auto_hints: checked })}
              />
            </div>

            {/* Keep WCS */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>
                  {t('plateSolving.keepWcs') || 'Keep WCS File'}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t('plateSolving.keepWcsDesc') || 'Save WCS output for later use'}
                </p>
              </div>
              <Switch
                checked={config.keep_wcs_file}
                onCheckedChange={(checked) => setConfig({ keep_wcs_file: checked })}
              />
            </div>

            {/* Retry on Failure */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>
                  {t('plateSolving.retryOnFailure') || 'Retry on Failure'}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t('plateSolving.retryOnFailureDesc') || 'Retry with different settings'}
                </p>
              </div>
              <Switch
                checked={config.retry_on_failure}
                onCheckedChange={(checked) => setConfig({ retry_on_failure: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Index Status */}
      {activeSolver && isLocalSolver(config.solver_type) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              {t('plateSolving.indexStatus') || 'Index Files'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeSolver.installed_indexes.length > 0 ? (
              <div className="space-y-2">
                <div className="text-sm">
                  {activeSolver.installed_indexes.length}{' '}
                  {t('plateSolving.indexesInstalled') || 'index files installed'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {t('plateSolving.totalSize') || 'Total size'}:{' '}
                  {formatFileSize(
                    activeSolver.installed_indexes.reduce(
                      (sum, idx) => sum + idx.size_bytes,
                      0
                    )
                  )}
                </div>
              </div>
            ) : (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {t('plateSolving.noIndexes') ||
                    'No index files found. Download indexes to use this solver.'}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Status */}
      {!canSolve && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {config.solver_type === 'astrometry_net_online'
              ? t('plateSolving.needApiKey') || 'API key required for online solving'
              : t('plateSolving.solverNotReady') ||
                'Solver is not ready. Check installation and index files.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2">
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel') || 'Cancel'}
          </Button>
        )}
        <Button onClick={handleSave}>
          {t('common.save') || 'Save'}
        </Button>
      </div>
    </div>
  );
}

export default SolverSettings;
