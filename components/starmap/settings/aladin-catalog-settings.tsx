'use client';

import { Database } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { useAladinStore } from '@/lib/stores/aladin-store';
import { SettingsSection, ToggleItem } from './settings-shared';

export function AladinCatalogSettings() {
  const t = useTranslations();

  const catalogLayers = useAladinStore((state) => state.catalogLayers);
  const toggleCatalogLayer = useAladinStore((state) => state.toggleCatalogLayer);
  const updateCatalogLayer = useAladinStore((state) => state.updateCatalogLayer);

  return (
    <SettingsSection
      title={t('settings.aladinCatalogLayers')}
      icon={<Database className="h-4 w-4" />}
      defaultOpen={false}
    >
      {catalogLayers.map((layer) => (
        <div key={layer.id} className="space-y-2 rounded-lg bg-muted/30 p-2">
          <ToggleItem
            id={`catalog-${layer.id}`}
            label={layer.name}
            checked={layer.enabled}
            onCheckedChange={() => toggleCatalogLayer(layer.id)}
            description={layer.type.toUpperCase()}
          />

          {layer.enabled && (
            <div className="space-y-2 px-2 pb-1">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">{t('settings.aladinSearchRadius')}</Label>
                  <span className="text-xs text-muted-foreground">{layer.radius.toFixed(2)}°</span>
                </div>
                <Slider
                  value={[layer.radius]}
                  min={0.02}
                  max={5}
                  step={0.01}
                  onValueChange={([value]) => updateCatalogLayer(layer.id, { radius: value })}
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">{t('settings.aladinCatalogLimit')}</Label>
                  <span className="text-xs text-muted-foreground">{layer.limit}</span>
                </div>
                <Slider
                  value={[layer.limit]}
                  min={100}
                  max={10000}
                  step={100}
                  onValueChange={([value]) => updateCatalogLayer(layer.id, { limit: value })}
                />
              </div>

              {layer.type === 'vizier' && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{t('settings.aladinVizierCatalogId')}</Label>
                  <Input
                    value={layer.vizierCatId ?? ''}
                    onChange={(e) => updateCatalogLayer(layer.id, { vizierCatId: e.target.value })}
                    className="h-8"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </SettingsSection>
  );
}
