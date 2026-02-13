'use client';

import { useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  Download,
  Upload,
  FileJson,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { useSettingsStore } from '@/lib/stores';
import { useThemeStore } from '@/lib/stores/theme-store';
import { useKeybindingStore } from '@/lib/stores/keybinding-store';
import { SettingsSection } from './settings-shared';

interface ExportData {
  version: number;
  exportedAt: string;
  settings: {
    connection: ReturnType<typeof useSettingsStore.getState>['connection'];
    backendProtocol: ReturnType<typeof useSettingsStore.getState>['backendProtocol'];
    stellarium: ReturnType<typeof useSettingsStore.getState>['stellarium'];
    preferences: ReturnType<typeof useSettingsStore.getState>['preferences'];
    performance: ReturnType<typeof useSettingsStore.getState>['performance'];
    accessibility: ReturnType<typeof useSettingsStore.getState>['accessibility'];
    notifications: ReturnType<typeof useSettingsStore.getState>['notifications'];
    search: ReturnType<typeof useSettingsStore.getState>['search'];
  };
  theme: ReturnType<typeof useThemeStore.getState>['customization'];
  keybindings: ReturnType<typeof useKeybindingStore.getState>['customBindings'];
}

export function SettingsExportImport() {
  const t = useTranslations();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importError, setImportError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingImport, setPendingImport] = useState<ExportData | null>(null);

  const handleExport = useCallback(() => {
    const settingsState = useSettingsStore.getState();
    const themeState = useThemeStore.getState();
    const keybindingState = useKeybindingStore.getState();

    const exportData: ExportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      settings: {
        connection: settingsState.connection,
        backendProtocol: settingsState.backendProtocol,
        stellarium: settingsState.stellarium,
        preferences: settingsState.preferences,
        performance: settingsState.performance,
        accessibility: settingsState.accessibility,
        notifications: settingsState.notifications,
        search: settingsState.search,
      },
      theme: themeState.customization,
      keybindings: keybindingState.customBindings,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skymap-settings-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string) as ExportData;
        if (!data.version || !data.settings) {
          setImportStatus('error');
          setImportError(t('settingsNew.exportImport.invalidFile'));
          return;
        }
        setPendingImport(data);
        setConfirmOpen(true);
      } catch {
        setImportStatus('error');
        setImportError(t('settingsNew.exportImport.parseError'));
      }
    };
    reader.readAsText(file);
    // Reset the input so the same file can be selected again
    e.target.value = '';
  }, [t]);

  const handleConfirmImport = useCallback(() => {
    if (!pendingImport) return;

    try {
      const { settings, theme, keybindings } = pendingImport;

      // Apply settings
      if (settings) {
        const store = useSettingsStore.getState();
        if (settings.connection) store.setConnection(settings.connection);
        if (settings.backendProtocol) store.setBackendProtocol(settings.backendProtocol);
        if (settings.stellarium) store.setStellariumSettings(settings.stellarium);
        if (settings.preferences) store.setPreferences(settings.preferences);
        if (settings.performance) store.setPerformanceSettings(settings.performance);
        if (settings.accessibility) store.setAccessibilitySettings(settings.accessibility);
        if (settings.notifications) store.setNotificationSettings(settings.notifications);
        if (settings.search) store.setSearchSettings(settings.search);
      }

      // Apply theme
      if (theme) {
        const themeStore = useThemeStore.getState();
        if (theme.radius !== undefined) themeStore.setRadius(theme.radius);
        if (theme.fontFamily) themeStore.setFontFamily(theme.fontFamily);
        if (theme.fontSize) themeStore.setFontSize(theme.fontSize);
        if (theme.activePreset !== undefined) themeStore.setActivePreset(theme.activePreset);
      }

      // Apply keybindings
      if (keybindings) {
        const kbStore = useKeybindingStore.getState();
        kbStore.resetAllBindings();
        for (const [actionId, binding] of Object.entries(keybindings)) {
          kbStore.setBinding(actionId as keyof typeof keybindings, binding);
        }
      }

      setImportStatus('success');
      setTimeout(() => setImportStatus('idle'), 3000);
    } catch {
      setImportStatus('error');
      setImportError(t('settingsNew.exportImport.importError'));
    }

    setPendingImport(null);
    setConfirmOpen(false);
  }, [pendingImport, t]);

  return (
    <div className="space-y-4">
      <SettingsSection
        title={t('settingsNew.exportImport.title')}
        icon={<FileJson className="h-4 w-4" />}
        defaultOpen={true}
      >
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {t('settingsNew.exportImport.description')}
          </p>

          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={handleExport}
          >
            <Download className="h-4 w-4" />
            {t('settingsNew.exportImport.export')}
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            {t('settingsNew.exportImport.import')}
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileSelect}
          />

          {importStatus === 'success' && (
            <p className="text-xs text-green-500 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {t('settingsNew.exportImport.importSuccess')}
            </p>
          )}
          {importStatus === 'error' && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" />
              {importError}
            </p>
          )}
        </div>
      </SettingsSection>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('settingsNew.exportImport.confirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('settingsNew.exportImport.confirmDescription')}
              {pendingImport && (
                <span className="block mt-2 text-xs font-mono text-muted-foreground">
                  {t('settingsNew.exportImport.exportedAt')}: {new Date(pendingImport.exportedAt).toLocaleString()}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmImport}>
              {t('settingsNew.exportImport.confirmImport')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
