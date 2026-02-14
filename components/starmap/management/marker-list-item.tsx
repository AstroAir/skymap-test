'use client';

import {
  Navigation,
  Eye,
  EyeOff,
  Edit,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { MarkerIconDisplay } from '@/lib/constants/marker-icons';
import type { SkyMarker } from '@/lib/stores';

interface MarkerListItemProps {
  marker: SkyMarker;
  t: (key: string) => string;
  onNavigate: (marker: SkyMarker) => void;
  onToggleVisibility: (id: string) => void;
  onEdit: (marker: SkyMarker) => void;
  onDelete: (marker: SkyMarker) => void;
}

export function MarkerListItem({
  marker,
  t,
  onNavigate,
  onToggleVisibility,
  onEdit,
  onDelete,
}: MarkerListItemProps) {
  const IconComponent = MarkerIconDisplay[marker.icon];

  return (
    <div
      className={cn(
        'flex items-center gap-2 p-2 rounded-md hover:bg-accent/50 group',
        !marker.visible && 'opacity-50'
      )}
    >
      <IconComponent
        className="h-5 w-5 shrink-0"
        style={{ color: marker.color }}
      />
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{marker.name}</div>
        <div className="text-xs text-muted-foreground font-mono truncate">
          {marker.raString} / {marker.decString}
        </div>
      </div>
      <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onNavigate(marker);
              }}
            >
              <Navigation className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">{t('markers.goTo')}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onToggleVisibility(marker.id);
              }}
            >
              {marker.visible ? (
                <Eye className="h-3.5 w-3.5" />
              ) : (
                <EyeOff className="h-3.5 w-3.5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            {marker.visible ? t('markers.hide') : t('markers.show')}
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(marker);
              }}
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">{t('common.edit')}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(marker);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">{t('common.delete')}</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
