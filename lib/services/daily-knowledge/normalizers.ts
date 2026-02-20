import type {
  DailyKnowledgeAttribution,
  DailyKnowledgeCategory,
  DailyKnowledgeItem,
  DailyKnowledgeRelatedObject,
} from './types';

function normalizeCategories(categories: DailyKnowledgeCategory[]): DailyKnowledgeCategory[] {
  return categories.length > 0 ? categories : ['culture'];
}

export function buildItem(params: {
  id: string;
  dateKey: string;
  source: DailyKnowledgeItem['source'];
  title: string;
  summary: string;
  body: string;
  contentLanguage: string;
  categories: DailyKnowledgeCategory[];
  tags?: string[];
  image?: DailyKnowledgeItem['image'];
  externalUrl?: string;
  relatedObjects?: DailyKnowledgeRelatedObject[];
  attribution: DailyKnowledgeAttribution;
  fetchedAt?: number;
}): DailyKnowledgeItem {
  return {
    id: params.id,
    dateKey: params.dateKey,
    source: params.source,
    title: params.title,
    summary: params.summary,
    body: params.body,
    contentLanguage: params.contentLanguage,
    categories: normalizeCategories(params.categories),
    tags: params.tags ?? [],
    image: params.image,
    externalUrl: params.externalUrl,
    relatedObjects: params.relatedObjects ?? [],
    attribution: params.attribution,
    fetchedAt: params.fetchedAt ?? Date.now(),
  };
}

export function dedupeItems(items: DailyKnowledgeItem[]): DailyKnowledgeItem[] {
  const seen = new Set<string>();
  const result: DailyKnowledgeItem[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    result.push(item);
  }
  return result;
}
