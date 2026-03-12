import { DAILY_KNOWLEDGE_CURATED } from '@/lib/data/daily-knowledge-curated';
import { buildItem } from './normalizers';
import { DAILY_KNOWLEDGE_REPEAT_WINDOW_DAYS } from './constants';
import type { DailyKnowledgeItem } from './types';

function hashDate(dateKey: string): number {
  let hash = 0;
  for (let i = 0; i < dateKey.length; i += 1) {
    hash = (hash * 31 + dateKey.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function getStableIndex(seed: string, length: number): number {
  return hashDate(seed) % length;
}

function toCuratedItem(
  entry: (typeof DAILY_KNOWLEDGE_CURATED)[number],
  dateKey: string,
  locale: 'en' | 'zh',
  index: number
): DailyKnowledgeItem {
  const localized = entry.localeContent[locale] ?? entry.localeContent.en;
  const localizedTips = entry.observationTips[locale] ?? entry.observationTips.en;
  return buildItem({
    id: entry.id,
    dateKey,
    source: 'curated',
    title: localized.title,
    summary: localized.summary,
    body: localized.body,
    contentLanguage: locale,
    categories: entry.categories,
    tags: entry.tags,
    image: entry.imageUrl
      ? {
          url: entry.imageUrl,
          thumbnailUrl: entry.thumbnailUrl,
          type: entry.imageType ?? 'image',
        }
      : undefined,
    externalUrl: entry.externalUrl,
    relatedObjects: entry.relatedObjects,
    attribution: {
      sourceName: entry.attribution.sourceName,
      sourceUrl: entry.attribution.sourceUrl,
      licenseName: entry.attribution.licenseName,
      licenseUrl: entry.attribution.licenseUrl,
    },
    difficulty: entry.difficulty,
    bestViewingMonths: entry.bestViewingMonths,
    observationTips: localizedTips,
    isDateEvent: Boolean(entry.eventMonthDay),
    eventMonthDay: entry.eventMonthDay,
    factSources: entry.factSources,
    languageStatus: 'native',
    fetchedAt: Date.now() + index,
  });
}

export function getMonthDay(dateKey: string): string {
  const [year, month, day] = dateKey.split('-');
  if (!year || !month || !day) return '';
  return `${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

export function getCuratedItems(dateKey: string, locale: 'en' | 'zh'): DailyKnowledgeItem[] {
  return DAILY_KNOWLEDGE_CURATED.map((entry, index) => toCuratedItem(entry, dateKey, locale, index));
}

export function getCuratedDateEventItems(
  dateKey: string,
  locale: 'en' | 'zh'
): DailyKnowledgeItem[] {
  const monthDay = getMonthDay(dateKey);
  if (!monthDay) return [];

  return DAILY_KNOWLEDGE_CURATED.filter((entry) => entry.eventMonthDay === monthDay).map(
    (entry, index) => toCuratedItem(entry, dateKey, locale, index)
  );
}

interface CuratedDailySelectionOptions {
  recentItemIds?: string[];
  repeatWindowDays?: number;
}

function selectDeterministicCandidate(
  dateKey: string,
  locale: 'en' | 'zh',
  scope: string,
  candidates: DailyKnowledgeItem[],
  recentItemIds: string[]
): DailyKnowledgeItem {
  if (candidates.length === 0) {
    throw new Error('Cannot select curated candidate from an empty list');
  }

  const recentSet = new Set(recentItemIds);
  const withoutRecent = recentSet.size
    ? candidates.filter((item) => !recentSet.has(item.id))
    : candidates;
  const activePool = withoutRecent.length > 0 ? withoutRecent : candidates;
  const recentSignature = recentItemIds.join('|') || 'none';
  const index = getStableIndex(`${dateKey}:${locale}:${scope}:${recentSignature}`, activePool.length);
  return activePool[index];
}

export function getCuratedDailyItem(
  dateKey: string,
  locale: 'en' | 'zh',
  options: CuratedDailySelectionOptions = {}
): DailyKnowledgeItem {
  const repeatWindowDays = options.repeatWindowDays ?? DAILY_KNOWLEDGE_REPEAT_WINDOW_DAYS;
  const recentItemIds = (options.recentItemIds ?? []).slice(0, Math.max(0, repeatWindowDays) * 4);
  const dateEvents = getCuratedDateEventItems(dateKey, locale);
  if (dateEvents.length > 0) {
    return selectDeterministicCandidate(dateKey, locale, 'event', dateEvents, recentItemIds);
  }

  const items = getCuratedItems(dateKey, locale).filter((item) => !item.isDateEvent);
  if (items.length === 0) {
    const all = getCuratedItems(dateKey, locale);
    return selectDeterministicCandidate(dateKey, locale, 'all', all, recentItemIds);
  }
  return selectDeterministicCandidate(dateKey, locale, 'regular', items, recentItemIds);
}
