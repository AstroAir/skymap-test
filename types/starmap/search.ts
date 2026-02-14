/**
 * Type definitions for starmap search components
 * Extracted from components/starmap/search/ for architectural separation
 */

import type { SearchResultItem, SkyCultureLanguage } from '@/lib/core/types';
import type { SearchSourceConfig, SearchSettings, SearchMode } from '@/lib/stores/search-store';
import type { OnlineSearchSource, ONLINE_SEARCH_SOURCES } from '@/lib/services/online-search-service';
import type { FavoriteObject } from '@/lib/stores';
import type { useTranslations } from 'next-intl';
import type { UseObjectSearchReturn } from '@/lib/hooks/use-object-search';

// ============================================================================
// StellariumSearch
// ============================================================================

export interface StellariumSearchRef {
  focusSearchInput: () => void;
  closeSearch: () => void;
}

export interface StellariumSearchProps {
  onSelect?: (item?: SearchResultItem) => void;
  enableMultiSelect?: boolean;
  onBatchAdd?: (items: SearchResultItem[]) => void;
  onFocusChange?: (focused: boolean) => void;
}

// ============================================================================
// AdvancedSearchDialog
// ============================================================================

export interface AdvancedSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect?: (item?: SearchResultItem) => void;
  searchHook?: UseObjectSearchReturn;
}


// ============================================================================
// SearchResultItem
// ============================================================================

export interface SearchResultItemProps {
  item: SearchResultItem;
  itemId: string;
  checked: boolean;
  isHighlighted?: boolean;
  showCheckbox?: boolean;
  skyCultureLanguage: SkyCultureLanguage | string;
  searchQuery?: string;
  onSelect: (item: SearchResultItem) => void;
  onToggleSelection?: (id: string) => void;
  onMouseEnter?: (index: number) => void;
  onAddToTargetList: (item: SearchResultItem) => void;
  globalIndex?: number;
}

// ============================================================================
// OnlineSearchSettings
// ============================================================================

export interface OnlineSearchSettingsProps {
  compact?: boolean;
}

export interface OnlineSearchSettingsContentProps {
  t: ReturnType<typeof useTranslations>;
  settings: SearchSettings;
  currentSearchMode: SearchMode;
  sourceConfigs: Array<{
    config: SearchSourceConfig;
    info: typeof ONLINE_SEARCH_SOURCES[keyof typeof ONLINE_SEARCH_SOURCES];
    isOnline: boolean;
  }>;
  updateSettings: (settings: Partial<SearchSettings>) => void;
  setSearchMode: (mode: SearchMode) => void;
  toggleOnlineSource: (sourceId: OnlineSearchSource, enabled: boolean) => void;
  clearCache: () => void;
}

// ============================================================================
// FavoritesQuickAccess
// ============================================================================

export interface FavoritesQuickAccessProps {
  onSelect?: (object: FavoriteObject) => void;
  onNavigate?: (ra: number, dec: number) => void;
  className?: string;
}
