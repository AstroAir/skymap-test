import { DAILY_KNOWLEDGE_CURATED } from '../daily-knowledge-curated';

describe('daily-knowledge curated dataset', () => {
  it('contains around 30 entries', () => {
    expect(DAILY_KNOWLEDGE_CURATED.length).toBeGreaterThanOrEqual(30);
  });

  it('has complete bilingual content', () => {
    for (const entry of DAILY_KNOWLEDGE_CURATED) {
      expect(entry.localeContent.en.title.trim().length).toBeGreaterThan(0);
      expect(entry.localeContent.en.summary.trim().length).toBeGreaterThan(0);
      expect(entry.localeContent.en.body.trim().length).toBeGreaterThan(0);
      expect(entry.localeContent.zh.title.trim().length).toBeGreaterThan(0);
      expect(entry.localeContent.zh.summary.trim().length).toBeGreaterThan(0);
      expect(entry.localeContent.zh.body.trim().length).toBeGreaterThan(0);
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
    for (const entry of DAILY_KNOWLEDGE_CURATED) {
      if (!entry.eventMonthDay) continue;
      expect(entry.eventMonthDay).toMatch(/^\d{2}-\d{2}$/);
    }
  });

  it('requires explicit attribution data for entries with images', () => {
    for (const entry of DAILY_KNOWLEDGE_CURATED) {
      if (!entry.imageUrl) continue;
      expect(entry.attribution.sourceUrl).toBeTruthy();
      expect(entry.attribution.licenseName).toBeTruthy();
    }
  });
});
