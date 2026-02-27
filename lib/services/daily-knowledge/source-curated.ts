import { DAILY_KNOWLEDGE_CURATED } from '@/lib/data/daily-knowledge-curated';
import { buildItem } from './normalizers';
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

export function getCuratedDailyItem(
  dateKey: string,
  locale: 'en' | 'zh'
): DailyKnowledgeItem {
  const dateEvents = getCuratedDateEventItems(dateKey, locale);
  if (dateEvents.length > 0) {
    return dateEvents[getStableIndex(`${dateKey}:${locale}:event`, dateEvents.length)];
  }

  const items = getCuratedItems(dateKey, locale).filter((item) => !item.isDateEvent);
  if (items.length === 0) {
    const all = getCuratedItems(dateKey, locale);
    return all[getStableIndex(`${dateKey}:${locale}:all`, all.length)];
  }
  return items[getStableIndex(`${dateKey}:${locale}:regular`, items.length)];
}
