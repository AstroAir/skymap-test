'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/starmap/dialogs/responsive-dialog-shell';
import type { EditSourceDialogProps } from '@/types/starmap/objects';

export function EditSourceDialog({
  source,
  type,
  open,
  onOpenChange,
  onSave,
}: EditSourceDialogProps) {
  const t = useTranslations();
  const [priority, setPriority] = useState(source.priority);
  const [description, setDescription] = useState(source.description || '');
  
  const handleSave = () => {
    onSave({ priority, description });
    onOpenChange(false);
  };
  
  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} tier="standard-form">
      <ResponsiveDialogContent className="max-h-[92vh] max-h-[92dvh] overflow-hidden flex flex-col">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {t('sourceConfig.editSource')}: {source.name}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {source.builtIn 
              ? t('sourceConfig.editBuiltInDescription')
              : t('sourceConfig.editCustomDescription')
            }
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        
        <div className="space-y-4 py-4 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
          {/* Priority */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t('sourceConfig.priority')}</Label>
              <span className="text-sm text-muted-foreground font-mono">{priority}</span>
            </div>
            <Slider
              value={[priority]}
              onValueChange={([value]) => setPriority(value)}
              min={1}
              max={100}
              step={1}
            />
            <p className="text-xs text-muted-foreground">
              {t('sourceConfig.priorityDescription')}
            </p>
          </div>
          
          {/* Description (for custom sources only) */}
          {!source.builtIn && (
            <div className="space-y-2">
              <Label htmlFor="edit-description">{t('sourceConfig.sourceDescription')}</Label>
              <Input
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('sourceConfig.descriptionPlaceholder')}
              />
            </div>
          )}
          
          {/* Source Info (read-only) */}
          <div className="space-y-2 p-3 rounded-lg bg-muted/30">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('sourceConfig.sourceType')}:</span>
              <span className="font-medium">{source.type}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('sourceConfig.baseUrl')}:</span>
              <span className="font-mono text-xs truncate max-w-[200px]">{source.baseUrl}</span>
            </div>
            {type === 'image' && 'urlTemplate' in source && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('sourceConfig.urlTemplate')}:</span>
                <span className="font-mono text-xs truncate max-w-[200px]">{source.urlTemplate}</span>
              </div>
            )}
          </div>
        </div>
        
        <ResponsiveDialogFooter stickyOnMobile>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave}>
            {t('common.save')}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
