'use client';

import { useState } from 'react';
import { Layers3, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useAladinStore } from '@/lib/stores/aladin-store';
import { WELL_KNOWN_MOCS } from '@/lib/hooks/aladin';
import { SettingsSection, ToggleItem } from './settings-shared';

export function AladinMocSettings() {
  const t = useTranslations();
  const [customName, setCustomName] = useState('');
  const [customUrl, setCustomUrl] = useState('');

  const mocLayers = useAladinStore((state) => state.mocLayers);
  const addMocLayer = useAladinStore((state) => state.addMocLayer);
  const removeMocLayer = useAladinStore((state) => state.removeMocLayer);
  const toggleMocLayer = useAladinStore((state) => state.toggleMocLayer);
  const updateMocLayer = useAladinStore((state) => state.updateMocLayer);

  const addWellKnown = (name: string, url: string, color: string) => {
    addMocLayer({
      name,
      url,
      color,
      opacity: 0.3,
      lineWidth: 1,
      visible: true,
    });
  };

  const addCustom = () => {
    if (!customUrl.trim()) return;
    addMocLayer({
      name: customName.trim() || customUrl.trim(),
      url: customUrl.trim(),
      color: '#3b82f6',
      opacity: 0.3,
      lineWidth: 1,
      visible: true,
    });
    setCustomName('');
    setCustomUrl('');
  };

  return (
    <SettingsSection
      title={t('settings.aladinMocLayers')}
      icon={<Layers3 className="h-4 w-4" />}
      defaultOpen={false}
    >
      <div className="space-y-2 rounded-lg bg-muted/30 p-2">
        <Label className="text-xs text-muted-foreground">{t('settings.aladinAddWellKnownMoc')}</Label>
        <div className="grid grid-cols-2 gap-1.5">
          {WELL_KNOWN_MOCS.map((moc) => (
            <Button
              key={moc.url}
              type="button"
              variant="outline"
              size="sm"
              className="justify-start text-xs"
              onClick={() => addWellKnown(moc.name, moc.url, moc.color)}
            >
              {moc.name}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2 rounded-lg bg-muted/30 p-2">
        <Label className="text-xs text-muted-foreground">{t('settings.aladinAddCustomMoc')}</Label>
        <Input
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          placeholder={t('settings.aladinMocNamePlaceholder')}
          className="h-8"
        />
        <Input
          value={customUrl}
          onChange={(e) => setCustomUrl(e.target.value)}
          placeholder={t('settings.aladinMocUrlPlaceholder')}
          className="h-8"
        />
        <Button type="button" size="sm" onClick={addCustom}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          {t('common.add')}
        </Button>
      </div>

      {mocLayers.map((layer) => (
        <div key={layer.id} className="space-y-2 rounded-lg bg-muted/30 p-2">
          <div className="flex items-start justify-between gap-2">
            <ToggleItem
              id={`moc-${layer.id}`}
              label={layer.name}
              checked={layer.visible}
              onCheckedChange={() => toggleMocLayer(layer.id)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-destructive"
              onClick={() => removeMocLayer(layer.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {layer.visible && (
            <div className="space-y-2 px-2 pb-1">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">{t('settings.aladinMocOpacity')}</Label>
                  <span className="text-xs text-muted-foreground">{Math.round(layer.opacity * 100)}%</span>
                </div>
                <Slider
                  value={[layer.opacity]}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={([value]) => updateMocLayer(layer.id, { opacity: value })}
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">{t('settings.aladinMocLineWidth')}</Label>
                  <span className="text-xs text-muted-foreground">{layer.lineWidth.toFixed(1)}</span>
                </div>
                <Slider
                  value={[layer.lineWidth]}
                  min={0.5}
                  max={6}
                  step={0.5}
                  onValueChange={([value]) => updateMocLayer(layer.id, { lineWidth: value })}
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </SettingsSection>
  );
}
