'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Download, X, Rocket } from 'lucide-react';
import { useUpdater } from '@/lib/tauri/updater-hooks';
import { cn } from '@/lib/utils';

interface UpdateBannerProps {
  className?: string;
  onOpenDialog?: () => void;
}

export function UpdateBanner({ className, onOpenDialog }: UpdateBannerProps) {
  const t = useTranslations('updater');
  const {
    hasUpdate,
    updateInfo,
    dismissUpdate,
  } = useUpdater();

  if (!hasUpdate || !updateInfo) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-2 bg-primary/10 border-b border-primary/20',
        className
      )}
    >
      <Rocket className="h-4 w-4 text-primary shrink-0" />
      <span className="text-sm flex-1">
        {t('bannerMessage', { version: updateInfo.version })}
      </span>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="default" onClick={onOpenDialog}>
          <Download className="mr-1 h-3 w-3" />
          {t('update')}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0"
          onClick={dismissUpdate}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">{t('dismiss')}</span>
        </Button>
      </div>
    </div>
  );
}
