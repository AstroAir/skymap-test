'use client';

import { memo, forwardRef } from 'react';
import { useTranslations } from 'next-intl';
import { translateCelestialName } from '@/lib/translations';
import type { SearchResultItem, SkyCultureLanguage } from '@/lib/core/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Plus } from 'lucide-react';

// Helper to get unique ID for a search result
export function getResultId(item: SearchResultItem): string {
  return `${item.Type || 'unknown'}-${item.Name}`;
}

export interface SearchResultItemProps {
  item: SearchResultItem;
  itemId: string;
  checked: boolean;
  isHighlighted?: boolean;
  showCheckbox?: boolean;
  skyCultureLanguage: SkyCultureLanguage | string;
  onSelect: (item: SearchResultItem) => void;
  onToggleSelection?: (id: string) => void;
  onMouseEnter?: (index: number) => void;
  onAddToTargetList: (item: SearchResultItem) => void;
  globalIndex?: number;
}

export const SearchResultItemRow = memo(forwardRef<HTMLDivElement, SearchResultItemProps>(function SearchResultItemRow({
  item,
  itemId,
  checked,
  isHighlighted = false,
  showCheckbox = true,
  skyCultureLanguage,
  onSelect,
  onToggleSelection,
  onMouseEnter,
  onAddToTargetList,
  globalIndex = 0,
}, ref) {
  const t = useTranslations();

  return (
    <div
      ref={ref}
      id={`search-option-${itemId}`}
      role="option"
      aria-selected={isHighlighted}
      className={`flex items-center gap-2 p-1.5 rounded-md hover:bg-accent/50 cursor-pointer transition-colors ${
        checked ? 'bg-accent/30' : ''
      } ${isHighlighted ? 'ring-2 ring-primary bg-accent/40' : ''}`}
      onMouseEnter={() => onMouseEnter?.(globalIndex)}
    >
      {showCheckbox && onToggleSelection && (
        <Checkbox
          checked={checked}
          onCheckedChange={() => onToggleSelection(itemId)}
          className="h-4 w-4"
        />
      )}
      
      <button
        className="flex-1 flex items-center gap-2 min-w-0 text-left"
        onClick={() => onSelect(item)}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground font-medium truncate">
            {translateCelestialName(item.Name, skyCultureLanguage as SkyCultureLanguage)}
          </p>
          {item['Common names'] && (
            <p className="text-xs text-muted-foreground truncate">
              {translateCelestialName(item['Common names'], skyCultureLanguage as SkyCultureLanguage)}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          {item.Magnitude !== undefined && (
            <span className="text-[10px] text-muted-foreground bg-muted/50 px-1 rounded">
              {item.Magnitude.toFixed(1)}m
            </span>
          )}
          {item.Size && (
            <span className="text-[10px] text-muted-foreground">
              {item.Size}
            </span>
          )}
          {item.RA !== undefined && item.Dec !== undefined && (
            <span className="text-[10px] text-muted-foreground font-mono">
              {item.RA.toFixed(1)}°/{item.Dec.toFixed(1)}°
            </span>
          )}
        </div>
      </button>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onAddToTargetList(item);
            }}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          {t('actions.addToTargetList')}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}));
