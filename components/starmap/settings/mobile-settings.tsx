'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowDown, ArrowUp, Hand, ListOrdered, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import {
  DEFAULT_MOBILE_PRIORITIZED_TOOLS,
  type MobileToolId,
  getMobileToolsForSurface,
} from '@/lib/constants/mobile-tools';
import { useSettingsStore } from '@/lib/stores';
import { SettingsSection, ToggleItem } from './settings-shared';

const COMPACT_TOOL_DEFINITIONS = getMobileToolsForSurface('bottom-bar');
const COMPACT_TOOL_IDS = COMPACT_TOOL_DEFINITIONS.map((tool) => tool.id);
const COMPACT_TOOL_ID_SET = new Set<MobileToolId>(COMPACT_TOOL_IDS);
const COMPACT_TOOL_MAP = new Map(COMPACT_TOOL_DEFINITIONS.map((tool) => [tool.id, tool]));

const isCompactToolId = (toolId: string): toolId is MobileToolId => (
  COMPACT_TOOL_ID_SET.has(toolId as MobileToolId)
);

export function MobileSettings() {
  const t = useTranslations();
  const compactBottomBar = useSettingsStore((state) => state.mobileFeaturePreferences.compactBottomBar);
  const oneHandMode = useSettingsStore((state) => state.mobileFeaturePreferences.oneHandMode);
  const prioritizedTools = useSettingsStore(
    (state) => state.mobileFeaturePreferences.prioritizedTools ?? DEFAULT_MOBILE_PRIORITIZED_TOOLS,
  );
  const setMobileFeaturePreferences = useSettingsStore((state) => state.setMobileFeaturePreferences);

  const compactPriority = useMemo(() => {
    const selected = prioritizedTools.filter(isCompactToolId);
    if (selected.length > 0) return selected;
    return DEFAULT_MOBILE_PRIORITIZED_TOOLS.filter((toolId) => COMPACT_TOOL_ID_SET.has(toolId));
  }, [prioritizedTools]);

  const nonCompactPriority = useMemo(
    () => prioritizedTools.filter((toolId) => !isCompactToolId(toolId)),
    [prioritizedTools],
  );

  const orderedToolIds = useMemo(() => {
    const selectedSet = new Set(compactPriority);
    const hiddenTools = COMPACT_TOOL_IDS.filter((toolId) => !selectedSet.has(toolId));
    return [...compactPriority, ...hiddenTools];
  }, [compactPriority]);

  const persistCompactPriority = (nextCompactPriority: MobileToolId[]) => {
    setMobileFeaturePreferences({
      prioritizedTools: [...nextCompactPriority, ...nonCompactPriority],
    });
  };

  const toggleToolVisibility = (toolId: MobileToolId, visible: boolean) => {
    const withoutTool = compactPriority.filter((id) => id !== toolId);
    const nextCompactPriority = visible ? [...withoutTool, toolId] : withoutTool;
    if (nextCompactPriority.length === 0) return;
    persistCompactPriority(nextCompactPriority);
  };

  const moveTool = (toolId: MobileToolId, direction: 'up' | 'down') => {
    const index = compactPriority.indexOf(toolId);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= compactPriority.length) return;

    const nextCompactPriority = [...compactPriority];
    const [movedTool] = nextCompactPriority.splice(index, 1);
    nextCompactPriority.splice(targetIndex, 0, movedTool);
    persistCompactPriority(nextCompactPriority);
  };

  return (
    <div className="space-y-4">
      <SettingsSection
        title={t('settingsNew.mobile.title')}
        icon={<Smartphone className="h-4 w-4" />}
        defaultOpen={false}
      >
        <div className="space-y-3">
          <ToggleItem
            id="mobile-compact-bottom-bar"
            label={t('settingsNew.mobile.compactBottomBar')}
            description={t('settingsNew.mobile.compactBottomBarDesc')}
            checked={compactBottomBar}
            onCheckedChange={(checked) => setMobileFeaturePreferences({ compactBottomBar: checked })}
          />
          <ToggleItem
            id="mobile-one-hand-mode"
            label={t('settingsNew.mobile.oneHandMode')}
            description={t('settingsNew.mobile.oneHandModeDesc')}
            checked={oneHandMode}
            onCheckedChange={(checked) => setMobileFeaturePreferences({ oneHandMode: checked })}
          />

          <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ListOrdered className="h-3.5 w-3.5" />
              <span>{t('settingsNew.mobile.prioritizedTools')}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('settingsNew.mobile.prioritizedToolsDesc')}
            </p>

            <div className="space-y-1.5">
              {orderedToolIds.map((toolId) => {
                const tool = COMPACT_TOOL_MAP.get(toolId);
                if (!tool) return null;

                const visible = compactPriority.includes(toolId);
                const visibleIndex = compactPriority.indexOf(toolId);
                return (
                  <div
                    key={tool.id}
                    data-testid={`mobile-tool-row-${tool.id}`}
                    className={cn(
                      'flex items-center justify-between rounded-md border border-border/50 bg-background/70 px-2 py-1.5',
                      !visible && 'opacity-70',
                    )}
                  >
                    <div className="min-w-0">
                      <p className={cn('text-sm truncate', visible ? 'text-foreground' : 'text-muted-foreground')}>
                        {t(tool.labelKey)}
                      </p>
                      {!visible && (
                        <p className="text-[11px] text-muted-foreground">
                          {t('settingsNew.mobile.hiddenHint')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Switch
                        checked={visible}
                        onCheckedChange={(checked) => toggleToolVisibility(tool.id, checked)}
                        aria-label={t(tool.labelKey)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label={t('settingsNew.mobile.moveUp')}
                        disabled={!visible || visibleIndex <= 0}
                        onClick={() => moveTool(tool.id, 'up')}
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label={t('settingsNew.mobile.moveDown')}
                        disabled={!visible || visibleIndex === -1 || visibleIndex >= compactPriority.length - 1}
                        onClick={() => moveTool(tool.id, 'down')}
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-start gap-2 text-[11px] text-muted-foreground">
              <Hand className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>{t('settingsNew.mobile.accessHint')}</span>
            </div>
          </div>
        </div>
      </SettingsSection>
    </div>
  );
}
