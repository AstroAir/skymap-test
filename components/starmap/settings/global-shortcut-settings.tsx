'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle, Keyboard, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DEFAULT_KEYBINDINGS,
  eventToGlobalShortcutAccelerator,
  findConflictWithLocalKeybindings,
  formatGlobalShortcutAccelerator,
  useGlobalShortcutStore,
  useKeybindingStore,
  type GlobalShortcutActionId,
} from '@/lib/stores';
import { cn } from '@/lib/utils';
import { SettingsSection } from './settings-shared';

const GLOBAL_SHORTCUT_ACTIONS: Array<{
  id: GlobalShortcutActionId;
  labelKey: string;
  descriptionKey: string;
}> = [
  {
    id: 'FOCUS_MAIN_WINDOW',
    labelKey: 'settingsNew.globalShortcuts.actions.focusMainWindow',
    descriptionKey: 'settingsNew.globalShortcuts.descriptions.focusMainWindow',
  },
  {
    id: 'TOGGLE_SEARCH',
    labelKey: 'settingsNew.globalShortcuts.actions.toggleSearch',
    descriptionKey: 'settingsNew.globalShortcuts.descriptions.toggleSearch',
  },
  {
    id: 'TOGGLE_SESSION_PANEL',
    labelKey: 'settingsNew.globalShortcuts.actions.toggleSessionPanel',
    descriptionKey: 'settingsNew.globalShortcuts.descriptions.toggleSessionPanel',
  },
  {
    id: 'MOUNT_ABORT_SLEW',
    labelKey: 'settingsNew.globalShortcuts.actions.mountAbortSlew',
    descriptionKey: 'settingsNew.globalShortcuts.descriptions.mountAbortSlew',
  },
];

