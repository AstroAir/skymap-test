'use client';

import { useTranslations } from 'next-intl';
import { Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSetupWizardStore } from '@/lib/stores/setup-wizard-store';

interface SetupWizardButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

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
      className={className}
    >
      <Settings2 className="w-4 h-4 mr-2" />
      {t('setupWizard.restartSetup')}
    </Button>
  );
}
