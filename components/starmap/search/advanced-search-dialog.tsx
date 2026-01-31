'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useStellariumStore } from '@/lib/stores';
import { useTargetListStore } from '@/lib/stores/target-list-store';
import { useObjectSearch, type ObjectType, useSkyCultureLanguage } from '@/lib/hooks';
import { rad2deg, degreesToHMS, degreesToDMS } from '@/lib/astronomy/starmap-utils';
import type { SearchResultItem } from '@/lib/core/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Star,
  Globe,
  Moon as MoonIcon,
  Sparkles,
  CircleDot,
  Loader2,
  CheckSquare,
  Square,
  SlidersHorizontal,
  ListPlus,
  MapPin,
  ChevronDown,
  ChevronRight,
  Bookmark,
  RotateCcw,
} from 'lucide-react';
import { SearchResultItemRow, getResultId } from './search-result-item';

// ============================================================================
// Types
// ============================================================================

interface AdvancedSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect?: (item?: SearchResultItem) => void;
}

// All available object types
const ALL_OBJECT_TYPES: ObjectType[] = ['DSO', 'Planet', 'Star', 'Moon', 'Comet', 'Constellation'];

// ============================================================================
// Validation Helpers
// ============================================================================

// Coordinate validation helpers
function isValidRA(value: string): boolean {
  if (!value.trim()) return true;
  // Check decimal format (0-360)
  const decimal = parseFloat(value);
  if (!isNaN(decimal) && decimal >= 0 && decimal < 360) return true;
  // Check HMS format
  if (/^\d+h\s*\d+m\s*[\d.]+s?$/i.test(value)) return true;
  // Check colon format
  if (/^\d+:\d+:[\d.]+$/.test(value)) return true;
  return false;
}

