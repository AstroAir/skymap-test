'use client';

import { Check, Star, Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { LucideIcon } from 'lucide-react';

export interface EquipmentListItemProps {
  icon: LucideIcon;
  name: string;
  detail: string;
  isSelected?: boolean;
  isDefault?: boolean;
  selectable?: boolean;
  deleteLabel: string;
  editLabel?: string;
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete: () => void;
}

export function EquipmentListItem({
  icon: Icon,
  name,
  detail,
  isSelected,
  isDefault,
  selectable,
  deleteLabel,
  editLabel,
  onSelect,
  onEdit,
  onDelete,
}: EquipmentListItemProps) {
  return (
    <div
      className={`flex items-center justify-between p-2 border rounded ${selectable ? 'cursor-pointer hover:bg-muted/50' : ''} ${isSelected ? 'border-primary bg-primary/10' : ''}`}
      onClick={selectable ? onSelect : undefined}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        <div>
          <p className="font-medium text-sm">{name}</p>
          <p className="text-xs text-muted-foreground">{detail}</p>
        </div>
        {isSelected && <Check className="h-3 w-3 text-primary" />}
        {isDefault && <Star className="h-3 w-3 text-yellow-500" />}
      </div>
      <div className="flex items-center gap-0.5">
        {onEdit && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={editLabel}
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{editLabel}</TooltipContent>
          </Tooltip>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={deleteLabel}
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{deleteLabel}</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
