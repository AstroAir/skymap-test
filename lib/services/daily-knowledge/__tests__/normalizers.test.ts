import { buildItem, dedupeItems } from '../normalizers';
import type { DailyKnowledgeItem } from '../types';

function makeMinimalParams(overrides: Partial<Parameters<typeof buildItem>[0]> = {}) {
  return {
    id: 'test-1',
    dateKey: '2026-02-20',
    source: 'curated' as const,
    title: 'Test Title',
    summary: 'Test summary',
    body: 'Test body',
    contentLanguage: 'en',
    categories: ['object' as const],
    attribution: { sourceName: 'Test Source' },
    ...overrides,
  };
}

describe('daily-knowledge/normalizers', () => {
  describe('buildItem', () => {
    it('returns a complete DailyKnowledgeItem with all required fields', () => {
      const item = buildItem(makeMinimalParams());
      expect(item.id).toBe('test-1');
      expect(item.dateKey).toBe('2026-02-20');
      expect(item.source).toBe('curated');
      expect(item.title).toBe('Test Title');
      expect(item.summary).toBe('Test summary');
      expect(item.body).toBe('Test body');
      expect(item.contentLanguage).toBe('en');
      expect(item.attribution.sourceName).toBe('Test Source');
    });

    it('defaults tags to empty array when not provided', () => {
      const item = buildItem(makeMinimalParams());
      expect(item.tags).toEqual([]);
    });

    it('defaults relatedObjects to empty array', () => {
      const item = buildItem(makeMinimalParams());
      expect(item.relatedObjects).toEqual([]);
    });

    it('defaults isDateEvent to false', () => {
      const item = buildItem(makeMinimalParams());
      expect(item.isDateEvent).toBe(false);
    });

    it('defaults factSources to empty array', () => {
      const item = buildItem(makeMinimalParams());
      expect(item.factSources).toEqual([]);
    });

    it('defaults languageStatus to native', () => {
      const item = buildItem(makeMinimalParams());
      expect(item.languageStatus).toBe('native');
    });

    it('sets fetchedAt to Date.now() when not provided', () => {
      const before = Date.now();
      const item = buildItem(makeMinimalParams());
      const after = Date.now();
      expect(item.fetchedAt).toBeGreaterThanOrEqual(before);
      expect(item.fetchedAt).toBeLessThanOrEqual(after);
    });

    it('normalizes empty categories to [culture]', () => {
      const item = buildItem(makeMinimalParams({ categories: [] }));
      expect(item.categories).toEqual(['culture']);
    });

    it('preserves non-empty categories as-is', () => {
      const item = buildItem(makeMinimalParams({ categories: ['object', 'event'] }));
      expect(item.categories).toEqual(['object', 'event']);
    });

    it('passes through optional fields when provided', () => {
      const item = buildItem(
        makeMinimalParams({
          tags: ['tag1', 'tag2'],
          image: { url: 'https://example.com/img.jpg', type: 'image' },
          externalUrl: 'https://example.com',
          relatedObjects: [{ name: 'M31', ra: 10.68, dec: 41.26 }],
          isDateEvent: true,
          eventMonthDay: '02-14',
          factSources: [{ title: 'Source', url: 'https://example.com', publisher: 'Pub' }],
          languageStatus: 'fallback',
          fetchedAt: 1000,
        })
      );
      expect(item.tags).toEqual(['tag1', 'tag2']);
      expect(item.image?.url).toBe('https://example.com/img.jpg');
      expect(item.externalUrl).toBe('https://example.com');
      expect(item.relatedObjects).toHaveLength(1);
      expect(item.isDateEvent).toBe(true);
      expect(item.eventMonthDay).toBe('02-14');
      expect(item.factSources).toHaveLength(1);
      expect(item.languageStatus).toBe('fallback');
      expect(item.fetchedAt).toBe(1000);
    });
  });

  describe('dedupeItems', () => {
    function makeItem(id: string): DailyKnowledgeItem {
      return buildItem(makeMinimalParams({ id }));
    }

    it('returns empty array for empty input', () => {
      expect(dedupeItems([])).toEqual([]);
    });

    it('returns single item unchanged', () => {
      const items = [makeItem('a')];
      expect(dedupeItems(items)).toHaveLength(1);
      expect(dedupeItems(items)[0].id).toBe('a');
    });

    it('removes duplicate items by id', () => {
      const items = [makeItem('a'), makeItem('b'), makeItem('a')];
      const result = dedupeItems(items);
      expect(result).toHaveLength(2);
      expect(result.map((i) => i.id)).toEqual(['a', 'b']);
    });

    it('preserves first occurrence order', () => {
      const items = [makeItem('c'), makeItem('a'), makeItem('b'), makeItem('a'), makeItem('c')];
      const result = dedupeItems(items);
      expect(result.map((i) => i.id)).toEqual(['c', 'a', 'b']);
    });

    it('handles all unique items', () => {
      const items = [makeItem('x'), makeItem('y'), makeItem('z')];
      const result = dedupeItems(items);
      expect(result).toHaveLength(3);
    });
  });
});
