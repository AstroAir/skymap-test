'use client';

import { useTranslations } from 'next-intl';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface SensorCalibrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCalibrate: () => void;
}

export function SensorCalibrationDialog({
  open,
  onOpenChange,
  onCalibrate,
}: SensorCalibrationDialogProps) {
  const t = useTranslations();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('settings.sensorCalibrationRequired')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('settings.sensorCalibrationDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              onCalibrate();
            }}
          >
            {t('settings.sensorCalibrateNow')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

