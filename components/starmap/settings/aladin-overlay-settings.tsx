'use client';

import { useState } from 'react';
import { Layers, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SKY_SURVEYS } from '@/lib/core/constants/sky-surveys';
import { useAladinStore } from '@/lib/stores/aladin-store';
import { SettingsSection, ToggleItem } from './settings-shared';

export function AladinOverlaySettings() {
  const t = useTranslations();
  const [selectedSurveyId, setSelectedSurveyId] = useState(SKY_SURVEYS[0]?.id ?? '');

  const overlayLayers = useAladinStore((state) => state.imageOverlayLayers);
  const addImageOverlayLayer = useAladinStore((state) => state.addImageOverlayLayer);
  const removeImageOverlayLayer = useAladinStore((state) => state.removeImageOverlayLayer);
  const toggleImageOverlayLayer = useAladinStore((state) => state.toggleImageOverlayLayer);
  const updateImageOverlayLayer = useAladinStore((state) => state.updateImageOverlayLayer);

  const handleAdd = () => {
    const survey = SKY_SURVEYS.find((item) => item.id === selectedSurveyId);
    if (!survey) return;

    addImageOverlayLayer({
      name: survey.name,
      surveyId: survey.id,
      surveyUrl: survey.url,
      enabled: true,
      opacity: 0.5,
      additive: false,
    });
  };

  return (
    <SettingsSection
      title={t('settings.aladinOverlayLayers')}
      icon={<Layers className="h-4 w-4" />}
      defaultOpen={false}
    >
      <div className="space-y-2 rounded-lg bg-muted/30 p-2">
        <Label className="text-xs text-muted-foreground">{t('settings.aladinAddOverlay')}</Label>
        <div className="flex gap-2">
          <Select value={selectedSurveyId} onValueChange={setSelectedSurveyId}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SKY_SURVEYS.map((survey) => (
                <SelectItem key={survey.id} value={survey.id}>
                  {survey.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" size="sm" onClick={handleAdd}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            {t('common.add')}
          </Button>
        </div>
      </div>

      {overlayLayers.map((layer) => (
        <div key={layer.id} className="space-y-2 rounded-lg bg-muted/30 p-2">
          <div className="flex items-start justify-between gap-2">
            <ToggleItem
              id={`overlay-${layer.id}`}
              label={layer.name}
              checked={layer.enabled}
              onCheckedChange={() => toggleImageOverlayLayer(layer.id)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-destructive"
              onClick={() => removeImageOverlayLayer(layer.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {layer.enabled && (
            <div className="space-y-2 px-2 pb-1">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">{t('settings.aladinOverlayOpacity')}</Label>
                  <span className="text-xs text-muted-foreground">{Math.round(layer.opacity * 100)}%</span>
                </div>
                <Slider
                  value={[layer.opacity]}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={([value]) => updateImageOverlayLayer(layer.id, { opacity: value })}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg bg-background/70 px-3 py-2">
                <Label className="text-xs text-muted-foreground">{t('settings.aladinAdditiveBlend')}</Label>
                <Switch
                  checked={layer.additive}
                  onCheckedChange={(checked) => updateImageOverlayLayer(layer.id, { additive: checked })}
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </SettingsSection>
  );
}
