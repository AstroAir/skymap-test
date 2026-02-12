'use client';

import { useTranslations } from 'next-intl';
import {
  Settings,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import { StatusBadge } from './status-badge';
import { cn } from '@/lib/utils';
import type { SourceItemProps } from '@/types/starmap/objects';

export function SourceItem({
  source,
  onToggle,
  onCheck,
  onRemove,
  onEdit,
}: SourceItemProps) {
  const t = useTranslations();
  
  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-lg border transition-colors',
      source.enabled ? 'bg-card' : 'bg-muted/30 opacity-60'
    )}>
      {/* Priority indicator - drag reordering not implemented */}
      <div className="flex flex-col items-center justify-center w-4 text-muted-foreground" title={t('sourceConfig.priorityHint')}>
        <span className="text-[10px] font-mono leading-none">{source.priority}</span>
      </div>
      
      <Switch
        checked={source.enabled}
        onCheckedChange={onToggle}
        aria-label={t('sourceConfig.toggleSource')}
      />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{source.name}</span>
          <Badge variant="outline" className="text-[10px]">
            {source.type}
          </Badge>
          {source.builtIn && (
            <Badge variant="secondary" className="text-[10px]">
              {t('sourceConfig.builtIn')}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {source.description}
        </p>
      </div>
      
      <StatusBadge status={source.status} responseTime={source.responseTime} />
      
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onCheck}
          disabled={source.status === 'checking'}
        >
          <RefreshCw className={cn('h-3.5 w-3.5', source.status === 'checking' && 'animate-spin')} />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onEdit}
        >
          <Settings className="h-3.5 w-3.5" />
        </Button>
        
        {!source.builtIn && onRemove && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('sourceConfig.deleteSource')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('sourceConfig.deleteSourceDescription', { name: source.name })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={onRemove}>{t('common.delete')}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}
