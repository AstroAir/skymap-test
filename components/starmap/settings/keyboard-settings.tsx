'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  Keyboard,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  useKeybindingStore,
  formatKeyBinding,
  eventToKeyBinding,
  type ShortcutActionId,
} from '@/lib/stores/keybinding-store';
import { cn } from '@/lib/utils';
import { SettingsSection } from './settings-shared';

const ACTION_GROUPS: {
  titleKey: string;
  actions: { id: ShortcutActionId; labelKey: string }[];
}[] = [
  {
    titleKey: 'settingsNew.keyboard.navigation',
    actions: [
      { id: 'ZOOM_IN', labelKey: 'settingsNew.keyboard.zoomIn' },
      { id: 'ZOOM_OUT', labelKey: 'settingsNew.keyboard.zoomOut' },
      { id: 'RESET_VIEW', labelKey: 'settingsNew.keyboard.resetView' },
    ],
  },
  {
    titleKey: 'settingsNew.keyboard.toggles',
    actions: [
      { id: 'TOGGLE_SEARCH', labelKey: 'settingsNew.keyboard.toggleSearch' },
      { id: 'TOGGLE_SESSION_PANEL', labelKey: 'settingsNew.keyboard.toggleSessionPanel' },
      { id: 'TOGGLE_FOV', labelKey: 'settingsNew.keyboard.toggleFov' },
      { id: 'TOGGLE_CONSTELLATIONS', labelKey: 'settingsNew.keyboard.toggleConstellations' },
      { id: 'TOGGLE_GRID', labelKey: 'settingsNew.keyboard.toggleGrid' },
      { id: 'TOGGLE_DSO', labelKey: 'settingsNew.keyboard.toggleDso' },
      { id: 'TOGGLE_ATMOSPHERE', labelKey: 'settingsNew.keyboard.toggleAtmosphere' },
    ],
  },
  {
    titleKey: 'settingsNew.keyboard.timeControl',
    actions: [
      { id: 'PAUSE_TIME', labelKey: 'settingsNew.keyboard.pauseTime' },
      { id: 'SPEED_UP', labelKey: 'settingsNew.keyboard.speedUp' },
      { id: 'SLOW_DOWN', labelKey: 'settingsNew.keyboard.slowDown' },
      { id: 'RESET_TIME', labelKey: 'settingsNew.keyboard.resetTime' },
    ],
  },
  {
    titleKey: 'settingsNew.keyboard.other',
    actions: [
      { id: 'CLOSE_PANEL', labelKey: 'settingsNew.keyboard.closePanel' },
    ],
  },
];

interface KeyBindingEditorProps {
  actionId: ShortcutActionId;
  label: string;
}

function KeyBindingEditor({ actionId, label }: KeyBindingEditorProps) {
  const t = useTranslations();
  const [isRecording, setIsRecording] = useState(false);
  const [conflict, setConflict] = useState<ShortcutActionId | null>(null);
  const inputRef = useRef<HTMLButtonElement>(null);

  const getBinding = useKeybindingStore((state) => state.getBinding);
  const setBinding = useKeybindingStore((state) => state.setBinding);
  const resetBinding = useKeybindingStore((state) => state.resetBinding);
  const isCustom = useKeybindingStore((state) => state.isCustom);
  const findConflict = useKeybindingStore((state) => state.findConflict);

  const currentBinding = getBinding(actionId);
  const hasCustom = isCustom(actionId);

  const handleStartRecording = useCallback(() => {
    setIsRecording(true);
    setConflict(null);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isRecording) return;
    e.preventDefault();
    e.stopPropagation();

    const binding = eventToKeyBinding(e.nativeEvent);
    if (!binding) return;

    const conflictAction = findConflict(binding, actionId);
    if (conflictAction) {
      setConflict(conflictAction);
      return;
    }

    setBinding(actionId, binding);
    setIsRecording(false);
    setConflict(null);
  }, [isRecording, actionId, findConflict, setBinding]);

  const handleBlur = useCallback(() => {
    setIsRecording(false);
    setConflict(null);
  }, []);

  useEffect(() => {
    if (isRecording && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isRecording]);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
        <Label className="text-sm cursor-pointer flex-1 min-w-0 mr-2 truncate">
          {label}
        </Label>
        <div className="flex items-center gap-1 shrink-0">
          <button
            ref={inputRef}
            onClick={handleStartRecording}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className={cn(
              "inline-flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-mono min-w-[80px] h-7 border transition-all",
              isRecording
                ? "border-primary bg-primary/10 text-primary animate-pulse"
                : hasCustom
                  ? "border-primary/50 bg-primary/5 text-foreground"
                  : "border-border bg-muted/50 text-muted-foreground"
            )}
          >
            {isRecording
              ? t('settingsNew.keyboard.pressKey')
              : formatKeyBinding(currentBinding)
            }
          </button>
          {hasCustom && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => {
                    resetBinding(actionId);
                    setConflict(null);
                  }}
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('settingsNew.keyboard.resetToDefault')}</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
      {conflict && (
        <p className="text-xs text-destructive flex items-center gap-1 px-2">
          <AlertTriangle className="h-3 w-3" />
          {t('settingsNew.keyboard.conflict', { action: conflict })}
        </p>
      )}
    </div>
  );
}

export function KeyboardSettings() {
  const t = useTranslations();
  const resetAllBindings = useKeybindingStore((state) => state.resetAllBindings);
  const customBindings = useKeybindingStore((state) => state.customBindings);
  const customCount = Object.keys(customBindings).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Keyboard className="h-4 w-4" />
          {t('settingsNew.keyboard.title')}
        </h3>
        {customCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground"
                onClick={resetAllBindings}
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                {t('settingsNew.keyboard.resetAll')}
                <Badge variant="secondary" className="ml-1 h-4 text-[10px]">
                  {customCount}
                </Badge>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('settingsNew.keyboard.resetAllDesc')}</TooltipContent>
          </Tooltip>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {t('settingsNew.keyboard.description')}
      </p>

      {ACTION_GROUPS.map((group, idx) => (
        <div key={group.titleKey}>
          {idx > 0 && <Separator className="my-3" />}
          <SettingsSection
            title={t(group.titleKey)}
            icon={<Keyboard className="h-4 w-4" />}
            defaultOpen={idx === 0}
          >
            <div className="space-y-1">
              {group.actions.map((action) => (
                <KeyBindingEditor
                  key={action.id}
                  actionId={action.id}
                  label={t(action.labelKey)}
                />
              ))}
            </div>
          </SettingsSection>
        </div>
      ))}
    </div>
  );
}
