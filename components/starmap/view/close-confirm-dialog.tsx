'use client';

import { memo, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import type { CloseConfirmDialogProps } from '@/types/starmap/view';

export const CloseConfirmDialog = memo(function CloseConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
}: CloseConfirmDialogProps) {
  const t = useTranslations();
  const [dontShowAgainChecked, setDontShowAgainChecked] = useState(false);

  // Handle confirm
  const handleConfirm = useCallback(() => {
    onConfirm(dontShowAgainChecked);
    onOpenChange(false);
    setDontShowAgainChecked(false);
  }, [dontShowAgainChecked, onConfirm, onOpenChange]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    onOpenChange(false);
    setDontShowAgainChecked(false);
  }, [onOpenChange]);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[400px]">
        <AlertDialogHeader>
          <AlertDialogTitle>{t('starmap.closeConfirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('starmap.closeConfirmMessage')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex items-center space-x-2 py-4">
          <Checkbox
            id="dontShowAgain"
            checked={dontShowAgainChecked}
            onCheckedChange={(checked) => setDontShowAgainChecked(checked === true)}
          />
          <Label htmlFor="dontShowAgain" className="text-sm text-muted-foreground cursor-pointer">
            {t('starmap.dontShowAgain')}
          </Label>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>
            {t('common.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleConfirm}>
            {t('starmap.confirmClose')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
});
CloseConfirmDialog.displayName = 'CloseConfirmDialog';