function isValidDec(value: string): boolean {
  if (!value.trim()) return true;
  // Check decimal format (-90 to 90)
  const decimal = parseFloat(value);
  if (!isNaN(decimal) && decimal >= -90 && decimal <= 90) return true;
  // Check DMS format
  if (/^[+-]?\d+[°d]\s*\d+[′']\s*[\d.]+[″"]?$/i.test(value)) return true;
  // Check colon format
  if (/^[+-]?\d+:\d+:[\d.]+$/.test(value)) return true;
  return false;
}

// ============================================================================
// Component
// ============================================================================

export function AdvancedSearchDialog({ open, onOpenChange, onSelect }: AdvancedSearchDialogProps) {
  const t = useTranslations();
  const stel = useStellariumStore((state) => state.stel);
  const addTargetsBatch = useTargetListStore((state) => state.addTargetsBatch);
  
  // Local state for advanced filters
  const [localQuery, setLocalQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<ObjectType[]>(ALL_OBJECT_TYPES);
  const [minMagnitude, setMinMagnitude] = useState<number | undefined>(undefined);
  const [maxMagnitude, setMaxMagnitude] = useState<number | undefined>(undefined);
  const [coordinateMode, setCoordinateMode] = useState<'name' | 'coordinates'>('name');
  const [raInput, setRaInput] = useState('');
  const [decInput, setDecInput] = useState('');
  const [searchRadius, setSearchRadius] = useState(5); // degrees
  const [includeTargetList, setIncludeTargetList] = useState(true);
  const [autoSearch, setAutoSearch] = useState(true);
  const [activeTab, setActiveTab] = useState('filters');

  // Catalog presets
  const catalogPresets = [
    { id: 'messier', label: 'Messier (M)', query: 'M' },
    { id: 'ngc', label: 'NGC', query: 'NGC' },
    { id: 'ic', label: 'IC', query: 'IC' },
    { id: 'caldwell', label: 'Caldwell', query: 'Caldwell' },
  ];
  
  // Use the search hook
  const {
    results,
    groupedResults,
    isSearching,
    selectedIds,
    sortBy,
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
    searchStats,
  } = useObjectSearch();
  
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['DSO', 'Planet', 'Constellation']));
  
  // Get sky culture language for name translation
  const skyCultureLanguage = useSkyCultureLanguage();

  // Memoize handler for adding to target list
  const handleAddToTargetList = useCallback((item: SearchResultItem) => {
    if (item.RA !== undefined && item.Dec !== undefined) {
      addTargetsBatch([{
        name: item.Name,
        ra: item.RA,
        dec: item.Dec,
        raString: degreesToHMS(item.RA),
        decString: degreesToDMS(item.Dec),
      }]);
    }
  }, [addTargetsBatch]);
  
  // Memoize close dialog handler
  const handleCloseDialog = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

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

  // Toggle type filter
  const toggleTypeFilter = useCallback((type: ObjectType) => {
    setSelectedTypes(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type);
      }
      return [...prev, type];
    });
  }, []);

  // Execute search with current filters
  const executeSearch = useCallback(() => {
    // Update filters in hook
    setFilters({
      types: selectedTypes,
      includeTargetList,
      searchMode: coordinateMode,
      minMagnitude,
      maxMagnitude,
      searchRadius,
    });
    
    // Set query to trigger search
    if (coordinateMode === 'coordinates' && raInput && decInput) {
      setQuery(`${raInput} ${decInput}`);
    } else {
      setQuery(localQuery);
    }
  }, [localQuery, selectedTypes, includeTargetList, coordinateMode, raInput, decInput, minMagnitude, maxMagnitude, searchRadius, setFilters, setQuery]);

  // Auto-search effect (must be after executeSearch is declared)
  useEffect(() => {
    if (!autoSearch || !open) return;
    
    const timer = setTimeout(() => {
      if (localQuery.length >= 2 || (coordinateMode === 'coordinates' && raInput && decInput)) {
        executeSearch();
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [localQuery, raInput, decInput, selectedTypes, autoSearch, open, coordinateMode, executeSearch]);

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
    }
  }, [getSelectedItems, addTargetsBatch, clearSelection]);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setLocalQuery('');
    setSelectedTypes(ALL_OBJECT_TYPES);
    setMinMagnitude(undefined);
    setMaxMagnitude(undefined);
    setCoordinateMode('name');
    setRaInput('');
    setDecInput('');
    setSearchRadius(5);
    setIncludeTargetList(true);
    clearSearch();
    clearSelection();
  }, [clearSearch, clearSelection]);

  // Icon helpers
  const getTypeIcon = (type?: string) => {
    switch (type) {
      case 'Comet': return <Sparkles className="h-4 w-4 text-green-400" />;
      case 'Planet': return <Globe className="h-4 w-4 text-blue-400" />;
      case 'DSO': return <CircleDot className="h-4 w-4 text-purple-400" />;
      case 'Star': return <Star className="h-4 w-4 text-orange-400" />;
      case 'Moon': return <MoonIcon className="h-4 w-4 text-gray-400" />;
      case 'Constellation': return <MapPin className="h-4 w-4 text-cyan-400" />;
      default: return <CircleDot className="h-4 w-4 text-gray-400" />;
    }
  };

  const selectedCount = selectedIds.size;
  const hasResults = results.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5" />
            {t('search.advancedSearch')}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="filters">{t('search.filters')}</TabsTrigger>
            <TabsTrigger value="results">
              {t('search.results')}
              {hasResults && (
                <Badge variant="secondary" className="ml-2">
                  {results.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Filters Tab */}
          <TabsContent value="filters" className="flex-1 space-y-4 overflow-auto">
            {/* Search Mode */}
            <div className="space-y-2">
              <Label>{t('search.searchMode')}</Label>
              <Select value={coordinateMode} onValueChange={(v) => setCoordinateMode(v as 'name' | 'coordinates')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">{t('search.searchByName')}</SelectItem>
                  <SelectItem value="coordinates">{t('search.searchByCoordinates')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Name Search */}
            {coordinateMode === 'name' && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>{t('search.objectName')}</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      value={localQuery}
                      onChange={(e) => setLocalQuery(e.target.value)}
                      placeholder={t('starmap.searchPlaceholder')}
                      className="pl-9"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          executeSearch();
                          setActiveTab('results');
                        }
                      }}
                    />
                  </div>
                </div>
                
                {/* Catalog Presets */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Bookmark className="h-3 w-3" />
                    {t('search.catalogPresets')}
                  </Label>
                  <div className="flex flex-wrap gap-1">
                    {catalogPresets.map((preset) => (
                      <Button
                        key={preset.id}
                        variant={localQuery.startsWith(preset.query) ? 'default' : 'outline'}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setLocalQuery(preset.query)}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Coordinate Search */}
            {coordinateMode === 'coordinates' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('coordinates.ra')}</Label>
                    <Input
                      type="text"
                      value={raInput}
                      onChange={(e) => setRaInput(e.target.value)}
                      placeholder={t('coordinates.raPlaceholder')}
                      className={raInput && !isValidRA(raInput) ? 'border-destructive' : ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('coordinates.dec')}</Label>
                    <Input
                      type="text"
                      value={decInput}
                      onChange={(e) => setDecInput(e.target.value)}
                      placeholder={t('coordinates.decPlaceholder')}
                      className={decInput && !isValidDec(decInput) ? 'border-destructive' : ''}
                    />
                  </div>
                </div>
                <div className="text-[10px] text-muted-foreground space-y-1">
                  <p>{t('search.coordinateFormats')}</p>
                  <p className="font-mono">• 10.68, 41.27 ({t('search.decimal')})</p>
                  <p className="font-mono">• 00h42m44s +41°16′09″</p>
                  <p className="font-mono">• 00:42:44 +41:16:09</p>
                </div>
                <div className="space-y-2">
                  <Label>{t('search.searchRadius')}: {searchRadius}°</Label>
                  <Slider
                    value={[searchRadius]}
                    onValueChange={([v]) => setSearchRadius(v)}
                    min={1}
                    max={30}
                    step={1}
                  />
                </div>
              </div>
            )}

            {/* Object Type Filters */}
            <div className="space-y-2">
              <Label>{t('search.objectTypes')}</Label>
              <div className="grid grid-cols-3 gap-2">
                {ALL_OBJECT_TYPES.map((type) => (
                  <div
                    key={type}
                    className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors ${
                      selectedTypes.includes(type) ? 'bg-accent border-accent-foreground/20' : 'hover:bg-accent/50'
                    }`}
                    onClick={() => toggleTypeFilter(type)}
                  >
                    <Checkbox
                      checked={selectedTypes.includes(type)}
                      onCheckedChange={() => toggleTypeFilter(type)}
                    />
                    {getTypeIcon(type)}
                    <span className="text-sm">{t(`objects.${type.toLowerCase()}`)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Magnitude Filter */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('search.minMagnitude')}</Label>
                <Input
                  type="number"
                  value={minMagnitude ?? ''}
                  onChange={(e) => setMinMagnitude(e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder={t('skyAtlas.any')}
                  step={0.5}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('search.maxMagnitude')}</Label>
                <Input
                  type="number"
                  value={maxMagnitude ?? ''}
                  onChange={(e) => setMaxMagnitude(e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder={t('skyAtlas.any')}
                  step={0.5}
                />
              </div>
            </div>

            {/* Sort Options */}
            <div className="space-y-2">
              <Label>{t('search.sortBy')}</Label>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'name' | 'type' | 'ra' | 'relevance')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">{t('search.sortByRelevance')}</SelectItem>
                  <SelectItem value="name">{t('search.sortByName')}</SelectItem>
                  <SelectItem value="type">{t('search.sortByType')}</SelectItem>
                  <SelectItem value="ra">{t('search.sortByRA')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Include Target List */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="includeTargetList"
                checked={includeTargetList}
                onCheckedChange={(checked) => setIncludeTargetList(!!checked)}
              />
              <Label htmlFor="includeTargetList" className="cursor-pointer">
                {t('search.includeTargetList')}
              </Label>
            </div>

            {/* Auto-search toggle */}
            <Separator className="my-2" />
            <div className="flex items-center justify-between py-2">
              <Label htmlFor="autoSearch" className="cursor-pointer text-sm">
                {t('search.autoSearch')}
              </Label>
              <Switch
                id="autoSearch"
                checked={autoSearch}
                onCheckedChange={setAutoSearch}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button onClick={() => { executeSearch(); setActiveTab('results'); }} className="flex-1">
                <Search className="h-4 w-4 mr-2" />
                {t('common.search')}
              </Button>
              <Button variant="outline" onClick={resetFilters}>
                <RotateCcw className="h-4 w-4 mr-2" />
                {t('common.reset')}
              </Button>
            </div>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="flex-1 flex flex-col min-h-0">
            {/* Search Statistics */}
            {searchStats && hasResults && !isSearching && (
              <div className="flex items-center gap-3 py-2 px-1 text-xs text-muted-foreground border-b">
                <span className="font-medium">{t('search.foundResults', { count: searchStats.totalResults })}</span>
                <span className="text-muted-foreground/50">|</span>
                {Object.entries(searchStats.resultsByType).map(([type, count]) => (
                  <span key={type} className="flex items-center gap-1">
                    {getTypeIcon(type)}
                    <span>{count}</span>
                  </span>
                ))}
                <span className="ml-auto text-[10px]">{searchStats.searchTimeMs}ms</span>
              </div>
            )}

            {/* Loading indicator */}
            {isSearching && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">{t('common.loading')}</span>
              </div>
            )}

            {/* Multi-select toolbar */}
            {hasResults && (
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
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
                    <span className="text-xs text-muted-foreground">
                      {t('search.selectedCount', { count: selectedCount })}
                    </span>
                  )}
                </div>
                {selectedCount > 0 && (
                  <Button
                    variant="default"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={handleBatchAdd}
                  >
                    <ListPlus className="h-3 w-3 mr-1" />
                    {t('search.addToList')}
                  </Button>
                )}
              </div>
            )}

            {/* Results List */}
            {hasResults && !isSearching && (
              <ScrollArea className="flex-1">
                <div className="space-y-2 py-2">
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
                        <span className="ml-1">{groupName}</span>
                        <Badge variant="secondary" className="ml-auto h-4 text-[10px]">
                          {items.length}
                        </Badge>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent className="space-y-0.5 pl-4">
                        {items.map((item) => {
                          const itemId = getResultId(item);
                          
                          return (
                            <SearchResultItemRow
                              key={itemId}
                              item={item}
                              itemId={itemId}
                              checked={isSelected(itemId)}
                              skyCultureLanguage={skyCultureLanguage}
                              onSelect={(item) => {
                                selectTarget(item);
                                handleCloseDialog();
                              }}
                              onToggleSelection={toggleSelection}
                              onAddToTargetList={handleAddToTargetList}
                            />
                          );
                        })}
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              </ScrollArea>
            )}

            {/* Empty State */}
            {!hasResults && !isSearching && (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                <CircleDot className="h-12 w-12 mb-4 opacity-30" />
                <p className="text-sm">{t('search.noResultsYet')}</p>
                <p className="text-xs mt-1">{t('search.configureFiltersAndSearch')}</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


