'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RefreshCw, Download, CheckCircle2 } from 'lucide-react';
import { useUpdater } from '@/lib/tauri/updater-hooks';
import { UpdateDialog } from './update-dialog';

interface UpdateSettingsProps {
  className?: string;
}

export function UpdateSettings({ className }: UpdateSettingsProps) {
  const t = useTranslations('updater');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [autoUpdate, setAutoUpdate] = useState(true);
  
  const {
    currentVersion,
    isChecking,
    hasUpdate,
    updateInfo,
    checkForUpdate,
  } = useUpdater();

  return (
    <div className={className}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base">{t('title')}</Label>
            <p className="text-sm text-muted-foreground">
              {t('currentVersion', { version: currentVersion || '0.0.0' })}
            </p>
          </div>
          
          {hasUpdate && updateInfo ? (
            <Button onClick={() => setDialogOpen(true)}>
              <Download className="mr-2 h-4 w-4" />
              {t('newVersion', { version: updateInfo.version })}
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={checkForUpdate}
              disabled={isChecking}
            >
              {isChecking ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              {isChecking ? t('checking') : t('checkForUpdates')}
            </Button>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="auto-update">{t('autoUpdate')}</Label>
            <p className="text-sm text-muted-foreground">
              {t('autoUpdateDescription')}
            </p>
          </div>
          <Switch
            id="auto-update"
            checked={autoUpdate}
            onCheckedChange={setAutoUpdate}
          />
        </div>
      </div>

      <UpdateDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
