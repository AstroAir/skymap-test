import type {
  DailyKnowledgeAttribution,
  DailyKnowledgeCategory,
  DailyKnowledgeDifficulty,
  DailyKnowledgeFactSource,
  DailyKnowledgeItem,
  DailyKnowledgeLanguageStatus,
  DailyKnowledgeRelatedObject,
} from './types';
import {
  DAILY_KNOWLEDGE_ALL_MONTHS,
  DAILY_KNOWLEDGE_DIFFICULTY_LEVELS,
} from './constants';

function normalizeCategories(categories: DailyKnowledgeCategory[]): DailyKnowledgeCategory[] {
  return categories.length > 0 ? categories : ['culture'];
}

function normalizeDifficulty(difficulty?: DailyKnowledgeDifficulty): DailyKnowledgeDifficulty {
  if (!difficulty) return 'intermediate';
  if ((DAILY_KNOWLEDGE_DIFFICULTY_LEVELS as readonly string[]).includes(difficulty)) {
    return difficulty;
  }
  return 'intermediate';
}

function normalizeBestViewingMonths(bestViewingMonths?: number[]): number[] {
  const normalized = (bestViewingMonths ?? [])
    .map((value) => Math.trunc(value))
    .filter((value) => value >= 1 && value <= 12);
  if (normalized.length === 0) {
    return [...DAILY_KNOWLEDGE_ALL_MONTHS];
  }
  return Array.from(new Set(normalized)).sort((a, b) => a - b);
}

function normalizeObservationTips(observationTips?: string[]): string[] {
  return (observationTips ?? []).map((tip) => tip.trim()).filter(Boolean);
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
  isDateEvent?: boolean;
  eventMonthDay?: string;
  factSources?: DailyKnowledgeFactSource[];
  difficulty?: DailyKnowledgeDifficulty;
  bestViewingMonths?: number[];
  observationTips?: string[];
  languageStatus?: DailyKnowledgeLanguageStatus;
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
    isDateEvent: params.isDateEvent ?? false,
    eventMonthDay: params.eventMonthDay,
    factSources: params.factSources ?? [],
    difficulty: normalizeDifficulty(params.difficulty),
    bestViewingMonths: normalizeBestViewingMonths(params.bestViewingMonths),
    observationTips: normalizeObservationTips(params.observationTips),
    languageStatus: params.languageStatus ?? 'native',
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
