'use client';

import { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import { useTranslations } from 'next-intl';
import { Search, MapPin, Loader2, X, Clock, Star, Navigation2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { geocodingService } from '@/lib/services/geocoding-service';
import type { GeocodingResult } from '@/lib/services/map-providers/base-map-provider';
import type { Coordinates, LocationResult } from './types';

interface LocationSearchProps {
  onLocationSelect: (location: LocationResult) => void;
  placeholder?: string;
  className?: string;
  showRecentSearches?: boolean;
  showCurrentLocation?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  initialValue?: string;
}

interface SearchHistory {
  query: string;
  result: GeocodingResult;
  timestamp: number;
}

const STORAGE_KEY = 'skymap-location-search-history';
const MAX_HISTORY_ITEMS = 10;
const HISTORY_EXPIRY_DAYS = 30;

function LocationSearchComponent({
  onLocationSelect,
  placeholder,
  className,
  showRecentSearches = true,
  showCurrentLocation = true,
  disabled = false,
  autoFocus = false,
  initialValue = '',
}: LocationSearchProps) {
  const t = useTranslations();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [query, setQuery] = useState(initialValue);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const abortControllerRef = useRef<AbortController | null>(null);
  const latestQueryRef = useRef<string>('');

  // Load search history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const history = JSON.parse(stored);
        const expiryTime = Date.now() - HISTORY_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
        const filteredHistory = history.filter((item: SearchHistory) => 
          item.timestamp > expiryTime
        );
        setSearchHistory(filteredHistory.slice(0, MAX_HISTORY_ITEMS));
      }
    } catch (error) {
      console.warn('Failed to load search history:', error);
    }
  }, []);

  const saveSearchHistory = useCallback((newHistory: SearchHistory[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
    } catch (error) {
      console.warn('Failed to save search history:', error);
    }
  }, []);

  const addToHistory = useCallback((searchQuery: string, result: GeocodingResult) => {
    const newItem: SearchHistory = {
      query: searchQuery,
      result,
      timestamp: Date.now(),
    };

    setSearchHistory(prev => {
      const filtered = prev.filter(item => 
        item.query !== searchQuery || 
        Math.abs(item.result.coordinates.latitude - result.coordinates.latitude) > 0.001 ||
        Math.abs(item.result.coordinates.longitude - result.coordinates.longitude) > 0.001
      );
      const newHistory = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      saveSearchHistory(newHistory);
      return newHistory;
    });
  }, [saveSearchHistory]);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller
    const controller = new AbortController();
    abortControllerRef.current = controller;
    latestQueryRef.current = searchQuery;

    setIsSearching(true);
    try {
      const searchResults = await geocodingService.geocode(searchQuery, {
        limit: 8,
        language: 'en',
        fallback: true,
      });
      
      // Only update if this is still the latest query
      if (latestQueryRef.current === searchQuery && !controller.signal.aborted) {
        setResults(searchResults);
        setSelectedIndex(-1);
      }
    } catch (error) {
      // Ignore abort errors
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      console.error('Search failed:', error);
      if (latestQueryRef.current === searchQuery) {
        setResults([]);
      }
    } finally {
      if (latestQueryRef.current === searchQuery) {
        setIsSearching(false);
      }
    }
  }, []);

  const handleInputChange = useCallback((value: string) => {
    setQuery(value);
    setIsOpen(true);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(value);
      }, 300);
    } else {
      setResults([]);
    }
  }, [performSearch]);

  const handleLocationSelect = useCallback((result: GeocodingResult, fromHistory = false) => {
    const location: LocationResult = {
      coordinates: result.coordinates,
      address: result.address,
      displayName: result.displayName,
    };

    onLocationSelect(location);
    
    if (!fromHistory) {
      addToHistory(query, result);
    }
    
    setQuery(result.displayName);
    setIsOpen(false);
    setResults([]);
  }, [onLocationSelect, query, addToHistory]);

  const handleCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      console.error('Geolocation not supported');
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const coords: Coordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };

          try {
            const reverseResult = await geocodingService.reverseGeocode(coords);
            onLocationSelect({
              coordinates: coords,
              address: reverseResult.address,
              displayName: reverseResult.displayName,
            });
            setQuery(reverseResult.displayName);
          } catch {
            const coordsString = `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
            onLocationSelect({
              coordinates: coords,
              address: coordsString,
              displayName: coordsString,
            });
            setQuery(coordsString);
          }
          
          setIsOpen(false);
        } catch (error) {
          console.error('Failed to process current location:', error);
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation failed:', error);
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [onLocationSelect]);

  // Memoize total items for keyboard navigation - must be defined before handleKeyDown
  const totalItems = useMemo(() => 
    results.length + (showRecentSearches ? searchHistory.length : 0) + (showCurrentLocation ? 1 : 0),
    [results.length, showRecentSearches, searchHistory.length, showCurrentLocation]
  );

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % totalItems);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev <= 0 ? totalItems - 1 : prev - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          if (selectedIndex < results.length) {
            handleLocationSelect(results[selectedIndex]);
          } else if (showCurrentLocation && selectedIndex === results.length) {
            handleCurrentLocation();
          } else if (showRecentSearches) {
            const historyIndex = selectedIndex - results.length - (showCurrentLocation ? 1 : 0);
            if (historyIndex >= 0 && historyIndex < searchHistory.length) {
              handleLocationSelect(searchHistory[historyIndex].result, true);
            }
          }
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  }, [isOpen, results, showRecentSearches, showCurrentLocation, searchHistory, selectedIndex, handleLocationSelect, handleCurrentLocation, totalItems]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Memoize dropdown visibility check
  const shouldShowDropdown = useMemo(() => 
    isOpen && (results.length > 0 || (showRecentSearches && searchHistory.length > 0) || !query.trim()),
    [isOpen, results.length, showRecentSearches, searchHistory.length, query]
  );

  return (
    <div ref={rootRef} className={cn('relative w-full', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder || t('map.searchPlaceholder') || 'Search for a location...'}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          className="pl-9 pr-10"
          disabled={disabled}
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
            onClick={() => {
              setQuery('');
              setResults([]);
              setIsOpen(false);
              inputRef.current?.focus();
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {shouldShowDropdown && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 shadow-lg border">
          <CardContent className="p-0">
            <ScrollArea className="max-h-80">
              <div className="py-1">
                {showCurrentLocation && !query.trim() && (
                  <>
                    <div
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors',
                        selectedIndex === results.length ? 'bg-muted' : 'hover:bg-muted/50'
                      )}
                      onClick={handleCurrentLocation}
                    >
                      {isGettingLocation ? (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      ) : (
                        <Navigation2 className="h-4 w-4 text-primary" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">
                          {t('map.currentLocation') || 'Current Location'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {t('map.useGpsLocation') || 'Use GPS to detect your location'}
                        </div>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {results.map((result, index) => (
                  <div
                    key={`result-${index}`}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors',
                      selectedIndex === index ? 'bg-muted' : 'hover:bg-muted/50'
                    )}
                    onClick={() => handleLocationSelect(result)}
                  >
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {result.displayName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {result.coordinates.latitude.toFixed(6)}, {result.coordinates.longitude.toFixed(6)}
                      </div>
                    </div>
                    {result.type && (
                      <Badge variant="outline" className="text-xs shrink-0">
                        {result.type}
                      </Badge>
                    )}
                  </div>
                ))}

                {isSearching && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">
                      {t('map.searching') || 'Searching...'}
                    </span>
                  </div>
                )}

                {!isSearching && query.trim() && results.length === 0 && (
                  <div className="flex items-center justify-center py-4">
                    <span className="text-sm text-muted-foreground">
                      {t('map.noResults') || 'No locations found'}
                    </span>
                  </div>
                )}

                {showRecentSearches && searchHistory.length > 0 && !query.trim() && (
                  <>
                    {(results.length > 0 || showCurrentLocation) && <Separator />}
                    <div className="px-3 py-2">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {t('map.recentSearches') || 'Recent Searches'}
                      </div>
                    </div>
                    {searchHistory.map((item, index) => {
                      const itemIndex = results.length + (showCurrentLocation ? 1 : 0) + index;
                      return (
                        <div
                          key={`history-${index}`}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors',
                            selectedIndex === itemIndex ? 'bg-muted' : 'hover:bg-muted/50'
                          )}
                          onClick={() => handleLocationSelect(item.result, true)}
                        >
                          <Star className="h-4 w-4 text-muted-foreground/70 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              {item.result.displayName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(item.timestamp).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export const LocationSearch = memo(LocationSearchComponent);