export function GlobalShortcutSettings() {
  const t = useTranslations();
  const [recordingAction, setRecordingAction] = useState<GlobalShortcutActionId | null>(null);
  const [editErrors, setEditErrors] = useState<Partial<Record<GlobalShortcutActionId, string>>>({});
  const rowRefs = useRef<Partial<Record<GlobalShortcutActionId, HTMLButtonElement | null>>>({});

  const enabled = useGlobalShortcutStore((state) => state.enabled);
  const customBindings = useGlobalShortcutStore((state) => state.customBindings);
  const registrationErrors = useGlobalShortcutStore((state) => state.registrationErrors);
  const setEnabled = useGlobalShortcutStore((state) => state.setEnabled);
  const getBinding = useGlobalShortcutStore((state) => state.getBinding);
  const setBinding = useGlobalShortcutStore((state) => state.setBinding);
  const resetBinding = useGlobalShortcutStore((state) => state.resetBinding);
  const resetAllBindings = useGlobalShortcutStore((state) => state.resetAllBindings);
  const isCustom = useGlobalShortcutStore((state) => state.isCustom);
  const clearRegistrationError = useGlobalShortcutStore((state) => state.clearRegistrationError);

  const localCustomBindings = useKeybindingStore((state) => state.customBindings);

  const effectiveLocalBindings = useMemo(
    () => ({ ...DEFAULT_KEYBINDINGS, ...localCustomBindings }),
    [localCustomBindings],
  );

  const customCount = Object.keys(customBindings).length;

  useEffect(() => {
    if (!recordingAction) return;
    rowRefs.current[recordingAction]?.focus();
  }, [recordingAction]);

  const clearInlineError = useCallback((actionId: GlobalShortcutActionId) => {
    setEditErrors((state) => {
      if (!state[actionId]) return state;
      const next = { ...state };
      delete next[actionId];
      return next;
    });
  }, []);

  const handleRecord = useCallback((actionId: GlobalShortcutActionId, event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (recordingAction !== actionId) return;

    event.preventDefault();
    event.stopPropagation();

    const accelerator = eventToGlobalShortcutAccelerator(event.nativeEvent);
    if (!accelerator) {
      setEditErrors((state) => ({
        ...state,
        [actionId]: t('settingsNew.globalShortcuts.errors.invalidShortcut'),
      }));
      return;
    }

    const localConflict = findConflictWithLocalKeybindings(accelerator, effectiveLocalBindings);
    if (localConflict) {
      setEditErrors((state) => ({
        ...state,
        [actionId]: t('settingsNew.globalShortcuts.errors.localConflict', { action: localConflict }),
      }));
      return;
    }

    const result = setBinding(actionId, accelerator);
    if (!result.ok) {
      setEditErrors((state) => ({
        ...state,
        [actionId]: result.conflictWith
          ? t('settingsNew.globalShortcuts.errors.globalConflict', { action: result.conflictWith })
          : (result.error ?? t('settingsNew.globalShortcuts.errors.invalidShortcut')),
      }));
      return;
    }

    clearRegistrationError(actionId);
    clearInlineError(actionId);
    setRecordingAction(null);
  }, [
    clearInlineError,
    clearRegistrationError,
    effectiveLocalBindings,
    recordingAction,
    setBinding,
    t,
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Keyboard className="h-4 w-4" />
          {t('settingsNew.globalShortcuts.title')}
        </h3>
        <div className="flex items-center gap-2">
          {customCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground"
                  onClick={() => {
                    resetAllBindings();
                    setEditErrors({});
                    setRecordingAction(null);
                  }}
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  {t('settingsNew.globalShortcuts.resetAll')}
                  <Badge variant="secondary" className="ml-1 h-4 text-[10px]">
                    {customCount}
                  </Badge>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('settingsNew.globalShortcuts.resetAllDesc')}</TooltipContent>
            </Tooltip>
          )}
          <div className="flex items-center gap-2">
            <Label htmlFor="global-shortcuts-enabled" className="text-xs text-muted-foreground">
              {t('settingsNew.globalShortcuts.enabled')}
            </Label>
            <Switch
              id="global-shortcuts-enabled"
              checked={enabled}
              onCheckedChange={(checked) => setEnabled(Boolean(checked))}
            />
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {t('settingsNew.globalShortcuts.description')}
      </p>

      {!enabled && (
        <p className="text-xs text-amber-600">{t('settingsNew.globalShortcuts.disabledHint')}</p>
      )}

      <SettingsSection
        title={t('settingsNew.globalShortcuts.mappingTitle')}
        icon={<Keyboard className="h-4 w-4" />}
        defaultOpen
      >
        <div className="space-y-1">
          {GLOBAL_SHORTCUT_ACTIONS.map((action) => {
            const binding = getBinding(action.id);
            const runtimeError = registrationErrors[action.id];
            const editError = editErrors[action.id];
            const hasCustom = isCustom(action.id);
            const rowError = editError ?? runtimeError ?? null;

            return (
              <div key={action.id} className="space-y-1">
                <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex-1 min-w-0 mr-2">
                    <Label className="text-sm cursor-pointer truncate block">
                      {t(action.labelKey)}
                    </Label>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {t(action.descriptionKey)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      ref={(el) => {
                        rowRefs.current[action.id] = el;
                      }}
                      onClick={() => {
                        setRecordingAction(action.id);
                        clearInlineError(action.id);
                      }}
                      onKeyDown={(event) => handleRecord(action.id, event)}
                      onBlur={() => {
                        if (recordingAction === action.id) {
                          setRecordingAction(null);
                        }
                      }}
                      disabled={!enabled}
                      className={cn(
                        'inline-flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-mono min-w-[130px] h-7 border transition-all',
                        recordingAction === action.id
                          ? 'border-primary bg-primary/10 text-primary animate-pulse'
                          : hasCustom
                            ? 'border-primary/50 bg-primary/5 text-foreground'
                            : 'border-border bg-muted/50 text-muted-foreground',
                        !enabled && 'opacity-50 cursor-not-allowed',
                      )}
                    >
                      {recordingAction === action.id
                        ? t('settingsNew.globalShortcuts.recording')
                        : formatGlobalShortcutAccelerator(binding)}
                    </button>

                    {hasCustom && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            disabled={!enabled}
                            onClick={() => {
                              resetBinding(action.id);
                              clearRegistrationError(action.id);
                              clearInlineError(action.id);
                              if (recordingAction === action.id) {
                                setRecordingAction(null);
                              }
                            }}
                          >
                            <RotateCcw className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t('settingsNew.globalShortcuts.resetToDefault')}</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </div>

                {rowError && (
                  <p className="text-xs text-destructive flex items-center gap-1 px-2">
                    <AlertTriangle className="h-3 w-3" />
                    {rowError}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </SettingsSection>
    </div>
  );
}

