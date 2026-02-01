'use client';

import { memo, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface GoToCoordinatesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (ra: number, dec: number) => void;
}

export const GoToCoordinatesDialog = memo(function GoToCoordinatesDialog({
  open,
  onOpenChange,
  onNavigate,
}: GoToCoordinatesDialogProps) {
  const t = useTranslations();
  const [goToRa, setGoToRa] = useState('');
  const [goToDec, setGoToDec] = useState('');
  const [coordError, setCoordError] = useState('');

  // Parse coordinate string (supports degrees or HMS/DMS format)
  const parseCoordinate = useCallback((value: string, isDec: boolean): number | null => {
    const trimmed = value.trim();
    if (!trimmed) return null;

    // Try parsing as decimal degrees first
    const decimal = parseFloat(trimmed);
    if (!isNaN(decimal)) {
      if (isDec && (decimal < -90 || decimal > 90)) return null;
      if (!isDec && (decimal < 0 || decimal > 360)) return null;
      return decimal;
    }

    // Try parsing HMS format for RA (e.g., "00h42m44s" or "00:42:44")
    if (!isDec) {
      const hmsMatch = trimmed.match(/^(\d+)[h:]\s*(\d+)[m:]\s*([\d.]+)s?$/i);
      if (hmsMatch) {
        const h = parseFloat(hmsMatch[1]);
        const m = parseFloat(hmsMatch[2]);
        const s = parseFloat(hmsMatch[3]);
        if (h >= 0 && h < 24 && m >= 0 && m < 60 && s >= 0 && s < 60) {
          return (h + m / 60 + s / 3600) * 15; // Convert to degrees
        }
      }
    }

    // Try parsing DMS format for Dec (e.g., "+41°16'09\"" or "+41:16:09")
    if (isDec) {
      const dmsMatch = trimmed.match(/^([+-]?)(\d+)[°:]\s*(\d+)[':](\s*([\d.]+)["']?)?$/i);
      if (dmsMatch) {
        const sign = dmsMatch[1] === '-' ? -1 : 1;
        const d = parseFloat(dmsMatch[2]);
        const m = parseFloat(dmsMatch[3]);
        const s = dmsMatch[5] ? parseFloat(dmsMatch[5]) : 0;
        if (d >= 0 && d <= 90 && m >= 0 && m < 60 && s >= 0 && s < 60) {
          const result = sign * (d + m / 60 + s / 3600);
          if (result >= -90 && result <= 90) return result;
        }
      }
    }

    return null;
  }, []);

  // Handle go to coordinates
  const handleGoToCoordinates = useCallback(() => {
    const ra = parseCoordinate(goToRa, false);
    const dec = parseCoordinate(goToDec, true);

    if (ra === null || dec === null) {
      setCoordError(t('coordinates.invalidCoordinates'));
      return;
    }

    onNavigate(ra, dec);
    onOpenChange(false);
    setGoToRa('');
    setGoToDec('');
    setCoordError('');
  }, [goToRa, goToDec, parseCoordinate, onNavigate, onOpenChange, t]);

  // Handle dialog close
  const handleClose = useCallback(() => {
    onOpenChange(false);
    setGoToRa('');
    setGoToDec('');
    setCoordError('');
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('coordinates.goToCoordinates')}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="ra">{t('coordinates.ra')}</Label>
            <Input
              id="ra"
              value={goToRa}
              onChange={(e) => { setGoToRa(e.target.value); setCoordError(''); }}
              placeholder={t('coordinates.raPlaceholder')}
              className="font-mono"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="dec">{t('coordinates.dec')}</Label>
            <Input
              id="dec"
              value={goToDec}
              onChange={(e) => { setGoToDec(e.target.value); setCoordError(''); }}
              placeholder={t('coordinates.decPlaceholder')}
              className="font-mono"
            />
          </div>
          {coordError && (
            <p className="text-sm text-destructive">{coordError}</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleGoToCoordinates}>
            {t('coordinates.goTo')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
GoToCoordinatesDialog.displayName = 'GoToCoordinatesDialog';
