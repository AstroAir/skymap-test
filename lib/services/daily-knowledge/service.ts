import { createLogger } from '@/lib/logger';
import { DAILY_KNOWLEDGE_AGGREGATED_TTL_FALLBACK_MS } from './constants';
import { dedupeItems } from './normalizers';
import { fetchApodItem } from './source-apod';
import { getCuratedDailyItem, getCuratedItems } from './source-curated';
import { fetchWikimediaItem } from './source-wikimedia';
import type {
  DailyKnowledgeFactSource,
  DailyKnowledgeItem,
  DailyKnowledgeLanguageStatus,
  DailyKnowledgeOptions,
  DailyKnowledgeServiceResult,
} from './types';

const logger = createLogger('daily-knowledge-service');
const aggregatedResultCache = new Map<
  string,
  { expiresAt: number; result: DailyKnowledgeServiceResult }
>();

function getNasaApiKey(): string {
  return process.env.NEXT_PUBLIC_NASA_API_KEY?.trim() || 'DEMO_KEY';
}

function isOnline(): boolean {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
}

function getNextLocalMidnight(now = new Date()): number {
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const value = midnight.getTime();
  if (Number.isFinite(value) && value > Date.now()) {
    return value;
  }
  return Date.now() + DAILY_KNOWLEDGE_AGGREGATED_TTL_FALLBACK_MS;
}

function getCacheKey(
  dateKey: string,
  locale: 'en' | 'zh',
  onlineEnhancement: boolean,
  onlineAvailable: boolean
): string {
  return `${dateKey}:${locale}:${onlineEnhancement ? 'enhance' : 'local'}:${
    onlineAvailable ? 'online' : 'offline'
  }`;
}

function enrichItemWithWikimedia(
  baseItem: DailyKnowledgeItem,
  wikimediaItem: DailyKnowledgeItem | null
): DailyKnowledgeItem {
  if (!wikimediaItem) return baseItem;
  return {
    ...baseItem,
    summary: baseItem.summary || wikimediaItem.summary,
    image: baseItem.image ?? wikimediaItem.image,
    externalUrl: baseItem.externalUrl ?? wikimediaItem.externalUrl,
    relatedObjects:
      baseItem.relatedObjects.length > 0 ? baseItem.relatedObjects : wikimediaItem.relatedObjects,
    tags: Array.from(new Set([...baseItem.tags, ...wikimediaItem.tags])),
    factSources: mergeFactSources(baseItem.factSources, wikimediaItem.factSources),
    attribution: {
      ...baseItem.attribution,
      licenseName: baseItem.attribution.licenseName ?? wikimediaItem.attribution.licenseName,
      licenseUrl: baseItem.attribution.licenseUrl ?? wikimediaItem.attribution.licenseUrl,
      sourceUrl: baseItem.attribution.sourceUrl ?? wikimediaItem.attribution.sourceUrl,
    },
  };
}

function mergeFactSources(
  primary: DailyKnowledgeFactSource[],
  secondary: DailyKnowledgeFactSource[]
): DailyKnowledgeFactSource[] {
  const byUrl = new Map<string, DailyKnowledgeFactSource>();
  for (const source of [...primary, ...secondary]) {
    byUrl.set(source.url, source);
  }
  return Array.from(byUrl.values());
}

function resolveLanguageStatus(
  item: DailyKnowledgeItem,
  locale: 'en' | 'zh'
): DailyKnowledgeLanguageStatus {
  return item.contentLanguage.toLowerCase().startsWith(locale) ? 'native' : 'fallback';
}

function applyLanguageStatus(
  items: DailyKnowledgeItem[],
  locale: 'en' | 'zh'
): DailyKnowledgeItem[] {
  return items.map((item) => ({
    ...item,
    languageStatus: resolveLanguageStatus(item, locale),
  }));
}

export function __clearDailyKnowledgeServiceCacheForTests(): void {
  aggregatedResultCache.clear();
}

export async function getDailyKnowledge(
  dateKey: string,
  locale: 'en' | 'zh',
  options?: Partial<DailyKnowledgeOptions>
): Promise<DailyKnowledgeServiceResult> {
  const onlineEnhancement = options?.onlineEnhancement ?? true;
  const signal = options?.signal;
  const onlineAvailable = isOnline();
  const cacheKey = getCacheKey(dateKey, locale, onlineEnhancement, onlineAvailable);
  const cachedResult = aggregatedResultCache.get(cacheKey);
  if (cachedResult && cachedResult.expiresAt > Date.now()) {
    return cachedResult.result;
  }

  const curatedDaily = getCuratedDailyItem(dateKey, locale);
  const curatedItems = getCuratedItems(dateKey, locale);
  const offlineItems = [curatedDaily, ...curatedItems];

  if (!onlineEnhancement || !onlineAvailable) {
    const deduped = applyLanguageStatus(dedupeItems(offlineItems), locale);
    const result = { items: deduped, selected: deduped[0] };
    aggregatedResultCache.set(cacheKey, { result, expiresAt: getNextLocalMidnight() });
    return result;
  }

  const apiKey = getNasaApiKey();
  let apodItem = null;
  let wikimediaItem = null;
  try {
    apodItem = await fetchApodItem(dateKey, apiKey, { signal });
  } catch (error) {
    logger.warn('APOD fetch failed, fallback to curated', error);
  }

  try {
    const wikiQuery = apodItem?.title || curatedDaily.relatedObjects[0]?.name || curatedDaily.title;
    wikimediaItem = await fetchWikimediaItem(dateKey, wikiQuery, { locale, signal });
  } catch (error) {
    logger.warn('Wikimedia fetch failed, fallback to curated', error);
  }

  const localizedWiki = wikimediaItem?.contentLanguage === locale ? wikimediaItem : null;
  const selectedBase =
    locale === 'zh'
      ? enrichItemWithWikimedia(curatedDaily, localizedWiki)
      : enrichItemWithWikimedia(apodItem ?? curatedDaily, wikimediaItem);

  const mergedCandidates: DailyKnowledgeItem[] = [
    selectedBase,
    ...(localizedWiki ? [localizedWiki] : []),
    ...(apodItem ? [apodItem] : []),
    ...(wikimediaItem ? [wikimediaItem] : []),
    ...offlineItems,
  ];

  const merged = applyLanguageStatus(dedupeItems(mergedCandidates), locale);
  const selected = merged.find((item) => item.id === selectedBase.id) ?? {
    ...selectedBase,
    languageStatus: resolveLanguageStatus(selectedBase, locale),
  };
  const result = {
    items: merged,
    selected,
  };
  aggregatedResultCache.set(cacheKey, { result, expiresAt: getNextLocalMidnight() });
  return result;
}
