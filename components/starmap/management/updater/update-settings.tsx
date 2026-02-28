'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { SwitchItem } from '@/components/ui/switch-item';
import { RefreshCw, Download, CheckCircle2 } from 'lucide-react';
import { useAppSettings } from '@/lib/tauri';
import { useUpdater } from '@/lib/tauri/updater-hooks';
import { UpdateDialog } from './update-dialog';

interface UpdateSettingsProps {
  className?: string;
}

export function UpdateSettings({ className }: UpdateSettingsProps) {
  const t = useTranslations('updater');
  const [dialogOpen, setDialogOpen] = useState(false);
  const {
    settings: appSettings,
    updateSettings: updateAppSettings,
    isAvailable: isAppSettingsAvailable,
    loading: isAppSettingsLoading,
  } = useAppSettings();

  const autoUpdate = appSettings?.check_updates ?? false;
  const autoUpdateDisabled = !isAppSettingsAvailable || isAppSettingsLoading || !appSettings;
  
  const {
    currentVersion,
    lastChecked,
    isChecking,
    hasUpdate,
    updateInfo,
    checkForUpdate,
  } = useUpdater({ autoCheck: autoUpdate });

  const lastCheckedText = lastChecked
    ? t('lastChecked', { time: new Date(lastChecked).toLocaleString() })
    : t('neverChecked');

  return (
    <div className={className}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base">{t('title')}</Label>
            <p className="text-sm text-muted-foreground">
              {t('currentVersion', { version: currentVersion || '0.0.0' })}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {lastCheckedText}
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

        <SwitchItem
          id="auto-update"
          label={t('autoUpdate')}
          description={t('autoUpdateDescription')}
          checked={autoUpdate}
          onCheckedChange={(checked) => {
            updateAppSettings({ check_updates: checked });
          }}
          switchProps={{ disabled: autoUpdateDisabled }}
        />
      </div>

      <UpdateDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
