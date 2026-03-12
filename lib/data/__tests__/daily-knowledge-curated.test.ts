import { DAILY_KNOWLEDGE_CURATED } from '../daily-knowledge-curated';
import {
  DAILY_KNOWLEDGE_DIFFICULTY_LEVELS,
  DAILY_KNOWLEDGE_MIN_EVENT_MONTH_COVERAGE,
} from '@/lib/services/daily-knowledge/constants';

describe('daily-knowledge curated dataset', () => {
  it('contains around 30 entries', () => {
    expect(DAILY_KNOWLEDGE_CURATED.length).toBeGreaterThanOrEqual(30);
  });

  it('uses unique IDs', () => {
    const ids = DAILY_KNOWLEDGE_CURATED.map((entry) => entry.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('has complete bilingual content', () => {
    for (const entry of DAILY_KNOWLEDGE_CURATED) {
      expect(entry.localeContent.en.title.trim().length).toBeGreaterThan(0);
      expect(entry.localeContent.en.summary.trim().length).toBeGreaterThan(0);
      expect(entry.localeContent.en.body.trim().length).toBeGreaterThan(0);
      expect(entry.localeContent.zh.title.trim().length).toBeGreaterThan(0);
      expect(entry.localeContent.zh.summary.trim().length).toBeGreaterThan(0);
      expect(entry.localeContent.zh.body.trim().length).toBeGreaterThan(0);

      expect(DAILY_KNOWLEDGE_DIFFICULTY_LEVELS).toContain(entry.difficulty);
      expect(entry.bestViewingMonths.length).toBeGreaterThan(0);
      for (const month of entry.bestViewingMonths) {
        expect(month).toBeGreaterThanOrEqual(1);
        expect(month).toBeLessThanOrEqual(12);
      }

      expect(entry.observationTips.en.length).toBeGreaterThan(0);
      expect(entry.observationTips.zh.length).toBeGreaterThan(0);
      for (const tip of entry.observationTips.en) {
        expect(tip.trim().length).toBeGreaterThan(0);
      }
      for (const tip of entry.observationTips.zh) {
        expect(tip.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('has at least one https fact source for each entry', () => {
    for (const entry of DAILY_KNOWLEDGE_CURATED) {
      expect(entry.factSources.length).toBeGreaterThan(0);
      for (const source of entry.factSources) {
        expect(source.title.trim().length).toBeGreaterThan(0);
        expect(source.publisher.trim().length).toBeGreaterThan(0);
        expect(source.url.startsWith('https://')).toBe(true);
      }
    }
  });

  it('uses valid month-day format for date-event entries', () => {
    const coveredMonths = new Set<number>();
    for (const entry of DAILY_KNOWLEDGE_CURATED) {
      if (!entry.eventMonthDay) continue;
      expect(entry.eventMonthDay).toMatch(/^\d{2}-\d{2}$/);
      coveredMonths.add(Number(entry.eventMonthDay.slice(0, 2)));
    }
    expect(coveredMonths.size).toBeGreaterThanOrEqual(DAILY_KNOWLEDGE_MIN_EVENT_MONTH_COVERAGE);
  });

  it('requires explicit attribution data for entries with images', () => {
    for (const entry of DAILY_KNOWLEDGE_CURATED) {
      if (!entry.imageUrl) continue;
      expect(entry.attribution.sourceUrl).toBeTruthy();
      expect(entry.attribution.licenseName).toBeTruthy();
    }
  });
});
