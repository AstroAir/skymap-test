'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { ImageSourceConfig, DataSourceConfig } from '@/lib/services/object-info-config';
import type { AddCustomSourceDialogProps } from '@/types/starmap/objects';

export function AddCustomSourceDialog({
  type,
  onAdd,
}: AddCustomSourceDialogProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [urlTemplate, setUrlTemplate] = useState('');
  const [credit, setCredit] = useState('');
  const [description, setDescription] = useState('');
  
  const handleSubmit = () => {
    if (!name || !baseUrl) return;
    
    if (type === 'image') {
      onAdd({
        name,
        type: 'custom',
        enabled: true,
        priority: 100,
        baseUrl,
        urlTemplate: urlTemplate || '?ra={ra}&dec={dec}&size={size}',
        credit: credit || name,
        description: description || t('sourceConfig.customImageSourceDefault', { name }),
      } as Partial<ImageSourceConfig>);
    } else {
      onAdd({
        name,
        type: 'custom',
        enabled: true,
        priority: 100,
        baseUrl,
        apiEndpoint: urlTemplate || '/api',
        timeout: 5000,
        description: description || t('sourceConfig.customDataSourceDefault', { name }),
      } as Partial<DataSourceConfig>);
    }
    
    setOpen(false);
    setName('');
    setBaseUrl('');
    setUrlTemplate('');
    setCredit('');
    setDescription('');
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          {t('sourceConfig.addCustom')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {type === 'image' 
              ? t('sourceConfig.addImageSource') 
              : t('sourceConfig.addDataSource')
            }
          </DialogTitle>
          <DialogDescription>
            {t('sourceConfig.addCustomDescription')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('sourceConfig.sourceName')}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('sourceConfig.sourceNamePlaceholder')}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="baseUrl">{t('sourceConfig.baseUrl')}</Label>
            <Input
              id="baseUrl"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="urlTemplate">
              {type === 'image' 
                ? t('sourceConfig.urlTemplate') 
                : t('sourceConfig.apiEndpoint')
              }
            </Label>
            <Input
              id="urlTemplate"
              value={urlTemplate}
              onChange={(e) => setUrlTemplate(e.target.value)}
              placeholder={type === 'image' 
                ? "/image?ra={ra}&dec={dec}&size={size}&format={format}"
                : "/api/query"
              }
            />
            {type === 'image' && (
              <p className="text-xs text-muted-foreground">
                {t('sourceConfig.urlTemplateHint')}
              </p>
            )}
          </div>
          
          {type === 'image' && (
            <div className="space-y-2">
              <Label htmlFor="credit">{t('sourceConfig.credit')}</Label>
              <Input
                id="credit"
                value={credit}
                onChange={(e) => setCredit(e.target.value)}
                placeholder={t('sourceConfig.creditPlaceholder')}
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="description">{t('sourceConfig.sourceDescription')}</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('sourceConfig.descriptionPlaceholder')}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={!name || !baseUrl}>
            {t('common.add')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
