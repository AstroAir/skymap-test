'use client';

import { useTranslations } from 'next-intl';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { StatusBadgeProps } from '@/types/starmap/objects';

export function StatusBadge({ 
  status, 
  responseTime 
}: StatusBadgeProps) {
  const t = useTranslations();
  
  const statusConfig = {
    unknown: { icon: AlertCircle, color: 'text-muted-foreground bg-muted', label: t('sourceConfig.statusUnknown') },
    checking: { icon: Loader2, color: 'text-blue-400 bg-blue-500/20', label: t('sourceConfig.statusChecking') },
    online: { icon: CheckCircle2, color: 'text-green-400 bg-green-500/20', label: t('sourceConfig.statusOnline') },
    offline: { icon: XCircle, color: 'text-red-400 bg-red-500/20', label: t('sourceConfig.statusOffline') },
    error: { icon: AlertCircle, color: 'text-orange-400 bg-orange-500/20', label: t('sourceConfig.statusError') },
  };
  
  const config = statusConfig[status];
  const Icon = config.icon;
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="outline" className={cn('text-xs gap-1', config.color)}>
          <Icon className={cn('h-3 w-3', status === 'checking' && 'animate-spin')} />
          {responseTime !== undefined && status === 'online' && (
            <span className="font-mono">{responseTime}ms</span>
          )}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p>{config.label}</p>
        {responseTime !== undefined && (
          <p className="text-xs text-muted-foreground">
            {t('sourceConfig.responseTime')}: {responseTime}ms
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
