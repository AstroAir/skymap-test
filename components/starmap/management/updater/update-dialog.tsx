'use client';

import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Download, 
  RefreshCw, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Rocket
} from 'lucide-react';
import { useUpdater } from '@/lib/tauri/updater-hooks';
import { formatProgress } from '@/lib/tauri/updater-api';

interface UpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpdateDialog({ open, onOpenChange }: UpdateDialogProps) {
  const t = useTranslations('updater');
  const {
    currentVersion,
    isChecking,
    isDownloading,
    isReady,
    hasUpdate,
    updateInfo,
    progress,
    error,
    checkForUpdate,
    downloadAndInstall,
    dismissUpdate,
  } = useUpdater();

  const handleClose = () => {
    if (!isDownloading) {
      onOpenChange(false);
    }
  };

  const handleDismiss = () => {
    dismissUpdate();
    onOpenChange(false);
  };

  const renderContent = () => {
    if (isChecking) {
      return (
        <div className="flex flex-col items-center gap-4 py-6">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">{t('checking')}</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center gap-4 py-6">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <p className="text-destructive">{error}</p>
          <Button onClick={checkForUpdate} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            {t('retry')}
          </Button>
        </div>
      );
    }

    if (isDownloading && progress) {
      return (
        <div className="flex flex-col gap-4 py-6">
          <div className="flex items-center gap-4">
            <Download className="h-8 w-8 text-primary animate-pulse" />
            <div className="flex-1">
              <p className="font-medium">{t('downloading')}</p>
              <p className="text-sm text-muted-foreground">
                {formatProgress(progress)}
              </p>
            </div>
          </div>
          <Progress value={progress.percent} className="h-2" />
        </div>
      );
    }

    if (isReady && updateInfo) {
      return (
        <div className="flex flex-col items-center gap-4 py-6">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
          <div className="text-center">
            <p className="font-medium">{t('ready')}</p>
            <p className="text-sm text-muted-foreground">
              {t('restartRequired')}
            </p>
          </div>
        </div>
      );
    }

    if (hasUpdate && updateInfo) {
      return (
        <div className="flex flex-col gap-4 py-4">
          <div className="flex items-start gap-4">
            <Rocket className="h-8 w-8 text-primary" />
            <div className="flex-1">
              <p className="font-medium">
                {t('newVersion', { version: updateInfo.version })}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('currentVersion', { version: currentVersion || '0.0.0' })}
              </p>
            </div>
          </div>
          
          {updateInfo.body && (
            <ScrollArea className="max-h-48">
              <div className="rounded-lg bg-muted p-3">
                <p className="text-sm font-medium mb-2">{t('releaseNotes')}</p>
                <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {updateInfo.body}
                </div>
              </div>
            </ScrollArea>
          )}
          
          {updateInfo.date && (
            <p className="text-xs text-muted-foreground">
              {t('releaseDate', { 
                date: new Date(updateInfo.date).toLocaleDateString() 
              })}
            </p>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center gap-4 py-6">
        <CheckCircle2 className="h-12 w-12 text-green-500" />
        <div className="text-center">
          <p className="font-medium">{t('upToDate')}</p>
          <p className="text-sm text-muted-foreground">
            {t('currentVersion', { version: currentVersion || '0.0.0' })}
          </p>
        </div>
        <Button onClick={checkForUpdate} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          {t('checkAgain')}
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            {t('description')}
          </DialogDescription>
        </DialogHeader>
        
        {renderContent()}
        
        <DialogFooter className="gap-2 sm:gap-0">
          {hasUpdate && !isDownloading && !isReady && (
            <>
              <Button variant="ghost" onClick={handleDismiss}>
                <X className="mr-2 h-4 w-4" />
                {t('later')}
              </Button>
              <Button onClick={downloadAndInstall}>
                <Download className="mr-2 h-4 w-4" />
                {t('updateNow')}
              </Button>
            </>
          )}
          
          {isReady && (
            <Button onClick={downloadAndInstall}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {t('restartNow')}
            </Button>
          )}
          
          {!hasUpdate && !isChecking && !error && (
            <Button variant="outline" onClick={handleClose}>
              {t('close')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
