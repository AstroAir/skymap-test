import {
  getCuratedDailyItem,
  getCuratedDateEventItems,
  getCuratedItems,
  getMonthDay,
} from '../source-curated';

describe('daily-knowledge/source-curated', () => {
  it('extracts month-day from date key', () => {
    expect(getMonthDay('2026-02-14')).toBe('02-14');
    expect(getMonthDay('invalid')).toBe('');
  });

  it('returns date-event items for matching dates', () => {
    const events = getCuratedDateEventItems('2026-02-14', 'en');
    expect(events.length).toBeGreaterThan(0);
    expect(events.every((item) => item.isDateEvent)).toBe(true);
  });

  it('selects a date-event item when month-day matches', () => {
    const item = getCuratedDailyItem('2026-02-14', 'en');
    expect(item.isDateEvent).toBe(true);
    expect(item.eventMonthDay).toBe('02-14');
  });

  it('falls back to regular curated items when no date-event exists', () => {
    const item = getCuratedDailyItem('2026-06-02', 'en');
    expect(item.isDateEvent).toBe(false);
  });

  it('keeps deterministic daily selection for same date and locale', () => {
    const first = getCuratedDailyItem('2026-06-02', 'zh');
    const second = getCuratedDailyItem('2026-06-02', 'zh');
    expect(first.id).toBe(second.id);
  });

  it('produces full curated item list with required metadata', () => {
    const items = getCuratedItems('2026-02-14', 'zh');
    expect(items.length).toBeGreaterThanOrEqual(30);
    for (const item of items) {
      expect(item.factSources.length).toBeGreaterThan(0);
      expect(item.languageStatus).toBe('native');
    }
  });
});
