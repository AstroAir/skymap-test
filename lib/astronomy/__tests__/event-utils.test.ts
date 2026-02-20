import { convertTauriEvents, mapEventType } from '../event-utils';

describe('event-utils', () => {
  it('maps unknown event types to other', () => {
    expect(mapEventType('totally_unknown_event')).toBe('other');
  });

  it('converts tauri timestamp to date and keeps active window', () => {
    const converted = convertTauriEvents([
      {
        id: 'test-window',
        event_type: 'meteor_shower',
        name: 'Perseids',
        date: '2024-08-12',
        time: null,
        timestamp: 1723420800,
        description: 'Meteor shower',
        visibility: 'good',
        magnitude: null,
        details: {
          active_end: '2024-08-24',
        },
      },
    ]);

    expect(converted).toHaveLength(1);
    expect(converted[0].type).toBe('meteor_shower');
    expect(converted[0].date.toISOString()).toContain('2024-08-12');
    expect(converted[0].endDate?.toISOString()).toContain('2024-08-24');
  });

  it('falls back to date+time parsing when timestamp is missing', () => {
    const converted = convertTauriEvents([
      {
        id: 'test-time',
        event_type: 'full_moon',
        name: 'Full Moon',
        date: '2024-09-18',
        time: '02:44:00',
        description: 'Lunar phase',
      },
    ]);

    expect(converted[0].date.toISOString()).toContain('2024-09-18T02:44:00');
  });
});
