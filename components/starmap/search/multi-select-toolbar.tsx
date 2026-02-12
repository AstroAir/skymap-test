'use client';

import { memo } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { CheckSquare, Square, ListPlus } from 'lucide-react';

export interface MultiSelectToolbarProps {
  selectedCount: number;
  onToggleSelectAll: () => void;
  onBatchAdd: () => void;
  className?: string;
}

export const MultiSelectToolbar = memo(function MultiSelectToolbar({
  selectedCount,
  onToggleSelectAll,
  onBatchAdd,
  className,
}: MultiSelectToolbarProps) {
  const t = useTranslations();

  return (
    <div className={`flex items-center justify-between text-xs ${className ?? ''}`}>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={onToggleSelectAll}
        >
          {selectedCount > 0 ? (
            <>
              <CheckSquare className="h-3 w-3 mr-1" />
              {t('search.clearSelection')}
            </>
          ) : (
            <>
              <Square className="h-3 w-3 mr-1" />
              {t('search.selectAll')}
            </>
          )}
        </Button>
        {selectedCount > 0 && (
          <span className="text-muted-foreground">
            {t('search.selectedCount', { count: selectedCount })}
          </span>
        )}
      </div>
      {selectedCount > 0 && (
        <Button
          variant="default"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={onBatchAdd}
        >
          <ListPlus className="h-3 w-3 mr-1" />
          {t('search.addToList')}
        </Button>
      )}
    </div>
  );
});
