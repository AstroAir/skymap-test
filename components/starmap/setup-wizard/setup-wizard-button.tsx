'use client';

import { useTranslations } from 'next-intl';
import { Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSetupWizardStore } from '@/lib/stores/setup-wizard-store';
import type { SetupWizardButtonProps } from '@/types/starmap/setup-wizard';

export function SetupWizardButton({
  variant = 'outline',
  size = 'sm',
  className,
}: SetupWizardButtonProps) {
  const t = useTranslations();
  const openWizard = useSetupWizardStore((state) => state.openWizard);
  const resetSetup = useSetupWizardStore((state) => state.resetSetup);

  const handleClick = () => {
    resetSetup();
    openWizard();
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={cn('gap-2', className)}
    >
      <Settings2 className="w-4 h-4" />
      {t('setupWizard.restartSetup')}
    </Button>
  );
}
