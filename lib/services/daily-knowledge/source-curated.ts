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

export function getCuratedItems(dateKey: string, locale: 'en' | 'zh'): DailyKnowledgeItem[] {
  return DAILY_KNOWLEDGE_CURATED.map((entry, index) => {
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
      fetchedAt: Date.now() + index,
    });
  });
}

export function getCuratedDailyItem(
  dateKey: string,
  locale: 'en' | 'zh'
): DailyKnowledgeItem {
  const items = getCuratedItems(dateKey, locale);
  const idx = hashDate(dateKey) % items.length;
  return items[idx];
}
