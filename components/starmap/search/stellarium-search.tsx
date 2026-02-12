'use client';

import { useState, useRef, useCallback, forwardRef, useImperativeHandle, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useObjectSearch, type ObjectType, useSkyCultureLanguage, useSelectTarget } from '@/lib/hooks';
import { useTargetListActions } from '@/lib/hooks/use-target-list-actions';
import type { SearchResultItem } from '@/lib/core/types';
import type { StellariumSearchRef, StellariumSearchProps } from '@/types/starmap/search';
import { getResultId } from '@/lib/core/search-utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getTypeIcon, getCategoryIcon } from './search-utils';
import { MultiSelectToolbar } from './multi-select-toolbar';
import { GroupedResultsList } from './grouped-results-list';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  CircleDot,
  Loader2,
  Filter,
  X,
  Clock,
  SlidersHorizontal,
  Trash2,
  MapPin,
  ArrowUp,
  ArrowDown,
  CornerDownLeft,
} from 'lucide-react';
import { AdvancedSearchDialog } from './advanced-search-dialog';

export type { StellariumSearchRef, StellariumSearchProps } from '@/types/starmap/search';

export const StellariumSearch = forwardRef<StellariumSearchRef, StellariumSearchProps>(
  function StellariumSearch({ onSelect, enableMultiSelect = true, onBatchAdd, onFocusChange }, ref) {
    const t = useTranslations();
    const searchInputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    
    // Use the enhanced search hook
    const {
      query,
      results,
      groupedResults,
      isSearching,
      selectedIds,
      filters,
      sortBy,
      recentSearches,
      setQuery,
      clearSearch,
      toggleSelection,
      selectAll,
      clearSelection,
      setFilters,
      setSortBy,
      addRecentSearch,
      clearRecentSearches,
      getSelectedItems,
      isSelected,
      popularObjects,
      quickCategories,
      searchStats,
    } = useObjectSearch();
    
    const [isFocused, setIsFocused] = useState(false);
    const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [showKeyboardHints, setShowKeyboardHints] = useState(false);
    const keyboardHintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    
    // Get sky culture language for name translation
    const skyCultureLanguage = useSkyCultureLanguage();

    useImperativeHandle(ref, () => ({
      focusSearchInput: () => {
        setTimeout(() => {
          searchInputRef.current?.focus();
          setIsFocused(true);
        }, 100);
      },
      closeSearch: () => {
        setIsFocused(false);
        searchInputRef.current?.blur();
      },
    }));

    // Memoize flattened results for keyboard navigation
    const flatResults = useMemo(() => 
      Array.from(groupedResults.values()).flat(),
      [groupedResults]
    );

    // Pre-build itemId → globalIndex map to avoid O(n²) findIndex in render
    const indexMap = useMemo(() => {
      const map = new Map<string, number>();
      flatResults.forEach((r, i) => map.set(getResultId(r), i));
      return map;
    }, [flatResults]);

    // Refs for each result item (for scroll-into-view)
    const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());

    // Compute active descendant ID for ARIA
    const activeDescendantId = useMemo(() => {
      if (highlightedIndex < 0 || highlightedIndex >= flatResults.length) return undefined;
      return `search-option-${getResultId(flatResults[highlightedIndex])}`;
    }, [highlightedIndex, flatResults]);

    // Scroll highlighted item into view
    useEffect(() => {
      if (highlightedIndex >= 0) {
        const el = itemRefs.current.get(highlightedIndex);
        el?.scrollIntoView({ block: 'nearest' });
      }
    }, [highlightedIndex]);
    
    // Shared target list actions
    const targetListOptions = useMemo(() => ({
      getSelectedItems,
      clearSelection,
      onBatchAdd,
    }), [getSelectedItems, clearSelection, onBatchAdd]);
    const { handleAddToTargetList, handleBatchAdd } = useTargetListActions(targetListOptions);

    // Handle click outside to close search results
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node) &&
          !advancedSearchOpen
        ) {
          setIsFocused(false);
          onFocusChange?.(false);
          setHighlightedIndex(-1);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        // Clean up keyboard hint timer on unmount
        if (keyboardHintTimerRef.current) {
          clearTimeout(keyboardHintTimerRef.current);
        }
      };
    }, [advancedSearchOpen, onFocusChange]);

    // Wrap setQuery to also reset highlighted index
    const handleQueryChange = useCallback((newQuery: string) => {
      setQuery(newQuery);
      setHighlightedIndex(-1);
    }, [setQuery]);

    // Handle focus change
    const handleFocus = useCallback(() => {
      setIsFocused(true);
      onFocusChange?.(true);
      setShowKeyboardHints(true);
      // Clear previous timer if exists
      if (keyboardHintTimerRef.current) {
        clearTimeout(keyboardHintTimerRef.current);
      }
      // Hide keyboard hints after 3 seconds
      keyboardHintTimerRef.current = setTimeout(() => setShowKeyboardHints(false), 3000);
    }, [onFocusChange]);


    // Handle advanced search select
    const handleAdvancedSelect = useCallback((item?: SearchResultItem) => {
      if (item) {
        onSelect?.(item);
        setIsFocused(false);
        onFocusChange?.(false);
      }
    }, [onSelect, onFocusChange]);

    // Navigate to target in Stellarium (shared hook)
    const selectTargetCallbacks = useMemo(() => ({
      onSelect,
      addRecentSearch,
    }), [onSelect, addRecentSearch]);
    const selectTarget = useSelectTarget(selectTargetCallbacks);

    // Handle keyboard navigation (must be after selectTarget)
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
      if (!isFocused) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex(prev => 
            prev < flatResults.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < flatResults.length) {
            selectTarget(flatResults[highlightedIndex]);
            setIsFocused(false);
            onFocusChange?.(false);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsFocused(false);
          onFocusChange?.(false);
          setHighlightedIndex(-1);
          searchInputRef.current?.blur();
          break;
        case 'Tab':
          // Allow tab to work normally but close search
          setIsFocused(false);
          onFocusChange?.(false);
          break;
      }
    }, [isFocused, flatResults, highlightedIndex, selectTarget, onFocusChange]);

    // Type filter toggle
    const toggleTypeFilter = useCallback((type: ObjectType) => {
      const currentTypes = filters.types;
      const newTypes = currentTypes.includes(type)
        ? currentTypes.filter(t => t !== type)
        : [...currentTypes, type];
      setFilters({ types: newTypes });
    }, [filters.types, setFilters]);



    const selectedCount = selectedIds.size;
    const hasResults = results.length > 0;

    // Determine if we should show the results panel
    const showResultsPanel = isFocused || query.length > 0;

    return (
      <div className="flex flex-col gap-3" ref={containerRef}>
        {/* Search Input Row */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              ref={searchInputRef}
              placeholder={t('starmap.searchPlaceholder')}
              className="h-9 w-full pl-9 pr-8"
              onFocus={handleFocus}
              onKeyDown={handleKeyDown}
              aria-label={t('starmap.searchObjects')}
              aria-expanded={showResultsPanel}
              aria-autocomplete="list"
              aria-haspopup="listbox"
              aria-controls="search-results-listbox"
              aria-activedescendant={activeDescendantId}
              role="combobox"
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                onClick={() => {
                  clearSearch();
                  setIsFocused(false);
                  onFocusChange?.(false);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          {/* Advanced Search Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() => setAdvancedSearchOpen(true)}
              >
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('search.advancedSearch')}</TooltipContent>
          </Tooltip>
          
          {/* Filter Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>{t('search.filterByType')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(['DSO', 'Planet', 'Star', 'Moon', 'Comet', 'Constellation'] as ObjectType[]).map((type) => (
                <DropdownMenuCheckboxItem
                  key={type}
                  checked={filters.types.includes(type)}
                  onCheckedChange={() => toggleTypeFilter(type)}
                >
                  <span className="flex items-center gap-2">
                    {getTypeIcon(type)}
                    {t(`objects.${type.toLowerCase()}`)}
                  </span>
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>{t('search.sortBy')}</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={sortBy === 'name'}
                onCheckedChange={() => setSortBy('name')}
              >
                {t('search.sortByName')}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={sortBy === 'type'}
                onCheckedChange={() => setSortBy('type')}
              >
                {t('search.sortByType')}
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Advanced Search Dialog */}
        <AdvancedSearchDialog
          open={advancedSearchOpen}
          onOpenChange={setAdvancedSearchOpen}
          onSelect={handleAdvancedSelect}
        />

        {/* Keyboard hints */}
        {showResultsPanel && showKeyboardHints && hasResults && (
          <div className="flex items-center justify-center gap-3 py-1 text-[10px] text-muted-foreground bg-muted/30 rounded-md">
            <span className="flex items-center gap-1">
              <ArrowUp className="h-3 w-3" />
              <ArrowDown className="h-3 w-3" />
              {t('search.navigateHint')}
            </span>
            <span className="flex items-center gap-1">
              <CornerDownLeft className="h-3 w-3" />
              {t('search.selectHint')}
            </span>
            <span>Esc {t('search.closeHint')}</span>
          </div>
        )}

        {/* Loading indicator */}
        {isSearching && (
          <div className="flex items-center justify-center py-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="ml-2 text-xs text-muted-foreground">{t('common.loading')}</span>
          </div>
        )}

        {/* Search Statistics */}
        {showResultsPanel && searchStats && hasResults && !isSearching && (
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground py-1">
            <span>{t('search.foundResults', { count: searchStats.totalResults })}</span>
            <span className="text-muted-foreground/50">•</span>
            <span>{searchStats.searchTimeMs}ms</span>
          </div>
        )}

        {/* Multi-select toolbar */}
        {showResultsPanel && enableMultiSelect && hasResults && (
          <MultiSelectToolbar
            selectedCount={selectedCount}
            onToggleSelectAll={() => selectedCount > 0 ? clearSelection() : selectAll()}
            onBatchAdd={handleBatchAdd}
          />
        )}

        {/* Search Results - Grouped */}
        {showResultsPanel && hasResults && !isSearching && (
          <ScrollArea className="max-h-72">
            <GroupedResultsList
              groupedResults={groupedResults}
              isSelected={isSelected}
              skyCultureLanguage={skyCultureLanguage}
              onSelect={selectTarget}
              onToggleSelection={toggleSelection}
              onAddToTargetList={handleAddToTargetList}
              showCheckbox={enableMultiSelect}
              indexMap={indexMap}
              highlightedIndex={highlightedIndex}
              onMouseEnter={setHighlightedIndex}
              itemRefCallback={(index, el) => {
                if (el) itemRefs.current.set(index, el);
                else itemRefs.current.delete(index);
              }}
              listboxId="search-results-listbox"
            />
          </ScrollArea>
        )}

        {/* Empty State */}
        {showResultsPanel && query && !hasResults && !isSearching && (
          <div className="text-center py-4 text-muted-foreground">
            <CircleDot className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">{t('starmap.noObjectsFound')}</p>
            <p className="text-xs mt-1">{t('starmap.trySearching')}</p>
          </div>
        )}

        {/* Quick Access - when no query */}
        {showResultsPanel && !query && (
          <div className="space-y-3">
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {t('search.recentSearches')}
                  </p>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={clearRecentSearches}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t('starmap.clearHistory')}</TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex flex-wrap gap-1">
                  {recentSearches.slice(0, 5).map((term) => (
                    <Button
                      key={term}
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => handleQueryChange(term)}
                    >
                      {term}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Popular Objects */}
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                {t('starmap.popularObjects')}
              </p>
              <div className="flex flex-wrap gap-1">
                {popularObjects.slice(0, 8).map((obj) => (
                  <Button
                    key={obj.Name}
                    variant="secondary"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => handleQueryChange(obj.Name)}
                  >
                    {obj.Name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Quick Categories */}
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                {t('search.quickCategories')}
              </p>
              <div className="grid grid-cols-2 gap-1">
                {quickCategories.map((cat) => (
                  <Button
                    key={cat.label}
                    variant="ghost"
                    size="sm"
                    className="h-7 justify-start text-xs"
                    onClick={() => {
                      // Set type filter to match category instead of searching first item's name
                      const typeMap: Record<string, ObjectType> = {
                        'galaxies': 'DSO',
                        'nebulae': 'DSO',
                        'planets': 'Planet',
                        'clusters': 'DSO',
                      };
                      const filterType = typeMap[cat.label];
                      if (filterType) {
                        setFilters({ types: [filterType] });
                        handleQueryChange(cat.label);
                      } else {
                        handleQueryChange(cat.items[0]?.Name || cat.label);
                      }
                    }}
                  >
                    {getCategoryIcon(cat.label)}
                    <span className="ml-1">{t(`search.categories.${cat.label.toLowerCase()}`)}</span>
                    <Badge variant="secondary" className="ml-auto h-4 text-[10px]">
                      {cat.items.length}
                    </Badge>
                  </Button>
                ))}
              </div>
            </div>

            {/* Search Tips */}
            <div className="text-[10px] text-muted-foreground space-y-0.5 pt-2 border-t">
              <p className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {t('starmap.coordinateSearchHint')}
              </p>
              <p>{t('starmap.fuzzySearchHint')}</p>
            </div>
          </div>
        )}
      </div>
    );
  }
);


