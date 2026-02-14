'use client';

import { useState, useCallback, memo } from 'react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { getResultId } from '@/lib/core/search-utils';
import type { SearchResultItem, SkyCultureLanguage } from '@/lib/core/types';
import { SearchResultItemRow } from './search-result-item';
import { getTypeIcon } from './search-utils';

export interface GroupedResultsListProps {
  groupedResults: Map<string, SearchResultItem[]>;
  isSelected: (id: string) => boolean;
  skyCultureLanguage: SkyCultureLanguage | string;
  onSelect: (item: SearchResultItem) => void;
  onToggleSelection?: (id: string) => void;
  onAddToTargetList: (item: SearchResultItem) => void;
  showCheckbox?: boolean;
  /** Index map for keyboard navigation highlight */
  indexMap?: Map<string, number>;
  highlightedIndex?: number;
  onMouseEnter?: (index: number) => void;
  /** Ref callback for scroll-into-view */
  itemRefCallback?: (index: number, el: HTMLDivElement | null) => void;
  /** Initial expanded groups */
  defaultExpanded?: string[];
  listboxId?: string;
  searchQuery?: string;
}

export const GroupedResultsList = memo(function GroupedResultsList({
  groupedResults,
  isSelected,
  skyCultureLanguage,
  onSelect,
  onToggleSelection,
  onAddToTargetList,
  showCheckbox = true,
  indexMap,
  highlightedIndex = -1,
  onMouseEnter,
  itemRefCallback,
  defaultExpanded = ['DSO', 'Planet'],
  listboxId,
  searchQuery = '',
}: GroupedResultsListProps) {
  const t = useTranslations();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(defaultExpanded));

  const toggleGroup = useCallback((group: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
  }, []);

  return (
    <div className="space-y-2" role="listbox" id={listboxId}>
      {Array.from(groupedResults.entries()).map(([groupName, items]) => (
        <Collapsible
          key={groupName}
          open={expandedGroups.has(groupName)}
          onOpenChange={() => toggleGroup(groupName)}
          className="space-y-1"
        >
          <CollapsibleTrigger className="flex items-center gap-1 w-full text-left text-xs font-medium text-muted-foreground hover:text-foreground py-1">
            {expandedGroups.has(groupName) ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            {getTypeIcon(groupName)}
            <span className="ml-1">{t(`objects.${groupName.toLowerCase()}`)}</span>
            <Badge variant="secondary" className="ml-auto h-4 text-[10px]">
              {items.length}
            </Badge>
          </CollapsibleTrigger>

          <CollapsibleContent className="space-y-0.5 pl-4">
            {items.map((item) => {
              const itemId = getResultId(item);
              const globalIndex = indexMap?.get(itemId) ?? -1;

              return (
                <SearchResultItemRow
                  key={itemId}
                  ref={itemRefCallback ? (el: HTMLDivElement | null) => itemRefCallback(globalIndex, el) : undefined}
                  item={item}
                  itemId={itemId}
                  checked={isSelected(itemId)}
                  isHighlighted={globalIndex === highlightedIndex}
                  showCheckbox={showCheckbox}
                  skyCultureLanguage={skyCultureLanguage}
                  onSelect={onSelect}
                  onToggleSelection={onToggleSelection}
                  onMouseEnter={onMouseEnter}
                  onAddToTargetList={onAddToTargetList}
                  globalIndex={globalIndex}
                  searchQuery={searchQuery}
                />
              );
            })}
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
});
