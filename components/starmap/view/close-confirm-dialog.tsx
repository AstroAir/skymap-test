'use client';

import { memo, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface CloseConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (dontShowAgain: boolean) => void;
}

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{t('starmap.closeConfirmTitle')}</DialogTitle>
          <DialogDescription>
            {t('starmap.closeConfirmMessage')}
          </DialogDescription>
        </DialogHeader>
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
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            {t('common.cancel')}
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            {t('starmap.confirmClose')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
CloseConfirmDialog.displayName = 'CloseConfirmDialog';
