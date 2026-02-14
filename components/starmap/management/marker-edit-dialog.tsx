'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { MarkerIconDisplay } from '@/lib/constants/marker-icons';
import {
  type SkyMarker,
  type MarkerIcon,
  MARKER_COLORS,
  MARKER_ICONS,
} from '@/lib/stores';
import type { MarkerFormData } from '@/types/starmap/management';

interface MarkerEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: MarkerFormData;
  onFormDataChange: (data: MarkerFormData) => void;
  editingMarker: SkyMarker | null;
  groups: string[];
  onSave: () => void;
  t: (key: string) => string;
}

export function MarkerEditDialog({
  open,
  onOpenChange,
  formData,
  onFormDataChange,
  editingMarker,
  groups,
  onSave,
  t,
}: MarkerEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingMarker ? t('markers.editMarker') : t('markers.addMarker')}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">{t('markers.name')}</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
              placeholder={t('markers.namePlaceholder')}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">{t('markers.description')}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => onFormDataChange({ ...formData, description: e.target.value })}
              placeholder={t('markers.descriptionPlaceholder')}
              rows={2}
            />
          </div>

          {!editingMarker && formData.raString && (
            <div className="grid gap-2">
              <Label>{t('coordinates.coordinates')}</Label>
              <div className="text-sm font-mono bg-muted p-2 rounded">
                RA: {formData.raString} / Dec: {formData.decString}
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <Label>{t('markers.icon')}</Label>
            <ToggleGroup
              type="single"
              value={formData.icon}
              onValueChange={(value) => value && onFormDataChange({ ...formData, icon: value as MarkerIcon })}
              className="flex-wrap justify-start"
            >
              {MARKER_ICONS.map((icon) => {
                const IconComponent = MarkerIconDisplay[icon];
                return (
                  <ToggleGroupItem
                    key={icon}
                    value={icon}
                    aria-label={icon}
                    className="h-9 w-9"
                  >
                    <IconComponent className="h-4 w-4" />
                  </ToggleGroupItem>
                );
              })}
            </ToggleGroup>
          </div>

          <div className="grid gap-2">
            <Label>{t('markers.color')}</Label>
            <div className="flex gap-1 flex-wrap">
              {MARKER_COLORS.map((color) => (
                <Button
                  key={color}
                  variant="ghost"
                  size="icon"
                  aria-label={color}
                  className={cn(
                    'h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 p-0',
                    formData.color === color ? 'border-primary scale-110' : 'border-transparent'
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => onFormDataChange({ ...formData, color })}
                />
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="group">{t('markers.group')}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Input
                  id="group"
                  value={formData.group}
                  onChange={(e) => onFormDataChange({ ...formData, group: e.target.value })}
                  placeholder={t('markers.groupPlaceholder')}
                  autoComplete="off"
                />
              </PopoverTrigger>
              {groups.length > 0 && (
                <PopoverContent
                  className="w-[var(--radix-popover-trigger-width)] p-1"
                  align="start"
                  onOpenAutoFocus={(e) => e.preventDefault()}
                >
                  <div className="max-h-[120px] overflow-y-auto space-y-0.5">
                    {groups
                      .filter((g) => !formData.group || g.toLowerCase().includes(formData.group.toLowerCase()))
                      .map((group) => (
                        <button
                          key={group}
                          type="button"
                          className="w-full text-left text-sm px-2 py-1.5 rounded hover:bg-muted transition-colors"
                          onClick={() => onFormDataChange({ ...formData, group })}
                        >
                          {group}
                        </button>
                      ))}
                  </div>
                </PopoverContent>
              )}
            </Popover>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={onSave} disabled={!formData.name.trim()}>
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
