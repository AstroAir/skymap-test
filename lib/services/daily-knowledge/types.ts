export type DailyKnowledgeSource = 'curated' | 'nasa-apod' | 'wikimedia';

export interface DailyKnowledgeFactSource {
  title: string;
  url: string;
  publisher: string;
  accessedAt?: string;
}

export type DailyKnowledgeLanguageStatus = 'native' | 'fallback';

export type DailyKnowledgeCategory =
  | 'object'
  | 'event'
  | 'history'
  | 'mission'
  | 'technique'
  | 'culture';

export interface DailyKnowledgeImage {
  url: string;
  thumbnailUrl?: string;
  type: 'image' | 'video';
}

export interface DailyKnowledgeAttribution {
  sourceName: string;
  sourceUrl?: string;
  copyright?: string;
  licenseName?: string;
  licenseUrl?: string;
}

export interface DailyKnowledgeRelatedObject {
  name: string;
  ra?: number;
  dec?: number;
}

export interface DailyKnowledgeItem {
  id: string;
  dateKey: string;
  source: DailyKnowledgeSource;
  title: string;
  summary: string;
  body: string;
  contentLanguage: string;
  categories: DailyKnowledgeCategory[];
  tags: string[];
  image?: DailyKnowledgeImage;
  externalUrl?: string;
  relatedObjects: DailyKnowledgeRelatedObject[];
  attribution: DailyKnowledgeAttribution;
  isDateEvent: boolean;
  eventMonthDay?: string;
  factSources: DailyKnowledgeFactSource[];
  languageStatus: DailyKnowledgeLanguageStatus;
  fetchedAt: number;
}

export interface DailyKnowledgeFavorite {
  itemId: string;
  createdAt: number;
}

export type DailyKnowledgeHistoryEntry = 'auto' | 'manual' | 'random' | 'search';

export interface DailyKnowledgeHistory {
  itemId: string;
  shownAt: number;
  entry: DailyKnowledgeHistoryEntry;
  dateKey: string;
}

export interface DailyKnowledgeStartupState {
  lastShownDate: string | null;
  snoozedDate: string | null;
  lastSeenItemId: string | null;
}

export interface DailyKnowledgeFilters {
  query: string;
  category: DailyKnowledgeCategory | 'all';
  source: DailyKnowledgeSource | 'all';
  favoritesOnly: boolean;
}

export interface DailyKnowledgeOptions {
  locale: 'en' | 'zh';
  onlineEnhancement: boolean;
  signal?: AbortSignal;
}

export interface DailyKnowledgeServiceResult {
  items: DailyKnowledgeItem[];
  selected: DailyKnowledgeItem;
}
