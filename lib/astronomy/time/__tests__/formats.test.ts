/**
 * @jest-environment node
 */
import {
  formatTime,
  formatTimeShort,
  formatTimeLong,
  formatDateForInput,
  formatTimeForInput,
  formatDateTime,
  formatDuration,
  formatDurationLong,
  getRelativeTime,
  wait,
} from '../formats';

describe('Time Formats', () => {
  // ============================================================================
  // formatTime
  // ============================================================================
  describe('formatTime', () => {
    it('formats midnight correctly', () => {
      const midnight = new Date(2024, 0, 1, 0, 0, 0);
      expect(formatTime(midnight.getTime())).toBe('00:00:00');
    });

    it('formats noon correctly', () => {
      const noon = new Date(2024, 0, 1, 12, 0, 0);
      expect(formatTime(noon.getTime())).toBe('12:00:00');
    });

    it('formats with minutes and seconds', () => {
      const time = new Date(2024, 0, 1, 15, 30, 45);
      expect(formatTime(time.getTime())).toBe('15:30:45');
    });

    it('pads single digit values', () => {
      const time = new Date(2024, 0, 1, 1, 5, 9);
      expect(formatTime(time.getTime())).toBe('01:05:09');
    });
  });

  // ============================================================================
  // formatTimeShort
  // ============================================================================
  describe('formatTimeShort', () => {
    it('returns --:-- for null', () => {
      expect(formatTimeShort(null)).toBe('--:--');
    });

    it('formats date correctly', () => {
      const date = new Date(2024, 0, 1, 14, 30, 0);
      const result = formatTimeShort(date);
      expect(result).toMatch(/^14:30/);
    });

    it('formats midnight', () => {
      const date = new Date(2024, 0, 1, 0, 0, 0);
      const result = formatTimeShort(date);
      expect(result).toMatch(/^00:00/);
    });
  });

  // ============================================================================
  // formatTimeLong
  // ============================================================================
  describe('formatTimeLong', () => {
    it('returns --:--:-- for null', () => {
      expect(formatTimeLong(null)).toBe('--:--:--');
    });

    it('formats date with seconds', () => {
      const date = new Date(2024, 0, 1, 14, 30, 45);
      const result = formatTimeLong(date);
      expect(result).toMatch(/^14:30:45/);
    });
  });

  // ============================================================================
  // formatDateForInput
  // ============================================================================
  describe('formatDateForInput', () => {
    it('formats date correctly', () => {
      const date = new Date(2024, 5, 15);
      expect(formatDateForInput(date)).toBe('2024-06-15');
    });

    it('pads month and day', () => {
      const date = new Date(2024, 0, 5);
      expect(formatDateForInput(date)).toBe('2024-01-05');
    });

    it('formats December correctly', () => {
      const date = new Date(2024, 11, 31);
      expect(formatDateForInput(date)).toBe('2024-12-31');
    });
  });

  // ============================================================================
  // formatTimeForInput
  // ============================================================================
  describe('formatTimeForInput', () => {
    it('formats time correctly', () => {
      const date = new Date(2024, 0, 1, 14, 30);
      expect(formatTimeForInput(date)).toBe('14:30');
    });

    it('pads hour and minute', () => {
      const date = new Date(2024, 0, 1, 5, 9);
      expect(formatTimeForInput(date)).toBe('05:09');
    });

    it('formats midnight', () => {
      const date = new Date(2024, 0, 1, 0, 0);
      expect(formatTimeForInput(date)).toBe('00:00');
    });
  });

  // ============================================================================
  // formatDateTime
  // ============================================================================
  describe('formatDateTime', () => {
    it('combines date and time', () => {
      const date = new Date(2024, 5, 15, 14, 30);
      expect(formatDateTime(date)).toBe('2024-06-15 14:30');
    });
  });

  // ============================================================================
  // formatDuration
  // ============================================================================
  describe('formatDuration', () => {
    it('formats 0 hours', () => {
      expect(formatDuration(0)).toBe('0m');
    });

    it('formats negative hours', () => {
      expect(formatDuration(-1)).toBe('0m');
    });

    it('formats hours only', () => {
      expect(formatDuration(2)).toBe('2h');
    });

    it('formats minutes only', () => {
      expect(formatDuration(0.5)).toBe('30m');
    });

    it('formats hours and minutes', () => {
      expect(formatDuration(2.5)).toBe('2h 30m');
    });

    it('rounds minutes', () => {
      expect(formatDuration(1.75)).toBe('1h 45m');
    });

    it('handles small fractions', () => {
      expect(formatDuration(0.25)).toBe('15m');
    });
  });

  // ============================================================================
  // formatDurationLong
  // ============================================================================
  describe('formatDurationLong', () => {
    it('formats 0 seconds', () => {
      expect(formatDurationLong(0)).toBe('0s');
    });

    it('formats negative seconds', () => {
      expect(formatDurationLong(-1)).toBe('0s');
    });

    it('formats seconds only', () => {
      expect(formatDurationLong(45)).toBe('45s');
    });

    it('formats minutes only', () => {
      expect(formatDurationLong(120)).toBe('2m');
    });

    it('formats minutes and seconds', () => {
      expect(formatDurationLong(125)).toBe('2m 5s');
    });

    it('formats hours only', () => {
      expect(formatDurationLong(3600)).toBe('1h');
    });

    it('formats hours and minutes', () => {
      expect(formatDurationLong(3720)).toBe('1h 2m');
    });

    it('formats hours, minutes, and seconds', () => {
      expect(formatDurationLong(3725)).toBe('1h 2m 5s');
    });

    it('formats multiple hours', () => {
      expect(formatDurationLong(7320)).toBe('2h 2m');
    });
  });

  // ============================================================================
  // getRelativeTime
  // ============================================================================
  describe('getRelativeTime', () => {
    const now = new Date('2024-06-15T12:00:00Z');

    it('returns "now" for current time', () => {
      expect(getRelativeTime(now, now)).toBe('now');
    });

    it('returns "just now" for recent past', () => {
      const past = new Date(now.getTime() - 30000); // 30 seconds ago
      expect(getRelativeTime(past, now)).toBe('just now');
    });

    it('returns minutes ago', () => {
      const past = new Date(now.getTime() - 5 * 60000); // 5 minutes ago
      expect(getRelativeTime(past, now)).toBe('5 minutes ago');
    });

    it('returns "1 minute ago" for singular', () => {
      const past = new Date(now.getTime() - 60000);
      expect(getRelativeTime(past, now)).toBe('1 minute ago');
    });

    it('returns hours ago', () => {
      const past = new Date(now.getTime() - 3 * 3600000); // 3 hours ago
      expect(getRelativeTime(past, now)).toBe('3 hours ago');
    });

    it('returns "1 hour ago" for singular', () => {
      const past = new Date(now.getTime() - 3600000);
      expect(getRelativeTime(past, now)).toBe('1 hour ago');
    });

    it('returns days ago', () => {
      const past = new Date(now.getTime() - 2 * 86400000); // 2 days ago
      expect(getRelativeTime(past, now)).toBe('2 days ago');
    });

    it('returns "1 day ago" for singular', () => {
      const past = new Date(now.getTime() - 86400000);
      expect(getRelativeTime(past, now)).toBe('1 day ago');
    });

    it('returns "in X minutes" for future', () => {
      const future = new Date(now.getTime() + 5 * 60000);
      expect(getRelativeTime(future, now)).toBe('in 5 minutes');
    });

    it('returns "in X hours" for future', () => {
      const future = new Date(now.getTime() + 3 * 3600000);
      expect(getRelativeTime(future, now)).toBe('in 3 hours');
    });

    it('returns "in X days" for future', () => {
      const future = new Date(now.getTime() + 2 * 86400000);
      expect(getRelativeTime(future, now)).toBe('in 2 days');
    });

    it('uses current time when now not provided', () => {
      const future = new Date(Date.now() + 3600000);
      const result = getRelativeTime(future);
      expect(result).toMatch(/^in/);
    });
  });

  // ============================================================================
  // wait
  // ============================================================================
  describe('wait', () => {
    it('returns a Promise', () => {
      const result = wait(0);
      expect(result).toBeInstanceOf(Promise);
    });

    it('resolves after specified time', async () => {
      const start = Date.now();
      await wait(50);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(40);
    });

    it('resolves to undefined', async () => {
      const result = await wait(0);
      expect(result).toBeUndefined();
    });
  });
});
