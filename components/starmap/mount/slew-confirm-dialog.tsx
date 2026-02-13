'use client';

import { useState, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Crosshair, AlertTriangle, Loader2, ShieldCheck, ShieldAlert } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';

import { useMountStore } from '@/lib/stores';
import { mountApi } from '@/lib/tauri/mount-api';
import { checkTargetSafety } from '@/lib/astronomy/mount-safety';
import { degreesToHMS, degreesToDMS } from '@/lib/astronomy/starmap-utils';
import { isTauri } from '@/lib/tauri/app-control-api';
import { createLogger } from '@/lib/logger';

const logger = createLogger('slew-confirm');

export interface SlewConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetName: string;
  targetRa: number;
  targetDec: number;
  onSlewStarted?: () => void;
}

export function SlewConfirmDialog({
  open,
  onOpenChange,
  targetName,
  targetRa,
  targetDec,
  onSlewStarted,
}: SlewConfirmDialogProps) {
  const t = useTranslations('mount');
  const [slewing, setSlewing] = useState(false);
  const [error, setError] = useState('');

  const safetyConfig = useMountStore((s) => s.safetyConfig);
  const profileInfo = useMountStore((s) => s.profileInfo);
  const connected = useMountStore((s) => s.mountInfo.Connected);
  const parked = useMountStore((s) => s.mountInfo.Parked);

  const latitude = profileInfo.AstrometrySettings.Latitude || 0;
  const longitude = profileInfo.AstrometrySettings.Longitude || 0;

  // Run safety check
  const safetyResult = useMemo(() => {
    if (!open) return null;
    const now = new Date();
    const end = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour window
    return checkTargetSafety(
      'slew-target',
      targetName,
      targetRa,
      targetDec,
      now,
      end,
      latitude,
      longitude,
      safetyConfig,
    );
  }, [open, targetName, targetRa, targetDec, latitude, longitude, safetyConfig]);

  const dangers = safetyResult?.issues.filter((i) => i.severity === 'danger') ?? [];
  const warnings = safetyResult?.issues.filter((i) => i.severity === 'warning') ?? [];
  const hasDanger = dangers.length > 0;

  const handleSlew = useCallback(async () => {
    if (!isTauri() || !connected) return;

    setSlewing(true);
    setError('');

    try {
      await mountApi.slewTo(targetRa, targetDec);
      logger.info('Slew started', { target: targetName, ra: targetRa, dec: targetDec });
      onSlewStarted?.();
      onOpenChange(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      logger.error('Slew failed', { error: msg });
    } finally {
      setSlewing(false);
    }
  }, [connected, targetRa, targetDec, targetName, onSlewStarted, onOpenChange]);

  const raDisplay = degreesToHMS(((targetRa % 360) + 360) % 360);
  const decDisplay = degreesToDMS(targetDec);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crosshair className="h-4 w-4" />
            {t('slewConfirm')}
          </DialogTitle>
          <DialogDescription>
            {t('slewConfirmDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* Target info */}
          <div className="rounded-lg border border-border p-3 space-y-1">
            <p className="text-sm font-medium">{targetName}</p>
            <div className="flex gap-3 text-xs font-mono text-muted-foreground">
              <span>RA: {raDisplay}</span>
              <span>Dec: {decDisplay}</span>
            </div>
          </div>

          {/* Safety status */}
          {safetyResult && (
            <div className="space-y-2">
              {dangers.length === 0 && warnings.length === 0 && (
                <div className="flex items-center gap-2 text-green-500 text-sm">
                  <ShieldCheck className="h-4 w-4" />
                  {t('safetyClear')}
                </div>
              )}

              {dangers.map((issue, i) => (
                <div key={`d-${i}`} className="flex items-start gap-2 text-destructive text-xs rounded-md bg-destructive/10 p-2">
                  <ShieldAlert className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>{t(`safetyIssues.${issue.type}`)}</span>
                </div>
              ))}

              {warnings.map((issue, i) => (
                <div key={`w-${i}`} className="flex items-start gap-2 text-yellow-500 text-xs rounded-md bg-yellow-500/10 p-2">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>{t(`safetyIssues.${issue.type}`)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Status warnings */}
          {parked && (
            <div className="flex items-center gap-2 text-yellow-500 text-xs">
              <AlertTriangle className="h-3.5 w-3.5" />
              {t('mountParkedWarning')}
            </div>
          )}

          {!connected && (
            <div className="flex items-center gap-2 text-destructive text-xs">
              <AlertTriangle className="h-3.5 w-3.5" />
              {t('notConnectedWarning')}
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button
            onClick={handleSlew}
            disabled={slewing || !connected}
            variant={hasDanger ? 'destructive' : 'default'}
          >
            {slewing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Crosshair className="h-4 w-4 mr-2" />
            {hasDanger ? t('slewAnyway') : t('startSlew')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
