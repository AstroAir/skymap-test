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
import { parseRACoordinate, parseDecCoordinate } from '@/lib/astronomy/coordinates/conversions';
import type { GoToCoordinatesDialogProps } from '@/types/starmap/view';

export const GoToCoordinatesDialog = memo(function GoToCoordinatesDialog({
  open,
  onOpenChange,
  onNavigate,
}: GoToCoordinatesDialogProps) {
  const t = useTranslations();
  const [goToRa, setGoToRa] = useState('');
  const [goToDec, setGoToDec] = useState('');
  const [coordError, setCoordError] = useState('');

  // Handle go to coordinates
  const handleGoToCoordinates = useCallback(() => {
    const ra = parseRACoordinate(goToRa);
    const dec = parseDecCoordinate(goToDec);

    if (ra === null || dec === null) {
      setCoordError(t('coordinates.invalidCoordinates'));
      return;
    }

    onNavigate(ra, dec);
    onOpenChange(false);
    setGoToRa('');
    setGoToDec('');
    setCoordError('');
  }, [goToRa, goToDec, onNavigate, onOpenChange, t]);

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
