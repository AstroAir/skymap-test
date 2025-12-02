'use client';

import { useState, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { useTranslations } from 'next-intl';
import { useStellariumStore } from '@/lib/starmap/stores';
import { useTargetListStore } from '@/lib/starmap/stores/target-list-store';
import { useObjectSearch, type ObjectType } from '@/lib/starmap/hooks';
import { rad2deg, degreesToHMS, degreesToDMS } from '@/lib/starmap/utils';
import type { SearchResultItem } from '@/lib/starmap/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
  Star,
  Globe,
  Moon as MoonIcon,
  Sparkles,
  CircleDot,
  Loader2,
  Filter,
  Plus,
  CheckSquare,
  Square,
  X,
  Clock,
  ChevronDown,
  ChevronRight,
  ListPlus,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export interface StellariumSearchRef {
  focusSearchInput: () => void;
}

interface StellariumSearchProps {
  onSelect?: (item?: SearchResultItem) => void;
  enableMultiSelect?: boolean;
  onBatchAdd?: (items: SearchResultItem[]) => void;
}

// Helper to get unique ID for a search result
function getResultId(item: SearchResultItem): string {
  return `${item.Type || 'unknown'}-${item.Name}`;
}

// ============================================================================
// Component
// ============================================================================

export const StellariumSearch = forwardRef<StellariumSearchRef, StellariumSearchProps>(
  function StellariumSearch({ onSelect, enableMultiSelect = true, onBatchAdd }, ref) {
    const t = useTranslations();
    const searchInputRef = useRef<HTMLInputElement>(null);
    const stel = useStellariumStore((state) => state.stel);
    const addTargetsBatch = useTargetListStore((state) => state.addTargetsBatch);
    
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
      getSelectedItems,
      isSelected,
      popularObjects,
      quickCategories,
    } = useObjectSearch();
    
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['DSO', 'Planet']));

    useImperativeHandle(ref, () => ({
      focusSearchInput: () => {
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 100);
      },
    }));

    // Toggle group expansion
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

    // Navigate to target in Stellarium
    const selectTarget = useCallback(async (item: SearchResultItem) => {
      if (!stel) return;

      try {
        // Handle Stellarium objects (Comets, Planets)
        if (item.StellariumObj) {
          Object.assign(stel.core, { selection: item.StellariumObj });
          stel.pointAndLock(item.StellariumObj);
          addRecentSearch(item.Name);
          onSelect?.(item);
          return;
        }

        // Handle legacy Planets without StellariumObj
        let ra: number | undefined = item.RA;
        let dec: number | undefined = item.Dec;
        
        if (item.Type && (item.Type === 'Planet' || item.Type === 'Star' || item.Type === 'Moon')) {
          const planetInfo = stel.getObj(`NAME ${item.Name}`)?.getInfo('pvo', stel.observer) as number[][] | undefined;
          if (planetInfo) {
            const cirs = stel.convertFrame(stel.observer, 'ICRF', 'CIRS', planetInfo[0]);
            ra = rad2deg(stel.anp(stel.c2s(cirs)[0]));
            dec = rad2deg(stel.anpm(stel.c2s(cirs)[1]));
          }
        }

        // Handle coordinate-based objects
        if (ra !== undefined && dec !== undefined) {
          const ra_rad = ra * stel.D2R;
          const dec_rad = dec * stel.D2R;
          const icrfVec = stel.s2c(ra_rad, dec_rad);
          const observedVec = stel.convertFrame(stel.observer, 'ICRF', 'CIRS', icrfVec);

          const targetCircle = stel.createObj('circle', {
            id: 'targetCircle',
            pos: observedVec,
            color: [0, 0, 0, 0.1],
            size: [0.05, 0.05],
          });

          targetCircle.pos = observedVec;
          targetCircle.update();
          Object.assign(stel.core, { selection: targetCircle });
          stel.pointAndLock(targetCircle);
        }

        addRecentSearch(item.Name);
        onSelect?.(item);
      } catch (error) {
        console.error('Error selecting target:', error);
      }
    }, [stel, onSelect, addRecentSearch]);

    // Handle batch add to target list
    const handleBatchAdd = useCallback(() => {
      const selected = getSelectedItems();
      if (selected.length === 0) return;
      
      const batchItems = selected
        .filter(item => item.RA !== undefined && item.Dec !== undefined)
        .map(item => ({
          name: item.Name,
          ra: item.RA!,
          dec: item.Dec!,
          raString: degreesToHMS(item.RA!),
          decString: degreesToDMS(item.Dec!),
        }));
      
      if (batchItems.length > 0) {
        addTargetsBatch(batchItems);
        clearSelection();
        onBatchAdd?.(selected);
      }
    }, [getSelectedItems, addTargetsBatch, clearSelection, onBatchAdd]);

    // Type filter toggle
    const toggleTypeFilter = useCallback((type: ObjectType) => {
      const currentTypes = filters.types;
      const newTypes = currentTypes.includes(type)
        ? currentTypes.filter(t => t !== type)
        : [...currentTypes, type];
      setFilters({ types: newTypes });
    }, [filters.types, setFilters]);

    // Icon helpers
    const getTypeIcon = (type?: string) => {
      switch (type) {
        case 'Comet': return <Sparkles className="h-4 w-4 text-green-400" />;
        case 'Planet': return <Globe className="h-4 w-4 text-blue-400" />;
        case 'DSO': return <CircleDot className="h-4 w-4 text-purple-400" />;
        case 'Star': return <Star className="h-4 w-4 text-orange-400" />;
        case 'Moon': return <MoonIcon className="h-4 w-4 text-gray-400" />;
        default: return <CircleDot className="h-4 w-4 text-gray-400" />;
      }
    };


    const selectedCount = selectedIds.size;
    const hasResults = results.length > 0;

    return (
      <div className="flex flex-col gap-3">
        {/* Search Input Row */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              ref={searchInputRef}
              placeholder={t('starmap.searchPlaceholder')}
              className="h-9 w-full pl-9 pr-8"
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                onClick={clearSearch}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          
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
              {(['DSO', 'Planet', 'Star', 'Moon', 'Comet'] as ObjectType[]).map((type) => (
                <DropdownMenuCheckboxItem
                  key={type}
                  checked={filters.types.includes(type)}
                  onCheckedChange={() => toggleTypeFilter(type)}
                >
                  <span className="flex items-center gap-2">
                    {getTypeIcon(type)}
                    {type}
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

        {/* Loading indicator */}
        {isSearching && (
          <div className="flex items-center justify-center py-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="ml-2 text-xs text-muted-foreground">{t('common.loading')}</span>
          </div>
        )}

        {/* Multi-select toolbar */}
        {enableMultiSelect && hasResults && (
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => selectedCount > 0 ? clearSelection() : selectAll()}
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
                onClick={handleBatchAdd}
              >
                <ListPlus className="h-3 w-3 mr-1" />
                {t('search.addToList')}
              </Button>
            )}
          </div>
        )}

        {/* Search Results - Grouped */}
        {hasResults && !isSearching && (
          <ScrollArea className="max-h-72">
            <div className="space-y-2">
              {Array.from(groupedResults.entries()).map(([groupName, items]) => (
                <div key={groupName} className="space-y-1">
                  {/* Group Header */}
                  <button
                    className="flex items-center gap-1 w-full text-left text-xs font-medium text-muted-foreground hover:text-foreground py-1"
                    onClick={() => toggleGroup(groupName)}
                  >
                    {expandedGroups.has(groupName) ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                    {getTypeIcon(groupName)}
                    <span className="ml-1">{groupName}</span>
                    <Badge variant="secondary" className="ml-auto h-4 text-[10px]">
                      {items.length}
                    </Badge>
                  </button>
                  
                  {/* Group Items */}
                  {expandedGroups.has(groupName) && (
                    <div className="space-y-0.5 pl-4">
                      {items.map((item) => {
                        const itemId = getResultId(item);
                        const checked = isSelected(itemId);
                        
                        return (
                          <div
                            key={itemId}
                            className={`flex items-center gap-2 p-1.5 rounded-md hover:bg-accent/50 cursor-pointer transition-colors ${
                              checked ? 'bg-accent/30' : ''
                            }`}
                          >
                            {/* Checkbox for multi-select */}
                            {enableMultiSelect && (
                              <Checkbox
                                checked={checked}
                                onCheckedChange={() => toggleSelection(itemId)}
                                className="h-4 w-4"
                              />
                            )}
                            
                            {/* Clickable content */}
                            <button
                              className="flex-1 flex items-center gap-2 min-w-0 text-left"
                              onClick={() => selectTarget(item)}
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-foreground font-medium truncate">
                                  {item.Name}
                                </p>
                                {item['Common names'] && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {item['Common names']}
                                  </p>
                                )}
                              </div>
                              
                              {/* Coordinates */}
                              {item.RA !== undefined && item.Dec !== undefined && (
                                <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                                  {item.RA.toFixed(1)}° / {item.Dec.toFixed(1)}°
                                </span>
                              )}
                            </button>
                            
                            {/* Quick add button */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 shrink-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (item.RA !== undefined && item.Dec !== undefined) {
                                      addTargetsBatch([{
                                        name: item.Name,
                                        ra: item.RA,
                                        dec: item.Dec,
                                        raString: degreesToHMS(item.RA),
                                        decString: degreesToDMS(item.Dec),
                                      }]);
                                    }
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
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Empty State */}
        {query && !hasResults && !isSearching && (
          <div className="text-center py-4 text-muted-foreground">
            <CircleDot className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">{t('starmap.noObjectsFound')}</p>
            <p className="text-xs mt-1">{t('starmap.trySearching')}</p>
          </div>
        )}

        {/* Quick Access - when no query */}
        {!query && (
          <div className="space-y-3">
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {t('search.recentSearches')}
                </p>
                <div className="flex flex-wrap gap-1">
                  {recentSearches.slice(0, 5).map((term) => (
                    <Button
                      key={term}
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => setQuery(term)}
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
                    onClick={() => setQuery(obj.Name)}
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
                    onClick={() => setQuery(cat.items[0]?.Name || cat.label)}
                  >
                    {cat.label}
                    <Badge variant="secondary" className="ml-auto h-4 text-[10px]">
                      {cat.items.length}
                    </Badge>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);
