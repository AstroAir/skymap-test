import { createLogger } from '@/lib/logger';
import { DAILY_KNOWLEDGE_AGGREGATED_TTL_FALLBACK_MS } from './constants';
import { dedupeItems } from './normalizers';
import { fetchApodItem } from './source-apod';
import { getCuratedDailyItem, getCuratedItems } from './source-curated';
import { fetchWikimediaItem } from './source-wikimedia';
import type {
  DailyKnowledgeItem,
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
    attribution: {
      ...baseItem.attribution,
      licenseName: baseItem.attribution.licenseName ?? wikimediaItem.attribution.licenseName,
      licenseUrl: baseItem.attribution.licenseUrl ?? wikimediaItem.attribution.licenseUrl,
      sourceUrl: baseItem.attribution.sourceUrl ?? wikimediaItem.attribution.sourceUrl,
    },
  };
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
    const deduped = dedupeItems(offlineItems);
    const result = { items: deduped, selected: deduped[0] };
    aggregatedResultCache.set(cacheKey, { result, expiresAt: getNextLocalMidnight() });
    return result;
  }

  const apiKey = getNasaApiKey();
  let apodItem = null;
  let wikimediaItem = null;
  try {
    apodItem = await fetchApodItem(dateKey, apiKey);
  } catch (error) {
    logger.warn('APOD fetch failed, fallback to curated', error);
  }

  try {
    const wikiQuery = apodItem?.title || curatedDaily.relatedObjects[0]?.name || curatedDaily.title;
    wikimediaItem = await fetchWikimediaItem(dateKey, wikiQuery);
  } catch (error) {
    logger.warn('Wikimedia fetch failed, fallback to curated', error);
  }

  const selectedBase = apodItem ?? curatedDaily;
  const selected = enrichItemWithWikimedia(selectedBase, wikimediaItem);
  const mergedCandidates: DailyKnowledgeItem[] = wikimediaItem
    ? [selected, wikimediaItem, ...offlineItems]
    : [selected, ...offlineItems];
  const merged = dedupeItems(mergedCandidates);
  const result = {
    items: merged,
    selected,
  };
  aggregatedResultCache.set(cacheKey, { result, expiresAt: getNextLocalMidnight() });
  return result;
}
